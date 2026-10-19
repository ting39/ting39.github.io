(() => {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- theme ----
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.dataset.theme = saved;
  } catch {}
  const setTheme = (t) => {
    root.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch {}
  };
  document.getElementById("themeToggle").addEventListener("click", () => setTheme(root.dataset.theme === "light" ? "dark" : "light"));

  // ---- years ----
  const y = new Date().getFullYear();
  document.getElementById("year").textContent = y;
  document.getElementById("footYear").textContent = y;

  // ---- typewriter ----
  const phrases = [
    "building things on the internet.",
    "learning in public.",
    "currently: setting up the playground.",
    "projects loading…",
  ];
  const typed = document.getElementById("typed");
  let p = 0, i = 0, del = false;
  (function type() {
    const s = phrases[p];
    typed.textContent = s.slice(0, i);
    if (!del && i < s.length) i++;
    else if (del && i > 0) i--;
    else if (!del) { del = true; return setTimeout(type, 1600); }
    else { del = false; p = (p + 1) % phrases.length; }
    setTimeout(type, del ? 30 : 60);
  })();

  // ---- starfield / constellation ----
  const c = document.getElementById("sky");
  const ctx = c.getContext("2d");
  let W, H, stars = [], mouse = { x: -999, y: -999 }, warpUntil = 0, warpK = 0;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    c.style.width = W + "px"; c.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.floor((W * H) / 9000);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .15, vy: (Math.random() - .5) * .15,
      r: Math.random() * 1.4 + .3, tw: Math.random() * Math.PI * 2,
    }));
  }
  function draw() {
    const rgb = getComputedStyle(root).getPropertyValue("--star").trim();
    ctx.clearRect(0, 0, W, H);
    // warp drive (terminal `warp`, or the Konami code): stars stream out from the centre
    warpK += ((performance.now() < warpUntil ? 1 : 0) - warpK) * .045;
    if (warpK < .003) warpK = 0;
    for (const s of stars) {
      if (warpK) {
        const dx = s.x - W / 2, dy = s.y - H / 2, px = s.x, py = s.y, k = warpK * .07;
        s.x += dx * k + Math.sign(dx || 1) * warpK; s.y += dy * k;
        if (s.x < 0 || s.x > W || s.y < 0 || s.y > H) {
          s.x = W / 2 + (Math.random() - .5) * W * .3; s.y = H / 2 + (Math.random() - .5) * H * .3;
        } else {
          ctx.strokeStyle = `rgba(${rgb},${Math.min(.9, warpK)})`;
          ctx.lineWidth = s.r;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(s.x, s.y); ctx.stroke();
        }
      }
      if (!reduced) { s.x += s.vx; s.y += s.vy; s.tw += .02; }
      if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
      if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
      const dx = s.x - mouse.x, dy = s.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 140) {
        ctx.strokeStyle = `rgba(124,92,255,${(1 - d / 140) * .6})`;
        ctx.lineWidth = .6;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.fillStyle = `rgba(${rgb},${.4 + Math.sin(s.tw) * .3})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  addEventListener("resize", resize);
  resize(); draw();

  const glow = document.querySelector(".cursor-glow");
  addEventListener("pointermove", (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    glow.style.left = e.clientX + "px"; glow.style.top = e.clientY + "px";
  });

  // ---- reveal on scroll + active nav ----
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) e.target.classList.add("in");
  }), { threshold: .15 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  const links = [...document.querySelectorAll(".nav nav a")];
  const navIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.hash === "#" + e.target.id));
  }), { rootMargin: "-50% 0px -50% 0px" });
  document.querySelectorAll("section[id]").forEach((s) => navIO.observe(s));

  // ---- projects ----
  const projects = window.PROJECTS || [];
  const grid = document.getElementById("projectGrid");
  const filters = document.getElementById("filters");
  document.querySelector(".stat[data-count]").textContent = projects.length;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  function render(tag) {
    const list = tag ? projects.filter((p) => (p.tags || []).includes(tag)) : projects;
    grid.innerHTML = list.map((p) => `
      <article class="card project">
        <div class="emoji">${esc(p.emoji || "✦")}</div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description)}</p>
        <div class="tags">${(p.tags || []).map((t) => `<span>#${esc(t)}</span>`).join("")}</div>
        <div class="plinks">
          ${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">live ↗</a>` : ""}
          ${p.repo ? `<a href="${esc(p.repo)}" target="_blank" rel="noopener">code ↗</a>` : ""}
        </div>
      </article>`).join("");
    grid.querySelectorAll(".project").forEach(tilt);
  }
  if (projects.length) {
    const tags = [...new Set(projects.flatMap((p) => p.tags || []))];
    filters.innerHTML = ["all", ...tags].map((t, k) => `<button class="${k ? "" : "on"}" data-t="${esc(t)}">${esc(t)}</button>`).join("");
    filters.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      filters.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      render(b.dataset.t === "all" ? null : b.dataset.t);
    });
    render(null);
  } else {
    document.getElementById("emptyState").hidden = false;
  }

  // ---- music: top 5 from Spotify (spotify.json is refreshed weekly by a GitHub Action) ----
  const safeUrl = (u) => (/^https:\/\//.test(u || "") ? u : null);
  const spotifyP = fetch("spotify.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  let player = null;
  spotifyP
    .then((data) => {
      const tracks = (data && data.tracks) || [];
      if (!tracks.length) return;
      document.getElementById("tracks").innerHTML = tracks.map((t, i) => {
        const url = safeUrl(t.url), img = safeUrl(t.image);
        const id = ((url || "").match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/) || [])[1];
        const title = url
          ? `<a href="${esc(url)}" target="_blank" rel="noopener" title="Open in Spotify"><b>${esc(t.name)}</b></a>`
          : `<b>${esc(t.name)}</b>`;
        return `<li><div class="card track">
          <span class="rank">${i + 1}</span>
          <span class="art">
            ${img ? `<img src="${esc(img)}" alt="" loading="lazy" width="64" height="64">` : `<span class="noart">♪</span>`}
            ${id ? `<button class="play" data-id="${id}" aria-label="Play ${esc(t.name)}"><span class="ico">▶</span></button>` : ""}
          </span>
          <span class="meta">${title}<small>${esc(t.artists)}</small></span>
          <span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>
        </div></li>`;
      }).join("");
      player = setupPlayer(tracks);
      document.getElementById("musicUpdated").textContent = data.updated || "";
      const sec = document.getElementById("music");
      sec.hidden = false;
      document.getElementById("musicNav").hidden = false;
      document.getElementById("contactNum").textContent = "04.";
      io.observe(sec); navIO.observe(sec);
    })
    .catch(() => {});

  // One shared Spotify embed under the list, loaded only on the first ▶ click
  // (so visitors who never press play load nothing from Spotify).
  function setupPlayer(tracks) {
    const list = document.getElementById("tracks");
    const box = document.getElementById("player");
    let controller = null, current = null, paused = true, pending = null;

    const render = () => {
      list.querySelectorAll(".track").forEach((row) => {
        const btn = row.querySelector(".play");
        const on = !!btn && btn.dataset.id === current;
        row.classList.toggle("active", on);
        row.classList.toggle("playing", on && !paused);
        if (btn) {
          btn.querySelector(".ico").textContent = on && !paused ? "❚❚" : "▶";
          btn.setAttribute("aria-label", (on && !paused ? "Pause " : "Play ") + row.querySelector("b").textContent);
        }
      });
      // the homepage pet dances along; the terminal shows what's playing
      document.dispatchEvent(new CustomEvent("site:playing", { detail: { playing: !!current && !paused, id: current } }));
    };

    const start = (id) => {
      current = id; paused = false; render();
      if (controller) { controller.loadUri("spotify:track:" + id); controller.play(); return; }
      pending = id;
      if (document.getElementById("spotify-iframe-api")) return;
      box.hidden = false;
      window.onSpotifyIframeApiReady = (API) => {
        const el = document.createElement("div");
        box.querySelector(".player-slot").replaceChildren(el);
        API.createController(el, { uri: "spotify:track:" + pending, width: "100%", height: 152 }, (c) => {
          controller = c;
          c.addListener("ready", () => c.play());
          c.addListener("playback_update", (e) => {
            const p = !!(e && e.data && e.data.isPaused);
            if (p !== paused) { paused = p; render(); }
          });
        });
      };
      const s = document.createElement("script");
      s.id = "spotify-iframe-api";
      s.src = "https://open.spotify.com/embed/iframe-api/v1";
      s.async = true;
      s.onerror = () => { box.querySelector(".player-slot").textContent = "Couldn't load the Spotify player. Try the song links instead."; };
      document.body.appendChild(s);
    };

    const toggle = () => {
      if (!controller) return false;
      controller.togglePlay();
      paused = !paused; render();
      return true;
    };
    list.addEventListener("click", (e) => {
      const btn = e.target.closest(".play");
      if (!btn) return;
      const id = btn.dataset.id;
      if (id === current && controller) toggle();
      else start(id);
    });
    const ids = tracks.map((t) => ((t.url || "").match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/) || [])[1]);
    return {
      play(i) { if (!ids[i]) return false; if (ids[i] === current && paused && controller) toggle(); else if (ids[i] !== current) start(ids[i]); return true; },
      toggle,
      state: () => (current ? { index: ids.indexOf(current), paused } : null),
    };
  }

  // ---- shared API for the terminal and the pet (both load lazily) ----
  let postsP = null;
  window.SITE = {
    setTheme,
    scrollTo(id) {
      const el = id === "top" ? document.body : document.getElementById(id);
      if (el && !el.hidden) el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    },
    warp(ms = 3000) { if (!reduced) warpUntil = performance.now() + ms; },
    getSpotify: () => spotifyP,
    getPosts: () => (postsP ||= fetch("posts.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null)),
    playTrack: (i) => !!player && player.play(i),
    togglePlay: () => !!player && player.toggle(),
    nowPlaying: () => (player ? player.state() : null),
  };

  // ---- secret terminal: ` (or the >_ in the footer, or #terminal) opens it; code loads on first use ----
  const TERM_V = "1";
  let termP = null;
  const load = (tag, attrs) => new Promise((res, rej) => {
    const el = Object.assign(document.createElement(tag), attrs);
    el.onload = res; el.onerror = rej;
    document.head.appendChild(el);
  });
  function openTerminal(cmd) {
    if (window.T39SH) return window.T39SH.open(cmd);
    termP ||= Promise.all([
      load("link", { rel: "stylesheet", href: `assets/terminal.css?v=${TERM_V}` }),
      load("script", { src: `assets/terminal.js?v=${TERM_V}` }),
    ]).catch((e) => { termP = null; throw e; });
    termP.then(() => window.T39SH.open(cmd)).catch(() => {});
  }
  const typing = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  addEventListener("keydown", (e) => {
    if (e.key !== "`" || e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return;
    if (window.T39SH && window.T39SH.isOpen()) return;
    e.preventDefault();
    openTerminal();
  });
  document.querySelectorAll("[data-terminal]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); openTerminal(); }));
  if (/^#(terminal|t39sh)$/.test(location.hash)) openTerminal();
  console.log("%c✦ psst: press ` (backtick) on this page.", "color:#00e0c6;font-family:monospace");

  // ---- an old cheat code ----
  const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let kpos = 0;
  addEventListener("keydown", (e) => {
    if (typing(e.target)) return;
    kpos = e.key.toLowerCase() === konami[kpos].toLowerCase() ? kpos + 1 : e.key === "ArrowUp" ? (kpos === 2 ? 2 : 1) : 0;
    if (kpos === konami.length) {
      kpos = 0;
      window.SITE.warp(4000);
      document.dispatchEvent(new CustomEvent("site:konami"));
    }
  });

  function tilt(el) {
    if (reduced) return;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(700px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  }
})();
