/* Invented radical geometry around public UJI V1 digits, never teacher traces. */
const fs=require('node:fs'),vm=require('node:vm');
const {assemble}=require('../benchmark-handwriting-simulations.cjs');
const W=1800,H=600;
module.exports=function fixtures(ctx){
 vm.runInContext(fs.readFileSync('scripts/handwriting-uji-real-ink-fixtures.js','utf8'),ctx);
 const S=points=>({size:3,points:points.map(([x,y])=>({x:x/W,y:y/H}))});
 function make(value,answer=null,{joined=false,curved=false,writer=1}={}){
  const ink=assemble(ctx.WhiteboardUJIInkFixtures.samples[writer],value,0);
  const points=ink.flatMap(s=>s.points),left=Math.min(...points.map(p=>p.x*W)),right=Math.max(...points.map(p=>p.x*W));
  const digits=ink.map(s=>({...s,points:s.points.map(p=>({x:p.x+(160-left)/W,y:p.y}))})),far=160+right-left+12;
  const hook=curved?[[108,263],[114,274],[120,284],[126,286],[132,280],[138,262],[141,235],[144,204],[146,178]]:[[108,263],[126,286],[146,178]];
  const roof=curved?[[148,174],[170,170],[(far+170)/2,169],[far,160],[far-3,162]]:[[146,178],[far,178]];
  const radical=joined?[S([...hook,...roof])]:[S(hook),S(roof)];
  let tail=[];
  if(answer!==null){
   const eq=far+35;tail=[S([[eq,219],[eq+24,219]]),S([[eq,232],[eq+24,232]])];
   if(answer!==''){
    const result=assemble(ctx.WhiteboardUJIInkFixtures.samples[writer],answer,0),min=Math.min(...result.flatMap(s=>s.points.map(p=>p.x*W)));
    tail.push(...result.map(s=>({...s,points:s.points.map(p=>({x:p.x+(eq+44-min)/W,y:p.y}))})));
   }
  }
  return{ink:[...radical,...digits,...tail],radical,digits,tail};
 }
 return{make,W,H,S};
};
