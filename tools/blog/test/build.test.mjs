import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build, write } from "../build.mjs";

function site(posts) {
  const root = mkdtempSync(join(tmpdir(), "blog-"));
  mkdirSync(join(root, "posts"));
  for (const [name, text] of Object.entries(posts)) writeFileSync(join(root, "posts", name), text);
  return root;
}
const post = (title, date, extra = "", body = "Hello there.") => `---\ntitle: ${title}\ndate: ${date}\n${extra}---\n${body}\n`;

test("builds pages, feeds and posts.json; skips drafts, README and _template", () => {
  const root = site({
    "a-post.md": post("A post", "2026-10-20", "tags: [web, 中文]\n", "First para.\n\n## Part\n\nMore."),
    "older.md": post("Older", "2026-01-02"),
    "secret.md": post("Secret", "2026-10-21", "draft: true\n"),
    "README.md": "# how to post",
    "_template.md": post("T", "2026-01-01"),
  });
  const { posts, files } = build(root);
  assert.deepEqual(posts.map((p) => p.slug), ["a-post", "older"]);
  for (const f of ["blog/index.html", "blog/a-post/index.html", "blog/older/index.html", "blog/tags/web/index.html", "blog/tags/中文/index.html", "posts.json", "feed.xml", "rss.xml", "sitemap.xml"]) assert.ok(files.has(f), f);
  const json = JSON.parse(files.get("posts.json"));
  assert.equal(json.posts[0].summary, "First para.");
  assert.equal(json.posts[0].url, "blog/a-post/");
  const page = files.get("blog/a-post/index.html");
  assert.match(page, /<h2 id="part">Part/);
  assert.match(page, /rel="prev"[^>]*>|href="..\/..\/blog\/older\/" rel="prev"/);
  assert.match(page, /href="..\/..\/blog\/tags\/%E4%B8%AD%E6%96%87\/"/);
  assert.ok(!files.get("feed.xml").includes("Secret"));
  assert.match(files.get("feed.xml"), /<updated>2026-10-20T00:00:00\+08:00<\/updated>/);
  assert.equal(build(root, { drafts: true }).posts.length, 3);
});

test("output is deterministic and stale pages are removed", () => {
  const root = site({ "one.md": post("One", "2026-10-20"), "two.md": post("Two", "2026-10-19") });
  write(root, build(root).files);
  assert.deepEqual(write(root, build(root).files), []);
  writeFileSync(join(root, "posts", "two.md"), post("Two", "2026-10-19", "draft: true\n"));
  const changed = write(root, build(root).files);
  assert.ok(changed.includes("-blog/two/index.html"));
  assert.ok(!existsSync(join(root, "blog/two")));
  assert.ok(readFileSync(join(root, "blog/index.html"), "utf8").includes("One"));
});

test("helpful errors for bad input", () => {
  assert.throws(() => build(site({ "Bad Name.md": post("x", "2026-10-20") })), /lowercase letters, digits and dashes/);
  assert.throws(() => build(site({ "x.md": post("x", "2026-13-40") })), /must be a date/);
  assert.throws(() => build(site({ "x.md": "---\ndate: 2026-10-20\n---\nhi" })), /needs a "title"/);
});

test("Chinese posts get lang and reading time from characters", () => {
  const root = site({ "zh.md": post("中文", "2026-10-20", "", "這是一篇中文文章。".repeat(100)) });
  const [p] = build(root).posts;
  assert.equal(p.lang, "zh-Hant");
  assert.equal(p.readingTime, 2);
});
