const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const createContext=require('./helpers/handwriting-context.cjs'),ctx=createContext(),{make,W,H,S}=require('./helpers/square-root-fixtures.cjs')(ctx),reader=ctx.WhiteboardHandwritingMath;
const transform=ink=>ink.map(s=>({...s,points:s.points.map(p=>({x:p.x*.7+.04,y:p.y*.7+.05})).reverse()})).reverse();
(async()=>{
 let count=0,flagged=0;
 for(const [value,answer]of [['49','7'],['64','8'],['81','9'],['100','10'],['2',null],['49','8'],['9+7','4']]){
  for(const joined of [false,true])for(const curved of [false,true])for(const moved of [false,true]){
   let {ink}=make(value,answer,{joined,curved});if(moved)ink=transform(ink);
   const r=await reader.recognize(ink,W,H,{mode:'auto'}),expected='\\sqrt{'+value.replace(/\+/g,' + ')+'}'+(answer===null?'':' = '+answer);
   assert.equal(r.text,expected,JSON.stringify({value,answer,joined,curved,moved}));
   assert.equal(r.engine,'local-square-root');assert.equal(r.format,'latex');
   assert.equal(r.tokens.reduce((n,t)=>n+t.parts.length,0)+r.radicalParts.length,ink.length,'all strokes accounted for');
   assert.equal(r.uncertain.length,r.tokens.filter(t=>t.score<.85).length,'numeric confidence remains visible');
   if(r.uncertain.length)flagged++;count++;
  }
 }
 const f=make('49','7');
 for(const ink of [f.digits,[...f.digits,...f.tail],[f.radical[0],...f.digits,...f.tail],[f.radical[1],...f.digits,...f.tail],
  [...f.ink,S([[80,100],[85,125]])],make('49','').ink]){
  assert.notEqual((await reader.recognize(ink,W,H,{mode:'auto'})).engine,'local-square-root','missing hook/roof, indexed/extra ink and incomplete equality abstain');
 }
 const bracket=S([[146,286],[146,178]]);
 assert.notEqual((await reader.recognize([bracket,...f.ink.slice(1)],W,H,{mode:'auto'})).engine,'local-square-root','long division bracket has no radical hook');
 assert.notEqual((await reader.recognize(f.ink,W,H,{mode:'uppercase'})).engine,'local-square-root');
 const original=await reader.recognize(f.ink,W,H,{mode:'auto'}),learn=ctx.WhiteboardHandwritingLearning;
 const tx=learn.confirm(original,'\\sqrt{49} = 8',reader.rasterDigit,f.ink,W,H,'auto');
 assert(tx?.count);assert.equal((await reader.recognize(f.ink,W,H,{mode:'auto'})).text,'\\sqrt{49} = 8');
 learn.undo(tx);assert.equal((await reader.recognize(f.ink,W,H,{mode:'auto'})).text,original.text);
 let calls=0;await reader.recognize(f.ink,W,H,{mode:'math',mathRecognizer:async()=>{calls++;return{text:'x',tokens:[],uncertain:[],format:'latex'}}});assert.equal(calls,1);
 const renderer={window:{}};vm.createContext(renderer);vm.runInContext(fs.readFileSync('whiteboard-handwriting-math-render-beta.js','utf8'),renderer);
 for(const [text,want]of [['√49 = 7','\\sqrt{49} = 7'],['√100','\\sqrt{100}'],['√2.25','\\sqrt{2.25}'],['\\sqrt{49} = 7','\\sqrt{49} = 7'],['√x','\\sqrt x']])assert.equal(renderer.window.WhiteboardMathRenderer.normalize(text),want);
 console.log(`PASS square-root structure: ${count} invented/public-UJI cases (${flagged} reviewed), split/joined/curved/reversed/moved roots, different digits and false answers, complete ink, negative controls, personal correction/Undo, explicit modes and Unicode rendering`);
})().catch(e=>{console.error(e);process.exitCode=1});
