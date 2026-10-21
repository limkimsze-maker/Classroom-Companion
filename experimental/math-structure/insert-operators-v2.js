(function(){
'use strict';
// V2-only: extend the existing mathematical Insert selector, not the toolbar.
const operators=[['+','Addition +'],['−','Subtraction −'],['×','Multiplication ×'],['÷','Division ÷']];
const prefix='v2-arithmetic-';
function insert(value){
 const f=window.WhiteboardEquationFormatter;
 if(!f||typeof f.createHandwriting!=='function'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return false;
 const w=Math.max(1,typeof cssW==='number'?cssW:700),h=Math.max(1,typeof cssH==='number'?cssH:500);
 const obj=f.createHandwriting(value,{x:.42,y:.35,w:Math.min(.10,70/w),h:Math.min(.13,65/h)},typeof color==='string'?color:'#17324d');
 if(!obj)return false;
 obj.v2InsertedOperator=true;strokes.push(obj);redraw();syncUi();
 try{tool='select';syncUi()}catch(e){}
 return true;
}
function enhance(sel){
 if(sel.dataset.v2Operators==='yes')return;
 const opts=Array.from(sel.options||[]);
 if(!opts.some(o=>/Fraction\s*½|Fraction|Power\s*x|Integral/.test(o.textContent||'')))return;
 if(!opts.some(o=>/Insert/.test(o.textContent||'')))return;
 const first=opts.findIndex(o=>/Fraction/.test(o.textContent||''));
 if(first<0)return;
 for(let i=operators.length-1;i>=0;i--){
  const [value,label]=operators[i],o=document.createElement('option');
  o.value=prefix+value;o.textContent=label;sel.add(o,first);
 }
 sel.dataset.v2Operators='yes';
 sel.addEventListener('change',function(e){
  if(!String(sel.value).startsWith(prefix))return;
  const value=sel.value.slice(prefix.length);
  e.stopImmediatePropagation();
  if(!insert(value)&&typeof say==='function')say('Unable to insert operator');
  sel.selectedIndex=0;
 },true);
}
function scan(){document.querySelectorAll('select').forEach(enhance)}
const obs=new MutationObserver(scan);
function start(){scan();obs.observe(document.documentElement,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();