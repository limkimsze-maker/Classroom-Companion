/* Explicit offline learning export/import; no automatic sharing. */
(function(){
'use strict';
const learner=window.WhiteboardHandwritingLearning,tools=document.querySelector('.tools');if(!learner?.exportPack||!tools)return;
const button=document.createElement('button');button.type='button';button.className='btn';button.id='handwritingLearningBtn';button.textContent='Learning';button.title='Export or import saved handwriting examples';tools.appendChild(button);button.hidden=true;button.setAttribute('aria-hidden','true');
button.onclick=()=>{
 const backdrop=document.createElement('div');backdrop.className='handwriting-review-backdrop';
 const panel=document.createElement('section');panel.className='handwriting-review';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','learningTitle');
 const heading=document.createElement('h2');heading.id='learningTitle';heading.textContent='Saved handwriting learning';
 const description=document.createElement('p');description.textContent='Corrections stay in this browser. Export a backup or share examples with another teacher. Import adds examples without replacing your existing corrections. A shared website update requires separate checking and publishing.';
 const guide=document.createElement('section');guide.setAttribute('aria-label','How to improve recognition');
 const guideTitle=document.createElement('h3');guideTitle.textContent='Help it learn your handwriting';guideTitle.style.cssText='font:700 14px Arial,sans-serif;margin:14px 0 7px';
 const tips=document.createElement('ol');tips.style.cssText='padding-left:21px;margin:0;font:13px/1.5 Arial,sans-serif';
 for(const text of [
  'Label accurately: correct Recognised text to exactly what you wrote before saving. Avoid guessing or giving the same shape conflicting labels. Correct labels matter more than quantity.',
  'Teach a sign: use Auto for =, +, −, × or ÷. If it is still misread inside an equation, select only that sign’s strokes and enter the correct symbol.',
  'Keep useful examples: correct wrong readings, press Learn, then Apply. Add a few natural variations in slant, size or spacing. Repeating identical strokes adds little. Cancel discards uncommitted learning; Undo can reverse the saved learning associated with an applied correction.',
  'Check fresh handwriting: write a different equation before training it. Test Again reuses the same ink, so its success alone does not prove new handwriting will be recognised. Improvement varies with how closely the new writing matches your examples.'
 ]){const item=document.createElement('li');item.textContent=text;item.style.marginBottom='8px';tips.appendChild(item)}
 guide.append(guideTitle,tips);
 const counts=document.createElement('p');counts.id='handwritingLearningCounts';
 const refresh=()=>{const p=learner.exportPack(),count=(n,label)=>n+' '+label+(n===1?'':'s');counts.textContent=count(p.symbols.length,'symbol example')+' · '+count(p.characters.length,'character example')+' · '+count(p.selections.length,'whole selection')};refresh();
 const status=document.createElement('p');status.id='handwritingLearningStatus';status.setAttribute('role','status');
 const actions=document.createElement('div');actions.className='handwriting-actions';
 const download=document.createElement('button');download.type='button';download.className='btn soft';download.textContent='Export learning';download.id='handwritingExportLearning';
 download.onclick=()=>{
  const pack=learner.exportPack(),count=pack.symbols.length+pack.characters.length+pack.selections.length;
  if(!count){status.textContent='No saved learning yet. Correct handwriting, then Apply to keep the example.';return}
  const blob=new Blob([JSON.stringify(pack,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='classroom-handwriting-learning.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Learning exported. The file includes your corrected readings and symbol examples; choose who you share it with.';
 };
 const upload=document.createElement('button');upload.type='button';upload.className='btn';upload.textContent='Import learning';upload.id='handwritingImportLearning';
 const file=document.createElement('input');file.type='file';file.accept='.json,application/json';file.id='handwritingLearningFile';file.hidden=true;upload.onclick=()=>file.click();
 file.onchange=async()=>{
  const chosen=file.files?.[0];if(!chosen)return;upload.disabled=true;
  try{if(chosen.size>2000000)throw Error('Learning file is too large.');const result=learner.importPack(await chosen.text());refresh();status.textContent=result.added+' examples imported; '+result.skipped+' duplicates, conflicts or examples over the storage limit skipped. Existing local corrections take precedence.'}
  catch(error){status.textContent=error.message||'Could not import this learning file.'}
  finally{upload.disabled=false;file.value=''}
 };
 const close=document.createElement('button');close.type='button';close.className='btn';close.textContent='Close';
 const dismiss=()=>{backdrop.remove();document.removeEventListener('keydown',key,true);button.focus()};
 const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dismiss()}if(e.key==='Tab'){const list=[download,upload,close],at=list.indexOf(document.activeElement);if(e.shiftKey&&at<=0){e.preventDefault();close.focus()}else if(!e.shiftKey&&at===2){e.preventDefault();download.focus()}}};close.onclick=dismiss;document.addEventListener('keydown',key,true);
 actions.append(download,upload,close);panel.append(heading,description,guide,counts,status,actions,file);backdrop.appendChild(panel);document.body.appendChild(backdrop);heading.tabIndex=-1;heading.focus();
};
})();
