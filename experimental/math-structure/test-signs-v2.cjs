'use strict';
// Generated signs and existing UJI V1 digits; no private handwriting is stored.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const createContext=require('../../scripts/helpers/handwriting-context.cjs');
const {eq,divide,equation,W,H}=require('./sign-fixtures.cjs');
const ctx=createContext(),baseline=createContext();
vm.runInContext(fs.readFileSync('experimental/math-structure/reader-v2.js','utf8'),ctx);
const reader=ctx.WhiteboardHandwritingMath;
const S=(points,size=5)=>({size,points:points.map(([x,y])=>({x:x/W,y:y/H}))});
const variants=ink=>[
 ['original',ink],['moved and smaller',ink.map(s=>({...s,size:s.size*.85,points:s.points.map(p=>({x:p.x*.85+.03,y:p.y*.85+.02}))}))],
 ['reordered and reversed',ink.slice().reverse().map(s=>({...s,points:s.points.slice().reverse()}))]
];
function coverage(result,ink){const sources=result.tokens.flatMap(t=>t.parts.map(p=>p.source));assert.equal(sources.length,ink.length);assert.equal(new Set(sources).size,ink.length);assert(sources.every(s=>ink.includes(s)));}
(async()=>{
 let controls=0;
 for(const [label,ink,char] of [['compact equals',eq,'='],['division',divide,'÷']])for(const [variant,strokes]of variants(ink)){
  const r=await reader.recognize(strokes,W,H,{mode:'auto'});assert.equal(r.text,char,label+' '+variant);coverage(r,strokes);controls++;
  if(char==='=')assert(r.uncertain.length,'Very short unequal bars remain flagged for review');
 }
 for(const [a,b,c]of [['10','2','5'],['18','3','6'],['8','2','4'],['10','2','7']]){
  for(const [variant,strokes]of variants(equation(a,b,c))){
   const r=await reader.recognize(strokes,W,H,{mode:'auto'});assert.equal(r.text.replace(/\s/g,''),a+'÷'+b+'='+c,variant+' preserves the written answer');coverage(r,strokes);controls++;
  }
 }
 // A true crossed multiplication sign is never globally replaced with equals.
 const times=[S([[0,-17],[24,17]]),S([[0,17],[24,-17]])];
 for(const [variant,strokes]of variants(equation('3','2','6',times))){
  const r=await reader.recognize(strokes,W,H,{mode:'auto'});assert.equal(r.text.replace(/\s/g,''),'3×2=6',variant);coverage(r,strokes);controls++;
 }
 const negatives=[
  [S([[5,0],[5.3,.2]]),S([[6,12],[6.3,12.2]])], // colon dots
  [S([[0,0],[9,0]]),S([[4,-6],[4,6]])], // plus
  times,
  [S([[0,0],[9,0]])], // minus
  [S([[0,0],[3.2,0]]),S([[0,70],[9,70]])], // unrelated bars
  [S([[0,0],[3.2,0]]),S([[0,12],[14,12]])] // unsupported width ratio
 ];
 for(const strokes of negatives){assert(!reader.segment(strokes,W,H).some(t=>t.engine==='local-compact-equals-v2'));controls++;}
 for(const mode of ['digits','lowercase','uppercase']){
  const a=await baseline.WhiteboardHandwritingMath.recognize(eq,W,H,{mode}),b=await reader.recognize(eq,W,H,{mode});assert.equal(b.text,a.text,'Explicit mode retained: '+mode);controls++;
 }
 const before=await reader.recognize(eq,W,H,{mode:'auto'}),tx=ctx.WhiteboardHandwritingLearning.confirm(before,'X',reader.rasterDigit,eq,W,H,'auto');
 assert(tx?.count);assert.equal((await reader.recognize(eq,W,H,{mode:'auto'})).text,'X');ctx.WhiteboardHandwritingLearning.undo(tx);
 assert.equal((await reader.recognize(eq,W,H,{mode:'auto'})).text,'=');
 await assert.rejects(reader.recognize(eq,W,H,{mode:'auto',signal:{aborted:true}}),{name:'AbortError'});
 console.log('PASS',controls,'division/equals controls; stroke coverage, incorrect written answers, multiplication/plus/minus/colon negatives, explicit modes, personal correction/Undo and cancellation');
})().catch(error=>{console.error(error);process.exitCode=1});
