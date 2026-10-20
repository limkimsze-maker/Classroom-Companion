/* Frozen real UJI V1 pen strokes plus generated operator controls.
 * No fixtures are imported into training or personal correction storage. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=require('./helpers/handwriting-context.cjs')();
const {assemble,canonical}=require('./benchmark-handwriting-simulations.cjs');
vm.runInContext(fs.readFileSync('scripts/handwriting-uji-real-ink-fixtures.js','utf8'),ctx);
const reader=ctx.WhiteboardHandwritingMath,W=1800,H=600;
const sample=ctx.WhiteboardUJIInkFixtures.samples[8];
const transform=(ink,sx,sy,dx,dy)=>ink.map(s=>({...s,points:s.points.map(p=>({x:p.x*sx+dx,y:p.y*sy+dy}))}));
const signs=tokens=>Array.from(tokens).filter(t=>['−','+','×','÷','='].includes(t.char)).map(t=>t.char);
(async()=>{
 for(const rep of [0,1]){
  for(const text of ['7','97','507','972','9+7=16']){
   const ink=assemble(sample,text,rep);
   const result=await reader.recognize(ink,W,H,{mode:'auto'});
   assert.equal(canonical(result.text),text,`complete reading: ${text}, repetition ${rep}`);
  }
  const seven=assemble(sample,'7',rep);
  for(const [sx,sy,dx,dy] of [[1,1,0,0],[.65,.65,.1,.1],[1.3,1.3,.02,-.05],[1.08,.94,.03,.01]]){
   for(const ink of [transform(seven,sx,sy,dx,dy),transform(seven,sx,sy,dx,dy).reverse()]){
    const tokens=reader.segment(ink,W,H);
    assert.equal(tokens.length,1,'crossbar remains with the digit after movement, scaling and pen-order reversal');
    assert.equal(tokens[0].char,'7');assert.equal(tokens[0].parts.length,2,'both strokes are retained');
   }
  }
  for(const [text,expected] of [['7−2',['−']],['−7',['−']],['7+2',['+']],
      ['7×2',['×']],['7÷2',['÷']],['7=7',['=']]]){
   const ink=assemble(sample,text,rep),tokens=reader.segment(ink,W,H);
   assert.deepEqual(signs(tokens),expected,`genuine operators retained: ${text}`);
   assert.equal(tokens.filter(t=>t.char==='7').length,text==='7=7'?2:1);
  }
  // A bar inside the 7's bounding rectangle but left of its descending ink
  // is separate; bounding-box overlap alone is insufficient to erase a sign.
  const body=seven[0],xs=body.points.map(p=>p.x),ys=body.points.map(p=>p.y);
  const x=Math.min(...xs),y=Math.min(...ys),h=Math.max(...ys)-y;
  const nearby={size:3,points:[{x:x-.48*h*H/W,y:y+.62*h},{x:x+.35*h*H/W,y:y+.62*h}]};
  assert.deepEqual(signs(reader.segment([body,nearby],W,H)),['−'],'a disjoint nearby minus stays separate');
  const pen=ctx.WhiteboardUjiReader;
  ctx.WhiteboardUjiReader={read:()=>[{label:'T',p:.9999},{label:'7',p:.0001}]};
  assert.deepEqual(signs(reader.segment(seven,W,H)),['−'],'model disagreement prevents the width exception');
  ctx.WhiteboardUjiReader=pen;
 }
 console.log('PASS crossed 7s, full-number/equation readings, scale/placement/pen order, genuine operators, disjoint bars and model disagreement');
})().catch(error=>{console.error(error);process.exitCode=1});
