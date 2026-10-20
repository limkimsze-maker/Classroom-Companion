'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {roofCandidates}=require('./graph.cjs');
const createContext=require('../../scripts/helpers/handwriting-context.cjs');
const src=fs.readFileSync('scripts/test-math-structure-regression.cjs','utf8');
const match=src.match(/const teacherRows="([^"]+)"/);
assert(match,'teacher fixture absent');
const ink=match[1].split('|').map(row=>({size:5,points:row.split(';').map(pair=>{const [x,y]=pair.split(',').map(Number);return{x:x/10000,y:y/10000};})}));
const roots=roofCandidates(ink);
const candidate=roots.find(r=>r.roof===0&&r.hook===1);
assert(candidate,'root candidate absent');
const ctx=createContext();
(async()=>{
  for(const [label,strokes] of [
    ['full',ink],
    ['inside',candidate.inside.map(i=>ink[i])],
    ['inside-numbers-only',candidate.inside.map(i=>ink[i]).filter((s,i)=>![1,2].includes(i))]
  ]){
    const r=await ctx.WhiteboardHandwritingMath.recognize(strokes,372,404.24444580078125,{mode:'auto'});
    console.log('EXPERIMENTAL_EXPRESSION_DIAGNOSTIC',JSON.stringify({label,text:r.text,engine:r.engine,uncertain:r.uncertain}));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
