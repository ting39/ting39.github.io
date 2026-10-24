#!/usr/bin/env node
// Builds the blog from posts/*.md:
//   blog/index.html, blog/<slug>/index.html, blog/tags/<tag>/index.html,
//   posts.json (homepage + terminal), feed.xml (Atom), rss.xml (RSS 2.0), sitemap.xml
// Usage: node tools/blog/build.mjs [--drafts] [--check] [--root <dir>]
//   --drafts  also build posts marked `draft: true` (for previewing locally; don't commit that)
//   --check   build in memory and exit 1 if any output file would change
// Output is deterministic (no build timestamps), so re-running it on unchanged posts changes nothing.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync, statSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { render, slugify, esc } from "./markdown.mjs";
import { parseFrontMatter } from "./frontmatter.mjs";
import { SITE, indexPage, tagPage, postPage } from "./templates.mjs";

const CJK = /[㐀-鿿豈-﫿぀-ヿ가-힯]/g;
const TZ = "+08:00"; // post dates are Taiwan time

function readingStats(html) {
  const prose = html.replace(/<figure class="code">[\s\S]*?<\/figure>/g, " ").replace(/<[^>]+>/g, " ").replace(/&\w+;/g, " ");
  const cjk = (prose.match(CJK) || []).length;
  const words = prose.replace(CJK, " ").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return { words: words + cjk, minutes: Math.max(1, Math.round(words / 230 + cjk / 400)), cjkShare: cjk / Math.max(1, cjk + words) };
}

function firstParagraph(html) {
  const m = html.match(/<p>([\s\S]*?)<\/p>/);
  if (!m) return "";
  const t = m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
  if (t.length <= 180) return t;
  const cut = t.slice(0, 178);
  return (/\s/.test(cut) && !/[\u3400-\u9FFF]/.test(cut) ? cut.replace(/\s+\S*$/, "") : cut) + "…";
}

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
function checkDate(v, file, key) {
  const s = String(v ?? "").trim();
  const m = s.match(DATE);
  const d = m && new Date(`${s}T00:00:00Z`);
  if (!m || isNaN(d) || d.toISOString().slice(0, 10) !== s) throw new Error(`${file}: "${key}" must be a date like 2026-10-20 (got "${s}")`);
  return s;
}

export function loadPosts(root, { drafts = false } = {}) {
  const dir = join(root, "posts");
  if (!existsSync(dir)) return [];
  const posts = [];
  const TR = /^([a-z0-9][a-z0-9-]*)\.(zh-TW|ja)\.md$/;   // translations: <slug>.zh-TW.md, <slug>.ja.md
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".md") || name.startsWith("_") || name.startsWith(".") || /^readme\.md$/i.test(name)) continue;
    if (TR.test(name)) continue;
    const file = `posts/${name}`;
    const slug = name.slice(0, -3);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new Error(`${file}: file names become URLs, so use lowercase letters, digits and dashes (e.g. "${slugify(slug) || "my-post"}.md")`);
    const raw = readFileSync(join(dir, name), "utf8");
    let fm;
    try { fm = parseFrontMatter(raw); } catch (e) { throw new Error(`${file}: ${e.message}`); }
    const d = fm.data;
    if (d.draft === true && !drafts) continue;
    if (!d.title || typeof d.title !== "string") throw new Error(`${file}: front matter needs a "title"`);
    const date = checkDate(d.date, file, "date");
    const updated = d.updated ? checkDate(d.updated, file, "updated") : null;
    const tags = [...new Set((Array.isArray(d.tags) ? d.tags : d.tags ? [d.tags] : []).map((t) => String(t).trim()).filter(Boolean))];
    const r = render(fm.body);
    const stats = readingStats(r.html);
    posts.push({
      slug, file, title: d.title.trim(), date, updated: updated && updated !== date ? updated : null, tags,
      tagSlugs: tags.map((t) => slugify(t) || "tag"),
      summary: String(d.summary || firstParagraph(r.html) || d.title).trim(),
      lang: d.lang || (stats.cjkShare > 0.3 ? "zh-Hant" : "en"),
      draft: d.draft === true,
      html: r.html, headings: r.headings, readingTime: stats.minutes, words: stats.words, bytes: Buffer.byteLength(raw),
    });
  }
  // attach translations (title/summary/body in another language; date and tags come from the main post)
  for (const name of readdirSync(dir).sort()) {
    const m = name.match(TR);
    if (!m) continue;
    const post = posts.find((p) => p.slug === m[1]);
    if (!post) continue;   // translation of a draft or missing post
    const file = `posts/${name}`;
    let fm;
    try { fm = parseFrontMatter(readFileSync(join(dir, name), "utf8")); } catch (e) { throw new Error(`${file}: ${e.message}`); }
    if (!fm.data.title) throw new Error(`${file}: front matter needs a "title"`);
    const r = render(fm.body);
    const stats = readingStats(r.html);
    (post.tr ||= {})[m[2]] = {
      title: String(fm.data.title).trim(), summary: String(fm.data.summary || firstParagraph(r.html) || fm.data.title).trim(),
      html: r.html, headings: r.headings, readingTime: stats.minutes,
    };
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

const absolutize = (html, base) => html.replace(/(\s(?:href|src))="(?!https?:|mailto:|data:|#)([^"]*)"/g, (_, attr, u) => `${attr}="${new URL(u, base).href}"`);
const rfc822 = (date) => new Date(`${date}T00:00:00${TZ}`).toUTCString().replace("GMT", "+0000");
const iso = (date) => `${date}T00:00:00${TZ}`;

export function build(root, opts = {}) {
  const posts = loadPosts(root, opts);
  const files = new Map();
  // ?v= cache-buster for the shared CSS/JS, derived from their contents
  const v = createHash("sha1").update(["style.css", "assets/blog.css", "assets/blog.js"].map((f) => (existsSync(join(root, f)) ? readFileSync(join(root, f)) : "")).join("\0")).digest("hex").slice(0, 8);
  const ogImage = existsSync(join(root, "assets/og.png")) ? "assets/og.png" : null;

  const tagMap = new Map();
  for (const p of posts) p.tags.forEach((t, k) => {
    const s = p.tagSlugs[k];
    if (!tagMap.has(s)) tagMap.set(s, { name: t, slug: s, posts: [] });
    tagMap.get(s).posts.push(p);
  });
  const tags = [...tagMap.values()].map((t) => ({ ...t, count: t.posts.length })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  files.set("blog/index.html", indexPage({ posts, tags, v, ogImage }));
  posts.forEach((post, i) => files.set(`blog/${post.slug}/index.html`, postPage({ post, prev: posts[i + 1], next: posts[i - 1], v, ogImage })));
  for (const t of tags) files.set(`blog/tags/${t.slug}/index.html`, tagPage({ tag: t, posts: t.posts, tags, v, ogImage }));

  files.set("posts.json", JSON.stringify({
    posts: posts.map((p) => ({ slug: p.slug, title: p.title, date: p.date, updated: p.updated, tags: p.tags, summary: p.summary, readingTime: p.readingTime, words: p.words, bytes: p.bytes, lang: p.lang, url: `blog/${p.slug}/`,
      ...(p.tr ? { i18n: Object.fromEntries(Object.entries(p.tr).map(([l, t]) => [l, { title: t.title, summary: t.summary, readingTime: t.readingTime }])) } : {}) })),
  }, null, 2) + "\n");

  const latest = posts.reduce((m, p) => ((p.updated || p.date) > m ? p.updated || p.date : m), "2026-10-20");
  const feedUrl = `${SITE.url}/feed.xml`, blogUrl = `${SITE.url}/blog/`;
  files.set("feed.xml", `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(SITE.blogTitle)}</title>
  <subtitle>${esc(SITE.description)}</subtitle>
  <link href="${feedUrl}" rel="self"/>
  <link href="${blogUrl}"/>
  <id>${blogUrl}</id>
  <updated>${iso(latest)}</updated>
  <author><name>${esc(SITE.author)}</name><uri>${SITE.url}/</uri></author>
${posts.map((p) => {
  const url = `${SITE.url}/blog/${p.slug}/`;
  return `  <entry>
    <title>${esc(p.title)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <published>${iso(p.date)}</published>
    <updated>${iso(p.updated || p.date)}</updated>
${p.tags.map((t) => `    <category term="${esc(t)}"/>\n`).join("")}    <summary>${esc(p.summary)}</summary>
    <content type="html">${esc(absolutize(p.html, url))}</content>
  </entry>`;
}).join("\n")}
</feed>
`);
  files.set("rss.xml", `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.blogTitle)}</title>
    <link>${blogUrl}</link>
    <description>${esc(SITE.description)}</description>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${rfc822(latest)}</lastBuildDate>
${posts.map((p) => {
  const url = `${SITE.url}/blog/${p.slug}/`;
  return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(p.date)}</pubDate>
${p.tags.map((t) => `      <category>${esc(t)}</category>\n`).join("")}      <description>${esc(absolutize(p.html, url))}</description>
    </item>`;
}).join("\n")}
  </channel>
</rss>
`);
  const urls = [["", latest], ["blog/", latest], ...posts.map((p) => [`blog/${p.slug}/`, p.updated || p.date]), ...tags.map((t) => [`blog/tags/${encodeURIComponent(t.slug)}/`, null])];
  files.set("sitemap.xml", `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, d]) => `  <url><loc>${SITE.url}/${u}</loc>${d ? `<lastmod>${d}</lastmod>` : ""}</url>`).join("\n")}
</urlset>
`);
  return { posts, tags, files };
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) { const p = join(dir, n); if (statSync(p).isDirectory()) walk(p, out); else out.push(p); }
  return out;
}

export function write(root, files) {
  const changed = [];
  for (const [rel, content] of files) {
    const p = join(root, rel);
    if (existsSync(p) && readFileSync(p, "utf8") === content) continue;
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
    changed.push(rel);
  }
  // remove pages of posts/tags that no longer exist (blog/ only ever holds generated files)
  for (const p of walk(join(root, "blog"))) {
    const rel = relative(root, p).split(sep).join("/");
    if (!files.has(rel)) { rmSync(p); changed.push(`-${rel}`); }
  }
  const prune = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) { prune(p); if (!readdirSync(p).length) rmSync(p, { recursive: true }); } } };
  if (existsSync(join(root, "blog"))) prune(join(root, "blog"));
  return changed;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const rootArg = args.indexOf("--root");
  const root = rootArg >= 0 ? args[rootArg + 1] : join(dirname(fileURLToPath(import.meta.url)), "../..");
  try {
    const { posts, tags, files } = build(root, { drafts: args.includes("--drafts") });
    if (args.includes("--check")) {
      const stale = [...files].filter(([rel, c]) => !existsSync(join(root, rel)) || readFileSync(join(root, rel), "utf8") !== c).map(([rel]) => rel);
      if (stale.length) { console.error(`blog output is out of date:\n  ${stale.join("\n  ")}\nrun: node tools/blog/build.mjs`); process.exit(1); }
      console.log(`blog is up to date (${posts.length} posts)`);
    } else {
      const changed = write(root, files);
      console.log(`built ${posts.length} post${posts.length === 1 ? "" : "s"}, ${tags.length} tag${tags.length === 1 ? "" : "s"}${posts.some((p) => p.draft) ? " (including drafts!)" : ""}; ${changed.length ? `${changed.length} file(s) changed:\n  ${changed.join("\n  ")}` : "nothing changed"}`);
    }
  } catch (e) {
    console.error(`blog build failed: ${e.message}`);
    process.exit(1);
  }
}
