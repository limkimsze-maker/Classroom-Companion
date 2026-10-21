'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const create=require('../../scripts/helpers/handwriting-context.cjs');
const {assemble}=require('../../scripts/benchmark-handwriting-simulations.cjs');
const source=fs.readFileSync('experimental/math-structure/reader-v2.js','utf8');
const groups=JSON.parse(source.match(/const groups=(\{"l":.*\});/)[1]);
const holdout=require('./fixtures/shared-letter-holdout-v2.json').samples;
const c=create();vm.runInContext(source,c);
const R=c.WhiteboardHandwritingMath,S=R.sharedLettersV2;
function pixels(feature){
 const a=new Float32Array(784);
 for(let y=0;y<14;y++)for(let x=0;x<14;x++){
  const i=y*56+x*2,v=parseInt(feature[y*14+x],16)/15;
  a[i]=a[i+1]=a[i+28]=a[i+29]=v;
 }
 return a;
}
(async()=>{
 assert.deepEqual(JSON.parse(JSON.stringify(S.counts)),{l:12,k:12,g:12});
 const training=Object.entries(groups).flatMap(([char,features])=>features.map((feature,i)=>({id:char+'-'+i,char:char==='other'?'0':char,feature})));
 const stored=new Map([['whiteboard.handwriting.examples.v1',JSON.stringify({version:1,samples:training})]]);
 const old=create(stored).WhiteboardHandwritingLearning;
 let previous=0,improved=0;
 for(const sample of holdout){
  assert(!training.some(s=>s.feature===sample.feature),'Held-out features must never enter matching data');
  const raster=pixels(sample.feature);assert.equal(S.feature(raster),sample.feature);
  previous+=old.match(raster)?.char===sample.char;
  const match=S.matchFeature(sample.feature);improved+=match?.char===sample.char;
  assert(!match||match.char===sample.char,'Shared matcher must abstain instead of choosing a wrong letter');
 }
 assert.equal(previous,13);assert.equal(improved,16);
 assert.equal(S.matchFeature(''),null);assert.equal(S.feature(new Float32Array(784)),null);
 for(const [char,features]of Object.entries(groups))if(char!=='other')for(const feature of features)assert.equal(S.matchFeature(feature)?.char,char);
 vm.runInContext(fs.readFileSync('scripts/handwriting-uji-real-ink-fixtures.js','utf8'),c);
 let examined=0,matched=0;
 for(const samples of Object.values(c.WhiteboardUJIInkFixtures.samples))for(const char of Object.keys(samples))for(const rep of [0,1]){
  const ink=assemble(samples,char,rep);if(!ink)continue;examined++;
  const parts=ink.map(s=>({...s,points:s.points.map(p=>({x:p.x*1800,y:p.y*600}))}));
  const match=S.matchFeature(S.feature(R.rasterDigit(parts)));
  if(!match)continue;matched++;
  const reading=await R.recognize(ink,1800,600,{mode:'auto'});
  assert.equal(reading.text,char==='L'?'L':char.toLowerCase(),'All matching UJI controls, including similar digits, remain correct');
 }
 const ink=assemble(c.WhiteboardUJIInkFixtures.samples[11],'l',0);
 const wrong={text:'e',tokens:[],uncertain:[{char:'e'}],engine:'local-test'};
 const repaired=S.review(wrong,ink,1800,600,{mode:'auto'});
 assert.equal(repaired.text,'l','Full-glyph review uses all pen lifts');
 assert.equal(repaired.tokens[0].parts.length,ink.length);
 for(const text of ['L','8ml','20L','97kg','1+1=2']){
  const reading={...wrong,text};assert.equal(S.review(reading,ink,1800,600,{mode:'auto'}),reading);
 }
 assert.equal(S.review(wrong,ink,1800,600,{mode:'digits'}),wrong);
 assert.equal(S.review(wrong,ink,1800,600,{mode:'math'}),wrong);
 const personal={...wrong,engine:'local-personal-ink'};assert.equal(S.review(personal,ink,1800,600,{mode:'auto'}),personal);
 const originalMatch=c.WhiteboardHandwritingLearning.match;c.WhiteboardHandwritingLearning.match=()=>({char:'e',personal:true});
 assert.equal(S.review(wrong,ink,1800,600,{mode:'auto'}),wrong,'Individual learning overrides shared examples');
 c.WhiteboardHandwritingLearning.match=originalMatch;
 console.log(JSON.stringify({heldOutFeatureMatches:{previous,improved,total:holdout.length},ujiGlyphsExamined:examined,sharedMatchesChecked:matched,personalPriority:true,mathAndLitreProtection:true}));
})().catch(e=>{console.error(e);process.exitCode=1});
