/* ウェブデザイン 第6回 完成例:作品一覧を API から描画する(works.html で読み込む)
   STEP を1つずつ有効にして、保存 → ブラウザで確かめる。
   注意:node server.js で起動し、http://localhost:3000/ で開くこと。 */

/* ---- STEP 1 API から取りに行く(fetch) ---- */
fetch("/api/works")
  .then((response) => response.json())   // 届いた文字列を、配列と辞書に変える
  .then((works) => {
    console.log(works);                   // まずコンソールで中身を見る
    showWorks(works);                     // STEP 2 で作る
  })
  .catch((error) => {
    console.error("API から読めません", error);
  });

/* ---- STEP 2 1件ずつカードにして、ul の中に追加する ----
   第6回で書きかえ:クライアントが管理画面から入れた文字をそのまま innerHTML に入れると、
   <mark> や <script> がHTMLとして動いてしまう(XSS)。文字は textContent で入れる */
function showWorks(works) {
  const list = document.querySelector("#work-list");
  if (works.length === 0) {
    list.innerHTML = "<li>作品はまだありません</li>";
    return;
  }
  // 要望 A:「先頭に出す」が付いた作品を先頭へ。sort は安定なので、ほかの作品の順番は変わらない
  works.sort((a, b) => (b.featured === true) - (a.featured === true));
  works.forEach((work) => {
    const li = document.createElement("li");
    li.className = "work-card";
    if (work.featured) li.classList.add("work-card-featured");

    const a = document.createElement("a");
    a.href = `work.html?id=${work.id}`;

    const img = document.createElement("img");
    img.src = work.image;
    img.alt = work.alt;

    const h3 = document.createElement("h3");
    h3.textContent = work.title;                       // 文字として入れる

    const p = document.createElement("p");
    p.textContent = `${work.year} / ${work.tools}`;    // 文字として入れる

    a.append(img, h3, p);
    if (work.featured) {
      // 色だけに頼らず、文字でも「先頭の作品」と分かるようにする
      const badge = document.createElement("strong");
      badge.className = "badge-featured";
      badge.textContent = "先頭の作品";
      a.prepend(badge);
    }
    li.appendChild(a);
    list.appendChild(li);
  });
}

/* ---- 発展 ----
   1. works.json に5件目を足して、HTMLを触らずに一覧が増えることを確かめる
   2. 新しい順に並べる:works.reverse() を forEach の前に入れる
   3. 管理画面で作品名に <mark>目立つ</mark> と入れて、一覧で色が付かず、そのまま文字で出ることを確かめる */
