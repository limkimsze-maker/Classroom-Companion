(function(){
'use strict';
// Experimental V2 only. Never alter the production toolbar or recognition rules.
function init(){
 const tools=document.querySelector('.tools');
 if(!tools||document.getElementById('v2OperatorInsert'))return;
 const select=document.createElement('select');
 select.id='v2OperatorInsert';select.className='btn';
 select.setAttribute('aria-label','Insert arithmetic operator');
 [['','Insert operator…'],['+','Addition +'],['−','Subtraction −'],['×','Multiplication ×'],['÷','Division ÷']].forEach(([v,t])=>{
  const o=document.createElement('option');o.value=v;o.textContent=t;select.append(o);
 });
 const textButton=document.getElementById('textBtn');
 if(textButton)textButton.insertAdjacentElement('afterend',select);else tools.append(select);
 select.addEventListener('change',function(){
  const value=select.value;select.value='';if(!value)return;
  const fmt=window.WhiteboardEquationFormatter;
  if(!fmt||typeof fmt.createHandwriting!=='function'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function'){
   if(typeof say==='function')say('Equation formatter unavailable');return;
  }
  const w=Math.max(1,typeof cssW==='number'?cssW:700),h=Math.max(1,typeof cssH==='number'?cssH:500);
  const placement={x:.42,y:.35,w:Math.min(.10,70/w),h:Math.min(.13,65/h)};
  const colour=typeof color==='string'?color:'#17324d';
  const obj=fmt.createHandwriting(value,placement,colour);
  if(!obj){if(typeof say==='function')say('Could not insert operator');return;}
  obj.v2InsertedOperator=true;strokes.push(obj);redraw();syncUi();
  try{tool='select';syncUi()}catch(_){}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();