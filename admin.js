/* ウェブデザイン 第6回 完成例:管理画面(作品の追加・編集・削除)
   API:GET /api/works、POST /api/works、PUT /api/works/:id、DELETE /api/works/:id
   エラーの文言はサーバ(設計書 5.3)が返すものを、そのまま入力欄の下に出す */

const form = document.querySelector("#work-form");
const list = document.querySelector("#admin-list");
const statusBox = document.querySelector("#status");
const summary = document.querySelector("#error-summary");
const errorList = document.querySelector("#error-list");
const formTitle = document.querySelector("#form-title");
const submitButton = document.querySelector("#submit-button");
const cancelButton = document.querySelector("#cancel-button");

const FIELDS = ["title", "year", "summary", "tools", "role", "what", "point", "image", "alt"];
let editingId = null;   // 編集中の作品の id。追加のときは null

/* ---- 結果を知らせる ---- */
function showStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle("notice-error", isError);
  statusBox.hidden = false;
}

/* ---- 入力の誤りを消す ---- */
function clearErrors() {
  summary.hidden = true;
  errorList.textContent = "";
  FIELDS.forEach((name) => {
    const input = document.querySelector(`#${name}`);
    const error = document.querySelector(`#${name}-error`);
    input.removeAttribute("aria-invalid");
    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
  });
}

/* ---- 入力の誤りを、欄の下とまとめ欄の両方に出す ---- */
function showErrors(errors) {
  errors.forEach(({ field, message }) => {
    const input = document.querySelector(`#${field}`);
    const error = document.querySelector(`#${field}-error`);
    input.setAttribute("aria-invalid", "true");
    error.textContent = message;
    error.hidden = false;

    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${field}`;
    a.textContent = message;
    li.appendChild(a);
    errorList.appendChild(li);
  });
  summary.hidden = false;
  summary.focus();   // 読み上げソフトにも、まず誤りがあることを伝える
}

/* ---- 一覧を読み込んで表示する(文字は textContent で入れる) ---- */
function loadList() {
  fetch("/api/works")
    .then((response) => response.json())
    .then((works) => {
      list.textContent = "";
      if (works.length === 0) {
        const li = document.createElement("li");
        li.textContent = "まだ作品がありません。上のフォームから追加してください。";
        list.appendChild(li);
        return;
      }
      works.forEach((work) => {
        const li = document.createElement("li");
        const name = document.createElement("span");
        name.textContent = `${work.title}(${work.year})`;
        if (work.featured) {
          const mark = document.createElement("strong");
          mark.className = "badge-featured";
          mark.textContent = "先頭に出す";
          name.append(" ", mark);
        }

        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "btn btn-secondary";
        edit.textContent = "編集";
        edit.addEventListener("click", () => startEdit(work.id));

        const del = document.createElement("button");
        del.type = "button";
        del.className = "btn btn-secondary";
        del.textContent = "削除";
        del.addEventListener("click", () => deleteWork(work));

        li.append(name, edit, del);
        list.appendChild(li);
      });
    })
    .catch(() => showStatus("サーバにつながりません。サーバが起動しているか確かめてください。", true));
}

/* ---- 追加または更新を送る ---- */
form.addEventListener("submit", (event) => {
  event.preventDefault();      // ページを移動させない
  clearErrors();

  const data = {};
  FIELDS.forEach((name) => { data[name] = form.elements[name].value; });
  data.featured = form.elements.featured.checked;   // チェックボックスは .value でなく .checked

  const url = editingId === null ? "/api/works" : `/api/works/${editingId}`;
  const method = editingId === null ? "POST" : "PUT";

  fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((response) => response.json().then((body) => ({ status: response.status, body })))
    .then(({ status, body }) => {
      if (status === 400) {
        showErrors(body.errors);
        return;
      }
      if (status === 404) {
        showStatus("その作品はすでに削除されています。一覧を読み込み直しました。", true);
        endEdit();
        loadList();
        return;
      }
      showStatus(method === "POST" ? `「${body.title}」を追加しました。` : `「${body.title}」の変更を保存しました。`);
      endEdit();
      loadList();
    })
    .catch(() => showStatus("サーバにつながりません。入力した内容は消えていません。サーバが起動しているか確かめて、もう一度押してください。", true));
});

/* ---- 編集を始める ---- */
function startEdit(id) {
  fetch(`/api/works/${id}`)
    .then((response) => response.json())
    .then((work) => {
      clearErrors();
      FIELDS.forEach((name) => { form.elements[name].value = work[name] || ""; });
      form.elements.featured.checked = work.featured === true;
      editingId = id;
      formTitle.textContent = `「${work.title}」を編集する`;
      submitButton.textContent = "変更を保存する";
      cancelButton.hidden = false;
      form.elements.title.focus();
    });
}

/* ---- 編集をやめて、追加の状態に戻す ---- */
function endEdit() {
  editingId = null;
  form.reset();
  formTitle.textContent = "作品を追加する";
  submitButton.textContent = "追加する";
  cancelButton.hidden = true;
}
cancelButton.addEventListener("click", () => { clearErrors(); endEdit(); });

/* ---- 削除する(元に戻せないので、確かめてから) ---- */
function deleteWork(work) {
  const ok = confirm(`「${work.title}」を削除します。元に戻せません。よろしいですか。`);
  if (!ok) return;
  fetch(`/api/works/${work.id}`, { method: "DELETE" })
    .then((response) => {
      if (response.status === 404) {
        showStatus("その作品はすでに削除されています。", true);
      } else {
        showStatus(`「${work.title}」を削除しました。`);
      }
      if (editingId === work.id) endEdit();
      loadList();
    })
    .catch(() => showStatus("サーバにつながりません。サーバが起動しているか確かめてください。", true));
}

loadList();
