/* ウェブデザイン 第6回 完成例:作品データを返し、追加・更新・削除もできる API サーバ
   起動:ターミナルで  node --watch server.js  (保存するたびに自動で再起動)
   停止:Ctrl + C
   管理画面:http://localhost:3000/admin.html */

/* ---- STEP 1 Express を読み込んで、サーバを起動する ---- */
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

/* ---- STEP 2 決まった文字を返す ---- */
app.get("/hello", (req, res) => {
  res.send("こんにちは。サーバが応答しています");
});

/* ---- STEP 3 public フォルダの HTML・CSS・JS を返す ---- */
app.use(express.static(path.join(__dirname, "public")));

/* ---- STEP 4 GET /api/works  作品一覧を返す ---- */
const DATA_FILE = path.join(__dirname, "data", "works.json");

function loadWorks() {
  const text = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(text);
}

app.get("/api/works", (req, res) => {
  const works = loadWorks();
  res.json(works);
});

/* ---- STEP 5・6 GET /api/works/:id  作品を1件返す。無ければ 404 ---- */
app.get("/api/works/:id", (req, res) => {
  const id = Number(req.params.id);
  const works = loadWorks();
  const work = works.find((w) => w.id === id);
  if (!work) {
    res.status(404).json({ error: "作品が見つかりません" });
    return;
  }
  res.json(work);
});

/* ==== ここから第6回 ==== */

/* ---- STEP 7 送られてきた JSON を読めるようにし、works.json に書き込む関数を作る ---- */
app.use(express.json());

function saveWorks(works) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(works, null, 2), "utf8");
}

/* ---- STEP 8 入力を確かめる(設計書 5.1 の「必須」「入力の制約」と 5.3 の文言) ---- */
function checkWork(body) {
  const errors = [];
  const text = (value) => (typeof value === "string" ? value.trim() : "");

  if (text(body.title) === "") {
    errors.push({ field: "title", message: "作品名を入れてください" });
  } else if (text(body.title).length > 40) {
    errors.push({ field: "title", message: "作品名は40文字までにしてください" });
  }
  if (text(body.year) === "") {
    errors.push({ field: "year", message: "制作時期を入れてください(例:2026年 春)" });
  }
  if (text(body.summary) === "") {
    errors.push({ field: "summary", message: "一覧に出す一言を入れてください" });
  } else if (text(body.summary).length > 80) {
    errors.push({ field: "summary", message: "一言は80文字までにしてください" });
  }
  if (text(body.tools).length > 100) {
    errors.push({ field: "tools", message: "使った道具は100文字までにしてください" });
  }
  if (text(body.role).length > 60) {
    errors.push({ field: "role", message: "担当は60文字までにしてください" });
  }
  if (text(body.what).length > 400) {
    errors.push({ field: "what", message: "「何を作ったか」は400文字までにしてください" });
  }
  if (text(body.point).length > 400) {
    errors.push({ field: "point", message: "「工夫した点」は400文字までにしてください" });
  }
  return errors;
}

/* 送られてきた項目のうち、設計書 5.1 にあるものだけを取り出す(余計な項目は保存しない) */
function pickWork(body) {
  const text = (value) => (typeof value === "string" ? value.trim() : "");
  return {
    title: text(body.title),
    year: text(body.year),
    tools: text(body.tools),
    role: text(body.role),
    summary: text(body.summary),
    what: text(body.what),
    point: text(body.point),
    image: text(body.image) || "images/placeholder.svg",
    alt: text(body.alt),
    featured: body.featured === true,   // 「先頭に出す」。true のときだけ先頭扱い(要望 A)
  };
}

/* 要望 A:keepId の作品だけに「先頭に出す」を残し、ほかの作品からは外す(付けられるのは1件だけ) */
function keepOnlyFeatured(works, keepId) {
  works.forEach((w) => {
    if (w.id !== keepId) w.featured = false;
  });
}

/* ---- STEP 9 POST /api/works  作品を追加する。正しければ 201、足りなければ 400 ---- */
app.post("/api/works", (req, res) => {
  const errors = checkWork(req.body);
  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }
  const works = loadWorks();
  const newId = works.length === 0 ? 1 : Math.max(...works.map((w) => w.id)) + 1;
  const work = { id: newId, ...pickWork(req.body) };
  works.push(work);
  if (work.featured) keepOnlyFeatured(works, work.id);
  saveWorks(works);
  res.status(201).json(work);
});

/* ---- STEP 10 DELETE /api/works/:id  作品を削除する。204、無ければ 404 ---- */
app.delete("/api/works/:id", (req, res) => {
  const id = Number(req.params.id);
  const works = loadWorks();
  const index = works.findIndex((w) => w.id === id);
  if (index === -1) {
    res.status(404).json({ error: "作品が見つかりません" });
    return;
  }
  works.splice(index, 1);
  saveWorks(works);
  res.status(204).end();
});

/* ---- 発展 PUT /api/works/:id  作品を書きかえる。200、400、404 ---- */
app.put("/api/works/:id", (req, res) => {
  const id = Number(req.params.id);
  const works = loadWorks();
  const index = works.findIndex((w) => w.id === id);
  if (index === -1) {
    res.status(404).json({ error: "作品が見つかりません" });
    return;
  }
  const errors = checkWork(req.body);
  if (errors.length > 0) {
    res.status(400).json({ errors });
    return;
  }
  works[index] = { id, ...pickWork(req.body) };
  if (works[index].featured) keepOnlyFeatured(works, id);
  saveWorks(works);
  res.json(works[index]);
});

/* ---- 起動(いつもファイルの一番下) ---- */
app.listen(PORT, () => {
  console.log(`サーバを起動しました: http://localhost:${PORT}/`);
});
