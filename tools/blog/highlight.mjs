// A small build-time syntax highlighter: one combined regex per language, first match wins.
// Output is escaped HTML with <span class="tok-…"> around tokens. Unknown languages are just escaped.

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const words = (s) => String.raw`\b(?:${s.trim().split(/\s+/).join("|")})\b`;
const both = (s) => s.trim().split(/\s+/).flatMap((w) => [w, w.toUpperCase()]).join(" ");

const STR_D = String.raw`"(?:\\.|[^"\\\n])*"`;
const STR_S = String.raw`'(?:\\.|[^'\\\n])*'`;
const NUM = String.raw`\b(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?)[a-zA-Z]*\b`;
const C_COMMENT = String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/`;
const FUNC = String.raw`\b[A-Za-z_$][\w$]*(?=\s*\()`;

const LANGS = Object.create(null);
function def(names, rules) {
  const re = new RegExp(rules.map(([, src]) => `(${src})`).join("|"), "gm");
  const classes = rules.map(([cls]) => cls);
  for (const n of names.split(" ")) LANGS[n] = { re, classes };
}

const JS_KW = `await break case catch class const continue debugger default delete do else export extends finally for
  from function if import in instanceof let new of return static super switch this throw try typeof var void while with
  yield async get set interface type enum implements declare readonly as satisfies keyof abstract private protected public namespace`;
def("js javascript mjs cjs jsx ts typescript tsx", [
  ["comment", C_COMMENT],
  ["string", `${STR_D}|${STR_S}|\`(?:\\\\[\\s\\S]|[^\`\\\\])*\``],
  ["number", NUM],
  ["keyword", words(JS_KW)],
  ["literal", words("true false null undefined NaN Infinity")],
  ["builtin", words("console window document globalThis Math JSON Object Array Promise Map Set WeakMap Number String Boolean Symbol Error RegExp Date fetch require module process")],
  ["function", FUNC],
  ["type", String.raw`\b[A-Z][\w$]*`],
  ["operator", String.raw`=>|[-+*/%=!<>&|^~?:]+`],
  ["punct", String.raw`[{}()[\];,.]`],
]);

def("py python", [
  ["comment", String.raw`#[^\n]*`],
  ["string", String.raw`[rRbBfFuU]{0,2}(?:"""[\s\S]*?"""|'''[\s\S]*?''')|[rRbBfFuU]{0,2}(?:${STR_D}|${STR_S})`],
  ["meta", String.raw`@[\w.]+`],
  ["number", NUM],
  ["keyword", words("and as assert async await break class continue def del elif else except finally for from global if import in is lambda match case nonlocal not or pass raise return try while with yield")],
  ["literal", words("True False None self cls")],
  ["builtin", words("print len range enumerate zip map filter sorted reversed sum min max abs open input int float str list dict set tuple bool type isinstance super object Exception")],
  ["function", String.raw`\b[A-Za-z_]\w*(?=\s*\()`],
  ["type", String.raw`\b[A-Z]\w*`],
  ["operator", String.raw`[-+*/%=!<>&|^~@:]+`],
  ["punct", String.raw`[{}()[\];,.]`],
]);

def("c h cpp c++ cc hpp cxx java cs csharp go golang rust rs kotlin kt swift", [
  ["comment", C_COMMENT],
  ["meta", String.raw`^\s*#\s*\w+[^\n]*|#\[[^\]\n]*\]|@\w+`],
  ["string", `${STR_D}|'(?:\\\\.|[^'\\\\\\n]){1,4}'|\`[^\`]*\``],
  ["number", NUM],
  ["keyword", words(`auto break case catch class const constexpr continue default delete do else enum explicit extern final for
    friend goto if inline namespace new noexcept operator override private protected public register return sizeof static
    struct switch template this throw try typedef typename union using virtual volatile while fn let mut impl trait pub use
    mod match loop move ref self Self crate where async await dyn package import func go defer chan select range var type
    interface map fallthrough extends implements instanceof abstract synchronized throws val fun when object is in as
    guard init deinit lazy`)],
  ["type", words("int long short char float double void bool boolean byte size_t uint8_t uint32_t int64_t uint64_t string String usize isize u8 u16 u32 u64 i8 i16 i32 i64 f32 f64 str Vec Option Result Box")],
  ["literal", words("true false null nullptr NULL nil None Some Ok Err")],
  ["function", String.raw`\b[A-Za-z_]\w*!?(?=\s*\()`],
  ["type", String.raw`\b[A-Z]\w*`],
  ["operator", String.raw`::|->|=>|[-+*/%=!<>&|^~?:]+`],
  ["punct", String.raw`[{}()[\];,.]`],
]);

def("sh bash shell zsh console terminal", [
  ["meta", String.raw`^\s*[$#](?= )`],
  ["comment", String.raw`(?:^|(?<=\s))#[^\n]*`],
  ["string", `${STR_D}|'[^']*'`],
  ["variable", String.raw`\$\{[^}\n]*\}|\$[\w@#?*!$-]`],
  ["keyword", words("if then else elif fi for in do done while until case esac function return export local readonly source alias unset shift exit")],
  ["builtin", words("cd ls echo cat grep sed awk git npm npx node python python3 pip sudo curl wget mkdir rm cp mv touch chmod gh make cargo")],
  ["number", String.raw`\b\d+\b`],
  ["operator", String.raw`&&|\|\||[|&;<>]`],
]);

def("json jsonc json5", [
  ["comment", C_COMMENT],
  ["property", String.raw`${STR_D}(?=\s*:)`],
  ["string", STR_D],
  ["number", String.raw`-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b`],
  ["literal", words("true false null")],
  ["punct", String.raw`[{}[\],:]`],
]);

def("css scss less", [
  ["comment", String.raw`\/\*[\s\S]*?\*\/`],
  ["string", `${STR_D}|${STR_S}`],
  ["keyword", String.raw`@[\w-]+|!important`],
  ["property", String.raw`--[\w-]+|\b[a-z-]+(?=\s*:(?!:))`],
  ["number", String.raw`#[\da-fA-F]{3,8}\b|-?\b\d*\.?\d+(?:px|em|rem|vh|vw|dvh|%|s|ms|deg|fr|ch)?\b`],
  ["function", String.raw`\b[\w-]+(?=\()`],
  ["type", String.raw`[.#][\w-]+|::?[\w-]+`],
  ["punct", String.raw`[{}();,:]`],
]);

def("html xml svg vue htm", [
  ["comment", String.raw`<!--[\s\S]*?-->`],
  ["meta", String.raw`<!DOCTYPE[^>]*>|<\?[\s\S]*?\?>`],
  ["tag", String.raw`<\/?[\w:-]+|\/?>`],
  ["attr", String.raw`\b[\w:@.-]+(?==)`],
  ["string", `${STR_D}|${STR_S}`],
]);

def("yaml yml toml ini", [
  ["comment", String.raw`#[^\n]*`],
  ["meta", String.raw`^\s*\[[^\]\n]+\]|^---$`],
  ["property", String.raw`^\s*[\w.-]+(?=\s*[:=])`],
  ["string", `${STR_D}|${STR_S}`],
  ["literal", words("true false null yes no on off")],
  ["number", String.raw`-?\b\d+(?:\.\d+)?\b`],
  ["punct", String.raw`[[\]{},:=-]`],
]);

def("sql", [
  ["comment", String.raw`--[^\n]*|\/\*[\s\S]*?\*\/`],
  ["string", STR_S],
  ["keyword", words(both(`select from where and or not insert into values update set delete create table drop alter index
    join left right inner outer on group by order having limit offset as distinct union all is null like in between case when
    then else end primary key foreign references default exists asc desc`))],
  ["function", FUNC],
  ["number", NUM],
  ["operator", String.raw`[-+*/%=<>!|]+`],
]);

def("diff patch", [
  ["meta", String.raw`^(?:@@[^\n]*|diff [^\n]*|index [^\n]*|\+\+\+ [^\n]*|--- [^\n]*)`],
  ["inserted", String.raw`^\+[^\n]*`],
  ["deleted", String.raw`^-[^\n]*`],
]);

/** Highlight `code` written in `lang`; returns escaped HTML. */
export function highlight(code, lang) {
  const L = LANGS[(lang || "").toLowerCase()];
  if (!L) return esc(code);
  const { re, classes } = L;
  let out = "", last = 0, m;
  re.lastIndex = 0;
  while ((m = re.exec(code))) {
    if (m[0] === "") { re.lastIndex++; continue; }
    const g = m.findIndex((v, i) => i > 0 && v !== undefined);
    out += esc(code.slice(last, m.index)) + `<span class="tok-${classes[g - 1]}">${esc(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(code.slice(last));
}

export const languages = () => Object.keys(LANGS);
