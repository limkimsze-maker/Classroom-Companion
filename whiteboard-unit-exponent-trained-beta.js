/* Derived only from the final superscript strokes in 25 m² and 20 m³
   labelled examples. Compact normalized mean 8x8 features, no raw ink. */
(function(root){'use strict';
const C={
 '²':[1,4,8,7,3,1,1,0,5,21,34,30,15,6,4,1,14,46,57,54,35,15,9,5,10,31,38,55,47,25,19,17,2,9,25,60,57,42,37,34,0,6,32,72,69,51,40,32,1,10,40,67,57,39,26,18,1,8,28,34,26,15,9,5],
 '³':[0,0,6,19,19,10,3,0,0,2,19,59,63,37,11,1,0,2,18,53,66,57,20,2,0,1,8,34,67,65,21,2,0,0,9,40,71,60,18,2,0,0,6,27,54,58,21,3,0,0,5,24,50,58,19,1,0,0,11,46,66,40,9,0]};
for(const k of Object.keys(C)){let v=C[k],n=Math.hypot(...v)||1;C[k]=Float32Array.from(v,x=>x/n);}
function feature(stroke,W,H){
 const p=stroke?.points||[];if(p.length<3)return null;
 const xs=p.map(q=>q.x*W),ys=p.map(q=>q.y*H);
 const lx=Math.min(...xs),rx=Math.max(...xs),ty=Math.min(...ys),by=Math.max(...ys);
 const ww=Math.max(.00001,rx-lx),hh=Math.max(.00001,by-ty),span=5.6,sc=span/Math.max(ww,hh);
 const ox=1.2+(span-ww*sc)/2,oy=1.2+(span-hh*sc)/2;
 const pts=xs.map((x,i)=>({x:(x-lx)*sc+ox,y:(ys[i]-ty)*sc+oy})),g=new Float32Array(64);
 for(let k=0;k<pts.length-1;k++){const a=pts[k],b=pts[k+1],n=Math.max(2,Math.floor(Math.hypot(b.x-a.x,b.y-a.y)*3));
  for(let t=0;t<n;t++){const x=Math.round(a.x+(b.x-a.x)*t/(n-1)),y=Math.round(a.y+(b.y-a.y)*t/(n-1));if(x>=0&&x<8&&y>=0&&y<8)g[y*8+x]=1;}}
 const kw=[.000058,.00962,.2054,.569844,.2054,.00962,.000058],ref=x=>x<0?-x-1:x>7?15-x:x;
 const tmp=new Float32Array(64),v=new Float32Array(64);
 for(let y=0;y<8;y++)for(let x=0;x<8;x++)for(let k=-3;k<=3;k++)tmp[y*8+x]+=kw[k+3]*g[y*8+ref(x+k)];
 for(let y=0;y<8;y++)for(let x=0;x<8;x++)for(let k=-3;k<=3;k++)v[y*8+x]+=kw[k+3]*tmp[ref(y+k)*8+x];
 const n=Math.hypot(...v)||1;return Float32Array.from(v,x=>x/n);
}
function rank(stroke,W,H){const f=feature(stroke,W,H);if(!f)return[];
 return Object.entries(C).map(([label,v])=>{let score=0;for(let j=0;j<64;j++)score+=f[j]*v[j];return{label,score};}).sort((a,b)=>b.score-a.score);
}
function match(stroke,W,H){const scores=rank(stroke,W,H);if(scores.length<2)return null;
 const [a,b]=scores;return a.score>=.77&&a.score-b.score>=.09
  ?{label:a.label,score:a.score,margin:a.score-b.score,engine:'teacher-final-exponent-45'}:null;
}
root.WhiteboardUnitExponent=Object.freeze({rank,match,info:()=>({sourceSampleCount:45,trainedLabels:['²','³'],source:'final stroke of m²/m³ unit training'})});
})(window);
