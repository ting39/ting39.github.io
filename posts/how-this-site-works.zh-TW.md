---
title: 這個網站是怎麼運作的
summary: 帶你看看 ting39.github.io 背後的各個零件：從星空背景、秘密終端機，到這個部落格。
---

這個網站刻意做得很小：純 HTML、CSS 和 JavaScript，放在 GitHub Pages 上，
首頁本身沒有框架，也不需要建置。以下是你正在閱讀的這一頁背後發生的事。

> [!NOTE]
> 這第一篇文章是 AI 助理 Claude 和 ting39 一起製作網站時寫的，
> 當作說明文件。ting39 可以修改它，或在 front matter 加上
> `draft: true` 把它隱藏起來。

## 首頁

背景是一個 `<canvas>` 星空：幾百個慢慢飄動的點，游標靠近時會連出淡淡的線。
其他部分都是一般的 HTML。作品卡片來自單一檔案 `projects.js`，
所以新增作品只需要加上一個物件：

```js title="projects.js"
window.PROJECTS = [
  {
    title: "Gatewright",
    description: "From one NAND gate to a CPU.",
    tags: ["game", "logic"],
    link: "https://ting39.github.io/gatewright/",
  },
];
```

## 每週更新的音樂

「最近常聽」區塊列出 ting39 過去四週最常播放的五首歌。
每週一台灣時間 08:00，GitHub Action 會向 Spotify Web API 查詢熱門曲目，
並把結果提交到 `spotify.json`，頁面再讀取這個檔案。播放按鈕只有在你按下時
才會載入 Spotify 的嵌入式播放器，所以沒按播放的訪客不會從 Spotify 載入任何東西。

## 藏在頁面裡的終端機

在網站任何地方按 <kbd>\`</kbd>，或點頁尾的 `>_`，就會滑出一個小小的 shell。
它的檔案系統是用網站自己的資料建出來的：

| 路徑 | 內容 |
|---|---|
| `~/projects/` | 每張作品卡片一個檔案 |
| `~/blog/` | 這個部落格的文章（原始 Markdown） |
| `~/music/on-repeat.txt` | 和首頁一樣的前五名 |

它有指令紀錄、Tab 自動完成、管線（`history | grep cd`）、`man` 說明書，
還有幾個 `help` 沒提到的東西。程式碼只會在你第一次打開時下載。

## 這個部落格

文章是放在 `posts/` 裡的 Markdown 檔。推送之後會觸發另一個 Action，
執行一支小小的 Node 腳本（`tools/blog/build.mjs`，沒有任何相依套件）來產生：

- 每篇文章的頁面，以及文章索引和每個標籤的頁面，
- 一個 [Atom 訂閱](../../feed.xml)和一個 RSS 訂閱，
- `posts.json`，給首頁和終端機讀取。

程式碼區塊在建置時就上好色了，所以頁面不需要額外的 JavaScript 來顯示顏色。
輸出是固定的：沒改文章就重新建置，不會有任何變化，讓提交紀錄保持乾淨。

## 為什麼要這麼簡單？

一個只由檔案組成的網頁，不需要維護就能一直運作。沒有伺服器、沒有資料庫，
也沒有要更新的相依套件。需要執行某些事情時，例如每週更新 Spotify 或重建部落格，
就由排程的 GitHub Action 執行並提交結果。之後網站又變回單純的檔案。
