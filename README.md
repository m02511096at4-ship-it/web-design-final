# 第6回 サーバの動かし方

1. このフォルダ(server)を VS Code で開く
2. ターミナルを開く(表示 → ターミナル)。右側に server と出ていることを確かめる
3. 最初の1回だけ:npm install (Express が node_modules に入る)
4. 起動:node --watch server.js → 「サーバを起動しました」
5. ブラウザで http://localhost:3000/ を開く。管理画面は http://localhost:3000/admin.html
6. 止めるときは Ctrl + C

第5回の server フォルダで続ける人は、server.js の STEP 7 から下と、public の admin.html・admin.js・style.css を持ってくる。

## 確かめる API

| 操作 | メソッドと URL | 成功 | 失敗 |
| --- | --- | --- | --- |
| 一覧 | GET /api/works | 200 | - |
| 1件 | GET /api/works/2 | 200 | 404 |
| 追加 | POST /api/works | 201 | 400(入力の誤り) |
| 削除 | DELETE /api/works/5 | 204 | 404 |
| 書きかえ(発展) | PUT /api/works/2 | 200 | 400・404 |

ブラウザのコンソール(F12 → Console)から送って確かめる。

```js
fetch("/api/works", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "試し", year: "2026年", summary: "テスト" })
}).then((r) => r.json().then((b) => console.log(r.status, b)));
```

空で送ると 400 と errors が返る:`body: JSON.stringify({})`

削除:`fetch("/api/works/5", { method: "DELETE" }).then((r) => console.log(r.status));`

## 気をつけること

- 管理画面の required や maxlength は、F12 で消せる。上のようにコンソールから送れば画面を通らない。だから同じ確認を server.js(checkWork)でもする
- 届いた文字は textContent で画面に出す。innerHTML に入れると、作品名の <mark> や <script> が HTML として動く(XSS)
- この管理画面にはログインが無い。誰でも追加・削除できる。公開するなら認証が要る(この授業では扱わない)。localhost で動かす間だけ使う
- 追加・削除すると data/works.json が書きかわる。元に戻したいときは GitHub の前の版から取る

## うまくいかないとき

- req.body が undefined → STEP 7 の app.use(express.json()) が無い、または app.post より下に書いた
- POST が 404 → app.post の URL の綴り。/api/works(s を忘れていないか)
- 400 しか返らない → Content-Type: application/json を付けて送ったか
- 削除が 404 → id が数になっていない(Number を忘れていないか)
