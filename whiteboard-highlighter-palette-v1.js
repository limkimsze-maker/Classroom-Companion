(function(){
'use strict';
// Colour controls are part of the Alpha HTML, not dynamically injected.
// This avoids losing the palette when the toolbar is rebuilt.
const button=document.getElementById('highlighterBtn');
const board=document.getElementById('board');
const panel=document.getElementById('ccHighlighterPalette');
const api=window.CCHighlighter;
if(!button||!board||!panel||!api)return;
const swatches=[...panel.querySelectorAll('button[data-highlight-colour]')];
const custom=document.getElementById('ccCustomHighlighterColour');
const css=document.createElement('style');
css.id='ccCuteHighlighterCursor';
document.head.appendChild(css);
function markerSvg(hex){
 return '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">'+
 '<path d="M7 11v7M3.5 14.5h7M39 6v6M36 9h6" fill="none" stroke="#e7a743" stroke-width="1.7" stroke-linecap="round"/>'+
 '<rect x="14" y="3" width="20" height="33" rx="7" fill="'+hex+'" stroke="#324759" stroke-width="2"/>'+
 '<path d="M15 13h18" stroke="#fff" stroke-opacity=".8" stroke-width="2"/>'+
 '<path d="M17 31h14" stroke="#324759" stroke-width="2"/>'+
 '<ellipse cx="20" cy="22" rx="1.4" ry="1.9" fill="#253542"/>'+
 '<ellipse cx="28" cy="22" rx="1.4" ry="1.9" fill="#253542"/>'+
 '<path d="M21 26q3 4 6 0" fill="none" stroke="#253542" stroke-width="1.6" stroke-linecap="round"/>'+
 '<circle cx="17" cy="26" r="2" fill="#ffabc5" fill-opacity=".65"/>'+
 '<circle cx="31" cy="26" r="2" fill="#ffabc5" fill-opacity=".65"/>'+
 '<path d="M17 36h14l-2 5-4 6h-2l-4-6z" fill="#394955" stroke="#253542" stroke-width="1.4"/>'+
 '<path d="M21 41h6l-2 6h-2z" fill="'+hex+'"/>'+
 '</svg>';
}
function refresh(){
 const colour=api.getColour();
 const active=api.isActive();
 custom.value=colour;
 for(const b of swatches)b.setAttribute('aria-pressed',String(b.dataset.highlightColour===colour));
 const url='data:image/svg+xml,'+encodeURIComponent(markerSvg(colour));
 // A real image cursor with the pointer hotspot at its physical marker nib.
 css.textContent='body:has(#highlighterBtn.active) #boardWrap > #board{cursor:url("'+url+'") 24 46,crosshair!important}';
 const header=document.getElementById('ccHighlighterHeader');
 if(header)header.setAttribute('aria-pressed',String(active));
}
function choose(colour){
 if(!/^#[0-9a-f]{6}$/i.test(colour||''))return;
 // Choosing a colour also switches from Pen/Point/Select to Highlighter.
 if(!api.isActive())button.click();
 // Colour shortcuts start at the teacher's 12 px default; the thickness
 // slider remains available for changes after selecting a colour.
 const size=document.getElementById('size');
 if(size){size.value='12';size.dispatchEvent(new Event('input',{bubbles:true}))}
 api.setColour(colour);
 refresh();
}
for(const b of swatches)b.addEventListener('click',()=>choose(b.dataset.highlightColour));
custom.addEventListener('input',()=>choose(custom.value));
button.addEventListener('click',()=>requestAnimationFrame(refresh));
document.querySelectorAll('#penBtn,#eraserBtn,#textBtn').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(refresh)));
window.addEventListener('cc-highlighter-colour',refresh);
window.addEventListener('cc-highlighter-tool',refresh);
refresh();
})();