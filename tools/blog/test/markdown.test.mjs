import { test } from "node:test";
import assert from "node:assert/strict";
import { render, inline, slugify } from "../markdown.mjs";

const html = (md) => render(md).html;

test("headings get unique, unicode-friendly ids", () => {
  const r = render("# Hello World\n## Hello World\n### 中文 標題!\n#### C#");
  assert.deepEqual(r.headings.map((h) => h.id), ["hello-world", "hello-world-2", "中文-標題", "c"]);
  assert.match(r.html, /<h4 id="c">C#<a class="anchor"/);
});

test("emphasis, strong, strike, code", () => {
  assert.equal(inline("*a* **b** ***c*** ~~d~~ `e*f*`"), "<em>a</em> <strong>b</strong> <strong><em>c</em></strong> <del>d</del> <code>e*f*</code>");
  assert.equal(inline("snake_case_name and 2 * 3 * 4"), "snake_case_name and 2 * 3 * 4");
  assert.equal(inline("__bold__ _it_"), "<strong>bold</strong> <em>it</em>");
  assert.equal(inline("**中文粗體**和*斜體*"), "<strong>中文粗體</strong>和<em>斜體</em>");
  assert.equal(inline("``a `b` c``"), "<code>a `b` c</code>");
});

test("escapes and HTML safety", () => {
  assert.equal(inline("\\*not em\\* 1 < 2 & 3"), "*not em* 1 &lt; 2 &amp; 3");
  assert.equal(inline("`<script>`"), "<code>&lt;script&gt;</code>");
  assert.equal(inline("[x](javascript:alert(1))"), '<a href="#">x</a>');
  assert.equal(inline("inline <kbd>Ctrl</kbd> html"), "inline <kbd>Ctrl</kbd> html");
});

test("links: inline, reference, autolinks, bare URLs", () => {
  assert.equal(inline('[a](https://x.y "T")'), '<a href="https://x.y" title="T">a</a>');
  assert.equal(inline("[a (b)](https://x.y/(z))"), '<a href="https://x.y/(z)">a (b)</a>');
  assert.equal(inline("<https://x.y>"), '<a href="https://x.y">https://x.y</a>');
  assert.equal(inline("see https://x.y/a_b, ok"), 'see <a href="https://x.y/a_b">https://x.y/a_b</a>, ok');
  assert.equal(inline("網址：https://x.y。"), '網址：https://x.y。'.replace("https://x.y", '<a href="https://x.y">https://x.y</a>'));
  assert.match(html("[a][r] [r][]\n\n[r]: https://r.z"), /<a href="https:\/\/r.z">a<\/a> <a href="https:\/\/r.z">r<\/a>/);
  assert.equal(inline("[not a link]"), "[not a link]");
  assert.equal(inline("**[bold link](/x)**"), '<strong><a href="/x">bold link</a></strong>');
});

test("paragraphs join CJK lines without spaces, others with a newline; hard breaks", () => {
  assert.equal(html("中文\n繼續"), "<p>中文繼續</p>");
  assert.equal(html("one\ntwo"), "<p>one\ntwo</p>");
  assert.equal(html("one  \ntwo"), "<p>one<br>\ntwo</p>");
  assert.equal(html("one\\\ntwo"), "<p>one<br>\ntwo</p>");
});

test("lists: tight, loose, nested, ordered start, tasks", () => {
  assert.equal(html("- a\n- b"), "<ul>\n<li>a</li>\n<li>b</li>\n</ul>");
  assert.equal(html("- a\n\n- b"), "<ul>\n<li><p>a</p></li>\n<li><p>b</p></li>\n</ul>");
  assert.equal(html("1. a\n   - b\n2. c"), "<ol>\n<li>a\n<ul>\n<li>b</li>\n</ul></li>\n<li>c</li>\n</ol>");
  assert.match(html("3. x\n4. y"), /^<ol start="3">/);
  assert.match(html("- [ ] todo\n- [x] done"), /<ul class="tasks">\n<li class="task"><input type="checkbox" disabled aria-label="to do"> todo<\/li>\n<li class="task"><input type="checkbox" disabled checked aria-label="done"> done<\/li>/);
  assert.equal(html("- a\nlazy\n- b"), "<ul>\n<li>a\nlazy</li>\n<li>b</li>\n</ul>");
  assert.equal(html("- a\n\n1. b"), "<ul>\n<li>a</li>\n</ul>\n<ol>\n<li>b</li>\n</ol>");
  assert.equal(html("text\n- item"), "<p>text</p>\n<ul>\n<li>item</li>\n</ul>");
  assert.equal(html("year\n2026. was fine"), "<p>year\n2026. was fine</p>");
});

test("code fences: language, title, highlighting, untouched contents", () => {
  const h = html('```py title="hi.py"\nprint("<b>")  # yo\n```');
  assert.match(h, /<figcaption><span class="code-title">hi.py<\/span><span class="code-lang">py<\/span><\/figcaption>/);
  assert.match(h, /<span class="tok-builtin">print<\/span>/);
  assert.match(h, /<span class="tok-string">&quot;&lt;b&gt;&quot;<\/span>/);
  assert.match(html("~~~\n# not a heading\n- not a list\n~~~"), /<code># not a heading\n- not a list<\/code>/);
  assert.match(html("```\nunclosed"), /<code>unclosed<\/code>/);
  assert.match(html("````md\n```js\nx\n```\n````"), /<code class="language-md">```js\nx\n```<\/code>/);
});

test("blockquotes and callouts", () => {
  assert.equal(html("> a\n> b"), "<blockquote><p>a\nb</p></blockquote>");
  assert.equal(html("> a\n>\n> b"), "<blockquote><p>a</p>\n<p>b</p></blockquote>");
  assert.match(html("> [!WARNING]\n> careful"), /<aside class="callout callout-warning"><p class="callout-title">Warning<\/p><p>careful<\/p><\/aside>/);
});

test("tables with alignment and escaped pipes", () => {
  const h = html("| a | b | c |\n|:--|:-:|--:|\n| 1 | \\| | `x|y` |");
  assert.match(h, /<th style="text-align:left">a<\/th><th style="text-align:center">b<\/th><th style="text-align:right">c<\/th>/);
  assert.match(h, /<td style="text-align:center">\|<\/td><td style="text-align:right"><code>x\|y<\/code><\/td>/);
  assert.equal(html("not | a table"), "<p>not | a table</p>");
});

test("footnotes are numbered by first use, unknown ones stay literal", () => {
  const h = html("b[^two] a[^one] again[^two] x[^nope]\n\n[^one]: First.\n[^two]: Second.");
  assert.match(h, /b<sup class="fn"><a href="#fn-two" id="fnref-two" aria-label="Footnote 1">1<\/a><\/sup> a<sup class="fn"><a href="#fn-one"/);
  assert.match(h, /x\[\^nope\]/);
  assert.match(h, /<li id="fn-two">Second\./);
});

test("images, figures, hr, html blocks", () => {
  assert.equal(html('![cat](c.png "A cat")'), '<figure><img src="c.png" alt="cat" title="A cat" loading="lazy" decoding="async"><figcaption>A cat</figcaption></figure>');
  assert.equal(html("a\n\n---\n\nb"), "<p>a</p>\n<hr>\n<p>b</p>");
  assert.equal(html("<details>\n<summary>x</summary>\nhi\n</details>"), "<details>\n<summary>x</summary>\nhi\n</details>");
  assert.match(html("text ![i](a.png) more"), /^<p>text <img src="a.png"/);
});

test("slugify", () => {
  assert.equal(slugify("  Hello, World!  "), "hello-world");
  assert.equal(slugify("How this site works"), "how-this-site-works");
  assert.equal(slugify("音樂 & 遊戲"), "音樂-遊戲");
});

test("reference definitions inside code are not consumed", () => {
  assert.match(html("```\n[a]: https://x\n```"), /\[a\]: https:\/\/x/);
});

test("escaped backticks don't open code spans", () => {
  assert.equal(inline("<kbd>\\`</kbd> and `x`"), "<kbd>`</kbd> and <code>x</code>");
});
