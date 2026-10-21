/* Alpha uses the established V2 storage namespace so existing V2 learning
 * remains available. Original Alpha/V1 data remains the read-only fallback. */
(function(){
'use strict';
const original=window.localStorage,prefix='classroom-structural-v2-preview:';
const read=key=>{
 const value=original.getItem(prefix+key);
 if(value===null)return original.getItem(key);
 try{return JSON.parse(value).value}catch(_){return null;}
};
const keys=()=>{
 const all=new Set();for(let i=0;i<original.length;i++){
  const key=original.key(i);if(key!==null)all.add(key.startsWith(prefix)?key.slice(prefix.length):key);
 }
 return [...all].filter(key=>read(key)!==null);
};
const storage={getItem:key=>read(String(key)),
 setItem:(key,value)=>original.setItem(prefix+String(key),JSON.stringify({value:String(value)})),
 removeItem:key=>original.setItem(prefix+String(key),JSON.stringify({value:null})),
 clear:()=>keys().forEach(key=>storage.removeItem(key)),key:index=>keys()[index]??null,
 get length(){return keys().length;}};
Object.defineProperty(window,'localStorage',{value:storage,configurable:true});
document.addEventListener('DOMContentLoaded',()=>{
 document.title='Whiteboard V2 • Classroom Companion';
 document.getElementById('boardTitle').textContent='Classroom Companion · Whiteboard V2';
 document.getElementById('boardSubtitle').textContent='Write, draw and explain · V2 recognition · My Documents.';
 document.getElementById('boardWrap').dataset.watermark='Whiteboard V2';
 // Move the existing CAD entry, preserving its protected click behaviour.
 const rectangles=new Set(['Rectangle','矩形','Segi empat','செவ்வகம்']);
 const solids=new Set(['3D Solid','3D 立体图形','Pepejal 3D','3D திண்மம்']);
 const shapeMenu=Array.from(document.body.children).find(el=>
  el.tagName==='DIV'&&el.style.position==='fixed'&&
  Array.from(el.children).some(b=>b.tagName==='BUTTON'&&rectangles.has(b.textContent.trim())));
 const solidButton=Array.from(document.querySelectorAll('button')).find(b=>solids.has(b.textContent.trim()));
 if(shapeMenu&&solidButton){
  solidButton.id='alpha3DShapesBtn';
  solidButton.setAttribute('aria-haspopup','dialog');
  shapeMenu.appendChild(solidButton);
 }

});
})();
