/* The homepage pet: a little pixel star-creature drawn in code (16×16 grid, no image files).
   It walks along the bottom of the window, hops onto cards, can be patted, fed, dragged and
   thrown, sleeps at night (Taiwan time), dances while the Spotify player plays, and grows
   up over repeat visits (remembered in localStorage). Loaded lazily by script.js when the
   browser is idle. It only animates while it's doing something; idle ticks are 4 per second
   and everything stops while the tab is hidden. The terminal's `pet` command talks to it. */
(() => {
  "use strict";
  if (window.PET) return;
  // ---- translations: keys are the English text; {placeholders} are filled in by PT() ----
  const PDICT = {
    "zh-TW": {
      "an egg": "一顆蛋", "a baby": "寶寶", "a kid": "小朋友", "a grown-up": "大人", "a star": "一顆星星",
      "✦ it hatched! say hi to {name}": "✦ 孵出來了！跟 {name} 打聲招呼吧", "✦ {name} grew into {label}!": "✦ {name} 長成{label}了！",
      "hehe": "嘿嘿", "more pats pls": "再摸摸我嘛", "✦ happy ✦": "✦ 好開心 ✦", "purr…?": "呼嚕…？", "that tickles": "好癢喔",
      "*wobble*": "*搖搖晃晃*", "something moved inside…": "裡面好像有東西在動…", "it's warm": "暖暖的", "*crack*": "*喀啦*",
      "…five more minutes": "…再睡五分鐘", "eggs don't eat. yet.": "蛋還不會吃東西。暫時。", "so full… ✦": "好飽… ✦",
      "{name} is full. try again later.": "{name} 吃飽了，等等再來吧。", "nom nom": "嚼嚼", "stardust! ✦": "星塵！✦",
      "tastes like a supernova": "吃起來像超新星", "yum": "好吃", "you feed {name} a little star. ✦": "你餵 {name} 吃了一顆小星星。✦",
      "zz…": "呼…", "☀ awake!": "☀ 醒了！", "{name} is back ✦": "{name} 回來了 ✦", "✦ cheat code accepted ✦": "✦ 密技啟動 ✦",
      "whoa!": "哇！", "wheee": "咻～", "put me down!": "放我下來！", "up we go": "飛高高",
      "♪ oh! music!": "♪ 喔！有音樂！", "♪ this one!": "♪ 就是這首！", "*vibing*": "*跟著搖擺*", "ooh, a terminal": "喔～終端機",
      "☀ good morning": "☀ 早安", "it's late in Taipei. sleepy…": "台北已經很晚了，好睏…", "*yawn*": "*打哈欠*",
      "oof": "唉唷", "ow…": "好痛…", "again!": "再一次！", "I'm {name} now ✦": "我現在叫 {name} 了 ✦",
      "an egg appeared… pat it?": "出現了一顆蛋…要摸摸看嗎？", "zz… (it's night in Taipei)": "呼…（台北現在是晚上）",
      "you're back! it's been {days} days ✦": "你回來了！已經 {days} 天了 ✦", "welcome back! visit #{n}": "歡迎回來！第 {n} 次來訪",
      "Pet actions": "寵物動作", "Pat": "摸摸", "pat": "摸摸", "Feed a star": "餵一顆星星", "feed a star": "餵一顆星星",
      "Nap or wake": "睡覺／起床", "nap / wake": "睡覺／起床", "Hide the pet": "藏起寵物", "hide (bring it back from the corner)": "藏起來（可從角落叫回來）",
      "bring the pet back": "叫寵物回來", "Bring the pet back": "叫寵物回來",
      "{name}, the site's pet ({stage}). Press to pat; drag to move.": "{name}，本站的寵物（{stage}）。按一下摸摸，拖曳可以移動。",
      "you pat {name}. ♥": "你摸了摸 {name}。♥", "you pat the egg. it wobbles.": "你摸了摸蛋，它晃了一下。",
      "{old} is now called {name}.": "{old} 現在叫做 {name} 了。", "{name} curls up for a nap. zz…": "{name} 縮成一團睡午覺。呼…",
      "{name} wakes up. ☀": "{name} 醒來了。☀", "eggs can't dance. (they can roll, though.)": "蛋不會跳舞。（不過會滾。）",
      "{name} dances. ♪": "{name} 跳起舞來。♪", "{name} hides. (`pet show` brings it back)": "{name} 躲起來了。（`pet show` 可以叫它回來）",
      "{name} is back. ✦": "{name} 回來了。✦",
    },
    ja: {
      "an egg": "たまご", "a baby": "あかちゃん", "a kid": "こども", "a grown-up": "おとな", "a star": "おほしさま",
      "✦ it hatched! say hi to {name}": "✦ 生まれた！{name} にあいさつしよう", "✦ {name} grew into {label}!": "✦ {name} が{label}になった！",
      "hehe": "えへへ", "more pats pls": "もっとなでて", "✦ happy ✦": "✦ しあわせ ✦", "purr…?": "ごろごろ…？", "that tickles": "くすぐったい",
      "*wobble*": "*ゆらゆら*", "something moved inside…": "中で何か動いた…", "it's warm": "あったかい", "*crack*": "*ぴしっ*",
      "…five more minutes": "…あと 5 分", "eggs don't eat. yet.": "たまごはまだ食べられない。", "so full… ✦": "おなかいっぱい… ✦",
      "{name} is full. try again later.": "{name} はおなかいっぱい。また後でね。", "nom nom": "もぐもぐ", "stardust! ✦": "星くず！✦",
      "tastes like a supernova": "超新星の味がする", "yum": "おいしい", "you feed {name} a little star. ✦": "{name} に小さな星をあげた。✦",
      "zz…": "すや…", "☀ awake!": "☀ 起きた！", "{name} is back ✦": "{name} がもどってきた ✦", "✦ cheat code accepted ✦": "✦ 裏技が発動した ✦",
      "whoa!": "わっ！", "wheee": "わーい", "put me down!": "おろしてー！", "up we go": "たかいたかい",
      "♪ oh! music!": "♪ あっ！音楽だ！", "♪ this one!": "♪ この曲！", "*vibing*": "*ノリノリ*", "ooh, a terminal": "おお、ターミナルだ",
      "☀ good morning": "☀ おはよう", "it's late in Taipei. sleepy…": "台北はもう夜おそい。ねむい…", "*yawn*": "*あくび*",
      "oof": "うっ", "ow…": "いたた…", "again!": "もう一回！", "I'm {name} now ✦": "今日から {name} だよ ✦",
      "an egg appeared… pat it?": "たまごが現れた…なでてみる？", "zz… (it's night in Taipei)": "すや…（台北は夜です）",
      "you're back! it's been {days} days ✦": "おかえり！{days} 日ぶりだね ✦", "welcome back! visit #{n}": "おかえり！{n} 回目の訪問",
      "Pet actions": "ペットの操作", "Pat": "なでる", "pat": "なでる", "Feed a star": "星をあげる", "feed a star": "星をあげる",
      "Nap or wake": "寝る／起きる", "nap / wake": "寝る／起きる", "Hide the pet": "ペットを隠す", "hide (bring it back from the corner)": "隠す（すみから呼び戻せます）",
      "bring the pet back": "ペットを呼び戻す", "Bring the pet back": "ペットを呼び戻す",
      "{name}, the site's pet ({stage}). Press to pat; drag to move.": "{name}、このサイトのペット（{stage}）。押すとなでる、ドラッグで移動。",
      "you pat {name}. ♥": "{name} をなでた。♥", "you pat the egg. it wobbles.": "たまごをなでた。ゆらゆらしている。",
      "{old} is now called {name}.": "{old} の名前は {name} になった。", "{name} curls up for a nap. zz…": "{name} は丸くなってお昼寝。すや…",
      "{name} wakes up. ☀": "{name} が起きた。☀", "eggs can't dance. (they can roll, though.)": "たまごは踊れない。（転がることはできる）",
      "{name} dances. ♪": "{name} が踊っている。♪", "{name} hides. (`pet show` brings it back)": "{name} は隠れた。（`pet show` で呼び戻せます）",
      "{name} is back. ✦": "{name} がもどってきた。✦",
    },
  };
  const PT = (en, vars) => {
    const lang = window.I18N ? I18N.lang : "en";
    let t = (PDICT[lang] && PDICT[lang][en]) || en;
    for (const k in vars || {}) t = t.split("{" + k + "}").join(vars[k]);
    return t;
  };

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const N = 16, SC = 3, S = N * SC; // sprite grid, pixel scale, on-screen size
  const KEY = "pet.v1";
  const NAMES = ["Mochi", "Nova", "Pixel", "Comet", "Tofu", "Stella", "Byte", "Kiwi"];
  const STAGES = [
    { id: "egg", at: 0, label: "an egg" },
    { id: "baby", at: 5, label: "a baby" },
    { id: "kid", at: 40, label: "a kid" },
    { id: "adult", at: 150, label: "a grown-up" },
    { id: "star", at: 400, label: "a star" },
  ];
  const PALETTE = {
    body: "#8d6fff", shade: "#6c50e6", out: "#33237f", hi: "#c3b4ff",
    eye: "#170f33", shine: "#ffffff", cheek: "#ff7ab8", mouth: "#5b1840",
    gold: "#ffd166", teal: "#00e0c6", leaf: "#2fd3a0",
    shell: "#f4f0ff", shellShade: "#d9d0f7", shellOut: "#7b6bc4",
  };

  // ------------------------------------------------------------- memory
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const saved = read();
  const data = { v: 1, name: NAMES[Math.floor(Math.random() * NAMES.length)], born: Date.now(), visits: 0, lastVisit: 0, xp: 0, pats: 0, feeds: 0, hidden: false, fed: [] };
  if (saved && typeof saved === "object") {
    for (const k of Object.keys(data)) if (typeof saved[k] === typeof data[k] && (k !== "fed" || Array.isArray(saved[k]))) data[k] = saved[k];
  }
  data.name = cleanName(data.name) || NAMES[0];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} };
  let newSession = true;
  try { newSession = !sessionStorage.getItem("pet.s"); sessionStorage.setItem("pet.s", "1"); } catch {}
  const away = data.lastVisit ? Date.now() - data.lastVisit : 0;
  if (newSession) {
    data.visits++;
    if (data.visits > 1) data.xp += 10;
    data.lastVisit = Date.now();
    save();
  }
  const stageOf = (xp) => STAGES.reduce((s, st, i) => (xp >= st.at ? i : s), 0);
  let stage = stageOf(data.xp);

  function cleanName(n) {
    return String(n ?? "").replace(/[^\p{L}\p{N} _-]/gu, "").trim().slice(0, 16);
  }
  const taipeiHour = () => +new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Taipei" }).format(new Date());
  const forceDay = /[?&]petday\b/.test(location.search); // for testing in the middle of the night
  const isNight = () => !forceDay && taipeiHour() < 7;

  // ------------------------------------------------------------- sprite
  function sprite(p) {
    const g = new Array(N * N).fill(null);
    const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < N && y >= 0 && y < N) g[y * N + x] = c; };
    const C = PALETTE;
    if (p.stage === 0) { // the egg
      const rx = 4.3, ry = 5.4, cx = 7.5 + p.wobble, cy = 14.5 - ry;
      const inside = (x, y) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (!inside(x, y)) continue;
        const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
        set(x, y, edge ? C.shellOut : y + 0.5 - cy > ry * 0.4 ? C.shellShade : C.shell);
      }
      for (const [dx, dy, c] of [[-2, -2, C.body], [1, -3, C.teal], [2, 0, C.body], [-1, 1, C.teal], [0, 3, C.body], [-3, 2, C.gold]]) set(cx + dx - 0.5, cy + dy, c);
      if (p.cracks) for (const [dx, dy] of [[-3, 0], [-2, -1], [-1, 0], [0, -1], [1, 0], [2, -1], [3, 0]].slice(0, 2 + p.cracks * 2)) set(cx + dx - 0.5, cy + dy, C.shellOut);
      return g;
    }
    let [rx, ry] = [null, [4.4, 3.6], [5.4, 4.4], [6.3, 5.0], [6.3, 5.0]][p.stage];
    if (p.squash > 0) { rx += 0.5; ry -= 0.6; } else if (p.squash < 0) { rx -= 0.4; ry += 0.6; }
    const cx = 7.5, cy = 14.5 - ry;
    const inside = (x, y) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      set(x, y, edge ? C.out : dy > ry * 0.45 ? C.shade : dx < -rx * 0.3 && dx > -rx * 0.85 && dy < -ry * 0.3 ? C.hi : C.body);
    }
    // feet
    const fl = Math.round(cx - rx * 0.45) - 1, fr = Math.round(cx + rx * 0.45);
    if (!p.held) { set(fl, 15 - (p.step === 1 ? 1 : 0), C.out); set(fr, 15 - (p.step === 2 ? 1 : 0), C.out); }
    else { set(fl, 15, C.out); set(fr, 15, C.out); set(fl - 1, 15, C.out); set(fr + 1, 15, C.out); }
    // antenna / star
    const top = Math.round(cy - ry) - 1;
    if (p.stage === 1) { set(8, top, C.leaf); set(9, top - 1, C.leaf); set(7, top - 1, C.leaf); }
    else {
      const big = p.stage >= 3, sy = top - (big ? 3 : 2), col = p.stage === 4 && p.twinkle ? C.teal : C.gold;
      set(8, top, C.out); if (big) set(8, top - 1, C.out);
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) set(8 + dx, sy + dy, col);
      if (big) { for (const [dx, dy] of [[2, 0], [-2, 0], [0, -2]]) set(8 + dx, sy + dy, col); set(8, sy, "#fff"); }
    }
    // face
    const w = p.stage === 1 ? 1 : 2, d = p.stage >= 3 ? 2 : 1;
    const lx = 7 - d - w + 1 + p.look.x, rxx = 8 + d + p.look.x, ey = Math.round(cy - 1) + p.look.y;
    const eye = (x0) => {
      const c = x0 + (w - 1) / 2;
      if (p.face === "blink" || p.face === "sleep") { for (let i = 0; i < w; i++) set(x0 + i, ey + 1, C.eye); return; }
      if (p.face === "happy") { set(c - 1, ey + 1, C.eye); set(c, ey, C.eye); set(c + 1, ey + 1, C.eye); return; }
      for (let i = 0; i < w; i++) for (let j = 0; j < 2; j++) set(x0 + i, ey + j, C.eye);
      if (w === 2) set(x0 + (p.look.x > 0 ? 1 : 0), ey, C.shine);
      if (p.face === "surprised" && w === 2) { set(x0, ey - 1, C.eye); set(x0 + 1, ey - 1, C.eye); }
    };
    eye(lx); eye(rxx);
    if (p.blush || p.face === "happy") { set(lx - 1, ey + 2, C.cheek); set(rxx + w, ey + 2, C.cheek); }
    const my = ey + (w === 2 ? 3 : 2);
    switch (p.mouth) {
      case "open": set(7, my, C.mouth); set(8, my, C.mouth); set(7, my + 1, C.mouth); set(8, my + 1, C.cheek); break;
      case "o": set(7, my, C.mouth); set(8, my, C.mouth); break;
      case "smile": if (w === 2) { set(6, my, C.out); set(7, my + 1, C.out); set(8, my + 1, C.out); set(9, my, C.out); } else { set(7, my, C.out); set(8, my, C.out); } break;
      case "none": break;
      default: set(7, my, C.out); set(8, my, C.out);
    }
    return g;
  }

  // ------------------------------------------------------------- DOM
  const wrap = document.createElement("div");
  wrap.className = "pet-wrap";
  wrap.innerHTML = `
    <div class="pet-bubble" role="status" aria-live="polite"></div>
    <div class="pet-tools" role="group" aria-label="${PT("Pet actions")}">
      <button type="button" data-a="pat" aria-label="${PT("Pat")}" title="${PT("pat")}">♥</button>
      <button type="button" data-a="feed" aria-label="${PT("Feed a star")}" title="${PT("feed a star")}">✦</button>
      <button type="button" data-a="nap" aria-label="${PT("Nap or wake")}" title="${PT("nap / wake")}">☾</button>
      <button type="button" data-a="hide" aria-label="${PT("Hide the pet")}" title="${PT("hide (bring it back from the corner)")}">✕</button>
    </div>
    <button type="button" class="pet"><canvas aria-hidden="true"></canvas></button>`;
  const fxLayer = document.createElement("div");
  fxLayer.className = "pet-fx";
  fxLayer.setAttribute("aria-hidden", "true");
  const restore = document.createElement("button");
  restore.type = "button";
  restore.className = "pet-restore";
  restore.textContent = "✦";
  restore.title = PT("bring the pet back");
  restore.setAttribute("aria-label", PT("Bring the pet back"));
  document.body.append(fxLayer, wrap, restore);
  const btn = wrap.querySelector(".pet"), bubble = wrap.querySelector(".pet-bubble"), cv = wrap.querySelector("canvas");
  const dpr = Math.min(devicePixelRatio || 1, 3);
  cv.width = cv.height = S * dpr;
  cv.style.width = cv.style.height = S + "px";
  const ctx = cv.getContext("2d");
  ctx.scale(dpr, dpr);

  // ------------------------------------------------------------- state
  const floorY = () => innerHeight - S - 2;
  let x = Math.max(12, innerWidth - S - 36), y = floorY(), vx = 0, vy = 0, dir = -1;
  let state = "idle", until = performance.now() + 2500, walkTo = 0, jump = null, perch = null;
  let face = "open", faceUntil = 0, mouth = "", squash = 0, squashUntil = 0, step = 0, stepAt = 0;
  let look = { x: 0, y: 0 }, mouse = null, wobble = 0, awakeUntil = 0, dancing = false, held = null, lastKey = "";
  let nextNote = 0, nextZ = 0, nextStartle = 0, lastScroll = scrollY;

  const stageName = () => STAGES[stage].id;
  const now = () => performance.now();
  function setFace(f, ms, m = "") { face = f; mouth = m; faceUntil = now() + ms; }
  function bounce(k = 1, ms = 160) { squash = k; squashUntil = now() + ms; }

  let bubbleT = 0;
  function say(text, ms = 2800) {
    bubble.textContent = PT(text);
    bubble.classList.add("on");
    clearTimeout(bubbleT);
    bubbleT = setTimeout(() => bubble.classList.remove("on"), ms);
    place();
  }
  function fx(ch, cls, n = 1, spread = 22) {
    if (reduced || data.hidden) return;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "pet-p " + cls;
      s.textContent = ch;
      s.style.left = x + S / 2 + (Math.random() - 0.5) * spread + "px";
      s.style.top = y + 4 + "px";
      s.style.animationDelay = i * 90 + "ms";
      s.style.setProperty("--dx", (Math.random() - 0.5) * 30 + "px");
      s.addEventListener("animationend", () => s.remove());
      fxLayer.appendChild(s);
    }
  }
  function gainXp(n) {
    data.xp += n;
    save();
    const s = stageOf(data.xp);
    if (s > stage) {
      stage = s;
      bounce(-1, 300);
      fx("✦", "pet-gold", 8, 50);
      say(stage === 1 ? PT("✦ it hatched! say hi to {name}", { name: data.name }) : PT("✦ {name} grew into {label}!", { name: data.name, label: PT(STAGES[stage].label) }), 4200);
      label();
    }
  }
  function label() {
    btn.setAttribute("aria-label", PT("{name}, the site's pet ({stage}). Press to pat; drag to move.", { name: data.name, stage: PT(STAGES[stage].label) }));
  }

  // ------------------------------------------------------------- actions
  const PAT_LINES = ["♥", "hehe", "more pats pls", "✦ happy ✦", "purr…?", "that tickles", "♪"];
  function pat() {
    if (stage === 0) {
      wobble = 1; setTimeout(() => (wobble = -1), 120); setTimeout(() => (wobble = 0), 240);
      data.pats++;
      gainXp(1);
      if (stage === 0) say(["*wobble*", "something moved inside…", "it's warm", "*crack*"][Math.min(3, data.pats - 1)] || "*wobble*", 1600);
      kick();
      return;
    }
    data.pats++;
    if (state === "sleep") {
      awakeUntil = now() + 20000;
      state = "idle"; until = now() + 4000;
      setFace("blink", 900, "o");
      say("…five more minutes", 2200);
    } else {
      setFace("happy", 1400, "smile");
      bounce(1, 180);
      fx("♥", "pet-heart", 2);
      if (Math.random() < 0.6) say(PAT_LINES[Math.floor(Math.random() * PAT_LINES.length)], 1500);
    }
    gainXp(1);
    kick();
  }
  function feed() {
    if (stage === 0) { say("eggs don't eat. yet.", 1800); return PT("eggs don't eat. yet."); }
    const t = Date.now();
    data.fed = data.fed.filter((f) => t - f < 600000);
    if (data.fed.length >= 3) { say("so full… ✦", 1800); setFace("blink", 800); return PT("{name} is full. try again later.", { name: data.name }); }
    data.fed.push(t);
    data.feeds++;
    if (state === "sleep") { awakeUntil = now() + 20000; state = "idle"; }
    if (!reduced && !data.hidden) {
      const s = document.createElement("span");
      s.className = "pet-treat";
      s.textContent = "✦";
      s.style.left = x + S / 2 + "px";
      s.style.setProperty("--fall", y + 10 + "px");
      s.addEventListener("animationend", () => s.remove());
      fxLayer.appendChild(s);
    }
    setTimeout(() => {
      setFace("happy", 1500, "open");
      let k = 0;
      const chew = setInterval(() => { mouth = ++k % 2 ? "o" : "open"; kick(); if (k > 6) { clearInterval(chew); mouth = "smile"; } }, 180);
      say(["nom nom", "stardust! ✦", "tastes like a supernova", "yum"][Math.floor(Math.random() * 4)], 1600);
      fx("·", "pet-gold", 4, 30);
      gainXp(3);
      kick();
    }, reduced ? 0 : 650);
    return PT("you feed {name} a little star. ✦", { name: data.name });
  }
  function nap(on = state !== "sleep") {
    if (on) { goToSleep(); awakeUntil = 0; napUntil = now() + 60000; say("zz…", 1400); }
    else { napUntil = 0; awakeUntil = now() + 60000; state = "idle"; until = now() + 2000; setFace("open", 0); say("☀ awake!", 1400); }
    kick();
  }
  let napUntil = 0;
  function goToSleep() {
    if (perch || state === "jump") { perch = null; jump = null; state = "fall"; vy = 0; return; }
    state = "sleep";
  }
  function setHidden(h) {
    data.hidden = h;
    save();
    wrap.hidden = h;
    restore.hidden = !h;
    if (!h) { y = Math.min(y, floorY()); kick(); say(PT("{name} is back ✦", { name: data.name }), 1800); }
  }
  function party() {
    if (stage === 0) { pat(); return; }
    fx("✦", "pet-gold", 10, 70);
    setFace("happy", 2000, "open");
    say("✦ cheat code accepted ✦", 2200);
    if (!reduced && (state === "idle" || state === "walk")) { state = "fall"; vy = -620; perch = null; }
    kick();
  }

  wrap.querySelector(".pet-tools").addEventListener("click", (e) => {
    const a = e.target.closest("button")?.dataset.a;
    if (a === "pat") pat();
    else if (a === "feed") feed();
    else if (a === "nap") nap();
    else if (a === "hide") { setHidden(true); restore.focus({ preventScroll: true }); }
    wrap.classList.remove("open");
  });
  restore.addEventListener("click", () => { setHidden(false); btn.focus({ preventScroll: true }); });

  // pointer: click/tap = pat, drag = pick up (and throw)
  let press = null, dragged = false, trail = [];
  btn.addEventListener("pointerdown", (e) => {
    if (e.button) return;
    press = { px: e.clientX, py: e.clientY, ox: e.clientX - x, oy: e.clientY - y };
    dragged = false;
    trail = [[e.clientX, e.clientY, now()]];
    try { btn.setPointerCapture(e.pointerId); } catch {}
  });
  btn.addEventListener("pointermove", (e) => {
    if (!press) return;
    if (!dragged && Math.hypot(e.clientX - press.px, e.clientY - press.py) > 6) {
      if (stage === 0) return;
      dragged = true; held = true; perch = null; jump = null; state = "held";
      setFace("surprised", 99999, "o");
      wrap.classList.add("held");
      say(["whoa!", "wheee", "put me down!", "up we go"][Math.floor(Math.random() * 4)], 1200);
    }
    if (dragged) {
      x = Math.max(0, Math.min(innerWidth - S, e.clientX - press.ox));
      y = Math.max(0, Math.min(floorY(), e.clientY - press.oy));
      trail.push([e.clientX, e.clientY, now()]);
      if (trail.length > 5) trail.shift();
      place();
    }
  });
  const release = () => {
    if (!press) return;
    press = null;
    if (!dragged) return;
    held = false;
    wrap.classList.remove("held");
    const [a, b] = [trail[0], trail[trail.length - 1]];
    const dt = Math.max(16, b[2] - a[2]) / 1000;
    vx = reduced ? 0 : Math.max(-900, Math.min(900, (b[0] - a[0]) / dt));
    vy = reduced ? 0 : Math.max(-900, Math.min(900, (b[1] - a[1]) / dt));
    state = "fall";
    setFace("surprised", 500, "o");
    if (reduced) { y = floorY(); state = "idle"; }
    kick();
  };
  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointercancel", release);
  btn.addEventListener("click", (e) => {
    if (dragged) { dragged = false; e.preventDefault(); return; }
    if (matchMedia("(hover: none)").matches) wrap.classList.toggle("open");
    pat();
  });
  btn.addEventListener("keydown", (e) => { if (e.key === "Escape") wrap.classList.remove("open"); });
  document.addEventListener("pointerdown", (e) => { if (!wrap.contains(e.target)) wrap.classList.remove("open"); }, { passive: true });

  addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") mouse = { x: e.clientX, y: e.clientY }; }, { passive: true });
  document.addEventListener("pointerleave", () => (mouse = null));
  addEventListener("scroll", () => {
    const d = scrollY - lastScroll;
    lastScroll = scrollY;
    if (perch) place();
    if (Math.abs(d) > 140 && state === "idle" && now() > nextStartle && !reduced) {
      nextStartle = now() + 4000;
      setFace("surprised", 700, "o");
      bounce(-1, 200);
      kick();
    }
  }, { passive: true });
  addEventListener("resize", () => { if (state === "idle" || state === "walk" || state === "sleep" || state === "dance") y = floorY(); x = Math.min(x, innerWidth - S - 4); place(); });

  // music: dance while the Spotify player plays
  document.addEventListener("site:playing", (e) => {
    const on = !!(e.detail && e.detail.playing);
    if (on === dancing) return;
    dancing = on;
    if (stage === 0) return;
    if (on) {
      if (state === "sleep") { awakeUntil = now() + 600000; say("♪ oh! music!", 1800); }
      else say(["♪ this one!", "♪ ♫", "*vibing*"][Math.floor(Math.random() * 3)], 1600);
      if (state !== "held" && state !== "fall" && state !== "jump") state = "dance";
    } else if (state === "dance") { state = "idle"; until = now() + 1500; }
    kick();
  });
  document.addEventListener("site:konami", party);
  let saidTerminal = false;
  document.addEventListener("t39sh:open", () => { look = { x: 0, y: -1 }; if (!saidTerminal && stage > 0) { saidTerminal = true; say("ooh, a terminal", 1800); } });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { last = now(); kick(); } });

  // ------------------------------------------------------------- behaviour
  function perchTargets() {
    const out = [];
    for (const el of document.querySelectorAll("main .card")) {
      if (el.closest("[hidden]")) continue;
      const r = el.getBoundingClientRect();
      if (r.width < S * 2 || r.top < 90 || r.top > innerHeight - S - 30 || r.left < 0 || r.right > innerWidth) continue;
      out.push({ el, r });
    }
    return out;
  }
  function think(t) {
    if (state === "sleep") {
      if (napUntil && t > napUntil) { napUntil = 0; state = "idle"; setFace("blink", 600); }
      else if (!napUntil && !isNight()) { state = "idle"; say("☀ good morning", 1800); }
      return;
    }
    if (stage === 0) { until = t + 3000 + Math.random() * 4000; if (!reduced && Math.random() < 0.5) { wobble = 1; setTimeout(() => (wobble = -1), 140); setTimeout(() => (wobble = 0), 280); } return; }
    if (isNight() && t > awakeUntil && !dancing) {
      goToSleep();
      if (state === "sleep") say(["zz…", "it's late in Taipei. sleepy…", "*yawn*"][Math.floor(Math.random() * 3)], 2000);
      return;
    }
    if (dancing) { state = "dance"; return; }
    until = t + 2500 + Math.random() * 5500;
    if (reduced) { look = { x: [-1, 0, 1][Math.floor(Math.random() * 3)], y: 0 }; return; }
    if (perch) {
      if (Math.random() < 0.55) { perch = null; state = "fall"; vy = -180; vx = (Math.random() - 0.5) * 160; }
      return;
    }
    const r = Math.random(), targets = perchTargets();
    if (r < 0.28 && targets.length) {
      const dist = (tg) => Math.abs(tg.r.left + tg.r.width / 2 - x) + Math.abs(tg.r.top - y) * 0.5;
      targets.sort((a, b) => dist(a) - dist(b));
      const tg = targets[Math.floor(Math.random() * Math.min(2, targets.length))];
      const ox = Math.max(4, Math.min(tg.r.width - S - 4, x - tg.r.left + (Math.random() - 0.5) * 120));
      jump = { el: tg.el, ox, fx: x, fy: y, t0: t, dur: 620 };
      state = "jump";
      bounce(1, 140);
    } else if (r < 0.75) {
      walkTo = Math.max(8, Math.min(innerWidth - S - 8, x + (Math.random() - 0.5) * innerWidth * 0.6));
      state = "walk";
    } else {
      look = { x: [-1, 0, 1][Math.floor(Math.random() * 3)], y: Math.random() < 0.3 ? -1 : 0 };
    }
  }
  function landOn(el, ox) {
    perch = { el, ox };
    state = "perch";
    vx = vy = 0;
    bounce(1, 160);
    until = now() + 5000 + Math.random() * 9000;
  }
  function update(dt, t) {
    if (t > faceUntil && face !== "open" && state !== "sleep") { face = "open"; mouth = ""; }
    if (t > squashUntil) squash = 0;
    switch (state) {
      case "walk": {
        const d = walkTo - x;
        dir = Math.sign(d) || dir;
        x += Math.sign(d) * Math.min(Math.abs(d), 42 * dt);
        if (t > stepAt) { step = step === 1 ? 2 : 1; stepAt = t + 170; }
        if (Math.abs(d) < 1) { state = "idle"; step = 0; until = t + 2000 + Math.random() * 4000; }
        y = floorY();
        break;
      }
      case "jump": {
        const r = jump.el.getBoundingClientRect();
        const k = Math.min(1, (t - jump.t0) / jump.dur);
        const tx = r.left + jump.ox, ty = r.top - S + SC;
        dir = Math.sign(tx - jump.fx) || dir;
        x = jump.fx + (tx - jump.fx) * k;
        y = jump.fy + (ty - jump.fy) * k - Math.sin(k * Math.PI) * 90;
        if (k >= 1) { const j = jump; jump = null; landOn(j.el, j.ox); }
        break;
      }
      case "fall": {
        const prevBottom = y + S;
        vy += 1900 * dt;
        x += vx * dt;
        y += vy * dt;
        if (x < 0) { x = 0; vx = -vx * 0.5; }
        if (x > innerWidth - S) { x = innerWidth - S; vx = -vx * 0.5; }
        if (y < 0) { y = 0; vy = 0; }
        if (vy > 0) {
          for (const { el, r } of perchTargets()) {
            const top = r.top + SC;
            if (prevBottom <= top && y + S >= top && x + S * 0.5 > r.left && x + S * 0.5 < r.right) { y = r.top - S + SC; landOn(el, x - r.left); break; }
          }
        }
        if (state === "fall" && y >= floorY()) {
          y = floorY();
          const hard = vy > 1100;
          vx *= 0.3;
          if (Math.abs(vx) > 40 && !hard) { vy = -vy * 0.25; } else { vy = 0; vx = 0; state = isNight() && t > awakeUntil && !dancing ? "sleep" : dancing ? "dance" : "idle"; until = t + 1500; }
          bounce(1, hard ? 260 : 150);
          if (hard) { setFace("blink", 700, "o"); say(["oof", "ow…", "again!"][Math.floor(Math.random() * 3)], 1200); }
        }
        if (state !== "fall") dir = vx < 0 ? -1 : dir;
        break;
      }
      case "perch": {
        const r = perch.el.getBoundingClientRect();
        if (!perch.el.isConnected || r.top < 70 || r.top > innerHeight - S - 4 || r.width === 0) { perch = null; state = "fall"; vy = 0; vx = 0; break; }
        x = Math.max(0, Math.min(innerWidth - S, r.left + perch.ox));
        y = r.top - S + SC;
        break;
      }
      case "dance": {
        const beat = 60000 / 128;
        const ph = (t % beat) / beat;
        squash = ph < 0.25 ? 1 : ph > 0.6 ? -1 : 0;
        if (!perch) y = floorY() - (reduced ? 0 : Math.round(Math.sin(ph * Math.PI) * 6));
        if (t > stepAt) { dir = -dir; stepAt = t + beat * 2; }
        face = "happy"; mouth = "smile";
        if (t > nextNote) { nextNote = t + beat * 2; fx(Math.random() < 0.5 ? "♪" : "♫", "pet-note"); }
        if (!dancing) { state = "idle"; until = t + 1000; }
        break;
      }
      case "sleep":
        face = "sleep"; mouth = "none";
        y = perch ? y : floorY();
        if (t > nextZ) { nextZ = t + 2600; fx(Math.random() < 0.5 ? "z" : "Z", "pet-z"); }
        if (t > until) { until = t + 20000; think(t); }
        break;
      case "held": break;
      default: // idle
        if (mouse && t > faceUntil) {
          const dx = mouse.x - (x + S / 2), dy = mouse.y - (y + S / 2);
          if (Math.hypot(dx, dy) < 360) { look = { x: Math.abs(dx) > 30 ? Math.sign(dx) : 0, y: dy < -50 ? -1 : 0 }; if (Math.abs(dx) > 30) dir = Math.sign(dx); }
        }
        if (t > faceUntil && face === "open" && Math.random() < 0.03) setFace("blink", 150);
        if (t > until) think(t);
    }
  }

  // ------------------------------------------------------------- loop (runs fast only while moving)
  let raf = 0, timer = 0, last = now();
  const fast = () => !reduced && ["walk", "jump", "fall", "dance"].includes(state);
  function loop() {
    cancelAnimationFrame(raf); clearTimeout(timer);
    raf = 0; timer = 0;
    const t = now(), dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    if (data.hidden) return;
    update(dt, t);
    render(t);
    place();
    schedule();
  }
  function schedule() {
    if (document.hidden || data.hidden || raf || timer || state === "held") return;
    if (fast()) { raf = requestAnimationFrame(loop); timer = setTimeout(loop, 100); } // the timer covers browsers that throttle rAF
    else timer = setTimeout(loop, 250);
  }
  function kick() { last = Math.min(last, now()); loop(); }

  let placed = "";
  function place() {
    const k = `${Math.round(x)},${Math.round(y)}`;
    if (k !== placed) { placed = k; wrap.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`; }
    wrap.classList.toggle("edge-l", x < 70);
    wrap.classList.toggle("edge-r", x > innerWidth - S - 70);
  }
  function render(t) {
    const p = {
      stage, face: state === "sleep" ? "sleep" : face, mouth: state === "sleep" ? "none" : mouth || "", look: state === "sleep" ? { x: 0, y: 0 } : look,
      squash,
      step: state === "walk" ? step : 0, held: state === "held", blush: !!mouse && Math.hypot(mouse.x - x - S / 2, mouse.y - y - S / 2) < 40,
      wobble, cracks: stage === 0 ? Math.min(3, data.xp) : 0, twinkle: Math.floor(t / 600) % 2,
    };
    if (state === "held") { p.face = "surprised"; p.mouth = "o"; p.squash = -1; }
    const key = JSON.stringify(p) + dir;
    if (key === lastKey) return;
    lastKey = key;
    const g = sprite(p);
    ctx.clearRect(0, 0, S, S);
    for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) {
      const c = g[yy * N + xx];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect((dir > 0 ? N - 1 - xx : xx) * SC, yy * SC, SC, SC);
    }
  }

  // ------------------------------------------------------------- terminal API
  const mood = () => (state === "sleep" ? "asleep 💤" : dancing ? "dancing ♪" : data.fed.filter((f) => Date.now() - f < 600000).length >= 3 ? "full and content" : data.pats > 20 ? "very loved" : "curious");
  const doing = () => ({ idle: "hanging out", walk: "going for a walk", jump: "jumping", fall: "falling!", perch: "sitting on a card", sleep: "sleeping", dance: "dancing", held: "being held" }[state]);
  window.PET = {
    get name() { return data.name; },
    command(args) {
      const [sub = "status", ...rest] = args;
      const st = STAGES[stage], next = STAGES[stage + 1];
      switch (sub) {
        case "status": case "stats": {
          const days = Math.floor((Date.now() - data.born) / 86400000);
          return [
            `${data.name}, ${st.label} ${stage ? "star-critter" : "(it might hatch soon)"}`,
            `  age      ${days ? `${days} day${days === 1 ? "" : "s"}` : "born today"}`,
            `  visits   ${data.visits}`,
            `  pats     ${data.pats}    feeds ${data.feeds}`,
            `  xp       ${data.xp}${next ? `  (${next.at - data.xp} more to become ${next.label})` : "  (fully grown ✦)"}`,
            `  mood     ${mood()}`,
            `  doing    ${data.hidden ? "hiding" : doing()}`,
            "",
            "pat, feed, name <name>, nap, wake, dance, hide, show",
          ];
        }
        case "pat": case "pet": pat(); return [stage ? PT("you pat {name}. ♥", { name: data.name }) : PT("you pat the egg. it wobbles.")];
        case "feed": return [feed()];
        case "name": {
          const n = cleanName(rest.join(" "));
          if (!n) return { lines: ["usage: pet name <name>  (letters, digits, spaces; up to 16)"], code: 1 };
          const old = data.name;
          data.name = n; save(); label();
          say(PT("I'm {name} now ✦", { name: n }), 2000);
          return [PT("{old} is now called {name}.", { old, name: n })];
        }
        case "nap": case "sleep": nap(true); return [PT("{name} curls up for a nap. zz…", { name: data.name })];
        case "wake": nap(false); return [PT("{name} wakes up. ☀", { name: data.name })];
        case "dance":
          if (!stage) return [PT("eggs can't dance. (they can roll, though.)")];
          dancing = true; state = "dance"; kick();
          setTimeout(() => { dancing = false; document.dispatchEvent(new CustomEvent("site:playing", { detail: { playing: false } })); }, 5000);
          return [PT("{name} dances. ♪", { name: data.name })];
        case "hide": setHidden(true); return [PT("{name} hides. (`pet show` brings it back)", { name: data.name })];
        case "show": setHidden(false); return [PT("{name} is back. ✦", { name: data.name })];
        default: return { lines: [`pet: unknown command '${sub}'. try: status, pat, feed, name, nap, wake, dance, hide, show`], code: 1 };
      }
    },
  };

  // ------------------------------------------------------------- dev: ?petsheet draws every pose (tools/pet-sheet.html)
  if (/[?&]petsheet\b/.test(location.search)) {
    const faces = [["open", ""], ["blink", ""], ["happy", "smile"], ["surprised", "o"], ["sleep", "none"], ["open", "open"]];
    const Z = 6, sheet = document.createElement("canvas");
    sheet.width = faces.length * (N + 2) * Z; sheet.height = STAGES.length * (N + 2) * Z;
    const g2 = sheet.getContext("2d");
    STAGES.forEach((_, si) => faces.forEach(([f, m], fi) => {
      const g = sprite({ stage: si, face: f, mouth: m, look: { x: fi === 0 ? 1 : 0, y: 0 }, squash: fi === 5 ? 1 : 0, step: fi === 1 ? 1 : 0, held: false, blush: fi === 2, wobble: 0, cracks: si === 0 ? fi % 4 : 0, twinkle: fi % 2 });
      for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) { const col = g[yy * N + xx]; if (col) { g2.fillStyle = col; g2.fillRect((fi * (N + 2) + 1 + xx) * Z, (si * (N + 2) + 1 + yy) * Z, Z, Z); } }
    }));
    Object.assign(sheet.style, { position: "fixed", left: "10px", top: "10px", zIndex: 99, background: "rgba(128,128,128,.25)" });
    document.body.appendChild(sheet);
  }

  // ------------------------------------------------------------- hello
  label();
  wrap.hidden = data.hidden;
  restore.hidden = !data.hidden;
  if (isNight() && stage > 0) state = "sleep";
  render(now());
  place();
  if (!data.hidden) {
    setTimeout(() => {
      if (data.visits === 1 && stage === 0) say("an egg appeared… pat it?", 3600);
      else if (newSession && stage > 0) {
        const days = Math.floor(away / 86400000);
        say(state === "sleep" ? "zz… (it's night in Taipei)" : days >= 3 ? PT("you're back! it's been {days} days ✦", { days }) : PT("welcome back! visit #{n}", { n: data.visits }), 3200);
        if (state !== "sleep") { setFace("happy", 1500, "smile"); bounce(1, 200); }
      }
    }, 900);
  }
  schedule();
})();
