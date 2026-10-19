// Front matter: a small YAML subset between --- lines at the top of a post.
//   title: Hello            → string ("quoted" or 'quoted' also fine)
//   tags: [a, b]  or  tags: a, b  or a "- item" list on the following lines
//   draft: true             → boolean;  numbers stay strings (dates are validated by the build)

const unquote = (s) => {
  s = s.trim();
  if (/^"(.*)"$/.test(s)) return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  if (/^'(.*)'$/.test(s)) return s.slice(1, -1).replace(/''/g, "'");
  return s;
};
const scalar = (s) => {
  const v = s.replace(/\s+#.*$/, "").trim();
  if (/^(true|yes)$/i.test(v)) return true;
  if (/^(false|no)$/i.test(v)) return false;
  return unquote(v);
};
const LIST_KEYS = new Set(["tags"]);

export function parseFrontMatter(src) {
  const text = String(src).replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const m = text.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!m) return { data: {}, body: text, lines: 0 };
  const data = {};
  let listKey = null;
  for (const raw of m[1].split("\n")) {
    if (!raw.trim() || /^\s*#/.test(raw)) continue;
    const item = raw.match(/^\s*-\s+(.*)$/);
    if (item && listKey) { data[listKey].push(scalar(item[1])); continue; }
    const kv = raw.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!kv) throw new Error(`front matter: can't read line "${raw.trim()}"`);
    const [, key, val] = kv;
    listKey = null;
    if (!val.trim() || val.trim() === "|") { data[key] = LIST_KEYS.has(key) ? [] : ""; listKey = LIST_KEYS.has(key) ? key : null; continue; }
    if (/^\[.*\]$/.test(val.trim())) { data[key] = val.trim().slice(1, -1).split(",").map(scalar).filter((x) => x !== ""); continue; }
    data[key] = LIST_KEYS.has(key) ? val.split(",").map(scalar).filter((x) => x !== "") : scalar(val);
  }
  return { data, body: text.slice(m[0].length), lines: m[0].split("\n").length - 1 };
}
