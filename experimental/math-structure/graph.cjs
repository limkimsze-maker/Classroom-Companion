'use strict';
// Experimental, independent structural parser. No production integration.
// Geometry uses normalized ink coordinates; does not infer correctness from confidence.
function box(stroke){
 const p=stroke.points||[];if(!p.length)return null;
 const xs=p.map(q=>q.x),ys=p.map(q=>q.y),x=Math.min(...xs),y=Math.min(...ys);
 const w=Math.max(...xs)-x,h=Math.max(...ys)-y;
 return {x,y,w,h,cx:x+w/2,cy:y+h/2};
}
function graph(strokes){
 const nodes=strokes.map((stroke,id)=>({id,stroke,box:box(stroke)})).filter(n=>n.box);
 const edges=[];
 for(let i=0;i<nodes.length;i++)for(let j=0;j<nodes.length;j++){
  if(i===j)continue;
  const a=nodes[i].box,b=nodes[j].box;
  const xoverlap=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
  const yoverlap=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  const rel=[];
  if(b.cx>a.cx)rel.push('right');
  if(b.cy<a.cy)rel.push('above');
  if(b.cy>a.cy)rel.push('below');
  if(xoverlap>0&&yoverlap>0)rel.push('overlap');
  if(b.x>=a.x&&b.x+b.w<=a.x+a.w&&b.y>=a.y&&b.y+b.h<=a.y+a.h)rel.push('contained');
  if(Math.abs(a.cy-b.cy)<=Math.max(a.h,b.h)*.25)rel.push('baseline');
  edges.push({from:nodes[i].id,to:nodes[j].id,relations:rel});
 }
 return {nodes,edges};
}
function roofCandidates(strokes){
 const nodes=graph(strokes).nodes,roots=[];
 for(const roof of nodes){
  const p=roof.stroke.points,b=roof.box;
  if(b.w<.12||b.w<b.h*4||p.length<3)continue;
  const left=p.reduce((a,q)=>q.x<a.x?q:a,p[0]);
  for(const hook of nodes){
   if(hook.id===roof.id)continue;
   const q=hook.stroke.points,h=hook.box;
   if(q.length<5||h.h<.08||h.w>h.h*.85)continue;
   const top=q.reduce((a,v)=>v.y<a.y?v:a,q[0]);
   const bottom=q.reduce((a,v)=>v.y>a.y?v:a,q[0]);
   const dx=Math.abs(top.x-left.x),dy=Math.abs(top.y-left.y);
   if(dx>Math.max(.055,h.h*.28)||dy>Math.max(.075,h.h*.42))continue;
   if(bottom.y<top.y+h.h*.65)continue;
   // The lower left tick can be drawn in either direction.
   const tick=q.some(v=>v.x<bottom.x-h.h*.12&&v.y<bottom.y-h.h*.08);
   if(!tick)continue;
   const inside=nodes.filter(n=>n.id!==roof.id&&n.id!==hook.id&&n.box.cx>top.x&&n.box.cx<b.x+b.w&&n.box.cy>b.cy);
   roots.push({roof:roof.id,hook:hook.id,inside:inside.map(n=>n.id)});
  }
 }
 return roots;
}
module.exports={box,graph,roofCandidates};
