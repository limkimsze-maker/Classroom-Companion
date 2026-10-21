/* Focused, explicitly labelled classroom letters. Reuses V2 browser learning. */
(function(root){
'use strict';
const W=600,H=330,LABELS=['l','k','g'];
function teachExample(ink,width,height,label){
 if(!LABELS.includes(label))throw Error('Choose lowercase l, k or g.');
 if(!Array.isArray(ink)||!ink.length||ink.length>30||!(width>0&&height>0)||
    ink.reduce((n,s)=>n+(s?.points?.length||0),0)>16000||
    ink.some(s=>!s?.points?.length||s.points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>1||p.y>1)))throw Error('Write one letter on the pad first.');
 const learner=root.WhiteboardHandwritingLearning,reader=root.WhiteboardHandwritingMath;
 if(!learner?.confirm||!reader?.rasterDigit)throw Error('Learning is unavailable. Refresh V2 and try again.');
 // The teacher labels ONE complete glyph. Do not reuse a mistaken decoder's
 // segmentation: all of the pad's pen lifts belong to this labelled example.
 const parts=ink.map(source=>({source,size:Number(source.size)||5,points:source.points.map(p=>({x:p.x*width,y:p.y*height}))}));
 return learner.confirm({text:'?',tokens:[{char:'?',score:0,parts}],uncertain:[]},label,reader.rasterDigit,ink,width,height,'auto');
}
function open({onClose}={}){
 if(root.document.getElementById('letterTrainerV2'))return;
 const previous=root.document.activeElement,overlay=document.createElement('div');overlay.id='letterTrainerV2';
 overlay.style.cssText='position:fixed;inset:0;background:#102a43b8;z-index:20000;display:grid;place-items:center;padding:12px';
 const panel=document.createElement('section');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','letterTrainerTitle');
 panel.style.cssText='width:min(660px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:18px;padding:18px;color:#17324d;font:14px/1.5 Arial,sans-serif;box-shadow:0 20px 70px #0005';
 const heading=document.createElement('h2');heading.id='letterTrainerTitle';heading.textContent='Train lowercase letters';heading.style.cssText='margin:0 0 8px;font-size:21px';
 const guide=document.createElement('p');guide.textContent='Choose a letter, write it once in your usual style, then save. Add a few natural variations. Use Test writing on a fresh attempt to check recognition without saving.';
 const targets=document.createElement('div');targets.style.cssText='display:flex;gap:10px;margin:12px 0';
 let label='l',ink=[],active=null,history=[],busy=false,closed=false,ticket=0;
 const targetButtons=LABELS.map(value=>{const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=value;b.setAttribute('aria-label','Train lowercase '+value);b.style.cssText='font-size:28px;min-width:64px;min-height:52px';b.onclick=()=>{label=value;clear();status.textContent='Write lowercase '+value+'.';update()};targets.append(b);return b});
 const prompt=document.createElement('p');prompt.id='letterTrainerPrompt';prompt.style.cssText='font-weight:700;margin:8px 0';
 const pad=document.createElement('canvas');pad.id='letterTrainerPad';pad.width=W;pad.height=H;pad.tabIndex=0;
 pad.setAttribute('aria-label','Handwriting training pad');pad.style.cssText='display:block;width:100%;height:auto;aspect-ratio:600/330;background:#f8fbfd;border:2px solid #94a3b8;border-radius:12px;touch-action:none;cursor:crosshair';
 const ctx=pad.getContext('2d'),counts=document.createElement('p');counts.id='letterTrainerCounts';counts.style.cssText='font-size:12px;color:#526477;margin:8px 0';
 const status=document.createElement('p');status.id='letterTrainerStatus';status.setAttribute('role','status');status.style.cssText='min-height:42px;margin:8px 0';status.textContent='Write one lowercase l (ell), not digit 1. L for litre stays available on the whiteboard.';
 const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap';
 function button(text,id){const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=text;b.id=id;actions.append(b);return b}
 const save=button('Save example','letterTrainerSave');save.style.cssText='background:#2563eb;color:white;border-color:#1d4ed8;min-height:44px';
 const test=button('Test writing','letterTrainerTest'),clearButton=button('Clear pad','letterTrainerClear'),undo=button('Undo last save','letterTrainerUndo'),close=button('Done','letterTrainerClose');
 const note=document.createElement('p');note.style.cssText='font-size:12px;color:#526477;margin:12px 0 0';note.textContent='Examples stay in this browser and work with V2 Beautify. Settings → Export Learning JSON backs them up. The latest 18 character examples and 8 whole-letter examples per letter are kept; identical examples add little. New handwriting can still need correction.';
 function draw(){ctx.clearRect(0,0,W,H);ctx.strokeStyle='#d5e2ec';ctx.lineWidth=1;ctx.setLineDash([7,7]);for(const y of [85,245]){ctx.beginPath();ctx.moveTo(20,y);ctx.lineTo(W-20,y);ctx.stroke()}ctx.setLineDash([]);ctx.strokeStyle='#17324d';ctx.lineCap='round';ctx.lineJoin='round';
  for(const s of ink){ctx.lineWidth=s.size;ctx.beginPath();const a=s.points[0];if(s.points.length===1){ctx.arc(a.x*W,a.y*H,s.size/2,0,Math.PI*2);ctx.fillStyle='#17324d';ctx.fill()}else{ctx.moveTo(a.x*W,a.y*H);for(const p of s.points.slice(1))ctx.lineTo(p.x*W,p.y*H);ctx.stroke()}}
 }
 function update(){targetButtons.forEach((b,i)=>{const selected=LABELS[i]===label;b.setAttribute('aria-pressed',String(selected));b.classList.toggle('active',selected);b.disabled=busy});prompt.textContent='Write one lowercase '+(label==='l'?'l (ell)':label)+'.';
  pad.setAttribute('aria-label','Write lowercase '+label+' on the training pad');save.disabled=test.disabled=busy||!ink.length||active!==null;clearButton.disabled=busy||!ink.length;undo.disabled=busy||!history.length;
  const p=root.WhiteboardHandwritingLearning?.exportPack?.();counts.textContent=p?LABELS.map(c=>c+': '+p.characters.filter(s=>s.char===c).length+' character examples').join(' · '):'Local learning';
 }
 function clear(){ticket++;active=null;ink=[];draw();update()}
 function point(e){const r=pad.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))}}
 pad.addEventListener('pointerdown',e=>{if(busy||active!==null||e.button>0)return;e.preventDefault();ticket++;active=e.pointerId;ink.push({size:5,points:[point(e)]});pad.setPointerCapture(e.pointerId);draw();update()});
 pad.addEventListener('pointermove',e=>{if(e.pointerId!==active)return;e.preventDefault();const s=ink.at(-1);if(s.points.length<4000)s.points.push(point(e));draw()});
 const finish=e=>{if(e.pointerId!==active)return;active=null;try{pad.releasePointerCapture(e.pointerId)}catch{}update()};pad.addEventListener('pointerup',finish);pad.addEventListener('pointercancel',finish);
 clearButton.onclick=()=>{clear();status.textContent='Pad cleared. Saved examples are unchanged.'};
 save.onclick=()=>{try{const tx=teachExample(ink,W,H,label);if(!tx?.count){status.textContent='This example is already saved or contains too little ink. Try a different natural variation.';return}history.push(tx);if(history.length>30)history.shift();clear();status.textContent=tx.persistent?'Saved lowercase '+label+'. Write another variation, or use Test writing on fresh ink.':'Saved for this session only. Browser storage is unavailable.';update()}catch(e){status.textContent=e.message}};
 undo.onclick=()=>{root.WhiteboardHandwritingLearning.undo(history.pop());status.textContent='Last save undone. Earlier examples are retained.';update()};
 test.onclick=async()=>{const id=++ticket;busy=true;status.textContent='Reading this attempt without saving…';update();try{const r=await root.WhiteboardHandwritingMath.recognize(ink,W,H,{mode:'auto'});if(closed||id!==ticket)return;status.textContent=r.text===label?'Read as '+label+' — matches your selected letter. This test did not save an example.':'Read as '+(r.text||'(unreadable)')+'; you selected '+label+'. If you wrote '+label+', press Save example to teach this variation.'}catch(e){if(!closed)status.textContent=e.message||'Could not read this attempt.'}finally{if(!closed){busy=false;update()}}};
 function dismiss(){closed=true;ticket++;overlay.remove();document.removeEventListener('keydown',key,true);try{onClose?.()}catch{}previous?.focus?.()}
 const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dismiss()}else if(e.key==='Tab'){const list=[...panel.querySelectorAll('button:not(:disabled),canvas')],first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}};
 close.onclick=dismiss;document.addEventListener('keydown',key,true);panel.append(heading,guide,targets,prompt,pad,counts,status,actions,note);overlay.append(panel);document.body.append(overlay);draw();update();targetButtons[0].focus();
}
root.WhiteboardLetterTrainerV2={teachExample,open};
if(root.document?.getElementById){const fromHash=()=>{if(root.location?.hash==='#train-letters')open()};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fromHash);else fromHash();root.addEventListener?.('hashchange',fromHash);}
})(typeof window==='undefined'?globalThis:window);
