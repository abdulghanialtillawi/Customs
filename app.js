
const pages = window.BOOK_DATA;
const root = document.getElementById("pages");
const search = document.getElementById("search");
const clear = document.getElementById("clear");
const status = document.getElementById("status");
const mode = document.getElementById("mode");
const noResults = document.getElementById("noResults");

function normalize(s){
  return String(s||"")
    .toLocaleLowerCase("ar")
    .replace(/[ًٌٍَُِّْـ]/g,"")
    .replace(/\u0640/g,"")
    .trim();
}
function escapeHtml(s){
  return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function highlight(text, query){
  if(!query) return escapeHtml(text);
  const n = normalize(text), q = normalize(query);
  if(!q || !n.includes(q)) return escapeHtml(text);
  // Highlight by matching whitespace-normalized exact occurrences where possible.
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"gi");
  return escapeHtml(text).replace(re,m=>`<mark>${m}</mark>`);
}
function render(items, query){
  root.innerHTML = items.map(p=>`
    <article class="page" data-page="${p.page}">
      <div class="page-head"><span>صفحة ${p.page}</span></div>
      <div class="page-body">${highlight(p.text,query)}</div>
    </article>`).join("");
}
function doSearch(){
  const q = search.value.trim();
  const nq = normalize(q);
  let results = pages;
  if(nq) results = pages.filter(p=>normalize(p.text).includes(nq));
  render(results,q);
  noResults.style.display = results.length ? "none" : "block";
  status.textContent = nq
    ? `وجدت ${results.length} صفحة مطابقة من أصل ${pages.length}`
    : `الكتاب: ${pages.length} صفحة`;
}
search.addEventListener("input",doSearch);
clear.addEventListener("click",()=>{search.value="";doSearch();search.focus()});
mode.addEventListener("change",()=>{
  document.body.classList.toggle("compact",mode.value==="compact");
});
render(pages,"");
status.textContent=`الكتاب: ${pages.length} صفحة`;
