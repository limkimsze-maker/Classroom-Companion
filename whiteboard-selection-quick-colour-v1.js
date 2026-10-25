(function(){
'use strict';
// Select object(s), then tap an existing Pen colour chip to recolour them.
// No additional palette, generated shapes, or changes to Pen/Highlighter ink.
if(window.ClassroomQuickObjectColour)return;
const palette=document.querySelector('.colors');
if(!palette||typeof strokes==='undefined'||typeof tool==='undefined')return;
const clone=v=>JSON.parse(JSON.stringify(v));
const hexOK=s=>/^#[0-9a-f]{6}$/i.test(s||'');
const svgUri=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
function note(message){if(typeof say==='function')say(message)}
function counterSource(fill){
 const stroke=fill==='#17324d'?'#0b1f33':'#17324d';
 return svgUri('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="'+fill+'" stroke="'+stroke+'" stroke-width="7"/></svg>');
}
function recolourBarSvg(src,colour){
 if(typeof src!=='string'||!src.startsWith('data:image/svg+xml'))return null;
 const comma=src.indexOf(',');if(comma<0)return null;
 let svg;try{svg=decodeURIComponent(src.slice(comma+1))}catch{return null}
 let painted=0;
 // Recolour only filled rectangles. Leave outlines, dividers, labels,
 // handwritten brackets and other graphical elements untouched.
 const updated=svg.replace(/<rect\b[^>]*>/gi,tag=>tag.replace(
  /\bfill=(["'])(.*?)\1/i,(attr,quote,old)=>{
   if(!old||old==='none'||old==='transparent')return attr;
   painted++;return 'fill='+quote+colour+quote;
  }));
 return painted?svgUri(updated):null;
}
function colourObject(obj,hex){
 if(obj.type==='text'){
  if(obj.colour?.toLowerCase()===hex)return false;
  obj.colour=hex;return true;
 }
 if(Array.isArray(obj.points)&&obj.points.length&&!obj.erase){
  if(obj.colour?.toLowerCase()===hex)return false;
  obj.colour=hex;return true;
 }
 if(obj.type!=='image')return false;
 if(obj.smartType==='counter'){
  if(obj.counterFill?.toLowerCase()===hex)return false;
  obj.counterFill=hex;obj.src=counterSource(hex);return true;
 }
 if(obj.smartType==='fractionBar'){
  const n=Math.round(Number(obj.fractionParts));
  if(!(n>=2&&n<=100)||!window.ClassroomFractionBars?.refresh)return false;
  if(Array.isArray(obj.fractionFills)&&obj.fractionFills.length===n&&obj.fractionFills.every(c=>c?.toLowerCase()===hex))return false;
  obj.fractionFills=Array(n).fill(hex);
  window.ClassroomFractionBars.refresh(obj);return true;
 }
 if(obj.smartType==='barModel'){
  const next=recolourBarSvg(obj.src,hex);if(!next||next===obj.src)return false;
  obj.src=next;
  if(Number.isInteger(obj.barCount)&&obj.barCount>0)
   obj.barFills=Array(obj.barCount).fill(hex);
  if(obj.smartBarType==='comparison')obj.segmentColours=[];
  if(obj.smartBarType==='multiplicative'){
   obj.multiBarFills=[hex,hex];obj.multiSegmentColours=[];
  }
  return true;
 }
 // Do not alter imported photos or mathematical symbols/equations rendered
 // as images: changing their SVG could corrupt their appearance.
 return false;
}
function chosen(){
 return tool==='select'?(window.ClassroomSingleEraserSelection?.selectedObjects?.()||[]):[];
}
let pressed=null,pressSelection=null;
window.addEventListener('pointerdown',e=>{
 const chip=e.target?.closest?.('.colors .colour');
 if(!chip||tool!=='select'){pressed=null;pressSelection=null;return}
 pressed=chip;pressSelection=chosen();
},true);
window.addEventListener('click',e=>{
 const chip=e.target?.closest?.('.colors .colour');
 if(!chip)return;
 const hex=chip.dataset.colour?.toLowerCase();
 if(!hexOK(hex))return;
 const items=(chip===pressed?pressSelection:chosen())||[];
 pressed=null;pressSelection=null;
 const existing=[...new Set(items)].filter(o=>strokes.includes(o)&&!o.locked&&!o.background);
 if(!existing.length||tool!=='select')return; // normal Pen colour shortcut
 const controller=window.ClassroomObjectSelection;
 if(typeof controller?.colourObjects!=='function')return;
 // Prevent later Pen handlers switching tools or discarding selection.
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 const changed=controller.colourObjects(existing,o=>colourObject(o,hex));
 if(changed)note(existing.length>1?'Selected objects coloured':'Object coloured');
 else note('This selection cannot be recoloured using the colour chips');
},true);
window.ClassroomQuickObjectColour={
 supportedTypes:['text','pen-ink','counter','fractionBar','barModel'],
 apply:(objects,colour)=>{
  const hex=String(colour||'').toLowerCase();
  return hexOK(hex)&&!!window.ClassroomObjectSelection?.colourObjects?.(objects,o=>colourObject(o,hex));
 },
 selection:chosen
};
})();