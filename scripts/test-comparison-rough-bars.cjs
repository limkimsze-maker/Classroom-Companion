'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('smart-math-bars-v2.js','utf8');
function extract(start,end){const a=source.indexOf('function '+start+'('),b=source.indexOf('function '+end+'(',a);assert(a>=0&&b>a,'Missing engine functions');return source.slice(a,b)}
const implementation=source.slice(source.indexOf('function rawInk('),source.indexOf('function notify('))+
 extract('comparisonCandidateGroup','finishBar');
const context={cssW:900,cssH:1400,strokes:[],startIndex:0};
vm.createContext(context);vm.runInContext(implementation,context);
function bar(x,y,w,h,rough=false){const pts=rough?[[x,y+2],[x+w*.3,y],[x+w,y+2],[x+w+2,y+h],[x+w*.5,y+h+2],[x,y+h],[x,y+2]]:[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];return {points:pts.map(([a,b])=>({x:a/900,y:b/1400}))}}
function select(items,start){context.strokes=items;context.startIndex=start;return Array.from(vm.runInContext('comparisonCandidateGroup()',context))}
const upper=bar(150,350,410,85,true),lower=bar(150,470,220,76,true),dot={points:[{x:700/900,y:620/1400}]};
assert.deepEqual(select([upper,lower,dot],0),[upper,lower],'rough bars plus stray dot');
assert.deepEqual(select([upper,lower,dot],3),[upper,lower],'bars drawn before selecting Comparison');
assert.deepEqual(select([upper,lower,dot],0),[upper,lower],'bars drawn after selecting Comparison');
const distant=bar(720,750,150,70);
assert.deepEqual(select([upper,lower,distant,dot],0),[upper,lower],'unrelated distant bar ignored');
const equal=bar(150,470,410,76,true);
assert.deepEqual(select([upper,equal,dot],0),[upper,equal],'equal-length comparison accepted');
const upperShort=bar(150,350,220,85,true),lowerLong=bar(150,470,410,76,true);
assert.deepEqual(select([upperShort,lowerLong,dot],0),[upperShort,lowerLong],'longer bottom bar accepted');
assert.equal(select([upper,dot],0).length,2,'existing single-bar fallback remains available');
console.log('PASS: 6 rough comparison candidate-selection regression checks');
