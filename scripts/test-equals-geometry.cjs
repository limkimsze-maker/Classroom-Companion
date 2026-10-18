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

/* Synthetic reproduction of the geometry found in an actual selected-ink
   diagnostic: upper bar drawn once; lower bar drawn LEFT then RETRACED RIGHT.
   The original bar's endpoint displacement is only 2px over a 12px width,
   so the old straightness check wrongly rejected it. Coordinates below are
   generated rather than copying any private user ink into the repository. */
const upper = S([[.610,.38],[.608,.376],[.613,.374],[.623,.372],
                  [.638,.371],[.648,.370]],5);
const lower = S([[.628,.397],[.621,.398],[.613,.400],[.608,.407],
                  [.604,.411],[.612,.405],[.619,.402],[.628,.398],[.635,.398]],5);
const genuine=[...glyph,upper,lower,...rhs];
const actualLike=pair(genuine,372,404.244);
assert.equal(actualLike.length,1,'detect retraced lower equals bar in complete expression');
assert.deepEqual(Array.from(actualLike[0].indices),[2,3]);
const lone=[upper,lower];
assert.equal(detect(lone,372,404.244),null,
  'standalone strict equals detection remains conservative');
const scribble=S([[.608,.39],[.614,.4],[.62,.39],[.614,.38],[.608,.39]],5);
assert.equal(pair([...glyph,upper,scribble,...rhs],372,404.244).length,0,
  'compact scribble should not be accepted as retraced equals');
console.log('PASS: diagnostic-derived retraced equals stroke and scribble negative control');

/* Extreme scale categories revealed by 34 locally analysed signs.
   Not a copy of the user's pen strokes. */
const micro=[line(.43,.42,.441,.42,5),line(.431,.457,.448,.459,5)];
assert.equal(pair([...glyph,...micro,...rhs],356.4,395.7).length,1,'micro equals size class');
const large=[line(.3,.32,.49,.32,5),line(.31,.46,.52,.46,5)];
assert.equal(pair([...glyph,...large,...rhs],356.4,395.7).length,1,'large spaced equals size class');
const colonWide=[line(.4,.42,.405,.42,6),line(.401,.465,.406,.465,6)];
assert.equal(pair([...glyph,...colonWide,...rhs],800,400).length,0,'dots stay dots, not equals');
console.log('PASS: small and large labelled size classes, colon negative');

/* Regression: captured failed equation contained a 6.18px upper bar and a
   19.75px lower bar, a width ratio 3.195. These GENERATED strokes only
   reproduce that geometry, not the user's raw handwriting coordinates. */
const unevenTop=line(.603,.324,.61961,.325,5);
const unevenBottom=line(.597,.356,.6501,.355,5);
const realShape=pair([...glyph,unevenTop,unevenBottom,...rhs],372,404.244);
assert.equal(realShape.length,1,'uneven 6px / 20px = pair detected in expression');
assert.deepEqual(Array.from(realShape[0].indices),[2,3]);
const fourToOne=[
 line(.6,.324,.614,.324,5),
 line(.594,.356,.652,.356,5)
];
assert.equal(pair([...glyph,...fourToOne,...rhs],372,404.244).length,0,
  'ratio well above supported range should not be promoted to equals');
console.log('PASS: diagnostic-measured unequal equals bars and out-of-range negative');

/* New standalone two-stroke class based on phone diagnostic measurements.
   Generated stand-ins only; raw selected handwriting never committed. */
const phoneW=372,phoneH=404.244;
const phoneExamples=[
 [line(.42,.43,.448,.421,5),line(.43,.466,.457,.457,5)], // 10px, 10px
 [line(.45,.46,.479,.459,5),line(.44,.514,.467,.510,5)], // 10px, 10px; offset
 [line(.45,.452,.484,.451,5),line(.44,.506,.477,.508,5)] // 13px, 14px
];
for(let i=0;i<phoneExamples.length;i++)
 assert.equal(detect(phoneExamples[i],phoneW,phoneH)?.text,'=','tiny standalone equal '+i);
const tinyDots=[line(.452,.491,.461,.494,5),line(.462,.539,.481,.525,5)];
assert.equal(detect(tinyDots,phoneW,phoneH),null,'very tiny uneven dotted marks remain uncertain');
assert.equal(detect([line(.41,.42,.44,.42,5)],phoneW,phoneH),null,'minus is not equals');
assert.equal(detect([line(.41,.42,.44,.42,5),line(.425,.4,.425,.45,5)],phoneW,phoneH),null,'plus is not equals');
console.log('PASS: small standalone equals controls and non-equals negatives');
