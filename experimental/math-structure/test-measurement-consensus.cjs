'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const createContext=require('../../scripts/helpers/handwriting-context.cjs');
const fixture=require('./fixtures/teacher-open-four-area.json'),{number}=require('./layout-fixtures.cjs');
const ctx=createContext(),v1=createContext();vm.runInContext(require('./candidate.cjs').build(),ctx);
const reader=ctx.WhiteboardHandwritingMath,W=fixture.width,H=fixture.height;
const transform=(ink,scale=1,dx=0,dy=0)=>ink.map(s=>({...s,points:s.points.map(p=>({x:p.x*scale+dx,y:p.y*scale+dy}))}));
(async()=>{
 const records=[];
 for(const [name,ink] of [
  ['actual uploaded ink',fixture.strokes],
  ['moved and smaller',transform(fixture.strokes,.85,.04,.04)],
  ['larger',transform(fixture.strokes,1.1)],
  ['reversed stroke order',fixture.strokes.slice().reverse()],
  ['reversed pen direction',fixture.strokes.map(s=>({...s,points:s.points.slice().reverse()}))]
 ]){
  const before=await v1.WhiteboardHandwritingMath.recognize(ink,W,H,{mode:'auto'});
  const after=await reader.recognize(ink,W,H,{mode:'auto'});
  assert.equal(after.text,'45 cm²',name);
  assert(after.uncertain.some(t=>t.char==='4'),'Pen/image disagreement remains visible');
  assert.equal(new Set(after.tokens.flatMap(t=>t.parts.map(p=>p.source))).size,ink.length,'Complete measurement stroke coverage');
  records.push({name,before:before.text,after:after.text,flagged:true,engine:after.engine});
 }
 // Replace the second digit with other existing public UJI V1 glyphs. No fixed
 // quantity or memorised 45 -> cm² correction can satisfy these controls.
 const old=fixture.strokes[2],xs=old.points.map(p=>p.x),ys=old.points.map(p=>p.y);
 for(const value of ['6','7','8','9','10']){
  const glyph=number(value),xmin=Math.min(...xs),ymin=Math.min(...ys),height=Math.max(...ys)-ymin;
  const replacement=glyph.strokes.map(points=>({size:5,points:points.map(([x,y])=>({x:xmin+x*height*H/(glyph.h*W),y:ymin+y*height/glyph.h}))}));
  // Shift the unit right for a wider changed quantity, preserving its geometry.
  const end=Math.max(...replacement.flatMap(s=>s.points.map(p=>p.x))),delta=Math.max(0,end-Math.max(...xs));
  const ink=[...fixture.strokes.slice(0,2),...replacement,
   ...fixture.strokes.slice(3).map(s=>({...s,points:s.points.map(p=>({x:p.x+delta,y:p.y}))}))];
  const after=await reader.recognize(ink,W,H,{mode:'auto'});
  assert.equal(after.text,'4'+value+' cm²','Changed quantity '+value);
  records.push({name:'changed quantity 4'+value,after:after.text,flagged:!!after.uncertain.length});
 }
 // A non-measurement prefix keeps the existing dollar/4 ambiguity behavior.
 const prefix=fixture.strokes.slice(0,3);
 const base=await v1.WhiteboardHandwritingMath.recognize(prefix,W,H,{mode:'auto'});
 assert.equal((await reader.recognize(prefix,W,H,{mode:'auto'})).text,base.text,'Do not reinterpret dollar-like ink outside measurement context');
 for(const mode of ['uppercase','lowercase','digits']){
  const a=await v1.WhiteboardHandwritingMath.recognize(fixture.strokes,W,H,{mode});
  const b=await reader.recognize(fixture.strokes,W,H,{mode});
  assert.equal(b.text,a.text,'Explicit '+mode+' mode preserved');
 }
 const learn=ctx.WhiteboardHandwritingLearning,original=await reader.recognize(fixture.strokes,W,H,{mode:'auto'});
 const tx=learn.confirm(original,'45 mm²',reader.rasterDigit,fixture.strokes,W,H,'auto');
 assert(tx?.count);assert.equal((await reader.recognize(fixture.strokes,W,H,{mode:'auto'})).text,'45 mm²');
 learn.undo(tx);assert.equal((await reader.recognize(fixture.strokes,W,H,{mode:'auto'})).text,'45 cm²');
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({method:'One actual teacher failure, correlated transform controls and changed-value compositions; development checks, not general accuracy.',records},null,2)+'\n');
 console.log('PASS teacher measurement, changed values, stroke coverage, visible disagreement, explicit modes and personal correction/Undo');
})().catch(error=>{console.error(error);process.exitCode=1});
