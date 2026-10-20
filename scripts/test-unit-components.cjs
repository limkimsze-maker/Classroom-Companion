const assert=require('node:assert/strict'),createContext=require('./helpers/handwriting-context.cjs');
const ctx=createContext(),reader=ctx.WhiteboardHandwritingMath,W=800,H=600;
const S=points=>({size:4,points:points.map(([x,y])=>({x:x/W,y:y/H}))});
const oval=[];for(let n=0;n<=40;n++){const t=n*Math.PI/20;oval.push([76+17*Math.cos(t),223+34*Math.sin(t)])}
const prefix=[S([[32,187],[33,260]]),S(oval)];
const m=S([[120,240],[121,210],[130,208],[138,236],[144,210],[152,210],[159,240]]);
const two=S([[175,182],[183,178],[190,183],[191,189],[183,197],[175,205],[191,205]]);
(async()=>{
 ctx.WhiteboardTeacherUnits={rank:()=>[],match:()=>null};
 const result=await reader.recognize([...prefix,m,two],W,H,{mode:'auto'});
 assert.equal(result.text,'10 m²');assert(['unit-first-components','unit-first-raised-suffix','local-raised-measurement'].includes(result.engine),'component or independent raised-suffix path must retain all ink');
 assert.equal(result.tokens.map(t=>t.char).join(''),'10m²');
 const splitM=[S([[120,240],[121,210],[130,208],[138,236]]),S([[138,236],[144,210],[152,210],[159,240]])];
 const split=await reader.recognize([...prefix,...splitM,two],W,H,{mode:'auto'});
 assert.equal(split.text,'10 m²','a two-stroke m must stay separate from its power');
 assert(['unit-first-components','unit-first-raised-suffix','local-raised-measurement'].includes(split.engine));
 assert.equal(split.tokens.map(t=>t.char).join(''),'10m²');
 // Independent pen lifts on every line: six strokes for m, three for ².
 const lifted=[[[200,330],[200,460]],[[355,445],[355,385]],[[355,385],[375,380]],
  [[375,380],[390,445]],[[390,445],[405,385]],[[405,385],[420,385]],
  [[420,385],[435,445]],[[450,315],[478,315]],[[478,315],[450,390]],[[450,390],[485,390]]].map(S);
 assert.equal((await reader.recognize(lifted,W,H,{mode:'auto'})).text,'1 m²','multi-stroke unit body and power stay grouped');
 const baseline=await reader.recognize([...prefix,m],W,H,{mode:'auto'});
 assert(!baseline.text.includes('²'),'no invented exponent on a baseline m');
 ctx.WhiteboardTrainedJ={detect:()=>({text:'j',engine:'test-j'}),embeddedPairs:()=>[]};
 assert.equal((await reader.recognize([prefix[0]],W,H,{mode:'uppercase'})).text,'J');
 assert.equal((await reader.recognize([prefix[0]],W,H,{mode:'digits'})).text,'1','Numbers must not use the j override');
 console.log('PASS actual CNNs: independent unit letters/power fallback, retained tokens, no invented power, explicit Numbers and uppercase modes');
})().catch(error=>{console.error(error);process.exitCode=1});
