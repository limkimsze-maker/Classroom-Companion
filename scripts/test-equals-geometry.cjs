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
 [line(.2,.35,.38,.35),line(.2,.65,.38,.65)], // too far for an equals sign
];
for(let i=0;i<bad.length;i++)assert.equal(detect(bad[i],800,400),null,'negative '+i);
console.log('PASS: equals sign recognized in five pen variants and rejected in nine negative controls');


const pair=ctx.window.WhiteboardEqualSign.embeddedPairs;
const glyph=[line(.08,.3,.12,.5),line(.20,.3,.26,.5)];
const equal=[line(.39,.39,.44,.39),line(.39,.43,.44,.43)];
const rhs=[line(.68,.3,.74,.48)];
const expression=[...glyph,...equal,...rhs];
const extracted=pair(expression,800,400);
assert.equal(extracted.length,1,'full expression contains one equals pair');
assert.deepEqual(Array.from(extracted[0].indices),[2,3],'match two equals pen strokes');
assert.equal(pair([...glyph,...rhs],800,400).length,0,'unrelated symbol strokes do not create equals');
console.log('PASS: embedded equals pair extracted from multi-character expression');


const shortEquals=[
 line(.41,.43,.431,.422,6),
 line(.414,.476,.435,.465,6)
];
const equationA=[
 line(.07,.25,.12,.58),line(.18,.3,.24,.48),
 line(.3,.28,.37,.56),...shortEquals,
 line(.56,.29,.61,.58)
];
const a=pair(equationA,800,400);
assert.equal(a.length,1,'4 + 5 = 9 with tiny slanted equals lines');
assert.deepEqual(Array.from(a[0].indices),[3,4]);
const equationB=[
 line(.07,.25,.12,.58),line(.18,.27,.24,.54),
 line(.30,.28,.37,.56),
 line(.41,.43,.431,.422,6),line(.414,.476,.435,.465,6),
 line(.56,.29,.61,.58)
];
assert.equal(pair(equationB,800,400).length,1,'9 x 9 = 81 short dashes');
const colon=[
 line(.41,.43,.415,.43,6),line(.41,.476,.415,.476,6)
];
assert.equal(pair([...glyph,...colon,...rhs],800,400).length,0,'colon dots must not turn to equals');
console.log('PASS: small slightly slanted mobile equals signs within equations');

const smallFar=[
 line(.40,.42,.424,.427,5),
 line(.408,.50,.429,.508,5)
];
const separated=pair([...glyph,...smallFar,...rhs],800,400);
assert.equal(separated.length,1,'short uneven equals bars, widely separated vertically');
assert.deepEqual(Array.from(separated[0].indices),[2,3]);
const distant=[line(.40,.42,.424,.427,5),line(.408,.66,.429,.668,5)];
assert.equal(pair([...glyph,...distant,...rhs],800,400).length,0,'unrelated far-apart strokes stay separate');
console.log('PASS: short vertically separated equals strokes from photographed handwriting');
