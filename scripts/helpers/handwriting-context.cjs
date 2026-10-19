/* Load the actual offline models with an isolated browser storage record. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
module.exports=function createContext(memory=new Map()){
 const context={atob,Float32Array,Int8Array,Uint8Array,Uint8ClampedArray,Math,setTimeout,clearTimeout,performance,
  localStorage:{getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value))},
  document:{readyState:'loading',addEventListener(){}}};
 context.window=context;context.self=context;vm.createContext(context);
 for(const file of [
  'whiteboard-handwriting-digit-model-beta.js','whiteboard-handwriting-character-models-beta.js',
  'whiteboard-handwriting-character-inference-beta.js','whiteboard-handwriting-character-reader-beta.js',
  'whiteboard-handwriting-learning-beta.js','vendor/handwriting/uji/reader-weights-beta.js',
  'vendor/handwriting/uji/reader-beta.js','whiteboard-primary-grammar-beta.js',
  'whiteboard-equal-sign-geometry-beta.js','whiteboard-trained-9gq-equals-beta.js',
  'whiteboard-trained-j-beta.js','whiteboard-trained-remaining-beta.js',
  'whiteboard-teacher-units-beta.js','whiteboard-teacher-confusables-beta.js',
  'whiteboard-unit-exponent-trained-beta.js','whiteboard-handwriting-recognition-beta.js'
 ])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
 return context;
};
