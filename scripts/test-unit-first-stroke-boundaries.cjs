/* Synthetic controls for spatial boundaries and multi-stroke powers. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('whiteboard-handwriting-recognition-beta.js','utf8');
const stroke=xy=>({points:xy.map(([x,y])=>({x,y}))});
const prefix=[stroke([[.1,.30],[.1,.62]]),stroke([[.19,.30],[.24,.30],[.19,.45],[.23,.62]])];
const m=stroke([[.31,.50],[.31,.62],[.34,.48],[.36,.62],[.38,.48],[.41,.62]]);
const touch=stroke([[.35,.56],[.35,.59]]);
const two=stroke([[.44,.30],[.47,.30],[.47,.34],[.44,.40],[.48,.40]]);
const second=stroke([[.435,.30],[.445,.315]]);
async function read(unitInk,rank){
 let exponentCalls=0;
 const window={WhiteboardTeacherUnits:{rank},WhiteboardUnitExponent:{match:()=>{exponentCalls++;return{label:'³',score:.99,margin:.5}}}};
 const context={window,Math,Float32Array,Int8Array};vm.createContext(context);
 const stubbed=source.replace('async function recognizeCore(strokes,W,H,options={}){','async function savedRecognizeCore(strokes,W,H,options={}){')
  .replace('async function recognizeUnitFirst(strokes,W,H,options){',
   'async function recognizeCore(strokes,W,H,options){window.__numberInk=strokes;return{text:"10",engine:"test-number"};}\nasync function recognizeUnitFirst(strokes,W,H,options){');
 vm.runInContext(stubbed,context);
 const result=await window.WhiteboardHandwritingMath.recognize([...prefix,...unitInk],1000,600,{mode:'auto'});
 assert.equal(result.text,'10 m²');
 assert.equal(window.__numberInk.length,2,'unit ink must stay out of the numeric reader');
 return exponentCalls;
}
(async()=>{
 // The small finishing stroke belongs to m, not the numeric quantity.
 await read([m,touch,two],ink=>ink.length===3?[{label:'m²',score:.99},{label:'m³',score:.6}]:[]);
 // The two components of a square exponent must not invoke the single-stroke model.
 assert.equal(await read([m,two,second],ink=>ink.length===3?[{label:'m²',score:.93},{label:'m³',score:.8}]:[]),0);
 // A plausible longer suffix must not steal the second digit before a better match.
 await read([m,two],ink=>ink.length===3?[{label:'cm³',score:.88},{label:'cm²',score:.86}]:
  ink.length===2?[{label:'m²',score:.99},{label:'m³',score:.6}]:[]);
 console.log('PASS: unit finishing strokes, two-stroke powers and competing numeric boundaries');
})().catch(error=>{console.error(error);process.exitCode=1});
