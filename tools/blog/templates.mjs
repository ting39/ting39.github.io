// HTML templates for the generated blog pages. Plain template strings; `up` is the relative
// path back to the site root ("../" for /blog/, "../../" for /blog/<post>/), so pages work
// both on GitHub Pages and from a local `python3 -m http.server`.

import { esc } from "./markdown.mjs";

export const SITE = {
  url: "https://ting39.github.io",
  title: "ting39",
  author: "ting39",
  blogTitle: "ting39 · blog",
  description: "Notes from ting39: things I build, break and learn along the way.",
  repo: "https://github.com/ting39/ting39.github.io",
};

const ICON = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✦</text></svg>";
export const tagHref = (up, slug) => `${up}blog/tags/${encodeURIComponent(slug)}/`;
const jsonLd = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

// Multilingual blocks: the page carries every language; assets/blog.js shows the reader's (fallback en).
const LANGS = ["en", "zh-TW", "ja"];
const langAttr = (l) => (l === "zh-TW" ? "zh-Hant-TW" : l);
const tval = (p, field, l) => (l === "en" ? p[field] : p.tr && p.tr[l] && p.tr[l][field]);
function ml(p, field, wrap = (x) => esc(x)) {
  return LANGS.filter((l) => tval(p, field, l) != null)
    .map((l) => `<span data-lang-block="${l}" lang="${langAttr(l)}"${l === "en" ? "" : " hidden"}>${wrap(tval(p, field, l))}</span>`).join("");
}
const tr = (key, en) => `<span data-i18n="${key}">${en}</span>`;

export function layout({ up, title, description, path, type = "website", lang = "en", body, head = "", v, ogImage, nav = "blog" }) {
  const url = SITE.url + "/" + path;
  return `<!doctype html>
<html lang="${esc(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(url)}">
  <meta property="og:site_name" content="${SITE.title}">
  <meta property="og:type" content="${type}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(url)}">
${ogImage ? `  <meta property="og:image" content="${esc(SITE.url + "/" + ogImage)}">\n  <meta name="twitter:card" content="summary_large_image">\n` : `  <meta name="twitter:card" content="summary">\n`}  <meta name="theme-color" content="#07070d">
  <link rel="icon" href="${ICON}">
  <link rel="alternate" type="application/atom+xml" title="${esc(SITE.blogTitle)}" href="${up}feed.xml">
  <script>try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${up}style.css?v=${v}">
  <link rel="stylesheet" href="${up}assets/blog.css?v=${v}">
${head}</head>
<body class="blog-page">
  <canvas id="sky" aria-hidden="true"></canvas>
  <a class="skip" href="#content" data-i18n="blog.skip">Skip to content</a>
  <header class="nav">
    <a class="logo" href="${up}">ting39<span class="blink">_</span></a>
    <nav aria-label="Site">
      <a href="${up}#about" data-i18n="nav.about">about</a>
      <a href="${up}#projects" data-i18n="nav.projects">projects</a>
      <a href="${up}blog/"${nav === "blog" ? ' class="active" aria-current="page"' : ""} data-i18n="nav.blog">blog</a>
      <a href="${up}#contact" data-i18n="nav.contact">contact</a>
    </nav>
    <button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle light/dark theme" data-i18n-attr="aria-label:nav.theme">◐</button>
    <div id="langSwitch"></div>
  </header>

  <main id="content" class="blog-main">
${body}
  </main>

  <footer>
    <p class="mono">${tr("foot.built", "built from scratch · hosted on GitHub Pages ·")} © <span id="footYear">${new Date().getFullYear()}</span> ting39 · <a href="${up}feed.xml">rss</a> <button class="term-btn" type="button" data-terminal aria-label="Open terminal" title="terminal (press \`)" data-i18n-attr="aria-label:foot.term;title:foot.termTitle">&gt;_</button></p>
  </footer>

  <script src="${up}assets/i18n.js?v=${v}"></script>
  <script src="${up}assets/i18n-strings.js?v=${v}"></script>
  <script src="${up}projects.js"></script>
  <script src="${up}assets/blog.js?v=${v}" defer></script>
</body>
</html>
`;
}

export function postItem(p, up) {
  return `<li><a class="card post-item" href="${up}blog/${p.slug}/">
        <time class="pi-date mono" datetime="${p.date}">${p.date}</time>
        <span class="pi-main">
          <b class="pi-title">${ml(p, "title")}</b>
          <span class="pi-sum">${ml(p, "summary")}</span>
          <span class="pi-meta mono">${ml(p, "readingTime", (n) => `<span data-i18n="blog.min" data-i18n-vars='{"n":${n}}'>${n} min read</span>`)}${p.tags.length ? " · " + p.tags.map((t) => "#" + esc(t)).join(" ") : ""}</span>
        </span>
      </a></li>`;
}

function postList(posts, up) {
  const years = new Map();
  for (const p of posts) { const y = p.date.slice(0, 4); if (!years.has(y)) years.set(y, []); years.get(y).push(p); }
  return [...years].map(([y, ps]) => `    <h2 class="year mono">${y}</h2>
    <ol class="post-list">
      ${ps.map((p) => postItem(p, up)).join("\n      ")}
    </ol>`).join("\n");
}

function tagChips(tags, up, active) {
  if (!tags.length) return "";
  return `<nav class="filters tag-chips" aria-label="Tags">
      <a href="${up}blog/"${active ? "" : ' class="on" aria-current="page"'} data-i18n="projects.all">all</a>
      ${tags.map((t) => `<a href="${tagHref(up, t.slug)}"${active === t.slug ? ' class="on" aria-current="page"' : ""}>#${esc(t.name)} <small>${t.count}</small></a>`).join("\n      ")}
    </nav>`;
}

export function indexPage({ posts, tags, v, ogImage }) {
  const up = "../";
  const body = `    <header class="blog-head">
      <p class="mono kicker">~/blog $ ls -t</p>
      <h1 data-i18n="blog.h">blog</h1>
      <p class="muted"><span data-i18n="blog.desc">${esc(SITE.description)}</span> <a class="feed-link mono" href="${up}feed.xml">rss ↗</a></p>
      ${tagChips(tags, up, null)}
    </header>
${posts.length ? postList(posts, up) : `    <div class="card empty-posts"><p class="mono">ls: no posts yet</p><p class="muted" data-i18n="blog.none">The first one is on its way.</p></div>`}`;
  return layout({ up, title: SITE.blogTitle, description: SITE.description, path: "blog/", body, v, ogImage });
}

export function tagPage({ tag, posts, tags, v, ogImage }) {
  const up = "../../../";
  const body = `    <header class="blog-head">
      <p class="mono kicker">~/blog $ grep -l "#${esc(tag.name)}" *</p>
      <h1>#${esc(tag.name)}</h1>
      <p class="muted"><span data-i18n="blog.tagged" data-i18n-vars='${esc(JSON.stringify({ n: posts.length, tag: "#" + tag.name }))}'>${posts.length} post${posts.length === 1 ? "" : "s"} tagged #${esc(tag.name)}.</span> <a href="${up}blog/" data-i18n="blog.allBack">← all posts</a></p>
      ${tagChips(tags, up, tag.slug)}
    </header>
${postList(posts, up)}`;
  return layout({ up, title: `#${tag.name} · ${SITE.blogTitle}`, description: `Posts tagged #${tag.name} on ting39's blog.`, path: `blog/tags/${encodeURIComponent(tag.slug)}/`, body, v, ogImage });
}

export function postPage({ post, prev, next, v, ogImage }) {
  const up = "../../";
  const tocFor = (headings) => { const toc = headings.filter((h) => h.level === 2 || h.level === 3); return toc.length >= 3 ? `
      <details class="toc">
        <summary class="mono" data-i18n="blog.contents">contents</summary>
        <ol>${toc.map((h) => `<li class="toc-${h.level}"><a href="#${esc(h.id)}">${esc(h.text)}</a></li>`).join("")}</ol>
      </details>` : ""; };
  const versions = [["en", { html: post.html, headings: post.headings }], ...Object.entries(post.tr || {})];
  const navCard = (p, dir) => (p ? `<a class="card post-nav-${dir}" href="${up}blog/${p.slug}/" rel="${dir}"><small class="mono" data-i18n="${dir === "prev" ? "blog.older" : "blog.newer"}">${dir === "prev" ? "← older" : "newer →"}</small><b>${ml(p, "title")}</b></a>` : "<span></span>");
  const ld = { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.summary, datePublished: post.date, dateModified: post.updated || post.date, url: `${SITE.url}/blog/${post.slug}/`, author: { "@type": "Person", name: SITE.author, url: SITE.url + "/" }, keywords: post.tags.join(", "), inLanguage: post.lang };
  const head = `  <meta property="article:published_time" content="${post.date}">
${post.updated ? `  <meta property="article:modified_time" content="${post.updated}">\n` : ""}${post.tags.map((t) => `  <meta property="article:tag" content="${esc(t)}">\n`).join("")}  <script type="application/ld+json">${jsonLd(ld)}</script>
`;
  const body = `    <div class="progress" aria-hidden="true"></div>
    <article class="post">
      <header class="post-head">
        <a class="back mono" href="${up}blog/">← cd ../blog</a>
        <p class="mono kicker"><time datetime="${post.date}">${post.date}</time> · ${ml(post, "readingTime", (n) => `<span data-i18n="blog.min" data-i18n-vars='{"n":${n}}'>${n} min read</span>`)}${post.updated ? ` · <span data-i18n="blog.updated">updated</span> <time datetime="${post.updated}">${post.updated}</time>` : ""}</p>
        <h1>${ml(post, "title")}</h1>
        ${post.tags.length ? `<ul class="tags" aria-label="Tags">${post.tags.map((t, k) => `<li><a href="${tagHref(up, post.tagSlugs[k])}">#${esc(t)}</a></li>`).join("")}</ul>` : ""}
      </header>
${versions.map(([l, t]) => `      <div data-lang-block="${l}" lang="${langAttr(l)}"${l === "en" ? "" : " hidden"}>${tocFor(t.headings)}
      <div class="prose">
${t.html}
      </div>
      </div>`).join("\n")}
      <footer class="post-foot">
        <nav class="post-nav" aria-label="More posts" data-i18n-attr="aria-label:blog.more">${navCard(prev, "prev")}${navCard(next, "next")}</nav>
        <p class="mono post-meta"><a href="${SITE.repo}/blob/main/posts/${post.slug}.md" data-i18n="blog.source">view source</a> · <a href="${up}feed.xml" data-i18n="blog.sub">subscribe via rss</a> · <span data-i18n="blog.ortype">or type</span> <kbd>\`</kbd> and <code>cat ~/blog/${post.slug}.md</code></p>
      </footer>
    </article>`;
  return layout({ up, title: `${post.title} · ting39`, description: post.summary, path: `blog/${post.slug}/`, type: "article", lang: post.lang, body, head, v, ogImage });
}
