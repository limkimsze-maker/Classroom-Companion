(function(){
'use strict';
// Select object(s), then tap an existing Pen or Highlighter colour chip.
// No extra palette, generated shapes, or changes to Pen/Highlighter ink.
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
// Both palettes recolour selected objects. Without a selection their
// original controls are left alone (Pen 4 px; Highlighter 24 px).
function paletteHit(target){
 const chip=target?.closest?.('.colors .colour');
 if(chip)return{control:chip,colour:chip.dataset.colour,isCustom:false};
 const marker=target?.closest?.('#ccHighlighterPalette button[data-highlight-colour]');
 if(marker)return{control:marker,colour:marker.dataset.highlightColour,isCustom:false};
 const custom=target?.closest?.('#ccCustomHighlighterColour');
 if(custom)return{control:custom,colour:custom.value,isCustom:true};
 return null;
}
let pressed=null;
window.addEventListener('pointerdown',e=>{
 const hit=paletteHit(e.target);
 pressed=hit&&tool==='select'?{control:hit.control,items:chosen()}:null;
},true);
function selectedFor(hit){
 const cached=pressed?.control===hit.control?pressed.items:null;
 return cached?.length?cached:chosen();
}
function applyToSelection(e,hit){
 const hex=String(hit.colour||'').toLowerCase();
 if(!hexOK(hex))return false;
 const existing=[...new Set(selectedFor(hit))].filter(o=>strokes.includes(o)&&!o.locked&&!o.background);
 if(!existing.length||tool!=='select')return false;
 const controller=window.ClassroomObjectSelection;
 if(typeof controller?.colourObjects!=='function')return false;
 // Capture-phase interception prevents Highlighter from switching away
 // from Select before the chosen item can be recoloured.
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 const changed=controller.colourObjects(existing,o=>colourObject(o,hex));
 if(changed)note(existing.length>1?'Selected objects coloured':'Object coloured');
 else note('This selection cannot be recoloured using the colour chips');
 return true;
}
window.addEventListener('click',e=>{
 const hit=paletteHit(e.target);
 if(!hit||hit.isCustom)return; // allow native custom colour chooser to open
 applyToSelection(e,hit);
 pressed=null;
},true);
// The custom colour chooser emits multiple input events while the picker
// is open. Suppress the Highlighter tool's input handler when an object is
// selected, and apply only once on change to keep Undo as a single action.
window.addEventListener('input',e=>{
 const hit=paletteHit(e.target);
 if(!hit?.isCustom)return;
 if(tool==='select'&&selectedFor(hit).length){
  e.stopPropagation();e.stopImmediatePropagation();
 }
},true);
window.addEventListener('change',e=>{
 const hit=paletteHit(e.target);
 if(!hit?.isCustom)return;
 applyToSelection(e,hit);
 pressed=null;
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