/* Conservative standalone handwritten equals sign geometry.
   No learned labels, network calls or training exceptions.
   A candidate must be exactly TWO similar parallel horizontal lines. */
(function(root){
'use strict';
function detect(strokes,W,H,embedded=false){
 if(!Array.isArray(strokes)||strokes.length!==2||!(W>0)||!(H>0))return null;
 const bars=[];
 for(const stroke of strokes){
  const pts=stroke?.points;
  if(!Array.isArray(pts)||pts.length<2||pts.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
  const xy=pts.map(p=>({x:p.x*W,y:p.y*H}));
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,length=0;
  for(let i=0;i<xy.length;i++){
   const p=xy[i];minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);
   minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);
   if(i)length+=Math.hypot(p.x-xy[i-1].x,p.y-xy[i-1].y);
  }
  const width=maxX-minX,height=maxY-minY;
  const from=xy[0],to=xy.at(-1),displacement=Math.hypot(from.x-to.x,from.y-to.y);
  const ink=Math.max(1,Math.min(12,Number(stroke.size)||4));
  if(width<Math.max(embedded?6:12,ink*(embedded?1.3:3.2))||height>Math.max(ink*2.2,width*(embedded?.42:.24)))return null;
  if(displacement<width*.88||length>displacement*1.23)return null; // curves or retracing
  if(Math.abs(from.y-to.y)>width*(embedded?.42:.16))return null;
  bars.push({x:minX,far:maxX,midY:(minY+maxY)/2,width,height,ink,
    middleX:(minX+maxX)/2});
 }
 bars.sort((a,b)=>a.midY-b.midY);
 const [top,bottom]=bars,overlap=Math.min(top.far,bottom.far)-Math.max(top.x,bottom.x);
 const avg=(top.width+bottom.width)/2,sep=bottom.midY-top.midY;
 if(overlap<Math.min(top.width,bottom.width)*(embedded?.46:.60))return null;
 if(Math.max(top.width,bottom.width)/Math.min(top.width,bottom.width)>1.65)return null;
 if(Math.abs(top.middleX-bottom.middleX)>avg*.26)return null;
 if(sep<Math.max(3,Math.min(top.ink,bottom.ink)*.72,avg*.055))return null;
 if(sep>(embedded?Math.min(44,Math.max(28,avg*2.6)):Math.max(11,avg*.52)))return null;
 const box={x:Math.min(top.x,bottom.x),y:top.midY-top.height/2,
  w:Math.max(top.far,bottom.far)-Math.min(top.x,bottom.x),
  h:bottom.midY+bottom.height/2-(top.midY-top.height/2)};
 return {text:'=',tokens:[],uncertain:[],engine:'local-equals-geometry',format:'latex',bounds:box};
}
function embeddedPairs(strokes,W,H){
 if(!Array.isArray(strokes)||strokes.length<3||strokes.length>100)return[];
 const candidates=[];
 for(let i=0;i<strokes.length;i++)for(let j=i+1;j<strokes.length;j++){
   const match=detect([strokes[i],strokes[j]],W,H,true);
   if(!match)continue;
   const b=match.bounds;
   const pairCenter=b.x+b.w/2;
   // Embedded equals must be clearly separate from surrounding glyphs.
   let overlapsOther=false;
   for(let k=0;k<strokes.length;k++){
     if(k===i||k===j)continue;
     const pts=strokes[k]?.points||[];
     if(!pts.length)continue;
     const xs=pts.map(p=>p.x*W),ys=pts.map(p=>p.y*H);
     const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
     if(Math.min(x1,b.x+b.w)-Math.max(x0,b.x)>b.w*.32 &&
         Math.min(y1,b.y+b.h)-Math.max(y0,b.y)>0){overlapsOther=true;break}
   }
   if(overlapsOther)continue;
   candidates.push({indices:[i,j],center:pairCenter,token:{char:'=',score:1,x:b.x,parts:[],engine:'local-embedded-equals'}});
 }
 // Prefer wider pairs, avoiding duplicate use of one stroke.
 candidates.sort((a,b)=>b.token.x-a.token.x);
 const taken=new Set(),found=[];
 for(const candidate of candidates){
   if(candidate.indices.some(i=>taken.has(i)))continue;
   candidate.indices.forEach(i=>taken.add(i));
   found.push(candidate);
 }
 return found.sort((a,b)=>a.center-b.center);
}
root.WhiteboardEqualSign=Object.freeze({detect,embeddedPairs});
})(typeof window!=='undefined'?window:globalThis);
