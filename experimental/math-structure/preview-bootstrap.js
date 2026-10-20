/* Preview writes use separate storage. Existing personal samples are read as
 * a starting point; preview confirmation/Undo cannot modify protected V1 data. */
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
 document.title='V2 Trial • Classroom Companion';
 document.getElementById('boardTitle').textContent='Classroom Companion · V2 Trial';
 document.getElementById('boardSubtitle').textContent='Local recognition · separate trial corrections · your usual whiteboard stays available.';
 const link=document.createElement('a');link.href='whiteboard-smart-beta.html';
 link.textContent='Usual whiteboard';link.className='btn';link.style.textDecoration='none';
 document.querySelector('.top')?.appendChild(link);
});
})();
