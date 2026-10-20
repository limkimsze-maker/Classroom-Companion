/* Explicit, local handwriting recognition. Original ink changes only on confirmation. */
(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const tools=document.querySelector('.tools'),board=document.getElementById('boardWrap');if(!tools||!board)return;
const clone=x=>JSON.parse(JSON.stringify(x)),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let activeReviewAbort=null;
const readerBuild='20261020-v2-glyph-consensus1';
function abortError(){return Object.assign(new Error('Reading cancelled'),{name:'AbortError'})}
function stopReaders(){window.WhiteboardCharacterReader?.cancel();window.WhiteboardMathReader?.cancel();window.WhiteboardInkOnOriginalDemo?.cancel?.()}
function boundedRead(task,signal,milliseconds){
 return new Promise((resolve,reject)=>{
  let finished=false,timer;
  const finish=(fn,value)=>{if(finished)return;finished=true;clearTimeout(timer);signal.removeEventListener('abort',aborted);fn(value)};
  const aborted=()=>finish(reject,abortError());
  if(signal.aborted){aborted();return}
  signal.addEventListener('abort',aborted,{once:true});
  timer=setTimeout(()=>finish(reject,Object.assign(new Error('Reading took too long. Your ink is safe. Type the reading or try again.'),{name:'TimeoutError'})),milliseconds);
  Promise.resolve().then(()=>{if(signal.aborted)throw abortError();return task()}).then(value=>finish(resolve,value),error=>finish(reject,error));
 });
}
const requiredReaders=[
 ['whiteboard-handwriting-digit-model-beta.js',()=>window.WhiteboardDigitModel],
 ['whiteboard-handwriting-character-models-beta.js',()=>window.WhiteboardCharacterModels],
 ['whiteboard-handwriting-character-inference-beta.js',()=>window.WhiteboardCharacterInference],
 ['whiteboard-handwriting-character-reader-beta.js',()=>window.WhiteboardCharacterReader],
 ['whiteboard-handwriting-learning-beta.js',()=>window.WhiteboardHandwritingLearning],
 ['vendor/handwriting/uji/reader-weights-beta.js',()=>window.WhiteboardUjiWeights],
 ['vendor/handwriting/uji/reader-beta.js',()=>window.WhiteboardUjiReader],
 ['whiteboard-primary-grammar-beta.js',()=>window.WhiteboardPrimaryMathGrammar],
 ['whiteboard-equal-sign-geometry-beta.js',()=>window.WhiteboardEqualSign],
 ['whiteboard-trained-9gq-equals-beta.js',()=>window.WhiteboardTrained9GQEquals],
 ['whiteboard-trained-j-beta.js',()=>window.WhiteboardTrainedJ],
 ['whiteboard-trained-remaining-beta.js',()=>window.WhiteboardTrainedRemaining],
 ['whiteboard-teacher-units-beta.js',()=>window.WhiteboardTeacherUnits],
 ['whiteboard-teacher-confusables-beta.js',()=>window.WhiteboardTeacherConfusables],
 ['whiteboard-unit-exponent-trained-beta.js',()=>window.WhiteboardUnitExponent],
 ['whiteboard-handwriting-context-model-beta.js',()=>window.WhiteboardHandwritingContextModel],
 ['whiteboard-handwriting-context-beta.js',()=>window.WhiteboardHandwritingContext],
 ['experimental/math-structure/reader-v2.js',()=>window.WhiteboardHandwritingMath?.recognize&&window.WhiteboardHandwritingMath.build===readerBuild]
];
async function ensureReader(signal){
 if(signal.aborted)throw abortError();
 if(requiredReaders.every(([,ready])=>ready()))return window.WhiteboardHandwritingMath;
  for(const [path,ready]of requiredReaders){
   if(signal.aborted)throw abortError();
   if(ready())continue;
   await new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=path+'?v='+readerBuild;script.async=false;
    let settled=false;
    const finish=(error)=>{if(settled)return;settled=true;clearTimeout(timer);signal.removeEventListener('abort',aborted);script.onload=null;script.onerror=null;if(error){script.remove();reject(error)}else resolve()};
    const aborted=()=>finish(abortError());
    const timer=setTimeout(()=>finish(new Error('A handwriting model took too long to load. Type the reading or try again.')),10000);
    script.onload=()=>finish(ready()?null:new Error('A handwriting model could not initialise. Type the reading or try again.'));
    script.onerror=()=>finish(new Error('A handwriting model could not load. Type the reading or try again.'));
    signal.addEventListener('abort',aborted,{once:true});
    document.head.appendChild(script);
   });
  }
  return window.WhiteboardHandwritingMath;
}

let selecting=false,area=null,selectionPointer=null,start=null,dialog=null,session=0,pendingLearning=null;
const history=[];
const style=document.createElement('style');style.textContent=`
#handwritingBeautifyBtn{white-space:nowrap}
.handwriting-chooser{position:absolute;inset:0;z-index:16000;pointer-events:none}
.handwriting-chooser p{position:absolute;top:10px;left:50%;transform:translateX(-50%);margin:0;max-width:calc(100% - 24px);padding:9px 12px;border-radius:10px;background:#17324d;color:white;font:700 13px Arial,sans-serif;text-align:center}
.handwriting-selection-box{position:absolute;border:2px dashed #0f766e;background:rgba(15,118,110,.08)}
#boardWrap.handwriting-selecting,#boardWrap.handwriting-selecting *{cursor:crosshair!important}
.handwriting-review-backdrop{position:fixed;inset:0;background:rgba(23,50,77,.22);z-index:20000;display:grid;place-items:center;padding:12px}
.handwriting-review{box-sizing:border-box;width:min(520px,100%);max-height:90vh;overflow:auto;background:white;border:1px solid #cfd9de;border-radius:16px;padding:18px;box-shadow:0 15px 45px rgba(23,50,77,.25);color:#17324d}
.handwriting-review h2{font:900 18px Arial,sans-serif;margin:0 0 8px}
.handwriting-review p{font:13px/1.5 Arial,sans-serif;margin:7px 0}
.handwriting-review label{display:block;font:700 13px Arial,sans-serif;margin-top:12px}
.handwriting-review input{box-sizing:border-box;width:100%;font-size:24px;font-weight:700;padding:9px;border:1px solid #9dd9d0;border-radius:9px;margin:6px 0}
.handwriting-review img{display:block;max-width:100%;height:110px;object-fit:contain;object-position:left center;background:#fafcfc;border-radius:8px}
.handwriting-review .handwriting-clean-preview{height:150px;background:white}
.handwriting-review .handwriting-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.handwriting-review .handwriting-actions .handwriting-apply{flex:1}
.handwriting-review .handwriting-appearance{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:7px 0}
.handwriting-review .handwriting-appearance label{margin:0}
.handwriting-review .handwriting-appearance select{font:13px Arial,sans-serif;max-width:150px;padding:5px 8px;border:1px solid #cfd9de;border-radius:7px;background:white;color:#17324d}
.handwriting-review [role=status]{min-height:20px;color:#667085}
.handwriting-review .handwriting-error{color:#b42318}
.handwriting-review .handwriting-feedback-controls{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin-top:8px}
.handwriting-review .handwriting-feedback-controls button{font:700 12px Arial,sans-serif}
.handwriting-review .handwriting-feedback-message{flex:1;min-width:160px;margin:0;font:12px/1.45 Arial,sans-serif;color:#475467}
.handwriting-review .handwriting-context{background:#f0f8f6;border:1px solid #c4e5de;border-radius:9px;padding:9px 11px;margin:8px 0}
.handwriting-review .handwriting-context p{margin:0 0 7px}
.handwriting-review .handwriting-context-options{display:flex;flex-wrap:wrap;gap:7px}
.handwriting-review .handwriting-context-options button{background:white;border:1px solid #9dc9c0;border-radius:7px;padding:7px 10px;font:700 15px Arial,sans-serif;color:#17324d;cursor:pointer}
.handwriting-review .handwriting-context-options button[aria-pressed=true]{background:#0f766e;color:white}
.handwriting-review [hidden]{display:none!important}
`;document.head.appendChild(style);
const btn=document.createElement('button');btn.id='handwritingBeautifyBtn';btn.type='button';btn.className='btn soft';btn.textContent='✨ Beautify';btn.title='Recognise handwritten numbers, learned letters and equations';tools.insertBefore(btn,document.getElementById('undoBtn'));
const eligible=s=>s&&!s.erase&&!s.locked&&!s.background&&!s.smartGenerated&&!s.shape&&Array.isArray(s.points)&&s.points.length&&s.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
function sayLocal(text){if(typeof say==='function')say(text)}
function groupBounds(group){const pts=group.flatMap(s=>s.points),xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys);return{x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y}}
function stop(e){e.preventDefault();e.stopImmediatePropagation()}
function endSelection(){const id=selectionPointer;selecting=false;selectionPointer=null;start=null;area?.remove();area=null;board.classList.remove('handwriting-selecting');btn.classList.remove('active');try{if(id!==null)canvas.releasePointerCapture(id)}catch{}}
function closeReview(){if(pendingLearning){try{window.WhiteboardHandwritingLearning?.undo(pendingLearning)}catch{}pendingLearning=null}session++;activeReviewAbort?.abort();activeReviewAbort=null;stopReaders();dialog?.remove();dialog=null}
function svgInk(group){
 const b=groupBounds(group),W=Math.max(10,b.w*cssW),H=Math.max(10,b.h*cssH),els=[];
 for(const s of group){const color=/^#[0-9a-f]{3,8}$/i.test(s.colour||'')?s.colour:'#17324d',points=s.points.map(p=>[(p.x-b.x)*cssW+10,(p.y-b.y)*cssH+10]);
  if(points.length===1)els.push(`<circle cx="${points[0][0]}" cy="${points[0][1]}" r="${(s.size||4)/2}" fill="${color}"/>`);
  else els.push(`<polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${s.size||4}" stroke-linecap="round" stroke-linejoin="round"/>`);
 }
 return'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W+20} ${H+20}">${els.join('')}</svg>`);
}
function availableUndo(){return history.length&&history[history.length-1].after===JSON.stringify(strokes)}
function undoBeautify(e){
 if(!availableUndo())return false;
 e?.preventDefault?.();e?.stopImmediatePropagation?.();const last=history.pop();strokes=clone(last.before);
 try{window.WhiteboardHandwritingLearning?.undo(last.learning)}catch{}
 window.WhiteboardMarqueeSelection?.clear();redraw();syncUi();sayLocal('Original handwriting restored');return true;
}
async function review(group){
 group=group.filter(s=>strokes.includes(s)&&eligible(s));if(!group.length){beginSelection();return}
 if(group.length>180||group.reduce((n,s)=>n+s.points.length,0)>16000){beginSelection();sayLocal('Select a shorter number or equation and try again.');return}
 endSelection();closeReview();const id=session,original=JSON.stringify(group);let recognition=null,readVersion=0,lastReading='',reading=true,testing=false,feedbackStamp=0;
 const backdrop=document.createElement('div');backdrop.className='handwriting-review-backdrop';dialog=backdrop;
 const panel=document.createElement('section');panel.className='handwriting-review';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','handwritingReviewTitle');
 const title=document.createElement('h2');title.id='handwritingReviewTitle';title.textContent='Check your handwriting';
 const help=document.createElement('p');help.textContent='Auto can offer word, letter-case, unit and superscript choices. Type a correction at any time to stop reading and update the preview. Learn & Test Again saves a provisional example on this browser and re-reads the same ink. Draw again to test new handwriting. Cancel discards provisional learning; Apply keeps it and Undo reverses it.';
 const ink=document.createElement('img');ink.src=svgInk(group);ink.alt='Your original selected handwriting';
 const label=document.createElement('label');label.htmlFor='handwritingReadText';label.textContent='Recognised text';
 const input=document.createElement('input');input.id='handwritingReadText';input.type='text';input.maxLength=600;input.autocomplete='off';input.setAttribute('aria-label','Check or correct recognised numbers, letters, units or mathematical notation');input.style.fontFamily=window.WhiteboardEquationFormatter?.font()||'Arial';
 const appearance=document.createElement('div');appearance.className='handwriting-appearance';
 const modeLabel=document.createElement('label');modeLabel.htmlFor='handwritingReadMode';modeLabel.textContent='Read';
 const modeSelect=document.createElement('select');modeSelect.id='handwritingReadMode';modeSelect.setAttribute('aria-label','Handwriting reading mode');
 for(const [value,text]of [['auto','Auto'],['math','Math formulas'],['lowercase','Letters a–z'],['uppercase','Letters A–Z'],['digits','Numbers']]){const option=document.createElement('option');option.value=value;option.textContent=text;modeSelect.appendChild(option)}modeSelect.value='auto';appearance.append(modeLabel,modeSelect);
 const colourLabel=document.createElement('label');colourLabel.htmlFor='handwritingColour';colourLabel.textContent='Colour';
 const colourSelect=document.createElement('select');colourSelect.id='handwritingColour';colourSelect.setAttribute('aria-label','Beautified writing colour');
 const palette=[['#17324d','Navy'],['#000000','Black'],['#2563eb','Blue'],['#dc2626','Red'],['#15803d','Green'],['#7c3aed','Purple']];
 const initialColour=(group.find(s=>/^#[0-9a-f]{6}$/i.test(s.colour||''))?.colour||'#17324d').toLowerCase();
 if(!palette.some(([hex])=>hex===initialColour))palette.push([initialColour,'Original ink']);
 for(const [hex,name]of palette){const option=document.createElement('option');option.value=hex;option.textContent=name;colourSelect.appendChild(option)}colourSelect.value=initialColour;appearance.append(colourLabel,colourSelect);
 const correctionLabel=document.createElement('label');correctionLabel.style.cssText='display:inline-flex;align-items:center;gap:6px;white-space:normal;font-size:12px';
 const correctionToggle=document.createElement('input');correctionToggle.type='checkbox';correctionToggle.checked=true;correctionToggle.id='handwritingCorrectArithmetic';
 correctionLabel.append(correctionToggle,document.createTextNode('Correct arithmetic answers'));appearance.appendChild(correctionLabel);
 const insert=document.createElement('select');insert.id='handwritingInsert';insert.setAttribute('aria-label','Insert a mathematical symbol, structure or measurement unit');
 for(const [value,text]of [['','Insert…'],['\\frac{1}{2}','Fraction ½'],['x^{2}','Power x²'],['\\sqrt{x}','Root √'],['\\int_{0}^{1} x\\,dx','Integral ∫'],['\\sum_{i=1}^{n} i','Sum ∑'],['\\alpha','Greek α'],['\\pi','Pi π'],['\\leq','Less or equal ≤'],['\\infty','Infinity ∞'],['\\begin{bmatrix}1&2\\\\3&4\\end{bmatrix}','Matrix'],['cm²','cm² · area'],['m²','m² · area'],['cm³','cm³ · volume'],['m³','m³ · volume'],['mm','mm · length'],['cm','cm · length'],['m','m · length'],['km','km · length'],['mg','mg · mass'],['g','g · mass'],['kg','kg · mass'],['mL','mL · capacity'],['L','L · capacity'],['s','s · time'],['min','min · time'],['h','h · time'],['°C','°C · temperature'],['m/s²','m/s² · acceleration'],['km/h','km/h · speed']]){const option=document.createElement('option');option.value=value;option.textContent=text;insert.appendChild(option)}appearance.appendChild(insert);
 function arithmeticResult(){return window.WhiteboardBetaArithmetic?.verify(input.value)}
 function displayReading(){const result=arithmeticResult();return correctionToggle.checked&&result?.supported&&!result.correct?result.corrected:input.value}
 function leadingEqualsFallback(value,b,colour){
  // Independent offline SVG fallback when both MathJax and the equation parser reject a leading '='.
  // Restricted arithmetic characters only; never inject arbitrary user text into SVG.
  const clean=String(value).trim().replace(/＝/g,'=');
  if(!/^=\s*\d+(?:\.\d+)?(?:\s*[+−\-×÷*/]\s*\d+(?:\.\d+)?)*$/.test(clean))return null;
  const ink=/^#[0-9a-f]{6}$/i.test(colour||'')?colour:'#17324d';
  const W=Math.max(8,b.w*Math.max(1,cssW)),H=Math.max(8,b.h*Math.max(1,cssH));
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><text x="1" y="'+(H*.76)+'" textLength="'+Math.max(4,W-2)+'" lengthAdjust="spacingAndGlyphs" fill="'+ink+'" font-family="Arial,sans-serif" font-size="'+Math.max(12,H*.72)+'" font-weight="600">'+clean+'</text></svg>';
  return{type:'image',src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),x:b.x,y:b.y,w:W/Math.max(1,cssW),h:H/Math.max(1,cssH),smartGenerated:true,smartType:'equation',smartId:'math-v2-'+Date.now().toString(36),smartOriginal:[],equationExpression:value,equationLatex:clean,equationLayout:'in-place-math',equationColour:ink};
 }
 function formatted(){
  const b=groupBounds(group),value=displayReading(),raw=String(input.value||'').trim(),math=window.WhiteboardMathRenderer,equation=window.WhiteboardEquationFormatter;
  const leading=/^\s*[=＝]\s*\d+(?:\.\d+)?(?:\s*[+−\-×÷*/]\s*\d+(?:\.\d+)?)*\s*$/;
  // Incomplete leading '=' equations are valid teacher notation, not complete answers.
  // Never let optional arithmetic correction block this notation.
  if(!correctionToggle.checked&&raw&&raw.length<=180){
   const direct=leadingEqualsFallback(raw,b,colourSelect.value);
   if(direct)return direct;
   const rendered=modeSelect.value==='math'&&!math?.unitText(raw)?math?.create(raw,b,colourSelect.value):equation?.createHandwriting(raw,b,colourSelect.value);
   if(rendered)return rendered;
   // Plain-text preview is allowed without arithmetic checking; escape SVG entities.
   const safe=raw.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
   const ink=/^#[0-9a-f]{6}$/i.test(colourSelect.value)?colourSelect.value:'#17324d';
   const W=Math.max(8,b.w*Math.max(1,cssW)),H=Math.max(8,b.h*Math.max(1,cssH));
   const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><text x="1" y="'+(H*.76)+'" textLength="'+Math.max(4,W-2)+'" lengthAdjust="spacingAndGlyphs" fill="'+ink+'" font-family="Arial,sans-serif" font-size="'+Math.max(12,H*.72)+'">'+safe+'</text></svg>';
   return{type:'image',src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),x:b.x,y:b.y,w:W/Math.max(1,cssW),h:H/Math.max(1,cssH),smartGenerated:true,smartType:'equation',smartId:'v2-direct-'+Date.now().toString(36),smartOriginal:[],equationExpression:raw,equationLayout:'in-place-math',equationColour:ink};
  }
  if(leading.test(raw))return leadingEqualsFallback(raw,b,colourSelect.value);
  if(leading.test(value))return leadingEqualsFallback(value,b,colourSelect.value);
  return modeSelect.value==='math'&&!math?.unitText(value)?math?.create(value,b,colourSelect.value):equation?.createHandwriting(value,b,colourSelect.value);
 }
 const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Reading handwriting on this device…';
 const contextArea=document.createElement('section');contextArea.className='handwriting-context';contextArea.id='handwritingContextChoices';contextArea.setAttribute('aria-label','Possible handwriting readings');contextArea.hidden=true;
 const preview=document.createElement('img');preview.className='handwriting-clean-preview';preview.alt='Beautified preview in the original writing area';preview.hidden=true;
 const actions=document.createElement('div');actions.className='handwriting-actions';
 const apply=document.createElement('button');apply.type='button';apply.className='btn soft handwriting-apply';apply.textContent='✓ Apply beautify';apply.disabled=true;
 const cancel=document.createElement('button');cancel.type='button';cancel.className='btn';cancel.textContent='Cancel';cancel.onclick=closeReview;
 const stopRead=document.createElement('button');stopRead.id='handwritingStopReadBtn';stopRead.type='button';stopRead.className='btn';stopRead.textContent='Stop reading';
 const retryRead=document.createElement('button');retryRead.id='handwritingRetryReadBtn';retryRead.type='button';retryRead.className='btn';retryRead.textContent='Read again';retryRead.hidden=true;
 const feedbackArea=document.createElement('div');feedbackArea.className='handwriting-feedback-controls';
 const test=document.createElement('button');test.type='button';test.className='btn';test.textContent='↻ Learn & Test Again';test.title='Save a confirmed correction locally, then read the SAME original strokes again';
 const feedback=document.createElement('p');feedback.className='handwriting-feedback-message';feedback.setAttribute('aria-live','polite');
 feedback.textContent='Correct the reading above, then test the same ink. Draw again afterward to test generalisation.';
 feedbackArea.append(test,feedback);
 function clearProvisional(){
  feedbackStamp++;
  if(pendingLearning){try{window.WhiteboardHandwritingLearning?.undo(pendingLearning)}catch{}pendingLearning=null}
  feedback.textContent='Edit the reading and test again; earlier provisional learning was discarded.';
 }
 function updatePreview(){
  const arithmetic=arithmeticResult();
  const obj=formatted();const canApply=!!obj&&!reading&&!testing;apply.disabled=!canApply;test.disabled=!canApply||!!pendingLearning;preview.hidden=!obj;if(obj)preview.src=obj.src;input.style.color=colourSelect.value;
  stopRead.hidden=!reading&&!testing;retryRead.disabled=reading||testing;
  status.classList.toggle('handwriting-error',!obj&&!!input.value);
  status.textContent=reading?'Reading handwriting on this device…':obj&&correctionToggle.checked&&arithmetic?.supported&&!arithmetic.correct?'Arithmetic correction in preview: '+arithmetic.original+' → '+arithmetic.corrected+'. Untick to keep the written answer.':obj?'Check the reading, then apply. Your handwriting stays until you confirm.':input.value?'Check the notation. Math accepts LaTeX, such as \\frac{1}{2}; units accept cm2 or cm².':'Enter or correct the reading to continue.';
 }
 function renderContext(result){
  contextArea.replaceChildren();contextArea.hidden=true;
  const choices=result?.context?.alternatives||[];
  if(choices.length<2)return;
  const message=document.createElement('p');message.textContent=result.context.kind==='words'?
   'Possible words — check the spelling and capital letters against your ink.':result.context.kind==='letter-case'?
   'Lowercase or uppercase? Choose the letter you intended.':result.context.kind==='glyphs'?
   'Possible characters — compare these choices with your handwriting.':'Possible readings — compare the unit or superscript with your ink.';
  const buttons=document.createElement('div');buttons.className='handwriting-context-options';
  for(const choice of choices){
   if(typeof choice.text!=='string'||choice.text.length>180)continue;
   const option=document.createElement('button');option.type='button';option.textContent=choice.text;
   option.setAttribute('aria-label','Use reading '+choice.text);option.setAttribute('aria-pressed',String(input.value===choice.text));
   option.onclick=()=>{
    if(reading||testing)return;
    clearProvisional();input.value=choice.text;
    recognition={...result,text:choice.text,tokens:choice.tokens||[],uncertain:[]};
    for(const button of buttons.children)button.setAttribute('aria-pressed',String(button===option));
    updatePreview();status.textContent='Reading selected. Check the preview, then apply.';
   };
   buttons.appendChild(option);
  }
  contextArea.append(message,buttons);contextArea.hidden=buttons.children.length<2;
 }
 function stopReading(message){
  if(!reading&&!testing)return;
  readVersion++;feedbackStamp++;activeReviewAbort?.abort();activeReviewAbort=null;stopReaders();
  reading=false;testing=false;retryRead.hidden=false;updatePreview();
  if(message)status.textContent='Reading stopped. Type the reading, apply your correction, or read again.';
 }
 stopRead.onclick=()=>stopReading(true);
 retryRead.onclick=()=>readSelection();
 input.addEventListener('input',()=>{stopReading(false);clearProvisional();contextArea.hidden=true;updatePreview()});input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!apply.disabled){e.preventDefault();apply.click()}});
 correctionToggle.addEventListener('change',updatePreview);
 colourSelect.addEventListener('change',updatePreview);
 insert.addEventListener('change',()=>{if(!insert.value)return;stopReading(false);clearProvisional();contextArea.hidden=true;const a=Number.isInteger(input.selectionStart)?input.selectionStart:input.value.length,z=Number.isInteger(input.selectionEnd)?input.selectionEnd:a;input.value=input.value.slice(0,a)+insert.value+input.value.slice(z);insert.value='';input.focus();updatePreview()});
 test.onclick=async()=>{
  if(reading||testing||pendingLearning||!formatted())return;
  const learner=window.WhiteboardHandwritingLearning,recogniser=window.WhiteboardHandwritingMath;
  if(!learner?.confirm||!recogniser?.recognize){feedback.textContent='Local learning is unavailable. Refresh Beta and try again.';return}
  const answer=input.value,mode=modeSelect.value,ticket=++feedbackStamp;
  let training=null;
  try{training=learner.confirm(recognition,answer,recogniser.rasterDigit,group,cssW,cssH,mode)}
  catch{feedback.textContent='Unable to save a learning example. You can still apply the correction.';return}
  if(!training?.count){feedback.textContent='No new example was saved. You can still apply the corrected text.';return}
  pendingLearning=training;testing=true;updatePreview();
  const controller=new AbortController();activeReviewAbort?.abort();activeReviewAbort=controller;
  feedback.textContent=training.persistent?'Example saved locally. Re-reading original strokes…':'Example saved for this session. Re-reading original strokes…';
  try{
   const again=await boundedRead(()=>recogniser.recognize(group,cssW,cssH,{mode,signal:controller.signal}),controller.signal,mode==='math'?180000:25000);
   if(session!==id||dialog!==backdrop||ticket!==feedbackStamp)return;
   if(again.text===answer){
    feedback.textContent=again.engine==='local-personal-ink'?
     'Same strokes now match your saved local example. Draw them again to test generalisation.':
     'Same strokes now read correctly. Draw them again to test generalisation.';
   }else feedback.textContent='Re-read result: '+again.text+'. Your correction is saved, but this recogniser still disagrees. Apply the correct preview or edit again.';
  }catch(error){
   if(activeReviewAbort===controller){controller.abort();stopReaders()}
   if(session===id&&dialog===backdrop&&ticket===feedbackStamp)
    feedback.textContent='Example saved, but the re-read could not finish. You may still Apply or Undo.';
  }finally{
   if(activeReviewAbort===controller)activeReviewAbort=null;
   if(session===id&&dialog===backdrop&&ticket===feedbackStamp){testing=false;updatePreview()}
  }
 };
 apply.onclick=()=>{
  if(reading||testing)return;
  const obj=formatted();if(!obj){updatePreview();return}
  if(!group.every(s=>strokes.includes(s))||JSON.stringify(group)!==original){status.textContent='This handwriting changed. Cancel and select it again.';apply.disabled=true;return}
  const before=clone(strokes),first=Math.min(...group.map(s=>strokes.indexOf(s))),set=new Set(group);
  obj.smartOriginal=clone(group);obj.handwritingBeautified=true;
  // Committing the preview transfers provisional learning to Undo history.
  let learning=pendingLearning;pendingLearning=null;
  strokes=strokes.filter(s=>!set.has(s));strokes.splice(first,0,obj);window.WhiteboardMarqueeSelection?.clear();tool='pen';closeReview();redraw();
  if(!learning)try{learning=window.WhiteboardHandwritingLearning?.confirm(recognition,input.value,window.WhiteboardHandwritingMath.rasterDigit,group,cssW,cssH,modeSelect.value)}catch{}
  history.push({before,after:JSON.stringify(strokes),learning});if(history.length>30)history.shift();syncUi();
  // Use the existing Pen button handler too, so selection state and toolbar UI reset.
  document.getElementById('penBtn')?.click();
  sayLocal(learning?.count?(learning.persistent?'Handwriting beautified · Examples saved on this browser':'Handwriting beautified · Examples learned for this session'):'Handwriting beautified · Undo restores the original writing');
 };
 actions.append(apply,stopRead,retryRead,cancel);const exportInk=document.createElement('button');
 exportInk.type='button';exportInk.textContent='Export selected pen strokes (JSON)';
 exportInk.style.cssText='margin-top:8px;font-size:13px;max-width:100%;white-space:normal';
 exportInk.title='Downloads only this selected handwriting and its local recognition feedback. No upload or network request.';
 exportInk.onclick=()=>{
  // Export selected strokes only; never export the whiteboard's documents.
  const payload={schema:'classroom-equals-diagnostic-v1',mode:modeSelect.value,
   recognised:recognition?.text||'',corrected:input.value,
   recognitionEngine:recognition?.engine||null,readerBuild:window.WhiteboardHandwritingMath?.build||null,
   contextReview:recognition?.context?{originalText:recognition.context.originalText,applied:recognition.context.applied,alternatives:recognition.context.alternatives.map(c=>c.text)}:null,
   selection:{width:cssW,height:cssH},
   strokes:group.map(s=>({size:Number(s.size)||4,points:s.points.map(p=>({x:p.x,y:p.y}))}))};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='equals-handwriting-strokes.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 panel.append(title,help,ink,label,input,appearance,status,contextArea,preview,feedbackArea,actions);panel.appendChild(exportInk);backdrop.appendChild(panel);document.body.appendChild(backdrop);cancel.focus();
 window.MathJax?.startup?.promise?.then(()=>{if(session===id&&dialog===backdrop)updatePreview()}).catch(()=>{});
 async function readSelection(){
 activeReviewAbort?.abort();
 const controller=new AbortController();activeReviewAbort=controller;
 const version=++readVersion,startText=input.value,replaceReading=!startText||startText===lastReading,mode=modeSelect.value;
 recognition=null;contextArea.hidden=true;reading=true;testing=false;retryRead.hidden=true;updatePreview();status.classList.remove('handwriting-error');status.textContent='Reading handwriting on this device…';
 try{
  const result=await boundedRead(async()=>{
   await new Promise(resolve=>setTimeout(resolve,0));
   await ensureReader(controller.signal);
   if(mode==='math')await window.MathJax?.startup?.promise;
   if(controller.signal.aborted)throw abortError();
   return window.WhiteboardHandwritingMath.recognize(group,cssW,cssH,{mode,signal:controller.signal,onProgress:(done,total)=>{if(session===id&&version===readVersion&&input.value===startText)status.textContent=mode==='math'?'Reading mathematical notation on this device…':`Reading characters ${done} of ${total}…`}});
  },controller.signal,mode==='math'?180000:25000);
  if(session!==id||dialog!==backdrop||version!==readVersion)return;recognition=result;reading=false;
  // Do not overwrite a correction entered while recognition was running.
  if(replaceReading&&input.value===startText)input.value=result.text;lastReading=result.text;updatePreview();if(input.value===result.text)renderContext(result);if(document.activeElement===cancel)input.focus();
  if(result.engine==='local-litre-unit')status.textContent=result.text==='l'?'Litre symbol recognised as l. Check before applying.':'Millilitre unit recognised as ml. Check before applying.';
  if(result.engine==='local-primary-measurement')status.textContent='Number + measurement unit recognised using P1–P6 unit context. Check before applying.';
  if(result.engine==='local-general-primary-grammar')status.textContent='Pretrained digit + letter models recognised a primary measurement. Check before applying.';
  if(result.engine==='local-primary-digit-sequence')status.textContent='Number recognised using primary mathematics context. Check before applying.';
  if(result.engine==='local-primary-arithmetic-grammar')status.textContent='Arithmetic expression recognised using digit and operator context. Check before applying.';
  if(result.engine==='local-stacked-fraction'&&!result.uncertain.length)status.textContent='Stacked fraction detected. Check both digits before applying; confirmed examples are remembered locally.';
   if(result.uncertain.length)status.textContent=result.engine==='local-stacked-fraction'?'Stacked fraction detected. Correct any wrong digit before applying; this device can remember the correction.':result.format==='latex'?'Check symbols, fraction bars, powers and limits before applying.':'Some characters were uncertain. Check and correct the reading before applying.';
  if(/^\d+(?:\.\d+)?\s+(?:mm|cm|km|m)[²³]$/.test(result.text||''))status.textContent='Reader '+(window.WhiteboardHandwritingMath?.build||'unknown')+' · '+(result.engine||'unknown')+' · exponent '+result.text.slice(-1)+' (diagnostic)';
 }catch(error){
  if(session!==id||dialog!==backdrop||version!==readVersion)return;
  controller.abort();stopReaders();reading=false;retryRead.hidden=false;updatePreview();
  status.textContent=error.name==='AbortError'?'Reading stopped. Type the reading or read again.':error.message||'Could not read this writing. You can type the correct reading.';
  status.classList.add('handwriting-error');if(document.activeElement===cancel)input.focus();
 }finally{if(activeReviewAbort===controller)activeReviewAbort=null}
 }
 modeSelect.addEventListener('change',()=>{stopReading(false);clearProvisional();return readSelection()});
 return readSelection();
}
function beginSelection(){
 closeReview();endSelection();window.WhiteboardMarqueeSelection?.clear();tool='select';syncUi();selecting=true;btn.classList.add('active');board.classList.add('handwriting-selecting');
 area=document.createElement('div');area.className='handwriting-chooser';const help=document.createElement('p');help.textContent='Drag a box around the handwriting to beautify · Esc to cancel';area.appendChild(help);board.appendChild(area);
}
btn.onclick=()=>{if(selecting){endSelection();return}const group=(window.WhiteboardMarqueeSelection?.get()||[]).filter(eligible);return group.length?review(group):beginSelection()};
function point(e){const r=canvas.getBoundingClientRect();return{x:clamp((e.clientX-r.left)/Math.max(1,r.width),0,1),y:clamp((e.clientY-r.top)/Math.max(1,r.height),0,1)}}
function paintSelection(e){const p=point(e),r=canvas.getBoundingClientRect(),b=board.getBoundingClientRect(),box=area.querySelector('.handwriting-selection-box');if(box)Object.assign(box.style,{left:(r.left-b.left+Math.min(p.x,start.x)*r.width)+'px',top:(r.top-b.top+Math.min(p.y,start.y)*r.height)+'px',width:(Math.abs(p.x-start.x)*r.width)+'px',height:(Math.abs(p.y-start.y)*r.height)+'px'})}
window.addEventListener('pointerdown',e=>{
 if(!selecting||e.target!==canvas||e.button!==0)return;stop(e);if(selectionPointer!==null)return;
 selectionPointer=e.pointerId;start=point(e);const box=document.createElement('div');box.className='handwriting-selection-box';area.appendChild(box);paintSelection(e);try{canvas.setPointerCapture(e.pointerId)}catch{}
},{capture:true,passive:false});
window.addEventListener('pointermove',e=>{if(!selecting||selectionPointer!==e.pointerId)return;stop(e);if(e.pointerType!=='touch'&&typeof e.buttons==='number'&&(e.buttons&1)===0){endSelection();return}paintSelection(e)},{capture:true,passive:false});
window.addEventListener('pointerup',e=>{
 if(!selecting||selectionPointer!==e.pointerId)return;stop(e);const p=point(e),r={x:Math.min(start.x,p.x),y:Math.min(start.y,p.y),w:Math.abs(start.x-p.x),h:Math.abs(start.y-p.y)};
 const group=strokes.filter(s=>{if(!eligible(s))return false;const b=groupBounds([s]);return b.x<=r.x+r.w&&b.x+b.w>=r.x&&b.y<=r.y+r.h&&b.y+b.h>=r.y});
 endSelection();try{canvas.releasePointerCapture(e.pointerId)}catch{}if(group.length)review(group);else sayLocal('No handwritten numbers found. Tap Beautify and select your writing.');
},{capture:true,passive:false});
window.addEventListener('pointercancel',e=>{if(selecting&&selectionPointer===e.pointerId){stop(e);endSelection()}},true);
window.addEventListener('lostpointercapture',e=>{if(selecting&&selectionPointer===e.pointerId)endSelection()},true);
window.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&(selecting||dialog)){stop(e);endSelection();closeReview();return}
 if(dialog&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&/INPUT|TEXTAREA/.test(document.activeElement?.tagName||'')){e.stopImmediatePropagation();return}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!/INPUT|TEXTAREA/.test(document.activeElement?.tagName||''))undoBeautify(e);
},true);
window.addEventListener('blur',()=>{if(selecting)endSelection()});
document.getElementById('undoBtn')?.addEventListener('click',undoBeautify,true);
const oldSync=syncUi;syncUi=function(){const result=oldSync.apply(this,arguments);if(availableUndo())document.getElementById('undoBtn').disabled=false;return result};
})();
