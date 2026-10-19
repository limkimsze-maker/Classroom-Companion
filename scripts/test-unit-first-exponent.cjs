const fs=require('fs'),vm=require('vm'),assert=require('assert');
const r=fs.readFileSync('whiteboard-handwriting-recognition-beta.js','utf8'),h=fs.readFileSync('whiteboard-comer-beta.html','utf8');
new vm.Script(r,{filename:'reader'});
assert(r.includes("teacher-unit-first-exponent"));
assert(r.includes("only:['²','³']"));
assert(r.includes("baseline.text+best.label"));
assert(r.includes(String.raw`/^\d+ (?:cm|mm|km|m)$/`));
assert(h.includes('whiteboard-handwriting-recognition-beta.js?v=20261019-unitfirst1'));
console.log('PASS exponent-priority wiring and reader syntax');
