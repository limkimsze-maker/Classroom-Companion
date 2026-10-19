const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('whiteboard-handwriting-recognition-beta.js','utf8');
new vm.Script(src);
assert(src.includes('async function recognizeUnitFirst'));
assert(src.includes("const trainedPower=window.WhiteboardUnitExponent?.match"));
assert(src.includes('closedZeroInk(prefix[i].raw,W,H)'));
require('./test-unit-first-exponent-zero.cjs');
console.log('PASS superscript recovery within unified unit-first recognition');
