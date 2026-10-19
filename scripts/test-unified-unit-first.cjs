const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('whiteboard-handwriting-recognition-beta.js','utf8');
new vm.Script(source);
const shape=(coords)=>({points:coords.map(([x,y])=>({x,y}))});
const ink=[
 shape([[.40,.36],[.405,.48]]),
 shape([[.44,.36],[.43,.40],[.43,.47],[.44,.49],[.457,.40],[.44,.36]]),
 shape([[.477,.43],[.477,.47],[.486,.41],[.489,.47],[.497,.43],[.498,.48]]),
 shape([[.505,.349],[.509,.344],[.513,.36],[.505,.368],[.51,.371],[.51,.389],[.5,.386]])
];
function run(unit,opts={}){
 let numberCalls=0,wholeCalls=0;
 const ctx={window:{WhiteboardTeacherUnits:{match:opts.weak?undefined:()=>({text:opts.wholeUnit||'min',engine:'mock-whole-notation',uncertain:[]}),rank:(suffix,W,H,{only})=>{
  if(suffix.length!==2)return[];
  const other=unit==='m²'?'m³':'m²';
  return[{label:unit,score:opts.weak?.83:.98},{label:other,score:opts.weak?.82:.72}];
 }}},Math,Float32Array,Int8Array};
 vm.createContext(ctx);
 const modified=source.replace('async function recognizeCore(strokes,W,H,options={}){','async function originalRecognizeCore(strokes,W,H,options={}){').replace('async function recognizeUnitFirst(strokes,W,H,options){', `async function recognizeCore(strokes,W,H,options){window.__numberCalls=(window.__numberCalls||0)+1;return {text:options.mode==='digits'?'10':'WRONG m²',engine:'mock'};}\nasync function recognizeUnitFirst(strokes,W,H,options){`);
 vm.runInContext(modified,ctx);
 return ctx.window.WhiteboardHandwritingMath.recognize(ink,1402,522,{mode:'auto'}).then(r=>({r,calls:ctx.window.__numberCalls}));
}
(async()=>{
 let z=await run('m³');assert.equal(z.r.text,'10 m³');assert.equal(z.calls,1);
 z=await run('m²');assert.equal(z.r.text,'10 m²');assert.equal(z.calls,1);
 z=await run('cm²',{wholeUnit:'cm²'});assert.equal(z.r.text,'cm²');assert.equal(z.calls,undefined,'a taught complete powered unit cannot lose its first letter to a numeric prefix');
 z=await run('m²',{weak:true});assert.equal(z.r.text,'10 m?');
 console.log('PASS unit-first prefix isolation, complete measurement precedes misleading whole notation, cubic/square contrast, uncertain exponent');
})().catch(e=>{console.error(e);process.exitCode=1});
