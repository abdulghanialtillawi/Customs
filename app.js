
const C=window.BOOK_CONFIG;
const q=document.getElementById("q"), clear=document.getElementById("clear");
const status=document.getElementById("status"), root=document.getElementById("root");
const results=document.getElementById("results"), mode=document.getElementById("mode");
const pageCache=new Map(), indexCache=new Map();
let current=1, searchTimer=null;

function norm(s){return String(s||"").toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g,"").replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/\s+/g," ").trim()}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function shard(w){return (w?w.charCodeAt(0):0)%C.searchShards}

function loadScript(file,varName){
  return new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src=file+"?v=1";
    s.onload=()=>resolve(window[varName]);
    s.onerror=reject;
    document.body.appendChild(s);
  });
}

async function getPageChunk(ch){
  if(pageCache.has(ch)) return pageCache.get(ch);
  const data=await loadScript(C.chunks[ch].file,"PAGE_CHUNK");
  pageCache.set(ch,data);
  window.PAGE_CHUNK=null;
  return data;
}
async function getIndexShard(sh){
  if(indexCache.has(sh)) return indexCache.get(sh);
  const idx=await loadScript(`search-${String(sh).padStart(2,"0")}.js`,"SEARCH_INDEX");
  indexCache.set(sh,idx);
  window.SEARCH_INDEX=null;
  return idx;
}

async function loadPage(n){
  n=Math.max(1,Math.min(C.pages,n));
  const ch=Math.floor((n-1)/C.chunkSize);
  status.textContent=`جاري تحميل الصفحة ${n}…`;
  const arr=await getPageChunk(ch);
  const p=arr.find(x=>x.page===n);
  if(!p)return;
  current=n;
  root.innerHTML=`<section class="reader"><div class="pagebar"><span>صفحة ${p.page} من ${C.pages}</span></div><div class="pagebody">${esc(p.text)}</div></section>
  <div class="nav"><button id="prev">السابق</button><div class="page-number">صفحة ${p.page}</div><button id="next">التالي</button></div>`;
  document.getElementById("prev").disabled=n===1;
  document.getElementById("next").disabled=n===C.pages;
  document.getElementById("prev").onclick=()=>loadPage(n-1);
  document.getElementById("next").onclick=()=>loadPage(n+1);
  status.textContent=`صفحة ${n} من ${C.pages}`;
}

async function searchBook(){
  const raw=q.value.trim(), query=norm(raw);
  if(!query){
    results.innerHTML="";
    await loadPage(current);
    return;
  }

  status.textContent="جاري البحث…";
  const words=[...new Set(query.split(/\s+/).filter(x=>x.length>1))];
  const sets=[];
  for(const w of words){
    const idx=await getIndexShard(shard(w));
    sets.push(new Set(idx[w]||[]));
  }

  let ids=sets[0]?[...sets[0]]:[];
  for(const s of sets.slice(1))ids=ids.filter(x=>s.has(x));

  const byChunk={};
  ids.forEach(id=>{
    const c=Math.floor((id-1)/C.chunkSize);
    (byChunk[c]??=[]).push(id);
  });

  const found=[];
  for(const [c,list] of Object.entries(byChunk)){
    const data=await getPageChunk(+c);
    const map=new Map(data.map(x=>[x.page,x.text]));
    for(const id of list){
      const text=map.get(id)||"";
      if(norm(text).includes(query))found.push({page:id,text});
    }
  }

  found.sort((a,b)=>a.page-b.page);

  if(!found.length){
    results.innerHTML=`<div class="empty">لا توجد نتائج مطابقة.</div>`;
    status.textContent="لا توجد نتائج مطابقة";
    return;
  }

  results.innerHTML=`<table class="result-table"><thead><tr><th>الصفحة</th><th>مقتطف</th><th></th></tr></thead><tbody>
  ${found.slice(0,200).map(x=>{
    const snippet=x.text.replace(/\s+/g," ").slice(0,240);
    return `<tr><td>${x.page}</td><td>${esc(snippet)}</td><td><button data-page="${x.page}">فتح</button></td></tr>`;
  }).join("")}
  </tbody></table>`;

  results.querySelectorAll("button[data-page]").forEach(b=>{
    b.onclick=()=>{results.innerHTML="";loadPage(+b.dataset.page)}
  });
  status.textContent=`وجدت ${found.length} صفحة مطابقة${found.length>200?" (عرض أول 200)":""}`;
}

q.addEventListener("input",()=>{
  clearTimeout(searchTimer);
  searchTimer=setTimeout(searchBook,180);
});
clear.onclick=()=>{
  q.value="";
  results.innerHTML="";
  loadPage(current);
  q.focus();
};
mode.onchange=()=>document.body.classList.toggle("compact",mode.value==="compact");

loadPage(1);
