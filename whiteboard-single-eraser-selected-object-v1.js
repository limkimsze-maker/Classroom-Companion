(function(){
'use strict';
// A single Eraser control: delete an actively selected object/group;
// otherwise keep the existing freehand Eraser unchanged.
if(window.ClassroomSingleEraserSelection)return;
const button=document.getElementById('eraserBtn');
if(!button||typeof strokes==='undefined'||typeof tool==='undefined')return;
function visible(el){
 return !!(el&&!el.hidden&&el.style?.display&&el.style.display!=='none');
}
function chosen(){
 // A deliberate marquee selection is an explicit group, so erase together.
 const grouped=window.WhiteboardMarqueeSelection?.get?.()||[];
 const validGrouped=grouped.filter(o=>strokes.includes(o)&&!o.locked&&!o.background);
 if(validGrouped.length)return validGrouped;
 // Text, images, beautified handwriting and tapped Smart Math objects all
 // share the main selection controller, which provides move/resize grips.
 const selected=window.ClassroomObjectSelection?.selected?.();
 if(selected&&strokes.includes(selected)&&!selected.locked)return [selected];
 // Alpha's dedicated Smart Math transform owns its own selection state.
 const smart=window.ClassroomUnifiedSmartTransforms?.selected?.();
 const smartFrame=document.getElementById('ccUnifiedSmartSelectionFrame');
 if(smart&&visible(smartFrame)){
  const obj=strokes.find(o=>o.smartId===smart&&!o.locked);
  if(obj)return [obj];
 }
 // Beta V2 fraction handles have a separate owner. Only use its selection
 // while the blue frame (move/resize controls) is actually visible.
 const fractionFrame=document.getElementById('smartFractionTransformLayer')?.firstElementChild;
 const fraction=window.ClassroomFractionSegmentOptions?.selected?.()||
                window.ClassroomFractionTransforms?.selected?.();
 if(fraction&&visible(fractionFrame)){
  const obj=strokes.find(o=>o.smartId===fraction&&!o.locked);
  if(obj)return [obj];
 }
 return [];
}
function eraseSelection(){
 if(tool!=='select')return false;
 const items=chosen();if(!items.length)return false;
 const handled=window.ClassroomObjectSelection?.deleteObjects?.(items);
 if(!handled)return false;
 // Keep the familiar create → edit → point rhythm after removing an object.
 window.ClassroomFingerPointer?.setActive?.(true);
 return true;
}
// Window capture must run before legacy marquee and Beta V2 Eraser handlers,
// so an object is deleted once and a single Undo entry is recorded.
window.addEventListener('click',e=>{
 if(e.target!==button&&!button.contains(e.target))return;
 if(!eraseSelection())return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
},true);
window.ClassroomSingleEraserSelection={eraseSelection};
})();