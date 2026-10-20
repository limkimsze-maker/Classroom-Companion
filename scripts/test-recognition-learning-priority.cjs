const assert=require('node:assert/strict'),createContext=require('./helpers/handwriting-context.cjs');
const W=800,H=600,S=points=>({size:4,points:points.map(([x,y])=>({x:x/W,y:y/H}))});
// Invented isolated classroom pen shapes, not teacher traces.
const oval=[];for(let n=0;n<=32;n++){const t=n*Math.PI/16;oval.push([76+17*Math.cos(t),223+34*Math.sin(t)])}
const ink=[S([[32,187],[33,260]]),S(oval),
 S([[120,240],[121,210],[130,208],[138,236],[144,210],[152,210],[159,240]]),
 S([[175,182],[183,178],[190,183],[191,189],[183,197],[175,205],[191,205]])];
(async()=>{
 const memory=new Map(),ctx=createContext(memory),reader=ctx.WhiteboardHandwritingMath,learn=ctx.WhiteboardHandwritingLearning;
 // Force a confident unit heuristic in opposition to an explicit correction.
 ctx.WhiteboardTeacherUnits={rank:strokes=>strokes.length===2?[{label:'m³',score:.99},{label:'m²',score:.5}]:[],match:()=>null};
 const original=await reader.recognize(ink,W,H,{mode:'auto'});
 const corrected=original.text==='10 m²'?'10 m³':'10 m²';
 const tx=learn.confirm(original,corrected,reader.rasterDigit,ink,W,H,'auto');assert(tx?.count);
 assert.equal((await reader.recognize(ink,W,H,{mode:'auto'})).engine,'local-personal-ink');
 assert.equal((await reader.recognize(ink,W,H,{mode:'auto'})).text,corrected);
 assert.equal((await createContext(memory).WhiteboardHandwritingMath.recognize(ink,W,H,{mode:'auto'})).text,corrected,'correction survives reload');
 learn.undo(tx);assert.equal((await reader.recognize(ink,W,H,{mode:'auto'})).text,original.text,'Undo removes only this confirmation');
 let mathCalls=0;
 const mathTx=learn.confirm({text:'x + 3',tokens:[]},'x + 2',reader.rasterDigit,ink,W,H,'math');
 ctx.WhiteboardInkOnOriginalDemo={recognize:async()=>{mathCalls++;return{text:'x + 3',tokens:[],uncertain:[],format:'latex'}}};
 assert.equal((await reader.recognize(ink,W,H,{mode:'math'})).text,'x + 2');assert.equal(mathCalls,0);
 learn.undo(mathTx);assert.equal((await reader.recognize(ink,W,H,{mode:'math'})).text,'x + 3');assert.equal(mathCalls,1);
 // Personal whole-ink matching is geometry gated, not a blanket text replacement.
 assert.equal(learn.matchInk([S([[300,150],[360,170],[340,250]])],W,H,'auto',reader.rasterDigit),null);
 console.log('PASS actual models: confirmed unit/Math corrections precede heuristics, survive reload, and Undo restores prior behavior');
})().catch(error=>{console.error(error);process.exitCode=1});
