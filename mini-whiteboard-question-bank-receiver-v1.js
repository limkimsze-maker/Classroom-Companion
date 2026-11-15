/* Prepared question receiver for the independent Mini Whiteboard Classroom page.
   Only accepts same-origin messages from the embedded parent Whiteboard Smart.
   Keeps answer keys in the teacher side; existing Worker handles answer evaluation. */
(function(){
'use strict';
if(new URLSearchParams(location.search).get('embedded')!=='1')return;
const $=id=>document.getElementById(id);
const processed=new Set();
function isQuestion(q){return !!q&&typeof q==='object'&&typeof q.image==='string'&&q.image.length<=1400000&&/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(q.image)&&['blank','mcq','tf'].includes(q.type)&&typeof q.answerKey==='string'&&q.answerKey.length>0&&q.answerKey.length<=400&&(!q.options||Array.isArray(q.options));}
function acknowledge(requestId,status){window.parent.postMessage({type:'ccMiniPreparedResult',requestId,status},location.origin)}
function loadPrepared(q){
  $('answerType').value=q.type;
  if(q.type==='mcq')$('choiceCount').value=String(Math.min(4,Math.max(2,q.options?.length||4)));
  updateAnswerUI();
  if(q.type==='mcq'){
    const entries=[...document.querySelectorAll('#choiceRows input')];
    entries.forEach((field,i)=>{field.value=String(q.options?.[i]||'').slice(0,120)});
    $('choiceAnswer').value=q.answerKey;
  }else if(q.type==='tf')$('trueFalseAnswer').value=q.answerKey;
  else $('answerKey').value=q.answerKey;
  $('prompt').value=String(q.prompt||'').slice(0,600);
  $('displayMode').value=['both','projector','student'].includes(q.visibility)?q.visibility:'both';
  $('questionMinutes').value=String(Math.max(0,Math.min(60,Number(q.minutes)||0)));
  state.cropData=q.image;
  state.sourceCanvas=null;
  state.selection=null;
  $('cropCanvas').classList.add('hidden');
  const container=$('cropResult');container.replaceChildren();
  const image=new Image();image.alt='Prepared whiteboard question';image.src=q.image;container.append(image);
  toast('Prepared question loaded. You can adjust it or launch to the class.');
  document.getElementById('launchQuestion')?.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function handle(e){
 if(e.origin!==location.origin||e.source!==window.parent)return;
 const data=e.data;
 if(data?.type==='ccMiniPrepPing'){
  window.parent.postMessage({type:'ccMiniPrepReady'},location.origin);return;
 }
 if(data?.type!=='ccMiniPreparedLaunch'||!data.requestId||processed.has(data.requestId))return;
 if(!isQuestion(data.question)||state.role!=='teacher'||state.mode==='archive'){
  acknowledge(data.requestId,'invalid');return;
 }
 processed.add(data.requestId);
 if(processed.size>100)processed.clear();
 try{
  loadPrepared(data.question);
  if(!data.launch){acknowledge(data.requestId,'loaded');return;}
  if(!state.room||state.mode==='none'){
    acknowledge(data.requestId,'needsRoom');return;
  }
  if($('launchQuestion').disabled){acknowledge(data.requestId,'needsRoom');return;}
  $('launchQuestion').click();
  acknowledge(data.requestId,'sent');
 }catch(err){console.error('Prepared question launch failed',err);acknowledge(data.requestId,'invalid');}
}
window.addEventListener('message',handle);
window.parent.postMessage({type:'ccMiniPrepReady'},location.origin);
})();
