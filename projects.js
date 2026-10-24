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
    title: "Little Poet",
    description: "A 1.4M-parameter GPT trained from scratch on 21k Tang poems, running in plain JS in your browser. Click any character to see its attention heads, probabilities and embeddings.",
    tags: ["ml", "transformer", "visualization", "javascript"],
    link: "https://ting39.github.io/tinygpt/",
    repo: "https://github.com/ting39/tinygpt",
    i18n: {
      "zh-TW": { description: "用 2.1 萬首唐詩從零訓練的 140 萬參數 GPT，直接在瀏覽器裡用純 JavaScript 執行。點任何一個字，就能看到它的注意力頭、機率分布與嵌入向量。" },
      ja: { description: "2 万 1 千首の唐詩でゼロから学習した 140 万パラメータの GPT。ブラウザ上で素の JavaScript だけで動きます。どの文字をクリックしても、アテンションヘッド・確率・埋め込みを覗けます。" },
    },
    emoji: "🖌️"
  },
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
  {
    title: "2048: Stellar",
    description: "2048 in space. Merge stardust into stars and black holes, with combos, powers, a time-warp mode, secret achievements, and an AI you can watch play or ask for hints.",
    tags: ["game", "javascript", "ai"],
    link: "https://ting39.github.io/2048/",
    repo: "https://github.com/ting39/2048",
    i18n: {
      "zh-TW": { description: "宇宙版 2048。把星塵合成恆星和黑洞，有連擊、特殊能力、時間扭曲模式、隱藏成就，還有能看它玩、也能請它給提示的 AI。" },
      ja: { description: "宇宙を舞台にした 2048。星屑を恒星やブラックホールへと合体させます。コンボ、パワー、タイムワープモード、隠し実績、そしてプレイを観戦したりヒントをもらったりできる AI つき。" },
    },
    emoji: "🪐"
  },
];
