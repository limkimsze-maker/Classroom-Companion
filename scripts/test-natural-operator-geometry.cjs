/* Generated pen geometry with public UJI V1 digits; no private teacher ink. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx=require('./helpers/handwriting-context.cjs')(),W=1800,H=600;
vm.runInContext(fs.readFileSync('scripts/handwriting-uji-real-ink-fixtures.js','utf8'),ctx);
const {assemble,canonical}=require('./benchmark-handwriting-simulations.cjs'),reader=ctx.WhiteboardHandwritingMath;
const S=points=>({size:3,points:points.map(([x,y])=>({x:x/W,y:y/H}))});
const variants={
 '−':[[[0,1],[2,0],[9,0],[23,1],[38,2],[36,1],[32,1]]],
 '+':[[[0,5],[8,3],[18,1],[30,-3],[38,-6],[35,-5]],[[19,-27],[18,-7],[18,15],[18,31]]],
 '÷':[[[0,1],[2,0],[9,0],[23,1],[38,2],[36,1],[32,1]],[[19,-23],[19.2,-22.8]],[[19,23],[19.2,23.2]]],
 '×':[[[0,-22],[9,-6],[18,11],[28,23],[26,21]],[[1,23],[12,7],[21,-10],[28,-23]]]
};
function changeOperator(text,op,{tap=false}={}){
 const ink=assemble(ctx.WhiteboardUJIInkFixtures.samples[1],text,0),tokens=reader.segment(ink,W,H),target=tokens.find(t=>t.char===op);assert(target);
 const x=Math.min(...target.parts.flatMap(p=>p.points.map(q=>q.x))),y=224;
 const original=new Set(target.parts.map(p=>p.source));
 const signs=variants[op].map(points=>S(points.map(([a,b])=>[x+a,y+b])));
 if(tap)signs.push(S([[x+13,y],[x+13.2,y+.1]]));
 return[...ink.filter(s=>!original.has(s)),...signs];
}
const signs=tokens=>Array.from(tokens).filter(t=>['+','−','×','÷','='].includes(t.char)).map(t=>t.char);
const transform=(ink,sx,sy,dx,dy)=>ink.map(s=>({...s,points:s.points.map(p=>({x:p.x*sx+dx,y:p.y*sy+dy}))}));
(async()=>{
 for(const [text,op]of [['24+38=62','+'],['83−47=36','−'],['16×4=64','×'],['8÷2=4','÷']]){
  const ink=changeOperator(text,op,{tap:op==='×'});
  for(const [sx,sy,dx,dy]of [[1,1,0,0],[.7,.7,.05,.02],[1.1,.9,.02,.03]]){
   for(const candidate of [transform(ink,sx,sy,dx,dy),transform(ink,sx,sy,dx,dy).reverse()]){
    const tokens=reader.segment(candidate,W,H);
    assert.deepEqual(signs(tokens),[op,'='],`operator grouping ${text}`);
    assert.equal(tokens.flatMap(t=>t.parts).length,candidate.length,'all pen strokes, including a tap, are retained');
    if(op==='×')assert.equal(tokens.find(t=>t.char==='×').parts.length,3,'a tap on a crossed diagonal stays with the multiplication sign');
    assert.equal(canonical((await reader.recognize(candidate,W,H,{mode:'auto'})).text),text,`full reading ${text}`);
   }
  }
 }
 for(const [text,op]of [['6−2=5','−'],['9+7=15','+'],['8+6=14m²','+']]){
  const r=await reader.recognize(changeOperator(text,op),W,H,{mode:'auto'});
  assert.equal(canonical(r.text),text,'different values, written false arithmetic and unit suffixes retain their ink');
 }
 // A dot beside a multiplication sign remains a separate decimal/dot token.
 const multiply=changeOperator('16×4=64','×'),cross=reader.segment(multiply,W,H).find(t=>t.char==='×'),b=cross.parts.flatMap(p=>p.points),right=Math.max(...b.map(p=>p.x)),bottom=Math.max(...b.map(p=>p.y));
 const beside=S([[right+7,bottom+3],[right+7.1,bottom+3.1]]);
 const dotted=reader.segment([...multiply,beside],W,H);
 assert(dotted.some(t=>t.parts.length===1&&t.parts[0].source===beside),'separate dots are not consumed');
 // A curved isolated t has no independently supported numeric neighbours.
 const tee=variants['+'].map(points=>S(points.map(([x,y])=>[200+x,224+y])));
 assert(!signs(reader.segment(tee,W,H)).includes('+'),'new relaxed rules abstain on an isolated letter shape');
 const curved=changeOperator('24+38=62','+');
 assert(!signs(reader.segment(curved,W,H,'uppercase')).includes('+'),'explicit letter segmentation does not enable the new relaxed operator rules');
 assert(!(await reader.recognize(curved,W,H,{mode:'uppercase'})).text.includes('+'),'explicit letter reading keeps the curved letter-shaped crossing');
 for(const text of ['7','4','61','41','11','71','8÷2=4']){
  const r=await reader.recognize(assemble(ctx.WhiteboardUJIInkFixtures.samples[8],text,0),W,H,{mode:'auto'});
  assert.equal(canonical(r.text),text,'digit strokes and division are preserved');
 }
 console.log('PASS natural operator geometry: curved +/−/×, tap retained with crossing, original stroke coverage, scale/placement/order, different false equations, powered units, separate dots, explicit letter mode and digit/division controls');
})().catch(e=>{console.error(e);process.exitCode=1});
