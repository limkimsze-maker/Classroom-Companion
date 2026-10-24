'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {fixtures}=require('./fraction-bar-fixtures.cjs');
const sourcePath=process.env.FRACTION_CONTROLLER||'smart-math-fractions-v3.js';
let source=fs.readFileSync(path.resolve(__dirname,'..',sourcePath),'utf8');
source=source.replace('function buildFractionSrc','window.__analyseFraction=analyseFraction;\nfunction buildFractionSrc');
let failures=[],passed=0;
for(const [width,height] of [[1000,700],[390,900]]){
 const doc={getElementById:()=>null,addEventListener(){}};
 const context=vm.createContext({canvas:{addEventListener(){}},strokes:[],redraw(){},syncUi(){},cssW:width,cssH:height,document:doc,window:{addEventListener(){}},location:{search:''},URLSearchParams,undoBtn:{addEventListener(){}}});
 vm.runInContext(source,context);
 const analyse=context.window.__analyseFraction;
 for(const f of fixtures(width,height)){
  const result=analyse(f.ink);
  if(result?.parts!==f.parts||result?.horizontal!==f.horizontal)failures.push({width,name:f.name,want:f.parts,got:result?.parts??null,horizontal:result?.horizontal});
  else passed++;
 }
 // Whole bars, loose lines and incomplete sketches must keep their raw ink.
 const stroke=points=>({points:points.map(([x,y])=>({x,y})),colour:'#17324d',size:5});
 for(const [name,ink] of [['single-line',[stroke([[.15,.3],[.8,.3]])]],['outline-without-cuts',[stroke([[.15,.3],[.8,.3],[.8,.45],[.15,.45],[.15,.3]])]],['loose-parallel-lines',[stroke([[.15,.3],[.8,.3]]),stroke([[.15,.45],[.8,.45]])]],['incomplete-open-U',[stroke([[.15,.3],[.8,.3],[.8,.45]]),stroke([[.4,.3],[.4,.45]])]]]){const result=analyse(ink);if(process.env.FRACTION_BASELINE){if(result)failures.push({width,name,want:null,got:result.parts})}else assert.equal(result,null,name+' is not silently converted')}
}
console.log(JSON.stringify({controller:sourcePath,passed,failed:failures.length,examples:failures.slice(0,16)},null,2));
if(!process.env.FRACTION_BASELINE)assert.equal(failures.length,0,'All rough drawing fixtures must retain the correct part count');
