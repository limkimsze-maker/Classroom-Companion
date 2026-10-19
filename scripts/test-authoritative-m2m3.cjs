const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('whiteboard-handwriting-recognition-beta.js','utf8');
new vm.Script(src);
function invoke(ranking){
 const window={WhiteboardTeacherUnits:{rank:()=>ranking}};
 const context={window,Math,Float32Array,Int8Array};
 vm.createContext(context);
 vm.runInContext(src.replace(/\}\)\(\);\s*$/,'window.__resolve=resolveTrainedSquareCube;})();'),context);
 const s=points=>({points:points.map(([x,y])=>({x,y}))});
 const strokes=[s([[.1,.4],[.1,.75]]),s([[.25,.4],[.28,.65]]),s([[.45,.5],[.45,.8],[.48,.5],[.52,.8]]),s([[.55,.24],[.60,.2],[.63,.25],[.61,.3],[.57,.31],[.62,.34],[.61,.39],[.55,.4]])];
 return window.__resolve(strokes,500,500,{text:'10 m²',engine:'legacy',uncertain:[]});
}
assert.equal(invoke([{label:'m³',score:.97},{label:'m²',score:.80}]).text,'10 m³');
assert.equal(invoke([{label:'m²',score:.97},{label:'m³',score:.80}]).text,'10 m²');
assert.equal(invoke([{label:'m²',score:.85},{label:'m³',score:.84}]).text,'10 m?');
assert.equal(invoke([{label:'m²',score:.85},{label:'m³',score:.84}]).engine,'teacher-m2-m3-uncertain');
console.log('PASS authoritative m²/m³ choice and no forced fallback on tie');