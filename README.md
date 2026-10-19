# ting39.github.io

Personal homepage. Plain HTML/CSS/JS with no build step.

- `index.html` is the page structure
- `style.css` is the theme (dark by default, with a light toggle)
- `script.js` has the starfield, typewriter, scroll reveals and project rendering
- `projects.js` is the **only file to edit when adding a project**
- `assets/terminal.js` + `.css`: the secret terminal (press `` ` ``, or click `>_` in the footer).
  Loaded on demand, so it costs nothing until someone opens it. Commands are in the
  `COMMANDS` table; the virtual filesystem is built from `projects.js`, `posts.json` and `spotify.json`.
- `.nojekyll` makes GitHub Pages serve files as-is (no Jekyll processing)

Preview locally: `python3 -m http.server 8000`, then open http://localhost:8000
