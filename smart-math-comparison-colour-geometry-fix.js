(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function')return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let last=null;
function svgData(svg){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function layout(o){const n=Math.max(2,Math.min(5,Number(o.barCount)||2));return Number(o.barCompareLayoutVersion)>=2?{n,H:Math.max(340,150+n*145),x:180,maxW:650,y:60,gap:145,h:76}:{n,H:Math.max(260,120+n*115),x:70,maxW:760,y:45,gap:105,h:72}}
function rebuild(o){
 if(!o||o.smartType!=='barModel'||o.smartBarType!=='comparison')return;
 const g=layout(o),widths=Array.from({length:g.n},(_,i)=>clamp(Number(o.barCompareWidths?.[i]??(1-i*.11))||.5,.16,1)),fills=Array.from({length:g.n},(_,i)=>o.barFills?.[i]||'#ffffff'),els=[];
 for(let i=0;i<g.n;i++)els.push(`<rect x="${g.x}" y="${g.y+i*g.gap}" width="${g.maxW*widths[i]}" height="${g.h}" rx="2" fill="${fills[i]}" stroke="#17324d" stroke-width="8"/>`);
 o.barCompareWidths=widths;
 o.src=svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${g.H}" viewBox="0 0 900 ${g.H}">${els.join('')}</svg>`);
}
function pickAt(e){
 const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/Math.max(1,r.width),y=(e.clientY-r.top)/Math.max(1,r.height);
 for(let i=strokes.length-1;i>=0;i--){const o=strokes[i];if(!o||o.smartType!=='barModel'||o.smartBarType!=='comparison')continue;if(x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h)return o}
 return null;
}
canvas.addEventListener('click',e=>{last=pickAt(e)||last},true);
document.addEventListener('click',e=>{
 if(!last||!(e.target instanceof HTMLButtonElement))return;
 const s=e.target.style||{},looksColour=e.target.getAttribute('aria-label')&&s.borderRadius==='50%';
 if(!looksColour)return;
 setTimeout(()=>{if(!strokes.includes(last)){last=null;return}rebuild(last);redraw();if(typeof syncUi==='function')syncUi()},0);
},false);
})();
