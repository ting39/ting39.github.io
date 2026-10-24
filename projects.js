// Add projects here; the page renders them automatically.
// Each entry: { title, description, tags: [..], link, repo, emoji, i18n?: { "zh-TW": { description }, ja: { description } } }
// Example:
// {
//   title: "My Cool Thing",
//   description: "One sentence about what it does.",
//   tags: ["python", "ml"],
//   link: "https://ting39.github.io/my-cool-thing",
//   repo: "https://github.com/ting39/my-cool-thing",
//   emoji: "🚀"
// },
window.PROJECTS = [
  {
    title: "Eighth Segment",
    description: "A hard, minimal precision platformer. You are the decimal point; lit segments are solid, and every number in the machine is counting something. Move + jump only — progress comes from figuring out what the numbers mean.",
    tags: ["game", "platformer", "puzzle", "canvas", "web audio"],
    link: "https://ting39.github.io/eighth-segment/",
    repo: "https://github.com/ting39/eighth-segment",
    i18n: {
      "zh-TW": { description: "一款硬派、極簡的精準平台遊戲。你是小數點；亮著的筆畫是實體，而機器裡的每個數字都在計算某件事。只有移動與跳躍，想前進就得弄懂那些數字的意義。" },
      ja: { description: "ハードでミニマルな精密アクション。あなたは小数点です。点灯しているセグメントは足場になり、機械の中の数字はすべて何かを数えています。操作は移動とジャンプだけ。先へ進む鍵は、数字の意味を理解することです。" },
    },
    emoji: "🔢"
  },
  {
    title: "Gatewright",
    description: "A puzzle game: start with one NAND gate and wire your way up to a working 8-bit CPU, then write assembly that runs on it.",
    tags: ["game", "logic", "cpu", "javascript"],
    link: "https://ting39.github.io/gatewright/",
    repo: "https://github.com/ting39/gatewright",
    i18n: {
      "zh-TW": { description: "解謎遊戲：從一顆 NAND 閘開始，一路接線打造出能運作的 8 位元 CPU，再寫組合語言讓它跑起來。" },
      ja: { description: "パズルゲーム。NAND ゲート 1 つから配線を重ねて動く 8 ビット CPU を作り上げ、その上で動くアセンブリを書きます。" },
    },
    emoji: "🔌"
  },
];
