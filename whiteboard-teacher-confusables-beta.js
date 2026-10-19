/* Teacher-confusable-character v1. 189 private strokes -> 18 quantized
 * centroids for exactly I,l,i,1,t,f. No raw teacher pen data included.
 * Other characters continue to use the existing model. */
(function(root){'use strict';
const labels=['I','l','i','1','t','f'],b=atob("AQcICAgFAQAGPkZLRC8FAAEHD0YPBQEAAAAIRQgAAAAAAAhFDQEBAAACDUIUDhECAhQ7SkZFOgYAAgcICAgHAQABCAgICAEAAAdEUUtDBwAAAQ9HFQgBAAAACEUOAQAAAAAIRQ4BAAAAAQ9HFQgBAAAHRFFLQwcAAAEICAgIAQAAAQgJCAEAAAAHRlNGBwAAAAEQTRABAAAAAAlMCQAAAAAACUwJAAAAAAEQThcJAQAAB0ZTTUUHAAABCAkJCAEAAAAAAQgBAAAAAAAKTgkAAAAAARRYCgAAAAAEKVoKAAAAAAU3XAoAAAAACVxdCgAAAAAJVUIGAAAAAAEJBgEAAAAAAAEHAQAAAAAAC0QIAAAAAAQoTggAAAAABC1OCAAAAAAGP1AIAAAAAQ9RSw4BAAAHRFFJQwcAAAEICAgIAQAAAAAEBwEAAAAABCpJCAAAAAAIUVQJAAAAAAlVUggAAAAACVI5BQAAAAAJUjkFAAAAAAhLQAYAAAAAAQgHAQAAAAABCgMAAAAAAApbHwIAAAAAAhgaAwAAAAAFOmELAAAAAAIZbAwAAAAAARJ0DQAAAAAEMm4MAAAAAAAGCwEAAAAAAAQLAQAAAAACIF4KAAAAAAIPDwIAAAAADXMqAwAAAAAOexkBAAAAAA1yGAEAAAAAClshAwAAAAABCQMAAAAAAAEJDQEAAAAACE5wDAAAAAABCQ0BAAAAAAEMAwAAAAAADXYcAgAAAAAPgBAAAAAAAA10DQAAAAAAAQwBAAAAAAABCAkBAAAAAAdEXAoAAAAAARJpDAAAAAAADGkMAAAAAAESZAsAAAAACEo3BQAAAAAJVy8EAAAAAAEJBQAAAAAAAQkJAQAAAAAJVVMJAAAAAAtkFAEAAAAADGUMAAAAAAALZAwAAAAAAApdGAIAAAAACEs/BgAAAAABCAcBAAAAAAADCgEAAAAAAh9iCwAAAAACHWcMAAAAAAhJQwcAAAAADGcaAgAAAAAMaQ4AAAAAAAtgFAEAAAAAAQoCAAAAAAABBwEAAAAAAAhGDAIAAAABD00uEwIAAAdIWkAsBAAAARBPEAkBAAAACU8fLAUAAAAHSE5ABgAAAAEHCQcBAAAAAQUHAQAAAAAHM0YOAQAAAx02WEMHAAAHRTZOIAMAAAEIDk0NAQAAAAEQTCUDAAAAAhlPSQcAAAAAAwgIAQAAAAAEBgEAAAABCSdADQEAAAU3S1Y/BgAABTBLPh0DAAAADEQYBgAAAAAITCQZAwAAAAdETDUFAAAAAQcIBgEAAAAAAQgFAQAAAAAITDMFAAAAAAlTMwUAAAEIEVdHBwAAB0hSWSADAAABCydOCgAAAAAHPSUDAAAAAAEHAwAAAAAAAAQIAgAAAAAEK1ARAQAAAAlLRRABAAABFl5XMQUAAAUxXB4OAQAAAQ9WCwEAAAAADE4JAAAAAAABCAEAAAAAAAABCAgBAAAAAAlPTwgAAAADGlhTCAAAAhdQVC4EAAAFM0oaBgAAAAEPTQoAAAAAARNICAAAAAAAAgcBAAAA"),P=[];
for(let k=0;k<18;k++){const v=new Float32Array(64);let norm=0;for(let j=0;j<64;j++){let x=b.charCodeAt(k*64+j);v[j]=x;norm+=x*x}norm=Math.sqrt(norm)||1;for(let j=0;j<64;j++)v[j]/=norm;P.push({label:labels[Math.floor(k/3)],v})}
function feature(ink,W,H){
 const lines=ink.map(s=>(s.points||[]).map(p=>({x:p.x*W,y:p.y*H}))).filter(x=>x.length);
 if(!lines.length)return null;
 const pts=lines.flat(),minX=Math.min(...pts.map(p=>p.x)),maxX=Math.max(...pts.map(p=>p.x)),minY=Math.min(...pts.map(p=>p.y)),maxY=Math.max(...pts.map(p=>p.y));
 const width=maxX-minX,height=maxY-minY,scale=5.8/Math.max(width,height,.00001),ox=.6+(5.8-width*scale)/2,oy=.6+(5.8-height*scale)/2;
 const g=new Float32Array(64);
 for(const line of lines){const p=line.map(q=>({x:(q.x-minX)*scale+ox,y:(q.y-minY)*scale+oy}));
  for(let n=0;n<p.length;n++){const a=p[n],z=p[Math.min(n+1,p.length-1)],steps=Math.max(2,Math.floor(Math.hypot(z.x-a.x,z.y-a.y)*3));
   for(let k=0;k<steps;k++){const t=k/(steps-1),x=Math.round(a.x*(1-t)+z.x*t),y=Math.round(a.y*(1-t)+z.y*t);if(x>=0&&x<8&&y>=0&&y<8)g[y*8+x]=1;}}}
 const weights=[.00017,.102,.79566,.102,.00017],ref=i=>i<0?-i-1:i>=8?15-i:i;
 const temp=new Float32Array(64),out=new Float32Array(64);
 for(let y=0;y<8;y++)for(let x=0;x<8;x++)for(let k=-2;k<=2;k++)temp[y*8+x]+=g[y*8+ref(x+k)]*weights[k+2];
 for(let y=0;y<8;y++)for(let x=0;x<8;x++)for(let k=-2;k<=2;k++)out[y*8+x]+=temp[ref(y+k)*8+x]*weights[k+2];
 const norm=Math.hypot(...out);return norm?out.map(x=>x/norm):null;
}
function rank(ink,W,H,mode='auto'){
 const f=feature(ink,W,H);if(!f)return[];
 const only=l=>mode==='uppercase'?l==='I':mode==='lowercase'?['l','i','t','f'].includes(l):mode==='digits'?l==='1':true;
 const scores=new Map();
 for(const p of P){if(!only(p.label))continue;let score=0;for(let i=0;i<64;i++)score+=f[i]*p.v[i];scores.set(p.label,Math.max(scores.get(p.label)||0,score))}
 return [...scores].map(([label,score])=>({label,score})).sort((a,b)=>b.score-a.score);
}
function match(ink,W,H,mode='auto',minScore=.94,minMargin=.065){
 const list=rank(ink,W,H,mode),top=list[0],next=list[1];
 if(!top||top.score<minScore||(next&&top.score-next.score<minMargin))return null;
 return{char:top.label,text:top.label,score:top.score,personal:true,engine:'teacher-confusable-189',margin:next?top.score-next.score:1};
}
root.WhiteboardTeacherConfusables=Object.freeze({rank,match,info:()=>({samples:189,labels:labels.slice(),prototypes:18,source:'teacher-2026-10-19'})});
})(window);