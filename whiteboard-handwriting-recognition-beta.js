/* Local-only math handwriting: stroke segmentation, symbol geometry and MNIST digits. */
(function(){
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const median=a=>{a=a.slice().sort((x,y)=>x-y);return a.length?a[Math.floor(a.length/2)]:0};
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
 if(parts.length===2&&lines.every(l=>l.straight&&!l.horizontal&&!l.vertical)&&lines[0].slope*lines[1].slope<0)return'×';
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

function segment(strokes,W,H){
 const parts=strokes.filter(s=>Array.isArray(s.points)&&s.points.length).map(s=>({source:s,size:Number(s.size)||4,points:s.points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>({x:p.x*W,y:p.y*H}))})).filter(s=>s.points.length);
 if(!parts.length)return[];
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
   if(overlap>=-Math.max(1,height*.035)&&joined.w<height*1.25){groups[i].push(...groups[j]);groups.splice(j,1);changed=true;break}
  }}
  const rowTokens=[];
  for(const group of groups){
   // Keep the dot with a narrow stem for separately written i/j, rather than making another token.
   const stem=bounds(group),accent=dots.find(s=>{const d=bounds([s]);return stem.h>height*.4&&stem.w<height*.55&&Math.abs(d.cx-stem.cx)<Math.max(4,height*.2)&&d.cy<stem.y-height*.06&&d.cy>stem.y-height*.45});
   if(accent){group.push(accent);dots=dots.filter(s=>s!==accent)}
   const b=bounds(group),op=symbol(group,height);
   if(op==='−'){
    const candidates=dots.filter(s=>{const d=bounds([s]);return Math.abs(d.cx-b.cx)<Math.max(5,b.w*.3)&&Math.abs(d.cy-b.cy)<height*.55}),above=candidates.find(s=>bounds([s]).cy<b.cy-height*.10),below=candidates.find(s=>bounds([s]).cy>b.cy+height*.10);
    if(above&&below){dots=dots.filter(s=>s!==above&&s!==below);rowTokens.push({char:'÷',score:1,x:b.x,parts:[...group,above,below]});continue}
   }
   // Geometry beats a mistaken digit prediction (or a previously accepted bad sample).
   if(openFourGeometry(group)){rowTokens.push({char:'4',score:.96,x:b.x,parts:group,engine:'open-four-geometry'});continue}
   const pixels=rasterDigit(group),personal=window.WhiteboardHandwritingLearning?.match(pixels);
   if(personal){rowTokens.push({...personal,x:b.x,parts:group});continue}
   if(op){rowTokens.push({char:op,score:1,x:b.x,parts:group});continue}
   const choices=predictDigit(pixels);
   rowTokens.push({...choices[0],choices:choices.slice(0,3),x:b.x,parts:group});
  }
  for(const dot of dots){const b=bounds([dot]);rowTokens.push({char:b.cy>=row.cy+height*.15?'.':'×',score:.85,x:b.x,parts:[dot]})}
  rowTokens.sort((a,b)=>a.x-b.x);tokens.push(...rowTokens);
 }
 return tokens;
}

/* A stacked fraction is a spatial structure, not three inline characters.
   Prefer the local digit model for simple fractions before the generic reader. */
function detectStackedFraction(strokes,W,H){
 if(strokes.length<3||strokes.length>18)return null;
 const parts=strokes.filter(s=>Array.isArray(s.points)&&s.points.length&&s.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))).map(raw=>{
  const scaled={points:raw.points.map(p=>({x:p.x*W,y:p.y*H})),size:Number(raw.size)||4};
  return{raw,box:bounds([scaled]),line:line(scaled)};
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
  const topTokens=segment(above.map(p=>p.raw),W,H),bottomTokens=segment(below.map(p=>p.raw),W,H);
  const numerator=topTokens.map(t=>t.char).join(''),denominator=bottomTokens.map(t=>t.char).join('');
  if(!/^\d{1,6}$/.test(numerator)||!/^\d{1,6}$/.test(denominator))continue;
  const tokens=[...topTokens,...bottomTokens],text='\\frac{'+numerator+'}{'+denominator+'}';
  return{text,tokens,uncertain:tokens.filter(t=>t.score<.85),engine:'local-stacked-fraction',format:'latex',fractionTokenCounts:[topTokens.length,bottomTokens.length]};
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
 const knownUnits=['cm','mm','km','kg','mg','ml','min','m','g','l','s','h'];
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
  const predictions=await window.WhiteboardCharacterReader.predictBatch(rasters,'lowercase',options.onProgress);
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
  return{scaled,box:bounds([scaled])};
 });
 if(parts.some(p=>!p))return null;
 parts.sort((a,b)=>a.box.cx-b.box.cx);
 const last=parts.at(-1),b=last.box,aspect=b.w/Math.max(1,b.h);
 if(b.h<24||b.w<4||aspect<.12||aspect>.68)return null;
 const imgs=parts.map(p=>rasterDigit([p.scaled]));
 const preds=await window.WhiteboardCharacterReader.predictBatch(imgs,'lowercase',options.onProgress);
 const ell=preds.at(-1)||[],ellScore=ell.find(q=>q.char.toLowerCase()==='l')?.score||0;
 if(ellScore<.055)return null;
 if(parts.length===1){
  const num=predictDigit(imgs[0])[0];
  if(ellScore<.12||num.char==='8'&&num.score>.96)return null;
  return{text:'l',tokens:[{char:'l',score:Math.max(.85,ellScore),parts:[last.scaled]}],uncertain:[],engine:'local-litre-unit',format:'unit'};
 }
 const first=parts[0],a=first.box,m=preds[0]||[],mScore=m.find(q=>q.char.toLowerCase()==='m')?.score||0;
 if(mScore<.68||a.h<15||b.h<a.h*1.18||a.w<a.h*.52)return null;
 if(b.x<a.x+a.w*.60||b.x>a.x+a.w+a.h*.85||b.cy>a.cy+a.h*.33)return null;
 if(ellScore<.08)return null;
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
 if(strokes.length<1||strokes.length>2)return false;
 const groups=strokes.map(s=>Array.isArray(s.points)?s.points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)).map(p=>({x:p.x*W,y:p.y*H})):[]);
 if(groups.some(g=>g.length<2))return false;
 const pts=groups.flat(),b=bounds([{points:pts}]);
 if(b.h<35||b.w<11||b.w/b.h<.15||b.w/b.h>.78)return false;
 const upper=pts.filter(p=>p.y<=b.y+b.h*.38);
 const neck=pts.filter(p=>p.y>=b.y+b.h*.44&&p.y<=b.y+b.h*.68);
 if(upper.length<4||neck.length<2)return false;
 const min=x=>Math.min(...x),max=x=>Math.max(...x);
 const topSpan=max(upper.map(p=>p.x))-min(upper.map(p=>p.x));
 const neckSpan=max(neck.map(p=>p.x))-min(neck.map(p=>p.x));
 const topCentre=upper.reduce((n,p)=>n+p.x,0)/upper.length;
 if(topSpan>b.w*.68||neckSpan>b.w*.55||topCentre<b.x+b.w*.48)return false;
 const ends=groups.flatMap(g=>[g[0],g[g.length-1]]).filter(p=>p.y>=b.y+b.h*.73);
 if(ends.length<2||max(ends.map(p=>p.x))-min(ends.map(p=>p.x))<b.w*.45)return false;
 const capHasTurn=groups.some(g=>{
  let direction=0;
  for(let i=1;i<g.length;i++){
   if(g[i].y>b.y+b.h*.42||g[i-1].y>b.y+b.h*.42)continue;
   const dx=g[i].x-g[i-1].x;
   if(Math.abs(dx)<Math.max(1,b.w*.025))continue;
   const sign=Math.sign(dx);
   if(direction&&sign!==direction)return true;
   direction=sign;
  }
  return false;
 });
 return capHasTurn;
}

async function recognize(strokes,W,H,options={}){
 if(strokes.length>180||strokes.reduce((n,s)=>n+(s.points?.length||0),0)>16000)throw Error('Select a shorter number or equation and try again.');

 if(options.mode==='auto'&&loopedStandaloneL(strokes,W,H)){
  const parts=strokes.map(s=>({points:s.points.map(p=>({x:p.x*W,y:p.y*H})),size:Number(s.size)||4}));
  return{text:'L',tokens:[{char:'L',score:.95,parts}],uncertain:[],engine:'local-cursive-l',format:'letter'};
 }
 if(options.mode==='auto'){const litre=await detectLitreUnit(strokes,W,H,options);if(litre)return litre}
 if(options.mode==='auto'||options.mode==='math'){const raised=await detectRaisedUnit(strokes,W,H,options);if(raised)return raised}
 if(options.mode==='auto'||options.mode==='math'){const fraction=detectStackedFraction(strokes,W,H);if(fraction)return fraction}
 if(options.mode==='math')return window.WhiteboardMathReader.recognize(strokes,W,H,options);
 const tokens=segment(strokes,W,H),mode=['auto','lowercase','uppercase','digits'].includes(options.mode)?options.mode:'auto';let text='';
 if(window.WhiteboardCharacterReader&&mode!=='digits'){
  const candidates=tokens.filter(t=>!['.','−','÷','='].includes(t.char)&&!(t.personal&&/^[A-Za-z]$/.test(t.char))&&!(t.personal&&mode==='auto'));
  const results=await window.WhiteboardCharacterReader.predictBatch(candidates.map(t=>rasterDigit(t.parts)),mode,options.onProgress);
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
    if(selected.length){const alphabet=await window.WhiteboardCharacterReader.predictBatch(selected.map(({t})=>rasterDigit(t.parts)),lower?'lowercase':'uppercase',options.onProgress);for(let j=0;j<selected.length;j++){const i=selected[j].i;results[i]=title&&i===0?alphabet[j].map(c=>({...c,char:c.char.toUpperCase()})):alphabet[j]}}
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
 const reading=text.replace(/\s+/g,' ').trim();
 return{text:mode==='auto'?normalizeMillilitreCase(reading,tokens):reading,tokens,uncertain:tokens.filter(t=>t.score<.85),engine:window.WhiteboardCharacterReader&&mode!=='digits'?'local-emnist-cnn':'local-digits'};
}
window.WhiteboardHandwritingMath={recognize,predictDigit,rasterDigit,segment};
})();
