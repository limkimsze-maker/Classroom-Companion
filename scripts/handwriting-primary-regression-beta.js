/* Self-contained Beta P1-P6 synthetic stroke regression fixtures.
 * Hand-authored strokes + affine variants; NOT a held-out adult pen dataset.
 * Load after WhiteboardHandwritingMath, then run in console:
 *   await WhiteboardPrimaryRegression.run()
 * Keep a separate writer-disjoint REAL-INK benchmark before claiming accuracy.
 */
(function(){
'use strict';
const W=800,H=800;
const s=a=>({size:3,points:a.map(([x,y])=>({x:x/W,y:y/H}))});
const move=(p,dx)=>({...p,points:p.points.map(q=>({...q,x:q.x+dx/W}))});
const nine=s([[30,195],[23,202],[18,210],[19,222],[29,232],[42,221],[49,205],[45,192],[33,194],[48,214],[48,242],[44,262],[37,274]]);
const seven=s([[64,199],[95,197],[87,214],[79,235],[70,263],[67,271]]);
const two=s([[112,199],[131,193],[146,206],[148,218],[130,237],[112,261],[147,261]]);
const k=s([[120,191],[120,221],[119,242],[119,263],[122,241],[140,224],[120,241],[137,259]]);
const kStem=s([[120,191],[120,221],[119,242],[119,263]]);
const kBranches=s([[122,241],[140,224],[120,241],[137,259]]);
const g=s([[179,239],[167,232],[157,241],[158,254],[171,263],[182,249],[183,235],[182,267],[178,293],[161,300],[151,299],[169,301],[183,289]]);
const gHead=s([[179,239],[167,232],[157,241],[158,254],[171,263],[182,249],[183,235]]);
const gTail=s([[183,235],[182,267],[178,293],[161,300],[151,299],[169,301],[183,289]]);
const m=s([[120,240],[121,210],[130,208],[138,236],[144,210],[152,210],[159,240]]);
const smallL=s([[185,198],[186,224],[185,249],[183,263],[188,265]]);
const capitalL=s([[177,193],[178,241],[178,265],[209,265]]);
const cross1=s([[119,196],[140,257]]),cross2=s([[140,196],[119,257]]);
const horizontal=s([[124,224],[154,224]]),vertical=s([[139,207],[139,245]]);
const cases=[
 {name:'97 kg · continuous glyphs',ink:[nine,seven,k,g],expected:'97 kg'},
 {name:'97 kg · two-stroke k',ink:[nine,seven,kStem,kBranches,g],expected:'97 kg'},
 {name:'97 kg · two-stroke g',ink:[nine,seven,k,gHead,gTail],expected:'97 kg'},
 {name:'97 ml',ink:[nine,seven,m,smallL],expected:'97 ml'},
 {name:'Digits 97',ink:[nine,seven],expected:'97'},
 {name:'Digits 972',ink:[nine,seven,two],expected:'972'},
 {name:'97 ×',ink:[nine,seven,cross1,cross2],expected:'97 ×'},
 {name:'97 + 2',ink:[nine,seven,horizontal,vertical,move(two,86)],expected:'97 + 2'},
 {name:'972 L',ink:[nine,seven,two,capitalL],expected:'972 L'}
];
const transforms=[
 {scale:1,slant:0,dx:0,dy:0,label:'original'},
 {scale:.86,slant:.02,dx:100,dy:50,label:'smaller'},
 {scale:1.18,slant:-.04,dx:150,dy:70,label:'larger + left slant'},
 {scale:1,slant:.08,dx:40,dy:90,label:'right slant'}
];
function change(ink,t){
 return ink.map(p=>({...p,points:p.points.map(q=>({
  x:(q.x*W*t.scale+t.slant*q.y*H+t.dx)/W,
  y:(q.y*H*t.scale+t.dy)/H
 }))}));
}
async function run(recognizer=window.WhiteboardHandwritingMath){
 if(!recognizer?.recognize)throw Error('Load Beta handwriting engine first.');
 const detail=[];
 for(const test of cases)for(const t of transforms){
  try{
   const result=await recognizer.recognize(change(test.ink,t),W,H,{mode:'auto'});
   detail.push({case:test.name,variant:t.label,expected:test.expected,actual:result.text,
    engine:result.engine,passed:result.text===test.expected});
  }catch(error){detail.push({case:test.name,variant:t.label,expected:test.expected,
   actual:'ERROR: '+String(error?.message||error),passed:false})}
 }
 return{total:detail.length,passed:detail.filter(r=>r.passed).length,failures:detail.filter(r=>!r.passed),detail,
  disclaimer:'Synthetic affine stroke variants only; not a real-world accuracy estimate.'};
}
window.WhiteboardPrimaryRegression=Object.freeze({run,count:cases.length,variants:transforms.length});
})();