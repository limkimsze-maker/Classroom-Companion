const fs=require('fs'),vm=require('vm'),assert=require('assert');
for(const file of ['whiteboard-handwriting-recognition-beta.js','whiteboard-handwriting-beautify-inkon-beta.js'])new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});
const reader=fs.readFileSync('whiteboard-handwriting-recognition-beta.js','utf8');
const ui=fs.readFileSync('whiteboard-handwriting-beautify-inkon-beta.js','utf8');
const build=reader.match(/WhiteboardHandwritingMath\.build='([^']+)'/)[1];
for(const [page,controller]of [['whiteboard-smart-beta.html','whiteboard-handwriting-beautify-beta.js'],['whiteboard-comer-beta.html','whiteboard-handwriting-beautify-inkon-beta.js']]){
 const html=fs.readFileSync(page,'utf8'),source=fs.readFileSync(controller,'utf8');
 assert.equal(source.match(/const readerBuild='([^']+)'/)[1],build,'loader must accept the current reader');
 assert(html.includes('whiteboard-handwriting-recognition-beta.js?v='+build));
 assert(html.includes(controller+'?v='+build),'cached controllers must refresh with the reader');
}
assert(ui.includes('recognitionEngine:recognition?.engine'));
assert(ui.includes('readerBuild:window.WhiteboardHandwritingMath?.build'));
assert(ui.includes("result.engine||'unknown'"));
console.log('PASS runtime diagnostics and both script syntax checks');
