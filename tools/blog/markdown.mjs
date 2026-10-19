// A compact Markdown renderer for the blog (no dependencies).
// Covers what posts need: ATX headings (with ids), paragraphs, emphasis, ~~strike~~, `code`,
// fenced code (highlighted, optional title="…"), links/images (inline + reference), bare URLs,
// lists (nested, ordered, task lists), blockquotes + GitHub-style callouts (> [!NOTE]),
// tables with alignment, footnotes, horizontal rules and raw HTML blocks.
// Lines inside a paragraph join without a space between CJK characters, so 中文 wraps naturally.

import { highlight } from "./highlight.mjs";

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const decode = (s) => s.replace(/&(amp|lt|gt|quot|#39);/g, (_, e) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" }[e]));
export const stripTags = (html) => decode(html.replace(/<[^>]*>/g, ""));

export function slugify(s) {
  return String(s).toLowerCase().normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s_-]/gu, "").trim()
    .replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

const CJK = /[⺀-鿿가-힯豈-﫿＀-￯　-〿]/;
const BLOCK_TAGS = "address|article|aside|blockquote|details|dialog|div|dl|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|iframe|main|nav|ol|p|pre|section|summary|table|ul|video|audio|picture|script|style|svg|canvas|center|noscript";
const RE = {
  fence: /^( {0,3})(`{3,}|~{3,})\s*([^\s`]*)\s*(.*)$/,
  heading: /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/,
  hr: /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/,
  quote: /^ {0,3}> ?/,
  list: /^( *)([-*+]|\d{1,9}[.)])( +|$)(.*)$/,
  html: new RegExp(`^ {0,3}(?:<(?:/?(?:${BLOCK_TAGS}))(?:\\s|/?>|$)|<!--)`, "i"),
  tableDelim: /^ *\|? *:?-+:? *(?:\| *:?-+:? *)*\|? *$/,
  refDef: /^ {0,3}\[([^\]^][^\]]*)\]:[ \t]*<?([^\s>]+)>?(?:[ \t]+(?:"([^"]*)"|'([^']*)'|\(([^)]*)\)))?[ \t]*$/,
  fnDef: /^ {0,3}\[\^([^\]\s]+)\]:[ \t]?(.*)$/,
};
const CALLOUTS = { note: "Note", tip: "Tip", important: "Important", warning: "Warning", caution: "Caution" };
const normLabel = (s) => s.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Render markdown to HTML.
 * @returns {{ html: string, headings: {level:number,text:string,id:string}[], text: string }}
 */
export function render(src, opts = {}) {
  const ctx = { refs: Object.create(null), fnDefs: Object.create(null), fnOrder: [], ids: new Map(), headings: [], opts };
  const lines = String(src).replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
  const body = collectDefs(lines, ctx);
  const html = blocks(body, ctx, false) + footnotes(ctx);
  return { html, headings: ctx.headings, text: stripTags(html) };
}

// Pull out [ref]: url and [^note]: text definitions (but not from inside code fences).
function collectDefs(lines, ctx) {
  const out = [];
  let fence = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const f = l.match(RE.fence);
    if (fence) { if (new RegExp(`^ {0,3}${fence[0] === "`" ? "`" : "~"}{${fence.length},}\\s*$`).test(l)) fence = null; out.push(l); continue; }
    if (f) { fence = f[2]; out.push(l); continue; }
    let m = l.match(RE.fnDef);
    if (m) {
      const text = [m[2]];
      while (i + 1 < lines.length && (/^ {2,}\S/.test(lines[i + 1]) || (!lines[i + 1].trim() && /^ {4,}\S/.test(lines[i + 2] || "")))) text.push(lines[++i].trim());
      ctx.fnDefs[m[1]] = text.join("\n");
      continue;
    }
    m = l.match(RE.refDef);
    if (m && (!out.length || !out[out.length - 1].trim() || RE.refDef.test(lines[i - 1] || ""))) {
      const label = normLabel(m[1]);
      if (!(label in ctx.refs)) ctx.refs[label] = { href: m[2], title: m[3] ?? m[4] ?? m[5] ?? null };
      continue;
    }
    out.push(l);
  }
  return out;
}

const isBlank = (l) => !l.trim();
function startsBlock(l, next) {
  if (RE.fence.test(l) || RE.heading.test(l) || RE.hr.test(l) || RE.quote.test(l) || RE.html.test(l)) return true;
  const m = l.match(RE.list);
  if (m && m[4].trim() && (!/\d/.test(m[2]) || /^1[.)]$/.test(m[2]))) return true;
  return l.includes("|") && next !== undefined && RE.tableDelim.test(next) && next.includes("-");
}

function blocks(lines, ctx, tight) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) { i++; continue; }
    let m;

    if ((m = line.match(RE.fence))) {
      const [, ind, fence, lang, info] = m;
      const close = new RegExp(`^ {0,3}${fence[0] === "`" ? "`" : "~"}{${fence.length},}\\s*$`);
      const code = [];
      for (i++; i < lines.length && !close.test(lines[i]); i++) code.push(lines[i].replace(new RegExp(`^ {0,${ind.length}}`), ""));
      i++;
      out.push(codeBlock(code.join("\n"), lang, info));
      continue;
    }
    if ((m = line.match(RE.heading))) {
      const level = m[1].length, inner = inline(m[2] || "", ctx), text = stripTags(inner).trim();
      let id = slugify(text) || "section", base = id, k = 2;
      while (ctx.ids.has(id)) id = `${base}-${k++}`;
      ctx.ids.set(id, true);
      ctx.headings.push({ level, text, id });
      out.push(`<h${level} id="${esc(id)}">${inner}<a class="anchor" href="#${esc(id)}" aria-hidden="true" tabindex="-1">#</a></h${level}>`);
      i++;
      continue;
    }
    if (RE.hr.test(line)) { out.push("<hr>"); i++; continue; }
    if (RE.quote.test(line)) {
      const q = [];
      while (i < lines.length && !isBlank(lines[i]) && (RE.quote.test(lines[i]) || !startsBlock(lines[i], lines[i + 1]))) {
        q.push(lines[i].replace(RE.quote, ""));
        i++;
        // a blank line inside the quote continues it only if the next line is quoted too
        if (i < lines.length && isBlank(lines[i]) && RE.quote.test(lines[i + 1] || "") && RE.quote.test(lines[i - 1])) { q.push(""); i++; }
      }
      const c = (q[0] || "").match(/^\s*\[!(note|tip|important|warning|caution)\]\s*(.*)$/i);
      if (c) {
        const kind = c[1].toLowerCase(), title = c[2].trim() ? inline(c[2].trim(), ctx) : CALLOUTS[kind];
        out.push(`<aside class="callout callout-${kind}"><p class="callout-title">${title}</p>${blocks(q.slice(1), ctx, false)}</aside>`);
      } else out.push(`<blockquote>${blocks(q, ctx, false)}</blockquote>`);
      continue;
    }
    if (RE.html.test(line)) {
      const h = [];
      while (i < lines.length && !isBlank(lines[i])) h.push(lines[i++]);
      out.push(h.join("\n"));
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && RE.tableDelim.test(lines[i + 1]) && lines[i + 1].includes("-")) {
      const head = splitRow(line), aligns = splitRow(lines[i + 1]).map((d) => (/^:-+:$/.test(d) ? "center" : /-:$/.test(d) ? "right" : /^:/.test(d) ? "left" : ""));
      if (head.length === aligns.length) {
        const rows = [];
        for (i += 2; i < lines.length && !isBlank(lines[i]) && lines[i].includes("|"); i++) rows.push(splitRow(lines[i]));
        const cell = (tag, s, k) => `<${tag}${aligns[k] ? ` style="text-align:${aligns[k]}"` : ""}>${inline(s ?? "", ctx)}</${tag}>`;
        out.push(`<div class="table-wrap"><table><thead><tr>${head.map((h, k) => cell("th", h, k)).join("")}</tr></thead>` +
          (rows.length ? `<tbody>${rows.map((r) => `<tr>${head.map((_, k) => cell("td", r[k], k)).join("")}</tr>`).join("")}</tbody>` : "") + "</table></div>");
        continue;
      }
    }
    if ((m = line.match(RE.list))) {
      const r = list(lines, i, ctx);
      out.push(r.html);
      i = r.next;
      continue;
    }
    // paragraph
    const para = [line.replace(/^\s+/, "")];
    for (i++; i < lines.length && !isBlank(lines[i]) && !startsBlock(lines[i], lines[i + 1]); i++) para.push(lines[i]);
    out.push(paragraph(para, ctx, tight));
  }
  return out.join("\n");
}

function paragraph(lines, ctx, tight) {
  let s = "";
  lines.forEach((l, k) => {
    const t = k === lines.length - 1 ? l.trim() : l.replace(/^\s+/, "");
    if (!k) { s = t; return; }
    const prev = s.replace(/(?: {2,}|\\)$/, "");
    const hard = prev !== s;
    s = hard ? prev + "\u0001" + t : CJK.test(s.slice(-1)) && CJK.test(t[0]) ? s + t : s.replace(/\s+$/, "") + "\n" + t;
  });
  const html = inline(s, ctx).replace(/\u0001/g, "<br>\n");
  // a paragraph that is only an image becomes a figure (its title is the caption)
  const fig = s.match(/^!\[([^\]]*)\]\(\s*<?([^\s)>]+)>?(?:\s+"([^"]*)")?\s*\)$/);
  if (fig) return `<figure>${html}${fig[3] ? `<figcaption>${esc(fig[3])}</figcaption>` : ""}</figure>`;
  return tight ? html : `<p>${html}</p>`;
}

function list(lines, i, ctx) {
  const first = lines[i].match(RE.list);
  const base = first[1].length, ordered = /\d/.test(first[2]), start = ordered ? parseInt(first[2], 10) : 1;
  const items = [];
  let loose = false;
  while (i < lines.length) {
    const m = lines[i].match(RE.list);
    if (!m || m[1].length !== base || /\d/.test(m[2]) !== ordered) break;
    const content = m[1].length + m[2].length + (m[3].length > 4 || !m[3] ? 1 : m[3].length);
    const item = [m[4]];
    let blank = false;
    for (i++; i < lines.length; i++) {
      const l = lines[i];
      if (isBlank(l)) { item.push(""); blank = true; continue; }
      const ind = l.match(/^ */)[0].length;
      if (ind >= content || (ind > base && RE.list.test(l))) { item.push(l.slice(Math.min(ind, content))); continue; }
      if (blank) break;
      if (!RE.list.test(l) && !startsBlock(l, lines[i + 1])) { item.push(l.trim()); continue; } // lazy continuation
      break;
    }
    while (item.length && item[item.length - 1] === "") item.pop();
    if (item.includes("")) loose = true;
    const nx = i < lines.length && lines[i].match(RE.list);
    if (blank && nx && nx[1].length === base && /\d/.test(nx[2]) === ordered) loose = true;
    items.push(item);
  }
  const tag = ordered ? "ol" : "ul";
  const html = items.map((item) => {
    const task = item[0].match(/^\[([ xX])\][ \t]+(.*)$/);
    if (task) item = [task[2], ...item.slice(1)];
    const inner = blocks(item, ctx, !loose);
    return task
      ? `<li class="task"><input type="checkbox" disabled${task[1] === " " ? "" : " checked"} aria-label="${task[1] === " " ? "to do" : "done"}"> ${inner}</li>`
      : `<li>${inner}</li>`;
  }).join("\n");
  const cls = items.some((it) => /^\[[ xX]\][ \t]/.test(it[0])) ? ' class="tasks"' : "";
  return { html: `<${tag}${ordered && start !== 1 ? ` start="${start}"` : ""}${cls}>\n${html}\n</${tag}>`, next: i };
}

function splitRow(row) {
  const cells = [];
  let cur = "", code = false;
  const s = row.trim().replace(/^\|/, "").replace(/(?<!\\)\|$/, "");
  for (let k = 0; k < s.length; k++) {
    const ch = s[k];
    if (ch === "\\" && s[k + 1] === "|") { cur += "|"; k++; continue; }
    if (ch === "`") code = !code;
    if (ch === "|" && !code) { cells.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function codeBlock(code, lang, info) {
  const l = (lang || "").toLowerCase().replace(/[^\w+#-]/g, "");
  const title = (info.match(/title="([^"]*)"/) || [])[1] || "";
  const head = title || l ? `<figcaption><span class="code-title">${esc(title)}</span><span class="code-lang">${esc(l)}</span></figcaption>` : "";
  return `<figure class="code">${head}<pre${l ? ` data-lang="${esc(l)}"` : ""}><code${l ? ` class="language-${esc(l)}"` : ""}>${highlight(code, l)}</code></pre></figure>`;
}

function footnotes(ctx) {
  if (!ctx.fnOrder.length) return "";
  const items = ctx.fnOrder.map((id, k) => {
    const body = inline(ctx.fnDefs[id], ctx).replace(/\n/g, " ");
    return `<li id="fn-${esc(id)}">${body} <a class="fn-back" href="#fnref-${esc(id)}" aria-label="Back to reference ${k + 1}">↩</a></li>`;
  });
  return `\n<section class="footnotes" aria-label="Footnotes"><ol>\n${items.join("\n")}\n</ol></section>`;
}

const safeHref = (h, img) => (/^\s*(javascript|vbscript|data):/i.test(h) && !(img && /^\s*data:image\//i.test(h)) ? "#" : h);

function matchBracket(s, i) { // s[i] === "["
  for (let d = 0, k = i; k < s.length; k++) {
    if (s[k] === "\\") { k++; continue; }
    if (s[k] === "[") d++;
    else if (s[k] === "]" && --d === 0) return k;
  }
  return -1;
}
function matchParen(s, i) { // s[i] === "("
  for (let d = 0, k = i; k < s.length; k++) {
    if (s[k] === "\\") { k++; continue; }
    if (s[k] === "(") d++;
    else if (s[k] === ")" && --d === 0) return k;
  }
  return -1;
}

/** Inline markdown → HTML. */
export function inline(src, ctx = { refs: {}, fnDefs: {}, fnOrder: [] }) {
  const store = [];
  const ph = (html) => `\u0000${store.push(html) - 1}\u0000`;
  let s = String(src);

  s = s.replace(/(?<![\\`])(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, (_, t, code) => ph(`<code>${esc(/^ .* $/.test(code) && code.trim() ? code.slice(1, -1) : code)}</code>`));
  s = s.replace(/\\([!-/:-@[-`{-~])/g, (_, c) => ph(esc(c)));
  s = s.replace(/<(https?:\/\/[^\s<>]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)>/g, (_, u) => ph(`<a href="${esc(u.includes("@") && !u.includes("/") ? "mailto:" + u : u)}">${esc(u)}</a>`));
  s = s.replace(/<\/?[A-Za-z][\w-]*(?:\s+[\w:@.-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*\s*\/?>|<!--[\s\S]*?-->/g, (m) => ph(m));
  s = s.replace(/\[\^([^\]\s]+)\]/g, (m, id) => {
    if (!ctx.fnDefs || !(id in ctx.fnDefs)) return m;
    let n = ctx.fnOrder.indexOf(id) + 1;
    if (!n) n = ctx.fnOrder.push(id);
    return ph(`<sup class="fn"><a href="#fn-${esc(id)}" id="fnref-${esc(id)}" aria-label="Footnote ${n}">${n}</a></sup>`);
  });

  // links and images
  let out = "";
  for (let i = 0; i < s.length;) {
    const img = s[i] === "!" && s[i + 1] === "[";
    if (s[i] === "[" || img) {
      const open = img ? i + 1 : i, close = matchBracket(s, open);
      if (close > 0) {
        const text = s.slice(open + 1, close);
        let j = close + 1, href = null, title = null;
        if (s[j] === "(") {
          const end = matchParen(s, j);
          const mm = end > 0 && s.slice(j + 1, end).trim().match(/^<?([^\s>]*)>?(?:\s+(?:"([^"]*)"|'([^']*)'|\(([^)]*)\)))?$/);
          if (mm) { href = mm[1]; title = mm[2] ?? mm[3] ?? mm[4] ?? null; j = end + 1; }
        } else if (ctx.refs) {
          let label = text;
          if (s[j] === "[") { const e2 = s.indexOf("]", j); if (e2 > 0) { if (e2 > j + 1) label = s.slice(j + 1, e2); j = e2 + 1; } }
          const ref = ctx.refs[normLabel(label.replace(/\u0000\d+\u0000/g, ""))];
          if (ref) { href = ref.href; title = ref.title; }
        }
        if (href !== null) {
          const t = title ? ` title="${esc(title)}"` : "";
          if (img) out += ph(`<img src="${esc(safeHref(href, true))}" alt="${esc(stripTags(inline(text, ctx)))}"${t} loading="lazy" decoding="async">`);
          else out += ph(`<a href="${esc(safeHref(href))}"${t}>`) + text + ph("</a>");
          i = j;
          continue;
        }
      }
    }
    out += s[i++];
  }
  s = esc(out);

  s = s
    .replace(/\*\*\*(?=\S)([\s\S]*?\S)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^\p{L}\p{N}_])__(?=\S)([\s\S]*?\S)__(?![\p{L}\p{N}_])/gu, "$1<strong>$2</strong>")
    .replace(/\*(?=[^\s*])([\s\S]*?[^\s*])\*/g, "<em>$1</em>")
    .replace(/(^|[^\p{L}\p{N}_])_(?=\S)([\s\S]*?\S)_(?![\p{L}\p{N}_])/gu, "$1<em>$2</em>")
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<del>$1</del>")
    .replace(/(^|[\s(（「：，、；>\u3400-\u9fff])(https?:\/\/[^\s<\u0000\u0001]*[^\s<\u0000\u0001.,:;"'!?)\]）。，、」])/g, '$1<a href="$2">$2</a>');

  return s.replace(/\u0000(\d+)\u0000/g, (_, n) => store[n]);
}
