(function(){
'use strict';
// Editing is opt-in and only for objects created by handwriting Beautify.
// One tap selects for moving/resizing; a SECOND tap within 440 ms edits text.
// Never restart recognition or alter local learning samples.
if(typeof canvas==='undefined'||typeof strokes==='undefined'||
   window.ClassroomHandwritingDoubleTapEdit)return;

let down=null,lastTap=null,dialog=null,renderTicket=0;
const clone=x=>JSON.parse(JSON.stringify(x));
function editable(o){return !!(o&&o.type==='image'&&o.handwritingBeautified===true&&!o.locked&&strokes.includes(o))}
function hit(e){
 const obj=window.ClassroomPointTapReselect?.hitObject?.(e);
 return editable(obj)?obj:null;
}
function dismiss(){
 renderTicket++;
 if(dialog){dialog.remove();dialog=null}
}
function open(obj){
 if(!editable(obj)||dialog)return false;
 const overlay=document.createElement('div');
 overlay.id='ccHandwritingReeditDialog';overlay.className='handwriting-review-backdrop';
 overlay.style.cssText='position:fixed;inset:0;z-index:20500;display:flex;align-items:flex-start;justify-content:center;overflow:auto;overscroll-behavior:contain;padding:max(12px,env(safe-area-inset-top)) 12px 16px;background:rgba(23,50,77,.26)';
 const panel=document.createElement('section');
 panel.className='handwriting-review';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
 panel.setAttribute('aria-labelledby','ccHandwritingEditTitle');
 panel.style.cssText='box-sizing:border-box;position:relative;width:min(500px,100%);max-height:calc(100dvh - 24px);overflow:auto;margin:0 auto;padding:16px;border-radius:15px;background:#fff;border:1px solid #cbd5df;box-shadow:0 16px 42px #17324d40;color:#17324d;font:13px system-ui,sans-serif';
 const title=document.createElement('h2');title.id='ccHandwritingEditTitle';title.textContent='Edit beautified handwriting';
 title.style.cssText='font:900 17px system-ui;margin:0 0 5px';
 const hint=document.createElement('p');hint.textContent='Edit the recognised text. Apply to update this object; Cancel leaves it unchanged.';
 hint.style.cssText='font:12px/1.5 system-ui;margin:0 0 12px;color:#475467';
 const label=document.createElement('label');label.htmlFor='ccHandwritingEditInput';label.textContent='Recognised text';
 label.style.cssText='display:block;font:800 12px system-ui';
 const input=document.createElement('input');input.id='ccHandwritingEditInput';input.type='text';
 input.maxLength=600;input.autocomplete='off';input.value=String(obj.handwritingReading??obj.equationExpression??'');
 input.style.cssText='box-sizing:border-box;width:100%;font:700 18px system-ui;border:1px solid #91bdb7;border-radius:9px;margin-top:6px;padding:10px;color:#17324d;min-height:44px';
 const options=document.createElement('div');options.style.cssText='display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:12px 0 8px';
 const modeLabel=document.createElement('label');modeLabel.textContent='Display: ';
 const mode=document.createElement('select');mode.setAttribute('aria-label','Handwriting editing display');
 for(const [key,value] of [['auto','Text / Numbers'],['math','Math formulas']]){
  const option=document.createElement('option');option.value=key;option.textContent=value;mode.appendChild(option);
 }
 mode.value=obj.handwritingReadMode==='math'?'math':'auto';
 mode.style.cssText='font:13px system-ui;padding:7px;border:1px solid #cbd5df;border-radius:8px';
 modeLabel.appendChild(mode);
 const colourLabel=document.createElement('label');colourLabel.textContent='Colour: ';
 const colour=document.createElement('input');colour.type='color';
 colour.value=/^#[0-9a-f]{6}$/i.test(obj.equationColour||'')?obj.equationColour:'#17324d';
 colour.setAttribute('aria-label','Handwriting colour');colour.style.cssText='width:38px;height:33px;vertical-align:middle';
 colourLabel.appendChild(colour);options.append(modeLabel,colourLabel);
 const image=document.createElement('img');image.alt='Updated handwriting preview';
 image.style.cssText='display:block;max-width:100%;width:auto;height:auto;max-height:105px;object-fit:contain;object-position:left center;margin:7px 0 9px;padding:7px;background:#f7fafb;border-radius:8px';
 image.src=obj.src;
 const status=document.createElement('p');status.setAttribute('role','status');status.style.cssText='min-height:15px;font:12px system-ui;color:#667085;margin:7px 0';
 const actions=document.createElement('div');actions.style.cssText='display:flex;gap:9px;justify-content:flex-end;margin-top:10px';
 const apply=document.createElement('button');apply.type='button';apply.className='btn soft';apply.textContent='✓ Apply';
 const cancel=document.createElement('button');cancel.type='button';cancel.className='btn';cancel.textContent='Cancel';
 apply.style.cssText='font:800 13px system-ui;padding:9px 14px;border:1px solid #0f766e;border-radius:9px;background:#e7f7f4;color:#0a5d57';
 cancel.style.cssText='font:800 13px system-ui;padding:9px 14px;border:1px solid #cbd5df;border-radius:9px;background:white';
 actions.append(cancel,apply);
 panel.append(title,hint,label,input,options,image,status,actions);overlay.appendChild(panel);document.body.appendChild(overlay);dialog=overlay;
 let latest=null,updateSerial=0,working=false;
 const initial=String(input.value);
 async function render(){
  const text=String(input.value||'').trim(),ticket=++updateSerial;
  if(!text){latest=null;apply.disabled=true;status.textContent='Enter text before applying.';return}
  apply.disabled=true;status.textContent='Preparing preview…';
  const where={x:obj.x,y:obj.y,w:obj.w,h:obj.h},ink=colour.value;
  let made=null;
  try{
   const advanced=mode.value==='math'||/\\[A-Za-z]+|[√∫∑]/.test(text);
   if(advanced){
    await window.WhiteboardMathRenderer?.ensure?.();
    made=window.WhiteboardMathRenderer?.create?.(text,where,ink)||null;
   }
   if(!made)made=window.WhiteboardEquationFormatter?.createHandwriting?.(text,where,ink)||null;
   if(!made&&!advanced&&mode.value==='auto'){
    await window.WhiteboardMathRenderer?.ensure?.();
    made=window.WhiteboardMathRenderer?.create?.(text,where,ink)||null;
   }
  }catch(_){}
  if(ticket!==updateSerial||dialog!==overlay)return;
  latest=made;
  apply.disabled=!made;
  if(made){image.src=made.src;status.textContent='Ready to apply.'}
  else status.textContent='Unable to preview this notation. Check the text and try again.';
 }
 let debounce=null;
 function queueRender(){clearTimeout(debounce);debounce=setTimeout(render,100)}
 input.addEventListener('input',queueRender);
 colour.addEventListener('input',queueRender);
 mode.addEventListener('change',queueRender);
 function cancelEdit(){clearTimeout(debounce);dismiss()}
 cancel.onclick=cancelEdit;
 overlay.addEventListener('pointerdown',e=>{if(e.target===overlay)e.stopPropagation()},true);
 overlay.addEventListener('click',e=>{if(e.target===overlay)cancelEdit()});
 function keydown(e){
  if(dialog!==overlay)return;
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancelEdit()}
  else if(e.key==='Enter'){e.preventDefault();e.stopPropagation();if(!apply.disabled)apply.click()}
 }
 input.addEventListener('keydown',keydown);
 apply.onclick=async()=>{
  if(working||apply.disabled||dialog!==overlay||!editable(obj))return;
  const value=String(input.value||'').trim();if(!value)return;
  working=true;apply.disabled=true;clearTimeout(debounce);
  // Do not rerender or rewrite an unchanged object: retain V2 fixed-font,
  // roots, fractions and superscript geometry when the edit is a no-op.
  const same=value===initial&&colour.value===(/^#[0-9a-f]{6}$/i.test(obj.equationColour||'')?obj.equationColour:'#17324d')&&
    mode.value===(obj.handwritingReadMode==='math'?'math':'auto');
  if(!same){
   if(!latest){working=false;apply.disabled=false;return}
   const before=clone(strokes);
   obj.src=latest.src;
   obj.equationExpression=value;obj.handwritingReading=value;
   obj.handwritingReadMode=mode.value;
   obj.equationColour=colour.value;
   if(latest.equationLatex)obj.equationLatex=latest.equationLatex;
   else delete obj.equationLatex;
   if(latest.equationLayout)obj.equationLayout=latest.equationLayout;
   // Preserve smartOriginal, id, x/y/w/h, relative sizes and object stacking.
   redraw();window.ClassroomHandwritingEditHistory?.record?.(before);syncUi();
  }
  dismiss();
  window.ClassroomObjectSelection?.clear?.();
  window.ClassroomUnifiedSmartTransforms?.clear?.();
  window.ClassroomFingerPointer?.setActive?.(true);
 };
 // Keep the editor anchored above the mobile keyboard. No forced focus,
 // which avoids an unexpected keyboard opening during live teaching.
 return true;
}
function reset(){down=null;lastTap=null}
window.addEventListener('pointerdown',e=>{
 down=null;
 if(dialog||e.target!==canvas||e.isPrimary===false||(e.button!=null&&e.button!==0))return;
 if(typeof tool!=='string'||!['finger','select'].includes(tool))return;
 const obj=hit(e);
 if(obj)down={obj,id:e.pointerId,x:e.clientX,y:e.clientY};
},true);
window.addEventListener('pointerup',e=>{
 const p=down;down=null;
 if(!p||dialog||e.target!==canvas||p.id!=null&&e.pointerId!=null&&p.id!==e.pointerId||
    Math.hypot(e.clientX-p.x,e.clientY-p.y)>8||hit(e)!==p.obj)return;
 const now=Date.now();
 const double=lastTap&&lastTap.obj===p.obj&&now-lastTap.time<=440&&
   Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<=28;
 lastTap={obj:p.obj,time:now,x:e.clientX,y:e.clientY};
 if(!double)return;
 lastTap=null;
 // A double tap must only open editing AFTER pointerup has completed. In
 // Point mode the first tap may still be changing to Select asynchronously.
 setTimeout(()=>{if(editable(p.obj)&&typeof tool==='string'&&['select','finger'].includes(tool))open(p.obj)},0);
},true);
window.addEventListener('pointercancel',()=>{down=null},true);
document.addEventListener('whiteboard-annotation-context',()=>{reset();dismiss()},true);
window.ClassroomHandwritingDoubleTapEdit={open,close:dismiss};
})();
