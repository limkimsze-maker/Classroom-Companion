
(function(){
'use strict';
const button=document.getElementById('mainSettingsBtn');
if(!button)return;
button.addEventListener('click',()=>{
 const previous=document.getElementById('mainSettingsDialog');if(previous){previous.querySelector('[data-settings-close]')?.click();return}
 const overlay=document.createElement('div');overlay.id='mainSettingsDialog';overlay.style.cssText='position:fixed;inset:0;background:rgba(10,25,40,.58);z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:12px;pointer-events:auto';
 const panel=document.createElement('section');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Handwriting settings and guide');panel.style.cssText='background:#fff;border-radius:16px;padding:18px;max-width:680px;width:100%;max-height:90vh;overflow:auto;box-shadow:0 20px 60px #142a3d55;color:#17324d;font:14px/1.5 Arial,sans-serif;pointer-events:auto';
 const header=document.createElement('div');header.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:12px';const h=document.createElement('h2');h.textContent='⚙ Settings · Handwriting learning';h.style.margin='0';const close=document.createElement('button');close.type='button';close.className='btn';close.textContent='Close';close.dataset.settingsClose='1';close.style.cssText='position:relative;z-index:1;pointer-events:auto;cursor:pointer';header.append(h,close);
 const intro=document.createElement('p');intro.textContent='Your corrections are saved in this browser, not uploaded to GitHub or a server. Import merges examples; it does not replace your existing learning or retrain the underlying model.';
 const title=document.createElement('h3');title.textContent='How it works';title.style.marginBottom='5px';const ol=document.createElement('ol');ol.style.paddingLeft='22px';
 for(const t of ['Write a mathematical expression with Pen, then select Beautify.','Review the recognised expression. If it is correct, press Apply: this beautifies without training.','If recognition is wrong, correct the label to exactly what you wrote, press Learn to save the labelled strokes locally, then Apply.','Try natural variations of symbols and equations. More accurate, diverse labels can improve matching, but do not guarantee recognition of every new example.','Export learning to download a JSON backup of accumulated examples. Import learning merges a backup into this browser, skips duplicate features, respects storage limits and keeps existing local examples when duplicates occur.','Learning is specific to this browser/device. Export before clearing site data or switching devices. No automatic sharing takes place.']){const li=document.createElement('li');li.textContent=t;li.style.marginBottom='7px';ol.append(li)}
 const counts=document.createElement('p');const learner=window.WhiteboardHandwritingLearning;const pack=learner?.exportPack?.();counts.textContent=pack?'Saved here: '+pack.symbols.length+' symbol, '+pack.characters.length+' character, '+pack.selections.length+' whole-selection examples.':'Learning module not available. Try refreshing the page.';
 const actions=document.createElement('div');actions.style.cssText='display:flex;flex-wrap:wrap;gap:8px';const exp=document.createElement('button');exp.className='btn soft';exp.textContent='Export Learning JSON';const imp=document.createElement('button');imp.className='btn';imp.textContent='Import Learning JSON';const file=document.createElement('input');file.type='file';file.accept='.json,application/json';file.hidden=true;const status=document.createElement('p');status.setAttribute('role','status');const refresh=()=>{const p=learner.exportPack();counts.textContent='Saved here: '+p.symbols.length+' symbol, '+p.characters.length+' character, '+p.selections.length+' whole-selection examples.'};
 exp.onclick=()=>{if(!learner?.exportPack){status.textContent='Learning module unavailable.';return}const p=learner.exportPack();const count=p.symbols.length+p.characters.length+p.selections.length;if(!count){status.textContent='No saved examples to export yet.';return}const blob=new Blob([JSON.stringify(p,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='classroom-handwriting-learning.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Learning backup exported.'};
 imp.onclick=()=>file.click();file.onchange=async()=>{const chosen=file.files?.[0];if(!chosen)return;imp.disabled=true;try{if(chosen.size>2000000)throw Error('Learning file is too large.');if(!learner?.importPack)throw Error('Learning import unavailable.');const result=learner.importPack(await chosen.text());refresh();status.textContent=result.added+' imported; '+result.skipped+' skipped (duplicates or storage limits). Existing examples preserved.'}catch(e){status.textContent=e.message||'Import failed.'}finally{imp.disabled=false;file.value=''}};
 const diagnostics=document.createElement('p');diagnostics.textContent='Note: Export Selected Pen Strokes (inside Beautify → Settings) is for debugging a single handwriting selection, not backing up learning.';
 actions.append(exp,imp);
 panel.append(header,intro,title,ol,counts,actions,status,diagnostics,file);
 overlay.append(panel);document.body.append(overlay);
 let dismissed=false;
 const dismiss=e=>{
  if(dismissed)return;
  if(e){e.preventDefault?.();e.stopPropagation?.();e.stopImmediatePropagation?.()}
  dismissed=true;
  document.removeEventListener('keydown',onKey,true);
  overlay.remove();
  button.focus();
 };
 const onKey=e=>{if(e.key==='Escape')dismiss(e)};
 // Pointer events are handled directly because other whiteboard modules may
 // intercept ordinary click events while a document or bar model is active.
 const onClosePointer=e=>{if(e.button!==undefined&&e.button!==0)return;dismiss(e)};
 close.addEventListener('pointerdown',onClosePointer,true);
 close.addEventListener('click',dismiss,true); // keyboard activation fallback
 overlay.addEventListener('pointerdown',e=>{if(e.target===overlay)onClosePointer(e)},true);
 overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss(e)},true);
 document.addEventListener('keydown',onKey,true);
 close.focus();
});
})();
