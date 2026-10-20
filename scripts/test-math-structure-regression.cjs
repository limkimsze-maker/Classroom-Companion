'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const createContext=require('./helpers/handwriting-context.cjs');
const source=fs.readFileSync('whiteboard-handwriting-recognition-beta.js','utf8');
new vm.Script(source,{filename:'whiteboard-handwriting-recognition-beta.js'});
assert(source.includes("async function detectSquareRoot("),'square-root detector missing');
assert(source.includes("async function radicalExpression("),'radical grammar missing');
assert(source.includes("async function detectParenthesizedNumber("),'bracket detector missing');
assert(!source.includes(String.raw`[0-9+−×÷().\\s]`),'incorrect double-escaped whitespace grammar');
const ctx=createContext();
assert.equal(typeof ctx.WhiteboardHandwritingMath.recognize,'function');
const S=coords=>({size:5,points:coords.map(([x,y])=>({x:x/400,y:y/300}))});
const bracket=[S([[70,95],[61,106],[55,127],[55,150],[61,173],[70,185]]),
 S([[95,113],[95,163]]),S([[120,120],[133,110],[145,120],[147,148],[138,164],[124,157],[120,137]]),
 S([[166,95],[176,106],[182,127],[182,150],[176,173],[166,185]])];
const radical=[S([[46,85],[52,111],[59,128],[68,92],[77,55]]),
 S([[77,55],[125,55],[170,55],[225,55],[270,55]])];
(async()=>{
 const nested=bracket.map(stroke=>({...stroke,points:stroke.points.map(p=>({x:p.x+0.19,y:((p.y*300-95)*0.55+62)/300}))}));
 const cases=[['standalone parentheses',bracket],['radical with parentheses',[...radical,...nested]]];
 let failures=0;
 for(const [label,ink] of cases){
  const r=await ctx.WhiteboardHandwritingMath.recognize(ink,400,300,{mode:'auto'});
  const ok=label==='standalone parentheses'?r.text.startsWith('(')&&r.text.endsWith(')'):r.text.startsWith('\\sqrt{')&&r.text.endsWith('}');
  console.log(JSON.stringify({label,output:r.text,engine:r.engine,pass:ok}));
  if(!ok)failures++;
 }
 assert.equal(failures,0,'structural math recognition regression');
 console.log('PASS math structure regression');
})().catch(error=>{console.error(error);process.exitCode=1});
