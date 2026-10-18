const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const reader=fs.readFileSync('whiteboard-handwriting-recognition-beta.js','utf8');
const model=fs.readFileSync('whiteboard-trained-remaining-beta.js','utf8');
new vm.Script(reader,{filename:'whiteboard-handwriting-recognition-beta.js'});
new vm.Script(model,{filename:'whiteboard-trained-remaining-beta.js'});
assert(reader.includes('WhiteboardTrainedRemaining.match'));
assert(reader.includes('window.WhiteboardHandwritingMath={recognize,predictDigit,rasterDigit,segment}'));
console.log('PASS reader parses, retains exported recognition entrypoint and trained character integration');
