const $=s=>document.querySelector(s);
let currentRole=null;
const KEY="siberweb_validasi_2026";

function slug(t){return t.toLowerCase().replace(/[^a-z0-9]+/g,"_")}
function category(p){return p>=81?"Sangat layak":p>=61?"Layak":p>=41?"Cukup layak":"Belum layak"}

function render(role){
 currentRole=role; const inst=INSTRUMENTS[role];
 $("#start").classList.add("hidden"); $("#result").classList.add("hidden"); $("#admin").classList.add("hidden"); $("#formSection").classList.remove("hidden");
 $("#formTitle").textContent=inst.title; $("#progressText").textContent=`0 / ${countItems(inst)} indikator`;
 $("#progressBar").style.width="0%";
 const box=$("#items"); box.innerHTML=""; let n=0;
 inst.sections.forEach(([section,items])=>{
   const sec=document.createElement("div"); sec.className="indicator-section"; sec.innerHTML=`<h3>${section}</h3>`;
   items.forEach(text=>{
     n++; const item=document.createElement("div"); item.className="item";
     item.innerHTML=`<div class="item-title">${n}. ${text}</div>
       <div class="scores">${[1,2,3,4].map(v=>`<label class="score"><input type="radio" required name="q${n}" value="${v}"> ${v} — ${["Sangat Kurang","Kurang","Baik","Sangat Baik"][v-1]}</label>`).join("")}</div>
       <label class="small">Catatan singkat<textarea name="cat${n}" placeholder="Opsional; terutama jika memberi skor 1 atau 2"></textarea></label>`;
     sec.appendChild(item);
   }); box.appendChild(sec);
 });
 $("#validationForm").reset();
 const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); $("#validationForm").elements.tanggal.value=d.toISOString().slice(0,10);
 window.scrollTo({top:0,behavior:"smooth"}); updateProgress();
}
function countItems(inst){return inst.sections.reduce((a,s)=>a+s[1].length,0)}
function updateProgress(){
 if(!currentRole)return; const total=countItems(INSTRUMENTS[currentRole]); let answered=0;
 for(let i=1;i<=total;i++) if(document.querySelector(`input[name=q${i}]:checked`)) answered++;
 $("#progressText").textContent=`${answered} / ${total} indikator`;
 $("#progressBar").style.width=(answered/total*100)+"%";
}
document.addEventListener("change",e=>{if(e.target.matches('input[type=radio]'))updateProgress()});
document.querySelectorAll(".role").forEach(b=>b.onclick=()=>render(b.dataset.role));
$("#backBtn").onclick=()=>{currentRole=null;$("#formSection").classList.add("hidden");$("#start").classList.remove("hidden");window.scrollTo({top:0,behavior:"smooth"})};

$("#validationForm").addEventListener("submit",e=>{
 e.preventDefault(); const fd=new FormData(e.target), inst=INSTRUMENTS[currentRole], total=countItems(inst);
 let scores=[]; for(let i=1;i<=total;i++) scores.push(Number(fd.get("q"+i)));
 const sum=scores.reduce((a,b)=>a+b,0), max=inst.max, pct=sum/max*100;
 const rec={id:Date.now(),role:currentRole,roleTitle:inst.title,nama:fd.get("nama"),nip:fd.get("nip"),instansi:fd.get("instansi"),keahlian:fd.get("keahlian"),tanggal:fd.get("tanggal"),web:fd.get("web"),scores,sum,max,pct,category:category(pct),kelebihan:fd.get("kelebihan"),perbaikan:fd.get("perbaikan"),saran:fd.get("saran"),rekomendasi:fd.get("rekomendasi"),notes:{}};
 for(let i=1;i<=total;i++) rec.notes[i]=fd.get("cat"+i)||"";
 const arr=JSON.parse(localStorage.getItem(KEY)||"[]"); arr.push(rec); localStorage.setItem(KEY,JSON.stringify(arr));
 showResult(rec);
});

function showResult(r){
 $("#formSection").classList.add("hidden"); $("#result").classList.remove("hidden");
 $("#result").innerHTML=`<h2>Validasi Berhasil Disimpan</h2>
 <p>Terima kasih, <b>${esc(r.nama)}</b>. Hasil penilaian telah tersimpan pada perangkat ini.</p>
 <div class="scorebox">
  <div class="metric"><span>Skor diperoleh</span><b>${r.sum}</b></div>
  <div class="metric"><span>Skor maksimum</span><b>${r.max}</b></div>
  <div class="metric"><span>Persentase</span><b>${r.pct.toFixed(2)}%</b><span>${r.category}</span></div>
 </div>
 <p><b>Rekomendasi:</b> ${esc(r.rekomendasi)}</p>
 <div class="actions"><button class="ghost" onclick="location.reload()">Kembali ke awal</button><button class="primary" id="printBtn">Cetak hasil</button></div>`;
 $("#printBtn").onclick=()=>window.print();
 window.scrollTo({top:0,behavior:"smooth"});
}
function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

$("#adminBtn").onclick=()=>{ $("#start").classList.add("hidden");$("#formSection").classList.add("hidden");$("#result").classList.add("hidden");$("#admin").classList.remove("hidden");renderAdmin();window.scrollTo({top:0,behavior:"smooth"})};
function getData(){return JSON.parse(localStorage.getItem(KEY)||"[]")}
function renderAdmin(){
 const data=getData(), body=$("#resultsBody"); body.innerHTML="";
 data.forEach(r=>{const tr=document.createElement("tr");tr.innerHTML=`<td>${esc(r.tanggal)}</td><td>${esc(r.nama)}</td><td>${esc(r.roleTitle.replace("Instrumen Validasi ",""))}</td><td>${r.sum}</td><td>${r.max}</td><td>${r.pct.toFixed(2)}%</td><td>${r.category}</td>`;body.appendChild(tr)});
 const types=["media","materi","guru"]; $("#summary").innerHTML=`<div class="scorebox">${types.map(t=>{const a=data.filter(x=>x.role===t);const avg=a.length?a.reduce((s,x)=>s+x.pct,0)/a.length:0;return `<div class="metric"><span>${INSTRUMENTS[t].title.replace("Instrumen Validasi ","")}</span><b>${a.length?avg.toFixed(2)+"%":"—"}</b><span>${a.length?category(avg):"Belum ada data"}</span></div>`}).join("")}</div>`;
}
$("#clearBtn").onclick=()=>{if(confirm("Hapus semua data validasi pada perangkat ini?")){localStorage.removeItem(KEY);renderAdmin()}};
$("#exportBtn").onclick=()=>{
 const data=getData(); if(!data.length){alert("Belum ada data.");return}
 const headers=["Tanggal","Jenis Validator","Nama","NIP/NIDN","Instansi","Bidang Keahlian","Skor","Maksimum","Persentase","Kategori","Rekomendasi","Kelebihan","Perbaikan","Saran"];
 const rows=data.map(r=>[r.tanggal,r.roleTitle,r.nama,r.nip,r.instansi,r.keahlian,r.sum,r.max,r.pct.toFixed(2)+"%",r.category,r.rekomendasi,r.kelebihan,r.perbaikan,r.saran]);
 const csv=[headers,...rows].map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
 const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="rekap-validasi-SIBER-WEB.csv";a.click();URL.revokeObjectURL(a.href);
};
