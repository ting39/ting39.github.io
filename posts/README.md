# Writing a post

1. Copy `_template.md` to `posts/<slug>.md`. The file name is the URL:
   `posts/my-first-post.md` → https://ting39.github.io/blog/my-first-post/
   (lowercase letters, digits and dashes only).
2. Fill in the front matter at the top and write Markdown below it.
3. Commit and push to `main`. The **Build blog** GitHub Action renders everything
   (post page, blog index, tag pages, RSS/Atom feeds, `posts.json` for the homepage)
   and commits the result. It's live a minute or two later.

Front matter:

```yaml
---
title: My first post          # required
date: 2026-10-20              # required, YYYY-MM-DD (Taiwan time)
tags: [web, notes]            # optional
summary: One sentence.        # optional; defaults to the first paragraph
draft: true                   # optional; drafts are skipped (remove the line to publish)
updated: 2026-10-21           # optional
lang: zh-Hant                 # optional; guessed from the text (中文 posts are detected)
---
```

What the Markdown supports: headings, **bold**, *italic*, ~~strike~~, `code`, links and
images (`![alt](path "caption")` alone in a paragraph becomes a captioned figure),
lists and `- [ ]` task lists, tables, footnotes (`[^1]`), `> [!NOTE]` / `[!TIP]` /
`[!WARNING]` callouts, and fenced code blocks with highlighting
(` ```js title="file.js" `; js/ts, python, c/cpp/java/go/rust, bash, json, css, html,
yaml, sql, diff). Raw HTML works too. Put images in `posts/img/` and link them as
`../../posts/img/name.png`.

Preview locally (optional):

```bash
node tools/blog/build.mjs --drafts   # build, including drafts
python3 -m http.server 8000          # then open http://localhost:8000/blog/
node tools/blog/build.mjs            # rebuild without drafts before committing
```

Run the tests with `node --test tools/blog/test/`.
