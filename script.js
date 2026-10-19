(() => {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- theme ----
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.dataset.theme = saved;
  } catch {}
  document.getElementById("themeToggle").addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  });

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
  let W, H, stars = [], mouse = { x: -999, y: -999 };
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
    for (const s of stars) {
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
  fetch("spotify.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      const tracks = (data && data.tracks) || [];
      if (!tracks.length) return;
      document.getElementById("tracks").innerHTML = tracks.map((t, i) => {
        const url = safeUrl(t.url), img = safeUrl(t.image);
        const tag = url ? `a href="${esc(url)}" target="_blank" rel="noopener"` : "div";
        return `<li><${tag} class="card track">
          <span class="rank">${i + 1}</span>
          ${img ? `<img src="${esc(img)}" alt="" loading="lazy" width="64" height="64">` : `<span class="noart">♪</span>`}
          <span class="meta"><b>${esc(t.name)}</b><small>${esc(t.artists)}</small></span>
          <span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>
        </${tag.split(" ")[0]}></li>`;
      }).join("");
      document.getElementById("musicUpdated").textContent = data.updated || "";
      const sec = document.getElementById("music");
      sec.hidden = false;
      document.getElementById("musicNav").hidden = false;
      document.getElementById("contactNum").textContent = "04.";
      io.observe(sec); navIO.observe(sec);
    })
    .catch(() => {});

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
