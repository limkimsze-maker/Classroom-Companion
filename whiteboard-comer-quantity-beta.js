/* Conservative measurement grammar for the isolated CoMER experiment.
   Never invent a digit or unit: both sides must be independently recognised. */
(function(root){
 'use strict';
 const unitNames=['mm','cm','km','m','mg','kg','g','mL','ml','L','l','min','h','s','ms','kL','°C','°F'];
 const lengths=new Set(['mm','cm','km','m']);
 const order=unitNames.slice().sort((a,b)=>b.length-a.length);
 const allowedUnit=new RegExp('^('+order.join('|')+')((?:\\^)?[23])?$');
 const digits=/^-?(?:\d+(?:\.\d+)?|\.\d+)$/;
 function plain(value){
   let text=String(value??'').trim();
   if(!text||text.length>180)return '';
   text=text.replace(/\\(?:mathrm|text|operatorname)\s*\{([^{}]*)\}/g,'$1')
     .replace(/\\(?:left|right)\b/g,'')
     .replace(/\\(?:,|;|!|quad|qquad)\b\s*/g,'')
     .replace(/\\(?:,|;|!)/g,'')
     .replace(/\\(?:space)\b/g,'')
     .replace(/\\ /g,'')
     .replace(/\^\s*\{\s*([23])\s*\}/g,'^$1')
     .replace(/[²³]/g,x=>x==='²'?'^2':'^3')
     .replace(/[−–—]/g,'-')
     .replace(/[\s{}]/g,'');
   return text.includes('\\')?'':text;
 }
 function normalizeUnit(value){
   const text=plain(value),found=text.match(allowedUnit);
   if(!found)return null;
   let unit=found[1],exp=found[2]?.replace('^','')||'';
   if(exp&&!lengths.has(unit))return null;
   if(unit==='ml')unit='mL';
   if(unit==='l')unit='L';
   return {unit,exponent:exp};
 }
 function numeric(value){
   const s=plain(value);
   if(!digits.test(s)||s.length>25)return null;
   return s.startsWith('.')?'0'+s:s.startsWith('-.')?'-0'+s.slice(1):s;
 }
 function combine(number,unitText){
   const num=numeric(number),unit=normalizeUnit(unitText);
   if(!num||!unit)return null;
   const end=unit.exponent==='2'?'²':unit.exponent==='3'?'³':'';
   return {text:num+' '+unit.unit+end,number:num,unit:unit.unit,exponent:unit.exponent};
 }
 function whole(text){
   const s=plain(text);
   if(!s)return null;
   for(const name of order){
     const pos=s.indexOf(name);
     if(pos<=0)continue;
     const result=combine(s.slice(0,pos),s.slice(pos));
     if(result)return result;
   }
   return null;
 }
 function bounds(strokes){
   const xy=strokes.flatMap(s=>s.points||[]);
   if(!xy.length)return null;
   const xs=xy.map(p=>p.x),ys=xy.map(p=>p.y);
   return {left:Math.min(...xs),top:Math.min(...ys),right:Math.max(...xs),bottom:Math.max(...ys)};
 }
 function splitCandidates(strokes){
   if(!Array.isArray(strokes)||strokes.length<3||strokes.length>35)return [];
   if(strokes.some(s=>!Array.isArray(s.points)||!s.points.length||
     s.points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y))))return [];
   const items=strokes.map(s=>{
     const b=bounds([s]);
     return {stroke:s,b,centre:(b.left+b.right)/2};
   }).sort((a,b)=>a.centre-b.centre);
   const all=bounds(strokes),width=Math.max(.001,all.right-all.left);
   const choices=[];
   for(let n=1;n<items.length-1;n++){
     const left=items.slice(0,n),right=items.slice(n),A=bounds(left.map(i=>i.stroke)),B=bounds(right.map(i=>i.stroke));
     if(A.right>B.left+Math.max(.012,width*.045))continue;
     if(A.right-A.left<width*.07||B.right-B.left<width*.09)continue;
     if(left.length>20||right.length>12)continue;
     const gap=B.left-A.right;
     const score=gap/width+Math.min(left.length,6)*.001;
     choices.push({prefix:left.map(x=>x.stroke),suffix:right.map(x=>x.stroke),score});
   }
   choices.sort((a,b)=>b.score-a.score);
   return choices.slice(0,6);
 }
 root.WhiteboardCoMERQuantity=Object.freeze({plain,numeric,normalizeUnit,combine,whole,splitCandidates});
})(typeof window!=='undefined'?window:globalThis);
