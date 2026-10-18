const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('whiteboard-handwriting-recognition-beta.js','utf8');
new vm.Script(src);
let calls=0;
const context={window:{WhiteboardPrimaryMathGrammar:{create:()=>({recognize:async strokes=>{calls++;assert.equal(strokes.length,4);return{text:'4 cm',tokens:[]};}})}},Float32Array,Int8Array,Math};
vm.createContext(context);
vm.runInContext(src.replace(/\}\)\(\);\s*$/,'window.__raised=detectRaisedMeasuredQuantity;})();'),context);
const stroke=arr=>({size:5,points:arr.map(([x,y])=>({x,y}))});
const ink=[
 stroke([[.284,.295],[.260,.35],[.21,.46],[.38,.44]]),
 stroke([[.338,.296],[.33,.40],[.296,.608]]),
 stroke([[.523,.466],[.48,.47],[.46,.51],[.49,.56],[.523,.56]]),
 stroke([[.576,.48],[.57,.54],[.61,.46],[.635,.54],[.67,.47],[.717,.56]]),
 stroke([[.751,.342],[.775,.334],[.795,.352],[.79,.376],[.767,.40],[.79,.42],[.779,.434],[.75,.429]])
];
(async()=>{
 const result=await context.window.__raised(ink,372,360.4,{mode:'auto'});
 assert.equal(result?.text,'4 cm²');
 assert.equal(calls,1);
 const normal=await context.window.__raised(ink.slice(0,4),372,360.4,{mode:'auto'});
 assert.equal(normal,null);
 console.log('PASS structural superscript 2 from 5-stroke measurement; base unit unchanged');
})().catch(e=>{console.error(e);process.exitCode=1});
