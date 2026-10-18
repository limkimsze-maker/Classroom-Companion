const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync('whiteboard-equal-sign-geometry-beta.js','utf8'),ctx);
const detect=ctx.window.WhiteboardEqualSign.detect;
function S(coords,size=4){return{size,points:coords.map(([x,y])=>({x,y}))}}
function line(x0,y0,x1,y1,size=4){return S(Array.from({length:8},(_,i)=>[x0+(x1-x0)*i/7,y0+(y1-y0)*i/7]),size)}
const good=[
 [line(.2,.35,.38,.35),line(.21,.39,.39,.39)],
 [line(.21,.41,.39,.41),line(.2,.35,.38,.35)],
 [line(.2,.35,.38,.36),line(.21,.39,.39,.4)],
 [line(.15,.35,.35,.35),line(.17,.395,.36,.395)],
 [line(.2,.35,.38,.35,8),line(.2,.42,.38,.42,8)]
];
for(let i=0;i<good.length;i++)assert.equal(detect(good[i],800,400)?.text,'=', 'valid equals '+i);
const bad=[
 [line(.2,.35,.38,.35)],
 [line(.2,.35,.38,.35),line(.25,.2,.25,.5)], // +
 [line(.2,.35,.38,.35),line(.2,.8,.38,.8)], // unrelated separated lines
 [line(.2,.35,.38,.35),line(.45,.39,.63,.39)], // non overlapping
 [line(.2,.35,.38,.35),line(.2,.39,.22,.39)], // dot/short stroke
 [line(.2,.35,.38,.35),line(.2,.38,.38,.52)], // slant
 [line(.2,.35,.38,.35),line(.2,.39,.38,.39),line(.2,.43,.38,.43)], // triple lines
 [line(.2,.35,.38,.35),line(.22,.351,.4,.351)], // too close
 [line(.2,.35,.38,.35),line(.2,.46,.38,.46)], // too far for an equals sign
];
for(let i=0;i<bad.length;i++)assert.equal(detect(bad[i],800,400),null,'negative '+i);
console.log('PASS: equals sign recognized in five pen variants and rejected in nine negative controls');
