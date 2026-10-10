(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof cssW==='undefined'||typeof cssH==='undefined')return;

const qs=new URLSearchParams(location.search),lang=(qs.get('edition')||'en').toLowerCase();
const labels={
 en:{rotate:'Drag to rotate',angle:'Rotate'},
 zh:{rotate:'拖动以旋转',angle:'旋转'},
 ms:{rotate:'Seret untuk putar',angle:'Putar'},
 ta:{rotate:'சுழற்ற இழுக்கவும்',angle:'சுழற்று'}
};
const X=labels[lang]||labels.en;
const TRANSPARENT='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
let target=null,gesture=null,preview=null,angleBubble=null;

function isPointObject(s){return !!(s&&Array.isArray(s.points)&&s.points.length&&!s.erase)}
function rotatable(s){return !!(s&&!s.locked&&(s.type==='image'||isPointObject(s)))}
function pointBounds(s){
 if(!isPointObject(s))return null;
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 for(const p of s.points){if(!p)continue;const x=p.x*cssW,y=p.y*cssH;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
 if(!Number.isFinite(minX))return null;
 const pad=Math.max(5,Number(s.size||2)*.75);
 return{x:minX-pad,y:minY-pad,w:Math.max(12,maxX-minX+pad*2),h:Math.max(12,maxY-minY+pad*2)};
}
function bounds(s){
 if(!s)return null;
 if(s.type==='image'&&Number.isFinite(s.x)&&Number.isFinite(s.y)&&Number.isFinite(s.w)&&Number.isFinite(s.h))return{x:s.x*cssW,y:s.y*cssH,w:s.w*cssW,h:s.h*cssH};
 return pointBounds(s);
}
function handleFor(s){const b=bounds(s);if(!b)return null;return{x:b.x+b.w/2,y:Math.max(18,b.y-30),r:9,b};}
function canvasPoint(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left),y:(e.clientY-r.top)};}
function hitHandle(e,s){const h=handleFor(s);if(!h)return false;const p=canvasPoint(e);return Math.hypot(p.x-h.x,p.y-h.y)<=18;}
function segDist(px,py,a,b){const ax=a.x*cssW,ay=a.y*cssH,bx=b.x*cssW,by=b.y*cssH,dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;if(!l2)return Math.hypot(px-ax,py-ay);let t=((px-ax)*dx+(py-ay)*dy)/l2;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));}
function hitStroke(s,x,y){const pts=s.points||[],tol=Math.max(8,Number(s.size||2)+6);for(let i=1;i<pts.length;i++)if(segDist(x,y,pts[i-1],pts[i])<=tol)return true;return pts.length===1&&Math.hypot(x-pts[0].x*cssW,y-pts[0].y*cssH)<=tol;}
function hitImage(s,x,y){const b=bounds(s);return !!(b&&x>=b.x-6&&x<=b.x+b.w+6&&y>=b.y-6&&y<=b.y+b.h+6);}
function hitObjectAt(e){const p=canvasPoint(e);for(let i=strokes.length-1;i>=0;i--){const s=strokes[i];if(!rotatable(s))continue;if(isPointObject(s)&&hitStroke(s,p.x,p.y))return s;if(s.type==='image'&&hitImage(s,p.x,p.y))return s}return null;}
function centerOf(s){const b=bounds(s);return b?{x:b.x+b.w/2,y:b.y+b.h/2}:null;}
function normAngle(a){while(a>Math.PI)a-=Math.PI*2;while(a<=-Math.PI)a+=Math.PI*2;return a;}
function snapped(a,shift){if(!shift)return a;const step=Math.PI/12;return Math.round(a/step)*step;}
function angleFromEvent(e,c){const p=canvasPoint(e);return Math.atan2(p.y-c.y,p.x-c.x);}
function rotatePointList(points,c,delta){const cs=Math.cos(delta),sn=Math.sin(delta);return points.map(p=>{const x=p.x*cssW-c.x,y=p.y*cssH-c.y;return{x:(c.x+x*cs-y*sn)/cssW,y:(c.y+x*sn+y*cs)/cssH}});}

function ensureBubble(){if(angleBubble)return;angleBubble=document.createElement('div');Object.assign(angleBubble.style,{position:'absolute',zIndex:'80',display:'none',pointerEvents:'none',padding:'4px 7px',borderRadius:'999px',background:'#17324d',color:'#fff',font:'900 10px Inter,system-ui,sans-serif'});wrap.appendChild(angleBubble);}
function showAngle(s,delta){ensureBubble();const h=handleFor(s);if(!h)return;angleBubble.textContent=`${X.angle} ${Math.round(delta*180/Math.PI)}°`;angleBubble.style.left=`${Math.max(4,h.x-28)}px`;angleBubble.style.top=`${Math.max(2,h.y-28)}px`;angleBubble.style.display='block';}
function hideAngle(){if(angleBubble)angleBubble.style.display='none';}

function makePreview(s,src){const b=bounds(s);if(!b)return null;const img=document.createElement('img');img.src=src;Object.assign(img.style,{position:'absolute',zIndex:'70',pointerEvents:'none',left:`${b.x}px`,top:`${b.y}px`,width:`${b.w}px`,height:`${b.h}px`,transformOrigin:'50% 50%',userSelect:'none'});wrap.appendChild(img);return img;}
function removePreview(){if(preview){preview.remove();preview=null;}}

function bakeImage(src,angle,displayW,displayH,center){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{try{const c=Math.cos(angle),s=Math.sin(angle),nw=Math.max(1,Math.ceil(Math.abs(img.naturalWidth*c)+Math.abs(img.naturalHeight*s))),nh=Math.max(1,Math.ceil(Math.abs(img.naturalWidth*s)+Math.abs(img.naturalHeight*c))),off=document.createElement('canvas');off.width=nw;off.height=nh;const o=off.getContext('2d');o.translate(nw/2,nh/2);o.rotate(angle);o.drawImage(img,-img.naturalWidth/2,-img.naturalHeight/2);const newSrc=off.toDataURL('image/png'),cssNW=Math.abs(displayW*c)+Math.abs(displayH*s),cssNH=Math.abs(displayW*s)+Math.abs(displayH*c);resolve({src:newSrc,w:cssNW/cssW,h:cssNH/cssH,x:(center.x-cssNW/2)/cssW,y:(center.y-cssNH/2)/cssH})}catch(err){reject(err)}};img.onerror=reject;img.src=src});}

const baseRedraw=redraw;
redraw=function(){baseRedraw();drawRotateHandle();};
function drawRotateHandle(){
 if(typeof tool!=='undefined'&&tool!=='select')return;
 if(!target||!rotatable(target)||!strokes.includes(target)||gesture)return;
 const h=handleFor(target);if(!h)return;
 ctx.save();ctx.globalCompositeOperation='source-over';ctx.strokeStyle='#7c3aed';ctx.fillStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(h.b.x+h.b.w/2,h.b.y-3);ctx.lineTo(h.x,h.y+h.r);ctx.stroke();ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#7c3aed';ctx.font='900 12px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('↻',h.x,h.y+.5);ctx.restore();
}

function startRotate(e){
 if(!target||!rotatable(target))return false;const c=centerOf(target);if(!c)return false;
 const startAngle=angleFromEvent(e,c);gesture={target,type:target.type==='image'?'image':'points',center:c,startAngle,delta:0};
 if(gesture.type==='points')gesture.points=JSON.parse(JSON.stringify(target.points));
 else{gesture.src=target.src;gesture.x=target.x;gesture.y=target.y;gesture.w=target.w;gesture.h=target.h;preview=makePreview(target,target.src);target.src=TRANSPARENT;redraw();}
 showAngle(target,0);try{canvas.setPointerCapture?.(e.pointerId)}catch{};return true;
}
function moveRotate(e){if(!gesture)return;let d=normAngle(angleFromEvent(e,gesture.center)-gesture.startAngle);d=snapped(d,e.shiftKey);gesture.delta=d;if(gesture.type==='points'){gesture.target.points=rotatePointList(gesture.points,gesture.center,d);redraw()}else if(preview){preview.style.transform=`rotate(${d}rad)`;showAngle(gesture.target,d)}showAngle(gesture.target,d);}
async function finishRotate(e,cancel){
 if(!gesture)return;const g=gesture;gesture=null;hideAngle();try{canvas.releasePointerCapture?.(e?.pointerId)}catch{}
 if(cancel){if(g.type==='points')g.target.points=g.points;else{g.target.src=g.src;g.target.x=g.x;g.target.y=g.y;g.target.w=g.w;g.target.h=g.h}removePreview();redraw();return;}
 if(g.type==='points'){redraw();return;}
 removePreview();
 try{const r=await bakeImage(g.src,g.delta,g.w*cssW,g.h*cssH,g.center);g.target.src=r.src;g.target.w=r.w;g.target.h=r.h;g.target.x=Math.max(0,Math.min(1-r.w,r.x));g.target.y=Math.max(0,Math.min(1-r.h,r.y));}
 catch(err){g.target.src=g.src;g.target.x=g.x;g.target.y=g.y;g.target.w=g.w;g.target.h=g.h;}
 redraw();
}

window.addEventListener('pointerdown',e=>{
 if(e.button!==undefined&&e.button!==0)return;
 if(typeof tool!=='undefined'&&tool!=='select'){target=null;return;}
 if(target&&hitHandle(e,target)){if(startRotate(e)){e.preventDefault();e.stopImmediatePropagation();return;}}
 const hit=hitObjectAt(e);target=hit||null;
 setTimeout(()=>{if(!gesture)redraw()},0);
},true);
window.addEventListener('pointermove',e=>{if(!gesture)return;moveRotate(e);e.preventDefault();e.stopImmediatePropagation();},true);
window.addEventListener('pointerup',e=>{if(!gesture)return;finishRotate(e,false);e.preventDefault();e.stopImmediatePropagation();},true);
window.addEventListener('pointercancel',e=>{if(!gesture)return;finishRotate(e,true);e.preventDefault();e.stopImmediatePropagation();},true);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&gesture){e.preventDefault();e.stopImmediatePropagation();finishRotate(e,true)}},true);

[document.getElementById('penBtn'),document.getElementById('textBtn'),document.getElementById('eraserBtn')].forEach(b=>b?.addEventListener('click',()=>{target=null;redraw()}));
canvas.title=X.rotate;
})();
