
(() => {
  "use strict";

  const data = Array.isArray(window.BOOK_DATA) ? window.BOOK_DATA : [];
  const search = document.getElementById("search");
  const clear = document.getElementById("clear");
  const prev = document.getElementById("prev");
  const next = document.getElementById("next");
  const status = document.getElementById("status");
  const resultsBox = document.getElementById("results");
  const empty = document.getElementById("empty");

  let matches = [];
  let current = -1;

  function normalize(s) {
    return String(s || "")
      .toLocaleLowerCase("ar")
      .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function highlight(text, query) {
    const safe = escapeHTML(text);
    const q = normalize(query);
    if (!q) return safe;

    // Highlight using the original text while keeping the PDF wording untouched.
    const parts = q.split(" ").filter(Boolean);
    let out = safe;
    for (const part of parts) {
      const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (escaped) out = out.replace(new RegExp(escaped, "gi"), m => `<mark>${m}</mark>`);
    }
    return out;
  }

  function render(list, query) {
    resultsBox.innerHTML = list.map(p => `
      <article class="page" id="page-${p.page}" data-page="${p.page}">
        <div class="page-head">
          <span>صفحة ${p.page}</span>
        </div>
        <div class="page-body">${highlight(p.text, query)}</div>
      </article>
    `).join("");

    empty.hidden = list.length !== 0;
  }

  function runSearch() {
    const raw = search.value;
    const q = normalize(raw);

    if (!q) {
      matches = data.map((_, i) => i);
      current = -1;
      render(data, "");
      status.textContent = `الكتاب: ${data.length} صفحة`;
    } else {
      matches = [];
      data.forEach((p, i) => {
        if (normalize(p.text).includes(q)) matches.push(i);
      });
      current = matches.length ? 0 : -1;
      render(matches.map(i => data[i]), raw);
      status.textContent = `نتائج البحث: ${matches.length} صفحة من ${data.length}`;
      if (matches.length) focusCurrent(false);
    }

    prev.disabled = matches.length === 0;
    next.disabled = matches.length === 0;
  }

  function focusCurrent(smooth = true) {
    if (current < 0 || !matches.length) return;
    const page = data[matches[current]].page;
    const el = document.getElementById(`page-${page}`);
    if (el) {
      el.classList.add("match");
      el.scrollIntoView({behavior: smooth ? "smooth" : "auto", block:"start"});
    }
  }

  function move(step) {
    if (!matches.length) return;
    current = (current + step + matches.length) % matches.length;
    focusCurrent(true);
    status.textContent = `النتيجة ${current + 1} من ${matches.length}`;
  }

  search.addEventListener("input", runSearch);
  clear.addEventListener("click", () => {
    search.value = "";
    runSearch();
    search.focus();
  });
  prev.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));

  if (!data.length) {
    status.textContent = "تعذر تحميل نص الكتاب. تأكد أن book-data.js موجود بجانب index.html.";
    empty.hidden = false;
    empty.textContent = "تعذر تحميل نص الكتاب. يجب رفع الملفات الثلاثة معًا.";
  } else {
    runSearch();
  }
})();
