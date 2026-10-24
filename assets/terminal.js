/* t39sh: the secret terminal of ting39.github.io.
   Lazy-loaded by script.js the first time someone presses ` (or clicks >_ in the footer).
   Everything is local: a small shell over a virtual filesystem built from the page's own data
   (projects.js, posts.json, spotify.json). Nothing typed here leaves the browser. */
(() => {
  "use strict";
  if (window.T39SH) return;

  const SITE = window.SITE || {};
  // translations (assets/terminal-i18n.js); commands, flags and paths stay English like a real shell
  const LANG = () => (window.I18N ? I18N.lang : "en");
  const L = (s) => { const d = window.TERM_I18N && TERM_I18N[LANG()]; return (d && typeof s === "string" && d[s]) || s; };
  const LT = (key, en, vars) => { const d = window.TERM_I18N && TERM_I18N[LANG()]; let t = (d && d["tpl:" + key]) || en; for (const k in vars || {}) t = t.split("{" + k + "}").join(vars[k]); return t; };
  const LF = (name, en) => () => { const d = window.TERM_I18N && TERM_I18N[LANG()]; return (d && d["file:" + name]) || en; };
  // the site root, so paths work from nested pages like /blog/<post>/ too (this file lives in /assets/)
  const BASE = new URL("..", (document.currentScript && document.currentScript.src) || location.href);
  const site = (path) => new URL(path, BASE).href;
  const VERSION = "1.0";
  const USER = "guest", HOST = "ting39", HOME = "/home/ting39";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const booted = new Date();
  const store = {
    get(k, d) { try { const v = localStorage.getItem("t39sh." + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("t39sh." + k, JSON.stringify(v)); } catch {} },
  };

  // ---------------------------------------------------------------- html helpers
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const span = (cls, s) => `<span class="t-${cls}">${esc(s)}</span>`;
  const c = {};
  for (const k of ["red", "green", "yellow", "blue", "magenta", "cyan", "dim", "bold", "accent", "pink", "inv", "match"]) c[k] = (s) => span(k, s);
  const link = (href, text) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text ?? href)}</a>`;
  const linkify = (t) => esc(t).replace(/https?:\/\/[^\s<>"']*[^\s<>"'.,;:!?)\]]/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  const tpl = document.createElement("template");
  const toText = (html) => { tpl.innerHTML = html; return tpl.content.textContent; };
  // display width: CJK and emoji take two cells
  const WIDE = /[\u1100-\u115F\u2E80-\u303E\u3041-\u33FF\u3400-\u4DBF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]|[\u{1F300}-\u{1FAFF}]/u;
  const wcw = (s) => { let n = 0; for (const ch of String(s)) n += WIDE.test(ch) ? 2 : 1; return n; };
  const pad = (s, n) => s + " ".repeat(Math.max(0, n - wcw(s)));
  const ABORT = new Error("aborted");
  const sleep = (ms, signal) => new Promise((res, rej) => {
    if (signal?.aborted) return rej(ABORT);
    const ab = () => { clearTimeout(t); rej(ABORT); };
    const t = setTimeout(() => { signal?.removeEventListener("abort", ab); res(); }, ms);
    signal?.addEventListener("abort", ab, { once: true });
  });
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  function ago(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    if (s < 60) return plural(s, "second");
    if (s < 3600) return plural(Math.floor(s / 60), "minute");
    if (s < 86400) return plural(Math.floor(s / 3600), "hour");
    return plural(Math.floor(s / 86400), "day");
  }
  function hms(ms) {
    const s = Math.floor(ms / 1000);
    return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, "0")).join(":");
  }
  function fmtDate(d, tz) {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      weekday: "short", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
      hourCycle: "h23", year: "numeric", timeZoneName: "short", ...(tz && { timeZone: tz }),
    }).formatToParts(d).map((q) => [q.type, q.value]));
    return `${p.weekday} ${p.month} ${p.day} ${p.hour}:${p.minute}:${p.second} ${p.timeZoneName} ${p.year}`;
  }
  const shortDate = (d) => d.toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).replace(",", "");

  function browserInfo() {
    const ua = navigator.userAgent;
    const b = [[/Edg\/(\d+)/, "Edge"], [/OPR\/(\d+)/, "Opera"], [/Firefox\/(\d+)/, "Firefox"], [/Chrome\/(\d+)/, "Chrome"], [/Version\/(\d+).*Safari/, "Safari"]]
      .map(([re, n]) => (ua.match(re) ? `${n} ${ua.match(re)[1]}` : null)).find(Boolean) || "a mysterious browser";
    const os = /Windows NT/.test(ua) ? "Windows" : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Mac OS X/.test(ua) ? "macOS"
      : /Android/.test(ua) ? "Android" : /CrOS/.test(ua) ? "ChromeOS" : /Linux/.test(ua) ? "Linux" : "an unknown OS";
    return { browser: b, os };
  }

  // ---------------------------------------------------------------- virtual filesystem
  const D = (children = {}, meta = {}) => ({ type: "dir", children: Object.assign(Object.create(null), children), ...meta });
  const F = (content, meta = {}) => ({ type: "file", content, ...meta });
  const dirname = (a) => a.slice(0, a.lastIndexOf("/")) || "/";
  const basename = (a) => a.slice(a.lastIndexOf("/") + 1);
  const slugify = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-") || "project";

  const projects = [];
  for (const p of window.PROJECTS || []) {
    const m = (p.link || "").match(/github\.io\/([^/?#]+)/);
    let slug = m ? m[1].toLowerCase() : slugify(p.title), k = 2;
    while (projects.some((q) => q.slug === slug)) slug = `${slug.replace(/-\d+$/, "")}-${k++}`;
    projects.push({ ...p, slug });
  }
  let posts = [], music = null;

  const projectText = (p) => [
    `# ${p.emoji ? p.emoji + " " : ""}${p.title}`, "", (p.i18n && p.i18n[LANG()] && p.i18n[LANG()].description) || p.description || "", "",
    `tags:  ${(p.tags || []).join(", ") || "-"}`,
    p.link ? `live:  ${p.link}` : null, p.repo ? `code:  ${p.repo}` : null, "",
    `run \`open ${p.slug}\` to launch it.`,
  ].filter((l) => l !== null).join("\n") + "\n";

  const SECRETS = `# things \`help\` won't tell you
- some classic typos are handled with care. try one.
- open an editor if you dare. leaving is the hard part.
- sudo exists. so does its more polite cousin.
- an adventure from 1976 had a magic word. it still works.
- a bullet-hell lives in here: \`danmaku\`
- \`theme term amber\` turns this into a 1983 monitor.
- the homepage itself remembers a very old cheat code (↑↑↓↓←→←→BA).
`;

  const fsRoot = D({
    bin: D(),
    etc: D({
      motd: F(() => motdText().join("\n") + "\n"),
      hostname: F("ting39\n"),
      "os-release": F(`NAME="T39 OS"\nVERSION="${VERSION} (Stellar)"\nID=t39\nPRETTY_NAME="T39 OS ${VERSION} (Stellar)"\nHOME_URL="https://ting39.github.io/"\n`),
      passwd: F("root:x:0:0:root:/root:/bin/t39sh\nting39:x:39:39:ting39:/home/ting39:/bin/t39sh\nguest:x:1000:1000:you!:/home/ting39:/bin/t39sh\n"),
      shells: F("/bin/t39sh\n"),
    }),
    home: D({
      ting39: D({
        "README.md": F(LF("README.md", `# welcome to ting39's home directory 👋

  about.txt      who's this
  projects/      things I've built    → open <name>
  blog/          posts                → blog
  music/         on repeat            → spotify play 1
  contact.txt    say hi

There are hidden files too. \`ls\` has a flag for that.
`)),
        "about.txt": F(LF("about.txt", `ting39
======
Hi, I'm ting39. This is my corner of the internet: a place for the
things I build, break and learn along the way.

likes   rhythm games and their music (lapix, Nhato, t+pazolite),
        Touhou and ZUN's soundtracks, hard and precise platformers,
        computer science and machine learning
site    plain HTML/CSS/JS on GitHub Pages, no build step for the page
        itself. You are currently inside it.
`)),
        "contact.txt": F("GitHub   https://github.com/ting39\n"),
        projects: D(),
        blog: D(),
        music: D(),
        ".secrets": F(SECRETS),
        ".t39shrc": F(() => Object.entries(aliases).map(([k, v]) => `alias ${k}='${v}'`).join("\n") + "\nexport EDITOR=vim   # bold choice\n"),
        ".t39sh_history": F(() => history.join("\n") + (history.length ? "\n" : "")),
      }),
    }),
    root: D({}, { locked: true }),
    tmp: D({}, { writable: true }),
    dev: D({
      null: F("", { sink: true }),
      zero: F(() => "\0".repeat(64) + "\n"),
      random: F(() => Array.from({ length: 6 }, () => Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => String.fromCharCode(33 + (b % 94))).join("")).join("\n") + "\n"),
    }),
    proc: D({
      cpuinfo: F(() => Array.from({ length: navigator.hardwareConcurrency || 1 }, (_, i) => `processor\t: ${i}\nmodel name\t: whatever your browser runs on\n`).join("\n")),
      meminfo: F(() => `MemTotal:\t${navigator.deviceMemory ? navigator.deviceMemory * 1048576 + " kB" : "unknown (your browser keeps it secret)"}\n`),
      uptime: F(() => `${(performance.now() / 1000).toFixed(2)} 0.00\n`),
      version: F(() => `T39 OS ${VERSION} (t39sh) running in ${browserInfo().browser} on ${browserInfo().os}\n`),
    }),
    var: D({ log: D({ "visits.log": F(() => logins.map((t) => `${t}  ${USER} opened t39sh`).join("\n") + "\n") }) }),
  });
  const home = fsRoot.children.home.children.ting39;
  for (const p of projects) home.children.projects.children[p.slug + ".md"] = F(projectText(p));

  function norm(path, base = cwd) {
    path = String(path);
    if (path === "~" || path.startsWith("~/")) path = HOME + path.slice(1);
    const out = [];
    for (const p of (path.startsWith("/") ? path : base + "/" + path).split("/")) {
      if (!p || p === ".") continue;
      if (p === "..") out.pop(); else out.push(p);
    }
    return "/" + out.join("/");
  }
  function getNode(abs) {
    let n = fsRoot;
    if (abs === "/") return n;
    for (const p of abs.slice(1).split("/")) {
      if (n.type !== "dir" || !Object.hasOwn(n.children, p)) return null;
      n = n.children[p];
    }
    return n;
  }
  const pretty = (abs) => (abs === HOME ? "~" : abs.startsWith(HOME + "/") ? "~" + abs.slice(HOME.length) : abs);
  const textCache = new Map();
  async function fetchText(url) {
    if (!textCache.has(url)) textCache.set(url, fetch(url, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); }));
    try { return await textCache.get(url); } catch (e) { textCache.delete(url); throw e; }
  }
  async function readPath(p, cmd) {
    const abs = norm(p), n = getNode(abs);
    if (!n) return { error: `${cmd}: ${p}: No such file or directory` };
    if (n.type === "dir") return { error: `${cmd}: ${p}: Is a directory` };
    if (n.binary) return { error: `${cmd}: ${p}: binary file (run it with \`${basename(abs)}\`, or read \`man ${basename(abs)}\`)` };
    try { return { text: String((typeof n.content === "function" ? await n.content() : n.content) ?? ""), abs }; }
    catch { return { error: `${cmd}: ${p}: Input/output error (are you offline?)` }; }
  }
  function writeFile(p, text, append) {
    const abs = norm(p), n = getNode(abs), parent = getNode(dirname(abs)), name = basename(abs);
    if (n && n.sink) return null;
    if (!parent || parent.type !== "dir") return `t39sh: ${p}: No such file or directory`;
    if (n && n.type === "dir") return `t39sh: ${p}: Is a directory`;
    if (!parent.writable) return `t39sh: ${p}: Read-only file system (only /tmp is writable)`;
    const prev = n && append && typeof n.content === "string" ? n.content : "";
    parent.children[name] = F(prev + text, { mtime: new Date() });
    return null;
  }

  function loadData() {
    const posting = Promise.resolve(SITE.getPosts ? SITE.getPosts() : fetch(site("posts.json")).then((r) => (r.ok ? r.json() : null)))
      .then((data) => {
        posts = ((data && data.posts) || []).filter((p) => /^[a-z0-9][a-z0-9-]*$/.test(p.slug || ""));
        for (const p of posts) home.children.blog.children[p.slug + ".md"] = F(() => fetchText(site(`posts/${p.slug}.md`)), { mtime: new Date(p.date), size: p.bytes });
      }).catch(() => {});
    const spinning = Promise.resolve(SITE.getSpotify ? SITE.getSpotify() : fetch(site("spotify.json")).then((r) => (r.ok ? r.json() : null)))
      .then((data) => {
        if (!data || !(data.tracks || []).length) return;
        music = data;
        home.children.music.children["on-repeat.txt"] = F(
          `# on repeat · ${data.range || "last 4 weeks"} · updated ${data.updated || "?"}\n\n` +
          data.tracks.map((t, i) => `${i + 1}. ${t.name} — ${t.artists}\n   ${t.url || ""}`).join("\n") +
          "\n\nplay one here with `spotify play <n>`.\n");
      }).catch(() => {});
    return Promise.race([Promise.allSettled([posting, spinning]), sleep(3000)]);
  }

  // ---------------------------------------------------------------- shell state
  let cwd = /\/blog\//.test(location.pathname) ? HOME + "/blog" : HOME, oldpwd = HOME, status = 0;
  const env = {
    USER, LOGNAME: USER, HOME, SHELL: "/bin/t39sh", TERM: "xterm-256color", PATH: "/bin", HOSTNAME: HOST,
    LANG: (navigator.language || "en-US").replace("-", "_") + ".UTF-8", EDITOR: "vim", PAGER: "less",
  };
  const aliases = { ll: "ls -l", la: "ls -a", l: "ls", "..": "cd ..", "...": "cd ../..", quit: "exit", logout: "exit", less: "cat", more: "cat" };
  let history = store.get("history", []);
  if (!Array.isArray(history)) history = [];
  let hIdx = history.length, draft = "";
  const logins = store.get("logins", []);
  const lastLogin = logins[logins.length - 1];
  let running = null, reader = null, keyHook = null, search = null, lastTab = null, motdShown = false;

  function varValue(name) {
    if (name === "?") return String(status);
    if (name === "PWD") return cwd;
    if (name === "OLDPWD") return oldpwd;
    if (name === "RANDOM") return String(Math.floor(Math.random() * 32768));
    if (name === "SECONDS") return String(Math.floor(performance.now() / 1000));
    if (name === "$") return "39";
    return Object.hasOwn(env, name) ? env[name] : "";
  }

  // ---------------------------------------------------------------- parser
  function expandVar(line, i) {
    if (line[i + 1] === "{") {
      const j = line.indexOf("}", i + 2);
      if (j < 0) throw new SyntaxError("bad substitution");
      return [varValue(line.slice(i + 2, j)), j + 1];
    }
    const m = line.slice(i + 1).match(/^(\?|\$|[A-Za-z_]\w*)/);
    return m ? [varValue(m[1]), i + 1 + m[1].length] : ["$", i + 1];
  }
  function tokenize(line) {
    const toks = [];
    let cur = null, i = 0;
    const push = () => { if (cur !== null) { toks.push({ t: "word", v: cur }); cur = null; } };
    while (i < line.length) {
      const ch = line[i];
      if (/\s/.test(ch)) { push(); i++; continue; }
      if (ch === "'") {
        const j = line.indexOf("'", i + 1);
        if (j < 0) throw new SyntaxError("unexpected EOF while looking for matching `''");
        cur = (cur ?? "") + line.slice(i + 1, j); i = j + 1; continue;
      }
      if (ch === '"') {
        let j = i + 1, s = "";
        while (j < line.length && line[j] !== '"') {
          if (line[j] === "\\" && /["\\$`]/.test(line[j + 1] || "")) { s += line[j + 1]; j += 2; continue; }
          if (line[j] === "$") { const [v, n] = expandVar(line, j); s += v; j = n; continue; }
          s += line[j++];
        }
        if (j >= line.length) throw new SyntaxError("unexpected EOF while looking for matching `\"'");
        cur = (cur ?? "") + s; i = j + 1; continue;
      }
      if (ch === "\\") { cur = (cur ?? "") + (line[i + 1] ?? ""); i += 2; continue; }
      if (ch === "$") { const [v, n] = expandVar(line, i); cur = (cur ?? "") + v; i = n; continue; }
      if (ch === "~" && cur === null && (i + 1 === line.length || /[\s/]/.test(line[i + 1]))) { cur = HOME; i++; continue; }
      if (ch === "#" && cur === null) break;
      const two = line.slice(i, i + 2);
      if (two === "&&" || two === "||" || two === ">>") { push(); toks.push({ t: "op", v: two }); i += 2; continue; }
      if ("|;>&".includes(ch)) { push(); toks.push({ t: "op", v: ch }); i++; continue; }
      cur = (cur ?? "") + ch; i++;
    }
    push();
    return toks;
  }
  function parse(line) {
    const toks = tokenize(line), chain = [];
    let pipeline = [], cmd = { argv: [], redir: null }, op = ";";
    const near = (t) => new SyntaxError(`syntax error near unexpected token \`${t}'`);
    const endCmd = (t) => { if (!cmd.argv.length) throw near(t); pipeline.push(cmd); cmd = { argv: [], redir: null }; };
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (t.t === "word") cmd.argv.push(t.v);
      else if (t.v === "|") endCmd("|");
      else if (t.v === ">" || t.v === ">>") {
        const f = toks[++i];
        if (!f || f.t !== "word") throw near(f ? f.v : "newline");
        cmd.redir = { file: f.v, append: t.v === ">>" };
      } else { endCmd(t.v); chain.push({ op, pipeline }); pipeline = []; op = t.v === "&" ? ";" : t.v; }
    }
    if (cmd.argv.length || pipeline.length) { endCmd("newline"); chain.push({ op, pipeline }); }
    else if (op === "&&" || op === "||") throw near("newline");
    return chain;
  }
  function opts(args, allowed) {
    const flags = {}, rest = [];
    let end = false;
    for (const a of args) {
      if (!end && a === "--") { end = true; continue; }
      if (!end && /^-[A-Za-z0-9]+$/.test(a)) for (const ch of a.slice(1)) { if (allowed.includes(ch)) flags[ch] = true; else flags.unknown ??= ch; }
      else rest.push(a);
    }
    return { flags, rest };
  }
  function nOpt(args, def = 10) {
    let n = def;
    const rest = [];
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "-n") n = parseInt(args[++i], 10);
      else if (/^-n\d+$/.test(a)) n = parseInt(a.slice(2), 10);
      else if (/^-\d+$/.test(a)) n = parseInt(a.slice(1), 10);
      else rest.push(a);
    }
    return { n: Number.isFinite(n) && n >= 0 ? n : def, rest };
  }
  async function inputLines(x, files, cmd) {
    if (!files.length) {
      if (x.stdin) return x.stdin;
      x.err(`${cmd}: no input (pipe something in, e.g. \`history | ${cmd}\`)`);
      return null;
    }
    const lines = [];
    for (const f of files) {
      const r = await readPath(f, cmd);
      if (r.error) { x.err(r.error); return null; }
      lines.push(...r.text.replace(/\n$/, "").split("\n"));
    }
    return lines;
  }
  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }

  // ---------------------------------------------------------------- site targets
  const SECTIONS = ["top", "about", "projects", "music", "contact"];
  function resolveTarget(raw) {
    const t = basename(String(raw).replace(/\/+$/, "")).replace(/\.md$/, "").toLowerCase();
    if (/^https?:\/\//i.test(raw)) return { url: raw, label: raw };
    const p = projects.find((q) => q.slug === t) || projects.find((q) => q.slug.startsWith(t) || q.title.toLowerCase().startsWith(t));
    if (p && t) return { url: p.link || p.repo, label: p.title, project: p };
    const post = posts.find((q) => q.slug === t);
    if (post) return { url: site(post.url || `blog/${post.slug}/`), label: post.title, same: true };
    if (t === "blog") return { url: site("blog/"), label: "the blog", same: true };
    if (t === "rss" || t === "feed") return { url: site("feed.xml"), label: "the Atom feed", same: true };
    if (SECTIONS.includes(t) || t === "home") return { section: t === "home" ? "top" : t };
    if (t === "github") return { url: "https://github.com/ting39", label: "ting39 on GitHub" };
    if (t === "source" || t === "repo") return { url: "https://github.com/ting39/ting39.github.io", label: "this site's source" };
    return null;
  }
  function launch(x, r) {
    if (!r.url) { x.err("open: that project has no link yet"); return 1; }
    if (r.same) { x.out(`→ ${r.label}`); setTimeout(() => (location.href = r.url), 250); return 0; }
    const w = window.open(r.url, "_blank");
    if (w) { w.opener = null; x.html(`opening ${esc(r.label)} in a new tab… ${c.dim(r.url)}`); }
    else x.html(`your browser blocked the pop-up. here's a link: ${link(r.url, r.label)}`);
    return 0;
  }

  // ---------------------------------------------------------------- commands
  const FORTUNES = [
    "Weeks of coding can save you hours of planning.",
    "There's no place like 127.0.0.1.",
    "A perfect run is just a hundred failed runs you didn't upload.",
    "The bug is never where you're looking. That's why it's still there.",
    "Full combo is a state of mind. So is 'it works on my machine'.",
    "Every hard platformer is secretly a rhythm game.",
    "Gradient descent: confidently walking downhill in the fog.",
    "If it compiles on the first try, be suspicious.",
    "Your model isn't overfitting. It's just very, very attached.",
    "Today's forecast: 100% chance of side projects.",
    "Read the error message. No, the whole error message.",
    "The best time to write tests was before the bug. The second best time is now.",
    "Somewhere, a BPM is waiting for you to match it.",
    "Off-by-one errors are the second hardest problem. Or the first.",
    "Lost a life? The checkpoint still believes in you.",
    "Sleep is a cache flush for the brain.",
    "A star is just a very patient explosion.",
    "The stack overflows; the stars do not.",
    "Practise the hard part slowly, and the easy part takes care of itself.",
    "Undocumented features are just secrets with good PR.",
    "There are 10 kinds of people: those who read binary and those who don't.",
    "Ship it, then make it beautiful. Then ship it again.",
    "Hit the note, not the button.",
    "The terminal is the only UI that has never asked you to accept cookies.",
    "Rest is part of the training loop.",
    "Somewhere between 'it's impossible' and 'it's trivial' lies the actual work.",
    "Every expert was once a beginner who refused to rage-quit.",
    "Comments lie. Code lies less. Tests tattle.",
  ];
  const LOGO = ["         ▄", "        ▐█▌", "       ▗███▖", "  ▄▄▄▄▄█████▄▄▄▄▄", "  ▀▀▀▀▀█████▀▀▀▀▀", "       ▝███▘", "        ▐█▌", "         ▀"];
  const LOGO_COLORS = ["#9b7bff", "#8a6dff", "#7c5cff", "#4f8cf0", "#22b8dc", "#00d2c8", "#00e0c6", "#2bf0d2"];

  const COMMANDS = {
    help: {
      group: "system", desc: "list commands", usage: "help [command]",
      run(x) {
        if (x.args[0]) return exec(["man", x.args[0]], x);
        const groups = {};
        for (const [name, cmd] of Object.entries(COMMANDS)) if (!cmd.hidden) (groups[cmd.group] ||= []).push(name);
        x.html(`${c.bold("t39sh " + VERSION)} ${c.dim(L("— ting39's terminal. Commands:"))}`);
        x.out("");
        const room = Math.max(24, x.cols - 11);
        for (const g of ["files", "site", "text", "system", "fun"]) {
          if (!groups[g]) continue;
          const rows = [[]];
          let len = 0;
          for (const n of groups[g]) { if (len && len + n.length + 2 > room) { rows.push([]); len = 0; } rows[rows.length - 1].push(n); len += n.length + 2; }
          rows.forEach((r, i) => x.html(`  ${i ? " ".repeat(8) : c.accent(pad(g, 8))} ${r.map((n) => c.green(n)).join("  ")}`));
        }
        x.out("");
        x.html(c.dim(L("  keys  Tab complete · ↑↓ history · Ctrl+R search · Ctrl+L clear · Ctrl+C cancel · Esc close")));
        x.html(c.dim(L("  try   ")) + ["neofetch", "cat about.txt", "spotify play 1", "man ls"].map((s) => c.yellow(s)).join(c.dim(" · ")));
        x.html(c.dim(L("  (a few things here aren't listed. curiosity is rewarded.)")));
      },
    },
    man: {
      group: "system", desc: "show the manual for a command", usage: "man <command>",
      complete: () => Object.keys(COMMANDS).filter((k) => !COMMANDS[k].hidden),
      run(x) {
        const name = x.args[0];
        if (!name) { x.err("What manual page do you want?\nFor example, try 'man ls'."); return 1; }
        if (name === "man") { x.out("man: a manual for manuals. you're using it right now. 📖"); return 0; }
        const cmd = COMMANDS[name] || (aliases[name] && COMMANDS[aliases[name].split(" ")[0]]);
        if (!cmd || cmd.hidden) { x.err(LT("noman", `No manual entry for ${name}`, { n: name })); return 16; }
        const title = `${name.toUpperCase()}(1)`;
        const gap = " ".repeat(Math.max(2, Math.floor((Math.min(x.cols, 64) - 2 * title.length - 12) / 2)));
        x.pre(`${c.bold(title)}${gap}${c.dim(L("t39sh manual"))}${gap}${c.bold(title)}`);
        x.out("");
        x.html(c.bold("NAME"));
        x.out(`       ${name} - ${L(cmd.desc)}${aliases[name] ? "  " + LT("alias", `(alias for '${aliases[name]}')`, { a: `'${aliases[name]}'` }) : ""}`);
        x.out("");
        x.html(c.bold("SYNOPSIS"));
        x.html(`       ${c.green(cmd.usage || name)}`);
        if (cmd.man) {
          x.out("");
          x.html(c.bold("DESCRIPTION"));
          for (const l of L(cmd.man).split("\n")) x.out("       " + l);
        }
        if (cmd.ex) {
          x.out("");
          x.html(c.bold("EXAMPLES"));
          for (const l of cmd.ex) x.html("       " + c.yellow(l));
        }
      },
    },
    ls: {
      group: "files", desc: "list directory contents", usage: "ls [-a] [-l] [-1] [path...]", files: true,
      man: "Lists files. Directories are blue with a trailing /, programs green.\n-a   include hidden files (there are some)\n-l   long format: permissions, owner, size, date\n-1   one entry per line",
      ex: ["ls -la", "ls ~/projects", "ls /bin | wc -l"],
      async run(x) {
        await ready;
        const { flags, rest } = opts(x.args, "al1h");
        if (flags.unknown) { x.err(`ls: invalid option -- '${flags.unknown}'`); return 2; }
        const targets = rest.length ? rest : ["."];
        let code = 0;
        for (const [k, t] of targets.entries()) {
          const abs = norm(t), n = getNode(abs);
          if (!n) { x.err(`ls: cannot access '${t}': No such file or directory`); code = 2; continue; }
          if (n.locked) { x.err(`ls: cannot open directory '${t}': Permission denied`); code = 2; continue; }
          if (targets.length > 1 && n.type === "dir") { if (k) x.out(""); x.out(t + ":"); }
          let entries = n.type === "dir"
            ? Object.keys(n.children).filter((nm) => flags.a || !nm.startsWith(".")).sort((a, b) => a.replace(/^\./, "").localeCompare(b.replace(/^\./, ""))).map((nm) => [nm, n.children[nm]])
            : [[t, n]];
          if (flags.a && n.type === "dir") entries = [[".", n], ["..", getNode(dirname(abs))], ...entries];
          if (flags.l) {
            if (n.type === "dir") x.out(`total ${entries.length}`);
            for (const [nm, e] of entries) x.pre(longLine(nm, e));
          } else if (!x.tty || flags["1"]) entries.forEach(([nm, e]) => x.html(fmtName(nm, e)));
          else columns(x, entries.map(([nm, e]) => ({ text: nm + (e.type === "dir" ? "/" : ""), html: fmtName(nm, e) })));
        }
        return code;
      },
    },
    cd: {
      group: "files", desc: "change directory", usage: "cd [dir | - | ~]", files: "dirs",
      async run(x) {
        await ready;
        if (x.args.length > 1) { x.err("cd: too many arguments"); return 1; }
        let t = x.args[0] ?? HOME;
        if (t === "-") { t = oldpwd; x.out(t); }
        const abs = norm(t), n = getNode(abs);
        if (!n) { x.err(`cd: ${t}: No such file or directory`); return 1; }
        if (n.type !== "dir") { x.err(`cd: ${t}: Not a directory`); return 1; }
        if (n.locked) { x.err(`cd: ${t}: Permission denied`); return 1; }
        oldpwd = cwd; cwd = abs;
      },
    },
    pwd: { group: "files", desc: "print working directory", usage: "pwd", run: (x) => x.out(cwd) },
    cat: {
      group: "files", desc: "print files", usage: "cat [-n] <file...>", files: true,
      ex: ["cat about.txt", "cat ~/blog/*.md   (well, no globs; try Tab)", "cat -n README.md"],
      async run(x) {
        await ready;
        const { flags, rest } = opts(x.args, "n");
        if (!rest.length) {
          if (!x.stdin) { x.err("cat: reading the keyboard isn't supported here; try `cat about.txt`"); return 1; }
          x.stdin.forEach((l, i) => x.out(flags.n ? String(i + 1).padStart(6) + "  " + l : l));
          return 0;
        }
        let code = 0, n = 0;
        for (const f of rest) {
          const r = await readPath(f, "cat");
          if (r.error) { x.err(r.error); code = 1; continue; }
          const md = /\.md$/.test(r.abs) && x.tty;
          let fence = false, front = r.text.startsWith("---\n");
          r.text.replace(/\n$/, "").split("\n").forEach((l, idx) => {
            const num = flags.n ? c.dim(String(++n).padStart(6) + "  ") : "";
            if (!md) return x.html(num + linkify(l));
            if (front) { x.html(num + c.dim(l)); if (idx > 0 && l === "---") front = false; return; }
            if (/^```/.test(l)) fence = !fence;
            x.html(num + (fence || /^```/.test(l) ? c.yellow(l) : /^#{1,6} /.test(l) ? c.accent(l) : /^> /.test(l) ? c.dim(l) : linkify(l)));
          });
        }
        return code;
      },
    },
    head: {
      group: "text", desc: "first lines of input", usage: "head [-n N] [file]", files: true,
      async run(x) { const { n, rest } = nOpt(x.args); const l = await inputLines(x, rest, "head"); if (!l) return 1; l.slice(0, n).forEach((s) => x.out(s)); },
    },
    tail: {
      group: "text", desc: "last lines of input", usage: "tail [-n N] [file]", files: true,
      async run(x) { const { n, rest } = nOpt(x.args); const l = await inputLines(x, rest, "tail"); if (!l) return 1; (n ? l.slice(-n) : []).forEach((s) => x.out(s)); },
    },
    grep: {
      group: "text", desc: "search for a pattern", usage: "grep [-i] [-v] [-n] [-c] <pattern> [file...]", files: true,
      man: "Prints lines matching a regular expression (JavaScript flavour).\n-i ignore case   -v invert   -n line numbers   -c count only",
      ex: ["grep -i touhou music/on-repeat.txt", "ls /bin | grep ^s", "history | grep cd"],
      async run(x) {
        const { flags, rest } = opts(x.args, "ivnc");
        const [pat, ...files] = rest;
        if (pat === undefined) { x.err("usage: grep [-ivnc] <pattern> [file...]"); return 2; }
        let re;
        try { re = new RegExp(pat, flags.i ? "gi" : "g"); } catch { re = new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags.i ? "gi" : "g"); }
        const src = await inputLines(x, files, "grep");
        if (!src) return 2;
        let count = 0;
        src.forEach((l, i) => {
          re.lastIndex = 0;
          if (re.test(l) === !!flags.v) return;
          count++;
          if (flags.c) return;
          let h = flags.n ? c.green(i + 1) + c.dim(":") : "", last = 0;
          re.lastIndex = 0;
          if (!flags.v) for (const m of l.matchAll(re)) { if (!m[0]) continue; h += esc(l.slice(last, m.index)) + c.match(m[0]); last = m.index + m[0].length; }
          x.html(h + esc(l.slice(last)));
        });
        if (flags.c) x.out(String(count));
        return count ? 0 : 1;
      },
    },
    wc: {
      group: "text", desc: "count lines, words, characters", usage: "wc [-l] [-w] [-c] [file]", files: true,
      async run(x) {
        const { flags, rest } = opts(x.args, "lwc");
        const l = await inputLines(x, rest, "wc");
        if (!l) return 1;
        const v = { l: l.length, w: l.join(" ").split(/\s+/).filter(Boolean).length, c: l.reduce((s, q) => s + [...q].length + 1, 0) };
        const pick = ["l", "w", "c"].filter((k) => flags[k]);
        x.out((pick.length ? pick : ["l", "w", "c"]).map((k) => String(v[k]).padStart(7)).join(" "));
      },
    },
    sort: {
      group: "text", desc: "sort lines", usage: "sort [-r] [-n] [-u] [file]", files: true,
      async run(x) {
        const { flags, rest } = opts(x.args, "rnu");
        let l = await inputLines(x, rest, "sort");
        if (!l) return 1;
        l = [...l].sort(flags.n ? (a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b) : (a, b) => a.localeCompare(b));
        if (flags.u) l = [...new Set(l)];
        (flags.r ? l.reverse() : l).forEach((s) => x.out(s));
      },
    },
    uniq: {
      group: "text", desc: "drop repeated adjacent lines", usage: "uniq [-c] [file]", files: true,
      async run(x) {
        const { flags, rest } = opts(x.args, "c");
        const l = await inputLines(x, rest, "uniq");
        if (!l) return 1;
        const out = [];
        for (const s of l) { if (out.length && out[out.length - 1][0] === s) out[out.length - 1][1]++; else out.push([s, 1]); }
        out.forEach(([s, n]) => x.out(flags.c ? String(n).padStart(7) + " " + s : s));
      },
    },
    rev: { group: "text", desc: "reverse each line", usage: "rev [file]", files: true, async run(x) { const l = await inputLines(x, x.args, "rev"); if (!l) return 1; l.forEach((s) => x.out([...s].reverse().join(""))); } },
    echo: {
      group: "text", desc: "print arguments", usage: "echo [-e] [text...]",
      run(x) {
        let a = x.args, e = false;
        while (a[0] === "-e" || a[0] === "-n") { e ||= a[0] === "-e"; a = a.slice(1); }
        let s = a.join(" ");
        if (e) s = s.replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\\\/g, "\\");
        x.out(s);
      },
    },
    tree: {
      group: "files", desc: "show a directory tree", usage: "tree [-a] [dir]", files: "dirs",
      async run(x) {
        await ready;
        const { flags, rest } = opts(x.args, "a");
        const t = rest[0] || ".", root = getNode(norm(t));
        if (!root || root.type !== "dir") { x.err(`tree: ${t}: not a directory`); return 1; }
        let dirs = 0, files = 0;
        x.html(c.blue(t === "." ? "." : t));
        const walk = (n, pre, depth) => {
          if (n.locked) return;
          const names = Object.keys(n.children).filter((k) => flags.a || !k.startsWith(".")).sort();
          names.forEach((nm, i) => {
            const e = n.children[nm], lastOne = i === names.length - 1;
            x.html(c.dim(pre + (lastOne ? "└── " : "├── ")) + fmtName(nm, e));
            if (e.type === "dir") { dirs++; if (depth < 6) walk(e, pre + (lastOne ? "    " : "│   "), depth + 1); } else files++;
          });
        };
        walk(root, "", 0);
        x.out("");
        x.out(`${plural(dirs, "directory").replace("directorys", "directories")}, ${plural(files, "file")}`);
      },
    },
    touch: {
      group: "files", desc: "create an empty file (in /tmp)", usage: "touch <file...>", files: true,
      async run(x) {
        let code = 0;
        for (const f of x.args) { if (getNode(norm(f))) continue; const e = writeFile(f, "", false); if (e) { x.err(e.replace("t39sh", "touch")); code = 1; } }
        if (!x.args.length) { x.err("touch: missing file operand"); return 1; }
        return code;
      },
    },
    mkdir: {
      group: "files", desc: "make a directory (in /tmp)", usage: "mkdir <dir...>", files: "dirs",
      run(x) {
        if (!x.args.length) { x.err("mkdir: missing operand"); return 1; }
        let code = 0;
        for (const f of opts(x.args, "p").rest) {
          const abs = norm(f), parent = getNode(dirname(abs)), name = basename(abs);
          if (getNode(abs)) { x.err(`mkdir: cannot create directory '${f}': File exists`); code = 1; }
          else if (!parent || parent.type !== "dir") { x.err(`mkdir: cannot create directory '${f}': No such file or directory`); code = 1; }
          else if (!parent.writable) { x.err(`mkdir: cannot create directory '${f}': Read-only file system (only /tmp is writable)`); code = 1; }
          else parent.children[name] = D({}, { writable: true, mtime: new Date() });
        }
        return code;
      },
    },
    rm: {
      group: "files", desc: "remove files (in /tmp)", usage: "rm [-r] [-f] <path...>", files: true,
      async run(x) {
        const { flags, rest } = opts(x.args, "rfiv");
        if (!rest.length) { x.err("rm: missing operand"); return 1; }
        if (rest.some((p) => p === "/" || p === "/*") && flags.r) return nuke(x);
        let code = 0;
        for (const p of rest) {
          const abs = norm(p), n = getNode(abs), parent = getNode(dirname(abs));
          if (!n) { if (!flags.f) { x.err(`rm: cannot remove '${p}': No such file or directory`); code = 1; } continue; }
          if (n.type === "dir" && !flags.r) { x.err(`rm: cannot remove '${p}': Is a directory`); code = 1; continue; }
          if (!parent || !parent.writable || abs === "/tmp") { x.err(`rm: cannot remove '${p}': Read-only file system${abs.startsWith(HOME) ? " (nice try)" : ""}`); code = 1; continue; }
          delete parent.children[basename(abs)];
          if (flags.v) x.out(`removed '${p}'`);
        }
        return code;
      },
    },
    open: {
      group: "site", desc: "open a project, post, section or URL", usage: "open <project | post | section | url>",
      complete: () => [...projects.map((p) => p.slug), ...posts.map((p) => p.slug), ...SECTIONS, "blog", "github", "source"],
      ex: ["open 2048", "open music", "open blog", "open github"],
      async run(x) {
        await ready;
        const t = x.args[0];
        if (!t) { x.err("usage: open <project | post | section | url>"); x.html(c.dim("  projects: ") + projects.map((p) => c.green(p.slug)).join(" ") + c.dim("   sections: ") + SECTIONS.join(" ")); return 1; }
        const r = resolveTarget(t);
        if (!r) { x.err(`open: ${t}: no such project, post or section (try \`ls ~/projects\`)`); return 1; }
        if (r.section) { x.out(`→ #${r.section}`); setTimeout(() => { api.close(); SITE.scrollTo ? SITE.scrollTo(r.section) : (location.hash = r.section); }, 200); return 0; }
        return launch(x, r);
      },
    },
    play: {
      group: "site", desc: "play a game, or a song by number", usage: "play [game | <n>]",
      complete: () => projects.filter((p) => (p.tags || []).includes("game")).map((p) => p.slug),
      async run(x) {
        const t = x.args[0];
        if (/^\d+$/.test(t || "")) return exec(["spotify", "play", t], x);
        const games = projects.filter((p) => (p.tags || []).includes("game"));
        if (!t) {
          if (!games.length) { x.out("no games yet. soon."); return 0; }
          x.out("games:");
          games.forEach((g) => x.html(`  ${g.emoji || "🎮"} ${c.green(pad(g.slug, 12))} ${esc(g.title)}`));
          x.html(c.dim("play one with `play <name>`; `play 1` plays song #1."));
          return 0;
        }
        const r = resolveTarget(t);
        if (!r || !r.project) { x.err(`play: ${t}: no such game`); return 1; }
        return launch(x, r);
      },
    },
    projects: {
      group: "site", desc: "list projects (optionally by tag)", usage: "projects [tag]",
      complete: () => [...new Set(projects.flatMap((p) => p.tags || []))],
      run(x) {
        const tag = x.args[0];
        const list = tag ? projects.filter((p) => (p.tags || []).includes(tag)) : projects;
        if (!list.length) { x.out(tag ? `no projects tagged #${tag}` : "no projects yet."); return tag ? 1 : 0; }
        for (const p of list) {
          x.html(`${esc(p.emoji || "✦")} ${c.bold(p.title)} ${c.dim("(" + p.slug + ")")}`);
          x.out("   " + ((p.i18n && p.i18n[LANG()] && p.i18n[LANG()].description) || p.description || ""));
          x.html("   " + (p.tags || []).map((t) => c.cyan("#" + t)).join(" ") + (p.link ? "  " + link(p.link, "live ↗") : "") + (p.repo ? "  " + link(p.repo, "code ↗") : ""));
        }
        x.html(c.dim(`${plural(list.length, "project")} · open one with \`open <name>\``));
      },
    },
    blog: {
      group: "site", desc: "list or open blog posts", usage: "blog [list | open <post> | latest | tags | rss]",
      complete: (i) => (i === 0 ? ["list", "open", "latest", "tags", "rss"] : posts.map((p) => p.slug)),
      async run(x) {
        await ready;
        const [sub = "list", arg] = x.args;
        if (sub === "rss" || sub === "feed") { x.html(`Atom feed: ${link(site("feed.xml"))}`); return 0; }
        if (!posts.length) { x.out("no posts yet. (the blog is warming up.)"); return 0; }
        if (sub === "list" || sub === "ls") {
          const tag = arg;
          const list = tag ? posts.filter((p) => (p.tags || []).includes(tag)) : posts;
          for (const p of list) x.html(`${c.dim(p.date)}  ${c.bold(p.title)} ${c.dim("· " + (p.readingTime || "?") + " min")}  ${(p.tags || []).map((t) => c.cyan("#" + t)).join(" ")}\n${" ".repeat(12)}${c.green(p.slug)}`);
          x.html(c.dim("read with `cat ~/blog/<post>.md`, or `blog open <post>` for the pretty version."));
          return 0;
        }
        if (sub === "tags") { const n = {}; posts.forEach((p) => (p.tags || []).forEach((t) => (n[t] = (n[t] || 0) + 1))); Object.entries(n).sort((a, b) => b[1] - a[1]).forEach(([t, k]) => x.html(`${c.cyan(pad("#" + t, 16))} ${k}`)); return 0; }
        if (sub === "latest") return launch(x, { url: site(posts[0].url || `blog/${posts[0].slug}/`), label: posts[0].title, same: true });
        if (sub === "open" || sub === "read") {
          const p = posts.find((q) => q.slug === (arg || "").replace(/\.md$/, ""));
          if (!p) { x.err(`blog: no post called '${arg || ""}'`); return 1; }
          return launch(x, { url: site(p.url || `blog/${p.slug}/`), label: p.title, same: true });
        }
        x.err(`blog: unknown subcommand '${sub}'`); return 1;
      },
    },
    spotify: {
      group: "site", desc: "ting39's top 5 on repeat; play them here", usage: "spotify [list | play <n> | pause | resume | open <n>]",
      complete: (i) => (i === 0 ? ["list", "play", "pause", "resume", "open"] : ["1", "2", "3", "4", "5"]),
      ex: ["spotify", "spotify play 2", "spotify pause"],
      async run(x) {
        await ready;
        if (!music) { x.err("spotify: no data (spotify.json didn't load)"); return 1; }
        const [sub = "list", arg] = x.args, tr = music.tracks;
        const pick = () => { const n = parseInt(arg, 10); if (!(n >= 1 && n <= tr.length)) { x.err(`spotify: pick a song 1-${tr.length}`); return null; } return n - 1; };
        const st = SITE.nowPlaying ? SITE.nowPlaying() : null;
        if (sub === "list" || sub === "ls") {
          x.html(`${c.green("●")} ${c.bold("on repeat")} ${c.dim(`· ${music.range || "last 4 weeks"} · updated ${music.updated || "?"}`)}`);
          tr.forEach((t, i) => {
            const on = st && st.index === i;
            x.html(`${on ? c.green(st.paused ? " ❚❚" : " ▶ ") : "   "}${c.dim(String(i + 1))}  ${on ? c.green(t.name) : c.bold(t.name)} ${c.dim("— " + t.artists)}`);
          });
          x.html(c.dim("play one: `spotify play <n>` · the player appears in the music section"));
          return 0;
        }
        if (sub === "play") {
          const i = arg ? pick() : 0;
          if (i == null) return 1;
          if (!SITE.playTrack || !SITE.playTrack(i)) { x.err("spotify: the player isn't available on this page"); return 1; }
          x.html(`${c.green("♪")} playing #${i + 1}: ${c.bold(tr[i].name)} ${c.dim("— " + tr[i].artists)}`);
          x.html(c.dim("  (the Spotify player is in the 'on repeat' section; `open music` to see it)"));
          return 0;
        }
        if (sub === "pause" || sub === "resume" || sub === "toggle") {
          if (!st) { x.err("spotify: nothing is playing. try `spotify play 1`"); return 1; }
          if ((sub === "pause") === !st.paused || sub === "toggle") SITE.togglePlay();
          x.out(sub === "pause" ? "paused." : "resumed.");
          return 0;
        }
        if (sub === "open") { const i = pick(); if (i == null) return 1; return launch(x, { url: tr[i].url, label: tr[i].name + " on Spotify" }); }
        x.err(`spotify: unknown subcommand '${sub}'`); return 1;
      },
    },
    theme: {
      group: "site", desc: "switch the site (or terminal) theme", usage: "theme [light | dark | toggle]  ·  theme term [default | amber | green]",
      complete: (i, w) => (i === 0 ? ["light", "dark", "toggle", "term"] : w[0] === "term" ? ["default", "amber", "green"] : []),
      run(x) {
        const [t, u] = x.args, cur = document.documentElement.dataset.theme === "light" ? "light" : "dark";
        if (!t) { x.out(`site theme: ${cur}   terminal: ${win.dataset.crt || "default"}`); return 0; }
        if (t === "term") {
          if (!["default", "amber", "green"].includes(u || "")) { x.err("usage: theme term [default | amber | green]"); return 1; }
          if (u === "default") delete win.dataset.crt; else win.dataset.crt = u;
          store.set("crt", u);
          x.out(u === "amber" ? "warming up the phosphor… 🟧" : u === "green" ? "wake up, guest… 🟩" : "back to normal.");
          return 0;
        }
        const next = t === "toggle" ? (cur === "light" ? "dark" : "light") : t;
        if (next !== "light" && next !== "dark") { x.err(`theme: unknown theme '${t}' (light, dark, toggle, term)`); return 1; }
        SITE.setTheme ? SITE.setTheme(next) : (document.documentElement.dataset.theme = next);
        x.out(next === "light" ? "☀  lights on." : "☾  lights off.");
      },
    },
    pet: {
      group: "site", desc: "interact with the homepage pet", usage: "pet [status | pat | feed | name <name> | sleep | wake | hide | show]",
      complete: (i) => (i === 0 ? ["status", "pat", "feed", "name", "sleep", "wake", "hide", "show", "dance"] : []),
      async run(x) {
        if (!window.PET || !window.PET.command) { x.out("there's no pet here (yet). 🥚"); return 1; }
        const r = await window.PET.command(x.args);
        for (const l of [].concat(r && r.lines ? r.lines : r || [])) x.out(l);
        return r && r.code ? r.code : 0;
      },
    },
    warp: {
      group: "fun", desc: "engage the starfield's warp drive", usage: "warp [seconds]",
      run(x) {
        if (reduced) { x.out("warp: disabled (prefers-reduced-motion). the stars thank you."); return 0; }
        if (!SITE.warp) { x.err("warp: no starfield on this page"); return 1; }
        const s = Math.min(10, Math.max(1, parseFloat(x.args[0]) || 3));
        x.out(`engaging warp drive for ${s}s… press \` to come back.`);
        setTimeout(() => { api.close(); SITE.warp(s * 1000); }, 350);
      },
    },
    whoami: { group: "system", desc: "print your user name", usage: "whoami", run: (x) => x.out(USER) },
    id: { group: "system", desc: "print user and group ids", usage: "id", run: (x) => x.out(`uid=1000(${USER}) gid=1000(${USER}) groups=1000(${USER}),39(stargazers),5(rhythm-gamers)`) },
    hostname: { group: "system", desc: "print the host name", usage: "hostname", run: (x) => x.out(location.hostname === "ting39.github.io" ? "ting39.github.io" : `ting39 (${location.hostname || "file"})`) },
    uname: {
      group: "system", desc: "print system information", usage: "uname [-a]",
      run(x) { const b = browserInfo(); x.out(x.args.includes("-a") ? `T39OS ting39 ${VERSION} #39 SMP ${fmtDate(booted)} web ${b.browser.replace(" ", "/")} ${b.os}` : "T39OS"); },
    },
    uptime: {
      group: "system", desc: "how long this page has been open", usage: "uptime",
      run(x) {
        const n = new Date(), up = performance.now(), l = () => (Math.random() * 0.39).toFixed(2);
        x.out(` ${n.toTimeString().slice(0, 8)} up ${up < 60000 ? plural(Math.round(up / 1000), "sec") : ago(up)},  1 user,  load average: ${l()}, ${l()}, ${l()}`);
      },
    },
    date: {
      group: "system", desc: "print the date", usage: "date [-u]",
      run(x) {
        const d = new Date(), utc = x.args.includes("-u");
        x.out(fmtDate(d, utc ? "UTC" : undefined));
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!utc && tz !== "Asia/Taipei") x.html(c.dim(`(ting39's clock in Taipei: ${fmtDate(d, "Asia/Taipei")})`));
      },
    },
    cal: {
      group: "system", desc: "show this month's calendar", usage: "cal",
      run(x) {
        const d = new Date(), y = d.getFullYear(), m = d.getMonth();
        const title = `${d.toLocaleString("en-US", { month: "long" })} ${y}`;
        x.pre(" ".repeat(Math.floor((20 - title.length) / 2)) + c.bold(title));
        x.pre(c.dim("Su Mo Tu We Th Fr Sa"));
        const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
        let row = "   ".repeat(first);
        for (let k = 1; k <= days; k++) {
          const s = String(k).padStart(2);
          row += (k === d.getDate() ? `<span class="t-inv">${s}</span>` : s) + " ";
          if ((first + k) % 7 === 0 || k === days) { x.pre(row.trimEnd()); row = ""; }
        }
      },
    },
    neofetch: {
      group: "system", desc: "system info, with style", usage: "neofetch",
      async run(x) {
        await ready;
        const b = browserInfo(), dpr = devicePixelRatio || 1, st = SITE.nowPlaying && SITE.nowPlaying();
        const theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
        const rows = [
          `${c.accent(USER)}@${c.accent(HOST)}`,
          c.dim("-".repeat(USER.length + HOST.length + 1)),
          ["OS", `T39 OS ${VERSION} (Stellar) on ${b.os}`],
          ["Host", location.hostname === "ting39.github.io" ? "ting39.github.io (GitHub Pages)" : `${location.host || "local file"} (dev)`],
          ["Kernel", b.browser],
          ["Uptime", ago(performance.now())],
          ["Packages", `${plural(projects.length, "project")}, ${plural(posts.length, "post")}, ${music ? music.tracks.length : 0} songs`],
          ["Shell", `t39sh ${VERSION}`],
          ["Resolution", `${screen.width}x${screen.height}${dpr !== 1 ? ` @${+dpr.toFixed(2)}x` : ""}`],
          ["Theme", `Starfield [${theme}]${win.dataset.crt ? `, CRT ${win.dataset.crt}` : ""}`],
          ["Terminal", `t39sh (${x.cols}x${termRows()})`],
          ["CPU", navigator.hardwareConcurrency ? plural(navigator.hardwareConcurrency, "core") : "unknown"],
          ["Memory", navigator.deviceMemory ? `≥ ${navigator.deviceMemory} GiB` : "unknown (your browser keeps it secret)"],
          ["Locale", `${navigator.language || "?"} · ${Intl.DateTimeFormat().resolvedOptions().timeZone || "?"}`],
          ["Logins", `${logins.length}${lastLogin ? ` (last: ${shortDate(new Date(lastLogin))})` : " (welcome!)"}`],
          music && (st ? ["Now playing", `${music.tracks[st.index].name}${st.paused ? " (paused)" : ""}`] : ["On repeat", `${music.tracks[0].name} — ${music.tracks[0].artists}`]),
          "",
          ["#7c5cff", "#ff4fa3", "#00e0c6", "#ffd166", "#7aa2ff", "#5af2a5", "#ff6b81", "#e8e8f0"].map((col) => `<span class="t39-blk" style="background:${col}"></span>`).join(""),
        ].filter((r) => r !== null && r !== undefined && r !== false)
          .map((r) => (Array.isArray(r) ? `${c.accent(r[0])}: ${esc(r[1])}` : r));
        const logo = LOGO.map((l, i) => `<span style="color:${LOGO_COLORS[i]}">${esc(pad(l, 19))}</span>`);
        const blank = " ".repeat(19);
        if (x.cols < 62) { logo.forEach((l) => x.pre(l)); x.out(""); rows.forEach((r) => x.pre(r)); return; }
        const top = 2;
        for (let i = 0; i < Math.max(rows.length, LOGO.length + top); i++) x.pre(`${i >= top && logo[i - top] ? logo[i - top] : blank}  ${rows[i] || ""}`);
      },
    },
    history: {
      group: "system", desc: "show command history", usage: "history [n | -c]",
      run(x) {
        if (x.args[0] === "-c") { history = []; hIdx = 0; store.set("history", history); return 0; }
        const n = parseInt(x.args[0], 10);
        const start = n > 0 ? Math.max(0, history.length - n) : 0;
        history.slice(start).forEach((h, i) => x.html(`${c.dim(String(start + i + 1).padStart(5))}  ${esc(h)}`));
      },
    },
    clear: { group: "system", desc: "clear the screen (Ctrl+L)", usage: "clear", run() { outEl.replaceChildren(); } },
    exit: { group: "system", desc: "close the terminal (Esc)", usage: "exit", run() { setTimeout(() => api.close(), 60); } },
    env: { group: "system", desc: "print environment variables", usage: "env", run(x) { Object.keys(env).sort().forEach((k) => x.out(`${k}=${env[k]}`)); x.out(`PWD=${cwd}`); } },
    export: {
      group: "system", desc: "set an environment variable", usage: "export NAME=value",
      run(x) {
        if (!x.args.length) return exec(["env"], x);
        for (const a of x.args) { const m = a.match(/^([A-Za-z_]\w*)=(.*)$/s); if (!m) { x.err(`export: \`${a}': not a valid identifier`); return 1; } setVar(m[1], m[2], x); }
      },
    },
    alias: {
      group: "system", desc: "list or define aliases", usage: "alias [name='command']",
      run(x) {
        if (!x.args.length) { Object.entries(aliases).forEach(([k, v]) => x.out(`alias ${k}='${v}'`)); return 0; }
        for (const a of x.args) {
          const m = a.match(/^([^\s=]+)=(.+)$/s);
          if (!m) { if (aliases[a]) x.out(`alias ${a}='${aliases[a]}'`); else { x.err(`alias: ${a}: not found`); return 1; } continue; }
          if (m[1] === m[2].split(" ")[0]) { x.err("alias: let's not make a loop"); return 1; }
          aliases[m[1]] = m[2];
        }
      },
    },
    which: {
      group: "system", desc: "locate a command", usage: "which <command...>",
      complete: () => Object.keys(COMMANDS).filter((k) => !COMMANDS[k].hidden),
      run(x) {
        let code = 0;
        for (const n of x.args) {
          if (aliases[n]) x.out(`${n}: aliased to ${aliases[n]}`);
          else if (COMMANDS[n] && !COMMANDS[n].hidden) x.out(`/bin/${n}`);
          else { x.err(`${n} not found`); code = 1; }
        }
        return code;
      },
    },
    ps: {
      group: "system", desc: "list running processes", usage: "ps",
      run(x) {
        const t = hms(performance.now());
        const procs = [[1, "?", t, "init (index.html)"], [7, "?", t, "starfield"], [39, "pts/0", "00:00:00", "t39sh"]];
        if (document.getElementById("spotify-iframe-api")) procs.push([140, "?", "00:00:01", "spotify-embed"]);
        if (window.PET) procs.push([256, "?", t, `pet${window.PET.name ? " (" + window.PET.name + ")" : ""}`]);
        procs.push([420, "pts/0", "00:00:00", "ps"]);
        x.pre(c.bold("  PID TTY      TIME     CMD"));
        procs.forEach(([p, tty, tm, cmd]) => x.out(`${String(p).padStart(5)} ${pad(tty, 8)} ${tm} ${cmd}`));
      },
    },
    calc: {
      group: "fun", desc: "a calculator", usage: "calc <expression>",
      man: "Evaluates arithmetic: + - * / % ^ (or **), parentheses, and\nsqrt sin cos tan asin acos atan log ln log2 log10 exp abs floor ceil round min max pow,\nconstants pi e tau phi, and `ans` for the last result.",
      ex: ["calc 2^10", "calc sqrt(2) * pi", "echo '6*7' | calc"],
      run(x) {
        const exprs = x.args.length ? [x.args.join(" ")] : x.stdin || [];
        if (!exprs.length) { x.err("usage: calc <expression>"); return 1; }
        for (const e of exprs) {
          if (!e.trim()) continue;
          try { calcAns = calc(e); x.out(String(Number.isInteger(calcAns) ? calcAns : +calcAns.toPrecision(12))); }
          catch (err) { x.err(`calc: ${err.message}`); return 1; }
        }
      },
    },
    fortune: { group: "fun", desc: "a random saying", usage: "fortune", run: (x) => x.out(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]) },
    cowsay: {
      group: "fun", desc: "a talking robot says things", usage: "cowsay <text>  (or pipe text in)",
      ex: ["cowsay hello", "fortune | cowsay", "fortune | cowsay | lolcat"],
      run(x) {
        const text = (x.args.length ? x.args.join(" ") : (x.stdin || []).join(" ")) || "moo? I'm a robot.";
        const words = text.split(/\s+/), lines = [];
        let cur = "";
        for (const w of words) { if (cur && wcw(cur + " " + w) > 38) { lines.push(cur); cur = w; } else cur = cur ? cur + " " + w : w; }
        lines.push(cur);
        const w = Math.max(...lines.map(wcw));
        x.pre(esc(" " + "_".repeat(w + 2)));
        lines.forEach((l, i) => {
          const [a, b] = lines.length === 1 ? ["<", ">"] : i === 0 ? ["/", "\\"] : i === lines.length - 1 ? ["\\", "/"] : ["|", "|"];
          x.pre(esc(`${a} ${pad(l, w)} ${b}`));
        });
        x.pre(esc(" " + "-".repeat(w + 2)));
        for (const l of ["    \\    .-----.", "     \\   | ◕ ◕ |", "         |  ▿  |", "         '--+--'", "          /|_|\\", "           / \\"]) x.pre(esc(l));
      },
    },
    lolcat: {
      group: "fun", desc: "rainbow-ify text", usage: "lolcat <text>  (or pipe text in)",
      run(x) {
        const lines = x.args.length ? [x.args.join(" ")] : x.stdin;
        if (!lines) { x.err("lolcat: pipe something in, e.g. `fortune | lolcat`"); return 1; }
        const off = Math.random() * 360, L = document.documentElement.dataset.theme === "light" && !win.dataset.crt ? 40 : 66;
        lines.forEach((l, i) => x.pre([...l].map((ch, k) => `<span style="color:hsl(${(off + i * 12 + k * 7) % 360} 85% ${L}%)">${esc(ch)}</span>`).join("")));
      },
    },
    sl: {
      group: "fun", desc: "steam locomotive (for when you mistype ls)", usage: "sl",
      async run(x) {
        const scr = x.screen();
        const art = (f) => [
          f % 4 < 2 ? "     (  ) (@@) ( )  (@)" : "    (@@)  ( ) (@@) ( )",
          f % 4 < 2 ? "   (@)" : "  ( )",
          "    _____",
          " __|_t39_|___________ ________________ ________________",
          "|  ___   ✦  ✦  ✦  ✦  | |  ♪   ♪   ♪   | |  >_  >_  >_  |",
          "| |___|             |-|               |-|               |",
          "|___________________| |_______________| |_______________|",
          f % 2 ? "  (o)  (o)    (o) (o)   (o)       (o)   (o)       (o)" : "  (O)  (O)    (O) (O)   (O)       (O)   (O)       (O)",
        ];
        if (!scr) { art(0).forEach((l) => x.out(l)); return 0; }
        const w = Math.max(...art(0).map((l) => l.length));
        for (let f = 0, pos = x.cols; pos > -w; f++, pos -= 2) {
          scr.textContent = art(f).map((l) => (pos >= 0 ? " ".repeat(pos) + l : l.slice(-pos)).slice(0, x.cols)).join("\n");
          scrollDown();
          await x.sleep(reduced ? 0 : 45);
          if (reduced) break;
        }
        if (!reduced) scr.remove();
        x.html(c.dim("(you meant `ls`, right? 🚂)"));
      },
    },
    matrix: {
      group: "fun", desc: "follow the white rabbit (any key stops)", usage: "matrix",
      async run(x) {
        const scr = x.screen();
        if (!scr) { x.out("matrix: needs a screen"); return 1; }
        const cv = document.createElement("canvas"), W = Math.max(200, outEl.clientWidth - 4), H = Math.min(320, Math.max(160, bodyEl.clientHeight - 90));
        const dpr = Math.min(devicePixelRatio || 1, 2);
        cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; cv.className = "t39-matrix";
        scr.appendChild(cv); scrollDown();
        const g = cv.getContext("2d"); g.scale(dpr, dpr);
        const fs = 14, cols = Math.floor(W / fs), drops = Array.from({ length: cols }, () => Math.random() * -20);
        const glyphs = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789T39✦";
        const light = document.documentElement.dataset.theme === "light" && !win.dataset.crt;
        let stop = false;
        x.onKey(() => (stop = true));
        scr.addEventListener("pointerdown", () => (stop = true));
        g.font = `${fs}px "JetBrains Mono", monospace`;
        const t0 = performance.now();
        while (!stop && performance.now() - t0 < 20000) {
          g.fillStyle = light ? "rgba(250,250,255,.18)" : "rgba(5,5,12,.16)";
          g.fillRect(0, 0, W, H);
          for (let i = 0; i < cols; i++) {
            const ch = glyphs[Math.floor(Math.random() * glyphs.length)], y = drops[i] * fs;
            g.fillStyle = light ? "#118a57" : Math.random() < 0.08 ? "#e8fff8" : i % 7 ? "#00e0c6" : "#7c5cff";
            g.fillText(ch, i * fs, y);
            if (y > H && Math.random() > 0.975) drops[i] = 0;
            drops[i] += 1;
          }
          if (reduced) break;
          await x.sleep(55);
        }
        if (!reduced) scr.remove();
        x.html(c.dim("wake up, guest…"));
      },
    },
    bpm: {
      group: "fun", desc: "tap tempo: measure a beat's BPM", usage: "bpm",
      man: "Tap any key (or the box) along to a song; t39sh tells you the tempo.\nq ends it. Try it with `spotify play 1` running.",
      async run(x) {
        const scr = x.screen();
        if (!scr) { x.err("bpm: needs a screen"); return 1; }
        scr.innerHTML = `<button type="button" class="t39-bpm"><b>---</b><span>BPM</span><i></i><small>tap any key to the beat · q to finish</small></button>`;
        scrollDown();
        const box = scr.firstChild, num = box.querySelector("b"), dot = box.querySelector("i"), small = box.querySelector("small");
        const taps = [];
        let done;
        const finished = new Promise((r) => (done = r));
        const tap = () => {
          const t = performance.now();
          if (taps.length && t - taps[taps.length - 1] > 2000) taps.length = 0;
          taps.push(t);
          if (taps.length > 16) taps.shift();
          dot.classList.remove("on"); void dot.offsetWidth; dot.classList.add("on");
          if (taps.length > 1) num.textContent = Math.round(60000 / ((taps[taps.length - 1] - taps[0]) / (taps.length - 1)));
          small.textContent = `${plural(taps.length, "tap")} · q to finish`;
        };
        x.onKey((e) => { if (e.key === "q" || e.key === "Q" || e.key === "Enter" && taps.length > 3) done(); else if (!e.repeat) tap(); });
        box.addEventListener("pointerdown", (e) => { e.preventDefault(); tap(); });
        x.signal.addEventListener("abort", done, { once: true });
        await finished;
        const bpm = parseInt(num.textContent, 10);
        box.disabled = true;
        if (!bpm) { x.out("no tempo detected. (tap at least twice)"); return 0; }
        const feel = bpm < 90 ? "laid-back: lo-fi, ballads" : bpm < 126 ? "house / pop territory" : bpm < 150 ? "trance & techno" : bpm < 180 ? "drum'n'bass, hardcore, rhythm-game mid-boss"
          : bpm < 230 ? "speedcore-adjacent. a rhythm-game final boss" : "…are you okay? 🔥";
        x.html(`${c.accent("≈ " + bpm + " BPM")}  ${c.dim(feel)}`);
      },
    },
    ping: {
      group: "fun", desc: "measure latency to a host (over HTTPS)", usage: "ping [host]",
      async run(x) {
        const host = (x.args[0] || "ting39.github.io").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
        if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host) && host !== "localhost") { x.err(`ping: ${host}: Name or service not known`); return 2; }
        const same = host === location.hostname;
        x.out(`PING ${host}: 4 probes over HTTPS (browsers can't send ICMP)`);
        const times = [];
        for (let i = 0; i < 4; i++) {
          const ac = new AbortController(), t0 = performance.now();
          const kill = () => ac.abort();
          x.signal.addEventListener("abort", kill, { once: true });
          const to = setTimeout(kill, 3000);
          try {
            await fetch(same ? `${location.pathname}?ping=${Date.now()}` : `https://${host}/favicon.ico?t39=${Date.now()}`, { mode: same ? "same-origin" : "no-cors", cache: "no-store", signal: ac.signal });
            const ms = performance.now() - t0; times.push(ms);
            x.out(`reply from ${host}: seq=${i} time=${ms.toFixed(1)} ms`);
          } catch {
            if (x.signal.aborted) throw ABORT;
            x.out(`request timeout for seq=${i}`);
          } finally { clearTimeout(to); x.signal.removeEventListener("abort", kill); }
          if (i < 3) await x.sleep(Math.max(0, 1000 - (performance.now() - t0)));
        }
        x.out(`--- ${host} ping statistics ---`);
        x.out(`4 probes sent, ${times.length} received, ${Math.round((1 - times.length / 4) * 100)}% loss`);
        if (times.length) x.out(`rtt min/avg/max = ${Math.min(...times).toFixed(1)}/${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(1)}/${Math.max(...times).toFixed(1)} ms`);
        return times.length ? 0 : 1;
      },
    },
    git: {
      group: "fun", desc: "this site's git history (live from GitHub)", usage: "git [log | status | clone | remote]",
      complete: (i) => (i === 0 ? ["log", "status", "clone", "remote", "push"] : []),
      async run(x) {
        const sub = x.args[0];
        const repo = "ting39/ting39.github.io";
        if (!sub) { x.out("usage: git [log | status | clone | remote]"); return 1; }
        if (sub === "status") { x.out("On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean"); return 0; }
        if (sub === "remote") { x.out(`origin\thttps://github.com/${repo}.git (fetch)\norigin\thttps://github.com/${repo}.git (push)`); return 0; }
        if (sub === "clone") { x.out("run this in a real terminal:"); x.html("  " + c.yellow(`git clone https://github.com/${repo}.git`)); return 0; }
        if (sub === "push" || sub === "commit") { x.err(`remote: Permission to ${repo}.git denied to ${USER}.\nfatal: unable to access 'https://github.com/${repo}.git/': The requested URL returned error: 403`); return 128; }
        if (sub !== "log") { x.err(`git: '${sub}' is not a git command here. See 'git' for the supported ones.`); return 1; }
        const n = Math.min(30, nOpt(x.args.slice(1), 10).n || 10);
        let commits;
        try {
          const key = "t39sh.gitlog";
          const cached = (() => { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } })();
          if (cached && Date.now() - cached.t < 600000) commits = cached.v;
          else {
            x.html(c.dim("fetching from api.github.com…"));
            const r = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=30`, { signal: x.signal });
            if (!r.ok) throw new Error(r.status === 403 ? "rate limited by GitHub, try again later" : "HTTP " + r.status);
            commits = (await r.json()).map((q) => ({ sha: q.sha, msg: q.commit.message.split("\n")[0], who: q.commit.author.name, when: q.commit.author.date }));
            try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v: commits })); } catch {}
          }
        } catch (e) {
          if (x.signal.aborted) throw ABORT;
          x.err(`git: couldn't reach GitHub (${e.message || "offline?"})`); return 1;
        }
        const oneline = x.args.includes("--oneline");
        commits.slice(0, n).forEach((q) => {
          if (oneline) { x.html(`${c.yellow(q.sha.slice(0, 7))} ${esc(q.msg)}`); return; }
          x.html(`${c.yellow("commit " + q.sha.slice(0, 7))} ${c.dim("· " + ago(Date.now() - new Date(q.when)) + " ago · " + q.who)}`);
          x.out("    " + q.msg);
        });
      },
    },
    sleep: { group: "system", desc: "wait n seconds (Ctrl+C to stop)", usage: "sleep <seconds>", async run(x) { const s = parseFloat(x.args[0]); if (!(s >= 0)) { x.err("sleep: missing operand"); return 1; } await x.sleep(Math.min(s, 600) * 1000); } },
    yes: {
      group: "fun", desc: "say y forever (Ctrl+C to stop)", usage: "yes [text]",
      async run(x) {
        const s = x.args.join(" ") || "y";
        for (let i = 0; ; i++) {
          if (x.signal.aborted) throw ABORT;
          x.out(s);
          if (x.tty && i % 12 === 11) await x.sleep(16);
          else if (!x.tty && i % 500 === 499) await sleep(0);
        }
      },
    },
    true: { group: "system", desc: "do nothing, successfully", usage: "true", hidden: true, run: () => 0 },
    false: { group: "system", desc: "do nothing, unsuccessfully", usage: "false", hidden: true, run: () => 1 },
    tty: { hidden: true, desc: "print the terminal name", run: (x) => x.out("/dev/pts/0") },
    reboot: {
      group: "system", desc: "restart t39sh", usage: "reboot",
      async run(x) {
        const steps = ["Stopping starfield", "Unmounting /home/ting39", "Syncing filesystems", "Reached target Reboot", "", "T39 OS " + VERSION + " (Stellar)", "Mounting /home/ting39", "Starting starfield", "Starting t39sh"];
        for (const s of steps) { x.html(s ? `${c.green("[  OK  ]")} ${esc(s)}` : ""); await x.sleep(reduced ? 0 : 170); }
        await x.sleep(300);
        outEl.replaceChildren(); cwd = HOME; motd();
      },
    },
    // --- hidden ones ---------------------------------------------------------
    sudo: {
      hidden: true, desc: "execute a command as root",
      async run(x) {
        const rest = x.args.join(" ").trim();
        if (!rest) { x.err("usage: sudo <command>"); return 1; }
        if (/^make me a sandwich$/i.test(rest)) { x.out("Okay. 🥪"); return 0; }
        if (/^rm\s+(-\w*r\w*\s+)+(\/|\/\*)$/.test(rest)) return nuke(x);
        for (let i = 0; i < 3; i++) {
          await x.readLine(`[sudo] password for ${USER}: `, { mask: true });
          await x.sleep(500);
          if (i < 2) x.err("Sorry, try again.");
        }
        x.err("sudo: 3 incorrect password attempts");
        x.err(`${USER} is not in the sudoers file. This incident will be reported.`);
        await x.sleep(900);
        x.html(c.dim("(reported to: nobody. your secret is safe with me. nothing you typed was kept.)"));
        return 1;
      },
    },
    please: {
      hidden: true, desc: "a politer sudo",
      run(x) {
        const rest = x.args.join(" ").trim();
        if (/^make me a sandwich$/i.test(rest) || !rest) { x.out(rest ? "Since you asked so nicely. 🥪" : "please… what?"); return 0; }
        if (/^rm\b/.test(rest)) { x.out("No. Not even if you ask nicely. 💜"); return 1; }
        return runLine(rest, x.signal);
      },
    },
    make: {
      hidden: true, desc: "build things",
      run(x) {
        const rest = x.args.join(" ");
        if (/^me a sandwich$/i.test(rest)) { x.err("What? Make it yourself."); return 1; }
        if (/coffee|tea/i.test(rest)) return exec(["brew", "coffee"], x);
        x.err(rest ? `make: *** No rule to make target '${x.args[0]}'.  Stop.` : "make: *** No targets specified and no makefile found.  Stop.");
        return 2;
      },
    },
    brew: { hidden: true, desc: "brew things", run(x) { if (/coffee/i.test(x.args.join(" "))) { x.err("HTTP 418: I'm a teapot. ☕ (RFC 2324)"); return 18; } x.err("brew: this is a web page; everything is already installed. ✨"); return 1; } },
    coffee: { hidden: true, desc: "", run: (x) => exec(["brew", "coffee"], x) },
    xyzzy: { hidden: true, desc: "", run: (x) => x.out("Nothing happens.") },
    hello: { hidden: true, desc: "", run: (x) => x.out(`hi there! 👋 I'm t39sh. type \`help\` to look around.`) },
    hi: { hidden: true, desc: "", run: (x) => exec(["hello"], x) },
    vim: { hidden: true, desc: "", run: (x) => editor(x) },
    vi: { hidden: true, desc: "", run: (x) => editor(x) },
    nano: { hidden: true, desc: "", run: (x) => x.out("nano: too easy. this shell only ships with vim. (try it, if you're brave)") },
    emacs: { hidden: true, desc: "", run: (x) => x.out("emacs: this browser only has room for one operating system, sorry.") },
    danmaku: { hidden: true, desc: "", run: (x) => danmaku(x) },
    shutdown: { hidden: true, desc: "", run(x) { x.out("System is going down for a nap. Good night ✦"); setTimeout(() => api.close(), 900); } },
  };
  // well-known commands that don't exist here get a helpful nudge instead of "command not found"
  const NUDGES = {
    "apt apt-get yum dnf pacman npm pip pip3 yarn pnpm cargo": "this computer is a web page; there's nothing to install. ✨",
    "python python3 node irb ghci": "no interpreters in here. `calc` does arithmetic, though.",
    "cp mv chmod chown ln": "Read-only file system (only /tmp is writable, e.g. `echo hi > /tmp/note`)",
    "curl wget": "no raw network access here, but `ping` works and `open <url>` opens links.",
    "ssh telnet": "you're already here. 🏠",
    "top htop kill killall": "try `ps`. and let's not kill anything.",
    "exit() quit() :q :wq :q!": "you're not in vim. (yet.) `exit` or Esc closes the terminal.",
    "cls": "this isn't cmd.exe, but sure: try `clear` (or Ctrl+L).",
    "dir": "this isn't cmd.exe, but sure: try `ls`.",
  };
  const nudgeFor = (n) => { for (const [k, v] of Object.entries(NUDGES)) if (k.split(" ").includes(n)) return v; return null; };
  for (const name of Object.keys(COMMANDS)) if (!COMMANDS[name].hidden) fsRoot.children.bin.children[name] = F("", { binary: true, exe: true });
  fsRoot.children.bin.children.t39sh = F("", { binary: true, exe: true });

  // ---------------------------------------------------------------- command helpers
  function fmtName(nm, e) {
    if (e.type === "dir") return `<span class="t-blue t-bold">${esc(nm)}/</span>`;
    if (e.exe) return c.green(nm);
    if (nm.startsWith(".")) return c.dim(nm);
    return esc(nm);
  }
  function longLine(nm, e) {
    const perm = e.type === "dir" ? (e.writable ? "drwxrwxrwt" : e.locked ? "drwx------" : "drwxr-xr-x") : e.exe ? "-rwxr-xr-x" : e.writable ? "-rw-rw-rw-" : "-rw-r--r--";
    const size = e.type === "dir" ? 4096 : e.size ?? (typeof e.content === "string" ? new Blob([e.content]).size : 0);
    const owner = e.locked ? "root  " : e.writable || e.mtime ? "guest " : "ting39";
    return `${c.dim(perm)} ${owner} ${String(size).padStart(6)} ${c.dim(shortDate(e.mtime || booted))} ${fmtName(nm, e)}`;
  }
  function columns(x, items) {
    if (!items.length) return;
    const w = Math.max(...items.map((i) => wcw(i.text))) + 2;
    const cols = Math.max(1, Math.floor(x.cols / w)), rows = Math.ceil(items.length / cols);
    for (let r = 0; r < rows; r++) {
      let h = "";
      for (let k = 0; k < cols; k++) {
        const i = k * rows + r, it = items[i];
        if (!it) continue;
        h += it.html + (i + rows < items.length ? " ".repeat(w - wcw(it.text)) : "");
      }
      x.pre(h);
    }
  }
  function setVar(name, value, x) {
    if (["PWD", "OLDPWD", "?", "RANDOM", "SECONDS"].includes(name)) { x.err(`t39sh: ${name}: readonly variable`); return 1; }
    env[name] = value;
    return 0;
  }
  let calcAns = 0;
  function calc(src) {
    const toks = src.match(/\d*\.?\d+(?:e[+-]?\d+)?|\*\*|[A-Za-z_]\w*|[-+*/%^(),]|\S/gi) || [];
    let i = 0;
    const peek = () => toks[i], next = () => toks[i++];
    const F1 = { sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, log: Math.log, ln: Math.log, log2: Math.log2, log10: Math.log10, exp: Math.exp, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round };
    const FN = { min: Math.min, max: Math.max, pow: Math.pow, hypot: Math.hypot };
    const K = { pi: Math.PI, e: Math.E, tau: 2 * Math.PI, phi: (1 + Math.sqrt(5)) / 2, ans: calcAns };
    const expr = () => { let v = term(); while (peek() === "+" || peek() === "-") v = next() === "+" ? v + term() : v - term(); return v; };
    const term = () => { let v = unary(); while (["*", "/", "%"].includes(peek())) { const o = next(), r = unary(); v = o === "*" ? v * r : o === "/" ? v / r : v % r; } return v; };
    const unary = () => (peek() === "-" ? (next(), -unary()) : peek() === "+" ? (next(), unary()) : power());
    const power = () => { const b = primary(); if (peek() === "^" || peek() === "**") { next(); return b ** unary(); } return b; };
    const primary = () => {
      const t = next();
      if (t === undefined) throw new Error("unexpected end of expression");
      if (/^\d|^\./.test(t)) return parseFloat(t);
      if (t === "(") { const v = expr(); if (next() !== ")") throw new Error("missing )"); return v; }
      const id = t.toLowerCase();
      if (Object.hasOwn(K, id)) return K[id];
      if (Object.hasOwn(F1, id) || Object.hasOwn(FN, id)) {
        if (next() !== "(") throw new Error(`${id} needs (…)`);
        const args = [expr()];
        while (peek() === ",") { next(); args.push(expr()); }
        if (next() !== ")") throw new Error("missing )");
        return (F1[id] || FN[id])(...args);
      }
      throw new Error(`unexpected '${t}'`);
    };
    const v = expr();
    if (i < toks.length) throw new Error(`unexpected '${toks[i]}'`);
    if (typeof v !== "number" || Number.isNaN(v)) throw new Error("not a number");
    return v;
  }
  async function editor(x) {
    const scr = x.screen();
    if (scr) scr.textContent = ["", ...Array(6).fill("~"), `~              VIM - Vi IMproved`, `~                 (t39sh edition)`, "~", `~       type  :q<Enter>  to exit... if you can`, ...Array(4).fill("~"), `"[No Name]" 0L, 0B`].join("\n");
    scrollDown();
    for (let tries = 0; ; tries++) {
      const cmd = (await x.readLine(":", {})).trim().replace(/^:/, "");
      if (/^(q|q!|wq|wq!|x|qa|qa!|quit)$/.test(cmd)) break;
      if (cmd === "w" || cmd === "w!") x.err("E32: No file name");
      else if (cmd === "help" || cmd === "h") x.out("you're looking for :q");
      else x.err(cmd ? `E492: Not an editor command: ${cmd}` : "E37: No write since last change (add ! to override)");
      if (tries === 2) x.html(c.dim("hint: type q and press Enter"));
    }
    if (scr) scr.remove();
    x.html(`${c.green("✔")} you escaped vim. ${c.dim("that's more than most people can say. 🏆")}`);
  }
  async function nuke(x) {
    const paths = [];
    const walk = (n, p) => { for (const [k, v] of Object.entries(n.children)) { if (v.type === "dir") walk(v, p + "/" + k); else paths.push(p + "/" + k); } };
    walk(fsRoot, "");
    const step = Math.max(1, Math.floor(paths.length / 36));
    for (const p of paths.filter((_, i) => i % step === 0)) { x.html(`${c.dim("removed")} '${esc(p)}'`); await x.sleep(reduced ? 0 : 22); }
    x.html(c.red("rm: it is dangerous to operate recursively on '/'"));
    if (!reduced) {
      const els = [...document.querySelectorAll(".nav, .hero > *, .section h2, .section .card, footer")];
      els.forEach((e, i) => {
        e.classList.add("t39-fall");
        e.style.setProperty("--fd", (Math.random() * 0.35).toFixed(2) + "s");
        e.style.setProperty("--fr", ((Math.random() - 0.5) * 50).toFixed(1) + "deg");
        e.style.setProperty("--fx", ((Math.random() - 0.5) * 120).toFixed(0) + "px");
        void i;
      });
      document.body.classList.add("t39-crumble");
      win.classList.add("t39-shake");
      await sleep(1900);
      document.body.classList.remove("t39-crumble");
      win.classList.remove("t39-shake");
      setTimeout(() => els.forEach((e) => { e.classList.remove("t39-fall"); ["--fd", "--fr", "--fx"].forEach((v) => e.style.removeProperty(v)); }), 1300);
      await sleep(900);
    }
    x.out("");
    x.html(`${c.yellow("…just kidding.")} nothing was deleted. it's a static site; you can't hurt it. 💫`);
    return 0;
  }
  async function danmaku(x) {
    x.html(`${c.pink("Star Sign")} ${c.bold("「Thirty-Nine Constellations」")} ${c.dim("· any key to stop")}`);
    const scr = x.screen();
    if (!scr) { x.out("danmaku: needs a screen"); return 1; }
    const R = 17, W = Math.max(31, Math.min(61, x.cols - 2) | 1), cx = (W - 1) / 2;
    const bullets = [];
    let px = cx, stop = false, graze = 0;
    x.onKey(() => (stop = true));
    const frames = reduced ? 1 : 220;
    for (let f = 0; f < frames && !stop; f++) {
      const phase = Math.floor(f / 55) % 4;
      if (phase === 0 && f % 2 === 0) for (let k = 0; k < 5; k++) { const a = f * 0.21 + (k * Math.PI * 2) / 5; bullets.push({ x: cx, y: 1, vx: Math.cos(a) * 0.9, vy: Math.sin(a) * 0.45, ch: "•", cl: "a" }); }
      if (phase === 1 && f % 9 === 0) for (let k = 0; k < 16; k++) { const a = (k * Math.PI * 2) / 16 + f; bullets.push({ x: cx, y: 1, vx: Math.cos(a) * 0.8, vy: Math.sin(a) * 0.4, ch: "∘", cl: "b" }); }
      if (phase === 2 && f % 6 === 0) { const a0 = Math.atan2(R - 2, (px - cx) * 0.5); for (let k = -2; k <= 2; k++) { const a = a0 + k * 0.18; bullets.push({ x: cx, y: 1, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 0.6, ch: "◆", cl: "c" }); } }
      if (phase === 3 && f % 3 === 0) { const a = Math.sin(f * 0.15) * 1.2 + Math.PI / 2; bullets.push({ x: cx, y: 1, vx: Math.cos(a) * 0.9, vy: Math.sin(a) * 0.5, ch: "*", cl: "a" }, { x: cx, y: 1, vx: -Math.cos(a) * 0.9, vy: Math.sin(a) * 0.5, ch: "*", cl: "b" }); }
      for (const b of bullets) { b.x += b.vx; b.y += b.vy; }
      for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; if (b.x < 0 || b.x >= W || b.y < 0 || b.y >= R) bullets.splice(i, 1); }
      // the player drifts away from the nearest bullet (it's very good at this)
      let best = px, bestD = -1;
      for (const cand of [px - 1, px, px + 1]) {
        if (cand < 1 || cand > W - 2) continue;
        let d = 99;
        for (const b of bullets) if (b.y > R - 6) d = Math.min(d, Math.hypot((b.x - cand) * 0.5, b.y - (R - 1)));
        d -= Math.abs(cand - cx) * 0.02; // drift home when it's safe
        if (d > bestD) { bestD = d; best = cand; }
      }
      px = best;
      if (bestD < 1.2) graze++;
      const grid = Array.from({ length: R }, () => Array(W).fill(" "));
      for (const b of bullets) grid[Math.round(b.y)][Math.round(b.x)] = `<span class="t39-b${b.cl}">${b.ch}</span>`;
      grid[0][Math.round(cx)] = `<span class="t-pink">✦</span>`;
      grid[R - 1][Math.round(px)] = `<span class="t-green">▲</span>`;
      scr.innerHTML = `<span class="t39-field">${grid.map((r) => r.join("")).join("\n")}</span>`;
      if (f === 0) scrollDown();
      await x.sleep(55);
    }
    if (!reduced) scr.remove();
    x.html(stop ? c.dim("spell card abandoned. the stars will wait.") : `${c.yellow("Spell Card Bonus!")} ${c.bold("+39,390,000")} ${c.dim(`(graze ${graze})`)}`);
  }

  // ---------------------------------------------------------------- execution
  async function exec(argv, x) {
    const [name] = argv;
    const sub = Object.assign(Object.create(Object.getPrototypeOf(x)), x, { argv, args: argv.slice(1), name });
    if (argv.length && argv.every((a) => /^[A-Za-z_]\w*=/.test(a))) { for (const a of argv) { const i = a.indexOf("="); if (setVar(a.slice(0, i), a.slice(i + 1), x)) return 1; } return 0; }
    const cmd = Object.hasOwn(COMMANDS, name) ? COMMANDS[name] : null;
    if (!cmd) {
      if (/^\/bin\//.test(name) && COMMANDS[name.slice(5)]) return exec([name.slice(5), ...argv.slice(1)], x);
      const nudge = nudgeFor(name);
      if (nudge) { x.err(`${name}: ${nudge}`); return 127; }
      const node = name.includes("/") && getNode(norm(name));
      if (node) { x.err(`t39sh: ${name}: ${node.type === "dir" ? "Is a directory" : "Permission denied"}`); return 126; }
      x.err(`t39sh: ${name}: command not found`);
      const near = Object.keys(COMMANDS).filter((k) => !COMMANDS[k].hidden).map((k) => [k, lev(name, k)]).sort((a, b) => a[1] - b[1])[0];
      if (near && near[1] <= Math.max(1, Math.floor(name.length / 3))) x.html(c.dim("did you mean ") + c.yellow(near[0]) + c.dim("?"));
      return 127;
    }
    if (argv.includes("--help") && name !== "echo") return exec(["man", name], x);
    try {
      const r = await cmd.run(sub);
      return typeof r === "number" ? r : 0;
    } catch (e) {
      if (e === ABORT || x.signal.aborted) return 130;
      x.err(`${name}: ${e && e.message ? e.message : e}`);
      return 1;
    }
  }
  function expandAlias(argv) {
    if (!argv.length || !Object.hasOwn(aliases, argv[0])) return argv;
    const words = tokenize(aliases[argv[0]]).filter((t) => t.t === "word").map((t) => t.v);
    return [...words, ...argv.slice(1)];
  }
  async function runPipeline(pl, signal) {
    let stdin = null, code = 0;
    for (let i = 0; i < pl.length; i++) {
      const { redir } = pl[i];
      const argv = expandAlias(pl[i].argv);
      const tty = i === pl.length - 1 && !redir;
      const buf = [], stage = new AbortController();
      const up = () => stage.abort();
      signal.addEventListener("abort", up, { once: true });
      const sink = tty ? (h) => emit(h) : (h, t) => { for (const l of String(t).split("\n")) buf.push(l); if (buf.length > 5000) stage.abort(); };
      const x = {
        stdin, signal: stage.signal, tty,
        out: (t = "") => String(tty ? L(t) : t).split("\n").forEach((l) => sink(linkify(l), l)),
        html: (h) => sink(h, toText(h)),
        pre: (h) => (tty ? emit(h, "t39-pre") : sink(h, toText(h))),
        err: (t) => String(L(t)).split("\n").forEach((l) => emit(span("red", l))),
        screen: () => { if (!tty) return null; const d = document.createElement("div"); d.className = "t39-ln t39-pre t39-screen"; outEl.appendChild(d); scrollDown(); return d; },
        readLine: (prompt, o) => readLine(prompt, o || {}, stage.signal),
        onKey: (fn) => { keyHook = fn; },
        sleep: (ms) => sleep(ms, stage.signal),
        get cols() { return termCols(); },
      };
      code = await exec(argv, x);
      keyHook = null;
      signal.removeEventListener("abort", up);
      if (signal.aborted) return 130;
      if (redir) {
        const e = writeFile(redir.file, buf.length ? buf.join("\n") + "\n" : "", redir.append);
        if (e) { emit(span("red", e)); return 1; }
      }
      stdin = buf;
    }
    return code;
  }
  async function runLine(line, signal) {
    if (/:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;?\s*:/.test(line)) { emit(span("red", "t39sh: fork: retry: Resource temporarily unavailable")); emit(c.dim("(nice try. the stars are not impressed. 🍴)")); return 1; }
    let chain;
    try { chain = parse(line); } catch (e) { emit(span("red", `t39sh: ${e.message}`)); return 2; }
    let code = status;
    for (const { op, pipeline } of chain) {
      if ((op === "&&" && code !== 0) || (op === "||" && code === 0)) continue;
      code = await runPipeline(pipeline, signal);
      status = code;
      if (signal.aborted) return 130;
    }
    return code;
  }

  // ---------------------------------------------------------------- UI
  const root = document.createElement("div");
  root.className = "t39";
  root.hidden = true;
  root.innerHTML = `
    <div class="t39-backdrop"></div>
    <section class="t39-win" role="dialog" aria-modal="true" aria-label="Terminal">
      <header class="t39-bar">
        <span class="t39-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="t39-title"></span>
        <button class="t39-x" type="button" aria-label="Close terminal" title="Close (Esc)">✕</button>
      </header>
      <div class="t39-body">
        <div class="t39-out" role="log" aria-live="polite"></div>
        <div class="t39-line"><span class="t39-ps"></span><span class="t39-mirror" aria-hidden="true"></span><input class="t39-in" type="text" aria-label="Command" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send"></div>
      </div>
      <div class="t39-keys" aria-label="Terminal keys">
        <button type="button" data-k="Tab">tab</button><button type="button" data-k="ArrowUp" aria-label="previous command">↑</button><button type="button" data-k="ArrowDown" aria-label="next command">↓</button><button type="button" data-k="ArrowLeft" aria-label="cursor left">←</button><button type="button" data-k="ArrowRight" aria-label="cursor right">→</button><button type="button" data-k="c" data-ctrl aria-label="Control C">^C</button><button type="button" data-k="l" data-ctrl aria-label="Control L">^L</button><button type="button" data-k="Escape" aria-label="close">esc</button>
      </div>
    </section>`;
  document.body.appendChild(root);
  const win = root.querySelector(".t39-win"), bodyEl = root.querySelector(".t39-body"), outEl = root.querySelector(".t39-out");
  const lineEl = root.querySelector(".t39-line"), psEl = root.querySelector(".t39-ps"), mirror = root.querySelector(".t39-mirror");
  const input = root.querySelector(".t39-in"), titleEl = root.querySelector(".t39-title");
  const crt = store.get("crt", null);
  if (crt === "amber" || crt === "green") win.dataset.crt = crt;

  let scrollQueued = false;
  function scrollDown() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => { scrollQueued = false; bodyEl.scrollTop = bodyEl.scrollHeight; });
  }
  function emit(html, cls) {
    const d = document.createElement("div");
    d.className = "t39-ln" + (cls ? " " + cls : "");
    d.innerHTML = html;
    outEl.appendChild(d);
    while (outEl.childElementCount > 1500) outEl.firstElementChild.remove();
    scrollDown();
  }
  let cw = 0;
  function termCols() {
    if (!cw) {
      const s = document.createElement("span");
      s.textContent = "M".repeat(40);
      s.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
      outEl.appendChild(s);
      cw = s.getBoundingClientRect().width / 40;
      s.remove();
    }
    return Math.max(20, Math.floor((outEl.clientWidth - 4) / (cw || 8.4)));
  }
  const termRows = () => Math.max(5, Math.floor(bodyEl.clientHeight / (parseFloat(getComputedStyle(outEl).lineHeight) || 20)));
  const psHTML = () => `<span class="t-green t-bold">${USER}@${HOST}</span>:<span class="t-blue t-bold">${esc(pretty(cwd))}</span>${status && status !== 130 ? c.red("$") : "$"} `;
  function setPrompt() {
    psEl.innerHTML = reader ? esc(reader.prompt) : psHTML();
    titleEl.textContent = `${USER}@${HOST}: ${pretty(cwd)}`;
  }
  const echoPrompt = (line, suffix = "") => emit(psHTML() + esc(line) + suffix);

  function known(w) { return Object.hasOwn(COMMANDS, w) || Object.hasOwn(aliases, w) || /^[A-Za-z_]\w*=/.test(w) || /^\/bin\/./.test(w) || w.startsWith("!"); }
  function renderMirror() {
    const v = input.value;
    if (search) {
      const m = search.i >= 0 ? history[search.i] : "";
      psEl.innerHTML = "";
      mirror.innerHTML = `${c.dim(search.i < 0 && search.q ? "(failed reverse-i-search)`" : "(reverse-i-search)`")}${esc(search.q)}<span class="t39-cur"> </span>${c.dim("': ")}${esc(m)}`;
      return;
    }
    if (reader && reader.mask) { mirror.innerHTML = `<span class="t39-cur"> </span>`; return; }
    const s = input.selectionStart ?? v.length, e = input.selectionEnd ?? s;
    let range = null;
    if (!reader) {
      const m = v.match(/^(\s*)(\S+)/);
      if (m) {
        const w = m[2], ok = known(w);
        const prefix = !ok && Object.keys(COMMANDS).some((k) => !COMMANDS[k].hidden && k.startsWith(w));
        if (!prefix) range = [m[1].length, m[1].length + w.length, ok ? "t-green" : "t-red"];
      }
    }
    const paint = (a, b) => {
      const cuts = [a, b];
      if (range) for (const p of [range[0], range[1]]) if (p > a && p < b) cuts.push(p);
      cuts.sort((p, q) => p - q);
      let h = "";
      for (let i = 0; i < cuts.length - 1; i++) {
        const [p, q] = [cuts[i], cuts[i + 1]];
        if (p === q) continue;
        const t = esc(v.slice(p, q));
        h += range && p >= range[0] && q <= range[1] ? `<span class="${range[2]}">${t}</span>` : t;
      }
      return h;
    };
    if (e > s) { mirror.innerHTML = paint(0, s) + `<span class="t39-sel">${esc(v.slice(s, e))}</span>` + paint(e, v.length); return; }
    const ch = s < v.length ? String.fromCodePoint(v.codePointAt(s)) : " ";
    mirror.innerHTML = paint(0, s) + `<span class="t39-cur">${esc(ch)}</span>` + (s < v.length ? paint(s + ch.length, v.length) : "");
  }
  function setValue(v) { input.value = v; input.setSelectionRange(v.length, v.length); renderMirror(); }
  function setBusy(b) { lineEl.classList.toggle("busy", b); if (!b) { setPrompt(); renderMirror(); } }

  function readLine(prompt, o, signal) {
    return new Promise((resolve, reject) => {
      if (signal.aborted) return reject(ABORT);
      const keep = input.value;
      const me = reader = { prompt, mask: !!o.mask };
      setValue("");
      setBusy(false);
      const onAbort = () => {
        if (reader !== me) return;
        emit(esc(me.prompt) + (me.mask ? "" : esc(input.value)) + c.dim("^C"));
        reader = null; setValue(keep); setBusy(true); reject(ABORT);
      };
      signal.addEventListener("abort", onAbort, { once: true });
      me.finish = (val) => {
        signal.removeEventListener("abort", onAbort);
        emit(esc(me.prompt) + (me.mask ? "" : esc(me.prompt === ":" ? val.replace(/^:/, "") : val)));
        reader = null; setValue(""); setBusy(true); resolve(val);
      };
    });
  }

  function pushHistory(line) {
    if (/^\s/.test(line) || !line.trim()) return;
    if (history[history.length - 1] !== line) history.push(line);
    if (history.length > 300) history = history.slice(-300);
    store.set("history", history);
  }
  function expandBang(line) {
    if (!/!(!|-?\d+|\$)/.test(line)) return line;
    return line.replace(/!(!|-?\d+|\$)/g, (m, k) => {
      let h;
      if (k === "!") h = history[history.length - 1];
      else if (k === "$") h = (history[history.length - 1] || "").trim().split(/\s+/).pop();
      else { const n = parseInt(k, 10); h = n < 0 ? history[history.length + n] : history[n - 1]; }
      if (h === undefined) throw new Error(`${m}: event not found`);
      return h;
    });
  }
  async function submit(raw) {
    let line = raw;
    try { line = expandBang(raw); } catch (e) { echoPrompt(raw); emit(span("red", "t39sh: " + e.message)); setValue(""); return; }
    echoPrompt(raw);
    if (line !== raw) emit(esc(line));
    pushHistory(line);
    hIdx = history.length; draft = ""; lastTab = null;
    setValue("");
    if (!line.trim()) return;
    running = new AbortController();
    setBusy(true);
    try { status = await runLine(line, running.signal); }
    catch (e) { emit(span("red", "t39sh: " + (e.message || e))); status = 1; }
    running = null; keyHook = null; reader = null;
    setBusy(false);
    scrollDown();
  }
  function interrupt() {
    if (running) {
      if (!reader) emit(c.dim("^C"));
      running.abort();
      return;
    }
    if (search) { search = null; }
    echoPrompt(input.value, c.dim("^C"));
    status = 130;
    setValue(""); setPrompt();
    hIdx = history.length;
  }
  function hist(d) {
    if (hIdx === history.length) draft = input.value;
    const n = Math.max(0, Math.min(history.length, hIdx + d));
    if (n === hIdx) return bell();
    hIdx = n;
    setValue(hIdx === history.length ? draft : history[hIdx]);
  }
  function bell() { win.classList.remove("t39-bell"); void win.offsetWidth; win.classList.add("t39-bell"); }

  function pathCands(word, dirsOnly) {
    const i = word.lastIndexOf("/"), dirPart = i >= 0 ? word.slice(0, i + 1) : "", base = word.slice(i + 1);
    const node = getNode(norm(dirPart || "."));
    if (!node || node.type !== "dir" || node.locked) return [];
    return Object.keys(node.children)
      .filter((n) => n.startsWith(base) && (base.startsWith(".") || !n.startsWith(".")) && (!dirsOnly || node.children[n].type === "dir"))
      .sort().map((n) => { const dir = node.children[n].type === "dir"; return { v: dirPart + n, suffix: dir ? "/" : " ", label: n + (dir ? "/" : ""), html: fmtName(n, node.children[n]) }; });
  }
  function complete() {
    const v = input.value, pos = input.selectionStart ?? v.length;
    const before = v.slice(0, pos), after = v.slice(pos);
    const seg = before.split(/\|\||&&|[|;]/).pop();
    const word = seg.match(/(\S*)$/)[1];
    const words = seg.trim() ? seg.trim().split(/\s+/) : [];
    const first = words.length === 0 || (words.length === 1 && word !== "");
    let cands = [];
    if (first) {
      cands = [...new Set([...Object.keys(COMMANDS).filter((k) => !COMMANDS[k].hidden), ...Object.keys(aliases)])].filter((s) => s.startsWith(word)).sort()
        .map((s) => ({ v: s, suffix: " ", label: s, html: c.green(s) }));
      if (word.includes("/")) cands = pathCands(word);
    } else {
      const cmd = COMMANDS[expandAlias([words[0]])[0]];
      const argIdx = word === "" ? words.length - 1 : words.length - 2;
      if (cmd && cmd.complete) {
        const list = typeof cmd.complete === "function" ? cmd.complete(argIdx, words.slice(1)) : cmd.complete;
        cands = [...new Set(list)].filter((s) => s.startsWith(word)).map((s) => ({ v: s, suffix: " ", label: s, html: esc(s) }));
      }
      if (!cands.length && (!cmd || cmd.files || !cmd.complete)) cands = pathCands(word, cmd && cmd.files === "dirs");
    }
    const insert = (full) => {
      const nb = before.slice(0, before.length - word.length) + full;
      input.value = nb + after;
      input.setSelectionRange(nb.length, nb.length);
      renderMirror();
    };
    if (!cands.length) bell();
    else if (cands.length === 1) insert(cands[0].v + (after.startsWith(" ") && cands[0].suffix === " " ? "" : cands[0].suffix));
    else {
      let pre = cands[0].v;
      for (const q of cands) while (!q.v.startsWith(pre)) pre = pre.slice(0, -1);
      if (pre.length > word.length) insert(pre);
      else if (lastTab === v) { echoPrompt(v); columns({ pre: (h) => emit(h, "t39-pre"), cols: termCols() }, cands.map((q) => ({ text: q.label, html: q.html }))); }
      else bell();
    }
    lastTab = input.value;
  }

  function startSearch() {
    if (!search) search = { q: "", i: history.length - 1, saved: input.value };
    else search.i = findHist(search.q, search.i - 1);
    if (!search.q && search.i >= 0 && search.i === history.length - 1) { /* show most recent */ }
    input.value = search.q;
    renderMirror();
  }
  function findHist(q, from) { for (let i = Math.min(from, history.length - 1); i >= 0; i--) if (history[i].includes(q)) return i; return -1; }
  function endSearch(accept) {
    const m = search.i >= 0 ? history[search.i] : search.saved;
    const restore = accept ? m : search.saved;
    search = null;
    setPrompt();
    setValue(restore);
  }

  function handleKey(e) {
    const k = e.key, ctrl = e.ctrlKey && !e.altKey && !e.metaKey;
    if (e.isComposing || e.keyCode === 229) return;
    const sel = String(getSelection() || "");
    if (keyHook && running && !reader) {
      e.preventDefault();
      if (ctrl && (k === "c" || k === "C")) return interrupt();
      if (k === "Escape") { interrupt(); return api.close(); }
      if (!["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(k)) keyHook(e);
      return;
    }
    if (k === "Escape") { e.preventDefault(); if (search) return endSearch(false); if (running) interrupt(); return api.close(); }
    if (ctrl && (k === "c" || k === "C")) {
      if (sel) return; // copying selected output
      e.preventDefault(); return interrupt();
    }
    if (ctrl && (k === "l" || k === "L")) { e.preventDefault(); outEl.replaceChildren(); return; }
    if (running && !reader) { if (k === "Enter" || k === "Tab") e.preventDefault(); return; }
    if (search) {
      if (ctrl && (k === "r" || k === "R")) { e.preventDefault(); return startSearch(); }
      if (k === "Enter") { e.preventDefault(); const m = search.i >= 0 ? history[search.i] : ""; search = null; setPrompt(); return submit(m); }
      if (ctrl && (k === "g" || k === "G")) { e.preventDefault(); return endSearch(false); }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab", "Home", "End"].includes(k)) { e.preventDefault(); return endSearch(true); }
      return; // typing edits the query (see input handler)
    }
    if (k === "Enter") {
      e.preventDefault();
      if (reader) return reader.finish(input.value);
      return submit(input.value);
    }
    if (k === "Tab" && !e.shiftKey) { e.preventDefault(); if (!reader) complete(); return; }
    if (k === "ArrowUp" && !reader) { e.preventDefault(); return hist(-1); }
    if (k === "ArrowDown" && !reader) { e.preventDefault(); return hist(1); }
    if (k === "PageUp" || k === "PageDown") { e.preventDefault(); bodyEl.scrollBy({ top: (k === "PageUp" ? -1 : 1) * bodyEl.clientHeight * 0.85 }); return; }
    if (ctrl) {
      const v = input.value, s = input.selectionStart, kk = k.toLowerCase();
      const cut = (a, b) => { input.value = v.slice(0, a) + v.slice(b); input.setSelectionRange(a, a); renderMirror(); };
      if (kk === "a") { e.preventDefault(); input.setSelectionRange(0, 0); return renderMirror(); }
      if (kk === "e") { e.preventDefault(); input.setSelectionRange(v.length, v.length); return renderMirror(); }
      if (kk === "u") { e.preventDefault(); return cut(0, s); }
      if (kk === "k") { e.preventDefault(); return cut(s, v.length); }
      if (kk === "w") { e.preventDefault(); const m = v.slice(0, s).match(/\S*\s*$/); return cut(s - m[0].length, s); }
      if (kk === "d") { e.preventDefault(); if (!v) { if (reader) return interrupt(); echoPrompt("exit"); return api.close(); } return cut(s, s + 1); }
      if (kk === "r" && !reader) { e.preventDefault(); return startSearch(); }
    }
    requestAnimationFrame(renderMirror);
  }
  input.addEventListener("keydown", handleKey);
  input.addEventListener("input", () => {
    lastTab = null;
    if (search) { search.q = input.value; search.i = findHist(search.q, history.length - 1); }
    renderMirror();
  });
  document.addEventListener("selectionchange", () => { if (document.activeElement === input) renderMirror(); });
  input.addEventListener("focus", () => { win.classList.add("focused"); renderMirror(); });
  input.addEventListener("blur", () => win.classList.remove("focused"));
  // clicking anywhere in the terminal focuses the prompt, unless you're selecting text
  bodyEl.addEventListener("mouseup", (e) => { if (!String(getSelection() || "") && !e.target.closest("a, button")) input.focus({ preventScroll: true }); });
  bodyEl.addEventListener("touchend", (e) => { if (!e.target.closest("a, button")) input.focus({ preventScroll: true }); }, { passive: true });
  root.querySelector(".t39-x").addEventListener("click", () => api.close());
  root.querySelector(".t39-backdrop").addEventListener("click", () => api.close());
  root.querySelector(".t39-keys").addEventListener("pointerdown", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    e.preventDefault();
    input.focus({ preventScroll: true });
    const key = b.dataset.k, ev = { key, ctrlKey: b.hasAttribute("data-ctrl"), metaKey: false, altKey: false, shiftKey: false, preventDefault() {}, target: input };
    if (key === "ArrowLeft" || key === "ArrowRight") {
      const p = Math.max(0, Math.min(input.value.length, (input.selectionStart ?? 0) + (key === "ArrowLeft" ? -1 : 1)));
      input.setSelectionRange(p, p); return renderMirror();
    }
    handleKey(ev);
  });
  // keep the window inside the visual viewport when a phone keyboard opens
  const vv = window.visualViewport;
  const fit = () => { root.style.setProperty("--t39-vh", (vv ? vv.height : innerHeight) + "px"); root.style.setProperty("--t39-top", (vv ? vv.offsetTop : 0) + "px"); cw = 0; };
  if (vv) { vv.addEventListener("resize", fit); vv.addEventListener("scroll", fit); }
  addEventListener("resize", fit);
  fit();

  function motdText() {
    const b = browserInfo();
    return [
      LT("motd1", `t39sh ${VERSION} · ting39's terminal`, { v: VERSION }),
      L("Type help to look around, Tab to complete, Esc to leave."),
      lastLogin ? LT("last", `Last login: ${fmtDate(new Date(lastLogin))} on ${b.browser}`, { d: fmtDate(new Date(lastLogin)), b: b.browser }) : LT("first", `First login. Welcome, ${USER}!`, { u: USER }),
    ];
  }
  function motd() {
    const [a, b2, l] = motdText();
    emit(`${c.accent("✦")} ${c.bold(a)}`);
    emit(b2.replace("help", c.yellow("help")).replace("Tab", c.yellow("Tab")).replace("Esc", c.yellow("Esc")));
    emit(c.dim(l));
    emit("");
  }

  // ---------------------------------------------------------------- open / close
  let lastFocus = null, closeTimer = 0, isOpen = false;
  const outside = () => [...document.body.children].filter((n) => n !== root && n.tagName !== "SCRIPT" && !n.matches("canvas, .cursor-glow"));
  const api = {
    open(cmd) {
      if (!isOpen) {
        isOpen = true;
        clearTimeout(closeTimer);
        lastFocus = document.activeElement;
        root.hidden = false;
        fit();
        void root.offsetWidth;
        root.classList.add("open");
        outside().forEach((n) => n.setAttribute("inert", ""));
        if (!motdShown) {
          motdShown = true;
          motd();
          logins.push(new Date().toISOString());
          store.set("logins", logins.slice(-20));
        }
        setPrompt(); renderMirror();
        document.dispatchEvent(new CustomEvent("t39sh:open"));
      }
      input.focus({ preventScroll: true });
      if (cmd && !running) submit(cmd);
    },
    close() {
      if (!isOpen) return;
      isOpen = false;
      root.classList.remove("open");
      outside().forEach((n) => n.removeAttribute("inert"));
      input.blur();
      closeTimer = setTimeout(() => { if (!isOpen) root.hidden = true; }, reduced ? 0 : 320);
      if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
      document.dispatchEvent(new CustomEvent("t39sh:close"));
    },
    toggle() { isOpen ? api.close() : api.open(); },
    isOpen: () => isOpen,
    run(cmd) { api.open(cmd); },
  };
  // keys pressed while focus is elsewhere in the terminal (e.g. after selecting output) go to the prompt
  root.addEventListener("keydown", (e) => {
    if (e.target === input) return;
    if (e.key === "Escape") { e.preventDefault(); api.close(); return; }
    if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1 && !e.target.closest("button")) input.focus({ preventScroll: true });
  });
  // backtick toggles closed again when the prompt is empty (Quake-style)
  input.addEventListener("keydown", (e) => { if (e.key === "`" && !input.value && !running && !reader && !search) { e.preventDefault(); api.close(); } }, true);

  const ready = loadData();
  window.T39SH = api;
})();
