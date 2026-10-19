import { test } from "node:test";
import assert from "node:assert/strict";
import { highlight } from "../highlight.mjs";

const toks = (code, lang) => [...highlight(code, lang).matchAll(/<span class="tok-(\w+)">([^<]*)<\/span>/g)].map((m) => `${m[1]}:${m[2]}`);

test("unknown languages are only escaped", () => {
  assert.equal(highlight("<a> & b", "nope"), "&lt;a&gt; &amp; b");
  assert.equal(highlight("x", ""), "x");
});

test("javascript", () => {
  const t = toks('const s = "a // b"; // real\nfoo(1.5e3)', "js");
  assert.deepEqual(t, ["keyword:const", "operator:=", "string:&quot;a // b&quot;", "punct:;", "comment:// real", "function:foo", "punct:(", "number:1.5e3", "punct:)"]);
  assert.ok(toks("`tpl ${x}`", "ts").includes("string:`tpl ${x}`"));
});

test("python", () => {
  const t = toks('@dataclass\ndef f(x):\n    """doc # not comment"""\n    return None  # c', "python");
  assert.deepEqual(t, ["meta:@dataclass", "keyword:def", "function:f", "punct:(", "punct:)", "operator::", "string:&quot;&quot;&quot;doc # not comment&quot;&quot;&quot;", "keyword:return", "literal:None", "comment:# c"]);
});

test("bash keeps $# and URLs#hash out of comments", () => {
  const t = toks("$ echo $# x#y # real", "bash");
  assert.deepEqual(t, ["meta:$", "builtin:echo", "variable:$#", "comment:# real"]);
});

test("html, css, json, diff", () => {
  assert.deepEqual(toks('<a href="x">', "html"), ["tag:&lt;a", "attr:href", "string:&quot;x&quot;", "tag:&gt;"]);
  assert.ok(toks("a { color: #fff; }", "css").includes("number:#fff"));
  assert.deepEqual(toks('{"k": 1}', "json"), ["punct:{", "property:&quot;k&quot;", "punct::", "number:1", "punct:}"]);
  assert.deepEqual(toks("+a\n-b\n c", "diff"), ["inserted:+a", "deleted:-b"]);
});
