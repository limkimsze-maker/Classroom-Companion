(function(){
'use strict';
// Highlighter palette and friendly marker cursor for Alpha V2.
// The core owns the colour; this script only supplies the teacher controls.
const button=document.getElementById('highlighterBtn');
const tools=document.querySelector('header.top .tools');
const api=window.CCHighlighter;
if(!button||!tools||!api)return;

const choices=[
 ['Yellow','#ffe34f'],['Pink','#ff6b9e'],['Mint','#41cb91'],
 ['Blue','#62b6ff'],['Purple','#b68bfc'],['Orange','#ffa34b']
];
const panel=document.createElement('div');
panel.id='ccHighlighterPalette';panel.setAttribute('role','group');
panel.setAttribute('aria-label','Highlighter colours');
panel.style.cssText='display:none;align-items:center;gap:6px;padding:4px 7px;border:1px solid #ebd58b;border-radius:11px;background:#fffdf2;max-width:100%;flex-wrap:wrap';
const label=document.createElement('span');
label.textContent='Highlight colour';label.style.cssText='color:#554c20;font:800 11px system-ui;white-space:nowrap';
panel.appendChild(label);
const swatches=[];
for(const [name,hex] of choices){
 const swatch=document.createElement('button');swatch.type='button';
 swatch.dataset.highlightColour=hex;swatch.title=name+' highlighter';
 swatch.setAttribute('aria-label',name+' highlighter');
 swatch.style.cssText='width:25px;height:25px;min-width:25px;min-height:25px;padding:0;background:'+hex+';border:2px solid white;border-radius:50%;box-shadow:0 0 0 1px #96a0aa;cursor:pointer';
 swatch.addEventListener('click',()=>choose(hex));
 swatches.push(swatch);panel.appendChild(swatch);
}
const custom=document.createElement('input');
custom.type='color';custom.id='ccCustomHighlighterColour';
custom.title='Choose any highlighter colour';
custom.setAttribute('aria-label','Custom highlighter colour');
custom.style.cssText='width:29px;height:29px;padding:1px;border:1px solid #b8b3a0;background:white;border-radius:7px;cursor:pointer';
custom.addEventListener('input',()=>choose(custom.value));
panel.appendChild(custom);
button.insertAdjacentElement('afterend',panel);

const css=document.createElement('style');css.id='ccCuteHighlighterCursor';
document.head.appendChild(css);
function markerSvg(hex){
 return '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">'+
 '<path d="M7 11v7M3.5 14.5h7" fill="none" stroke="#e7a743" stroke-width="2" stroke-linecap="round"/>'+
 '<path d="M39 6v6M36 9h6" fill="none" stroke="#e7a743" stroke-width="1.7" stroke-linecap="round"/>'+
 '<rect x="14" y="3" width="20" height="33" rx="7" fill="'+hex+'" stroke="#324759" stroke-width="2"/>'+
 '<path d="M15 13h18" stroke="#ffffff" stroke-opacity=".8" stroke-width="2"/>'+
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
 const active=api.isActive();
 panel.style.display=active?'inline-flex':'none';
 const selected=api.getColour();
 custom.value=selected;
 for(const swatch of swatches){
  const on=swatch.dataset.highlightColour===selected;
  swatch.setAttribute('aria-pressed',String(on));
  swatch.style.boxShadow=on?'0 0 0 2px #17324d':'0 0 0 1px #96a0aa';
 }
 // The click hotspot is exactly on the marker's nib, not its smiling face.
 const svg=markerSvg(selected);
 css.textContent='body:has(#highlighterBtn.active) #boardWrap > #board{cursor:url("data:image/svg+xml,'+encodeURIComponent(svg)+'") 24 46,crosshair!important}';
 const fallback=document.getElementById('ccHighlighterHeader');
 if(fallback)fallback.setAttribute('aria-pressed',String(active));
}
function choose(hex){
 if(!api.isActive())button.click();
 api.setColour(hex);
 refresh();
}
button.addEventListener('click',()=>requestAnimationFrame(refresh));
document.querySelectorAll('#penBtn,#textBtn,#eraserBtn').forEach(el=>el.addEventListener('click',()=>requestAnimationFrame(refresh)));
document.addEventListener('keydown',e=>{
 if(e.key==='p'||e.key==='e'||e.key==='t')requestAnimationFrame(refresh);
});
window.addEventListener('cc-highlighter-tool',refresh);
window.addEventListener('cc-highlighter-colour',refresh);
refresh();
})();