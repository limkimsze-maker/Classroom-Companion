(function(){
'use strict';
// One-button eraser guidance and quiet contextual hints for live teaching.
// Does not change any recognition, drawing, selection, or Undo algorithms.
if(window.ClassroomSelectionUXFeedback)return;
const erase=document.getElementById('eraserBtn');
const undo=document.getElementById('undoBtn');
if(!erase||!undo||typeof strokes==='undefined'||typeof syncUi!=='function')return;
const selection=()=>window.ClassroomSingleEraserSelection?.selectedObjects?.()||[];
const friendly=o=>{
 if(o?.handwritingBeautified)return 'Beautified handwriting';
 if(o?.smartType==='counter')return 'Counter';
 if(o?.smartType==='fractionBar')return 'Fraction Bar';
 if(o?.smartType==='barModel')return 'Bar Model';
 if(o?.type==='text')return 'Text box';
 if(o?.type==='image')return 'Image';
 return 'Object';
};
const idFor=new WeakMap();let serial=0;
const keyOf=o=>{
 if(!o||typeof o!=='object')return '';
 if(!idFor.has(o))idFor.set(o,++serial);
 return idFor.get(o);
};
function makeNotice(id,interactive=false){
 const el=document.createElement('div');
 el.id=id;el.setAttribute('role','status');el.setAttribute('aria-live','polite');
 el.style.cssText='position:fixed;z-index:10070;bottom:'+(interactive?'56px':'18px')+';'+
  'left:50%;transform:translateX(-50%);box-sizing:border-box;'+
  'width:max-content;max-width:calc(100vw - 24px);'+
  'padding:9px 13px;border-radius:11px;background:#17324d;color:#fff;'+
  'box-shadow:0 4px 16px rgba(20,45,65,.20);font:700 12px/1.4 system-ui,sans-serif;'+
  'text-align:center;display:none;align-items:center;justify-content:center;gap:10px;'+
  'pointer-events:'+(interactive?'auto':'none');
 document.body.appendChild(el);return el;
}
const hint=makeNotice('ccSelectionFeedback');
const snackbar=makeNotice('ccErasedUndoFeedback',true);
const message=document.createElement('span');
const restore=document.createElement('button');
restore.type='button';restore.textContent='↶ Undo';restore.setAttribute('aria-label','Undo object erasure');
restore.style.cssText='flex:0 0 auto;min-height:36px;padding:6px 11px;border-radius:8px;'+
 'border:1px solid #a9eee4;color:#17324d;background:#e6faf6;font:900 12px system-ui;'+
 'cursor:pointer;touch-action:manipulation';
snackbar.append(message,restore);
let hintTimer=0,undoTimer=0,pending=null,lastSelection='',frame=0;
function closeHint(){clearTimeout(hintTimer);hint.style.display='none'}
function closeUndo(){clearTimeout(undoTimer);pending=null;snackbar.style.display='none'}
function updateEraser(){
 const items=typeof tool==='string'&&tool==='select'?selection():[];
 let name=items.length===1?friendly(items[0]):'objects';
 const label=items.length>1?'Erase '+items.length+' selected objects':
   items.length===1?'Erase selected '+name:'Erase handwriting or drawing';
 erase.title=label;erase.setAttribute('aria-label',label);
 return items;
}
function changed(){
 frame=0;
 const items=updateEraser();
 if(pending&&JSON.stringify(strokes)!==pending.after)closeUndo();
 const selectionKey=items.map(keyOf).join(':');
 if(selectionKey===lastSelection)return;
 lastSelection=selectionKey;closeHint();
 if(!selectionKey||pending||document.querySelector('.handwriting-review-backdrop,#ccHandwritingReeditDialog'))return;
 const name=items.length===1?friendly(items[0]):items.length+' objects';
 hint.textContent=name+' selected · Move or resize'+
   (items.length===1&&items[0].handwritingBeautified?' · Double-tap to edit':'');
 hint.style.display='flex';
 hintTimer=setTimeout(closeHint,2500);
}
function schedule(){
 if(frame)return;
 frame=requestAnimationFrame(changed);
}
const prev=syncUi;
syncUi=function(){const value=prev.apply(this,arguments);schedule();return value};
erase.addEventListener('pointerenter',updateEraser);
erase.addEventListener('focus',updateEraser);
erase.addEventListener('pointerdown',updateEraser,true);
document.addEventListener('classroom-object-erased',e=>{
 const after=e.detail?.after;
 if(typeof after!=='string'||after!==JSON.stringify(strokes))return;
 closeHint();closeUndo();
 const count=Number(e.detail?.count)||1;
 message.textContent=count>1?count+' objects erased':'Object erased';
 pending={after};
 snackbar.style.display='flex';
 undoTimer=setTimeout(closeUndo,5500);
 schedule();
},true);
restore.addEventListener('click',e=>{
 e.preventDefault();e.stopPropagation();
 if(!pending||pending.after!==JSON.stringify(strokes)||undo.disabled){
  closeUndo();return;
 }
 closeUndo();
 undo.click(); // Use the whiteboard's own history owner, never reimplement Undo.
 schedule();
});
undo.addEventListener('click',e=>{
 if(e.target===undo)closeUndo();
},true);
document.addEventListener('whiteboard-annotation-context',()=>{closeUndo();closeHint();lastSelection='';schedule()},true);
// A new toolbar operation invalidates the one-tap undo offer, except Eraser
// (which creates a fresh one) and Point/Select (which change presentation only).
document.addEventListener('click',e=>{
 const b=e.target?.closest?.('button');
 if(!b||b===erase||b===restore||b===undo)return;
 if(['clearBtn','redoBtn','penBtn','textBtn','highlighterBtn'].includes(b.id))closeUndo();
},true);
window.addEventListener('pointerup',schedule,true);
window.addEventListener('pointercancel',schedule,true);
window.ClassroomSelectionUXFeedback={
 refresh:schedule,
 eraserLabel:()=>erase.title,
 dismiss:()=>{closeUndo();closeHint()},
 getUndoSnapshot:()=>pending?.after||null
};
updateEraser();
})();
