(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function')return;
const clone=v=>JSON.parse(JSON.stringify(v));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const START_Y=60,ROW_GAP=145,BAR_H=76,X0=180,MAX_W=650,MODEL_H=585;
let panel=null,down=null;
function isThree(o){return !!(o&&o.smartType==='barModel'&&o.smartBarType==='comparison'&&Math.round(Number(o.barCount)||0)===3)}
function widths(o){const a=Array.isArray(o?.barCompareWidths)?o.barCompareWidths:[];return [0,1,2].map(i=>clamp(Number(a[i]??(1-i*.11))||.5,.16,1))}
function key(rows){return rows.slice().sort((a,b)=>a-b).join('-')}
function totalRelation(o){return Array.isArray(o?.intuitiveRelations)?o.intuitiveRelations.find(r=>r?.type==='total'&&Array.isArray(r.rows)&&key(r.rows)==='0-1-2'):null}
function rowGeom(o,row,W,H){const ws=widths(o),x1=(o.x+o.w*((X0+MAX_W*ws[row])/900))*W,y1=(o.y+o.h*((START_Y+row*ROW_GAP)/MODEL_H))*H,y2=(o.y+o.h*((START_Y+row*ROW_GAP+BAR_H)/MODEL_H))*H;return{x1,y1,y2}}
function totalGeom(o,W,H){const qs=[0,1,2].map(r=>rowGeom(o,r,W,H));return{x:Math.max(...qs.map(q=>q.x1))+28,y1:Math.min(...qs.map(q=>q.y1)),y2:Math.max(...qs.map(q=>q.y2))}}
function hit(clientX,clientY){const cr=canvas.getBoundingClientRect(),x=clientX-cr.left,y=clientY-cr.top;for(let i=strokes.length-1;i>=0;i--){const o=strokes[i];if(!isThree(o)||!totalRelation(o))continue;const q=totalGeom(o,cr.width,cr.height);if(x>=q.x-28&&x<=q.x+40&&y>=q.y1-14&&y<=q.y2+14)return{o,rel:totalRelation(o)}}return null}
function close(){if(panel){panel.remove();panel=null}}
function button(text,cls){const b=document.createElement('button');b.type='button';b.className='btn '+(cls||'');b.textContent=text;b.style.cssText='min-height:40px;padding:7px 10px;font-size:12px;font-weight:900;flex:1';return b}
function show(h,clientX,clientY){
 close();const o=strokes.find(s=>s&&s.smartId===h.o.smartId);if(!o)return;const rel=totalRelation(o);if(!rel)return;
 panel=document.createElement('div');panel.id='totalBracketEditPanel';panel.style.cssText='position:fixed;z-index:10520;width:min(330px,calc(100vw - 16px));padding:12px;background:#fff;border:1px solid #cfd9de;border-radius:14px;box-shadow:0 12px 30px rgba(23,50,77,.24);left:'+Math.max(8,Math.min(innerWidth-338,clientX-150))+'px;top:'+Math.max(8,Math.min(innerHeight-175,clientY+12))+'px';
 const title=document.createElement('div');title.textContent='Total bracket';title.style.cssText='font:900 14px Inter,system-ui,sans-serif;color:#17324d;margin-bottom:8px';
 const input=document.createElement('input');input.type='text';input.maxLength=30;input.placeholder='Type total or ?';input.value=rel.label||'';input.style.cssText='width:100%;border:2px solid #334155;border-radius:10px;padding:8px 10px;font-size:16px;font-weight:700;color:#17324d;margin-bottom:9px';
 const row=document.createElement('div');row.style.cssText='display:flex;gap:8px';const apply=button('Apply','soft'),del=button('Delete total','danger');
 const commit=()=>{const model=strokes.find(s=>s&&s.smartId===o.smartId);if(!model)return;const r=totalRelation(model);if(!r)return;window.__smartBarLastHistory={before:clone(strokes),afterId:model.smartId};r.label=input.value.trim();redraw();if(typeof syncUi==='function')syncUi();close()};
 apply.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();commit()},true);
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commit()}else if(e.key==='Escape'){e.preventDefault();close()}},true);
 del.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const model=strokes.find(s=>s&&s.smartId===o.smartId);if(!model)return;window.__smartBarLastHistory={before:clone(strokes),afterId:model.smartId};model.intuitiveRelations=(model.intuitiveRelations||[]).filter(r=>!(r?.type==='total'&&Array.isArray(r.rows)&&key(r.rows)==='0-1-2'));redraw();if(typeof syncUi==='function')syncUi();close()},true);
 row.append(apply,del);panel.append(title,input,row);document.body.appendChild(panel);setTimeout(()=>input.focus(),0)
}
canvas.addEventListener('pointerdown',e=>{const h=hit(e.clientX,e.clientY);if(!h)return;e.preventDefault();e.stopImmediatePropagation();down={h,x:e.clientX,y:e.clientY}},true);
canvas.addEventListener('pointerup',e=>{if(!down)return;const d=down;down=null;e.preventDefault();e.stopImmediatePropagation();if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<=10)show(d.h,e.clientX,e.clientY)},true);
canvas.addEventListener('click',e=>{if(hit(e.clientX,e.clientY)){e.preventDefault();e.stopImmediatePropagation()}},true);
document.addEventListener('pointerdown',e=>{if(panel&&!panel.contains(e.target))close()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()},true);
})();
