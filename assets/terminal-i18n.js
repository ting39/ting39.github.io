// Translations for t39sh (assets/terminal.js). Keys are the exact English strings.
// Commands, flags, paths and code stay in English, like a real shell.
(function () {
  const zh = {}, ja = {};
  const add = (en, z, j) => { zh[en] = z; ja[en] = j; };

  // ---- command descriptions (help / man) ----
  [
    ["a calculator", "計算機", "電卓"],
    ["a politer sudo", "比較有禮貌的 sudo", "丁寧な sudo"],
    ["a random saying", "隨機一句話", "ランダムな格言"],
    ["a talking robot says things", "會說話的機器人", "しゃべるロボット"],
    ["brew things", "釀點東西", "何かを淹れる"],
    ["build things", "做點東西", "何かを作る"],
    ["change directory", "切換目錄", "ディレクトリを移動"],
    ["clear the screen (Ctrl+L)", "清除畫面（Ctrl+L）", "画面をクリア（Ctrl+L）"],
    ["close the terminal (Esc)", "關閉終端機（Esc）", "ターミナルを閉じる（Esc）"],
    ["count lines, words, characters", "計算行數、字數、字元數", "行数・単語数・文字数を数える"],
    ["create an empty file (in /tmp)", "建立空檔案（限 /tmp）", "空のファイルを作成（/tmp のみ）"],
    ["do nothing, successfully", "什麼都不做，成功地", "何もしない（成功）"],
    ["do nothing, unsuccessfully", "什麼都不做，失敗地", "何もしない（失敗）"],
    ["drop repeated adjacent lines", "移除相鄰的重複行", "連続する重複行を除去"],
    ["engage the starfield's warp drive", "啟動星空的曲速引擎", "星空のワープドライブを起動"],
    ["execute a command as root", "以 root 身分執行指令", "root として実行"],
    ["first lines of input", "顯示開頭幾行", "先頭の数行を表示"],
    ["follow the white rabbit (any key stops)", "跟著白兔走（按任意鍵停止）", "白ウサギを追え（任意のキーで停止）"],
    ["how long this page has been open", "這個頁面開了多久", "このページを開いている時間"],
    ["interact with the homepage pet", "和首頁的寵物互動", "ホームページのペットと遊ぶ"],
    ["last lines of input", "顯示最後幾行", "末尾の数行を表示"],
    ["list commands", "列出指令", "コマンド一覧"],
    ["list directory contents", "列出目錄內容", "ディレクトリの中身を表示"],
    ["list or define aliases", "列出或定義別名", "エイリアスの一覧・定義"],
    ["list or open blog posts", "列出或開啟文章", "ブログ記事の一覧・表示"],
    ["list projects (optionally by tag)", "列出作品（可依標籤篩選）", "作品一覧（タグで絞り込み可）"],
    ["list running processes", "列出執行中的程序", "実行中のプロセス一覧"],
    ["locate a command", "找出指令的位置", "コマンドの場所を調べる"],
    ["make a directory (in /tmp)", "建立目錄（限 /tmp）", "ディレクトリを作成（/tmp のみ）"],
    ["measure latency to a host (over HTTPS)", "測量到主機的延遲（透過 HTTPS）", "ホストまでの遅延を測定（HTTPS）"],
    ["open a project, post, section or URL", "開啟作品、文章、區塊或網址", "作品・記事・セクション・URL を開く"],
    ["play a game, or a song by number", "玩遊戲，或依編號播放歌曲", "ゲームを遊ぶ／番号で曲を再生"],
    ["print arguments", "印出參數", "引数を表示"],
    ["print environment variables", "印出環境變數", "環境変数を表示"],
    ["print files", "印出檔案內容", "ファイルを表示"],
    ["print system information", "印出系統資訊", "システム情報を表示"],
    ["print the date", "印出日期", "日付を表示"],
    ["print the host name", "印出主機名稱", "ホスト名を表示"],
    ["print the terminal name", "印出終端機名稱", "端末名を表示"],
    ["print user and group ids", "印出使用者與群組 ID", "ユーザー ID とグループ ID を表示"],
    ["print working directory", "印出目前目錄", "現在のディレクトリを表示"],
    ["print your user name", "印出你的使用者名稱", "ユーザー名を表示"],
    ["rainbow-ify text", "把文字變成彩虹", "文字を虹色に"],
    ["remove files (in /tmp)", "刪除檔案（限 /tmp）", "ファイルを削除（/tmp のみ）"],
    ["restart t39sh", "重新啟動 t39sh", "t39sh を再起動"],
    ["reverse each line", "反轉每一行", "各行を逆順に"],
    ["say y forever (Ctrl+C to stop)", "一直說 y（Ctrl+C 停止）", "y を言い続ける（Ctrl+C で停止）"],
    ["search for a pattern", "搜尋符合的內容", "パターンを検索"],
    ["set an environment variable", "設定環境變數", "環境変数を設定"],
    ["show a directory tree", "顯示目錄樹", "ディレクトリツリーを表示"],
    ["show command history", "顯示指令紀錄", "コマンド履歴を表示"],
    ["show the manual for a command", "顯示指令說明書", "コマンドのマニュアルを表示"],
    ["show this month's calendar", "顯示本月月曆", "今月のカレンダーを表示"],
    ["sort lines", "排序", "行を並べ替え"],
    ["steam locomotive (for when you mistype ls)", "蒸汽火車（給打錯 ls 的你）", "蒸気機関車（ls を打ち間違えたあなたへ）"],
    ["switch the site (or terminal) theme", "切換網站（或終端機）主題", "サイト（またはターミナル）のテーマを切り替え"],
    ["system info, with style", "有型的系統資訊", "スタイリッシュなシステム情報"],
    ["tap tempo: measure a beat's BPM", "打拍測速：測量節拍的 BPM", "タップテンポ：BPM を測る"],
    ["this site's git history (live from GitHub)", "本站的 git 紀錄（即時取自 GitHub）", "このサイトの git 履歴（GitHub から取得）"],
    ["ting39's top 5 on repeat; play them here", "ting39 最近常聽的前五名，可在這裡播放", "ting39 の最近のトップ 5。ここで再生できます"],
    ["wait n seconds (Ctrl+C to stop)", "等待 n 秒（Ctrl+C 停止）", "n 秒待つ（Ctrl+C で停止）"],
  ].forEach(([e, z, j]) => add(e, z, j));

  // ---- manual descriptions ----
  add("Lists files. Directories are blue with a trailing /, programs green.\n-a   include hidden files (there are some)\n-l   long format: permissions, owner, size, date\n-1   one entry per line",
    "列出檔案。目錄是藍色並以 / 結尾，程式是綠色。\n-a   包含隱藏檔（真的有）\n-l   詳細格式：權限、擁有者、大小、日期\n-1   每行一個",
    "ファイルを一覧表示します。ディレクトリは青で末尾に /、プログラムは緑です。\n-a   隠しファイルも表示（いくつかあります）\n-l   詳細表示：権限・所有者・サイズ・日付\n-1   1 行に 1 項目");
  add("Prints lines matching a regular expression (JavaScript flavour).\n-i ignore case   -v invert   -n line numbers   -c count only",
    "印出符合正規表示式（JavaScript 語法）的行。\n-i 忽略大小寫   -v 反向   -n 顯示行號   -c 只計數",
    "正規表現（JavaScript 方式）に一致する行を表示します。\n-i 大文字小文字を無視   -v 反転   -n 行番号   -c 件数のみ");
  add("Evaluates arithmetic: + - * / % ^ (or **), parentheses, and\nsqrt sin cos tan asin acos atan log ln log2 log10 exp abs floor ceil round min max pow,\nconstants pi e tau phi, and `ans` for the last result.",
    "計算算式：+ - * / % ^（或 **）、括號，以及\nsqrt sin cos tan asin acos atan log ln log2 log10 exp abs floor ceil round min max pow、\n常數 pi e tau phi，`ans` 代表上一個結果。",
    "計算式を評価します：+ - * / % ^（または **）、括弧、\nsqrt sin cos tan asin acos atan log ln log2 log10 exp abs floor ceil round min max pow、\n定数 pi e tau phi、直前の結果は `ans`。");
  add("Tap any key (or the box) along to a song; t39sh tells you the tempo.\nq ends it. Try it with `spotify play 1` running.",
    "跟著歌曲按任意鍵（或點方框），t39sh 會告訴你速度。\n按 q 結束。可以搭配 `spotify play 1` 試試。",
    "曲に合わせて任意のキー（または枠）をタップすると、t39sh がテンポを教えてくれます。\nq で終了。`spotify play 1` を流しながらどうぞ。");

  // ---- fixed messages ----
  [
    ["open: that project has no link yet", "open：這個作品還沒有連結", "open：この作品にはまだリンクがありません"],
    ["What manual page do you want?\nFor example, try 'man ls'.", "你想看哪一份說明書？\n例如試試 'man ls'。", "どのマニュアルを見ますか？\n例：'man ls'"],
    ["man: a manual for manuals. you're using it right now. 📖", "man：說明書的說明書。你正在用它。📖", "man：マニュアルのためのマニュアル。今まさに使っています。📖"],
    ["cd: too many arguments", "cd：參數太多", "cd：引数が多すぎます"],
    ["touch: missing file operand", "touch：缺少檔名", "touch：ファイル名がありません"],
    ["mkdir: missing operand", "mkdir：缺少參數", "mkdir：引数がありません"],
    ["rm: missing operand", "rm：缺少參數", "rm：引数がありません"],
    ["no games yet. soon.", "還沒有遊戲，快了。", "まだゲームはありません。もうすぐです。"],
    ["games:", "遊戲：", "ゲーム："],
    ["no posts yet. (the blog is warming up.)", "還沒有文章。（部落格暖身中）", "まだ記事はありません。（ブログは準備運動中）"],
    ["spotify: no data (spotify.json didn't load)", "spotify：沒有資料（spotify.json 沒有載入）", "spotify：データがありません（spotify.json を読み込めませんでした）"],
    ["spotify: the player isn't available on this page", "spotify：這個頁面沒有播放器", "spotify：このページではプレーヤーを使えません"],
    ["paused.", "已暫停。", "一時停止しました。"],
    ["resumed.", "繼續播放。", "再開しました。"],
    ["there's no pet here (yet). 🥚", "這裡（還）沒有寵物。🥚", "ここには（まだ）ペットがいません。🥚"],
    ["warp: disabled (prefers-reduced-motion). the stars thank you.", "warp：已停用（減少動態效果）。星星們感謝你。", "warp：無効（視差効果を減らす設定）。星たちが感謝しています。"],
    ["warp: no starfield on this page", "warp：這個頁面沒有星空", "warp：このページには星空がありません"],
    ["alias: let's not make a loop", "alias：我們還是別製造無限迴圈吧", "alias：無限ループはやめておきましょう"],
    ["matrix: needs a screen", "matrix：需要螢幕", "matrix：画面が必要です"],
    ["bpm: needs a screen", "bpm：需要螢幕", "bpm：画面が必要です"],
    ["danmaku: needs a screen", "danmaku：需要螢幕", "danmaku：画面が必要です"],
    ["no tempo detected. (tap at least twice)", "沒有偵測到速度。（至少要按兩下）", "テンポを検出できませんでした。（2 回以上タップしてください）"],
    ["run this in a real terminal:", "請在真正的終端機執行：", "本物のターミナルで実行してください："],
    ["sleep: missing operand", "sleep：缺少參數", "sleep：引数がありません"],
    ["Okay. 🥪", "好的。🥪", "了解。🥪"],
    ["Sorry, try again.", "抱歉，請再試一次。", "もう一度お試しください。"],
    ["sudo: 3 incorrect password attempts", "sudo：密碼錯誤 3 次", "sudo：パスワードを 3 回間違えました"],
    ["No. Not even if you ask nicely. 💜", "不行。客氣地問也不行。💜", "だめです。丁寧に頼んでもだめです。💜"],
    ["What? Make it yourself.", "什麼？自己做。", "え？自分で作ってください。"],
    ["brew: this is a web page; everything is already installed. ✨", "brew：這是網頁，所有東西都已經裝好了。✨", "brew：ここはウェブページです。すべてインストール済みです。✨"],
    ["Nothing happens.", "什麼事都沒發生。", "何も起こらない。"],
    ["nano: too easy. this shell only ships with vim. (try it, if you're brave)", "nano：太簡單了。這個 shell 只附 vim。（有膽就試試）", "nano：簡単すぎます。この shell には vim しかありません。（勇気があればどうぞ）"],
    ["emacs: this browser only has room for one operating system, sorry.", "emacs：抱歉，這個瀏覽器只裝得下一個作業系統。", "emacs：すみません、このブラウザには OS を 1 つしか入れられません。"],
    ["System is going down for a nap. Good night ✦", "系統要去睡個午覺了。晚安 ✦", "システムはお昼寝に入ります。おやすみなさい ✦"],
    ["E32: No file name", "E32：沒有檔名", "E32：ファイル名がありません"],
    ["you're looking for :q", "你要找的是 :q", "お探しのものは :q です"],
    ["HTTP 418: I'm a teapot. ☕ (RFC 2324)", "HTTP 418：我是茶壺。☕（RFC 2324）", "HTTP 418：私はティーポットです。☕（RFC 2324）"],
    ["Type help to look around, Tab to complete, Esc to leave.", "輸入 help 四處看看，Tab 自動完成，Esc 離開。", "help で見て回り、Tab で補完、Esc で終了。"],
    ["— ting39's terminal. Commands:", "— ting39 的終端機。指令：", "— ting39 のターミナル。コマンド："],
    ["  keys  Tab complete · ↑↓ history · Ctrl+R search · Ctrl+L clear · Ctrl+C cancel · Esc close", "  按鍵  Tab 補完 · ↑↓ 紀錄 · Ctrl+R 搜尋 · Ctrl+L 清除 · Ctrl+C 取消 · Esc 關閉", "  キー  Tab 補完 · ↑↓ 履歴 · Ctrl+R 検索 · Ctrl+L クリア · Ctrl+C 中断 · Esc 閉じる"],
    ["  try   ", "  試試  ", "  例    "],
    ["  (a few things here aren't listed. curiosity is rewarded.)", "  （有些東西沒列出來。好奇心會有回報。）", "  （ここに載っていないものもあります。好奇心は報われます。）"],
    ["t39sh manual", "t39sh 說明書", "t39sh マニュアル"],
  ].forEach(([e, z, j]) => add(e, z, j));

  // ---- fortunes ----
  [
    ["Weeks of coding can save you hours of planning.", "寫幾週程式，可以省下幾小時的規劃。", "何週間ものコーディングで、数時間の計画を節約できる。"],
    ["There's no place like 127.0.0.1.", "金窩銀窩，不如 127.0.0.1。", "127.0.0.1 ほど落ち着く場所はない。"],
    ["A perfect run is just a hundred failed runs you didn't upload.", "完美的一輪，只是你沒上傳的一百次失敗。", "完璧なプレイとは、アップロードしなかった百回の失敗のこと。"],
    ["The bug is never where you're looking. That's why it's still there.", "Bug 永遠不在你找的地方，所以它還在。", "バグは探している場所には絶対にない。だからまだ残っている。"],
    ["Full combo is a state of mind. So is 'it works on my machine'.", "Full Combo 是一種心境，「在我電腦上可以跑」也是。", "フルコンボは心の持ちよう。「自分の環境では動く」も同じ。"],
    ["Every hard platformer is secretly a rhythm game.", "每款硬派平台遊戲，其實都是節奏遊戲。", "難しいアクションゲームは、実はすべて音ゲーである。"],
    ["Gradient descent: confidently walking downhill in the fog.", "梯度下降：在霧裡自信地往下坡走。", "勾配降下法：霧の中を自信満々に下っていくこと。"],
    ["If it compiles on the first try, be suspicious.", "一次就編譯成功？小心有詐。", "一発でコンパイルが通ったら、疑ってかかれ。"],
    ["Your model isn't overfitting. It's just very, very attached.", "你的模型沒有過擬合，它只是非常、非常戀舊。", "モデルは過学習していない。ただ、とても愛着が強いだけ。"],
    ["Today's forecast: 100% chance of side projects.", "今日預報：寫 side project 的機率 100%。", "本日の予報：サイドプロジェクト確率 100%。"],
    ["Read the error message. No, the whole error message.", "讀錯誤訊息。不，是整段錯誤訊息。", "エラーメッセージを読もう。いや、全部読もう。"],
    ["The best time to write tests was before the bug. The second best time is now.", "寫測試最好的時機是出 bug 之前，其次是現在。", "テストを書く最良のときはバグの前。次に良いのは今。"],
    ["Somewhere, a BPM is waiting for you to match it.", "某個地方，有個 BPM 正等著你跟上。", "どこかで、ある BPM があなたを待っている。"],
    ["Off-by-one errors are the second hardest problem. Or the first.", "差一錯誤是第二難的問題。或第一難。", "オフバイワンエラーは 2 番目に難しい問題だ。あるいは 1 番目。"],
    ["Lost a life? The checkpoint still believes in you.", "少了一條命？存檔點還是相信你。", "ミスした？チェックポイントはまだあなたを信じている。"],
    ["Sleep is a cache flush for the brain.", "睡覺是大腦的快取清除。", "睡眠は脳のキャッシュクリア。"],
    ["A star is just a very patient explosion.", "恆星只是一場非常有耐心的爆炸。", "恒星とは、とても気の長い爆発のことだ。"],
    ["The stack overflows; the stars do not.", "堆疊會溢位，星星不會。", "スタックはあふれても、星はあふれない。"],
    ["Practise the hard part slowly, and the easy part takes care of itself.", "難的部分慢慢練，簡單的部分自然會好。", "難しいところをゆっくり練習すれば、簡単なところは自然とできる。"],
    ["Undocumented features are just secrets with good PR.", "沒寫在文件裡的功能，只是公關做得好的秘密。", "ドキュメントにない機能とは、宣伝上手な秘密のこと。"],
    ["There are 10 kinds of people: those who read binary and those who don't.", "世上有 10 種人：看得懂二進位的，和看不懂的。", "世の中には 10 種類の人間がいる。2 進数が読める人と、読めない人だ。"],
    ["Ship it, then make it beautiful. Then ship it again.", "先上線，再把它變漂亮，然後再上線一次。", "まず出す。それから美しくする。そしてまた出す。"],
    ["Hit the note, not the button.", "要打的是音符，不是按鈕。", "叩くのはボタンではなく、音符だ。"],
    ["The terminal is the only UI that has never asked you to accept cookies.", "終端機是唯一從沒要你接受 cookie 的介面。", "ターミナルは、Cookie への同意を一度も求めてこなかった唯一の UI だ。"],
    ["Rest is part of the training loop.", "休息也是訓練迴圈的一部分。", "休息もトレーニングループの一部。"],
    ["Somewhere between 'it's impossible' and 'it's trivial' lies the actual work.", "真正的工作，就在「不可能」和「很簡單」之間。", "「無理だ」と「簡単だ」の間に、本当の仕事がある。"],
    ["Every expert was once a beginner who refused to rage-quit.", "每個高手，都曾是拒絕氣到摔手把的新手。", "どんな達人も、かつてはキレて投げ出さなかった初心者だった。"],
    ["Comments lie. Code lies less. Tests tattle.", "註解會說謊，程式碼比較少說謊，測試會打小報告。", "コメントは嘘をつく。コードはあまり嘘をつかない。テストは告げ口する。"],
  ].forEach(([e, z, j]) => add(e, z, j));

  // ---- whole files (looked up by key, see terminal.js LF()) ----
  zh["file:README.md"] = `# 歡迎來到 ting39 的家目錄 👋

  about.txt      這是誰
  projects/      我做過的東西         → open <名稱>
  blog/          文章                 → blog
  music/         最近常聽             → spotify play 1
  contact.txt    打聲招呼

這裡也有隱藏檔。\`ls\` 有個參數可以看到它們。
`;
  ja["file:README.md"] = `# ting39 のホームディレクトリへようこそ 👋

  about.txt      これは誰？
  projects/      作ったもの           → open <名前>
  blog/          記事                 → blog
  music/         最近よく聴く曲       → spotify play 1
  contact.txt    ひと言どうぞ

隠しファイルもあります。\`ls\` にはそれを見るためのオプションがあります。
`;
  zh["file:about.txt"] = `ting39
======
嗨，我是 ting39。這裡是我在網路上的小角落，放著我一路
做出來、弄壞、學到的東西。

喜歡    節奏遊戲和它們的音樂（lapix、Nhato、t+pazolite）、
        東方 Project 與 ZUN 的配樂、硬派精準的平台遊戲、
        資訊工程與機器學習
本站    放在 GitHub Pages 上的純 HTML/CSS/JS，頁面本身不需要建置。
        你現在就在它裡面。
`;
  ja["file:about.txt"] = `ting39
======
こんにちは、ting39 です。ここは私のネット上の小さな居場所で、
作ったもの、壊したもの、その途中で学んだことを置いています。

好きなもの  音ゲーとその音楽（lapix、Nhato、t+pazolite）、
            東方 Project と ZUN のサウンドトラック、
            ハードで精密なアクションゲーム、情報科学と機械学習
このサイト  GitHub Pages 上の素の HTML/CSS/JS。ページ自体のビルドは不要です。
            あなたは今その中にいます。
`;

  // ---- templates with {placeholders} ----
  zh["tpl:motd1"] = "t39sh {v} · ting39 的終端機"; ja["tpl:motd1"] = "t39sh {v} · ting39 のターミナル";
  zh["tpl:last"] = "上次登入：{d}，使用 {b}"; ja["tpl:last"] = "前回のログイン：{d}（{b}）";
  zh["tpl:first"] = "第一次登入。歡迎，{u}！"; ja["tpl:first"] = "初めてのログインです。ようこそ、{u} さん！";
  zh["tpl:noman"] = "沒有 {n} 的說明書"; ja["tpl:noman"] = "{n} のマニュアルはありません";
  zh["tpl:alias"] = "（{a} 的別名）"; ja["tpl:alias"] = "（{a} のエイリアス）";

  window.TERM_I18N = { "zh-TW": zh, ja };
})();
