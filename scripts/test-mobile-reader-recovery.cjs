const fs=require('fs'),vm=require('vm'),assert=require('assert');
for(const file of ['whiteboard-handwriting-recognition-beta.js','whiteboard-handwriting-beautify-inkon-beta.js','whiteboard-trained-remaining-beta.js'])
 new vm.Script(fs.readFileSync(file,'utf8'),{filename:file});
const source=fs.readFileSync('whiteboard-handwriting-beautify-inkon-beta.js','utf8');
assert(source.includes('await ensureReader(controller.signal)'));
assert(source.includes("script.onerror=()=>finish"));
console.log('PASS mobile reader recovery scripts parse');
