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
  <a class="skip" href="#content">Skip to content</a>
  <header class="nav">
    <a class="logo" href="${up}">ting39<span class="blink">_</span></a>
    <nav aria-label="Site">
      <a href="${up}#about">about</a>
      <a href="${up}#projects">projects</a>
      <a href="${up}blog/"${nav === "blog" ? ' class="active" aria-current="page"' : ""}>blog</a>
      <a href="${up}#contact">contact</a>
    </nav>
    <button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle light/dark theme">◐</button>
  </header>

  <main id="content" class="blog-main">
${body}
  </main>

  <footer>
    <p class="mono">built from scratch · hosted on GitHub Pages · © <span id="footYear">${new Date().getFullYear()}</span> ting39 · <a href="${up}feed.xml">rss</a> <button class="term-btn" type="button" data-terminal aria-label="Open terminal" title="terminal (press \`)">&gt;_</button></p>
  </footer>

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
          <b class="pi-title">${esc(p.title)}</b>
          <span class="pi-sum">${esc(p.summary)}</span>
          <span class="pi-meta mono">${p.readingTime} min read${p.tags.length ? " · " + p.tags.map((t) => "#" + esc(t)).join(" ") : ""}</span>
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
      <a href="${up}blog/"${active ? "" : ' class="on" aria-current="page"'}>all</a>
      ${tags.map((t) => `<a href="${tagHref(up, t.slug)}"${active === t.slug ? ' class="on" aria-current="page"' : ""}>#${esc(t.name)} <small>${t.count}</small></a>`).join("\n      ")}
    </nav>`;
}

export function indexPage({ posts, tags, v, ogImage }) {
  const up = "../";
  const body = `    <header class="blog-head">
      <p class="mono kicker">~/blog $ ls -t</p>
      <h1>blog</h1>
      <p class="muted">${esc(SITE.description)} <a class="feed-link mono" href="${up}feed.xml">rss ↗</a></p>
      ${tagChips(tags, up, null)}
    </header>
${posts.length ? postList(posts, up) : `    <div class="card empty-posts"><p class="mono">ls: no posts yet</p><p class="muted">The first one is on its way.</p></div>`}`;
  return layout({ up, title: SITE.blogTitle, description: SITE.description, path: "blog/", body, v, ogImage });
}

export function tagPage({ tag, posts, tags, v, ogImage }) {
  const up = "../../../";
  const body = `    <header class="blog-head">
      <p class="mono kicker">~/blog $ grep -l "#${esc(tag.name)}" *</p>
      <h1>#${esc(tag.name)}</h1>
      <p class="muted">${posts.length} post${posts.length === 1 ? "" : "s"} tagged #${esc(tag.name)}. <a href="${up}blog/">← all posts</a></p>
      ${tagChips(tags, up, tag.slug)}
    </header>
${postList(posts, up)}`;
  return layout({ up, title: `#${tag.name} · ${SITE.blogTitle}`, description: `Posts tagged #${tag.name} on ting39's blog.`, path: `blog/tags/${encodeURIComponent(tag.slug)}/`, body, v, ogImage });
}

export function postPage({ post, prev, next, v, ogImage }) {
  const up = "../../";
  const toc = post.headings.filter((h) => h.level === 2 || h.level === 3);
  const tocHtml = toc.length >= 3 ? `
      <details class="toc">
        <summary class="mono">contents</summary>
        <ol>${toc.map((h) => `<li class="toc-${h.level}"><a href="#${esc(h.id)}">${esc(h.text)}</a></li>`).join("")}</ol>
      </details>` : "";
  const navCard = (p, dir) => (p ? `<a class="card post-nav-${dir}" href="${up}blog/${p.slug}/" rel="${dir}"><small class="mono">${dir === "prev" ? "← older" : "newer →"}</small><b>${esc(p.title)}</b></a>` : "<span></span>");
  const ld = { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.summary, datePublished: post.date, dateModified: post.updated || post.date, url: `${SITE.url}/blog/${post.slug}/`, author: { "@type": "Person", name: SITE.author, url: SITE.url + "/" }, keywords: post.tags.join(", "), inLanguage: post.lang };
  const head = `  <meta property="article:published_time" content="${post.date}">
${post.updated ? `  <meta property="article:modified_time" content="${post.updated}">\n` : ""}${post.tags.map((t) => `  <meta property="article:tag" content="${esc(t)}">\n`).join("")}  <script type="application/ld+json">${jsonLd(ld)}</script>
`;
  const body = `    <div class="progress" aria-hidden="true"></div>
    <article class="post" lang="${esc(post.lang)}">
      <header class="post-head">
        <a class="back mono" href="${up}blog/">← cd ../blog</a>
        <p class="mono kicker"><time datetime="${post.date}">${post.date}</time> · ${post.readingTime} min read${post.updated ? ` · updated <time datetime="${post.updated}">${post.updated}</time>` : ""}</p>
        <h1>${esc(post.title)}</h1>
        ${post.tags.length ? `<ul class="tags" aria-label="Tags">${post.tags.map((t, k) => `<li><a href="${tagHref(up, post.tagSlugs[k])}">#${esc(t)}</a></li>`).join("")}</ul>` : ""}
      </header>${tocHtml}
      <div class="prose">
${post.html}
      </div>
      <footer class="post-foot">
        <nav class="post-nav" aria-label="More posts">${navCard(prev, "prev")}${navCard(next, "next")}</nav>
        <p class="mono post-meta"><a href="${SITE.repo}/blob/main/posts/${post.slug}.md">view source</a> · <a href="${up}feed.xml">subscribe via rss</a> · or type <kbd>\`</kbd> and <code>cat ~/blog/${post.slug}.md</code></p>
      </footer>
    </article>`;
  return layout({ up, title: `${post.title} · ting39`, description: post.summary, path: `blog/${post.slug}/`, type: "article", lang: post.lang, body, head, v, ogImage });
}
