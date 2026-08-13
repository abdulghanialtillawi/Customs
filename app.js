
const searchInput = document.getElementById("q");
const clearButton = document.getElementById("clear");
const status = document.getElementById("status");
const pages = Array.from(document.querySelectorAll(".page"));

function normalize(text) {
  return text
    .toLocaleLowerCase("ar")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .trim();
}

function runSearch() {
  const query = normalize(searchInput.value);
  let visible = 0;

  pages.forEach((page) => {
    const text = normalize(page.innerText || "");
    const match = !query || text.includes(query);
    page.classList.toggle("hidden", !match);
    if (match) visible++;
  });

  if (!query) {
    status.textContent = `جميع الصفحات ظاهرة (${pages.length} صفحة)`;
  } else {
    status.textContent = `النتائج: ${visible} صفحة من ${pages.length}`;
  }
}

searchInput.addEventListener("input", runSearch);

clearButton.addEventListener("click", () => {
  searchInput.value = "";
  runSearch();
  searchInput.focus();
});

runSearch();
