/* Additional on-device OCR pass for printed music terms and dynamics.
   Apache-2.0 Tesseract.js is loaded on demand. Photos are never sent to a server.
   The trained homr/Partsong engine remains authoritative for pitches/rhythms. */
const OCR_CDN='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const TEMPO_WORDS=new Set(['grave','largo','lento','adagio','andante','moderato','allegretto','allegro','vivace','vivo','presto']);
const EXPRESSION_WORDS=new Set(['cantabile','dolce','espressivo','grazioso','legato']);
const SINGLE_DYNAMICS=new Set(['pp','p','mp','mf','f','ff','fp']);
const CLEAN=s=>String(s||'').normalize('NFKC').replace(/[\u2018\u2019]/g,"'").replace(/[^\wÀ-ÿ.=\s♩]/g,'').trim().toLowerCase();
let loader=null;
async function loadTesseract(){
 if(window.Tesseract?.createWorker)return window.Tesseract;
 if(!loader)loader=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=OCR_CDN;script.crossOrigin='anonymous';
  script.onload=()=>window.Tesseract?.createWorker?resolve(window.Tesseract):reject(Error('Text reader did not initialise'));
  script.onerror=()=>reject(Error('Text reader could not download its language model'));
  document.head.append(script);
 }).catch(e=>{loader=null;throw e});
 return loader;
}
function classifyMusicTerm(source){
 const text=CLEAN(source).replace(/\s+/g,' ');
 if(!text)return null;
 if(/^d\.?\s*c\.?(?:\s+al\s+fine)?\.?$/.test(text))return {kind:'sign',value:'dc'};
 if(/^d\.?\s*s\.?(?:\s+al\s+fine)?\.?$/.test(text))return {kind:'sign',value:'ds'};
 if(/^fine\.?$/.test(text))return {kind:'sign',value:'fine'};
 if(/^(?:segno|sign)\.?$/.test(text))return {kind:'sign',value:'segno'};
 if(/^(?:8va|8va\.)$/.test(text))return {kind:'octave',value:true};
 const digit=text.match(/^(?:j|q|quarter|crotchet|♩)\s*=\s*(\d{2,3})$/);
 if(digit){const bpm=Number(digit[1]);if(bpm>=40&&bpm<=220)return {kind:'tempoBpm',value:bpm};}
 if(/^(?:a tempo)$/.test(text))return {kind:'tempo',value:'a tempo'};
 if(/^meno mosso$/.test(text))return {kind:'tempo',value:'meno mosso'};
 if(/^(?:pi[uùú] mosso|piu mosso)$/.test(text))return {kind:'tempo',value:'più mosso'};
 if(/^con moto$/.test(text))return {kind:'tempo',value:'con moto'};
 if(/^alla marcia$/.test(text))return {kind:'expression',value:'alla marcia'};
 if(TEMPO_WORDS.has(text))return {kind:'tempo',value:text};
 if(EXPRESSION_WORDS.has(text))return {kind:'expression',value:text};
 if(/^(?:accel(?:erando)?|accel\.)\.?$/.test(text))return {kind:'tempo',value:'accelerando'};
 if(/^ritard(?:ando)?\.?$/.test(text))return {kind:'tempo',value:'ritardando'};
 if(/^rall(?:entando)?\.?$/.test(text))return {kind:'tempo',value:'rallentando'};
 if(/^riten(?:uto)?\.?$/.test(text))return {kind:'tempo',value:'ritenuto'};
 if(/^allargando$/.test(text))return {kind:'tempo',value:'allargando'};
 if(/^(?:cresc|crescendo)\.?$/.test(text))return {kind:'dynamic',value:'crescendo'};
 if(/^(?:dim|diminuendo|decresc|decrescendo)\.?$/.test(text))return {kind:'dynamic',value:'diminuendo'};
 if(SINGLE_DYNAMICS.has(text))return {kind:'dynamic',value:text};
 return null;
}
function boxOf(word){
 const b=word.bbox||word.box||{};
 const x0=Number(b.x0),x1=Number(b.x1),y0=Number(b.y0),y1=Number(b.y1);
 return [x0,x1,y0,y1].every(Number.isFinite)&&x1>x0&&y1>y0?{x0,x1,y0,y1}:null;
}
function groupWords(words){
 const sorted=words.filter(w=>boxOf(w)&&String(w.text||'').trim())
   .map(w=>({...w,bbox:boxOf(w)})).sort((a,b)=>a.bbox.y0-b.bbox.y0||a.bbox.x0-b.bbox.x0);
 const lines=[];
 for(const w of sorted){
  const height=w.bbox.y1-w.bbox.y0,cy=(w.bbox.y0+w.bbox.y1)/2;
  let row=lines.find(l=>Math.abs(l.cy-cy)<=Math.max(8,Math.min(l.height,height)*.53));
  if(!row){row={cy,height,words:[]};lines.push(row);}
  row.words.push(w);
 }
 return lines.map(l=>l.words.sort((a,b)=>a.bbox.x0-b.bbox.x0));
}
function extractMusicTermMatches(words,imageWidth,imageHeight){
 const matches=[];
 for(const line of groupWords(words)){
  for(let i=0;i<line.length;){
   let found=null;
   for(let size=Math.min(4,line.length-i);size>=1;size--){
    const part=line.slice(i,i+size);
    if(part.slice(1).some((v,j)=>v.bbox.x0-part[j].bbox.x1>Math.max(45,(v.bbox.y1-v.bbox.y0)*3.7)))continue;
    const term=classifyMusicTerm(part.map(w=>w.text).join(' '));
    if(!term)continue;
    const confidence=part.reduce((t,w)=>t+(Number(w.confidence)||0),0)/part.length;
    const single=term.kind==='dynamic'&&SINGLE_DYNAMICS.has(term.value);
    const threshold=single?80:term.kind==='tempoBpm'?73:61;
    if(confidence<threshold)continue;
    found={...term,confidence:+confidence.toFixed(1),text:part.map(w=>w.text).join(' '),
      x:Math.max(0,Math.min(1,part[0].bbox.x0/imageWidth)),
      y:Math.max(0,Math.min(1,(part[0].bbox.y0+part[0].bbox.y1)/(2*imageHeight))),
      needsReview:confidence<(single?91:80),source:'image text'};
    i+=size;break;
   }
   if(found)matches.push(found);else i++;
  }
 }
 return matches.filter((m,i)=>!matches.slice(0,i).some(a=>a.kind===m.kind&&a.value===m.value&&Math.abs(a.x-m.x)<.04&&Math.abs(a.y-m.y)<.025));
}
function detectMusicSystems(canvas){
 const {width:w,height:h}=canvas;
 const image=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;
 const xs=[];for(let x=Math.floor(w*.08);x<w*.94;x+=Math.max(3,Math.floor(w/180)))xs.push(x);
 const threshold=Math.max(18,Math.floor(xs.length*.42));let peaks=[],run=null;
 for(let y=2;y<h-2;y++){
  let dark=0;
  for(const x of xs){const k=(y*w+x)*4,shade=(image[k]*77+image[k+1]*150+image[k+2]*29)>>8;if(shade<155)dark++;}
  if(dark>=threshold){if(run===null)run=[y,y];else run[1]=y}
  else if(run){if(run[1]-run[0]<7)peaks.push(Math.round((run[0]+run[1])/2));run=null;}
 }
 if(run&&run[1]-run[0]<7)peaks.push(Math.round((run[0]+run[1])/2));
 const staves=[];
 for(let i=0;i+4<peaks.length;){
  const five=peaks.slice(i,i+5),spacings=five.slice(1).map((v,j)=>v-five[j]),avg=spacings.reduce((a,b)=>a+b,0)/4;
  if(avg>=5&&avg<=43&&spacings.every(d=>Math.abs(d-avg)<Math.max(2.5,avg*.30))){
   staves.push({top:five[0]/h,bottom:five[4]/h,space:avg/h});i+=5;
  }else i++;
 }
 if(!staves.length)return [];
 const groups=[];
 for(const staff of staves){
  const prev=groups.at(-1),last=prev?.staves.at(-1);
  if(prev&&staff.top-last.bottom<=Math.max(.018,(staff.space+last.space)*4.4)){
   prev.staves.push(staff);prev.bottom=staff.bottom;
  }else groups.push({top:staff.top,bottom:staff.bottom,staves:[staff]});
 }
 return groups.map(({top,bottom})=>({top,bottom}));
}
function locateSystem(mark,systems){
 if(!systems.length)return {system:0,systemCount:1,positionApproximate:true};
 let target=0,best=Infinity;
 for(let i=0;i<systems.length;i++){
  const sys=systems[i],below=mark.y>sys.bottom,above=mark.y<sys.top;
  let distance=below?mark.y-sys.bottom:above?sys.top-mark.y:0;
  // Dynamics are normally below a staff; tempo words normally above it.
  if(below&&mark.kind!=='dynamic')distance+=.025;
  if(above&&mark.kind==='dynamic')distance+=.025;
  if(distance<best){best=distance;target=i;}
 }
 return {system:target,systemCount:systems.length,positionApproximate:best>.065};
}
async function bitmapCanvas(blob){
 const bitmap=await createImageBitmap(blob);
 const size=Math.min(1,1700/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');
 canvas.width=Math.max(100,Math.round(bitmap.width*size));
 canvas.height=Math.max(100,Math.round(bitmap.height*size));
 canvas.getContext('2d',{willReadFrequently:true}).drawImage(bitmap,0,0,canvas.width,canvas.height);
 bitmap.close?.();
 return canvas;
}
async function readScoreTextMarks(blobs,onStatus=()=>{}){
 const Tesseract=await loadTesseract(),worker=await Tesseract.createWorker('eng',1,{});
 const output=[];
 try{
  await worker.setParameters({tessedit_pageseg_mode:'11',preserve_interword_spaces:'1'});
  for(let i=0;i<blobs.length;i++){
   onStatus('Reading printed tempo, dynamics and navigation words on page '+(i+1)+' of '+blobs.length+'…');
   const canvas=await bitmapCanvas(blobs[i]);
   const result=await worker.recognize(canvas);
   const words=Array.isArray(result.data.words)?result.data.words:[];
   const systems=detectMusicSystems(canvas);
   output.push(extractMusicTermMatches(words,canvas.width,canvas.height)
    .map(m=>({...m,...locateSystem(m,systems),page:i})));
   canvas.width=0;canvas.height=0;
  }
 }finally{await worker.terminate().catch(()=>{});}
 return output;
}
export {classifyMusicTerm,extractMusicTermMatches,detectMusicSystems,locateSystem,readScoreTextMarks};
