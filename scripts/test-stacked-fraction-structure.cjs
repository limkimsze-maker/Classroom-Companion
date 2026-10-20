/* Public UJI V1 digits composed into invented layouts; no private teacher ink. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const createContext=require('./helpers/handwriting-context.cjs'),ctx=createContext(),W=1800,H=600;
vm.runInContext(fs.readFileSync('scripts/handwriting-uji-real-ink-fixtures.js','utf8'),ctx);
const {assemble}=require('./benchmark-handwriting-simulations.cjs'),reader=ctx.WhiteboardHandwritingMath;
function row(text,cy){
 const ink=assemble(ctx.WhiteboardUJIInkFixtures.samples[1],text,0),points=ink.flatMap(s=>s.points),xs=points.map(p=>p.x*W),ys=points.map(p=>p.y*H),cx=(Math.min(...xs)+Math.max(...xs))/2,oldY=(Math.min(...ys)+Math.max(...ys))/2;
 return ink.map(s=>({...s,points:s.points.map(p=>({x:p.x+(300-cx)/W,y:p.y+(cy-oldY)/H}))}));
}
function fraction(a,b,curved=false){
 const top=row(a,150),bottom=row(b,270),points=[...top,...bottom].flatMap(s=>s.points),width=Math.max(...points.map(p=>p.x*W))-Math.min(...points.map(p=>p.x*W))+30;
 const bar={size:3,points:(curved?[[-.5,0],[-.4,-.02],[-.1,0],[.3,.025],[.5,.04],[.46,.02]]:[[-.5,0],[.5,0]]).map(([x,y])=>({x:(300+x*width)/W,y:(210+y*width)/H}))};
 return [...top,bar,...bottom];
}
const transform=(ink,scale,dx,dy)=>ink.map(s=>({...s,points:s.points.map(p=>({x:p.x*scale+dx,y:p.y*scale+dy}))}));
(async()=>{
 for(const [a,b]of [['3','4'],['12','5'],['7','8'],['10','20'],['9','0']]){
  for(const curved of [false,true])for(const moved of [false,true]){
   let ink=fraction(a,b,curved);if(moved)ink=transform(ink,.65,.1,.03).reverse();
   const r=await reader.recognize(ink,W,H,{mode:'auto'});
   assert.equal(r.text,`\\frac{${a}}{${b}}`,'preserve written digits, including improper/unreduced/zero-denominator fractions');
   assert.equal(r.engine,'local-stacked-fraction');assert.equal(r.format,'latex');
   assert.equal(r.fractionTokenCounts.join(','),`${a.length},${b.length}`);
   assert.equal(r.tokens.reduce((n,t)=>n+t.parts.length,0)+r.fractionBarParts.length,ink.length,'every stroke retained, bar separate from teachable digits');
   assert.equal(r.uncertain.length,r.tokens.filter(t=>t.score<.85).length,'row uncertainty remains visible');
  }
 }
 for(const text of ['8÷2=4','6−2=4','9+7=16']){
  const r=await reader.recognize(assemble(ctx.WhiteboardUJIInkFixtures.samples[1],text,0),W,H,{mode:'auto'});
  assert.notEqual(r.engine,'local-stacked-fraction','inline maths is not a stacked fraction');
 }
 const ink=fraction('12','5',true),outside={size:3,points:[{x:.6,y:.2},{x:.6,y:.3}]};
 assert.notEqual((await reader.recognize([...ink,outside],W,H,{mode:'auto'})).engine,'local-stacked-fraction','do not drop surrounding ink');
 assert.notEqual((await reader.recognize(ink,W,H,{mode:'uppercase'})).engine,'local-stacked-fraction','explicit letter mode retained');
 const learn=ctx.WhiteboardHandwritingLearning,original=await reader.recognize(ink,W,H,{mode:'auto'});
 const tx=learn.confirm(original,'\\frac{13}{5}',reader.rasterDigit,ink,W,H,'auto');
 assert(tx?.count);assert.equal((await reader.recognize(ink,W,H,{mode:'auto'})).text,'\\frac{13}{5}','personal correction wins');
 learn.undo(tx);assert.equal((await reader.recognize(ink,W,H,{mode:'auto'})).text,original.text,'Undo restores recognition');
 let calls=0;const math=await reader.recognize(ink,W,H,{mode:'math',mathRecognizer:async()=>{calls++;return {text:'x',tokens:[],uncertain:[],format:'latex'}}});
 assert.equal(math.text,'x');assert.equal(calls,1,'explicit maths recognizer retains dispatch');
 console.log('PASS stacked fractions: independent digits, curved bars, different values, scale/order, all ink retained, uncertainty, inline controls, personal correction/Undo and explicit modes');
})().catch(e=>{console.error(e);process.exitCode=1});
