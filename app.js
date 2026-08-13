
const C=window.CONFIG, cache=new Map(), indexCache=new Map();
const q=document.getElementById("q"), clear=document.getElementById("clear"), mode=document.getElementById("mode");
const root=document.getElementById("root"), results=document.getElementById("results"), status=document.getElementById("status");
let current=1,timer;

function norm(s){return String(s||"").toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g,"").replace(/[أإآٱ]/g,"ا").replace(/ى/g,"ي").replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/\s+/g," ").trim()}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function load(file,name){return new Promise((res,rej)=>{const s=document.createElement("script");s.src=file;s.onload=()=>res(window[name]);s.onerror=rej;document.body.appendChild(s)})}
async function getChunk(n){if(cache.has(n))return cache.get(n);const a=await load(`pages-${String(n+1).padStart(2,"0")}.js`,"PAGES");cache.set(n,a);window.PAGES=null;return a}
async function getShard(n){if(indexCache.has(n))return indexCache.get(n);const a=await load(`search-${String(n).padStart(2,"0")}.js`,"SEARCH");indexCache.set(n,a);window.SEARCH=null;return a}
async function showPage(n,scroll=true){
 n=Math.max(1,Math.min(C.pages,n)); current=n;
 const ch=Math.floor((n-1)/C.chunkSize);
 status.textContent=`جاري فتح الصفحة ${n}…`;
 const a=await getChunk(ch), p=a.find(x=>x.page===n);
 if(!p)return;
 root.innerHTML=p.html;
 results.innerHTML="";
 status.textContent=`صفحة ${n} من ${C.pages}`;
 if(scroll)window.scrollTo({top:0,behavior:"smooth"});
}
function snippet(text,q){
 const nq=norm(q), nt=norm(text), pos=nt.indexOf(nq);
 let start=Math.max(0,pos-90), end=Math.min(text.length,start+280);
 return esc(text.slice(start,end));
}
async function searchBook(){
 const raw=q.value.trim(), query=norm(raw);
 if(!query){results.innerHTML="";status.textContent=`صفحة ${current} من ${C.pages}`;return}
 status.textContent="جاري البحث…";
 const words=[...new Set(query.split(" ").filter(w=>w.length>1))], sets=[];
 for(const w of words){const ix=await getShard((w.charCodeAt(0)||0)%C.shards);sets.push(new Set(ix[w]||[]))}
 let ids=sets[0]?[...sets[0]]:[];
 for(const s of sets.slice(1))ids=ids.filter(x=>s.has(x));
 const groups={};
 ids.forEach(id=>{const c=Math.floor((id-1)/C.chunkSize);(groups[c]??=[]).push(id)});
 const found=[];
 for(const [c,list] of Object.entries(groups)){
   const a=await getChunk(+c), map=new Map(a.map(x=>[x.page,x.text]));
   for(const id of list){const text=map.get(id)||"";if(norm(text).includes(query))found.push({page:id,text})}
 }
 found.sort((a,b)=>a.page-b.page);
 if(!found.length){results.innerHTML=`<div class="empty">لا توجد نتائج مطابقة.</div>`;status.textContent="لا توجد نتائج مطابقة";return}
 results.innerHTML=`<table class="result-table"><thead><tr><th>الصفحة</th><th>مقتطف من الكتاب</th><th></th></tr></thead><tbody>${found.slice(0,200).map(x=>`<tr><td>${x.page}</td><td>${snippet(x.text,raw)}</td><td><button data-page="${x.page}">فتح</button></td></tr>`).join("")}</tbody></table>`;
 results.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>showPage(+b.dataset.page));
 status.textContent=`وجدت ${found.length} صفحة مطابقة${found.length>200?" — عُرض أول 200":""}`;
}
q.addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(searchBook,220)});
q.addEventListener("keydown",e=>{if(e.key==="Enter")searchBook()});
clear.onclick=()=>{q.value="";results.innerHTML="";showPage(current);q.focus()};
mode.onchange=()=>document.body.classList.toggle("compact",mode.value==="compact");
showPage(1,false);
