const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=require('./helpers/handwriting-context.cjs')();
vm.runInContext(fs.readFileSync('scripts/handwriting-uji-real-ink-fixtures.js','utf8'),ctx);
const {assemble}=require('./benchmark-handwriting-simulations.cjs');
const samples=ctx.WhiteboardUJIInkFixtures.samples;
(async()=>{
 const probe=assemble(samples['1'],'4',0).map(s=>({size:s.size,points:s.points.map(p=>({x:p.x*1800,y:p.y*600}))}));
 const pixels=ctx.WhiteboardHandwritingMath.rasterDigit(probe),inference=ctx.WhiteboardCharacterInference;
 const reference=JSON.stringify(inference.forward(pixels,'mixed'));
 assert.equal(JSON.stringify(inference.predict(pixels,'auto',false)),reference,'memoization preserves exact neural scores');
 const mutable=inference.predict(pixels,'auto',false);mutable[0].char='changed';
 assert.equal(JSON.stringify(inference.predict(pixels,'auto',false)),reference,'returned choices cannot corrupt cached predictions');
 const penReference=JSON.stringify(ctx.WhiteboardUjiReader.read(probe.map(p=>p.points)));
 const mutablePen=ctx.WhiteboardUjiReader.read(probe.map(p=>p.points));mutablePen[0].label='changed';
 assert.equal(JSON.stringify(ctx.WhiteboardUjiReader.read(probe.map(p=>p.points))),penReference);
 for(const writer of ['1','2','3','4','5'])for(const value of ['35','101','61','41','11','71']){
  const ink=assemble(samples[writer],value,0),read=await ctx.WhiteboardHandwritingMath.recognize(ink,1800,600,{mode:'auto'});
  assert.equal(read.text.replace(/\s+/g,''),value,`${writer}: ${value} -> ${read.text}`);
 }
 const openFour=assemble(samples['5'],'4',1);
 const four=await ctx.WhiteboardHandwritingMath.recognize(openFour,1800,600,{mode:'auto'});
 assert.equal(four.text,'4');assert(four.uncertain.length,'contradicting image-model evidence remains flagged');
 const cm=await ctx.WhiteboardHandwritingMath.recognize(assemble(samples['1'],'35cm',0),1800,600,{mode:'auto'});
 assert.equal(cm.text,'35 cm','independent letters must beat a misleading coarse mm template');
 const s=points=>({size:4,points:points.map(([x,y])=>({x:x/800,y:y/600}))});
 const money=[s([[55,195],[35,195],[30,207],[55,222],[52,240],[30,240]]),s([[42,183],[42,252]]),
  s([[90,187],[91,260]]),s(Array.from({length:41},(_,i)=>{const t=i*Math.PI/20;return[135+17*Math.cos(t),223+34*Math.sin(t)]}))];
 assert.equal((await ctx.WhiteboardHandwritingMath.recognize(money,800,600,{mode:'auto'})).text,'$10','numeric consensus preserves a monetary dollar sign');
 console.log('PASS real labelled development glyphs: numeric consensus, open 4 review, no false 61/41/11/71 merges, cm preserved');
})().catch(error=>{console.error(error);process.exitCode=1});
