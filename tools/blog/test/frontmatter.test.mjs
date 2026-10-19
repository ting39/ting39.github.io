import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFrontMatter } from "../frontmatter.mjs";

test("parses scalars, quoted strings, booleans and tag lists", () => {
  const { data, body } = parseFrontMatter('---\ntitle: "Hi: there"\ndate: 2026-10-20\ntags: [web, meta]\ndraft: false # comment\nsummary: It\'s fine\n---\nBody');
  assert.deepEqual(data, { title: "Hi: there", date: "2026-10-20", tags: ["web", "meta"], draft: false, summary: "It's fine" });
  assert.equal(body, "Body");
});

test("tags as comma list or block list", () => {
  assert.deepEqual(parseFrontMatter("---\ntags: a, b c\n---\n").data.tags, ["a", "b c"]);
  assert.deepEqual(parseFrontMatter("---\ntags:\n  - x\n  - 'y'\n---\n").data.tags, ["x", "y"]);
});

test("no front matter, CRLF, BOM", () => {
  assert.deepEqual(parseFrontMatter("# just text").data, {});
  assert.equal(parseFrontMatter("﻿---\r\ntitle: a\r\n---\r\nx").data.title, "a");
});

test("bad lines throw a readable error", () => {
  assert.throws(() => parseFrontMatter("---\n: nope\n---\n"), /can't read line/);
});
