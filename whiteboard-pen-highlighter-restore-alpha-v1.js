(function(){
'use strict';
// Alpha toolbar-only restoration. Does not read or mutate whiteboard strokes,
// Smart Math model objects, recognition, labels, brackets or undo history.
const wrap=document.getElementById('boardWrap');
const board=document.getElementById('board');
const pen=document.getElementById('penBtn');
const highlighter=document.getElementById('highlighterBtn');
const point=document.getElementById('ccFingerPointerBtn');
if(!wrap||!board||!pen)return;

// A friendly hand-drawn pencil; the cursor hotspot is the dark tip at (8,42).
const penSvg='<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">'+
'<path d="M8 42 L10 31 L32 7 Q35 4 38 7 L42 11 Q44 14 40 17 L17 41 Z" fill="#ffd46e" stroke="#17324d" stroke-width="2" stroke-linejoin="round"/>'+
'<path d="M8 42 L10 31 L17 41 Z" fill="#f6b988" stroke="#17324d" stroke-width="1.7"/>'+
'<path d="M8 42 L11 37 L13 39 Z" fill="#17324d"/>'+
'<path d="M32 7 Q35 4 38 7 L42 11 Q44 14 40 17 L36 21 L28 12 Z" fill="#f69cc1" stroke="#17324d" stroke-width="1.7"/>'+
'<path d="M24 13 L34 22" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'+
'<path d="M5 19 L7 15 M5 19 L1 18 M5 19 L7 23" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round"/>'+
'</svg>';
const highlighterSvg='<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">'+
'<path d="M7 39 L8 28 L25 8 Q29 4 33 8 L38 13 Q40 16 36 20 L18 39 Z" fill="#fce558" stroke="#17324d" stroke-width="2" stroke-linejoin="round"/>'+
'<path d="M7 39 L8 28 L18 39 Z" fill="#facc15" stroke="#17324d" stroke-width="2"/>'+
'<path d="M25 8 L36 20" stroke="#fff8b7" stroke-width="3"/>'+
'</svg>';
const style=document.createElement('style');
style.id='ccAlphaPenAndPointerCursorStyles';
style.textContent=[
 '#penBtn{white-space:nowrap!important;}',
 '#highlighterBtn{white-space:nowrap!important;}',
 '#boardWrap.cc-pen-mode canvas#board{cursor:url("data:image/svg+xml,'+encodeURIComponent(penSvg)+'") 8 42, crosshair!important;}',
 '#boardWrap.cc-highlighter-mode canvas#board{cursor:url("data:image/svg+xml,'+encodeURIComponent(highlighterSvg)+'") 8 38, crosshair!important;}',
 // Important: older bar-model styles used cursor:move!important / cursor:default!important.
 // Native crosshair must not appear on top of the presentation finger.
 '#boardWrap.cc-finger-mode, #boardWrap.cc-finger-mode canvas#board, #boardWrap.cc-finger-mode #ccFingerPointerCursor, #boardWrap.cc-finger-mode #ccFingerPointerCursor *{cursor:none!important;}',
 '#boardWrap.cc-finger-mode *:not(.cc-unified-grip){cursor:none!important;}'
].join('\n');
document.head.appendChild(style);
const label=(pen.textContent||'Pen').replace(/^[✏🖊🖋]\uFE0F?\s*/u,'').trim();
pen.textContent='🖊️ '+(label||'Pen');
pen.title='Pen · draw with a cute pencil pointer';
if(highlighter){
 highlighter.type='button';
 highlighter.title='Highlight with transparent marker strokes';
 highlighter.setAttribute('aria-label','Highlighter');
}
function update(){
 const current=typeof tool==='string'?tool:'';
 wrap.classList.toggle('cc-pen-mode',current==='pen');
 wrap.classList.toggle('cc-highlighter-mode',current==='highlighter');
 wrap.classList.toggle('cc-finger-mode',current==='finger');
 if(highlighter){
  highlighter.classList.toggle('active',current==='highlighter');
  highlighter.setAttribute('aria-pressed',String(current==='highlighter'));
 }
 if(point)point.setAttribute('aria-pressed',String(current==='finger'));
}
const previousSync=syncUi;
syncUi=function(){const result=previousSync.apply(this,arguments);update();return result;};
const originalPenHandler=pen.onclick;
if(typeof originalPenHandler==='function')pen.onclick=function(e){const out=originalPenHandler.call(this,e);update();return out};
window.ClassroomAlphaToolbarAudit={
 read(){
  const names=['selectBtn','ccFingerPointerBtn','penBtn','highlighterBtn','textBtn','eraserBtn','smartMathBtn','undoBtn','clearBtn','speechToTextBtn','openDocumentBtn'];
  return Object.fromEntries(names.map(id=>[id,!!document.getElementById(id)]));
 },
 refresh:update
};
update();
})();