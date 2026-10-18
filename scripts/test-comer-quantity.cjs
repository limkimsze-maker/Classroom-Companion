/* Pure unit grammar regression checks. No hand-drawn answer is hardcoded. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('whiteboard-comer-quantity-beta.js','utf8');
const context={window:{}};
vm.runInNewContext(source,context,{filename:'whiteboard-comer-quantity-beta.js'});
const gram=context.window.WhiteboardCoMERQuantity;
const pairs=[
  ['45','cm^{2}','45 cm²'],
  ['45','cm2','45 cm²'],
  ['120','mm^2','120 mm²'],
  ['8','m^{3}','8 m³'],
  ['97','kg','97 kg'],
  ['4.5','km','4.5 km'],
  ['60','mL','60 mL'],
  ['30','°C','30 °C'],
  ['-0.5','m','-0.5 m'],
  ['1','L','1 L'],
];
for (const [number,unit,expected] of pairs) {
  assert.equal(gram.combine(number,unit)?.text,expected,number+' '+unit);
  assert.equal(gram.whole(number+' '+unit)?.text,expected,'full '+number+' '+unit);
}
assert.equal(gram.whole('45\\,\\mathrm{cm}^{2}')?.text,'45 cm²');
assert.equal(gram.whole('45cm²')?.text,'45 cm²');
assert.equal(gram.combine('2+3','cm2'),null);
assert.equal(gram.combine('45','garbage'),null);
assert.equal(gram.combine('45','kg3'),null);
assert.equal(gram.combine('4a','cm2'),null);
assert.equal(gram.whole('2+3'),null);
assert.equal(gram.whole('x^2+3'),null);
assert.equal(gram.whole('120cm^5'),null);
const stroke=(pts)=>({points:pts.map(([x,y])=>({x,y})),size:3});
const handwriting=[
  stroke([[.1,.1],[.11,.3]]),
  stroke([[.14,.1],[.145,.3]]),
  stroke([[.26,.2],[.3,.28]]),
  stroke([[.32,.2],[.4,.27]]),
  stroke([[.42,.07],[.45,.1]])
];
const splits=gram.splitCandidates(handwriting);
assert.ok(splits.length>0,'find meaningful number/unit break');
assert.ok(splits.every(s=>s.prefix.length&&s.suffix.length));
console.log('PASS: independent number + unit + exponent grammar, LaTeX, negative cases and candidate splitting');
