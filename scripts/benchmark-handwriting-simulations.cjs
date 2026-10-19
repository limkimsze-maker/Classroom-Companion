/* Frozen compositions of labelled UJI V1 glyphs. These are simulations, not
 * naturally written expressions. Never import these samples into training.
 * Writers 1–5 guide development; writers 6–11 are a separate verification set.
 * node scripts/benchmark-handwriting-simulations.cjs --split development --out /path/report.json
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const createContext=require('./helpers/handwriting-context.cjs');
const root=path.resolve(__dirname,'..'),W=1800,H=600;
const groups={
 numbers:['0','1','2','3','4','5','6','7','8','9','10','20','35','97','100','101','208','507','972','1234'],
 units:['1cm','10m','35cm','97kg','8ml','20L'],
 powers:['10m²','35cm²','8m³','20cm³'],
 arithmetic:['6−2=4','9+7=16','8×2=16','8÷2=4'],
 measuredArithmetic:['6−2=4cm²','9+7=16m²'],
 letters:['c','m','k','g','l','L']
};
const canonical=s=>String(s).replace(/\s+/g,'').replace(/-/g,'−');
function distance(a,b){let last=Array.from({length:b.length+1},(_,i)=>i);for(let i=0;i<a.length;i++){const row=[i+1];for(let j=0;j<b.length;j++)row.push(Math.min(row[j]+1,last[j+1]+1,last[j]+(a[i]===b[j]?0:1)));last=row;}return last[b.length]}
function assemble(samples,text,rep){
 let left=40;const ink=[];
 const stroke=xy=>({size:3,points:xy.map(([x,y])=>({x:x/W,y:y/H}))});
 for(const char of text){
  if('−+×÷='.includes(char)){
   const x=left+9;
   const lines={
    '−':[[[x,224],[x+35,224]]],
    '+':[[[x,224],[x+35,224]],[[x+17,205],[x+17,243]]],
    '×':[[[x,203],[x+35,246]],[[x,246],[x+35,203]]],
    '÷':[[[x,224],[x+35,224]],[[x+17,205],[x+18,206]],[[x+17,243],[x+18,244]]],
    '=':[[[x,219],[x+35,219]],[[x,230],[x+35,230]]]
   }[char];ink.push(...lines.map(stroke));left+=65;continue;
  }
  const raised=char==='²'||char==='³',key=raised?(char==='²'?'2':'3'):char;
  const parts=samples[key]?.[rep];if(!parts?.length)return null;
  const pts=parts.flat(),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
  const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
  const height=raised?30:('cm'.includes(char)?45:char==='g'?65:70);
  const scale=height/Math.max(1,ymax-ymin),bottom=raised?208:char==='g'?280:260;
  for(const part of parts)ink.push(stroke(part.map(([x,y])=>[left+(x-xmin)*scale,bottom+(y-ymax)*scale])));
  left+=(xmax-xmin)*scale+(raised?10:14);
 }
 return ink;
}
function summary(records){
 const total=records.length,correct=records.filter(r=>r.correct).length,flagged=records.filter(r=>r.flagged).length;
 const times=records.map(r=>r.ms).sort((a,b)=>a-b);
 return{correct,total,exactPercent:100*correct/Math.max(1,total),characterErrorPercent:100*records.reduce((n,r)=>n+r.edits,0)/Math.max(1,records.reduce((n,r)=>n+canonical(r.expected).length,0)),flagged,unflaggedWrong:records.filter(r=>!r.correct&&!r.flagged).length,p50ms:times[Math.floor(times.length*.5)]||0,p95ms:times[Math.floor(times.length*.95)]||0};
}
async function run({split='development',readerPath,categories,progress=()=>{}}={}){
 const ctx=createContext();vm.runInContext(fs.readFileSync(path.join(root,'scripts/handwriting-uji-real-ink-fixtures.js'),'utf8'),ctx);
 const readerFile=readerPath||path.join(root,'whiteboard-handwriting-recognition-beta.js');
 const readerSha256=crypto.createHash('sha256').update(fs.readFileSync(readerFile)).digest('hex');
 if(readerPath)vm.runInContext(fs.readFileSync(readerPath,'utf8'),ctx);
 const records=[];
 for(const [writer,samples]of Object.entries(ctx.WhiteboardUJIInkFixtures.samples)){
  const partition=Number(writer)<=5?'development':'validation';
  if(split!=='all'&&partition!==split)continue;
  for(const [category,phrases]of Object.entries(groups))for(const expected of phrases)for(const rep of [0,1]){
   if(categories&&!categories.includes(category))continue;
   const ink=assemble(samples,expected,rep),start=performance.now();let prediction,error;
   try{prediction=await ctx.WhiteboardHandwritingMath.recognize(ink,W,H,{mode:'auto'})}catch(e){error=e.message}
   const actual=prediction?.text||'',clean=canonical(actual),want=canonical(expected);
   records.push({id:`uji-${writer}-${rep}-${category}-${expected}`,writer,partition,category,expected,actual,correct:clean===want,edits:distance(want,clean),flagged:!!prediction?.uncertain?.length||!!error,engine:prediction?.engine,error,ms:Math.round(performance.now()-start)});
   if(records.length%25===0)progress({done:records.length,...summary(records)});
  }
 }
 const by={};for(const category of Object.keys(groups))by[category]=summary(records.filter(r=>r.category===category));
 return{schema:'classroom-handwriting-simulations-v1',split,build:ctx.WhiteboardHandwritingMath.build,readerSha256,source:'Existing labelled UJI Pen Characters V1 glyph fixtures; unchanged pretrained models',method:'Fixed glyph compositions and generated operator geometry. No naturally written full expressions; glyphs recur across cases. Development writers 1–5; verification writers 6–11. Simulation rates are not real-world handwriting accuracy.',summary:summary(records),by,records};
}
module.exports={run,assemble,groups,summary,canonical};
if(require.main===module){
 const arg=name=>{const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1]};
 run({split:arg('--split')||'development',readerPath:arg('--reader'),categories:arg('--categories')?.split(','),progress:r=>console.log(JSON.stringify({progress:r.done,correct:r.correct,total:r.total}))}).then(report=>{
  if(arg('--out'))fs.writeFileSync(arg('--out'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({summary:report.summary,by:report.by},null,2));
 }).catch(error=>{console.error(error);process.exitCode=1});
}
