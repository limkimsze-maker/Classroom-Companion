/* Actual-model checks for unit suffixes on complete arithmetic expressions.
 * Optional argv[2]: a local diagnostic export; teacher traces stay unbundled. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const ctx=require('./helpers/handwriting-context.cjs')(),reader=ctx.WhiteboardHandwritingMath;
const W=1000,H=600,S=xy=>({size:4,points:xy.map(([x,y])=>({x:x/W,y:y/H}))});
const one=x=>S([[x,187],[x+1,260]]);
const zero=x=>S(Array.from({length:41},(_,i)=>{const t=i*Math.PI/20;return[x+17*Math.cos(t),223+34*Math.sin(t)]}));
const two=x=>S([[x,198],[x+16,190],[x+30,198],[x+31,210],[x+16,230],[x,250],[x+31,250]]);
const c=x=>S([[x+21,215],[x+18,209],[x+8,208],[x,214],[x,230],[x+7,240],[x+20,241],[x+25,238]]);
const m=x=>S([[x,240],[x+1,210],[x+10,208],[x+18,236],[x+24,210],[x+32,210],[x+39,240]]);
const power=x=>S([[x,182],[x+8,178],[x+15,183],[x+16,189],[x+8,197],[x,205],[x+16,205]]);
const operator=(kind,x)=>({
 '−':[S([[x,223],[x+34,223]])],
 '+':[S([[x,223],[x+34,223]]),S([[x+17,204],[x+17,242]])],
 '×':[S([[x,204],[x+34,242]]),S([[x,242],[x+34,204]])],
 '÷':[S([[x,223],[x+34,223]]),S([[x+17,204],[x+18,205]]),S([[x+17,242],[x+18,243]])],
 '=':[S([[x,218],[x+34,218]]),S([[x,230],[x+34,230]])]
}[kind]);
async function expect(ink,expected,width=W,height=H,certain=true){
 const result=await reader.recognize(ink,width,height,{mode:'auto'});
 assert.equal(result.text,expected,JSON.stringify({expected,actual:result.text,engine:result.engine}));
 if(certain)assert.equal(result.uncertain.length,0);
 return result;
}
(async()=>{
 // Deliberately false arithmetic: recognition must preserve ink, not solve it.
 for(const op of ['−','+','×','÷']){
  const ink=[one(32),zero(76),...operator(op,125),two(190),...operator('=',250),one(315),c(350),m(390),power(440)];
  const result=await expect(ink,`10 ${op} 2 = 1 cm²`);
  assert.equal(result.tokens.map(t=>t.char).join(''),`10${op}2=1cm²`);
 }
 await expect([one(32),c(75),m(115),power(165)],'1 cm²');
 await expect([one(32),m(115),power(165)],'1 m²');
 const plain=[one(32),zero(76),...operator('−',125),two(190),...operator('=',250),one(315)];
 await expect(plain,'10 − 2 = 1');
 if(process.argv[2]){
  const sample=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  const width=sample.selection.width,height=sample.selection.height;
  await expect(sample.strokes,'6 − 2 = 4 cm²',width,height);
  // Same labelled ink with changed placement, scale, anisotropy and pen order.
  for(const [sx,sy,dx,dy]of [[.8,.8,.05,.06],[1.1,.9,-.04,.05],[.95,1.08,.03,-.02]]){
   const ink=sample.strokes.map(s=>({...s,points:s.points.map(p=>({x:p.x*sx+dx,y:p.y*sy+dy}))}));
   const result=await expect(ink,'6 − 2 = 4 cm²',width,height,sx!==1.1);
   // The independent pen reader may corroborate the stretched numeral. Any
   // remaining weak predictions must still refer to the original equation.
   assert(result.uncertain.every(t=>'6−2=4cm²'.includes(t.char)));
  }
  await expect(sample.strokes.slice().reverse(),'6 − 2 = 4 cm²',width,height);
 }
 console.log('PASS actual CNNs: arithmetic/unit composition, all four operations, complete cm², unchanged false equations, optional exact diagnostic replay');
})().catch(error=>{console.error(error);process.exitCode=1});
