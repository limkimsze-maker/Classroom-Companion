'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const create=require('../../scripts/helpers/handwriting-context.cjs'),{assemble,canonical}=require('../../scripts/benchmark-handwriting-simulations.cjs');
const source=fs.readFileSync('experimental/math-structure/reader-v2.js','utf8'),c=create(),before=create();
vm.runInContext(source,c);
const exported='recognize:async(strokes,W,H,options={})=>lowercaseReadingV2(await recognize(strokes,W,H,options),options)';
assert.equal(source.split(exported).length,2);vm.runInContext(source.replace(exported,'recognize'),before);
vm.runInContext(fs.readFileSync('scripts/handwriting-uji-real-ink-fixtures.js','utf8'),c);
const R=c.WhiteboardHandwritingMath,W=1800,H=600;
(async()=>{
 let correct=0,total=0;
 for(const [writer,samples]of Object.entries(c.WhiteboardUJIInkFixtures.samples))for(const expected of ['c','m','k','g','l'])for(const rep of [0,1]){
  const ss=assemble(samples,expected,rep),r=await R.recognize(ss,W,H,{mode:'auto'});
  total++;correct+=canonical(r.text)===expected;
  assert(!/[A-Z]/.test(r.text),'Default alphabet output is lowercase: '+writer+'/'+rep+' '+expected);
  const alternatives=r.context?.alternatives||[];
  assert(alternatives.every(a=>!/[A-KM-Z]/.test(a.text)),'Only litre L may remain uppercase');
  assert.equal(new Set(alternatives.map(a=>a.text)).size,alternatives.length,'Case choices deduplicated');
  const sources=r.tokens.flatMap(t=>(t.parts||[]).map(p=>p.source));
  const original=await before.WhiteboardHandwritingMath.recognize(ss,W,H,{mode:'auto'});
  const originalSources=original.tokens.flatMap(t=>(t.parts||[]).map(p=>p.source));
  assert.equal(JSON.stringify(sources.map(s=>ss.indexOf(s))),JSON.stringify(originalSources.map(s=>ss.indexOf(s))),'Case policy preserves existing stroke accounting');
 }
 assert.equal(total,110);assert.equal(correct,101,'Nine non-case errors remain visible rather than inferred');
 for(const [writer,samples]of Object.entries(c.WhiteboardUJIInkFixtures.samples))for(const rep of [0,1]){
  const ss=assemble(samples,'L',rep),r=await R.recognize(ss,W,H,{mode:'auto'});
  assert.equal(r.text,'L','Standalone litre L: '+writer+'/'+rep);
 }
 for(const text of ['L','20L','8ml','97kg','8÷2=4','10m³']){
  const r=await R.recognize(assemble(c.WhiteboardUJIInkFixtures.samples[1],text,0),W,H,{mode:'auto'});
  assert.equal(canonical(r.text),text,'Standard maths and units: '+text);
 }
 console.log('PASS lowercase alphabet policy: 101/110 existing lowercase glyphs; litre L retained for all 22 standalone samples; no other uppercase alternatives or duplicate choices; unchanged stroke accounting; standard maths and units preserved');
})().catch(e=>{console.error(e);process.exitCode=1});
