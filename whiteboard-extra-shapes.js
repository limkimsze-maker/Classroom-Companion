(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const labels={
 en:{square:'Square',triangle:'Triangle'},
 zh:{square:'正方形',triangle:'三角形'},
 ms:{square:'Segi empat sama',triangle:'Segi tiga'},
 ta:{square:'சதுரம்',triangle:'முக்கோணம்'}
};
const L=labels[edition]||labels.en;
let mode='',start=null,preview=null;
const menus=[...document.body.querySelectorAll('div')].filter(d=>{
 const txt=d.textContent||'';return txt.includes('Rectangle')||txt.includes('矩形')||txt.includes('Segi empat')||txt.includes('செவ்வகம்');
});
const menu=menus.find(d=>getComputedStyle(d).position==='fixed')||menus[0];
if(!menu)return;
function button(label,m){const b=document.createElement('button');b.className='btn';b.type='button';b.textContent=label;b.style.display='block';b.style.width='100%';b.style.margin='3px 0';b.onclick=()=>{mode=m;start=null;preview=null;menu.style.display='none';tool='select';syncUi();canvas.style.cursor='crosshair'};menu.appendChild(b)}
button(L.square,'square');button(L.triangle,'triangle');
function point(e){const r=canvas.getBoundingClientRect();return{x:Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),y:Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))}}
function make(m,a,b){const c=typeof colour==='string'?colour:'#17324d',sz=Math.max(2,Number(size?.value)||4),x1=a.x,y1=a.y,x2=b.x,y2=b.y,pts=[];
 if(m==='square'){
   const dx=x2-x1,dy=y2-y1,side=Math.max(Math.abs(dx)*cssW,Math.abs(dy)*cssH),sx=(dx<0?-side:side)/cssW,sy=(dy<0?-side:side)/cssH;
   const xx=Math.max(0,Math.min(1,x1+sx)),yy=Math.max(0,Math.min(1,y1+sy));
   pts.push({x:x1,y:y1},{x:xx,y:y1},{x:xx,y:yy},{x:x1,y:yy},{x:x1,y:y1});
 }else{
   pts.push({x:(x1+x2)/2,y:y1},{x:x2,y:y2},{x:x1,y:y2},{x:(x1+x2)/2,y:y1});
 }
 return{erase:false,colour:c,size:sz,points:pts,shape:m};
}
canvas.addEventListener('pointerdown',e=>{if(!mode||(e.button!==undefined&&e.button!==0))return;start=point(e);preview=make(mode,start,start);current=preview;try{canvas.setPointerCapture?.(e.pointerId)}catch{};redraw();e.preventDefault();e.stopImmediatePropagation()},true);
canvas.addEventListener('pointermove',e=>{if(!mode||!start)return;preview=make(mode,start,point(e));current=preview;redraw();e.preventDefault();e.stopImmediatePropagation()},true);
canvas.addEventListener('pointerup',e=>{if(!mode||!start)return;preview=make(mode,start,point(e));strokes.push(preview);current=null;start=null;preview=null;mode='';redraw();syncUi();try{canvas.releasePointerCapture?.(e.pointerId)}catch{};e.preventDefault();e.stopImmediatePropagation()},true);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&mode){mode='';start=null;preview=null;current=null;redraw();syncUi()}},true);
})();
