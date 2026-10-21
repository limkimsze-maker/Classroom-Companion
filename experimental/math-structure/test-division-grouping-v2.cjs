'use strict';
// Generated strokes only. A dot can contain many pointer samples, and the
// bottom dot can sit below the digit baseline. Neither changes its identity.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const create=require('../../scripts/helpers/handwriting-context.cjs'),f=require('./sign-fixtures.cjs');
const c=create();
for(const name of ['symbol-learning-v2.js','reader-v2.js'])vm.runInContext(fs.readFileSync('experimental/math-structure/'+name,'utf8'),c);
const R=c.WhiteboardHandwritingMath,S=ps=>({size:5,points:ps.map(([x,y])=>({x:x/f.W,y:y/f.H}))});
const bar=S([[0,0],[3,2],[10,2],[20,0],[30,-2]]);
const top=S([[14,-22],[15,-23],[16,-22],[15,-21],[14,-22],[15,-23],[16,-22],[15,-21]]);
const bottom=S([[18,30],[20,28],[22,26],[21,27],[19,29],[18,30],[20,28]]);
const divide=[bar,top,bottom];
function variants(ss){return [ss,ss.map(s=>({...s,size:s.size*.7,points:s.points.map(p=>({x:p.x*.7+.03,y:p.y*.7+.04}))})),ss.slice().reverse().map(s=>({...s,points:s.points.slice().reverse()}))];}
function coverage(r,ss){const sources=r.tokens.flatMap(t=>t.parts.map(p=>p.source));assert.equal(sources.length,ss.length);assert.equal(new Set(sources).size,ss.length);assert(sources.every(s=>ss.includes(s)));}
(async()=>{
 let count=0;
 for(const [a,b,z] of [['50','5','10'],['18','3','6'],['50','5','12'],['10','2','5']])for(const ss of variants(f.equation(a,b,z,divide,1,[S([[0,0],[24,0]]),S([[0,10],[24,10]])]))){
  const r=await R.recognize(ss,f.W,f.H,{mode:'auto'});assert.equal(r.text.replace(/\s/g,''),a+'÷'+b+'='+z);coverage(r,ss);count++;
 }
 for(const ss of variants(divide)){const r=await R.recognize(ss,f.W,f.H,{mode:'auto'});assert.equal(r.text,'÷');coverage(r,ss);count++;}
 const reserved=ss=>R.segment(ss,f.W,f.H).filter(t=>t.engine==='local-three-stroke-division-v2');
 for(const ss of [[bar,top],[bar,bottom],[top,bottom],[bar,top,bottom,S([[15,40]])],
  [bar,S([[0,-22],[30,-22]]),bottom],[bar,top,S([[15,15],[15,45]])]]){
  assert.equal(reserved(ss).length,0,'Incomplete signs, extra marks and numeral strokes must not be claimed');count++;
 }
 for(const mode of ['digits','lowercase','uppercase'])assert(!R.segment(divide,f.W,f.H,mode).some(t=>t.engine==='local-three-stroke-division-v2'));
 assert.equal(c.WhiteboardHandwritingLearning.info().symbolExamples,0,'No teaching or import required');
 console.log('PASS',count,'division grouping controls; dense dots, baseline gaps, changed values, wrong written answer, transforms, complete stroke accounting and negative layouts');
})().catch(e=>{console.error(e);process.exitCode=1});
