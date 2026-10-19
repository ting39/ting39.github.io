---
title: How this site works
date: 2026-10-20
tags: [meta, web]
summary: A tour of the moving parts behind ting39.github.io, from the starfield to the secret terminal and this blog.
---

This site is deliberately small: plain HTML, CSS and JavaScript, served by GitHub Pages,
with no framework and no build step for the homepage itself. Here is what happens behind
the page you are reading.

> [!NOTE]
> This first post was written by Claude, an AI assistant, while building the site
> with ting39. It's meant as documentation. ting39 can edit it, or hide it by adding
> `draft: true` to its front matter.

## The homepage

The background is a `<canvas>` starfield: a few hundred points drifting slowly, with faint
lines drawn to your cursor when it gets close. Everything else is regular HTML. The project
cards come from a single file, `projects.js`, so adding a project means adding one object:

```js title="projects.js"
window.PROJECTS = [
  {
    title: "2048: Stellar",
    description: "2048 in space.",
    tags: ["game", "javascript"],
    link: "https://ting39.github.io/2048/",
  },
];
```

## Music, refreshed weekly

The "on repeat" section lists ting39's five most-played songs of the last four weeks.
A GitHub Action runs every Monday at 08:00 Taiwan time. It asks Spotify's Web API for the
top tracks and commits the result to `spotify.json`, which the page reads. The play buttons
only load Spotify's embedded player when you press one, so visitors who don't press play
load nothing from Spotify.

## A terminal hiding in the page

Press <kbd>\`</kbd> anywhere on the site, or click the `>_` in the footer. A small shell slides
down. Its filesystem is built from the site's own data:

| path | what's in it |
|---|---|
| `~/projects/` | one file per project card |
| `~/blog/` | the posts on this blog, as raw Markdown |
| `~/music/on-repeat.txt` | the same top 5 as the homepage |

It has history, Tab completion, pipes (`history | grep cd`), `man` pages, and a few things
`help` doesn't mention. The code is only downloaded the first time you open it.

## This blog

Posts are Markdown files in `posts/`. Pushing one triggers another Action that runs a small
Node script (`tools/blog/build.mjs`, no dependencies) to render:

- a page for every post, plus the index and one page per tag,
- an [Atom feed](../../feed.xml) and an RSS feed,
- `posts.json`, which the homepage and the terminal read.

Code blocks are highlighted at build time, so pages don't need any extra JavaScript to
show colours. The output is deterministic: rebuilding without changing a post changes
nothing, which keeps the commit history clean.

## Why keep it this simple?

A page that is just files keeps working with no maintenance. There are no servers, no
database and no dependencies to update. When something needs to run, like the weekly
Spotify refresh or rebuilding the blog, a scheduled GitHub Action does it and commits the
result. Then the site is plain files again.
