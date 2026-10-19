const fs=require('fs'),vm=require('vm'),assert=require('assert');
for(const file of ['whiteboard-handwriting-recognition-beta.js','whiteboard-handwriting-beautify-inkon-beta.js'])new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});
const reader=fs.readFileSync('whiteboard-handwriting-recognition-beta.js','utf8');
const ui=fs.readFileSync('whiteboard-handwriting-beautify-inkon-beta.js','utf8');
assert(reader.includes("WhiteboardHandwritingMath.build='20261019-engine-trace4'"));
assert(ui.includes('recognitionEngine:recognition?.engine'));
assert(ui.includes('readerBuild:window.WhiteboardHandwritingMath?.build'));
assert(ui.includes("result.engine||'unknown'"));
console.log('PASS runtime diagnostics and both script syntax checks');