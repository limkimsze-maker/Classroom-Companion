const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('whiteboard-inkon-native-beautify-bridge.js','utf8');
(async()=>{
 let demoCalls=0,originalCalls=0,demoCancels=0,mathCancels=0;
 const demo={recognize:async()=>{demoCalls++;return{text:'x + 2',engine:'inkon-original-demo'}},cancel:()=>demoCancels++};
 const window={WhiteboardInkOnOriginalDemo:demo,WhiteboardHandwritingMath:{build:'test',recognize:async(s,W,H,o)=>{
  originalCalls++;return o.mathRecognizer?o.mathRecognizer(s,W,H,o):{text:'local Auto'};
 }},WhiteboardMathReader:{cancel:()=>mathCancels++}};
 vm.runInNewContext(source,{window,document:{getElementById:()=>null}});
 assert.equal((await window.WhiteboardHandwritingMath.recognize([],700,250,{mode:'auto'})).text,'local Auto');
 assert.equal(demoCalls,0);
 assert.equal((await window.WhiteboardHandwritingMath.recognize([],700,250,{mode:'math'})).text,'x + 2');
 assert.equal(demoCalls,1);assert.equal(originalCalls,2,'Math must pass the shared personal-correction entrypoint');
 window.WhiteboardMathReader.cancel();assert.equal(demoCancels,1);assert.equal(mathCancels,1);
 assert.equal(window.WhiteboardHandwritingMath.build,'test');
 console.log('PASS Auto preserves local reader, Math delegates through shared recognition, and cancellation reaches both readers');
})().catch(error=>{console.error(error);process.exitCode=1});
