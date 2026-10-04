(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='daily-visual-timetable'||window.__ttOcrBootstrap)return;
window.__ttOcrBootstrap=true;
const CDN=['https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js','https://unpkg.com/tesseract.js@5/dist/tesseract.min.js'];
function clean(v){return String(v??'').replace(/\s+/g,' ').trim()}
function ed(a,b){a=String(a);b=String(b);const d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));for(let i=0;i<=a.length;i++)d[i][0]=i;for(let j=0;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length]}
const DAY=['MON','TUE','WED','THU','FRI'];
function normDay(s){let x=clean(s).toUpperCase().replace(/[^A-Z0-9]/g,'').replace(/0/g,'O').replace(/[1L]/g,'I').replace(/5/g,'S');if(!x||x.length>9)return'';const long=[['MONDAY','MON'],['TUESDAY','TUE'],['TUES','TUE'],['WEDNESDAY','WED'],['THURSDAY','THU'],['THURS','THU'],['THUR','THU'],['FRIDAY','FRI']];for(const [a,b] of long)if(x===a||ed(x,a)<=1)return b;let best='',bd=99;for(const d of DAY){const q=ed(x,d);if(q<bd){bd=q;best=d}}return bd<=1?best:''}
function box(w){const b=w?.bbox||{};return{x0:+b.x0||0,x1:+b.x1||0,y0:+b.y0||0,y1:+b.y1||0,cx:((+b.x0||0)+(+b.x1||0))/2,cy:((+b.y0||0)+(+b.y1||0))/2,text:clean(w?.text),conf:+(w?.confidence??w?.conf??0)||0}}
function median(a){const x=a.filter(Number.isFinite).sort((p,q)=>p-q);if(!x.length)return 0;const m=Math.floor(x.length/2);return x.length%2?x[m]:(x[m-1]+x[m])/2}
function timeLike(s){const x=clean(s).toUpperCase().replace(/[OQ]/g,'0').replace(/[IL]/g,'1').replace(/\s/g,'');return /^\D*\d{3,4}[-–—~_]\d{3,4}\D*$/.test(x)}
function rangeParts(s){const x=clean(s).toUpperCase().replace(/[OQ]/g,'0').replace(/[IL]/g,'1').replace(/\s/g,'');const m=x.match(/(\d{3,4})[-–—~_](\d{3,4})/);if(!m)return null;const a=m[1].padStart(4,'0'),b=m[2].padStart(4,'0');const ah=+a.slice(0,2),am=+a.slice(2),bh=+b.slice(0,2),bm=+b.slice(2);if(ah>23||bh>23||am>59||bm>59)return null;return{start:ah*60+am,end:bh*60+bm}}
function four(m){m=((Math.round(m)%1440)+1440)%1440;return`${String(Math.floor(m/60)).padStart(2,'0')}${String(m%60).padStart(2,'0')}`}
function repairTimeRanges(words){
 const raw=words.map(w=>({w,b:box(w),r:rangeParts(w.text)})).filter(x=>x.r).sort((a,b)=>a.b.cy-b.b.cy);
 if(raw.length<5)return;
 const items=[];
 for(const x of raw){const last=items[items.length-1];if(last&&Math.abs(last.b.cy-x.b.cy)<6){if(x.b.conf>last.b.conf)items[items.length-1]=x}else items.push(x)}
 if(items.length<5)return;
 const durs=items.map(x=>x.r.end-x.r.start).filter(x=>x>=15&&x<=90).map(x=>Math.round(x/5)*5);
 if(durs.length<4)return;
 const counts={};for(const d of durs)counts[d]=(counts[d]||0)+1;
 let step=+Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];
 if(!step||counts[step]<Math.max(3,Math.ceil(items.length*.45)))return;
 const gaps=items.slice(1).map((x,i)=>x.b.cy-items[i].b.cy).filter(x=>x>3),dy=median(gaps);if(!dy)return;
 const y0=items[0].b.cy;
 const indexed=items.map(x=>({...x,idx:Math.max(0,Math.round((x.b.cy-y0)/dy))}));
 const bases=indexed.map(x=>x.r.start-x.idx*step),base=Math.round(median(bases)/5)*5;
 const agree=indexed.filter(x=>Math.abs(x.r.start-(base+x.idx*step))<=10).length;
 if(agree<Math.max(3,Math.ceil(indexed.length*.55)))return;
 for(const x of indexed){const a=base+x.idx*step,b=a+step;if(Math.abs(x.r.start-a)>5||Math.abs(x.r.end-b)>5)x.w.text=`${four(a)}-${four(b)}`}
}
function markShortSubjects(words){for(const w of words){const x=clean(w.text).toUpperCase();if(x==='SC')w.text='SCX'}}
function kmeans1d(vals,k){if(vals.length<k)return[];let min=Math.min(...vals),max=Math.max(...vals);let c=Array.from({length:k},(_,i)=>min+(max-min)*(i+.5)/k);for(let iter=0;iter<20;iter++){const g=Array.from({length:k},()=>[]);for(const v of vals){let bi=0,bd=Infinity;for(let i=0;i<k;i++){const d=Math.abs(v-c[i]);if(d<bd){bd=d;bi=i}}g[bi].push(v)}const n=c.map((x,i)=>g[i].length?g[i].reduce((a,b)=>a+b,0)/g[i].length:x).sort((a,b)=>a-b);if(n.every((x,i)=>Math.abs(x-c[i])<.5)){c=n;break}c=n}return c.sort((a,b)=>a-b)}
function repair(result){const words=result?.data?.words;if(!Array.isArray(words)||!words.length)return result;for(const w of words){const d=normDay(w.text);if(d)w.text=d}repairTimeRanges(words);markShortSubjects(words);const wb=words.map(box).filter(w=>w.text),timeWords=wb.filter(w=>timeLike(w.text));if(timeWords.length<3)return result;const firstY=Math.min(...timeWords.map(w=>w.cy)),timeX=median(timeWords.map(w=>w.cx)),maxX=Math.max(...wb.map(w=>w.x1)),minGap=Math.max(28,maxX*.035);const pts=wb.filter(w=>w.cy>firstY-45&&w.cx>timeX+minGap&&!timeLike(w.text)&&!/^[0-9]{1,2}$/.test(w.text)&&!/^PERIOD\/?TIME$/i.test(w.text)&&!normDay(w.text)).map(w=>w.cx);if(pts.length<15)return result;const centers=kmeans1d(pts,5);if(centers.length!==5)return result;const gaps=centers.slice(1).map((x,i)=>x-centers[i]),sp=median(gaps);if(!sp||Math.max(...gaps)>sp*1.7||Math.min(...gaps)<sp*.45)return result;const existing=words.map(w=>normDay(w.text)).filter(Boolean);if(new Set(existing).size>=5)return result;const timeYs=[...new Set(timeWords.map(w=>Math.round(w.cy)))].sort((a,b)=>a-b),dy=median(timeYs.slice(1).map((y,i)=>y-timeYs[i]))||40,existingDayBoxes=words.map(w=>({b:box(w),d:normDay(w.text)})).filter(x=>x.d),headerY=existingDayBoxes.length?median(existingDayBoxes.map(x=>x.b.cy)):Math.max(8,firstY-dy*.78);for(let i=0;i<5;i++){const txt=DAY[i];if(words.some(w=>normDay(w.text)===txt))continue;const cx=centers[i],h=18,wid=42;words.push({text:txt,confidence:99,bbox:{x0:cx-wid/2,y0:headerY-h/2,x1:cx+wid/2,y1:headerY+h/2}})}return result}
function overlap(a,b){const A=box(a),B=box(b),dx=Math.abs(A.cx-B.cx),dy=Math.abs(A.cy-B.cy);const aw=Math.max(8,A.x1-A.x0),bw=Math.max(8,B.x1-B.x0),ah=Math.max(8,A.y1-A.y0),bh=Math.max(8,B.y1-B.y0);return dx<Math.max(aw,bw)*.65&&dy<Math.max(ah,bh)*.65}
const SHORT_SUBJECT=/^(PE|SC|SS|EL|MTL|CCE|POP|FTGP|MATH|MUSIC|ART|RECESS|ASSEMBLY)$/;
function mergeWords(primary,extra){const p=primary?.data?.words;if(!Array.isArray(p)||!Array.isArray(extra?.data?.words))return primary;for(const w of extra.data.words){const t=clean(w.text);if(!t||!/[A-Za-z]/.test(t))continue;const hits=p.filter(x=>overlap(x,w));if(!hits.length){p.push(w);continue}const target=hits.sort((a,b)=>(+(b.confidence??b.conf??0)||0)-(+(a.confidence??a.conf??0)||0))[0],et=t.toUpperCase(),pt=clean(target.text).toUpperCase(),ec=+(w.confidence??w.conf??0)||0,pc=+(target.confidence??target.conf??0)||0;if(SHORT_SUBJECT.test(et)&&(!SHORT_SUBJECT.test(pt)||ec>=pc-12)){target.text=w.text;target.bbox=w.bbox||target.bbox;target.confidence=Math.max(pc,ec)}}return primary}
async function shortTextPass(real,image){let worker=null;try{worker=await real.createWorker('eng');if(worker.setParameters)await worker.setParameters({tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZ/',preserve_interword_spaces:'1',tessedit_pageseg_mode:String(real.PSM?.SPARSE_TEXT??11)});return await worker.recognize(image)}catch(e){return null}finally{try{await worker?.terminate()}catch(e){}}}
function loadReal(){return new Promise(async(ok,no)=>{for(const src of CDN){try{await new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)});if(window.Tesseract&&window.Tesseract!==proxy)return ok(window.Tesseract)}catch(e){}}no(new Error('The screenshot reader could not load.'))})}
let realPromise=null;const proxy={recognize:async function(){if(!realPromise){try{delete window.Tesseract}catch(e){}realPromise=loadReal()}const real=await realPromise;let out=await real.recognize.apply(real,arguments);out=repair(out);const extra=await shortTextPass(real,arguments[0]);if(extra){out=mergeWords(out,extra);out=repair(out)}return out}};window.Tesseract=proxy;
})();
;(function(){
 if(window.Support?.slug!=='daily-visual-timetable'||window.__ttViewLoader)return;
 window.__ttViewLoader=true;
 const profile=document.createElement('script');
 profile.src='timetable-profile-selector.js?v=20261004profiles4';
 document.body.appendChild(profile);
 const s=document.createElement('script');
 s.src='timetable-view-enhancement.js?v=20261004view3';
 s.onload=()=>{
   const p=document.createElement('script');
   p.src='timetable-daily-projection.js?v=20261004proj1';
   document.body.appendChild(p);
   const w=document.createElement('script');
   w.src='timetable-week-projection.js?v=20261004week1';
   document.body.appendChild(w);
 };
 document.body.appendChild(s);
})();