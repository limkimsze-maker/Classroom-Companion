const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('whiteboard-handwriting-recognition-beta.js','utf8');
new vm.Script(src,{filename:'whiteboard-handwriting-recognition-beta.js'});
const raised=src.indexOf('const raisedMeasurement=await detectRaisedMeasuredQuantity(strokes,W,H,options)');
const unit=src.indexOf('const result=primary?await primary.recognize(strokes,W,H,options):null');
assert(raised>=0&&unit>raised,'raised measurement must run before unit decoder');
assert(src.includes("local-raised-measurement"));
console.log('PASS reader syntax and raised unit priority');
