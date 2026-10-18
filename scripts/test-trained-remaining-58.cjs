const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{},Float32Array,Math,Number,Array,Object};
vm.runInNewContext(fs.readFileSync('whiteboard-trained-remaining-beta.js','utf8'),context);
const model=context.window.WhiteboardTrainedRemaining;
assert.equal(model.info().classes,58);
assert.equal(model.info().sourceSamples,1240);
assert.equal(model.match([],330,295,'auto'),null);
assert.equal(model.match([{points:[{x:0,y:0}]}],330,295,'auto'),null);
console.log('PASS: 58-class supervised model loads, conservative abstention works');