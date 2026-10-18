const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('whiteboard-inkon-native-beautify-bridge.js','utf8');
async function test(demoFn,expected,mode='auto'){
 let fallbackCalls=0;
 const original={recognize:async()=>{fallbackCalls++;return {text:'legacy',engine:'legacy',uncertain:[]}},rasterDigit:()=>{}};
 const math={recognize:async()=>{fallbackCalls++;return {text:'math-legacy',engine:'legacy-math',uncertain:[]}}};
 const window={WhiteboardHandwritingMath:original,WhiteboardInkOnOriginalDemo:{recognize:demoFn},WhiteboardMathReader:math};
 const document={getElementById:()=>null};
 vm.runInNewContext(source,{window,document});
 const result=await window.WhiteboardHandwritingMath.recognize([],700,250,{mode});
 assert.equal(result.text,expected.text);assert.equal(fallbackCalls,expected.fallback);
}
(async()=>{
 await test(async()=>({text:'=',engine:'inkon-original-demo'}),{text:'=',fallback:0});
 await test(async()=>({text:'  ',engine:'inkon-original-demo'}),{text:'legacy',fallback:1});
 await test(async()=>{throw Error('no reading')},{text:'legacy',fallback:1});
 await test(async()=>{throw Error('no reading')},{text:'math-legacy',fallback:1},'math');
 await test(async()=>({text:'x + 2'}),{text:'x + 2',fallback:0},'lowercase');
 console.log('PASS: ink-on always first, equal sign preserved, fallback only on missing result, across modes');
})().catch(e=>{console.error(e);process.exit(1)});
