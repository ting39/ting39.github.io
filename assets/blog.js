/* Blog pages: theme toggle, a still starfield, copy buttons, reading progress,
   and the same secret terminal as the homepage (press `). */
(() => {
  "use strict";
  const root = document.documentElement;
  const BASE = new URL("..", document.currentScript.src); // the site root (this file lives in /assets/)

  // ---- language (assets/i18n.js): switcher + show the post in the reader's language ----
  if (window.I18N) {
    const ls = document.getElementById("langSwitch");
    if (ls) I18N.switcher(ls);
    I18N.apply(document);
    const post = document.querySelector("article.post h1");
    const retitle = () => { const v = post && [...post.children].find((e) => !e.hidden); if (v) document.title = v.textContent + " · ting39"; };
    retitle(); I18N.onChange(retitle);
  }

  const setTheme = (t) => {
    root.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch {}
  };
  document.getElementById("themeToggle")?.addEventListener("click", () => setTheme(root.dataset.theme === "light" ? "dark" : "light"));
  const fy = document.getElementById("footYear");
  if (fy) fy.textContent = new Date().getFullYear();

  // ---- starfield, drawn once (no animation loop, so reading costs no CPU) ----
  const sky = document.getElementById("sky");
  if (sky) {
    const ctx = sky.getContext("2d");
    const draw = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight;
      sky.width = W * dpr; sky.height = H * dpr;
      sky.style.width = W + "px"; sky.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const rgb = getComputedStyle(root).getPropertyValue("--star").trim();
      let seed = 39;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0, n = Math.floor((W * H) / 11000); i < n; i++) {
        ctx.fillStyle = `rgba(${rgb},${0.15 + rnd() * 0.45})`;
        ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, rnd() * 1.3 + 0.3, 0, Math.PI * 2); ctx.fill();
      }
    };
    let t = 0;
    addEventListener("resize", () => { clearTimeout(t); t = setTimeout(draw, 120); });
    new MutationObserver(draw).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    draw();
  }

  // ---- copy buttons on code blocks ----
  document.querySelectorAll("figure.code").forEach((fig) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy";
    btn.textContent = "copy";
    btn.setAttribute("aria-label", "Copy code to clipboard");
    btn.addEventListener("click", async () => {
      const code = fig.querySelector("code");
      try {
        await navigator.clipboard.writeText(code.innerText);
        btn.textContent = "copied ✓";
      } catch {
        const r = document.createRange();
        r.selectNodeContents(code);
        getSelection().removeAllRanges();
        getSelection().addRange(r);
        btn.textContent = "selected";
      }
      setTimeout(() => (btn.textContent = "copy"), 1600);
    });
    (fig.querySelector("figcaption") || fig).appendChild(btn);
  });

  // ---- reading progress ----
  const bar = document.querySelector(".progress"), prose = document.querySelector(".prose");
  if (bar && prose) {
    let queued = false;
    const update = () => {
      queued = false;
      const r = prose.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / Math.max(1, r.height)));
      bar.style.transform = `scaleX(${p})`;
    };
    addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }
  if (innerWidth > 900) document.querySelector(".toc")?.setAttribute("open", "");

  // ---- shared API + the secret terminal ----
  const json = (f) => fetch(new URL(f, BASE), { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  let postsP, spotifyP;
  window.SITE = {
    setTheme,
    getPosts: () => (postsP ||= json("posts.json")),
    getSpotify: () => (spotifyP ||= json("spotify.json")),
    scrollTo: (id) => { location.href = new URL(id === "top" ? "" : "#" + id, BASE).href; },
  };
  const load = (tag, attrs) => new Promise((res, rej) => {
    const el = Object.assign(document.createElement(tag), attrs);
    el.onload = res; el.onerror = rej;
    document.head.appendChild(el);
  });
  const TERM_V = "3"; // keep in sync with script.js
  let termP = null;
  function openTerminal(cmd) {
    if (window.T39SH) return window.T39SH.open(cmd);
    termP ||= Promise.all([
      load("link", { rel: "stylesheet", href: new URL("assets/terminal.css?v=" + TERM_V, BASE).href }),
      load("script", { src: new URL("assets/terminal-i18n.js?v=" + TERM_V, BASE).href }),
      load("script", { src: new URL("assets/terminal.js?v=" + TERM_V, BASE).href }),
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
})();
