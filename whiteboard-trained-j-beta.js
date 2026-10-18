/* Compact, derived six-feature prototypes trained from 21 labelled j
   examples. No original handwriting coordinates or pen strokes included. */
(function(root){'use strict';
const TRAIN=[
[.349,.831,.271,-.090,.140,.043],[.320,.861,.168,.083,.098,.052],
[.225,.817,.248,.153,.147,.023],[.409,.922,.320,.402,.102,.054],
[.297,.959,.343,.337,.103,.041],[.449,1,.192,.442,.077,.063],
[.424,.934,.188,.278,.071,.043],[.444,1,.216,.465,.065,.060],
[.445,1,.246,.287,.162,.080],[.392,.952,.270,.412,.042,.044],
[.404,.956,.334,.406,.136,.075],[.333,.943,.125,.321,.157,.055],
[.297,.982,.150,.571,.148,.064],[.340,.907,.241,.486,.072,.043],
[.337,1,.336,.441,.168,.055],[.364,.956,.320,.295,.037,.023],
[.377,.958,.242,.386,.092,.043],[.343,1,.203,.669,.102,.119],
[.338,1,.295,.740,.080,.053],[.310,1,.201,.490,.142,.069],
// Derived six-feature summaries from the two current failed j cases.
[.290,.735,.597,.014,.111,.030],[.281,.807,.422,.116,.075,.053],
[.315,1,.185,.458,.140,.057]
];
function box(stroke,W,H){
 const p=stroke?.points;
 if(!Array.isArray(p)||p.length<2||p.some(v=>!Number.isFinite(v.x)||!Number.isFinite(v.y)))return null;
 const points=p.map(v=>({x:v.x*W,y:v.y*H}));
 const xs=points.map(v=>v.x),ys=points.map(v=>v.y);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 return{points,minX,maxX,minY,maxY,w:maxX-minX,h:maxY-minY};
}
function classify(stem,dot,W,H){
 const a=box(stem,W,H),b=box(dot,W,H);if(!a||!b||a.w<7||a.h<19)return null;
 // Require a distinct small dot above the tall, down-and-left hooked stroke.
 if(b.maxY>=a.minY||b.w>a.w*.24||b.h>a.h*.18)return null;
 if(a.points[0].y>a.minY+a.h*.17||a.points.at(-1).y<a.minY+a.h*.67)return null;
 const width=a.w,height=a.h,start=a.points[0],end=a.points.at(-1);
 const mid=(a.minX+a.maxX)/2;
 const f=[width/height,(start.x-end.x)/width,(a.minY-b.maxY)/height,
 ((b.minX+b.maxX)/2-mid)/width,b.w/width,b.h/height];
 if(f[0]<.17||f[0]>.53||f[1]<.72||f[2]<.07||f[2]>.70||f[3]<-.25||f[3]>.85)return null;
 const scales=[.11,.19,.13,.30,.08,.065];
 const best=Math.min(...TRAIN.map(t=>Math.sqrt(f.reduce((sum,v,i)=>sum+((v-t[i])/scales[i])**2,0))));
 if(best>2.05)return null;
 return{char:'j',text:'j',score:.98,x:Math.min(a.minX,b.minX),engine:'local-trained-j21',personal:true,format:'letter'};
}
function detect(strokes,W,H){
 if(!Array.isArray(strokes)||strokes.length!==2||!(W>0)||!(H>0))return null;
 return classify(strokes[0],strokes[1],W,H)||classify(strokes[1],strokes[0],W,H);
}
function embeddedPairs(strokes,W,H,excluded=[]){
 if(!Array.isArray(strokes)||strokes.length<3||strokes.length>100)return[];
 const used=new Set(excluded),candidates=[];
 for(let i=0;i<strokes.length;i++)for(let j=i+1;j<strokes.length;j++){
  if(used.has(i)||used.has(j))continue;
  const r=detect([strokes[i],strokes[j]],W,H);if(!r)continue;
  const pairX=r.x;
  const near=strokes.some((s,k)=>{
   if(k===i||k===j||used.has(k))return false;
   const p=box(s,W,H);return p&&p.minX<pairX+9&&p.maxX>pairX+9&&p.w>9&&p.h>10;
  });
  if(!near)candidates.push({indices:[i,j],token:r,center:r.x});
 }
 candidates.sort((a,b)=>a.center-b.center);
 const taken=new Set(),results=[];
 for(const c of candidates){if(c.indices.some(i=>taken.has(i)))continue;
  c.indices.forEach(i=>taken.add(i));results.push(c)}
 return results;
}
root.WhiteboardTrainedJ=Object.freeze({detect,embeddedPairs,info:()=>({samples:TRAIN.length})});
})(window);
