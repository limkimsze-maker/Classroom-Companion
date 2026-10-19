const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('whiteboard-handwriting-recognition-beta.js','utf8');
new vm.Script(src,{filename:'whiteboard-handwriting-recognition-beta.js'});
// A full-reader result is already 10 m²; test that the final reconciliation
// preserves the number/unit but changes a visibly three-shaped exponent.
const ctx={window:{},Math,Float32Array,Int8Array};vm.createContext(ctx);
const testSrc=src.replace('const result=await recognizeCore(strokes,W,H,options);', "const result={text:'10 m²',engine:'existing-unit-decoder'};");
vm.runInContext(testSrc,ctx);
const mk=p=>({points:p.map(([x,y])=>({x,y}))});
const base=[mk([[.2,.4],[.2,.7]]),mk([[.3,.4],[.31,.6],[.32,.7],[.33,.5],[.31,.4]]),mk([[.4,.54],[.4,.7],[.43,.5],[.46,.7]])];
const three=mk([[.504,.3465],[.508,.34],[.512,.34],[.517,.342],[.520,.346],[.521,.35],[.522,.355],[.520,.36],[.513,.366],[.510,.368],[.513,.37],[.516,.375],[.519,.382],[.518,.391],[.513,.392],[.508,.392],[.502,.389]]);
const two=mk([[.51,.35],[.515,.34],[.523,.34],[.529,.35],[.53,.36],[.522,.37],[.51,.39],[.50,.40],[.53,.40]]);
(async()=>{
 const right=await ctx.window.WhiteboardHandwritingMath.recognize([...base,three],1402,522,{mode:'auto'});
 assert.equal(right.text,'10 m³');
 const unchanged=await ctx.window.WhiteboardHandwritingMath.recognize([...base,two],1402,522,{mode:'auto'});
 assert.equal(unchanged.text,'10 m²');
 console.log('PASS final raised-three reconciliation and two discrimination');
})().catch(e=>{console.error(e);process.exitCode=1});
