/* Local-only math handwriting: stroke segmentation, symbol geometry and MNIST digits. */
(function(){
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const median=a=>{a=a.slice().sort((x,y)=>x-y);return a.length?a[Math.floor(a.length/2)]:0};
function checkCancelled(options){if(options.signal?.aborted)throw Object.assign(new Error('Reading cancelled'),{name:'AbortError'})}
async function readCharacters(images,mode,options){
 checkCancelled(options);
 const result=await window.WhiteboardCharacterReader.predictBatch(images,mode,options.onProgress,options.signal);
 checkCancelled(options);return result;
}
function normalizeReading(text,mode){
 const reading=String(text).replace(/\s+/g,' ').trim();
 return mode==='auto'?reading.replace(/(?:\s*×){2,}(?=\s|$)/g,' ×').trim():reading;
}
let layers=null;
function predictDigit(pixels){
 const model=window.WhiteboardDigitModel;if(!model)throw Error('The local handwriting model has not loaded. Refresh the page.');
 if(!layers)layers=model.layers.map(l=>({...l,w:Int8Array.from(atob(l.weights),c=>{const n=c.charCodeAt(0);return n>127?n-256:n})}));
 const pixelScale=pixels.some(v=>v>1)?1/255:1;
 let input=Float32Array.from(pixels,v=>v*pixelScale);
 for(let k=0;k<layers.length;k++){
  const l=layers[k],out=Float32Array.from(l.bias);
  for(let i=0;i<l.input;i++){const v=input[i]*l.scale;if(!v)continue;const offset=i*l.output;for(let j=0;j<l.output;j++)out[j]+=v*l.w[offset+j]}
  if(k<layers.length-1)for(let j=0;j<out.length;j++)out[j]=Math.max(0,out[j]);
  input=out;
 }
 const max=Math.max(...input),exp=Array.from(input,x=>Math.exp(x-max)),sum=exp.reduce((a,b)=>a+b,0);
 return exp.map((p,i)=>({char:String(i),score:p/sum})).sort((a,b)=>b.score-a.score);
}
function bounds(parts){
 const pts=parts.flatMap(s=>s.points);const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
 return{x,y,w,h,cx:x+w/2,cy:y+h/2};
}
function pointDistance(x,y,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-a.x-t*dx,y-a.y-t*dy)}
function rasterDigit(parts){
 const b=bounds(parts),scale=20/Math.max(1,b.w,b.h),ox=13.5-b.w*scale/2,oy=13.5-b.h*scale/2,pixels=new Float32Array(784);
 for(const s of parts){
  const pts=s.points.map(p=>({x:(p.x-b.x)*scale+ox,y:(p.y-b.y)*scale+oy})),radius=clamp((s.size||4)*scale/2,.8,1.5);
  for(let i=0;i<pts.length;i++){
   const a=pts[Math.max(0,i-1)],z=pts[i],x0=Math.max(0,Math.floor(Math.min(a.x,z.x)-radius-1)),x1=Math.min(27,Math.ceil(Math.max(a.x,z.x)+radius+1)),y0=Math.max(0,Math.floor(Math.min(a.y,z.y)-radius-1)),y1=Math.min(27,Math.ceil(Math.max(a.y,z.y)+radius+1));
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)pixels[y*28+x]=Math.max(pixels[y*28+x],clamp(radius+.5-pointDistance(x,y,a,z),0,1));
  }
 }
 let mass=0,mx=0,my=0;for(let y=0;y<28;y++)for(let x=0;x<28;x++){const v=pixels[y*28+x];mass+=v;mx+=x*v;my+=y*v}
 if(!mass)return pixels;
 const dx=13.5-mx/mass,dy=13.5-my/mass,out=new Float32Array(784);
 for(let y=0;y<28;y++)for(let x=0;x<28;x++){
  const sx=x-dx,sy=y-dy,ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
  for(let j=0;j<2;j++)for(let i=0;i<2;i++)if(ix+i>=0&&ix+i<28&&iy+j>=0&&iy+j<28)out[y*28+x]+=pixels[(iy+j)*28+ix+i]*(i?fx:1-fx)*(j?fy:1-fy);
 }
 return out;
}
function line(s){
 const p=s.points,a=p[0],b=p[p.length-1];let length=0;for(let i=1;i<p.length;i++)length+=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y);
 const d=Math.hypot(b.x-a.x,b.y-a.y),straight=d>0&&length/d<1.16;
 return{straight,horizontal:straight&&Math.abs(b.y-a.y)<Math.abs(b.x-a.x)*.3,vertical:straight&&Math.abs(b.x-a.x)<Math.abs(b.y-a.y)*.3,slope:(b.y-a.y)/(b.x-a.x||.001)};
}
function bends(s){let prior=0,changes=0;for(let i=1;i<s.points.length;i++){const d=s.points[i].x-s.points[i-1].x;if(Math.abs(d)<.7)continue;const sign=Math.sign(d);if(prior&&prior!==sign)changes++;prior=sign}return changes}
function symbol(parts,H){
 const b=bounds(parts),lines=parts.map(line),horizontal=parts.filter((s,i)=>lines[i].horizontal);
 if(parts.length===1&&b.h>H*.55&&b.w<b.h*.34){
  const p=parts[0].points;let length=0;for(let i=1;i<p.length;i++)length+=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y);
  if(length/Math.max(1,Math.hypot(b.w,b.h))<1.4)return'1';
 }
 if(parts.length>=2&&horizontal.length===parts.length&&b.h<H*.48)return'=';
 if(parts.length===1&&lines[0].horizontal&&b.w>H*.22)return'−';
 if(parts.length===2&&lines.some(l=>l.horizontal)&&lines.some(l=>l.vertical)){
  const h=bounds([parts[lines.findIndex(l=>l.horizontal)]]),v=bounds([parts[lines.findIndex(l=>l.vertical)]]);
  if(h.cy>v.y+v.h*.22&&h.cy<v.y+v.h*.78)return'+';
 }
 // Crossed diagonals remain multiplication even with significant pen slant.
 // A rotated diagonal may otherwise be mistaken for a vertical line.
 if(parts.length===2&&lines.every(l=>l.straight&&!l.horizontal)
    &&lines[0].slope*lines[1].slope<0
    &&parts.every(s=>{const q=bounds([s]);return q.w>H*.20&&q.h>H*.35;}))return'×';
 if(parts.length>=2&&b.w>H*.16&&b.w<H*.95){
  const bar=parts.find((s,i)=>lines[i].vertical&&bounds([s]).h>H*.65);
  if(bar&&parts.some(s=>s!==bar&&bounds([s]).h>H*.5&&bends(s)>=2))return'$';
 }
 return null;
}

/* Open-top handwritten 4s can be confused with 6 by the MNIST image classifier.
   Require an unmistakable three-stroke crossbar/stem/left-leg structure to override it. */
function openFourGeometry(group){
 if(group.length<3||group.length>4)return false;
 const b=bounds(group);if(b.w<12||b.h<14)return false;
 const bar=group.find(s=>{
  const q=bounds([s]);return line(s).horizontal&&q.w>=b.w*.58&&q.h<=Math.max(5,b.h*.15)&&q.cy>=b.y+b.h*.28&&q.cy<=b.y+b.h*.78;
 });
 if(!bar)return false;
 const hb=bounds([bar]),remain=group.filter(s=>s!==bar);
 const stem=remain.find(s=>{
  const q=bounds([s]);return q.h>=b.h*.62&&q.w<=b.w*.35
   &&q.cy>=b.y+b.h*.40&&q.cy<=b.y+b.h*.70
   &&q.y<=hb.cy-b.h*.13&&q.y+q.h>=hb.cy+b.h*.20
   &&q.cx>=b.x+b.w*.22&&q.cx<=b.x+b.w*.86
   &&hb.x<=q.cx-b.w*.07&&hb.x+hb.w>=q.cx+b.w*.12;
 });
 if(!stem)return false;
 const sb=bounds([stem]);
 return remain.some(s=>{
  if(s===stem)return false;
  const q=bounds([s]);return q.h>=b.h*.22
   &&q.y<=hb.cy-b.h*.19&&q.y+q.h>=hb.cy-b.h*.13
   &&q.cx<=sb.cx+b.w*.05
   &&q.cx>=b.x-b.w*.15
   &&q.w>=b.w*.12
   &&q.x<b.x+b.w*.48;
 });
}

// A separately drawn crossbar may extend past a wide 7's ordinary glyph-width
// limit. Join it only when the ink actually crosses the digit's middle and
// both offline models agree on the complete 7. A nearby minus stays separate.
function crossedSevenGroup(first,second){
 if(first.length!==1||second.length!==1||!window.WhiteboardDigitModel||!window.WhiteboardUjiReader)return false;
 const all=[first[0],second[0]],body=all.reduce((a,b)=>bounds([a]).h>bounds([b]).h?a:b);
 const bar=all.find(s=>s!==body),b=bounds([body]),q=bounds([bar]),joined=bounds(all);
 if(b.h<14||b.w<b.h*.35||b.w>b.h*1.45||!line(bar).horizontal||
    q.h>b.h*.28||q.w<b.h*.25||q.w>b.h*1.15||
    q.cy<b.y+b.h*.25||q.cy>b.y+b.h*.75||joined.w>b.h*1.6)return false;
 const overlap=Math.min(b.x+b.w,q.x+q.w)-Math.max(b.x,q.x);
 if(overlap<Math.min(b.w,q.w)*.25)return false;
 const side=(a,z,p)=>(z.x-a.x)*(p.y-a.y)-(z.y-a.y)*(p.x-a.x);
 const tolerance=Math.max(1.5,Math.min(b.h*.045,((body.size||4)+(bar.size||4))/2));
 let crosses=false;
 for(let i=1;i<body.points.length&&!crosses;i++)for(let j=1;j<bar.points.length;j++){
  const a=body.points[i-1],z=body.points[i],p=bar.points[j-1],r=bar.points[j];
  const intersects=side(a,z,p)*side(a,z,r)<=0&&side(p,r,a)*side(p,r,z)<=0&&
    Math.max(Math.min(a.x,z.x),Math.min(p.x,r.x))<=Math.min(Math.max(a.x,z.x),Math.max(p.x,r.x))&&
    Math.max(Math.min(a.y,z.y),Math.min(p.y,r.y))<=Math.min(Math.max(a.y,z.y),Math.max(p.y,r.y));
  if(intersects||Math.min(pointDistance(a.x,a.y,p,r),pointDistance(z.x,z.y,p,r),
      pointDistance(p.x,p.y,a,z),pointDistance(r.x,r.y,a,z))<=tolerance){crosses=true;break}
 }
 if(!crosses)return false;
 const digit=predictDigit(rasterDigit([body,bar]))[0];
 if(digit.char!=='7'||digit.score<.97)return false;
 const pen=window.WhiteboardUjiReader.read([body.points,bar.points]);
 return pen?.[0]?.label==='7'&&pen[0].p>=.985&&pen[0].p-(pen[1]?.p||0)>=.95;
}

// Some open 4s have a detached upright: the left section starts higher and
// ends above the upright's foot. Require this staggered structure and two
// independent votes for the complete 4 before bridging its small pen gap.
// Ordinary adjacent digits such as 61 share a baseline and stay separate.
function detachedFourGroup(first,second){
 if(first.length!==1||second.length!==1||!window.WhiteboardDigitModel||!window.WhiteboardUjiReader)return false;
 const parts=[first[0],second[0]].sort((a,b)=>bounds([a]).cx-bounds([b]).cx);
 const left=bounds([parts[0]]),stem=bounds([parts[1]]),joined=bounds(parts),h=joined.h;
 const gap=stem.x-left.x-left.w,verticalOverlap=Math.min(left.y+left.h,stem.y+stem.h)-Math.max(left.y,stem.y);
 if(h<14||joined.w<12||joined.w>h*1.15||gap<0||gap>h*.24||
    left.w<h*.35||left.h<h*.50||stem.h<h*.50||stem.w>h*.22||
    !line(parts[1]).vertical||stem.y-left.y<h*.18||
    stem.y+stem.h-left.y-left.h<h*.18||verticalOverlap<h*.20)return false;
 const digit=predictDigit(rasterDigit(parts))[0];
 if(digit.char!=='4'||digit.score<.80)return false;
 const pen=window.WhiteboardUjiReader.read(parts.map(s=>s.points));
 return pen?.[0]?.label==='4'&&pen[0].p>=.985&&pen[0].p-(pen[1]?.p||0)>=.95;
}

// Pen input can wobble or briefly retrace a nearly straight operator stroke.
// Measure its ink corridor as well as its travelled length; keep the stricter
// legacy line classifier for digits, unit strokes and standalone characters.
function operatorStroke(stroke){
 const b=bounds([stroke]),p=stroke.points,a=p[0],z=p.at(-1),d=Math.hypot(z.x-a.x,z.y-a.y),span=Math.hypot(b.w,b.h);
 let length=0,deviation=0;
 for(let i=0;i<p.length;i++){
  if(i)length+=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y);
  deviation=Math.max(deviation,pointDistance(p[i].x,p[i].y,a,z));
 }
 const straight=span>=4&&d>=span*.82&&length/d<=1.50&&deviation<=Math.max(.8,span*.16);
 return{b,a,z,straight,horizontal:straight&&b.h<=b.w*.38&&Math.abs(z.y-a.y)<=Math.abs(z.x-a.x)*.42,
  vertical:straight&&b.w<=b.h*.30};
}
function operatorCrossing(a,b){
 const u={x:a.z.x-a.a.x,y:a.z.y-a.a.y},v={x:b.z.x-b.a.x,y:b.z.y-b.a.y},den=u.x*v.y-u.y*v.x;
 if(Math.abs(den)<.001)return false;
 const q={x:b.a.x-a.a.x,y:b.a.y-a.a.y},t=(q.x*v.y-q.y*v.x)/den,s=(q.x*u.y-q.y*u.x)/den;
 return t>=.18&&t<=.82&&s>=.18&&s<=.82;
}
function relaxedOperator(parts,height){
 const lines=parts.map(operatorStroke),b=bounds(parts);
 if(parts.length===1&&lines[0].horizontal&&b.w>height*.22&&b.h<height*.25)return'−';
 if(parts.length!==2||!lines.every(l=>l.straight)||!operatorCrossing(lines[0],lines[1]))return null;
 if(lines.some(l=>l.horizontal)&&lines.some(l=>l.vertical))return'+';
 const slopes=lines.map(l=>(l.z.y-l.a.y)/(l.z.x-l.a.x||.001));
 if(lines.every(l=>!l.horizontal&&l.b.w>height*.20&&l.b.h>height*.35)&&slopes[0]*slopes[1]<0)return'×';
 return null;
}
// Relaxed geometry is enabled by independently supported adjacent numerals,
// not by a particular expression, its expected answer, or a teacher's identity.
function numericOperatorNeighbours(group,groups,height){
 if(!window.WhiteboardCharacterInference||!window.WhiteboardUjiReader)return false;
 const b=bounds(group),others=groups.filter(g=>g!==group).map(parts=>({parts,b:bounds(parts)}));
 const left=others.filter(p=>p.b.cx<b.x).sort((a,z)=>z.b.cx-a.b.cx)[0];
 const right=others.filter(p=>p.b.cx>b.x+b.w).sort((a,z)=>a.b.cx-z.b.cx)[0];
 const numeric=item=>{
  if(!item||item.b.h<height*.4||Math.abs(item.b.cy-b.cy)>height*.65||
   Math.max(item.b.x-b.x-b.w,b.x-item.b.x-item.b.w)>height*2)return false;
  const pixels=rasterDigit(item.parts),image=window.WhiteboardCharacterInference.predict(pixels,'auto'),pen=window.WhiteboardUjiReader.read(item.parts.map(p=>p.points)),best=pen?.[0],top=image?.[0];
  if(/^\d$/.test(top?.char||'')&&top.score>=.90&&best?.label===top.char&&best.p>=.70)return true;
  const digits=predictDigit(pixels),digit=digits[0];
  if(/^\d$/.test(top?.char||'')&&top.score>=.80&&digit.char===top.char&&digit.score>=.98&&
    !(/^[A-Za-z]$/.test(best?.label||'')&&best.p>=.985))return true;
  const aliases={O:'0',o:'0',I:'1',l:'1',Z:'2',z:'2',S:'5',s:'5',B:'8',g:'9',q:'9'};
  const support=image.reduce((sum,p)=>sum+((p.char===best?.label||aliases[p.char]===best?.label)?p.score:0),0);
  if(/^\d$/.test(best?.label||'')&&best.p>=.70&&digit.char===best.label&&digit.score>=.98&&support>=.95)return true;
  if(!best||!/^\d$/.test(best.label)||best.p<.985||best.p-(pen[1]?.p||0)<.95)return false;
  return (image.find(p=>p.char===best.label)?.score||0)>=.10||digit.char===best.label&&digit.score>=.90;
 };
 return numeric(left)||numeric(right);
}
function operatorAccent(dot,group,height){
 const b=bounds(group),d=bounds([dot]),tolerance=Math.max(1,Math.min(height*.05,(dot.size||3)*.75));
 if(d.cx<b.x-tolerance||d.cx>b.x+b.w+tolerance||d.cy<b.y-tolerance||d.cy>b.y+b.h+tolerance)return false;
 return group.some(s=>s.points.some((p,i)=>i&&pointDistance(d.cx,d.cy,s.points[i-1],p)<=tolerance));
}

function segment(strokes,W,H,mode='auto'){
 const equalPairs=window.WhiteboardEqualSign?.embeddedPairs?.(strokes,W,H)||[];
 const consumed=new Set(equalPairs.flatMap(pair=>pair.indices));
 const jPairs=window.WhiteboardTrainedJ?.embeddedPairs?.(strokes,W,H,[...consumed])||[];
 for(const pair of jPairs)for(const index of pair.indices)consumed.add(index);
 const jTokens=jPairs.map(pair=>({...pair.token,parts:pair.indices.map(i=>({source:strokes[i],size:Number(strokes[i].size)||4,points:strokes[i].points.map(p=>({x:p.x*W,y:p.y*H}))}))}));
 const equalTokens=equalPairs.map(pair=>{
   const ink=pair.indices.map(i=>strokes[i]).map(s=>({source:s,size:Number(s.size)||4,
     points:s.points.map(p=>({x:p.x*W,y:p.y*H}))}));
   return {...pair.token,parts:ink};
 });
 const parts=strokes.filter((s,i)=>!consumed.has(i)).filter(s=>Array.isArray(s.points)&&s.points.length).map(s=>({source:s,size:Number(s.size)||4,points:s.points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>({x:p.x*W,y:p.y*H}))})).filter(s=>s.points.length);
 if(!parts.length)return [...equalTokens,...jTokens].sort((a,b)=>a.x-b.x);
 if(parts.length===1){const b=bounds(parts),dotSize=Math.max(3,parts[0].size*1.2);if(b.w<dotSize&&b.h<dotSize)return[{char:'.',score:.85,x:b.x,parts}]}
 // Without digits, use horizontal sign width as scale so = and ÷ still group correctly.
 const height=median(parts.map(s=>bounds([s]).h).filter(h=>h>8))||Math.max(16,...parts.map(s=>s.size*4),...parts.filter(s=>line(s).horizontal).map(s=>bounds([s]).w*1.4));
 const tall=parts.filter(s=>bounds([s]).h>height*.4),rows=[];
 for(const s of tall.sort((a,b)=>bounds([a]).cy-bounds([b]).cy)){
  const cy=bounds([s]).cy;let row=rows.find(r=>Math.abs(cy-r.cy)<height*.65);
  if(!row){row={cy,parts:[]};rows.push(row)}row.parts.push(s);row.cy=median(row.parts.map(s=>bounds([s]).cy));
 }
 if(!rows.length)rows.push({cy:median(parts.map(s=>bounds([s]).cy)),parts:[]});
 for(const s of parts)if(!tall.includes(s))rows.reduce((best,r)=>Math.abs(bounds([s]).cy-r.cy)<Math.abs(bounds([s]).cy-best.cy)?r:best).parts.push(s);
 const tokens=[];
 for(const row of rows){
  let dots=row.parts.filter(s=>{const b=bounds([s]);return b.w<height*.18&&b.h<height*.18}),main=row.parts.filter(s=>!dots.includes(s));
  // A long ruling underneath stacked working is not a subtraction sign.
  if(rows.length>1)main=main.filter(s=>{const b=bounds([s]);return !(line(s).horizontal&&b.w>height*3&&b.cy>row.cy+height*.3)});
  const groups=main.map(s=>[s]);
  let changed=true;
  while(changed){changed=false;for(let i=0;i<groups.length&&!changed;i++)for(let j=i+1;j<groups.length;j++){
   const a=bounds(groups[i]),b=bounds(groups[j]),overlap=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x),joined=bounds([...groups[i],...groups[j]]);
   if((overlap>=-Math.max(1,height*.035)&&joined.w<height*1.25)||
      crossedSevenGroup(groups[i],groups[j])||detachedFourGroup(groups[i],groups[j])){
     groups[i].push(...groups[j]);groups.splice(j,1);changed=true;break}
  }}
  const rowTokens=[];
  for(const group of groups){
   // Keep the dot with a narrow stem for separately written i/j, rather than making another token.
   const stem=bounds(group),accent=dots.find(s=>{const d=bounds([s]);return stem.h>height*.4&&stem.w<height*.55&&Math.abs(d.cx-stem.cx)<Math.max(4,height*.2)&&d.cy<stem.y-height*.06&&d.cy>stem.y-height*.45});
   if(accent){group.push(accent);dots=dots.filter(s=>s!==accent)}
   const b=bounds(group),legacy=symbol(group,height);
   const candidate=!legacy&&mode==='auto'?relaxedOperator(group,height):null;
   const relaxed=candidate&&numericOperatorNeighbours(group,groups,height)?candidate:null;
   const op=legacy||relaxed;
   if(['+','×'].includes(op)){
    const accents=dots.filter(dot=>operatorAccent(dot,group,height));
    group.push(...accents);dots=dots.filter(dot=>!accents.includes(dot));
   }
   if(op==='−'){
    const candidates=dots.filter(s=>{const d=bounds([s]);return Math.abs(d.cx-b.cx)<Math.max(5,b.w*.3)&&Math.abs(d.cy-b.cy)<height*.55}),above=candidates.find(s=>bounds([s]).cy<b.cy-height*.10),below=candidates.find(s=>bounds([s]).cy>b.cy+height*.10);
    if(above&&below){dots=dots.filter(s=>s!==above&&s!==below);rowTokens.push({char:'÷',score:1,x:b.x,parts:[...group,above,below]});continue}
   }
   // Geometry beats a mistaken digit prediction (or a previously accepted bad sample).
   if(openFourGeometry(group)){rowTokens.push({char:'4',score:.96,x:b.x,parts:group,engine:'open-four-geometry'});continue}
   const pixels=rasterDigit(group),personal=window.WhiteboardHandwritingLearning?.match(pixels);
   if(personal){rowTokens.push({...personal,x:b.x,parts:group});continue}
   if(op){rowTokens.push({char:op,score:relaxed ? .96 : 1,x:b.x,parts:group,...(relaxed?{engine:'local-operator-stroke-geometry'}:{})});continue}
   const choices=predictDigit(pixels);
   rowTokens.push({...choices[0],choices:choices.slice(0,3),x:b.x,parts:group});
  }
  for(const dot of dots){const b=bounds([dot]);rowTokens.push({char:b.cy>=row.cy+height*.15?'.':'×',score:.85,x:b.x,parts:[dot]})}
  rowTokens.sort((a,b)=>a.x-b.x);tokens.push(...rowTokens);
 }
 return [...tokens,...equalTokens,...jTokens].sort((a,b)=>a.x-b.x);
}

/* A radical encloses ink under a roof. Detect its two-leg hook and roof before
   ordinary glyph grouping can combine the hook with the first digit. */
function radicalHook(points){
 if(points.length<3)return null;
 const p=points[0].x<=points.at(-1).x?points:points.slice().reverse(),b=bounds([{points:p}]);
 if(b.h<14||b.w<b.h*.12||b.w>b.h*.95)return null;
 const a=p[0],z=p.at(-1),i=p.reduce((best,q,k)=>q.y>p[best].y?k:best,0),v=p[i];
 if(i===0||i===p.length-1||a.y<b.y+b.h*.40||v.y-a.y<b.h*.15||
    z.y>b.y+b.h*.18||v.x-a.x<b.h*.06||z.x<v.x-b.h*.10||z.x-a.x<b.h*.12)return null;
 let length=0;
 for(let k=0;k<p.length;k++){
  if(k)length+=Math.hypot(p[k].x-p[k-1].x,p[k].y-p[k-1].y);
  const u=k<=i?a:v,w=k<=i?v:z;
  if(pointDistance(p[k].x,p[k].y,u,w)>b.h*.18)return null;
 }
 const direct=Math.hypot(v.x-a.x,v.y-a.y)+Math.hypot(z.x-v.x,z.y-v.y);
 if(length>direct*1.5)return null;
 return{box:b,end:z};
}
// A teacher may draw the roof first, then pull the radical stem down and
// finish with a short leftward tick. Recognise that reverse pen order by
// geometry, without classifying the radical as a V or minus sign.
function radicalDescendingHook(points){
 if(points.length<5)return null;
 const p=points[0].y<=points.at(-1).y?points:points.slice().reverse();
 const b=bounds([{points:p}]),a=p[0],z=p.at(-1);
 if(b.h<18||b.w>b.h*1.5||b.w<b.h*.10)return null;
 const i=p.reduce((best,q,k)=>q.y>p[best].y?k:best,0),v=p[i];
 if(i<2||i>=p.length-2||a.y>b.y+b.h*.20||
    v.y-a.y<b.h*.70||z.y>b.y+b.h*.68||
    z.x>v.x-b.h*.10||Math.abs(a.x-v.x)>b.h*.50)return null;
 let length=0;
 for(let k=0;k<p.length;k++){
  if(k)length+=Math.hypot(p[k].x-p[k-1].x,p[k].y-p[k-1].y);
  const u=k<=i?a:v,w=k<=i?v:z;
  if(pointDistance(p[k].x,p[k].y,u,w)>b.h*.24)return null;
 }
 const direct=Math.hypot(v.x-a.x,v.y-a.y)+Math.hypot(z.x-v.x,z.y-v.y);
 if(length>direct*1.55)return null;
 return{box:b,end:a,descending:true};
}
// Parenthesis strokes are structural boundaries, not letters or digits.
function radicalParenthesis(stroke){
 const p=stroke.points,b=bounds([stroke]);
 if(p.length<5||b.h<18||b.w>b.h*.75||b.w<b.h*.055)return null;
 const first=p[0],last=p.at(-1);
 // Parentheses travel from top to bottom (or vice versa), not back to
 // the same height. Their endpoints have similar x, and middle bows out.
 if(Math.abs(first.y-last.y)<b.h*.65||Math.abs(first.x-last.x)>b.w*.8)return null;
 const middle=p.reduce((best,q)=>Math.abs(q.y-b.cy)<Math.abs(best.y-b.cy)?q:best,p[0]);
 const bulge=middle.x-(first.x+last.x)/2;
 if(Math.abs(bulge)<b.w*.32)return null;
 return bulge<0?'(':')';
}
async function radicalExpression(inside,W,H,options){
 // Delegate a complete parenthesized radicand to the already verified
 // structural bracket reader instead of reclassifying its strokes as letters.
 const grouped=await detectParenthesizedNumber(inside.map(p=>p.raw),W,H,options);
 if(grouped)return grouped;
 const ordered=inside.slice().sort((a,b)=>a.box.cx-b.box.cx),brackets=[];
 for(let i=0;i<ordered.length;i++){
  const kind=radicalParenthesis(ordered[i].scaled);
  if(kind)brackets.push({i,kind});
 }
 if(!brackets.length)return recognizeNumericContext(inside.map(p=>p.raw),W,H,options);
 if(brackets.length%2)return null;
 let depth=0;
 for(const b of brackets){depth+=b.kind==='('?1:-1;if(depth<0)return null;}
 if(depth!==0)return null;
 const output=[],tokens=[],uncertain=[];let pending=[];
 const flush=async()=>{
  if(!pending.length)return true;
  // Before a bracket, a two-stroke plus must be extracted as a single
  // operator. Otherwise the vertical stroke can become a spurious '1'
  // and the horizontal stroke a minus sign (e.g. 8+(10) -> 81-(10)).
  let trailing=null, numericParts=pending;
  if(pending.length>=3){
   const last=pending.slice(-2),a=last[0].box,b=last[1].box;
   const horizontal=a.w>a.h*2.5?last[0]:b.w>b.h*2.5?last[1]:null;
   const vertical=a.h>a.w*2.5?last[0]:b.h>b.w*2.5?last[1]:null;
   if(horizontal&&vertical){
    const h=horizontal.box,v=vertical.box;
    const crossX=v.cx>=h.x+h.w*.12&&v.cx<=h.x+h.w*.88;
    const crossY=h.cy>=v.y+v.h*.12&&h.cy<=v.y+v.h*.88;
    if(crossX&&crossY){
     trailing={char:'+',score:.98,parts:[horizontal.scaled,vertical.scaled],engine:'radical-crossed-plus'};
     numericParts=pending.slice(0,-2);
    }
   }
  }
  let result=await recognizeNumericContext(numericParts.map(p=>p.raw),W,H,options);
  if(!result&&!trailing&&pending.length>=2){
   const last=pending.at(-1),candidate=segment([last.raw],W,H)[0];
   if(candidate&&['+','−','×','÷'].includes(candidate.char)){
    trailing=candidate;
    result=await recognizeNumericContext(pending.slice(0,-1).map(p=>p.raw),W,H,options);
   }
  }
  if(!result)return false;
  output.push(result.text);tokens.push(...result.tokens);uncertain.push(...result.uncertain);
  if(trailing){output.push(trailing.char);tokens.push(trailing);}
  pending=[];return true;
 };
 for(const part of ordered){
  const kind=radicalParenthesis(part.scaled);
  if(kind){if(!await flush())return null;output.push(kind);tokens.push({char:kind,score:.94,parts:[part.scaled],x:part.box.x});}
  else pending.push(part);
 }
 if(!await flush())return null;
 const expression=output.join('');
 // Balanced grouping is not enough: only numeric and arithmetic grammar is allowed.
 if(!/^[0-9+−×÷().\s]+$/.test(expression))return null;
 return{text:expression,tokens,uncertain,engine:'radical-bracket-grammar'};
}
async function detectSquareRoot(strokes,W,H,options={}){
 if(strokes.length<2||strokes.length>256)return null;
 const parts=strokes.map(raw=>{const scaled={source:raw,size:Number(raw.size)||4,
  points:raw.points.map(p=>({x:p.x*W,y:p.y*H}))};return{raw,scaled,box:bounds([scaled])}});
 const candidates=[];
 const add=(hook,roof,indices)=>{
  if(!hook)return;
  const line=operatorStroke({points:roof}),b=line.b,h=hook.box.h,left={x:b.x,y:roof.reduce((best,p)=>p.x<best.x?p:best,roof[0]).y};
  if(!line.horizontal||b.w<Math.max(12,h*.45)||b.h>h*.32||
     left.x<hook.end.x-h*(hook.descending?.20:.13)||left.x>hook.end.x+h*(hook.descending?.45:.30)||Math.abs(left.y-hook.end.y)>h*(hook.descending?.55:.26))return;
  candidates.push({hook,roof:b,indices});
 };
 for(let i=0;i<parts.length;i++){
  const p=parts[i],hooks=[radicalHook(p.scaled.points),radicalDescendingHook(p.scaled.points)].filter(Boolean);
  for(const hook of hooks)for(let j=0;j<parts.length;j++)if(i!==j)add(hook,parts[j].scaled.points,[i,j]);
  // A continuous radical can be drawn in either direction. Test a bounded
  // number of splits; the original full stroke is retained as one ink part.
  for(const points of [p.scaled.points,p.scaled.points.slice().reverse()]){
   const count=Math.min(60,points.length);
   for(let k=2;k<count-1;k++){
    const at=Math.round(k*(points.length-1)/(count-1));
    add(radicalHook(points.slice(0,at+1)),points.slice(at),[i]);
   }
  }
 }
 for(const candidate of candidates){
  checkCancelled(options);
  const {hook,roof,indices}=candidate,h=hook.box.h,right=roof.x+roof.w,inside=[],tail=[];let invalid=false;
  for(let i=0;i<parts.length;i++){
   if(indices.includes(i))continue;
   const p=parts[i],b=p.box;
   if(b.x>=right+h*.03){
    if(b.y<roof.y-h*.10||b.y+b.h>hook.box.y+h*1.20){invalid=true;break}
    tail.push(p);continue;
   }
   if(b.x<hook.end.x-h*.08||b.x+b.w>right+h*.08||b.y<roof.y-h*.08||
      b.cy<roof.cy+h*.15||b.y+b.h>hook.box.y+h*1.16){invalid=true;break}
   inside.push(p);
  }
  if(invalid||!inside.length)continue;
  const enclosed=bounds(inside.map(p=>p.scaled));
  if(enclosed.h<h*.30||enclosed.h>h*1.35)continue;
  let number=await radicalExpression(inside,W,H,options);
  // In a radical, independently detect a two-stroke arithmetic operator
  // before reading digits. The generic segmenter can split a plus into
  // '1' and '−', preventing otherwise valid bracket grammar from parsing.
  if(!number&&inside.length>=5){
   const ordered=inside.slice().sort((a,b)=>a.box.cx-b.box.cx);
   const opens=ordered.filter(p=>radicalParenthesis(p.scaled)==='(');
   const closes=ordered.filter(p=>radicalParenthesis(p.scaled)===')');
   if(opens.length===1&&closes.length===1&&opens[0].box.cx<closes[0].box.cx){
    const left=ordered.filter(p=>p.box.cx<opens[0].box.cx);
    const middle=ordered.filter(p=>p.box.cx>opens[0].box.cx&&p.box.cx<closes[0].box.cx);
    const end=ordered.filter(p=>p.box.cx>closes[0].box.cx);
    if(left.length>=3&&middle.length&&end.length===0){
     const pairs=[];
     for(let a=0;a<left.length;a++)for(let b=a+1;b<left.length;b++){
      const u=operatorStroke(left[a].scaled),v=operatorStroke(left[b].scaled);
      if(u.straight&&v.straight&&operatorCrossing(u,v)&&
        ((u.horizontal&&v.vertical)||(u.vertical&&v.horizontal)))pairs.push([a,b]);
     }
     for(const [a,b] of pairs){
      const prefix=left.filter((_,i)=>i!==a&&i!==b);
      if(!prefix.length)continue;
      const first=await recognizeNumericContext(prefix.map(p=>p.raw),W,H,{...options,measurementPrefix:true});
      const digits=await recognizeNumericContext(middle.map(p=>p.raw),W,H,{...options,measurementPrefix:true});
      if(first&&digits&&/^\\d+$/.test(first.text)&&/^\\d+$/.test(digits.text)){
       number={text:first.text+'+('+digits.text+')',tokens:[...first.tokens,...digits.tokens],
        uncertain:[...(first.uncertain||[]),...(digits.uncertain||[])],engine:'radical-geometric-plus-brackets'};
       break;
      }
     }
    }
   }
  }
  // A radical establishes numeric context even when an open handwritten 4
  // resembles a dollar sign to the generic mixed-character recogniser.
  // Keep the geometry-backed radical, but flag fallback digits for review.
  if(!number&&!inside.some(p=>radicalParenthesis(p.scaled))){
   const tokens=segment(inside.map(p=>p.raw),W,H);
   if(tokens.length&&tokens.length<=256){
    const operators=new Set(['+','−','×','÷']);
    const recovered=[];
    for(const token of tokens){
     if(operators.has(token.char)){recovered.push(token);continue;}
     if(!token.parts?.length){recovered.length=0;break;}
     const guess=predictDigit(rasterDigit(token.parts))[0];
     if(!guess||!/^[0-9]$/.test(guess.char)||guess.score<.42){recovered.length=0;break;}
     recovered.push({...token,char:guess.char,score:Math.min(guess.score,.74),engine:'radical-numeric-fallback'});
    }
    const text=recovered.map(t=>operators.has(t.char)?' '+t.char+' ':t.char).join('').replace(/\\s+/g,' ').trim();
    if(recovered.length&&completeNumericExpression(text))
     number={text,tokens:recovered,uncertain:recovered.filter(t=>t.score<.85),engine:'radical-numeric-fallback'};
   }
  }
  if(!number||number.text.includes('='))continue;
  let suffix='',tailTokens=[],uncertain=[...number.uncertain];
  if(tail.length){
   const tokens=segment(tail.map(p=>p.raw),W,H),equal=tokens[0];
   if(equal?.char!=='=')continue;
   const sources=new Set(equal.parts.map(p=>p.source)),remaining=tail.filter(p=>!sources.has(p.raw));
   if(!remaining.length)continue;
   const result=await recognizeNumericContext(remaining.map(p=>p.raw),W,H,options);
   if(!result)continue;
   suffix=' = '+result.text;tailTokens=[equal,...result.tokens];uncertain.push(...result.uncertain);
  }
  const latex=text=>text.replace(/×/g,'\\times ').replace(/÷/g,'\\div ').replace(/−/g,'-');
  return{text:'\\sqrt{'+latex(number.text)+'}'+latex(suffix),format:'latex',engine:'local-square-root',
   tokens:[...number.tokens,...tailTokens],uncertain,radicalParts:indices.map(i=>parts[i].raw)};
 }
 return null;
}

/* A stacked fraction is a spatial structure, not three inline characters.
   Read both numeric rows independently before consulting whole-ink templates. */
async function detectStackedFraction(strokes,W,H,options={}){
 if(strokes.length<3||strokes.length>18)return null;
 const parts=strokes.filter(s=>Array.isArray(s.points)&&s.points.length&&s.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))).map(raw=>{
  const scaled={points:raw.points.map(p=>({x:p.x*W,y:p.y*H})),size:Number(raw.size)||4};
  return{raw,box:bounds([scaled]),line:operatorStroke(scaled)};
 });
 if(parts.length!==strokes.length)return null;
 const candidates=parts.filter(p=>p.line.horizontal&&p.box.w>=14&&p.box.w>=p.box.h*2.5).sort((a,b)=>b.box.w-a.box.w);
 for(const bar of candidates){
  const b=bar.box,above=[],below=[];let invalid=false;
  for(const part of parts){
   if(part===bar)continue;
   const q=part.box,outer=b.w*.23;
   // All other strokes must belong to this numerator or denominator.
   if(q.cx<b.x-outer||q.cx>b.x+b.w+outer){invalid=true;break}
   const separation=Math.max(2,Math.min(7,q.h*.12));
   if(q.cy<b.cy-separation)above.push(part);
   else if(q.cy>b.cy+separation)below.push(part);
   else{invalid=true;break}
  }
  if(invalid||!above.length||!below.length)continue;
  const top=bounds(above.map(p=>({points:[{x:p.box.x,y:p.box.y},{x:p.box.x+p.box.w,y:p.box.y+p.box.h}]})));
  const bottom=bounds(below.map(p=>({points:[{x:p.box.x,y:p.box.y},{x:p.box.x+p.box.w,y:p.box.y+p.box.h}]})));
  const tolerance=Math.max(3,Math.min(8,(top.h+bottom.h)*.09));
  if(top.y+top.h>b.cy+tolerance||bottom.y<b.cy-tolerance||top.cy>=bottom.cy)continue;
  if(b.w<Math.max(top.w,bottom.w)*.75)continue;
  // A valid numerator and denominator should each be legible as numbers.
  const topRead=await recognizeNumericContext(above.map(p=>p.raw),W,H,options);
  const bottomRead=await recognizeNumericContext(below.map(p=>p.raw),W,H,options);
  if(!topRead||!bottomRead)continue;
  const numerator=topRead.text,denominator=bottomRead.text;
  const topTokens=topRead.tokens,bottomTokens=bottomRead.tokens;
  if(!/^\d{1,6}$/.test(numerator)||!/^\d{1,6}$/.test(denominator))continue;
  const tokens=[...topTokens,...bottomTokens],text='\\frac{'+numerator+'}{'+denominator+'}';
  return{text,tokens,uncertain:[...topRead.uncertain,...bottomRead.uncertain],engine:'local-stacked-fraction',format:'latex',fractionTokenCounts:[topTokens.length,bottomTokens.length],fractionBarParts:[bar.raw]};
 }
 return null;
}


/* Detect small raised powers on known measurement units before ordinary text
   reading can move the exponent to the front (e.g. cm² => 2CM). */
async function detectRaisedUnit(strokes,W,H,options={}){
 if(strokes.length<2||strokes.length>10||!window.WhiteboardCharacterReader)return null;
 const parts=strokes.map(raw=>{
  if(!Array.isArray(raw.points)||!raw.points.length||raw.points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
  const scaled={points:raw.points.map(p=>({x:p.x*W,y:p.y*H})),size:Number(raw.size)||4};
  return{raw,scaled,box:bounds([scaled])};
 });
 if(parts.some(p=>!p))return null;
 const byHeight=parts.slice().sort((a,b)=>a.box.cy-b.box.cy);
 const knownUnits=['cm','km','kg','mg','ml','min','m','g','l','s','h'];
 for(let upperCount=1;upperCount<=Math.min(2,parts.length-1);upperCount++){
  const raised=byHeight.slice(0,upperCount),baseline=byHeight.slice(upperCount).sort((a,b)=>a.box.cx-b.box.cx);
  if(!baseline.length||baseline.length>6)continue;
  const upperBox=bounds(raised.map(p=>p.scaled)),baseBox=bounds(baseline.map(p=>p.scaled));
  if(baseBox.h<12||baseBox.w<9||upperBox.w<3||upperBox.h<3)continue;
  if(upperBox.h>baseBox.h*.87||upperBox.cy>=baseBox.cy-baseBox.h*.36)continue;
  if(upperBox.x<baseBox.x+baseBox.w*.60||upperBox.cx<baseBox.cx+baseBox.w*.22)continue;
  if(upperBox.y+upperBox.h>baseBox.y+baseBox.h*.42)continue;
  if(upperBox.x>baseBox.x+baseBox.w*1.90)continue;
  const upperTokens=segment(raised.map(p=>p.raw),W,H);
  if(upperTokens.length!==1||!['2','3'].includes(upperTokens[0].char)||upperTokens[0].score<.55)continue;
  const rasters=baseline.map(p=>rasterDigit([p.scaled]));
  const predictions=await readCharacters(rasters,'lowercase',options);
  const candidates=[];
  for(const unit of knownUnits){
   const n=unit.length,prefix=baseline.length-n;
   if(prefix<0||prefix>3)continue;
   let combined=1,valid=true,prefixText='';
   for(let i=0;i<prefix;i++){
    const p=predictDigit(rasters[i])[0];
    if(!p||p.score<.76){valid=false;break}
    prefixText+=p.char;combined*=p.score;
   }
   if(!valid)continue;
   for(let i=0;i<n;i++){
    const choice=predictions[prefix+i]?.find(q=>q.char.toLowerCase()===unit[i]);
    if(!choice||choice.score<.12){valid=false;break}
    combined*=choice.score;
   }
   if(valid&&combined>.08)candidates.push({unit,prefixText,confidence:combined});
  }
  if(!candidates.length)continue;
  candidates.sort((a,b)=>b.confidence-a.confidence);
  const best=candidates[0],unit=best.unit==='ml'?'mL':best.unit==='l'?'L':best.unit;
  const top=upperTokens[0],tokens=[
   ...baseline.map((p,i)=>({
    char:i<best.prefixText.length?best.prefixText[i]:unit[i-best.prefixText.length],
    score:i<best.prefixText.length?predictDigit(rasters[i])[0].score:predictions[i]?.find(q=>q.char.toLowerCase()===best.unit[i-best.prefixText.length])?.score||.85,
    parts:[p.scaled]
   })),
   top
  ];
  const text=(best.prefixText?best.prefixText+' ':'')+unit+(top.char==='2'?'²':'³');
  return{text,tokens,uncertain:tokens.filter(t=>t.score<.85),engine:'local-raised-unit',format:'unit',baseTokenCount:baseline.length};
 }
 return null;
}


/* Context-sensitive litre recognition: a tall, cursive l is often misread as
   8 in the mixed model. Preserve ordinary numerals by requiring a letter
   candidate, and for ml require a strong handwritten m and a taller narrow l. */
async function detectLitreUnit(strokes,W,H,options={}){
 if(!window.WhiteboardCharacterReader||strokes.length<1||strokes.length>2)return null;
 const parts=strokes.map(raw=>{
  if(!raw?.points?.length||raw.points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
  const scaled={points:raw.points.map(p=>({x:p.x*W,y:p.y*H})),size:Number(raw.size)||4};
  return{raw,scaled,box:bounds([scaled])};
 });
 if(parts.some(p=>!p))return null;
 parts.sort((a,b)=>a.box.cx-b.box.cx);
 const last=parts.at(-1),b=last.box,aspect=b.w/Math.max(1,b.h);
 if(b.h<24||b.w<4||aspect<.12||aspect>.68)return null;
 const imgs=parts.map(p=>rasterDigit([p.scaled]));
 const preds=await readCharacters(imgs,'lowercase',options);
 const ell=preds.at(-1)||[],ellScore=ell.find(q=>q.char.toLowerCase()==='l')?.score||0;
 const looped=loopedStandaloneL([last.raw],W,H);
 if(ellScore<.055&&!looped)return null;
 if(parts.length===1){
  const num=predictDigit(imgs[0])[0];
  if(ellScore<.12||num.char==='8'&&num.score>.96)return null;
  return{text:'l',tokens:[{char:'l',score:Math.max(.85,ellScore),parts:[last.scaled]}],uncertain:[],engine:'local-litre-unit',format:'unit'};
 }
 const first=parts[0],a=first.box,m=preds[0]||[],mScore=m.find(q=>q.char.toLowerCase()==='m')?.score||0;
 if(mScore<.68||a.h<15||b.h<a.h*1.18||a.w<a.h*.52)return null;
 if(b.x<a.x+a.w*.60||b.x>a.x+a.w+a.h*.85||b.cy>a.cy+a.h*.33)return null;
 if(ellScore<.08&&!looped)return null;
 const tokens=[{char:'m',score:mScore,parts:[first.scaled]},{char:'l',score:Math.max(.82,ellScore),parts:[last.scaled]}];
 return{text:'ml',tokens,uncertain:[],engine:'local-litre-unit',format:'unit'};
}

/* Preserve lowercase ml when Auto has classified a short handwritten m and a
   taller narrow cursive l as capitals. Genuine same-height ML stays uppercase. */
function normalizeMillilitreCase(text,tokens){
 if(!/^[Mm][Ll]$/.test(text)||tokens.length!==2||!tokens.every(t=>t.parts?.length))return text;
 const m=bounds(tokens[0].parts),l=bounds(tokens[1].parts);
 if(m.h<10||m.w<m.h*.4||l.h<m.h*1.10||l.w>m.w*.98||l.w>l.h*.8||l.cx<=m.cx)return text;
 tokens[0].char='m';tokens[1].char='l';
 return 'ml';
}


/* Recognise a standalone, loop-top cursive l as capital L in Auto.
   The upper loop and two lower tail tips distinguish it from a real X.
   Do not alter digit/Math modes or context-sensitive lowercase ml. */
function loopedStandaloneL(strokes,W,H){
 if(strokes.length<1||strokes.length>3)return false;
 const groups=strokes.map(s=>Array.isArray(s.points)?s.points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>({x:p.x*W,y:p.y*H})):[]);
 if(groups.some(g=>g.length<2))return false;
 const pts=groups.flat(),b=bounds([{points:pts}]);
 if(b.h<32||b.w<11||b.w/b.h<.14||b.w/b.h>.81)return false;
 const upper=pts.filter(p=>p.y<=b.y+b.h*.41),neck=pts.filter(p=>p.y>=b.y+b.h*.43&&p.y<=b.y+b.h*.69),lower=pts.filter(p=>p.y>=b.y+b.h*.73);
 if(upper.length<3||neck.length<2||lower.length<3)return false;
 const span=ps=>Math.max(...ps.map(p=>p.x))-Math.min(...ps.map(p=>p.x));
 const topCentre=upper.reduce((n,p)=>n+p.x,0)/upper.length;
 if(span(upper)>b.w*.67||span(neck)>b.w*.59||topCentre<b.x+b.w*.39||topCentre>b.x+b.w*.88)return false;
 // Both lower legs are part of the shape even when either is a midpoint
 // in a connected stroke; pen endpoints alone are not reliable evidence.
 if(span(lower)<b.w*.58||!lower.some(p=>p.x<b.x+b.w*.26)||!lower.some(p=>p.x>b.x+b.w*.74))return false;
 // A genuine upper hook/loop reverses its horizontal stroke direction.
 const upperHook=groups.some(g=>{
  let direction=0;
  for(let i=1;i<g.length;i++){
   if(g[i].y>b.y+b.h*.55||g[i-1].y>b.y+b.h*.55)continue;
   const dx=g[i].x-g[i-1].x;
   if(Math.abs(dx)<Math.max(.7,b.w*.013))continue;
   const sign=Math.sign(dx);
   if(direction&&direction!==sign)return true;
   direction=sign;
  }
  return false;
 });
 if(!upperHook)return false;
 // A loop silhouette also fits hooked numerals and S-shaped fives. Do not
 // call those L when independent pen and image evidence share another family.
 const parts=strokes.map(raw=>({size:Number(raw.size)||4,points:raw.points.map(p=>({x:p.x*W,y:p.y*H}))}));
 const pen=window.WhiteboardUjiReader?.read(parts.map(p=>p.points));
 const image=window.WhiteboardCharacterInference?.predict(rasterDigit(parts),'auto');
 const family=c=>({S:'5',s:'5',I:'1',i:'1',O:'0',o:'0'}[c]||c);
 const votes=choices=>{const out={};for(const [c,p]of choices)out[family(c)]=(out[family(c)]||0)+p;return Object.entries(out).sort((a,b)=>b[1]-a[1]);};
 const penVotes=votes((pen||[]).map(p=>[p.label,p.p])),imageVotes=votes((image||[]).map(p=>[p.char,p.score]));
 if(penVotes[0]&&imageVotes[0]&&/^\d$/.test(penVotes[0][0])&&penVotes[0][0]===imageVotes[0][0]&&penVotes[0][1]>=.985&&imageVotes[0][1]>=.55)return false;
 return true;
}

/* General measurement reading. First recognise the numeric prefix with the digit
   model, then recognise the unit independently. No fixed number+unit phrases. */
function readMeasuredDigits(ink,W,H){
 if(!ink.length||ink.length>20)return null;
 let tokens=segment(ink.map(p=>p.raw),W,H);
 if(!tokens.length)return null;
 // Digits such as 8 and 9 can have upper loops and lower strokes written separately.
 // Only combine strongly vertically overlapping pen strokes with a confident digit.
 if(ink.length===2){
  const a=ink[0].box,b=ink[1].box;
  const overlap=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x);
  if(overlap>Math.min(a.w,b.w)*.45&&Math.abs(a.cy-b.cy)>Math.min(a.h,b.h)*.50
     &&Math.abs(a.cx-b.cx)<Math.max(a.w,b.w)*.55){
   const both=ink.map(p=>({points:p.raw.points.map(q=>({x:q.x*W,y:q.y*H})),size:Number(p.raw.size)||4}));
   const best=predictDigit(rasterDigit(both))[0];
   if(['8','9'].includes(best?.char)&&best.score>.93)tokens=[{...best,parts:both,x:Math.min(a.x,b.x)}];
  }
 }
 if(tokens.length>12||tokens.some(t=>!(/^\d$/.test(t.char)||t.char==='.')||t.score<.65))return null;
 tokens=tokens.slice().sort((a,b)=>bounds(a.parts).cx-bounds(b.parts).cx);
 const value=tokens.map(t=>t.char).join('');
 if(!/^\d+(?:\.\d+)?$/.test(value))return null;
 return{value,tokens};
}
async function detectMeasuredQuantity(strokes,W,H,options={}){
 if(!window.WhiteboardCharacterReader||strokes.length<2||strokes.length>24)return null;
 const items=strokes.map(raw=>{
  if(!Array.isArray(raw?.points)||!raw.points.length||raw.points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
  const scaled={points:raw.points.map(p=>({x:p.x*W,y:p.y*H})),size:Number(raw.size)||4};
  return{raw,box:bounds([scaled])};
 });
 if(items.some(p=>!p))return null;
 items.sort((a,b)=>a.box.cx-b.box.cx);
 // Try two-letter ml, then one- to three-stroke cursive L.
 // Spatial shape decides the suffix; the digits are not read as a word.
 for(const unitSize of [2,1,3]){
  if(items.length<=unitSize)continue;
  const leading=items.slice(0,-unitSize),suffix=items.slice(-unitSize);
  const lastNumber=leading.at(-1).box;
  const suffixBox=bounds(suffix.map(p=>({points:[{x:p.box.x,y:p.box.y},{x:p.box.x+p.box.w,y:p.box.y+p.box.h}]})));
  if(suffixBox.cx<=lastNumber.cx+Math.min(3,lastNumber.w*.08))continue;
  let unit=null,unitTokens=null;
  if(unitSize===2){
   const reading=await detectLitreUnit(suffix.map(p=>p.raw),W,H,options);
   if(reading?.text==='ml'){unit='ml';unitTokens=reading.tokens}
  }
  if(!unit&&loopedStandaloneL(suffix.map(p=>p.raw),W,H)){
   unit='L';unitTokens=[{char:'L',score:.96,parts:suffix.map(p=>({points:p.raw.points.map(q=>({x:q.x*W,y:q.y*H})),size:Number(p.raw.size)||4}))}];
  }
  if(!unit)continue;
  const digits=readMeasuredDigits(leading,W,H);
  if(!digits)continue;
  const tokens=[...digits.tokens,...unitTokens],text=digits.value+(unit==='ml'?' ml':'L');
  return{text,tokens,uncertain:tokens.filter(t=>t.score<.85),engine:'local-measurement-quantity',format:'unit'};
 }
 return null;
}


/* P1-P6 measurement syntax: interpret numerals and adjacent unit letters as
   different symbol classes. The alphabet model alone may call handwritten
   k a 2 and a descender g an L; a digit-first segmentation plus letter
   geometry avoids treating those as a four-digit number.
   Never use a hardcoded number (97, 35, etc.) in these rules. */
function kgStemGeometry(strokes){
 const parts=strokes.map(p=>p.scaled),b=bounds(parts),pts=parts.flatMap(p=>p.points);
 if(b.h<22||b.w<10||b.w>b.h*.8)return false;
 const left=pts.filter(p=>p.x<=b.x+b.w*.34),right=pts.filter(p=>p.x>=b.x+b.w*.65);
 if(left.length<3||right.length<2)return false;
 const range=ps=>Math.max(...ps.map(p=>p.y))-Math.min(...ps.map(p=>p.y));
 return range(left)>=b.h*.65&&right.some(p=>p.y>b.y+b.h*.22&&p.y<b.y+b.h*.66)
   &&right.some(p=>p.y>=b.y+b.h*.58);
}
function kgDescenderGeometry(strokes,digitBox,stemBox){
 const b=bounds(strokes.map(p=>p.scaled)),bottom=b.y+b.h,digitBottom=digitBox.y+digitBox.h;
 return digitBox.h>25&&b.h>digitBox.h*.49&&b.w>digitBox.h*.12&&
  b.y>=digitBox.y+digitBox.h*.14&&
  bottom>=digitBottom+digitBox.h*.13&&
  bottom>=stemBox.y+stemBox.h+digitBox.h*.10;
}
async function detectPrimaryMeasurement(strokes,W,H,options={}){
 if(!window.WhiteboardCharacterReader||strokes.length<4||strokes.length>16)return null;
 const items=strokes.map(raw=>{
  if(!Array.isArray(raw?.points)||raw.points.length<2||raw.points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
  const scaled={points:raw.points.map(p=>({x:p.x*W,y:p.y*H})),size:Number(raw.size)||4};
  return{raw,scaled,box:bounds([scaled])};
 });
 if(items.some(p=>!p))return null;
 items.sort((a,b)=>a.box.cx-b.box.cx);
 // Two-letter SI/common primary units. "ml" remains lowercase by request.
 const units=['kg','mg','cm','km','ml'];
 for(const suffixCount of [2,3,4]){
  if(items.length<=suffixCount)continue;
  const prefix=items.slice(0,-suffixCount),tail=items.slice(-suffixCount);
  if(prefix.length>12||prefix.length<1)continue;
  const digitBox=bounds(prefix.map(p=>p.scaled));
  if(digitBox.h<18)continue;
  const lastDigit=prefix.at(-1).box;
  if(tail[0].box.cx<=lastDigit.cx+Math.min(3,lastDigit.w*.07))continue;
  // A numeric prefix is a separate hypothesis, evaluated by the digit model.
  const number=readMeasuredDigits(prefix,W,H);
  if(!number)continue;
  for(let divide=1;divide<suffixCount;divide++){
   const first=tail.slice(0,divide),second=tail.slice(divide);
   const firstBox=bounds(first.map(p=>p.scaled)),secondBox=bounds(second.map(p=>p.scaled));
   if(secondBox.cx<=firstBox.cx+Math.min(3,firstBox.w*.1)||
      firstBox.cy<digitBox.y-digitBox.h||secondBox.cy<digitBox.y-digitBox.h)continue;
   const shapeK=kgStemGeometry(first),shapeG=kgDescenderGeometry(second,digitBox,firstBox);
   const images=[rasterDigit(first.map(p=>p.scaled)),rasterDigit(second.map(p=>p.scaled))];
   const predictions=await readCharacters(images,'lowercase',options);
   const prob=(idx,char)=>predictions[idx]?.find(x=>x.char.toLowerCase()===char)?.score||0;
   const ranked=[];
   for(const unit of units){
    const firstScore=prob(0,unit[0]),secondScore=prob(1,unit[1]);
    const geometryKg=unit==='kg'&&shapeK&&shapeG;
    // Do not force a weak word-list match: require both letters to have
    // model evidence, or positive structural evidence for a descending g.
    if(!geometryKg&&(firstScore<.30||secondScore<.24))continue;
    if(unit==='kg'&&!shapeG&&secondScore<.82)continue;
    const score=Math.log(Math.max(1e-9,firstScore))+Math.log(Math.max(1e-9,secondScore))+
       (geometryKg?5.8:0);
    ranked.push({unit,score,firstScore,secondScore,geometryKg});
   }
   ranked.sort((a,b)=>b.score-a.score);
   const best=ranked[0];
   if(!best||(ranked[1]&&best.score-ranked[1].score<1))continue;
   // For ambiguous "2L" / "kg", visible k-stem + g-descender
   // is required unless both letter-classifier probabilities are strong.
   if(best.unit==='kg'&&!best.geometryKg&&Math.min(best.firstScore,best.secondScore)<.82)continue;
   const tokens=[...number.tokens,
    {char:best.unit[0],score:Math.max(.55,best.firstScore),parts:first.map(p=>p.scaled)},
    {char:best.unit[1],score:Math.max(.55,best.secondScore),parts:second.map(p=>p.scaled)}];
   return{text:number.value+' '+best.unit,tokens,
     uncertain:tokens.filter(t=>t.score<.85),
     engine:'local-primary-measurement',format:'unit'};
  }
 }
 return null;
}

/* Independent UJI pen-stroke CNN: a conservative second opinion.
   A high-confidence UJI digit may corroborate MNIST if the mixed EMNIST
   recognizer has instead suggested a visually similar letter. */
function ujiConfirmsDigit(token){
 if(!window.WhiteboardUjiReader||!token?.parts?.length||
   !/^[0-9]$/.test(token.char)||token.score<.60)return false;
 try{
  const ranked=window.WhiteboardUjiReader.read(
   token.parts.map(p=>p.points.map(q=>({x:q.x,y:q.y}))));
  return ranked?.[0]?.label===token.char&&ranked[0].p>=.92;
 }catch{return false}
}

/* Recognise an exponent on a measured quantity before the base-only
   grammar can return "4 cm" and discard its raised 2. */
function raisedTwoShape(raw,W,H){
 // A raised 2 has a rounded upper turn and a distinct leftward lower bar.
 // Inspect the pen trajectory, not only the general-purpose digit CNN.
 const points=raw?.points?.map(p=>({x:p.x*W,y:p.y*H}))||[];
 if(points.length<10)return false;
 const xx=points.map(p=>p.x),yy=points.map(p=>p.y);
 const left=Math.min(...xx),right=Math.max(...xx),top=Math.min(...yy),bottom=Math.max(...yy),width=right-left,height=bottom-top;
 if(width<9||height<10||width/height<.30||width/height>1.5)return false;
 const start=points[0],end=points.at(-1);
 if(start.y>top+height*.35||end.y<top+height*.70||end.x>left+width*.36)return false;
 // The final pen segment moves appreciably left with little vertical drift.
 const tail=points.findLast(p=>p.y<bottom-height*.10&&p.x>left+width*.66);
 if(!tail)return false;
 const last=points.slice(-Math.max(4,Math.floor(points.length*.23)));
 const barWidth=Math.max(...last.map(p=>p.x))-Math.min(...last.map(p=>p.x));
 const barHeight=Math.max(...last.map(p=>p.y))-Math.min(...last.map(p=>p.y));
 return barWidth>width*.40&&barHeight<height*.20&&tail.x>end.x+width*.35;
}
/* Detect two right-facing lobes of a handwritten raised 3.
   Unlike 2, the last stroke returns left and lacks a lower baseline bar.
   Geometry is used only after a genuine upper-right raised position check. */
function raisedThreeContour(raw,W,H){
 const pts=(raw?.points||[]).map(p=>({x:p.x*W,y:p.y*H}));
 if(pts.length<14)return false;
 const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
 const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
 const w=right-left,h=bottom-top;
 if(w<8||h<11||w/h<.22||w/h>1.10)return false;
 const norm=pts.map(p=>({x:(p.x-left)/w,y:(p.y-top)/h}));
 const first=norm[0],last=norm.at(-1);
 if(first.y>.3||first.x>.65||last.y<.78||last.x>.26)return false;
 const upper=norm.filter(p=>p.y>=.16&&p.y<=.48);
 const middle=norm.filter(p=>p.y>=.48&&p.y<=.62);
 const lower=norm.filter(p=>p.y>=.7&&p.y<=.93);
 return upper.some(p=>p.x>.83)&&middle.some(p=>p.x<.55)&&
        lower.some(p=>p.x>.65)&&
        norm.slice(-Math.max(4,Math.floor(norm.length*.16))).every(p=>p.y>.78);
}
async function detectRaisedMeasuredQuantity(strokes,W,H,options={}){
 if(strokes.length<4||strokes.length>12||!window.WhiteboardPrimaryMathGrammar)return null;
 const parts=strokes.map((s,i)=>{
  if(!s?.points?.length||s.points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))return null;
  const scaled={points:s.points.map(p=>({x:p.x*W,y:p.y*H})),size:Number(s.size)||4};
  return{i,raw:s,box:bounds([scaled]),scaled};
 });
 if(parts.some(p=>!p))return null;
 // Avoid global row-centre and digit-classifier gates: these misclassified
 // legitimate area measurements containing a small high final character.
 const maxHeight=Math.max(...parts.map(p=>p.box.h));
 const candidates=parts.filter(top=>{
  const b=top.box;
  if(b.h<9||b.h>maxHeight*.72||b.w<8)return false;
  const before=parts.filter(p=>p!==top&&p.box.cx<b.cx-3);
  if(before.length<3)return false;
  const last=before.reduce((a,p)=>p.box.cx>a.box.cx?p:a);
  const baseline=before.filter(p=>p.box.h>maxHeight*.22);
  if(baseline.length<3)return false;
  const typicalY=baseline.map(p=>p.box.cy).sort((a,b)=>a-b)[Math.floor(baseline.length/2)];
  return b.cy<typicalY-maxHeight*.12
   &&b.cy<last.box.cy-maxHeight*.07
   &&b.x>=last.box.x+last.box.w*.5
   &&parts.every(p=>p===top||p.box.cx<b.cx+2);
 }).sort((a,b)=>b.box.cx-a.box.cx);
 for(const top of candidates){
  const geom2=raisedTwoShape(top.raw,W,H);
  const geom3=!geom2&&raisedThreeContour(top.raw,W,H);
  const model=window.WhiteboardTrainedRemaining?.match?.([top.raw],W,H,'digits');
  let digit=null;
  if(!geom2&&!model){digit=predictDigit(rasterDigit([top.scaled]))[0]}
  const power=geom2?'2':geom3?'3':model&&['2','3'].includes(model.char)?model.char:
    digit&&['2','3'].includes(digit.char)&&digit.score>.72?digit.char:null;
  if(!power)continue;
  const baseline=parts.filter(p=>p!==top).sort((a,b)=>a.box.cx-b.box.cx);
  const primary=window.WhiteboardPrimaryMathGrammar.create({segment,predictDigit,rasterDigit,bounds,loopedStandaloneL});
  const base=await primary.recognize(baseline.map(p=>p.raw),W,H,options);
  if(!base||!/^\d+ (cm|mm|m|km)$/.test(base.text))continue;
  return{...base,text:base.text+(power==='2'?'²':'³'),engine:'local-raised-measurement',
    tokens:[...(base.tokens||[]),{char:power==='2'?'²':'³',score:geom2?.93:(digit?.score||model?.score||.85),parts:[top.scaled]}]};
 }
 return null;
}

async function recognizeCore(strokes,W,H,options={}){
 const equal=window.WhiteboardEqualSign?.detect?.(strokes,W,H);
 if(equal)return equal;
 if(['auto','lowercase','uppercase','digits'].includes(options.mode||'auto')){const teacher=window.WhiteboardTeacherConfusables?.match?.(strokes,W,H,options.mode||'auto',.955,.08);if(teacher)return{text:teacher.text,tokens:[],uncertain:[],engine:teacher.engine,format:'letter'};}
 const trainedJ=options.mode!=='digits'&&window.WhiteboardTrainedJ?.detect?.(strokes,W,H);
 if(trainedJ)return{...trainedJ,text:options.mode==='uppercase'?'J':trainedJ.text,tokens:[],uncertain:[]};
 // Unit-first: isolate a raised final 2/3 before interpreting the numeric prefix.
 // Prefer the isolated exponent's own trained label over similar whole-unit patterns.
 if(options.mode==='auto'&&window.WhiteboardTeacherUnits&&strokes.length>=3&&strokes.length<=12){
  const items=strokes.map(raw=>{const scaled={points:raw.points.map(p=>({x:p.x*W,y:p.y*H})),size:Number(raw.size)||4};return{raw,scaled,box:bounds([scaled])}}).sort((a,b)=>a.box.cx-b.box.cx);
  const top=items.at(-1),rest=items.slice(0,-1),last=rest.at(-1),maxH=Math.max(...rest.map(p=>p.box.h));
  if(top.box.h>=8&&top.box.h<maxH*.78&&top.box.cy<last.box.cy-maxH*.12&&top.box.cx>last.box.cx){
   const exponent=window.WhiteboardTeacherUnits.rank([top.raw],W,H,{only:['²','³']});
   const best=exponent[0],next=exponent[1];
   // Clear two-lobed handwriting can identify ³ when prototypes tie or vote ².
   const contour3=raisedThreeContour(top.raw,W,H);
   const power=contour3?'³':best&&best.score>=.85&&(!next||best.score-next.score>=.025)?best.label:null;
   if(power){
    const primary=window.WhiteboardPrimaryMathGrammar?.create({segment,predictDigit,rasterDigit,bounds,loopedStandaloneL});
    const baseline=primary?await primary.recognize(rest.map(p=>p.raw),W,H,options):null;
    if(baseline&&/^\d+ (?:cm|mm|km|m)$/.test(baseline.text)){
     return{...baseline,text:baseline.text+power,engine:'teacher-unit-first-exponent',uncertain:[]};
    }
   }
  }
 }
 const teacher=options.mode==='auto'&&window.WhiteboardTeacherUnits;
 if(teacher){
  // Strong whole-selection matches override historical unit/operator exemplars.
  // Weak or ambiguous results abstain and retain the existing decoder.
  const direct=teacher.match(strokes,W,H,{minScore:.94,minMargin:.045});
  if(direct)return direct;
  // Check longer compound units first, before a grammar discards a superscript.
  // A numeric prefix must remain a separately validated quantity.
  const measured=['cm²','m²','km²','cm³','m³','cm','km','kg','mg','g','m','ml','mL','L'];
  if(strokes.length>=3&&strokes.length<=11){
   const ordered=strokes.slice().sort((a,b)=>{
    const x=s=>Math.min(...s.points.map(p=>p.x));
    return x(a)-x(b);
   });
   outer: for(const count of [4,3,2,1]){
    if(count>=ordered.length)continue;
    const suffix=ordered.slice(-count),prefix=ordered.slice(0,-count);
    const unit=teacher.match(suffix,W,H,{only:measured,minScore:.925,minMargin:.027});
    if(!unit)continue;
    const items=prefix.map(raw=>{
     const scaled={points:raw.points.map(p=>({x:p.x*W,y:p.y*H})),size:Number(raw.size)||4};
     return{raw,box:bounds([scaled])};
    });
    const digits=readMeasuredDigits(items,W,H);
    let value=digits?.value;
    if(!value&&prefix.length<=3){
     const scaled=prefix.map(raw=>({points:raw.points.map(p=>({x:p.x*W,y:p.y*H})),size:Number(raw.size)||4}));
     const candidate=predictDigit(rasterDigit(scaled))[0];
     if(candidate&&candidate.score>.92)value=candidate.char;
    }
    if(!value)continue outer;
    return{text:value+' '+unit.text,tokens:digits?.tokens||[],uncertain:[],engine:'teacher-unit-operator-quantity',format:'unit'};
   }
  }
 }
 // Supervised compact template model; abstain on uncertain handwritten shapes.
 const trained=window.WhiteboardTrained9GQEquals?.recognize?.(strokes,W,H,options.mode||'auto');
 if(trained)return trained;
 // Explicitly imported, on-device 9/g/q exemplars; abstain on uncertain matches.
 const user9gq=window.WhiteboardCharacter9GQ?.match?.(strokes,W,H,options.mode||'auto');
 if(user9gq)return user9gq;
 if(strokes.length>180||strokes.reduce((n,s)=>n+(s.points?.length||0),0)>16000)throw Error('Select a shorter number or equation and try again.');
 // Beautify 2.0: check teacher-validated local handwriting before inference.
 // This is a cautious shape match, not retraining the digit/math neural models.
 const remembered=window.WhiteboardHandwritingLearning?.matchInk?.(strokes,W,H,options.mode||'auto',rasterDigit);
 if(remembered)return{text:remembered.text,tokens:[],uncertain:[],
  engine:'local-personal-ink',format:options.mode==='math'||/^\\(?:frac|dfrac|tfrac)\b/.test(remembered.text)?'latex':'personal'};



 if(options.mode==='auto'){
  const raisedMeasurement=await detectRaisedMeasuredQuantity(strokes,W,H,options);
  if(raisedMeasurement)return raisedMeasurement;
  const primary=window.WhiteboardPrimaryMathGrammar?.create({segment,predictDigit,rasterDigit,bounds,loopedStandaloneL});
  const result=primary?await primary.recognize(strokes,W,H,options):null;
  const contextual=candidate=>{
   if(!candidate)return null;
   const learned=window.WhiteboardHandwritingLearning?.matchContext?.(
      strokes,W,H,options.mode||'auto',rasterDigit,candidate.text);
   return learned&&learned.text!==candidate.text?{
      text:learned.text,tokens:[],uncertain:[],engine:'local-personal-context',
      format:'personal'}:candidate;
  };
  if(result)return contextual(result);
  const unit=await detectPrimaryMeasurement(strokes,W,H,options);
  if(unit)return contextual(unit);
 }

 if(options.mode==='auto'&&loopedStandaloneL(strokes,W,H)){
  const parts=strokes.map(s=>({points:s.points.map(p=>({x:p.x*W,y:p.y*H})),size:Number(s.size)||4}));
  return{text:'L',tokens:[{char:'L',score:.95,parts}],uncertain:[],engine:'local-cursive-l',format:'letter'};
 }
 if(options.mode==='auto'){const measurement=await detectMeasuredQuantity(strokes,W,H,options);if(measurement)return measurement}
 if(options.mode==='auto'){const litre=await detectLitreUnit(strokes,W,H,options);if(litre)return litre}
 if(options.mode==='auto'||options.mode==='math'){const raised=await detectRaisedUnit(strokes,W,H,options);if(raised)return raised}
 if(options.mode==='auto'||options.mode==='math'){const radical=await detectSquareRoot(strokes,W,H,options);if(radical)return radical}
 if(options.mode==='auto'||options.mode==='math'){const fraction=await detectStackedFraction(strokes,W,H,options);if(fraction)return fraction}
 if(options.mode==='math')return window.WhiteboardMathReader.recognize(strokes,W,H,options);
 if(options.mode==='auto'){
  const raw=segment(strokes,W,H),op=['+','−','×','÷','='];
  const valid=raw.length>=2&&raw.length<=30&&raw.every(t=>{
   if(op.includes(t.char))return t.score>=.90;
   if(t.char==='.'){return true}
   return /^[0-9]$/.test(t.char)&&(t.score>=.96||ujiConfirmsDigit(t));
  });
  if(valid){
   const hasOp=raw.some(t=>op.includes(t.char));
   const hasDigit=raw.some(t=>/^[0-9]$/.test(t.char));
   if(hasDigit){
    const reading=raw.map(t=>op.includes(t.char)?' '+t.char+' ':t.char).join('').replace(/\s+/g,' ').trim();
    return{text:reading,tokens:raw,uncertain:[],engine:hasOp?'local-primary-arithmetic-grammar':'local-primary-digit-sequence',format:'number'};
   }
  }
 }

 const mode=['auto','lowercase','uppercase','digits'].includes(options.mode)?options.mode:'auto',tokens=segment(strokes,W,H,mode);let text='';
 if(window.WhiteboardTeacherConfusables){for(const t of tokens){if(!t.parts?.length||['+','−','×','÷','=','.','$'].includes(t.char))continue;const raw=t.parts.map(p=>p.source).filter(Boolean);if(!raw.length)continue;const fresh=window.WhiteboardTeacherConfusables.match(raw,W,H,mode,.955,.08);if(fresh)Object.assign(t,fresh);}}
 // Recognize only high-confidence trained symbols after existing grouping.
 if(window.WhiteboardTrainedRemaining&&['auto','lowercase','uppercase','digits'].includes(mode)){
  for(const t of tokens){
   if(t.personal||['+','−','×','÷','=','.','$'].includes(t.char)||!t.parts?.length)continue;
   const raw=t.parts.map(p=>p.source).filter(Boolean);
   if(!raw.length)continue;
   const trained=window.WhiteboardTrainedRemaining.match(raw,W,H,mode);
   if(trained)Object.assign(t,trained);
  }
 }

 if(window.WhiteboardCharacterReader&&mode!=='digits'){
  const candidates=tokens.filter(t=>!['.','−','÷','='].includes(t.char)&&!(t.personal&&/^[A-Za-z]$/.test(t.char))&&!(t.personal&&mode==='auto'));
  const results=await readCharacters(candidates.map(t=>rasterDigit(t.parts)),mode,options);
  if(mode==='auto'){
   const personalLetters=tokens.filter(t=>t.personal&&/^[A-Za-z]$/.test(t.char));
   const letters=results.filter((r,i)=>!['+','×','$'].includes(candidates[i].char)&&/^[A-Za-z]$/.test(r[0]?.char||'')&&!'BIOQSZiloqsz'.includes(r[0].char)&&r[0].score>.8).length+personalLetters.length;
   const digits=results.filter(r=>/^[2-9]$/.test(r[0]?.char||'')&&r[0].score>.75).length;
   // Text containing clear letters uses the dedicated alphabet model, resolving heLL0-style errors.
   if(letters>=2&&!digits){
    const dotted=tokens.some(t=>t.parts.length>1&&t.parts.some(p=>{const b=bounds([p]),all=bounds(t.parts);return b.w<all.h*.15&&b.h<all.h*.15&&b.cy<all.y+all.h*.2}));
    const lower=dotted||personalLetters.some(t=>/^[a-z]$/.test(t.char))||results.some(r=>/^[a-z]$/.test(r[0]?.char||''));
    const first=results[0]?.[0],title=lower&&first?.score>.9&&'ABDEFGHKNQRT'.includes(first?.char||'!');
    const selected=candidates.map((t,i)=>({t,i})).filter(({t})=>!['+','×','$'].includes(t.char));
    if(selected.length){const alphabet=await readCharacters(selected.map(({t})=>rasterDigit(t.parts)),lower?'lowercase':'uppercase',options);for(let j=0;j<selected.length;j++){const i=selected[j].i;results[i]=title&&i===0?alphabet[j].map(c=>({...c,char:c.char.toUpperCase()})):alphabet[j]}}
   }
  }
  const letterContext=results.some((r,i)=>!['+','×','$'].includes(candidates[i].char)&&/^[A-Za-z]$/.test(r[0]?.char||'')&&!'BIOQSZiloqsz'.includes(r[0].char)&&r[0].score>.8);
  const numericContext=!letterContext&&tokens.some(t=>['.','$','+','−','×','÷','='].includes(t.char));
  for(let i=0;i<candidates.length;i++){
   const t=candidates[i],choices=results[i],best=choices[0];if(!best)continue;
   if(mode==='auto'&&['+','×','$'].includes(t.char))continue;
   if(mode!=='auto'&&t.char==='+'&&bounds(t.parts).h<bounds(t.parts).w*1.35)continue;
   if(mode==='auto'&&t.char==='1'&&!letterContext)continue;
   if(numericContext&&/^[0-9]$/.test(t.char)&&/^[BIOQSZiloqsz]$/.test(best.char))continue;
   if(mode==='auto'&&/^[0-9]$/.test(t.char)&&/^[A-Za-z]$/.test(best.char)&&ujiConfirmsDigit(t))continue;
   Object.assign(t,best,{choices:choices.slice(0,4)});
  }
 }
 for(const t of tokens){
  if(mode==='digits'&&/^[A-Za-z]$/.test(t.char)){const choices=predictDigit(rasterDigit(t.parts));Object.assign(t,choices[0],{choices:choices.slice(0,3)})}
  if(mode==='lowercase'&&/^[A-Za-z]$/.test(t.char))t.char=t.char.toLowerCase();
  if(mode==='uppercase'&&/^[A-Za-z]$/.test(t.char))t.char=t.char.toUpperCase();
 }
 const letterHeight=median(tokens.filter(t=>/^[A-Za-z]$/.test(t.char)).map(t=>bounds(t.parts).h).filter(h=>h>0));let previous=null;
 for(const token of tokens){
  if(previous&&/^[A-Za-z]$/.test(previous.char)&&/^[A-Za-z]$/.test(token.char)){
   const a=bounds(previous.parts),b=bounds(token.parts),advance=b.cx-a.cx,expected=(Math.max(a.w,letterHeight*.55)+Math.max(b.w,letterHeight*.55))/2;
   if(advance-expected>letterHeight*.5)text+=' ';
  }
  text+=['+','−','×','÷','='].includes(token.char)?' '+token.char+' ':token.char;previous=token;
 }
 // P1–P6 infix expressions cannot contain two consecutive multiplication
 // operators without an intervening operand. Preserve the original ink and
 // collapse only accidental adjacent multiply tokens in Auto reading.
 const cleanReading=normalizeReading(text,mode);
 const uncorrected=mode==='auto'?normalizeMillilitreCase(cleanReading,tokens):cleanReading;
 // Ask the offline feedback layer whether previously corrected handwriting
 // with a similar shape was misread the same way. Do not train or overwrite
 // the CNN; require a trustworthy local example and reject conflicts.
 const adapted=window.WhiteboardHandwritingLearning?.matchContext?.(strokes,W,H,options.mode||'auto',rasterDigit,uncorrected);
 if(adapted&&adapted.text!==uncorrected)return{text:adapted.text,tokens:[],
   uncertain:[],engine:'local-personal-context',
   format:mode==='math'?'latex':'personal'};
 return{text:uncorrected,tokens,uncertain:tokens.filter(t=>t.score<.85),engine:window.WhiteboardCharacterReader&&mode!=='digits'?'local-emnist-cnn':'local-digits'};
}
// Reconcile the final recognised measurement with an independently supported
// superscript contour. This avoids re-decoding the numeric prefix after an
// earlier grammar has already recognised it successfully.
// Unified measurement route. Select a trained unit from a spatial suffix,
// then recognize ONLY the left-hand number. Older whole-phrase/unit heuristic
// paths are not allowed to override the trained unit when this route applies.
// A complete single closed loop is a zero candidate in a digit-only
// prefix. This avoids a digit CNN turning a clear handwritten 0 into 5.
function closedZeroInk(stroke,W,H){
 const pts=(stroke?.points||[]).map(p=>({x:p.x*W,y:p.y*H}));
 if(pts.length<12)return false;
 const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
 const lx=Math.min(...xs),rx=Math.max(...xs),ty=Math.min(...ys),by=Math.max(...ys),w=rx-lx,h=by-ty;
 if(w<8||h<12||w/h<.33||w/h>1.6)return false;
 if(Math.hypot(pts[0].x-pts.at(-1).x,pts[0].y-pts.at(-1).y)>Math.hypot(w,h)*.12)return false;
 const cx=(lx+rx)/2,cy=(ty+by)/2;
 let turns=0;
 for(let i=1;i<pts.length;i++){
  const a=Math.atan2(pts[i-1].y-cy,pts[i-1].x-cx),b=Math.atan2(pts[i].y-cy,pts[i].x-cx);
  let diff=b-a;if(diff>Math.PI)diff-=2*Math.PI;if(diff< -Math.PI)diff+=2*Math.PI;
  turns+=diff;
 }
 return Math.abs(turns)>=4.7&&Math.abs(turns)<=8.2;
}
// The ink before a unit may be a whole arithmetic statement, not just one
// quantity. Validate every operand/operator so a suffix cannot steal the final
// digit and leave an incomplete prefix such as "6 − 2 =".
function completeNumericExpression(text){
 const number='[−-]?\\d+(?:\\.\\d+)?',sum=number+'(?:[+−×÷]'+number+')*';
 return new RegExp('^'+sum+'(?:='+sum+')*$').test(String(text).replace(/\s+/g,''));
}
// Use the independent pen, digit and mixed-character models together for a
// numeric context. No arithmetic result is evaluated to choose a numeral.
async function recognizeNumericContext(strokes,W,H,options){
 if(!window.WhiteboardCharacterReader||!window.WhiteboardUjiReader)return null;
 let tokens=segment(strokes,W,H);
 if(!tokens.length||tokens.length>256||tokens.some(t=>!t.parts?.length))return null;
 const operators=['+','−','×','÷','='];
 const uji=parts=>window.WhiteboardUjiReader.read(parts.map(p=>p.points));
 // A disconnected left leg and right stem can be one open 4. Require two
 // independent classifiers to support the joined ink before merging it.
 for(let i=0;i<tokens.length-1;i++){
  const a=tokens[i],b=tokens[i+1];
  if(operators.includes(a.char)||operators.includes(b.char)||a.personal||b.personal)continue;
  const aa=bounds(a.parts),bb=bounds(b.parts),height=Math.max(aa.h,bb.h),parts=[...a.parts,...b.parts],both=bounds(parts);
  if(Math.min(aa.h,bb.h)<height*.55||bb.x-aa.x-aa.w>height*.40||both.w>height*1.5)continue;
  const pen=uji(parts);if(pen?.[0]?.label!=='4'||pen[0].p<.99)continue;
  const pixels=rasterDigit(parts),mixed=window.WhiteboardCharacterInference?.predict(pixels,'auto');
  const four=mixed?.find(p=>p.char==='4')?.score||0;
  if(four<.8&&predictDigit(pixels).find(p=>p.char==='4').score<.95)continue;
  tokens.splice(i,2,{char:'4',score:Math.min(pen[0].p,Math.max(four,.85)),parts,x:both.x,engine:'numeric-joined-four'});
 }
 const glyphs=tokens.filter(t=>!operators.includes(t.char)&&t.char!=='.');
 if(!glyphs.length)return null;
 const mixed=await readCharacters(glyphs.map(t=>rasterDigit(t.parts)),'auto',options);
 const hasOperator=tokens.some(t=>operators.includes(t.char));
 const newOperator=tokens.some(t=>t.engine==='local-operator-stroke-geometry');
 // An operator or a separately corroborated numeral establishes a numeric
 // neighbourhood; an isolated ambiguous letter has no such evidence.
 const numericNeighbour=hasOperator||options.measurementPrefix||glyphs.length>1&&glyphs.some((t,i)=>{
  const a=mixed[i]?.[0],p=uji(t.parts)?.[0];
  return /^\d$/.test(a?.char||'')&&a.score>=.90&&p?.label===a.char&&p.p>=.90;
 });
 const equivalents={O:'0',o:'0',I:'1',l:'1',Z:'2',z:'2',S:'5',s:'5',B:'8',g:'9',q:'9'};
 const familyVotes=(choices,label,weight)=>{
  const votes=Array.from({length:10},(_,i)=>({char:String(i),score:0}));
  for(const p of choices){const c=/^\d$/.test(p[label])?p[label]:equivalents[p[label]];if(c)votes[Number(c)].score+=p[weight];}
  return votes.sort((a,b)=>b.score-a.score);
 };
 for(let i=0;i<glyphs.length;i++){
  const token=glyphs[i],alpha=mixed[i],top=alpha[0],pen=uji(token.parts),best=pen?.[0];
  if(token.personal){if(!/^\d$/.test(token.char))return null;continue}
  // The dollar geometry can also describe an open 4. Repair it only when
  // the two independent readers explicitly agree on 4; preserve money signs.
  if(token.char==='$'&&!(top?.char==='4'&&top.score>=.8&&best?.label==='4'&&best.p>=.85))return null;
  // Clear alphabet evidence with a matching pen-reader letter is not a number.
  if(!hasOperator&&/^[A-Za-z]$/.test(top?.char||'')&&top.score>=.90&&
    !'BIOQSZiloqsz'.includes(top.char)&&best?.label.toLowerCase()===top.char.toLowerCase())return null;
  const digits=predictDigit(rasterDigit(token.parts)),digit=digits[0];
  let char=digit.char,score=digit.score;
  if(best&&/^\d$/.test(best.label)&&best.p>=.96&&best.p-(pen[1]?.p||0)>=.90){
   const support=alpha.reduce((sum,p)=>sum+((p.char===best.label||equivalents[p.char]===best.label)?p.score:0),0);
   // Strong pen evidence may resolve hooked 1s and open 4s even when the
   // image-only reader is uncertain. Keep the disagreement visible in score.
   if(best.label!==char){char=best.label;score=Math.min(best.p,Math.max(support,digits.find(p=>p.char===char).score));}
   else score=Math.min(best.p,Math.max(score,support));
  }else if(/^\d$/.test(top?.char||'')&&top.score>=.96&&
    (top.char===digit.char||best?.label===top.char&&best.p>=.70)){
   char=top.char;score=Math.min(top.score,Math.max(digits.find(p=>p.char===char).score,best?.label===char?best.p:0));
  }
  // In a structurally numeric neighbourhood, the mixed and pen models can
  // agree on the 5/S, 0/O or 1/I family even when neither ranks the digit first.
  // Keep this inference out of ordinary letter/word recognition.
  if(numericNeighbour){
   const imageFamily=familyVotes(alpha,'char','score'),penFamily=familyVotes(pen||[],'label','p');
   if(imageFamily[0].char===penFamily[0].char&&imageFamily[0].score>=.95&&penFamily[0].score>=.95&&
      imageFamily[0].score-imageFamily[1].score>=.90&&penFamily[0].score-penFamily[1].score>=.90){
    char=imageFamily[0].char;score=Math.min(imageFamily[0].score,penFamily[0].score);
   }
  }
  if(numericNeighbour&&best&&/^\d$/.test(best.label)&&best.p>=.90&&best.p-(pen[1]?.p||0)>=.85){
   const support=alpha.find(p=>p.char===best.label)?.score||0;
   if(support>=.05&&best.label!==char){char=best.label;score=Math.min(best.p,support);}
  }
  const support=alpha.reduce((sum,p)=>sum+((p.char===char||equivalents[p.char]===char)?p.score:0),0);
  const penAgrees=best?.label===char&&best.p>=.85;
  const strongLetter=/^[A-Za-z]$/.test(top?.char||'')&&!equivalents[top.char]&&top.score>=.75;
  if(strongLetter&&!penAgrees)return null;
  if(score<.55&&!penAgrees)return null;
  if(!hasOperator&&support<.10&&!penAgrees)return null;
  // A newly recovered sign establishes an operator, not the identity of every
  // remaining glyph. Preserve unsupported letters/units for normal review.
  if(newOperator&&support<.05&&!penAgrees)return null;
  Object.assign(token,{char,score,engine:'numeric-model-consensus'});
 }
 const text=tokens.map(t=>operators.includes(t.char)?' '+t.char+' ':t.char).join('').replace(/\s+/g,' ').trim();
 if(!completeNumericExpression(text))return null;
 return{text,tokens,uncertain:tokens.filter(t=>t.score<.85),engine:'local-numeric-ensemble',format:'number'};
}
async function readUnitPrefix(prefix,W,H,options,typedOnly=false){
 let read=await recognizeNumericContext(prefix.map(p=>p.raw),W,H,{...options,measurementPrefix:true});
 if(typedOnly&&!read)return null;
 try{read??=await recognizeCore(prefix.map(p=>p.raw),W,H,{...options,mode:'digits'})}catch(_){}
 if(!read||!completeNumericExpression(read.text)){
  const digits=readMeasuredDigits(prefix,W,H);
  if(!digits)return null;
  read={text:digits.value,tokens:digits.tokens,uncertain:[]};
 }
 let text=read.text,tokens=read.tokens||[];
 if(/^\d+$/.test(text)&&prefix.length===text.length){
  text=text.split('').map((digit,i)=>{
   if(digit==='0'||!closedZeroInk(prefix[i].raw,W,H))return digit;
   // An 8 can also close and turn through a full loop. Geometry must not
   // erase a nonzero digit independently supported by both existing models.
   const parts=[{size:Number(prefix[i].raw.size)||4,
    points:prefix[i].raw.points.map(p=>({x:p.x*W,y:p.y*H}))}];
   const pen=window.WhiteboardUjiReader?.read(parts.map(p=>p.points));
   const image=window.WhiteboardCharacterInference?.predict(rasterDigit(parts),'auto')?.[0];
   const supported=pen?.[0]?.label===digit&&pen[0].p>=.95&&
    pen[0].p-(pen[1]?.p||0)>=.90&&image?.char===digit&&image.score>=.90;
   return supported?digit:'0';
  }).join('');
  tokens=tokens.map((t,i)=>({...t,char:text[i]||t.char}));
 }
 return{text,tokens,uncertain:read.uncertain||[]};
}
function groupUnitInk(baseline){
 const groups=baseline.map(p=>[p.scaled]);let merged=true;
 while(merged){
  merged=false;
  for(let i=0;i<groups.length&&!merged;i++)for(let j=i+1;j<groups.length;j++){
   const a=bounds(groups[i]),b=bounds(groups[j]),h=Math.max(a.h,b.h),both=bounds([...groups[i],...groups[j]]);
   const overlap=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x);
   // Join overlapping strokes of one letter, not merely adjacent letters.
  // Two separate handwritten glyphs (especially c + m) must retain their
  // own character evidence instead of becoming a synthetic wide m.
  const substantialOverlap=overlap>Math.min(a.w,b.w)*.12;
  const oneSmallStroke=Math.min(a.w,b.w)<h*.20&&overlap>=-Math.max(1,h*.02);
  // Contiguous pen lifts may leave six independent lines in one m. Shared
  // endpoints establish connectivity even when the strokes do not overlap.
  const connected=groups[i].some(s=>groups[j].some(t=>[s.points[0],s.points.at(-1)].some(p=>
    [t.points[0],t.points.at(-1)].some(q=>Math.hypot(p.x-q.x,p.y-q.y)<=Math.max(.75,h*.008)))));
  if((substantialOverlap||oneSmallStroke||connected&&both.w<h*1.6)&&both.w<h*2.1&&Math.abs(a.cy-b.cy)<h*.65){
    groups[i].push(...groups[j]);groups.splice(j,1);merged=true;break;
   }
  }
 }
 return groups.sort((a,b)=>bounds(a).cx-bounds(b).cx);
}
// A pen lift can leave the diagonals of a k (or arches of an m) disconnected.
// Test compact multi-stroke alternatives with both existing models. Ordinary
// spaces between distinct unit letters are too large for this exception.
function groupMeasurementInk(items){
 const groups=groupUnitInk(items);
 if(!window.WhiteboardCharacterInference||!window.WhiteboardUjiReader)return groups;
 for(let count=Math.min(3,groups.length);count>=2;count--){
  for(let i=0;i+count<=groups.length;i++){
   const candidate=groups.slice(i,i+count),parts=candidate.flat(),box=bounds(parts);
   if(parts.length>4||box.h<14||box.w>box.h*1.25)continue;
   const boxes=candidate.map(bounds).sort((a,b)=>a.x-b.x);
   let right=boxes[0].x+boxes[0].w,close=true;
   for(const b of boxes.slice(1)){
    if(b.x-right>box.h*.12){close=false;break}
    right=Math.max(right,b.x+b.w);
   }
   if(!close)continue;
   const image=window.WhiteboardCharacterInference.predict(rasterDigit(parts),'lowercase');
   const best=image[0];
   if(!['k','m'].includes(best?.char)||best.score<.98||best.score-(image[1]?.score||0)<.95)continue;
   const pen=window.WhiteboardUjiReader.read(parts.map(p=>p.points));
   if(pen?.[0]?.label.toLowerCase()!==best.char)continue;
   const same=pen.reduce((sum,p)=>sum+(p.label.toLowerCase()===best.char?p.p:0),0);
   const other=pen.find(p=>p.label.toLowerCase()!==best.char)?.p||0;
   if(same<.97||same-other<.90)continue;
   groups.splice(i,count,parts);i=Math.max(-1,i-1);
  }
 }
 return groups;
}
function completeUnitProposal(proposals){
 const complete=proposals.filter(p=>!proposals.some(q=>q.word.length>p.word.length&&
  q.word.endsWith(p.word)&&q.score>=p.score-.03&&q.raised.length===p.raised.length&&
  q.raised.every((raw,i)=>raw===p.raised[i])));
 // Compare complete readings rather than accepting the first unit template.
 // Repeated segmentations supporting the same reading contribute evidence,
 // but never override a clearly stronger competing character prediction.
 const candidates=new Map();
 for(const p of complete){
  const key=p.text.replace(/\\s+/g,' ').trim();
  const prior=candidates.get(key);
  if(!prior)candidates.set(key,{...p,support:1});
  else{
   prior.support++;
   if(p.score>prior.score){
    const count=prior.support;
    candidates.set(key,{...p,support:count});
   }
  }
 }
 const ranked=[...candidates.values()].sort((a,b)=>
  (b.score+Math.min(b.support-1,2)*.005)-(a.score+Math.min(a.support-1,2)*.005));
 const best=ranked[0],runner=ranked[1];
 if(!best)return null;
 // Abstain on genuine unit/power disagreements; preserve the existing
 // 0.03 margin and never silently force cm² into cm³ (or vice versa).
 const bestEvidence=best.score+Math.min(best.support-1,2)*.005;
 const runnerEvidence=runner?runner.score+Math.min(runner.support-1,2)*.005:-Infinity;
 return bestEvidence-runnerEvidence<.03?null:best;
}
async function readUnitLetters(groups,options,measurement=false){
 const alpha=await readCharacters(groups.map(rasterDigit),'lowercase',options);
 return groups.map((parts,i)=>{
  const choices=alpha[i],top=choices[0];if(!top)return null;
  let char=top.char,score=top.score,confidence=top.score,penLabel='',agreed=false,penOnly=false;
  const strong=top.score>=.95&&top.score-(choices[1]?.score||0)>=.50;
  if(window.WhiteboardUjiReader){
   const pen=window.WhiteboardUjiReader.read(parts.map(p=>p.points)),best=pen?.[0];
   penLabel=best?.label||'';
   if(!strong&&/^[A-Za-z]$/.test(penLabel)){
    const wanted=penLabel.toLowerCase(),support=choices.find(p=>p.char===wanted)?.score||0;
    const margin=best.p-(pen[1]?.p||0);
    const trustedPen=best.p>=.985&&margin>=.95;
    // Within a complete measurement, pen evidence can resolve m/w and l/e.
    // Keep the conflicting image score visible instead of inventing confidence.
    const unitLetter=measurement&&['m','l'].includes(wanted);
    agreed=measurement&&wanted===top.char&&support>=.45&&best.p>=.98&&margin>=.95;
    if(trustedPen&&(support>=.10||best.p>.9995||unitLetter)||agreed){
     char=wanted;score=best.p;confidence=Math.min(best.p,support);
     penOnly=unitLetter&&support<.10;
    }
   }
  }
  return{char,score,confidence,penLabel,penOnly,trusted:strong||score>=.985||agreed,
   // A narrow final l in ml shares its contour with 1/I. The m supplies the
   // letter context; its uncertainty remains visible to the teacher.
   narrowL:char==='l'&&top.char==='l'&&top.score>=.55&&top.score-(choices[1]?.score||0)>=.20};
 });
}
async function recognizeIsolatedPenLetter(strokes,W,H,options){
 if(!window.WhiteboardUjiReader||!window.WhiteboardCharacterReader||strokes.length>5)return null;
 const items=strokes.map(raw=>({scaled:{size:Number(raw.size)||4,points:raw.points.map(p=>({x:p.x*W,y:p.y*H}))}}));
 const groups=groupUnitInk(items);if(groups.length!==1)return null;
 const b=bounds(groups[0]);if(b.h<10||b.w>b.h*1.7)return null;
 const pen=window.WhiteboardUjiReader.read(groups[0].map(p=>p.points)),best=pen?.[0];
 if(!best||!/^[A-Za-z]$/.test(best.label)||best.p<.985||best.p-(pen[1]?.p||0)<.95)return null;
 const letters=await readUnitLetters(groups,options),chosen=letters[0];
 if(!chosen||chosen.char!==best.label.toLowerCase()||!chosen.trusted)return null;
 const token={char:best.label,score:chosen.confidence,parts:groups[0],x:b.x};
 return{text:best.label,tokens:[token],uncertain:token.score<.85?[token]:[],engine:'local-pen-letter-consensus',format:'letter'};
}
// Baseline units use the same independent letters as powered units. A coarse
// whole-unit template must not turn a clearly read c into a second m.
function reviewCompoundUnit(groups,letters,suffix,prefix,W,H){
 if(groups.length!==2||!window.WhiteboardTeacherUnits?.rank||!window.WhiteboardCharacterInference||!window.WhiteboardUjiReader)return null;
 const ranked=window.WhiteboardTeacherUnits.rank(suffix.map(p=>p.raw),W,H,
  {only:['mm','cm','km','m','mg','kg','g','ml','L','min','s','h']});
 const best=ranked[0],runner=ranked[1];
 if(!best||!['cm','km','kg','mg','ml'].includes(best.label)||best.score<.82||
    best.score-(runner?.score||0)<.06)return null;
 const word=best.label,boxes=groups.map(bounds),body=bounds(suffix.map(p=>p.scaled)),numeric=bounds(prefix.map(p=>p.scaled));
 if(word.endsWith('g')&&body.y+body.h<numeric.y+numeric.h+Math.max(body.h,numeric.h)*.09)return null;
 const scores=[],anchors=[];
 for(let i=0;i<groups.length;i++){
  const image=window.WhiteboardCharacterInference.predict(rasterDigit(groups[i]),'auto');
  const pen=window.WhiteboardUjiReader.read(groups[i].map(p=>p.points));
  const a=image.reduce((n,p)=>n+(p.char.toLowerCase()===word[i]?p.score:0),0);
  const b=pen.reduce((n,p)=>n+(p.label.toLowerCase()===word[i]?p.p:0),0);
  scores.push(Math.max(a,b));anchors.push(a>=.95||b>=.95);
 }
 // A short m followed by a taller narrow cursive l can look like Me/MC to
 // the letter models. Require the existing full-unit prototype as additional
 // evidence, and keep the disputed final letter explicitly marked for review.
 const cursiveMl=word==='ml'&&best.score>=.85&&letters[0]?.char==='m'&&letters[0].trusted&&
  boxes[1].h>=boxes[0].h*1.20&&boxes[1].w<=boxes[1].h*.55;
 if(!anchors.some(Boolean)||scores.some((p,i)=>p<.45&&!(cursiveMl&&i===1)))return null;
 return{word,score:best.score,confidence:scores};
}
async function recognizeBaseUnitComponents(strokes,W,H,options){
 if(!window.WhiteboardCharacterReader||strokes.length<2||strokes.length>32)return null;
 const items=strokes.map(raw=>{
  const scaled={size:Number(raw.size)||4,points:raw.points.map(p=>({x:p.x*W,y:p.y*H}))};
  return{raw,scaled,box:bounds([scaled])};
 }).sort((a,b)=>a.box.cx-b.box.cx),proposals=[];
 for(let count=1;count<=Math.min(8,items.length-1);count++){
  const suffix=items.slice(-count),prefix=items.slice(0,-count);
  if(closedZeroInk(suffix[0].raw,W,H))continue;
  const groups=groupMeasurementInk(suffix);
  if(!groups.length||groups.length>2)continue;
  const boxes=groups.map(bounds),body=bounds(suffix.map(p=>p.scaled));
  if(body.h<10||prefix.at(-1).box.cx>=body.x+Math.min(3,body.w*.05))continue;
  if(boxes.some(b=>Math.abs(b.y+b.h-body.y-body.h)>body.h*.35))continue;
  const letters=await readUnitLetters(groups,options,true);
  let word=letters.map(r=>r?.char).join('');
  if(word==='l'&&letters[0].penLabel==='L')word='L';
  let review=null;
  if(!['m','cm','km','kg','mg','ml','g','L'].includes(word)||
    letters.some((r,i)=>!r||!r.trusted&&!(word==='ml'&&i===1&&r.narrowL))){
   review=reviewCompoundUnit(groups,letters,suffix,prefix,W,H);
   if(!review)continue;
   word=review.word;
  }
  if(word==='ml'&&letters[1].penOnly&&
    (boxes[1].h<boxes[0].h*1.15||boxes[1].w>boxes[1].h*.90))continue;
  const read=await readUnitPrefix(prefix,W,H,options,true);if(!read)continue;
  // A standalone g needs the visible descender that separates it from 6/9.
  if(word==='g'){
   const numeric=bounds(prefix.map(p=>p.scaled));
   if(body.y+body.h<numeric.y+numeric.h+numeric.h*.10)continue;
  }
  const unitTokens=groups.map((parts,i)=>({parts,char:word[i],score:review?review.confidence[i]:letters[i].confidence}));
  proposals.push({word,review:!!review,raised:[],text:read.text+' '+word,
   uncertain:[...read.uncertain,...unitTokens.filter(t=>t.score<.85),
    ...(review?[{char:'?',score:0,parts:[],engine:'compound-unit-review'}]:[])],
   score:review?review.score:Math.min(...letters.map(r=>r.score)),tokens:[...read.tokens,...unitTokens]});
 }
 const best=completeUnitProposal(proposals);
 return best?{text:best.text,tokens:best.tokens,uncertain:best.uncertain,
  engine:best.review?'unit-first-compound-review':'unit-first-letter-components',format:'unit'}:null;
}
// A new writing style may be distant from a complete-unit template. Keep the
// raised ink separate and read the unit letters and exponent independently.
// Never let ordinary text segmentation merge m and its power into a W.
async function recognizeUnitComponents(strokes,W,H,options){
 if(!window.WhiteboardCharacterReader||strokes.length<2||strokes.length>18)return null;
 const items=strokes.map(raw=>{
  const scaled={size:Number(raw.size)||4,points:raw.points.map(p=>({x:p.x*W,y:p.y*H}))};
  return{raw,scaled,box:bounds([scaled])};
 }).sort((a,b)=>a.box.cx-b.box.cx);
 const proposals=[];
 for(let count=2;count<=Math.min(10,items.length);count++){
  const suffix=items.slice(-count),prefix=items.slice(0,-count);
  if(closedZeroInk(suffix[0].raw,W,H))continue;
  for(let upperCount=1;upperCount<=Math.min(3,suffix.length-1);upperCount++){
  const raised=suffix.slice(-upperCount),baseline=suffix.slice(0,-upperCount);
  const rb=bounds(raised.map(p=>p.scaled)),bb=bounds(baseline.map(p=>p.scaled));
  const tall=Math.max(bb.h,...prefix.map(p=>p.box.h));
  // A true superscript sits above the baseline's visual centre and occupies
  // less vertical space than the tallest baseline glyph. Short unit x-heights
  // must not exclude a clearly raised power. Reject ambiguous suffix splits.
  const baselineBottom=bb.y+bb.h,raisedBottom=rb.y+rb.h;
  const verticalLift=(baselineBottom-raisedBottom)/Math.max(1,bb.h);
  const raisedHeightRatio=rb.h/Math.max(1,tall);
  if(verticalLift<.28||raisedHeightRatio>.72)continue;
  // Cut the complete right-hand exponent from the complete unit body. Small
  // finishing strokes or the top of a multi-stroke m are not separate powers.
  if(bb.h<10||rb.h<6||rb.w<3||rb.h>tall*.85||
    rb.cx<=bb.cx||rb.x<bb.x+bb.w*.60||rb.cy>=bb.cy-tall*.12||
    rb.y+rb.h>bb.y+bb.h*.70)continue;
  if(prefix.length&&bounds(prefix.map(p=>p.scaled)).cx>=bounds(baseline.map(p=>p.scaled)).cx)continue;
  const upperRaster=rasterDigit(raised.map(p=>p.scaled)),powerChoices=predictDigit(upperRaster);
  // The exponent is an independent glyph. A clear 3 contour may rescue an
  // image-classifier 2, but only for a single complete raised stroke; do not
  // interpret one stroke of a multi-stroke exponent as a complete character.
  const contour3=raised.length===1&&raisedThreeContour(raised[0].raw,W,H);
  const contour2=raised.length===1&&raisedTwoShape(raised[0].raw,W,H);
  let power=powerChoices[0];
  if(contour3&&!contour2&&power?.char==='2'&&power.score<.94){
   power={char:'3',score:.90,evidence:.90};
  }else if(contour2&&!contour3&&power?.char==='3'&&power.score<.94){
   power={char:'2',score:.90,evidence:.90};
  }
  if(!['2','3'].includes(power?.char)||power.score<.90){
   const pen=window.WhiteboardUjiReader?.read(raised.map(p=>p.scaled.points)),best=pen?.[0];
   if(!best||!['2','3'].includes(best.label)||best.p<.985||best.p-(pen[1]?.p||0)<.95)continue;
   const image=window.WhiteboardCharacterInference?.predict(upperRaster,'auto');
   const support=Math.max(powerChoices.find(p=>p.char===best.label)?.score||0,
     image?.find(p=>p.char===best.label)?.score||0);
   if(support<.10)continue;
   power={char:best.label,score:Math.min(best.p,support),evidence:best.p};
  }
  // Group only the unit's ink. A wide m written in two strokes must not be
  // split by the numeric segmenter's narrower glyph-width limit.
  const groups=groupMeasurementInk(baseline);
  const tokens=groups.map(parts=>({parts}));
  if(!tokens.length||tokens.length>2)continue;
  const letters=await readUnitLetters(groups,options,true),word=letters.map(r=>r?.char).join('');
  if(!['m','cm','km'].includes(word)||letters.some(r=>!r?.trusted))continue;
  let number='',numberTokens=[],numberUncertain=[];
  if(prefix.length){
   const read=await readUnitPrefix(prefix,W,H,options);
   if(!read)continue;
   number=read.text;
   numberTokens=read.tokens;
   numberUncertain=read.uncertain;
  }
  const exponent=power.char==='2'?'²':'³';
  const unitTokens=[...tokens.map((t,i)=>({...t,char:word[i],score:letters[i].confidence})),
    {char:exponent,score:power.score,parts:raised.map(p=>p.scaled)}];
  proposals.push({word,raised:raised.map(p=>p.raw),uncertain:[...numberUncertain,...unitTokens.filter(t=>t.score<.85)],text:(number?number+' ':'')+word+exponent,score:Math.min(power.evidence||power.score,...letters.map(r=>r.score)),
   tokens:[...numberTokens,...unitTokens]});
  }
 }
 // A confidently read cm/mm/km is one complete unit. Do not also count its
 // first letter as a numeric digit (c -> 5) and manufacture ambiguity with m.
 // Both candidates must use the identical complete superscript ink.
 const best=completeUnitProposal(proposals);
 if(!best)return null;
 return{text:best.text,tokens:best.tokens,uncertain:best.uncertain,engine:'unit-first-components',format:'unit'};
}
async function recognizeUnitFirst(strokes,W,H,options){
 const teacher=window.WhiteboardTeacherUnits;
 if(!teacher||strokes.length<3||strokes.length>18)return null;
 const sorted=strokes.map(raw=>{
  if(!raw?.points?.length)return null;
  const ink={points:raw.points.map(p=>({x:p.x*W,y:p.y*H}))};
  return{raw,box:bounds([ink])};
 });
 if(sorted.some(p=>!p))return null;
 sorted.sort((a,b)=>a.box.cx-b.box.cx);
 const area=['cm²','m²','km²','cm³','m³'];
 const hypotheses=[];
 // Compound units can take more than one pen stroke; search plausible suffixes.
 // Prefer long trained units over raw character-by-character interpretations.
 for(let n=Math.min(8,sorted.length-1);n>=2;n--){
  const suffix=sorted.slice(-n),prefix=sorted.slice(0,-n);
  const final=suffix.at(-1);
  // A dot or a finishing stroke can lie between the unit body and its power.
  // Compare against the full-height body, rather than the adjacent pen stroke.
  const preceding=suffix.slice(0,-1).reduce((a,b)=>a.box.h>b.box.h?a:b);
  if(closedZeroInk(suffix[0].raw,W,H))continue;
  const tall=Math.max(...prefix.map(p=>p.box.h),preceding.box.h);
  const raised=final.box.h>=8&&final.box.h<tall*.78
    &&final.box.cx>preceding.box.cx
    &&final.box.cy<preceding.box.cy-tall*.12;
  if(!raised)continue;
  const candidates=teacher.rank(suffix.map(p=>p.raw),W,H,{only:area});
  const best=candidates[0],runner=candidates[1];
  const base=best?.label.replace(/[²³]$/,'');
  const otherBase=candidates.find(x=>x.label.replace(/[²³]$/,'')!==base);
  const supportedBase=best&&runner&&base===runner.label.replace(/[²³]$/,'')&&
    best.score>=.70&&best.score-(otherBase?.score??0)>=.10;
  const raisedParts=suffix.filter(p=>p.box.h<tall*.78&&
    p.box.cx>preceding.box.cx&&p.box.cy<preceding.box.cy-tall*.12);
  const contourThree=raisedParts.length===1&&raisedThreeContour(final.raw,W,H);
  // The exponent model was trained on single strokes. A two-stroke ² must
  // retain the complete unit's label instead of classifying half of its ink.
  const trainedPower=raisedParts.length===1?window.WhiteboardUnitExponent?.match?.(final.raw,W,H):null;
  const margin=best?best.score-(runner?.score??0):0;
  let unit=best&&((best.score>=.90&&margin>=.04)||
    (best.score>=.86&&margin>=.09))?best.label:null;
  // Prefer the actual single-stroke exponent trained from m²/m³ samples.
  // This is independent of the older two-stroke ²/³ training.
  if(trainedPower&&best&&(best.score>=.74||supportedBase)&&best.score<.95&&/[²³]$/.test(best.label)){
   // A misleading raised 2 can resemble a 3. When the trained complete
   // unit strongly favours squared and contour evidence for 3 is absent,
   // do not silently turn a genuine square unit into a cube unit.
   const cubic=best.label.endsWith('³')?best:
     candidates.find(x=>x.label===best.label.replace('²','³'));
   const contradictsSquare=trainedPower.label==='³'&&best.label.endsWith('²')&&
     best.score>=.83&&best.score-(cubic?.score??0)>.16&&!contourThree;
   // When the full unit reads squared but the isolated exponent votes cubed,
   // require independent three-lobe contour evidence before changing ² to ³.
   // A disagreement without that evidence is not a reliable cubic reading.
   const unsupportedCube=trainedPower.label==='³'&&best.label.endsWith('²')&&!contourThree;
   if(unsupportedCube){
    const square=candidates.find(x=>x.label===best.label.replace('³','²'));
    const cubicScore=cubic?.score||0;
    if(best.score>=.83&&best.score-cubicScore>=.08)unit=best.label;
    else unit=null;
   }else if(!contradictsSquare)unit=best.label.replace(/[²³]$/,trainedPower.label);
   else if(best.score<.90)unit=null;
  }
  // Trained unit labels establish the base unit; corroborated contour may
  // distinguish a raised 3 from a 2 when prototypes are close.
  if(!trainedPower&&contourThree&&best&&best.score>=.80){
   const cubic=best.label.endsWith('³')?best:
     candidates.find(x=>x.label===best.label.replace('²','³'));
   if(cubic&&cubic.score>=best.score-.13)unit=cubic.label;
  }
  if(!unit&&best&&best.score>=.78&&runner&&
     best.label.replace(/[²³]$/,'')===runner.label.replace(/[²³]$/,'')){
   // Preserve the identified base unit, but do not invent an exponent.
   unit=best.label.replace(/[²³]$/,'')+'?';
  }
  if(!unit)continue;
  hypotheses.push({prefix,unit,score:best.score});
 }
 // Compare all plausible spatial boundaries before consuming the numeric ink.
 // A weak longer unit must not steal a digit from a better shorter match.
 hypotheses.sort((a,b)=>b.score-a.score);
 let uncertainPrefix=null;
 for(const {prefix,unit} of hypotheses){
  const read=await readUnitPrefix(prefix,W,H,options);
  if(!read){
   // Keep searching: an over-wide unit candidate may have consumed a digit.
   // This fallback must also give the independent component reader a turn.
   uncertainPrefix??={text:'? '+unit,engine:'unit-first-number-uncertain',format:'unit',
     tokens:[],uncertain:[{char:'?',score:0,parts:[]}]};
   continue;
  }
  return{text:read.text+' '+unit,engine:'unit-first-trained-measurement',format:'unit',
    tokens:read.tokens,uncertain:[...read.uncertain,...(unit.endsWith('?')?[{char:'?',score:0,parts:[]}]:[])]};
 }
 return uncertainPrefix;
}
// Standalone parenthesised numbers must be read as a spatial expression,
// before the generic digit-sequence model can turn (10) into 1101.
async function detectParenthesizedNumber(strokes,W,H,options={}){
 if(strokes.length<3||strokes.length>64)return null;
 const parts=strokes.map(raw=>({raw,scaled:{source:raw,size:Number(raw.size)||4,
  points:raw.points.map(p=>({x:p.x*W,y:p.y*H}))}}));
 const ordered=parts.map(p=>({...p,box:bounds([p.scaled])})).sort((a,b)=>a.box.cx-b.box.cx);
 const left=ordered[0],right=ordered.at(-1);
 if(radicalParenthesis(left.scaled)!=='('||radicalParenthesis(right.scaled)!==')')return null;
 const middle=ordered.slice(1,-1);
 if(!middle.length)return null;
 const interior=bounds(middle.map(p=>p.scaled));
 const height=Math.min(left.box.h,right.box.h);
 if(interior.x<=left.box.cx||interior.x+interior.w>=right.box.cx||
    interior.h<height*.22||interior.h>height*1.1||
    Math.abs(left.box.cy-right.box.cy)>height*.30)return null;
 let number=await recognizeNumericContext(middle.map(p=>p.raw),W,H,{...options,measurementPrefix:true});
 // The brackets themselves establish numeric context. If the strict
 // multi-model reader abstains, retain individual digit predictions and
 // explicitly flag the weaker result for teacher confirmation.
 if(!number){
  const recovered=[];
  for(const part of middle){
   const guesses=predictDigit(rasterDigit([part.scaled]));
   const guess=guesses?.[0];
   if(!guess||!/^[0-9]$/.test(guess.char)||guess.score<.48)return null;
   recovered.push({char:guess.char,score:Math.min(.74,guess.score),parts:[part.scaled],engine:'parenthesis-digit-fallback'});
  }
  number={text:recovered.map(t=>t.char).join(''),tokens:recovered,uncertain:recovered};
 }
 if(!/^[0-9]+$/.test(number.text))return null;
 return{text:'('+number.text+')',tokens:[{char:'(',score:.94,parts:[left.scaled]},
  ...number.tokens,{char:')',score:.94,parts:[right.scaled]}],
  uncertain:number.uncertain||[],engine:'local-parenthesized-number',format:'math'};
}
async function recognizeBeforeContext(strokes,W,H,options={}){
 options={...options,mode:options.mode||'auto'};
 if(!Array.isArray(strokes)||!Number.isFinite(W)||!Number.isFinite(H)||W<1||H<1||
    strokes.length>180||strokes.reduce((n,s)=>n+(s?.points?.length||0),0)>16000||
    strokes.some(s=>!Array.isArray(s?.points)||!s.points.length||
     s.points.some(p=>!Number.isFinite(p?.x)||!Number.isFinite(p?.y)))){
  throw Error('Select valid pen strokes and try again.');
 }
 // Confirmed personal ink must precede every trained model and unit heuristic.
 // Otherwise Learn & Test Again could save a correction that is never consulted.
 const learned=window.WhiteboardHandwritingLearning?.matchInk?.(strokes,W,H,options.mode,rasterDigit);
 if(learned)return{text:learned.text,tokens:[],uncertain:[],engine:'local-personal-ink',
  format:options.mode==='math'?'latex':'personal'};
 const reconcile=reading=>{
  const corrected=window.WhiteboardHandwritingLearning?.matchContext?.(
   strokes,W,H,options.mode,rasterDigit,reading?.text);
  return corrected&&corrected.text!==reading?.text?{text:corrected.text,tokens:[],uncertain:[],
   engine:'local-personal-context',format:options.mode==='math'?'latex':'personal'}:reading;
 };
 const equal=window.WhiteboardEqualSign?.detect?.(strokes,W,H);
 if(equal)return reconcile(equal);
 const mathRecognizer=options.mathRecognizer||window.WhiteboardInkOnOriginalDemo?.recognize;
 if(options.mode==='math'&&typeof mathRecognizer==='function'){
  return reconcile(await mathRecognizer(strokes,W,H,options));
 }
 if((options.mode||'auto')==='auto'){
  const radical=await detectSquareRoot(strokes,W,H,options);
  if(radical)return reconcile(radical);
  const parenthesized=await detectParenthesizedNumber(strokes,W,H,options);
  if(parenthesized)return reconcile(parenthesized);
  // A complete stacked layout outranks whole-symbol silhouettes such as ¼.
  // Personal ink/context corrections still have their normal precedence.
  const fraction=await detectStackedFraction(strokes,W,H,options);
  if(fraction)return reconcile(fraction);
  // Imported confusable corrections and the trained dotted j retain their
  // existing priority over generic isolated-character inference.
  const confusable=window.WhiteboardTeacherConfusables?.match?.(strokes,W,H,'auto',.955,.08);
  if(confusable)return reconcile({text:confusable.text,tokens:[],uncertain:[],engine:confusable.engine,format:'letter'});
  const trainedJ=window.WhiteboardTrainedJ?.detect?.(strokes,W,H);
  if(trainedJ)return reconcile({...trainedJ,tokens:[],uncertain:[]});
  if(strokes.length<=4&&window.WhiteboardDigitModel){
   const geometry=segment(strokes,W,H);
   if(geometry.length===1&&['+','−','×','÷','='].includes(geometry[0].char))
    return reconcile({text:geometry[0].char,tokens:geometry,uncertain:[],engine:'local-operator-geometry',format:'symbol'});
  }
  // Preserve a taught complete powered unit before looking for a number;
  // its first letter must not be consumed as a numeric prefix.
  const notation=window.WhiteboardTeacherUnits?.match?.(strokes,W,H,{minScore:.94,minMargin:.045});
  if(notation&&/^(?:mm|cm|km|m)[²³]$/.test(notation.text))return reconcile(notation);
  // Read the prefix, unit letters and complete raised exponent independently
  // before consulting whole-unit silhouettes. A confident whole-unit match
  // can otherwise replace a correctly read m with cm, or a cube with a square.
  // Standalone taught powers and personal corrections retain their priority.
  const components=await recognizeUnitComponents(strokes,W,H,options);
  if(components)return reconcile(components);
  // Retain trained whole-unit recognition when the component reader abstains.
  // A raised measurement still precedes a whole-selection word such as min.
  const measured=await recognizeUnitFirst(strokes,W,H,options);
  if(measured&&!measured.uncertain?.length)return reconcile(measured);
  // Preserve the existing whole-selection teaching priority over generic
  // digit and letter inference for standalone taught units and symbols.
  if(notation){
   // A complete numeric prefix plus independently read unit letters is
   // stronger measurement structure than a whole-selection word silhouette.
   const baseline=await recognizeBaseUnitComponents(strokes,W,H,options);
   if(baseline)return reconcile(baseline);
   return reconcile(notation);
  }
  if(loopedStandaloneL(strokes,W,H)){
   const taught=window.WhiteboardTeacherUnits?.rank?.(strokes,W,H,{only:['L']})?.[0];
   if(taught?.label==='L'&&taught.score>=.85){
    const parts=strokes.map(raw=>({source:raw,size:Number(raw.size)||4,points:raw.points.map(p=>({x:p.x*W,y:p.y*H}))}));
    const token={char:'L',score:taught.score,parts};
    return reconcile({text:'L',tokens:[token],uncertain:[],engine:'trained-cursive-l-consensus',format:'unit'});
   }
  }
  const letter=await recognizeIsolatedPenLetter(strokes,W,H,options);
  if(letter)return reconcile(letter);
  // A raised exponent is stronger structural evidence than a plain baseline
  // unit. Do not let a partial unit reading silently drop the final power.
  // Preserve the original ink and surface an uncertain exponent for review.
  const ordered=strokes.map(raw=>{
   const scaled={points:raw.points.map(p=>({x:p.x*W,y:p.y*H})),size:Number(raw.size)||4};
   return{raw,box:bounds([scaled])};
  }).sort((a,b)=>a.box.cx-b.box.cx);
  const exponent=ordered.at(-1),preceding=ordered.slice(0,-1);
  if(exponent&&preceding.length>=2){
   const height=Math.max(...preceding.map(p=>p.box.h));
   const nearest=preceding.at(-1),e=exponent.box;
   const raised=e.h>=7&&e.h<height*.78&&e.cx>nearest.box.cx&&
    e.cy<nearest.box.cy-height*.12;
   if(raised){
    const body=await recognizeBaseUnitComponents(preceding.map(p=>p.raw),W,H,options);
    if(body&&/^\d+(?:\.\d+)? (?:mm|cm|km|m)$/.test(body.text)){
     const shape3=raisedThreeContour(exponent.raw,W,H);
     const shape2=raisedTwoShape(exponent.raw,W,H);
     const digits=predictDigit(rasterDigit([{points:exponent.raw.points.map(p=>({x:p.x*W,y:p.y*H})),size:Number(exponent.raw.size)||4}]));
     const best=digits[0],runner=digits[1];
     const agreed=best&&['2','3'].includes(best.char)&&best.score>=.90&&
       best.score-(runner?.score||0)>=.30;
     const power=shape3&&!shape2?'³':shape2&&!shape3?'²':
       agreed?(best.char==='2'?'²':'³'):'?';
     const token={char:power,score:power==='?'?0:shape2||shape3?.93:best.score,
       parts:[{points:exponent.raw.points.map(p=>({x:p.x*W,y:p.y*H})),size:Number(exponent.raw.size)||4}]};
     return reconcile({...body,text:body.text+power,tokens:[...(body.tokens||[]),token],
       uncertain:[...(body.uncertain||[]),...(power==='?'?[token]:[])],
       engine:'unit-first-raised-suffix',format:'unit'});
    }
   }
  }
  const baseUnit=await recognizeBaseUnitComponents(strokes,W,H,options);
  if(baseUnit)return reconcile(baseUnit);
  const numeric=await recognizeNumericContext(strokes,W,H,options);
  if(numeric)return reconcile(numeric);
  if(measured)return reconcile(measured);
 }
 const original=await recognizeCore(strokes,W,H,options);
 // For a quantity with an explicitly raised final glyph, do not let older
 // baseline grammar silently force squared/cubed if new trained unit abstains.
 if((options.mode||'auto')==='auto'&&/^\d+(?:\.\d+)?\s+(?:mm|cm|km|m)[²³]$/.test(original?.text||'')){
  const items=strokes.map(raw=>({raw,box:bounds([{points:raw.points.map(p=>({x:p.x*W,y:p.y*H}))}])})).sort((a,b)=>a.box.cx-b.box.cx);
  const last=items.at(-1),prior=items.at(-2);
  if(last&&prior&&last.box.cy<prior.box.cy&&raisedThreeContour(last.raw,W,H)){
   // A strongly identifiable 3 must never be silently replaced by ².
   return reconcile({...original,text:original.text.replace(/[²³]$/,'³'),engine:'raised-three-safety'});
  }
 }
 return reconcile(original);
}

// Compare complete, spatially valid measurement hypotheses after the existing
// readers have produced their result. Each hypothesis must consume all ink.
async function recognizeWithContext(strokes,W,H,options,reading){
 const context=window.WhiteboardHandwritingContext;
 if(!context||options.context===false||(options.mode||'auto')!=='auto'||
  !window.WhiteboardCharacterReader||!window.WhiteboardUjiReader||
  strokes.length<2||strokes.length>32||reading?.format==='latex'||
  /personal|teacher-confusable|teacher-unit-operator|trained-cursive|local-operator/.test(reading?.engine||'')||
  !/[0-9?]/.test(reading?.text||''))return reading;
 // The context model has no basis for changing a clear number or arithmetic
 // statement. In particular, it never evaluates an equation to pick an answer.
 if(completeNumericExpression(reading.text)&&!reading.uncertain?.length&&
  /numeric-ensemble|primary-arithmetic|primary-digit/.test(reading.engine||''))return reading;
 const items=strokes.map((raw,index)=>{
  const scaled={source:raw,index,size:Number(raw.size)||4,points:raw.points.map(p=>({x:p.x*W,y:p.y*H}))};
  return{raw,scaled,box:bounds([scaled])};
 }).sort((a,b)=>a.box.cx-b.box.cx);
 const layouts=[],groupsByKey=new Map(),key=parts=>parts.map(p=>p.index).sort((a,b)=>a-b).join(',');
 for(let count=1;count<=Math.min(11,items.length-1);count++){
  const suffix=items.slice(-count),prefix=items.slice(0,-count),pb=bounds(prefix.map(p=>p.scaled));
  for(let upper=0;upper<=Math.min(3,suffix.length-1);upper++){
   const body=upper?suffix.slice(0,-upper):suffix,raised=upper?suffix.slice(-upper):[];
   const bb=bounds(body.map(p=>p.scaled)),height=Math.max(pb.h,bb.h);
   if(bb.h<10||pb.h<12||pb.x+pb.w>bb.x+Math.max(2,height*.025)||
    bb.h>pb.h*1.4||closedZeroInk(body[0].raw,W,H))continue;
   const groups=groupUnitInk(body);if(!groups.length||groups.length>3)continue;
   if(groups.some(g=>bounds(g).h<height*.22))continue;
   if(raised.length){
    const rb=bounds(raised.map(p=>p.scaled));
    if(rb.h<7||rb.w<3||rb.h>height*.76||rb.x<bb.x+bb.w*.70||
     rb.cy>=bb.cy-height*.16||rb.y+rb.h>bb.y+bb.h*.70)continue;
   }else if(Math.abs(bb.y+bb.h-pb.y-pb.h)>height*.42)continue;
   if(groups.some(g=>Math.abs(bounds(g).y+bounds(g).h-bb.y-bb.h)>height*.42))continue;
   groups.forEach(g=>groupsByKey.set(key(g),g));
   layouts.push({prefix,body,raised,groups,pb,bb,height});
  }
 }
 if(!layouts.length)return reading;
 const entries=[...groupsByKey],rasters=entries.map(([,parts])=>rasterDigit(parts));
 const alpha=await readCharacters(rasters,'lowercase',options);
 const evidence=new Map(entries.map(([id,parts],i)=>{
  const pen=window.WhiteboardUjiReader.read(parts.map(p=>p.points))||[];
  const digit=predictDigit(rasters[i]);
  const personal=window.WhiteboardHandwritingLearning?.match?.(rasters[i]);
  return[id,{parts,alpha:alpha[i],pen,digit,personal}];
 }));
 function probability(e,char){
  if(e.personal)return e.personal.char===char?e.personal.score:0;
  if(/^[0-9]$/.test(char))return .6*(e.digit.find(p=>p.char===char)?.score||0)+.4*(e.pen.find(p=>p.label===char)?.p||0);
  const letter=char.toLowerCase(),a=e.alpha.find(p=>p.char===letter)?.score||0;
  const p=e.pen.reduce((sum,p)=>sum+(/^[A-Za-z]$/.test(p.label)&&p.label.toLowerCase()===letter?p.p:0),0);
  return .55*a+.45*p;
 }
 const prefixCache=new Map(),proposals=[],baselineProposals=[];
 const original=context.canonical(reading.text);
 const pinned=String(reading.text).match(/^\s*([−-]?\d+(?:\.\d+)?(?:\s*[+−×÷=]\s*[−-]?\d+(?:\.\d+)?)*)/)?.[1];
 const pinPrefix=pinned&&(/[A-Za-z?]/.test(reading.text)||/[+−×÷=]/.test(reading.text));
 // Equation context: preserve the complete left-to-right arithmetic statement
 // when comparing measurement suffixes. A unit candidate must not consume an
 // operand or change an operator, even if its letter score is higher.
 const equationPrefix=String(reading.text).match(/^\\s*((?:[−-]?\\d+(?:\\.\\d+)?\\s*[+−×÷]\\s*)*[−-]?\\d+(?:\\.\\d+)?\\s*=\\s*[−-]?\\d+(?:\\.\\d+)?)/)?.[1];
 const canonicalMath=s=>String(s||'').replace(/\\s+/g,'').replace(/-/g,'−');
 const originalUnit=String(reading.text).match(/([A-Za-z]+[²³]?)\s*$/)?.[1];
 const protectedMeasurement=reading.engine==='unit-first-trained-measurement'&&!reading.uncertain?.length;
 for(const layout of layouts){
  const {prefix,body,raised,groups,pb,bb,height}=layout;
  const prefixId=prefix.map(p=>p.scaled.index).join(',');
  if(!prefixCache.has(prefixId))prefixCache.set(prefixId,await readUnitPrefix(prefix,W,H,options,true));
  const number=prefixCache.get(prefixId);if(!number)continue;
  if(pinPrefix&&context.canonical(number.text)!==context.canonical(pinned))continue;
  if(equationPrefix&&canonicalMath(number.text)!==canonicalMath(equationPrefix))continue;
  let powers=[{char:'',score:1,parts:[]}];
  if(raised.length){
   const parts=raised.map(p=>p.scaled),digits=predictDigit(rasterDigit(parts));
   const pen=window.WhiteboardUjiReader.read(parts.map(p=>p.points))||[];
   const trained=raised.length===1?window.WhiteboardUnitExponent?.match?.(raised[0].raw,W,H):null;
   powers=['2','3'].map(char=>({char:char==='2'?'²':'³',parts,
    score:.45*(digits.find(p=>p.char===char)?.score||0)+.40*(pen.find(p=>p.label===char)?.p||0)+.15*(trained?.label===(char==='2'?'²':'³')?trained.score:0)}))
    .filter(p=>p.score>=.10);
  }
  for(const power of powers){
   const words=(power.char?context.poweredUnits.filter(u=>u.endsWith(power.char)).map(u=>u.slice(0,-1)):context.units)
    .filter(word=>word.length===groups.length);
   for(const word of words){
    const votes=groups.map((g,i)=>probability(evidence.get(key(g)),word[i]));
    if(votes.some(p=>p<.10)||Math.max(...votes)<.50)continue;
    // A g in a unit must have a descender. This keeps strong digit 9s intact.
    if(word.endsWith('g')&&bb.y+bb.h<pb.y+pb.h+height*.09)continue;
    const tokens=[...number.tokens,...groups.map((parts,i)=>({char:word[i],score:votes[i],parts})),
     ...(power.char?[{char:power.char,score:power.score,parts:power.parts}]:[])];
    const text=number.text+' '+word+power.char;
    const visualScore=(votes.reduce((n,p)=>n+Math.log(Math.max(.001,p)),0)+
     (power.char?Math.log(power.score):0))/(votes.length+Number(!!power.char));
    proposals.push({text,tokens,uncertain:tokens.filter(t=>t.score<.85),visualScore,
     minSupport:Math.min(...votes,power.score),prefix:number.text,unit:word+power.char,
     engine:'local-context-language-model',format:'unit'});
    const start=context.canonical(number.text),tail=original.startsWith(start)?original.slice(start.length):'';
    if(tail.length===groups.length+Number(!!power.char)){
     const support=groups.map((g,i)=>probability(evidence.get(key(g)),tail[i]));
     if(power.char)support.push(tail.at(-1)===power.char?power.score:1-power.score);
     const visual=support.reduce((n,p)=>n+Math.log(Math.max(.001,p)),0)/support.length;
     baselineProposals.push({text:reading.text,visualScore:visual,original:true});
    }
   }
  }
 }
 if(!proposals.length)return reading;
 const ordered=context.rank(proposals),best=ordered[0];
 const baseline=context.rank(baselineProposals)[0]||{text:reading.text,score:-.25+.45*context.score(reading.text),visualScore:-.25};
 const same=context.canonical(best.text)===original;
 const other=ordered.find(p=>context.canonical(p.text)!==context.canonical(best.text));
 const margin=best.score-(other?.score??-100),gain=best.score-baseline.score;
 const validOriginalUnit=originalUnit&&[...context.units,...context.poweredUnits].includes(originalUnit);
 const canChange=!same&&!protectedMeasurement&&margin>=.30&&gain>=.45&&best.minSupport>=.30&&
  (!validOriginalUnit||best.visualScore-baseline.visualScore>=.55);
 const selected=canChange?best:reading;
 // Preserve valid taught measurements; expose substantial visual disagreement
 // for review instead of silently replacing the teacher's trained exponent.
 const alternatives=ordered.filter(p=>context.canonical(p.text)!==context.canonical(selected.text)&&
  p.minSupport>=.20&&p.score>=(canChange?best.score:baseline.score)-.80).slice(0,2);
 if(!canChange&&!alternatives.length)return reading;
 const choices=[{text:selected.text,tokens:selected.tokens||[],original:!canChange},
  ...alternatives.map(p=>({text:p.text,tokens:p.tokens,original:false}))];
 if(canChange&&!choices.some(p=>context.canonical(p.text)===original))choices.push({text:reading.text,tokens:reading.tokens||[],original:true});
 const uncertainty={char:'?',score:0,parts:[],engine:'context-review'};
 return{...selected,uncertain:[...(selected.uncertain||[]),uncertainty],
  context:{model:'local-notation-trigram-v1',applied:canChange,originalText:reading.text,
   alternatives:choices.slice(0,3),needsReview:true}};
}
function reviewLegacyMeasurement(reading){
 if(!/^local-(?:general-primary-grammar|primary-measurement|measurement-quantity)$/.test(reading?.engine||'')||
    !window.WhiteboardUjiReader||!window.WhiteboardCharacterInference)return reading;
 const aliases={O:'0',o:'0',I:'1',l:'1',Z:'2',z:'2',S:'5',s:'5',B:'8',g:'9',q:'9'};
 let numeric=true;const disputed=[];
 const tokens=(reading.tokens||[]).map(token=>{
  if(/^[A-Za-z]$/.test(token.char))numeric=false;
  if(!numeric||!/^\d$/.test(token.char)||!token.parts?.length||token.personal)return token;
  const pen=window.WhiteboardUjiReader.read(token.parts.map(p=>p.points));
  const best=pen?.[0],image=window.WhiteboardCharacterInference.predict(rasterDigit(token.parts),'auto')?.[0];
  const contraryDigit=best&&/^\d$/.test(best.label)&&best.label!==token.char&&
   best.p>=.985&&best.p-(pen[1]?.p||0)>=.95;
  const contraryLetter=image&&/^[A-Za-z]$/.test(image.char)&&image.score>=.90&&aliases[image.char]!==token.char;
  if(!contraryDigit&&!contraryLetter)return token;
  const review={...token,score:Math.min(token.score,.5),engine:'measurement-prefix-review'};
  disputed.push(review);return review;
 });
 return disputed.length?{...reading,tokens,uncertain:[...(reading.uncertain||[]),...disputed]}:reading;
}
function reviewIsolatedDisagreement(reading,options){
 if((options.mode||'auto')!=='auto'||reading?.engine!=='local-emnist-cnn'||reading.tokens?.length!==1)return reading;
 const token=reading.tokens[0];
 if(token.personal||!/^[A-Za-z]$/.test(token.char)||!token.parts?.length)return reading;
 const pen=window.WhiteboardUjiReader?.read(token.parts.map(p=>p.points)),best=pen?.[0];
 if(!best||!/^\d$/.test(best.label)||best.p<.90||best.p-(pen[1]?.p||0)<.85)return reading;
 const review={...token,score:Math.min(token.score,.5),engine:'isolated-model-review'};
 return{...reading,tokens:[review],uncertain:[...(reading.uncertain||[]).filter(t=>t!==token),review]};
}
async function recognize(strokes,W,H,options={}){
 checkCancelled(options);
 const reading=reviewIsolatedDisagreement(await recognizeBeforeContext(strokes,W,H,options),options);
 checkCancelled(options);
 // Word checking is an optional review layer. A failure retains the existing
 // reading and must not prevent the independent measurement context check.
 let words=reading;
 try{words=await window.WhiteboardHandwritingWords?.check(strokes,W,H,options,reading,{segment,rasterDigit})||reading}
 catch(error){if(error?.name==='AbortError')throw error;}
 checkCancelled(options);
 if(words!==reading)return reviewLegacyMeasurement(words);
 try{const result=await recognizeWithContext(strokes,W,H,options,reading);checkCancelled(options);return reviewLegacyMeasurement(result)}
 catch(error){
  if(error?.name==='AbortError')throw error;
  // An optional context failure must not discard a completed handwriting read.
  return reviewLegacyMeasurement({...reading,context:{unavailable:true}});
 }
}
window.WhiteboardHandwritingMath={recognize,predictDigit,rasterDigit,segment};
window.WhiteboardHandwritingMath.build='20261020-structural-parser8';
})();
