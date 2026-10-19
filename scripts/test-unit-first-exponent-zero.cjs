const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('whiteboard-handwriting-recognition-beta.js','utf8');
new vm.Script(source);
const mk=xy=>({size:5,points:xy.map(([x,y])=>({x,y}))});
const oval=[];
for(let i=0;i<=48;i++){const t=i*Math.PI*2/48;oval.push([.447+.019*Math.sin(t),.426-.062*Math.cos(t)])}
const strokes=[
 mk([[.402,.36],[.404,.40],[.404,.44],[.404,.48]]),
 mk(oval),
 mk([[.477,.43],[.477,.47],[.483,.41],[.488,.47],[.493,.42],[.498,.48]]),
 mk([[.505,.345],[.513,.345],[.514,.36],[.505,.368],[.510,.372],[.513,.386],[.501,.387]])
];
async function run(exponent){
 const window={
  WhiteboardTeacherUnits:{rank:(ss,W,H,options)=>ss.length===2?
   [{label:'m²',score:.913},{label:'m³',score:.685}]:[]},
  WhiteboardUnitExponent:{match:()=>({label:exponent,score:.89,margin:.1})}
 };
 const context={window,Math,Float32Array,Int8Array};
 vm.createContext(context);
 // Force a known digit-0->5 failure to verify true zero recovery.
 const patch=source.replace('async function recognizeCore(strokes,W,H,options={}){',
   'async function legacyRecognizeCore(strokes,W,H,options={}){')
  .replace('async function recognizeUnitFirst(strokes,W,H,options){',
   'async function recognizeCore(strokes,W,H,options){return{text:options.mode===\'digits\'?\'15\':\'legacy wrong\',engine:\'stub\'};}\nasync function recognizeUnitFirst(strokes,W,H,options){');
 vm.runInContext(patch,context);
 return window.WhiteboardHandwritingMath.recognize(strokes,1402,522,{mode:'auto'});
}
(async()=>{
 assert.equal((await run('³')).text,'10 m³');
 assert.equal((await run('²')).text,'10 m²');
 console.log('PASS: 10 m³, 10 m² and closed 0 from a forced 15');
})().catch(e=>{console.error(e);process.exitCode=1});
