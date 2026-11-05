/* Consolidated TEST fork of production AGPL-3.0 teacher annotation overlay.
   Source remains credited and production annotation-tools.js is untouched.
   Music Score Studio — teacher annotation overlay.
   Separate from playable notation and the Smart Music Pen beautifier.
   No external dependencies; works on editor, simplified and engraved scores. */
(() => {
'use strict';
const NS='http://www.w3.org/2000/svg';
const modes=new Set(['cursor','select','hand','arrow','pen','highlighter','line','rect','ellipse','text','eraser']);
const shapeModes=new Set(['arrow','pen','highlighter','line','rect','ellipse']);
const $=id=>document.getElementById(id);
const toolbar=$('annotationToolbar');
if(!toolbar)return;
const state={tool:'cursor',view:null,key:'',layer:null,scroller:null,target:null,items:[],history:[],future:[],selected:null,drawing:null,hidden:false,sequence:0,size:{width:1,height:1}};
const status=$('annotationStatus');
function say(s){status.textContent=s;}
function color(){return /^#[0-9a-f]{6}$/i.test($('annotationColor').value)?$('annotationColor').value:'#e35d46';}
function thickness(){return Math.max(1,Math.min(18,Number($('annotationWidth').value)||4));}
function safeId(){return 'ann'+Date.now().toString(36)+(++state.sequence).toString(36);}
const clone=x=>JSON.parse(JSON.stringify(x));
function scoreName(){
 return document.body.classList.contains('piano-active')
 ? ($('pianoTitle')?.textContent||'Imported score')+' '+($('pianoCounts')?.textContent||'')
 : ($('title')?.value||'My Music Score');
}
function activeView(){
 if(!document.body.classList.contains('piano-active'))return 'editor';
 return $('engravedScore')&&!$('engravedScore').hidden?'engraved':'simple';
}
function viewParts(view){
 if(view==='editor')return {scroller:$('scrollZone'),target:$('score')};
 if(view==='simple')return {scroller:document.querySelector('.pianoScoreScroll'),target:$('pianoScore')};
 return {scroller:$('engravedScore'),target:$('engravedScore')};
}
function localKey(view){
 const name=scoreName().slice(0,130);
 const page=view==='simple'?(' '+($('simplePageLabel')?.textContent||'')):'';
 return 'cc-music-anno-v2:'+view+':'+name+page;
}
function safePoint(p){return Array.isArray(p)&&p.length===2&&p.every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=-1&&x<=2);}
function verifyItem(it){
 if(!it||typeof it!=='object'||!['pen','highlighter','line','arrow','rect','ellipse','text','hand'].includes(it.type)||!Array.isArray(it.points)||!it.points.length||it.points.length>1600||!it.points.every(safePoint))return false;
 if(it.type==='text'&&typeof it.text!=='string')return false;
 return true;
}
function readStore(key){
 try{const obj=JSON.parse(localStorage.getItem(key)||'{}');return Array.isArray(obj.items)?obj.items.filter(verifyItem).slice(0,350):[]}catch(_){return []}
}
function persist(){
 if(!state.key)return;
 try{localStorage.setItem(state.key,JSON.stringify({version:2,items:state.items.slice(0,350)}));}catch(e){say('Annotations displayed, but browser storage may be full. Export your marks.');}
}
function remember(){
 state.history.push(clone(state.items));if(state.history.length>45)state.history.shift();state.future=[];
}
function updateButtons(){
 $('annotationUndo').disabled=!state.history.length;
 $('annotationRedo').disabled=!state.future.length;
 $('annotationDelete').disabled=!state.selected;
 $('annotationClear').disabled=!state.items.length;
 $('annotationExport').disabled=!state.items.length;
}
// Friendly cursor icons (SVG generated locally; no image downloads).
function cuteToolCursor(kind){
 const heads={
  pen:{body:'#56cdb7',cap:'#168b94',tip:'#324856',face:'#24505a'},
  highlighter:{body:'#ffe17c',cap:'#f0a73f',tip:'#f5bc29',face:'#78551b'},
  eraser:{body:'#ffb4c7',cap:'#f080aa',tip:'#ffe1ea',face:'#843c66'}
 };
 if(!(kind in heads))return '';
 const c=heads[kind];
 const text=kind==='highlighter'?'HI':kind==='eraser'?'♡':'✦';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">'+
 '<g transform="rotate(30 24 24)">'+
 '<rect x="14" y="4" width="19" height="31" rx="7" fill="'+c.body+'" stroke="'+c.face+'" stroke-width="2"/>'+
 '<path d="M14 13H33" stroke="'+c.cap+'" stroke-width="5"/>'+
 '<circle cx="20" cy="23" r="1.8" fill="'+c.face+'"/><circle cx="27" cy="23" r="1.8" fill="'+c.face+'"/>'+
 '<path d="M20 28Q23.5 31 27 28" stroke="'+c.face+'" stroke-width="1.6" fill="none" stroke-linecap="round"/>'+
 (kind==='highlighter'?'<path d="M15 35H32L29 45H18Z" fill="'+c.tip+'" stroke="'+c.face+'" stroke-width="2"/>':
 kind==='eraser'?'<path d="M15 35Q23 39 32 35V44Q23 48 15 44Z" fill="'+c.tip+'" stroke="'+c.face+'" stroke-width="2"/>':
 '<path d="M16 35H31L24 46Z" fill="#f4d5a0" stroke="'+c.face+'" stroke-width="2"/><path d="M22 42L24 46L26 42Z" fill="'+c.tip+'"/>')+
 '</g></svg>';
 return 'url("data:image/svg+xml,'+encodeURIComponent(svg)+'") '+(kind==='eraser'?'24 45':'24 45')+', crosshair';
}
function toolCursor(kind){
 return cuteToolCursor(kind)||(kind==='select'?'grab':kind==='hand'?'pointer':kind==='text'?'text':kind==='cursor'?'default':'crosshair');
}

function setMode(next){
 if(!modes.has(next))return;
 state.tool=next;state.drawing=null;
 if(next!=='select')state.selected=null;
 document.querySelectorAll('[data-annotation-tool]').forEach(b=>{
  const isActive=b.dataset.annotationTool===next;
  b.classList.toggle('active',isActive);b.setAttribute('aria-pressed',String(isActive));
 });
 $('annotationToolbar').dataset.activeTool=next;
 if(state.layer)state.layer.style.pointerEvents=next==='cursor'?'none':'auto';
 if(state.layer)state.layer.style.cursor=toolCursor(next);
 render();
 const descriptions={cursor:'Cursor: annotate no more; use the original note editor normally.',select:'Selector: tap a mark, drag to move it, or use its corner handle to resize.',hand:'Pointing hand: tap a note to place 👆; tap elsewhere to move the hand.',arrow:'Arrow: drag from the start to the point you want pupils to notice.',pen:'Pen: draw on the current score without changing playable notes.',highlighter:'Cute Highlighter: swipe across notes to emphasise them.',line:'Line: drag to draw a straight line.',rect:'Rectangle: drag to outline a musical passage.',ellipse:'Oval: drag to circle a note or section.',text:'Text: tap the score and type an annotation.',eraser:'Cute Eraser: tap or swipe over annotation marks to remove them.'};
 say(descriptions[next]);
 scheduleSync();
}
function removeLayer(){
 if(state.layer?.isConnected)state.layer.remove();
 state.layer=null;state.scroller=null;state.target=null;state.selected=null;state.drawing=null;
}
function geometry(view,scroller,target){
 if(view==='engraved'){
  return {left:0,top:0,width:Math.max(300,scroller.scrollWidth,scroller.clientWidth),height:Math.max(260,scroller.scrollHeight,scroller.clientHeight)};
 }
 const a=target.getBoundingClientRect(),b=scroller.getBoundingClientRect();
 return {left:a.left-b.left+scroller.scrollLeft,top:a.top-b.top+scroller.scrollTop,width:a.width,height:a.height};
}

function scoreGeometry(){
 if(activeView()!=='editor'||typeof window.musicScoreAnnotationGeometry!=='function')return null;
 try{return window.musicScoreAnnotationGeometry()}catch(_){return null}
}
function anchorForItem(it,g){
 if(!g||!it?.points?.length)return null;
 const pts=it.points,mid=[pts.reduce((s,p)=>s+p[0],0)/pts.length,pts.reduce((s,p)=>s+p[1],0)/pts.length];
 const radius=Math.max(...pts.map(p=>Math.hypot((p[0]-mid[0])*g.width,(p[1]-mid[1])*g.height)));
 const notes=(g.notes||[]).map(n=>({n,d:Math.hypot((n.x-mid[0])*g.width,(n.y-mid[1])*g.height)})).sort((a,b)=>a.d-b.d);
 // Short, unequivocally note-localised marks may follow the note; passage
 // annotations are anchored to their bar instead of guessing a note identity.
 if(it.type!=='highlighter'&&radius<=27&&notes[0]?.d<=27&&
  (!notes[1]||notes[1].d-notes[0].d>12))
  return {type:'note',id:notes[0].n.id,base:[notes[0].n.x,notes[0].n.y],size:[g.width,g.height],
   bar:notes[0].n.bar,barBase:g.bars[notes[0].n.bar]?
   [g.bars[notes[0].n.bar].left,g.bars[notes[0].n.bar].top]:null};
 const bars=(g.bars||[]).map((b,i)=>({i,b,d:Math.hypot((b.left+b.width/2-mid[0])*g.width,
  (b.top+36/g.height-mid[1])*g.height)})).sort((a,b)=>a.d-b.d);
 if(!bars.length)return null;
 return {type:'bar',index:bars[0].i,base:[bars[0].b.left,bars[0].b.top],size:[g.width,g.height]};
}
function reflowTeacherMarks(){
 const g=scoreGeometry();if(!g||!state.items.length)return;
 let changed=false;
 for(const it of state.items){
  if(!it.anchor){it.anchor=anchorForItem(it,g);if(it.anchor)changed=true;continue}
  let next=null;
  if(it.anchor.type==='note'){
   const n=g.notes.find(n=>n.id===it.anchor.id);
   if(n)next=[n.x,n.y];
   else if(Number.isInteger(it.anchor.bar)&&it.anchor.barBase&&g.bars[it.anchor.bar]){
    // The note has been deleted: preserve the mark in bar-local units
    // instead of stretching its old fractional screen position.
    const oldSize=it.anchor.size||[g.width,g.height],b=g.bars[it.anchor.bar];
    const px=it.anchor.barBase[0]*oldSize[0],py=it.anchor.barBase[1]*oldSize[1];
    it.points=it.points.map(p=>[
     Math.max(-1,Math.min(2,(b.left*g.width+p[0]*oldSize[0]-px)/g.width)),
     Math.max(-1,Math.min(2,(b.top*g.height+p[1]*oldSize[1]-py)/g.height))
    ]);
    it.anchor={type:'bar',index:it.anchor.bar,base:[b.left,b.top],size:[g.width,g.height]};
    changed=true;continue;
   }
  }else if(it.anchor.type==='bar'){
   const b=g.bars[it.anchor.index];if(b)next=[b.left,b.top];
  }
  if(!next||!Array.isArray(it.anchor.base))continue;
  // Preserve note/bar-local *SVG units*, not proportions of the entire
  // score height. A system break may grow H from 296 to 498 while a mark
  // must remain e.g. 18 units above its notehead.
  const oldSize=it.anchor.size||[g.width,g.height];
  const ox=it.anchor.base[0]*oldSize[0],oy=it.anchor.base[1]*oldSize[1];
  const nx=next[0]*g.width,ny=next[1]*g.height;
  if(Math.abs(nx-ox)>1e-7||Math.abs(ny-oy)>1e-7||
     oldSize[0]!==g.width||oldSize[1]!==g.height){
   it.points=it.points.map(p=>[
    Math.max(-1,Math.min(2,(nx+p[0]*oldSize[0]-ox)/g.width)),
    Math.max(-1,Math.min(2,(ny+p[1]*oldSize[1]-oy)/g.height))
   ]);
   it.anchor.base=next;it.anchor.size=[g.width,g.height];
   if(it.anchor.type==='note'){
    const n=g.notes.find(n=>n.id===it.anchor.id),bar=n&&g.bars[n.bar];
    if(bar){it.anchor.bar=n.bar;it.anchor.barBase=[bar.left,bar.top]}
   }
   changed=true;
  }
 }
 if(changed){persist();render()}
}
function sync(){
 const view=activeView();
 const parts=viewParts(view),scroller=parts.scroller,target=parts.target;
 if(!scroller||!target||target.getBoundingClientRect().width<120)return;
 const key=localKey(view);
 const changed=state.view!==view||state.key!==key;
 if(changed){
  removeLayer();state.view=view;state.key=key;state.items=readStore(key);state.history=[];state.future=[];
  const names={editor:'teacher melody',simple:'simplified music',engraved:'engraved score'};
  say('Annotation board: '+names[view]+'. Your marks are saved in this browser.');
 }
 if(!state.layer||!state.layer.isConnected||state.scroller!==scroller||state.target!==target){
  if(state.layer?.isConnected)state.layer.remove();
  state.layer=document.createElementNS(NS,'svg');
  state.layer.setAttribute('class','annotationLayer');
  state.layer.setAttribute('aria-label','Teacher annotation drawing layer');
  state.layer.setAttribute('role','img');
  scroller.append(state.layer);
  state.scroller=scroller;state.target=target;
  state.layer.addEventListener('pointerdown',startPointer);
  state.layer.addEventListener('pointermove',movePointer);
  state.layer.addEventListener('pointerup',endPointer);
  state.layer.addEventListener('pointercancel',cancelPointer);
 }
 const g=geometry(view,scroller,target);
 if(g.width<100||g.height<20)return;
 const updated=state.size.width!==g.width||state.size.height!==g.height||
  state.layer.style.left!==g.left+'px'||state.layer.style.top!==g.top+'px';
 state.size={width:g.width,height:g.height};
 state.layer.style.left=g.left+'px';
 state.layer.style.top=g.top+'px';
 state.layer.style.width=g.width+'px';
 state.layer.style.height=g.height+'px';
 state.layer.setAttribute('viewBox','0 0 '+Math.round(g.width)+' '+Math.round(g.height));
 state.layer.style.pointerEvents=state.tool==='cursor'?'none':'auto';
 state.layer.style.cursor=toolCursor(state.tool);
 state.layer.hidden=state.hidden;
 if(updated||changed)render();
 if(view==='editor')reflowTeacherMarks();
 updateButtons();
}
let scheduled=false;
function scheduleSync(){
 if(scheduled)return;scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;sync();});
}
function node(tag,attrs={},text=null){
 const item=document.createElementNS(NS,tag);
 for(const [key,value] of Object.entries(attrs))item.setAttribute(key,String(value));
 if(text!==null)item.textContent=String(text);
 return item;
}
function px(pt){return {x:pt[0]*state.size.width,y:pt[1]*state.size.height};}
function pointsToText(ps){return ps.map(p=>{const {x,y}=px(p);return x.toFixed(1)+','+y.toFixed(1);}).join(' ');}
function bounds(it){
 const pts=it.points.map(px);
 const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const extra=(it.type==='text'?24:it.type==='hand'?34:6);
 return {minX:minX-extra,maxX:maxX+extra,minY:minY-extra,maxY:maxY+extra};
}
function paintShape(svg,it,selected=false,preview=false){
 if(!verifyItem(it))return;
 const group=node('g',{'data-annotation-id':it.id||'draft','class':preview?'annotationPreview':'annotationObject'});
 const p0=px(it.points[0]),p1=px(it.points.at(-1)),colour=it.color||'#e35d46';
 const sw=Math.max(1,Math.min(18,Number(it.width)||4));
 const colorAttrs={stroke:colour,'stroke-width':sw,'stroke-linecap':'round','stroke-linejoin':'round',fill:'none'};
 let shape=null;
 if(['pen','highlighter'].includes(it.type)){
  shape=node('polyline',{points:pointsToText(it.points),...colorAttrs,
   stroke:colour,'stroke-width':it.type==='highlighter'?Math.max(12,sw*5):sw,
   'stroke-opacity':it.type==='highlighter'?.32:1});
 }else if(it.type==='line'||it.type==='arrow'){
  shape=node('line',{x1:p0.x,y1:p0.y,x2:p1.x,y2:p1.y,...colorAttrs});
  group.append(node('line',{x1:p0.x,y1:p0.y,x2:p1.x,y2:p1.y,stroke:'transparent','stroke-width':Math.max(20,sw*3)}));
  if(it.type==='arrow'){
   const angle=Math.atan2(p1.y-p0.y,p1.x-p0.x),sz=Math.max(12,sw*3.4);
   const a=[p1.x-Math.cos(angle-.53)*sz,p1.y-Math.sin(angle-.53)*sz];
   const b=[p1.x-Math.cos(angle+.53)*sz,p1.y-Math.sin(angle+.53)*sz];
   group.append(node('polyline',{points:p1.x+','+p1.y+' '+a.join(',')+' '+b.join(','),fill:colour,stroke:colour,'stroke-width':1.4}));
  }
 }else if(it.type==='rect'){
  shape=node('rect',{x:Math.min(p0.x,p1.x),y:Math.min(p0.y,p1.y),width:Math.abs(p1.x-p0.x),height:Math.abs(p1.y-p0.y),...colorAttrs});
  group.append(node('rect',{x:Math.min(p0.x,p1.x),y:Math.min(p0.y,p1.y),width:Math.abs(p1.x-p0.x),height:Math.abs(p1.y-p0.y),fill:'transparent',stroke:'transparent','stroke-width':Math.max(18,sw*3)}));
 }else if(it.type==='ellipse'){
  shape=node('ellipse',{cx:(p0.x+p1.x)/2,cy:(p0.y+p1.y)/2,rx:Math.abs(p1.x-p0.x)/2,ry:Math.abs(p1.y-p0.y)/2,...colorAttrs});
  group.append(node('ellipse',{cx:(p0.x+p1.x)/2,cy:(p0.y+p1.y)/2,rx:Math.abs(p1.x-p0.x)/2,ry:Math.abs(p1.y-p0.y)/2,fill:'transparent',stroke:'transparent','stroke-width':Math.max(18,sw*3)}));
 }else if(it.type==='text'){
  shape=node('text',{x:p0.x,y:p0.y,fill:colour,'font-size':Math.max(16,sw*4.3),
   'font-family':'system-ui, Segoe UI, sans-serif','font-weight':'700',
   'paint-order':'stroke fill',stroke:'#ffffff','stroke-opacity':.8,'stroke-width':2},String(it.text||'').slice(0,120));
 }else if(it.type==='hand'){
  shape=node('text',{x:p0.x-19,y:p0.y+15,'font-size':Math.max(34,sw*9),
   'font-family':'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif'},'👆');
 }
 if(shape)group.append(shape);
 if((it.type==='pen'||it.type==='highlighter')&&state.tool==='select'){
  group.append(node('polyline',{points:pointsToText(it.points),fill:'none',stroke:'transparent','stroke-width':24}));
 }
 if(selected){
  const b=bounds(it);
  group.append(node('rect',{x:b.minX-3,y:b.minY-3,width:b.maxX-b.minX+6,height:b.maxY-b.minY+6,fill:'none',stroke:'#008e9e',
   'stroke-width':2,'stroke-dasharray':'7 5','pointer-events':'none'}));
  group.append(node('rect',{x:b.maxX-7,y:b.maxY-7,width:18,height:18,rx:3,fill:'#087b86',stroke:'white','stroke-width':2,
   'data-annotation-control':'resize','data-annotation-id':it.id}));
 }
 svg.append(group);
}
function render(){
 if(!state.layer||!state.layer.isConnected||state.hidden)return;
 state.layer.replaceChildren();
 for(const it of state.items)paintShape(state.layer,it,it.id===state.selected);
 if(state.drawing?.preview)paintShape(state.layer,state.drawing.preview,false,true);
 updateButtons();
}
function position(ev){
 const r=state.layer.getBoundingClientRect();
 if(!r.width||!r.height)return [0,0];
 return [Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height))];
}
function distanceFromLine(p,a,b){
 const x=p[0]*state.size.width,y=p[1]*state.size.height;
 const ax=a[0]*state.size.width,ay=a[1]*state.size.height,bx=b[0]*state.size.width,by=b[1]*state.size.height;
 const vx=bx-ax,vy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*vx+(y-ay)*vy)/Math.max(1,vx*vx+vy*vy)));
 return Math.hypot(x-ax-t*vx,y-ay-t*vy);
}
function nearestShape(pt){
 let best=null,bestDistance=Infinity;
 for(let i=state.items.length-1;i>=0;i--){
  const it=state.items[i];
  let distance=Infinity;
  if(['pen','highlighter'].includes(it.type)){
   for(let j=1;j<it.points.length;j++)distance=Math.min(distance,distanceFromLine(pt,it.points[j-1],it.points[j]));
  }else if(it.type==='line'||it.type==='arrow'){
   distance=distanceFromLine(pt,it.points[0],it.points.at(-1));
  }else{
   const b=bounds(it),x=pt[0]*state.size.width,y=pt[1]*state.size.height;
   const dx=Math.max(b.minX-x,0,x-b.maxX),dy=Math.max(b.minY-y,0,y-b.maxY);
   distance=Math.hypot(dx,dy);
  }
  if(distance<bestDistance){best=it;bestDistance=distance;}
 }
 return bestDistance<=21?best:null;
}
function addObject(obj){
 if(activeView()==='editor')obj.anchor=anchorForItem(obj,scoreGeometry());
 remember();state.items.push(obj);
 persist();state.selected=obj.id;
 render();
}
function deleteSelected(){
 if(!state.selected)return;
 const index=state.items.findIndex(it=>it.id===state.selected);
 if(index<0)return;
 remember();state.items.splice(index,1);state.selected=null;persist();render();say('Annotation deleted. Undo restores it.');
}
function eraseNear(pt){
 const nearest=nearestShape(pt);
 if(!nearest)return false;
 const index=state.items.findIndex(it=>it.id===nearest.id);
 if(index<0)return false;
 state.items.splice(index,1);
 if(state.selected===nearest.id)state.selected=null;
 return true;
}
function startPointer(ev){
 if(state.tool==='cursor'||state.hidden||ev.button>0)return;
 ev.preventDefault();
 const point=position(ev),tool=state.tool;
 if(tool==='text'){
  const label=window.prompt('Enter an annotation for pupils (up to 120 characters):','');
  if(label&&label.trim())addObject({id:safeId(),type:'text',points:[point],text:label.trim().slice(0,120),color:color(),width:thickness()});
  return;
 }
 if(tool==='hand'){
  // A single movable pointing hand is more useful than accumulating many hands.
  remember();state.items=state.items.filter(x=>x.type!=='hand');
  const obj={id:safeId(),type:'hand',points:[point],color:color(),width:thickness()};
  if(activeView()==='editor')obj.anchor=anchorForItem(obj,scoreGeometry());
  state.items.push(obj);state.selected=obj.id;persist();render();
  say('Pointing hand placed. Use Selector to drag it, or tap again to move it.');
  return;
 }
 if(tool==='eraser'){
  state.drawing={kind:'erase',changed:false};
  const before=clone(state.items);
  if(eraseNear(point)){state.history.push(before);state.future=[];state.drawing.changed=true;persist();render();}
  try{state.layer.setPointerCapture(ev.pointerId)}catch(_){}
  return;
 }
 if(tool==='select'){
  const grip=ev.target.closest?.('[data-annotation-control="resize"]');
  const hit=ev.target.closest?.('[data-annotation-id]');
  const id=hit?.getAttribute('data-annotation-id')||nearestShape(point)?.id;
  const item=state.items.find(it=>it.id===id);
  if(!item){state.selected=null;render();return;}
  state.selected=item.id;render();
  state.drawing={kind:grip?'resize':'move',id:item.id,down:point,original:clone(item),changed:false};
  try{state.layer.setPointerCapture(ev.pointerId)}catch(_){}
  return;
 }
 if(shapeModes.has(tool)){
  const obj={id:safeId(),type:tool,points:[point,point],color:color(),width:thickness()};
  state.drawing={kind:'draw',preview:obj,down:point};
  try{state.layer.setPointerCapture(ev.pointerId)}catch(_){}
  render();
 }
}
function translateShape(points,dx,dy){
 return points.map(p=>[Math.max(-.1,Math.min(1.1,p[0]+dx)),Math.max(-.1,Math.min(1.1,p[1]+dy))]);
}
function resizeShape(original,down,here){
 const bb=bounds(original),w=state.size.width,h=state.size.height;
 const max0=[bb.maxX/w,bb.maxY/h],min0=[bb.minX/w,bb.minY/h];
 const dx=here[0]-down[0],dy=here[1]-down[1];
 const sx=Math.max(.25,Math.min(5,(max0[0]+dx-min0[0])/Math.max(.01,max0[0]-min0[0])));
 const sy=Math.max(.25,Math.min(5,(max0[1]+dy-min0[1])/Math.max(.01,max0[1]-min0[1])));
 return original.points.map(p=>[
  Math.max(-.1,Math.min(1.1,min0[0]+(p[0]-min0[0])*sx)),
  Math.max(-.1,Math.min(1.1,min0[1]+(p[1]-min0[1])*sy))
 ]);
}
function movePointer(ev){
 if(!state.drawing)return;
 const pt=position(ev),d=state.drawing;
 if(d.kind==='erase'){
  if(eraseNear(pt)){
   if(!d.changed){remember();d.changed=true;}
   persist();render();
  }
 }else if(d.kind==='draw'){
  if(['pen','highlighter'].includes(d.preview.type)){
   const prev=d.preview.points.at(-1);
   if(Math.hypot((pt[0]-prev[0])*state.size.width,(pt[1]-prev[1])*state.size.height)>1.5&&d.preview.points.length<1400)d.preview.points.push(pt);
  }else d.preview.points[1]=pt;
  render();
 }else if(d.kind==='move'||d.kind==='resize'){
  const obj=state.items.find(it=>it.id===d.id);if(!obj)return;
  const dx=pt[0]-d.down[0],dy=pt[1]-d.down[1];
  if(Math.hypot(dx*state.size.width,dy*state.size.height)<2&&!d.changed)return;
  obj.points=d.kind==='move'?translateShape(d.original.points,dx,dy):resizeShape(d.original,d.down,pt);
  d.changed=true;render();
 }
}
function endPointer(ev){
 if(!state.drawing)return;
 const d=state.drawing,pt=position(ev);
 try{state.layer.releasePointerCapture(ev.pointerId)}catch(_){}
 state.drawing=null;
 if(d.kind==='draw'){
  if(!['pen','highlighter'].includes(d.preview.type))d.preview.points[1]=pt;
  const length=d.preview.points.length===2?Math.hypot((d.preview.points[1][0]-d.preview.points[0][0])*state.size.width,(d.preview.points[1][1]-d.preview.points[0][1])*state.size.height):d.preview.points.length;
  if(length>=4){
   addObject(d.preview);
   say('Annotation added. Use Selector to move or resize it; use Undo to reverse.');
  }else render();
 }else if(d.kind==='move'||d.kind==='resize'){
  if(d.changed){
   state.history.push(state.items.map(x=>x.id===d.id?clone(d.original):clone(x)));
   if(state.history.length>45)state.history.shift();
   state.future=[];
   const item=state.items.find(x=>x.id===d.id);
   if(item&&activeView()==='editor')item.anchor=anchorForItem(item,scoreGeometry());
   persist();
   say('Annotation moved or resized. Undo restores its previous position.');
  }
  render();
 }else if(d.kind==='erase'){
  if(d.changed){persist();say('Marks erased. Undo restores them.');}
  render();
 }
}
function cancelPointer(ev){
 if(!state.drawing)return;
 if(state.drawing.kind==='draw'){state.drawing=null;render();return;}
 endPointer(ev);
}
function undo(){
 if(!state.history.length)return;
 state.future.push(clone(state.items));state.items=state.history.pop();state.selected=null;persist();render();
 say('Annotation undone.');
}
function redo(){
 if(!state.future.length)return;
 state.history.push(clone(state.items));state.items=state.future.pop();state.selected=null;persist();render();
 say('Annotation restored.');
}
function clearAnnotations(){
 if(!state.items.length)return;
 if(!confirm('Clear annotations from this view? The musical notes will not be affected.'))return;
 remember();state.items=[];state.selected=null;persist();render();
 say('Annotations cleared. Undo restores them.');
}
// Clear Score previously removed only musical events and legacy music-pen strokes.
// Handwritten sketches from Teacher Annotations live in a separate persisted
// SVG overlay, so that layer must also be cleared and saved in the same action.
function clearAnnotationsWithScore(){
 const view=activeView(),key=localKey(view);
 if(state.key!==key)sync();
 if(state.key===key){
  if(state.items.length)remember(); // Annotation Undo can restore the marks.
  state.items=[];state.selected=null;state.drawing=null;
  persist();
  // Remove ink immediately even when the layer was hidden.
  if(state.layer?.isConnected)state.layer.replaceChildren();
  render();updateButtons();
 }else{
  // A still-hidden engraving may not have a layout width yet. Clear its
  // persistent drawing cache anyway so old marks cannot reappear later.
  try{localStorage.setItem(key,JSON.stringify({version:2,items:[]}));}catch(_){}
 }
 say('Score annotations and handwritten marks cleared. Use Annotation Undo to restore them.');
}
document.addEventListener('music-score-studio:clear-annotations',clearAnnotationsWithScore);
function exportAnnotations(){
 if(!state.items.length)return;
 const data={format:'classroom-companion-music-annotations',version:2,score:scoreName(),view:state.view,items:state.items};
 const file=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(file);
 const a=document.createElement('a');a.href=url;a.download='music-score-annotations.json';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1200);say('Annotation JSON exported for backup.');
}
function importAnnotations(file){
 file.text().then(text=>{
  const doc=JSON.parse(text);
  if(doc?.format!=='classroom-companion-music-annotations'||!Array.isArray(doc.items)||doc.items.length>350||doc.items.some(i=>!verifyItem(i)))throw Error('Invalid annotation file.');
  remember();state.items=clone(doc.items);state.selected=null;persist();render();
  say('Annotations imported into this view. Undo restores the previous marks.');
 }).catch(e=>say('Unable to import annotations: '+e.message));
}
document.querySelectorAll('[data-annotation-tool]').forEach(button=>{
 button.addEventListener('click',()=>{scheduleSync();setMode(button.dataset.annotationTool);});
});
$('annotationUndo').addEventListener('click',undo);
$('annotationRedo').addEventListener('click',redo);
$('annotationDelete').addEventListener('click',deleteSelected);
$('annotationClear').addEventListener('click',clearAnnotations);
$('annotationExport').addEventListener('click',exportAnnotations);
$('annotationImport').addEventListener('click',()=>$('annotationImportFile').click());
$('annotationImportFile').addEventListener('change',event=>{
 const file=event.target.files[0];event.target.value='';if(file)importAnnotations(file);
});
$('annotationHide').addEventListener('click',()=>{
 state.hidden=!state.hidden;
 if(state.layer)state.layer.hidden=state.hidden;
 $('annotationHide').textContent=state.hidden?'Show marks':'Hide marks';
 $('annotationHide').setAttribute('aria-pressed',String(state.hidden));
 if(state.hidden)setMode('cursor');
 else render();
});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&state.tool!=='cursor'&&document.activeElement?.tagName!=='INPUT')setMode('cursor');
 if((event.key==='Delete'||event.key==='Backspace')&&state.tool==='select'&&state.selected&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){
  event.preventDefault();deleteSelected();
 }
});
window.addEventListener('resize',scheduleSync);
document.addEventListener('music-score-studio:score-layout',scheduleSync);
document.addEventListener('click',event=>{
 if(event.target.closest('#notationViewToggle, #closePiano, #simplePrev, #simpleNext, #openXML, #omrImportButton, #omrCameraButton, #omrChooseButton'))
  setTimeout(scheduleSync,60);
},{capture:true});
const watch=new MutationObserver(()=>{
 const view=activeView();
 const p=viewParts(view);
 if(view!==state.view||localKey(view)!==state.key||!state.layer?.isConnected||
   (p.target&&state.target!==p.target))scheduleSync();
});
watch.observe(document.body,{attributes:true,attributeFilter:['class']});
for(const id of ['pianoPanel','engravedScore']){
 const el=$(id);if(el)watch.observe(el,{attributes:true,attributeFilter:['hidden'],childList:true});
}
const simpleScroll=document.querySelector('.pianoScoreScroll');
if(simpleScroll)watch.observe(simpleScroll,{attributes:true,attributeFilter:['hidden']});
const label=$('simplePageLabel');
if(label)watch.observe(label,{childList:true,characterData:true,subtree:true});
const title=$('title');if(title)title.addEventListener('change',scheduleSync);
setInterval(scheduleSync,1800);
scheduleSync();
setMode('cursor');
say('Ready: use the hand or arrow to point at notes. Cursor returns control to the music editor.');
})();