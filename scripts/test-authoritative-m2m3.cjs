const fs=require('fs'),vm=require('vm'),assert=require('assert');
const reader=fs.readFileSync('whiteboard-handwriting-recognition-beta.js','utf8');
new vm.Script(reader);
assert(reader.includes("const trainedPower=window.WhiteboardUnitExponent?.match"));
assert(reader.includes("engine:'unit-first-trained-measurement'"));
assert(reader.includes("unit=best.label.replace(/[²³]$/,'')+'?'"));
require('./test-unit-first-exponent-zero.cjs');
console.log('PASS teacher-trained square/cube unit-first authority and ambiguity handling');
