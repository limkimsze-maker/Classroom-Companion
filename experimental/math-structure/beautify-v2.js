/* Explicit, local handwriting recognition. Original ink changes only on confirmation. */
(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function')return;
const tools=document.querySelector('.tools'),board=document.getElementById('boardWrap');if(!tools||!board)return;
const clone=x=>JSON.parse(JSON.stringify(x)),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let activeReviewAbort=null;
const readerBuild='20261021-v2-symbol-learning1';
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
 ['experimental/math-structure/symbol-learning-v2.js',()=>window.WhiteboardHandwritingLearning?.symbolLearningVersion===1],
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
 ['experimental/math-structure/reader-v2.js',()=>typeof window.WhiteboardHandwritingMath?.recognize==='function' && window.WhiteboardHandwritingMath.build===readerBuild]
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
.handwriting-review .handwriting-actions>button{order:2}\n.handwriting-review .handwriting-actions .handwriting-apply{order:0;flex:1 1 100%}\n.handwriting-review .handwriting-actions .handwriting-learn{order:1;flex:1 1 100%;width:100%;background:#2563eb;border-color:#1d4ed8;color:#fff;white-space:normal;text-align:center;min-height:44px}\n.handwriting-review .handwriting-actions .handwriting-learn:disabled{background:#2563eb;color:#fff;opacity:.5}\n.handwriting-review .handwriting-actions #handwritingStopReadBtn{order:2}
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
const btn=document.createElement('button');btn.id='handwritingBeautifyBtn';btn.type='button';btn.className='btn soft';btn.textContent='✨ Beautify';btn.title='Recognise handwritten numbers, learned letters and equations';tools.insertBefore(btn,document.getElementById('undoBtn'));const help=document.createElement('button');help.id='handwritingHowToUseBtn';help.type='button';help.className='btn';help.textContent='? How to Use';tools.insertBefore(help,btn.nextSibling);help.onclick=()=>{const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;background:#0009;z-index:1200;display:grid;place-items:center;padding:16px';const panel=document.createElement('section');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Beautify help');panel.style.cssText='background:white;color:#17324d;border-radius:16px;padding:20px;max-width:540px;width:100%;max-height:85vh;overflow:auto';const h=document.createElement('h2');h.textContent='Beautify · How to Use';const ol=document.createElement('ol');['Write with Pen, select Beautify and box the handwriting.','Correct wrong digits, signs, units or superscripts in the recognised reading.','If recognition is correct, press Apply to beautify without training.','If recognition is wrong, correct it and press Learn to save the example locally. Then press Apply to beautify.','Use the Learning controls to export/import JSON for backup or sharing. No automatic upload occurs.'].forEach(t=>{const li=document.createElement('li');li.textContent=t;li.style.marginBottom='9px';ol.appendChild(li)});const p=document.createElement('p');p.textContent='Correct just the mistaken part of an equation. The original selected strokes and corrected expression form the confirmed example.';const close=document.createElement('button');close.type='button';close.className='btn soft';close.textContent='Close';const dismiss=()=>overlay.remove();close.onclick=dismiss;overlay.onclick=e=>{if(e.target===overlay)dismiss()};panel.append(h,ol,p,close);overlay.appendChild(panel);document.body.appendChild(overlay);close.focus()};
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
 const help=document.createElement('p');help.textContent='Check that Recognised text matches your handwriting. If it is correct, press Apply. If it is wrong, correct it and press the blue Learn button, then Apply. Accurate labels and a few natural variations help the local recogniser. Cancel discards a correction learned in this review; Undo after Apply reverses it. Use Settings for the guide and learning backups.';
 const ink=document.createElement('img');ink.src=svgInk(group);ink.alt='Your original selected handwriting';
 const label=document.createElement('label');label.htmlFor='handwritingReadText';label.textContent='Recognised text';
 const input=document.createElement('input');input.id='handwritingReadText';input.type='text';input.maxLength=600;input.autocomplete='off';input.setAttribute('aria-label','Check or correct recognised numbers, letters, units or mathematical notation');input.style.fontFamily=window.WhiteboardEquationFormatter?.font()||'Arial';
 const appearance=document.createElement('div');appearance.className='handwriting-appearance';
 const modeLabel=document.createElement('label');modeLabel.htmlFor='handwritingReadMode';modeLabel.textContent='Read';
 const modeSelect=document.createElement('select');modeSelect.id='handwritingReadMode';modeSelect.setAttribute('aria-label','Handwriting reading mode');
 for(const [value,text]of [['auto','Auto'],['math','Math formulas'],['lowercase','Letters a–z'],['uppercase','Letters A–Z'],['digits','Numbers']]){const option=document.createElement('option');option.value=value;option.textContent=text;modeSelect.appendChild(option)}modeSelect.value='auto';appearance.append(modeLabel,modeSelect);
 const colourLabel=document.createElement('label');colourLabel.htmlFor='handwritingColour';colourLabel.textContent='Colour';
 const colourSelect=document.createElement('select');colourSelect.id='handwritingColour';colourSelect.setAttribute('aria-label','Beautified writing colour');
 const palette=[['#1d4ed8','Royal blue'],['#17324d','Navy'],['#000000','Black'],['#2563eb','Blue'],['#dc2626','Red'],['#15803d','Green'],['#7c3aed','Purple']];
 const initialColour='#1d4ed8';
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
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><text x="1" y="'+(H*.76)+'" textLength="'+Math.max(4,W-2)+'" lengthAdjust="spacingAndGlyphs" fill="'+ink+'" font-family="Trebuchet MS,Arial,sans-serif" font-size="'+Math.max(12,H*.72)+'" font-weight="700">'+clean+'</text></svg>';
  return{type:'image',src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),x:b.x,y:b.y,w:W/Math.max(1,cssW),h:H/Math.max(1,cssH),smartGenerated:true,smartType:'equation',smartId:'math-v2-'+Date.now().toString(36),smartOriginal:[],equationExpression:value,equationLatex:clean,equationLayout:'in-place-math',equationColour:ink};
 }
 function fixedArithmeticObject(value,original,colour){
  const expression=String(value||'').trim().replace(/＝/g,'=').replace(/\*/g,'×');
  if(!expression||!/^[\d\s.=+−\-×÷]+$/.test(expression)||!/\d/.test(expression))return null;
  const boardW=Math.max(1,cssW),boardH=Math.max(1,cssH);
  const fontFamily=window.WhiteboardEquationFormatter?.font?.()||"'Trebuchet MS',Arial,sans-serif";
  // Fixed visible glyph height across separate beautification operations.
  const glyphHeight=64,fontSize=76;
  let naturalWidth=Math.max(1,expression.length*fontSize*.62);
  if(typeof ctx!=='undefined'&&typeof ctx.measureText==='function'){
   ctx.save();
   try{ctx.font='700 '+fontSize+'px '+fontFamily;naturalWidth=Math.ceil(ctx.measureText(expression).width)+4}
   finally{ctx.restore()}
  }
  const width=naturalWidth+8,height=fontSize+10;
  const x=Math.max(0,Math.min(boardW-width,original.x*boardW));
  const baseline=Math.max(height-8,Math.min(boardH-8,(original.y+original.h)*boardH));
  const y=Math.max(0,baseline-(height-8));
  const ink=/^#[0-9a-f]{6}$/i.test(colour||'')?colour:'#17324d';
  const safe=expression.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'"><text x="4" y="'+(height-8)+'" fill="'+ink+'" font-family="'+fontFamily.replace(/"/g,'&quot;')+'" font-size="'+fontSize+'" font-weight="700">'+safe+'</text></svg>';
  return{type:'image',src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),x:x/boardW,y:y/boardH,w:width/boardW,h:height/boardH,smartGenerated:true,smartType:'equation',smartId:'v2-fixed-font-'+Date.now().toString(36),smartOriginal:[],equationExpression:expression,equationLayout:'in-place-math',equationColour:ink};
 }
 function formatted(){
  const original=groupBounds(group),value=displayReading(),raw=String(input.value||'').trim(),math=window.WhiteboardMathRenderer,equation=window.WhiteboardEquationFormatter;
  // Normalise simple inline arithmetic to one classroom-sized glyph height.
  // Scale uniformly (never stretch individual glyphs) and retain the ink baseline.
  // Fractions, roots, units and multi-line layouts retain their specialised sizing.
  const fixed=fixedArithmeticObject(value,original,colourSelect.value);
  if(fixed)return fixed;
  const simple=/^[\s\d.=＝+−\-×÷*/()]+$/;
  const isSimple=simple.test(raw)&&/\d/.test(raw)&&!/[\/()]/.test(raw);
  let b=original;
  if(isSimple&&original.h>0&&original.w>0){
   const boardH=Math.max(1,cssH),boardW=Math.max(1,cssW);
   // Font height must be independent of the selected handwriting bounds.
   // The old 1.8x cap left short handwriting permanently smaller.
   const targetPx=Math.min(70,boardH*.12);
   const display=String(value||raw).trim();
   const family=equation?.font?.()||'Arial,sans-serif';
   let widthPx=Math.max(1,display.length*targetPx*.72);
   if(typeof ctx!=='undefined'&&typeof ctx.measureText==='function'){
    ctx.save();
    try{
     ctx.font='700 100px '+family;
     const m=ctx.measureText(display);
     const glyphH=Math.max(1,(m.actualBoundingBoxAscent||78)+(m.actualBoundingBoxDescent||8));
     widthPx=Math.max(1,m.width)*targetPx/glyphH;
    }finally{ctx.restore()}
   }
   const left=original.x*boardW,baseline=(original.y+original.h)*boardH;
   const maxWidth=Math.max(1,boardW-left-8);
   // Keep a single scale factor for height and width near the right edge.
   const fit=Math.min(1,maxWidth/widthPx);
   const h=targetPx*fit,w=widthPx*fit;
   b={x:original.x,y:Math.max(0,Math.min(1-h/boardH,(baseline-h)/boardH)),w:w/boardW,h:h/boardH};
  }
  // All simple arithmetic uses the existing Equation tool's classroom font,
  // regardless of Auto / Math formulas / arithmetic-correction settings.
  // MathJax remains available for advanced notation and structured layouts.
  const plain=String(value||'').trim();
  if(isSimple&&simple.test(plain)&&equation?.createHandwriting){
   const uniform=equation.createHandwriting(plain,b,colourSelect.value);
   if(uniform)return uniform;
  }
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
   const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><text x="1" y="'+(H*.76)+'" textLength="'+Math.max(4,W-2)+'" lengthAdjust="spacingAndGlyphs" fill="'+ink+'" font-family="Trebuchet MS,Arial,sans-serif" font-size="'+Math.max(12,H*.72)+'">'+safe+'</text></svg>';
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
 const apply=document.createElement('button');apply.type='button';apply.className='btn soft handwriting-apply';apply.textContent='✓ Apply';apply.disabled=true;const learn=document.createElement('button');learn.type='button';learn.className='btn handwriting-learn';learn.textContent='Learn: If wrong, correct and press here.';learn.title='Save a corrected recognition example locally';learn.disabled=true;
 const cancel=document.createElement('button');cancel.type='button';cancel.className='btn';cancel.textContent='Cancel';cancel.onclick=closeReview;
 const stopRead=document.createElement('button');stopRead.id='handwritingStopReadBtn';stopRead.type='button';stopRead.className='btn';stopRead.textContent='Stop reading';
 const retryRead=document.createElement('button');retryRead.id='handwritingRetryReadBtn';retryRead.type='button';retryRead.className='btn';retryRead.textContent='Read again';retryRead.hidden=true;
 const feedbackArea=document.createElement('div');feedbackArea.className='handwriting-feedback-controls';
 const test=document.createElement('button');test.type='button';test.className='btn';test.textContent='↻ Learn & Test Again';test.title='Save a confirmed correction locally, then read the SAME original strokes again';
 const feedback=document.createElement('p');feedback.className='handwriting-feedback-message';feedback.setAttribute('aria-live','polite');
 feedback.textContent='If the reading is correct, press Apply. If it is wrong, correct it and press Learn.';
 feedbackArea.append(feedback);
 function clearProvisional(){
  feedbackStamp++;
  if(pendingLearning){try{window.WhiteboardHandwritingLearning?.undo(pendingLearning)}catch{}pendingLearning=null}
  feedback.textContent='Edit the reading, then press Learn again. The earlier correction from this review was discarded.';
 }
 function updatePreview(){
  const arithmetic=arithmeticResult();
  const obj=formatted();const canApply=!!obj&&!reading&&!testing;apply.disabled=!canApply;learn.disabled=!canApply||!!pendingLearning;test.disabled=!canApply||!!pendingLearning;preview.hidden=!obj;if(obj)preview.src=obj.src;input.style.color=colourSelect.value;
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
    feedback.textContent=training.symbols?
     'Saved a reusable '+training.symbols.char+' symbol example. Same ink reads correctly; Apply, then write a different equation to test it.':again.engine==='local-personal-ink'?
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
 learn.onclick=()=>{if(reading||testing||pendingLearning||!formatted())return;try{const learner=window.WhiteboardHandwritingLearning,recogniser=window.WhiteboardHandwritingMath;if(!learner?.confirm||!recogniser?.rasterDigit){feedback.textContent='Local learning is unavailable.';return}const training=learner.confirm(recognition,input.value,recogniser.rasterDigit,group,cssW,cssH,modeSelect.value);if(!training?.count){feedback.textContent='No new example was saved.';return}pendingLearning=training;feedback.textContent=training.persistent?'Correction learned on this browser. Press Apply to beautify.':'Correction learned for this session. Press Apply to beautify.';updatePreview()}catch{feedback.textContent='Unable to save learning. Your ink is unchanged.'}};
 apply.onclick=()=>{
  if(reading||testing)return;
  const obj=formatted();if(!obj){updatePreview();return}
  if(!group.every(s=>strokes.includes(s))||JSON.stringify(group)!==original){status.textContent='This handwriting changed. Cancel and select it again.';apply.disabled=true;return}
  const before=clone(strokes),first=Math.min(...group.map(s=>strokes.indexOf(s))),set=new Set(group);
  obj.smartOriginal=clone(group);obj.handwritingBeautified=true;
  // Committing the preview transfers provisional learning to Undo history.
  let learning=pendingLearning;pendingLearning=null;
  strokes=strokes.filter(s=>!set.has(s));strokes.splice(first,0,obj);window.WhiteboardMarqueeSelection?.clear();tool='pen';closeReview();redraw();
  // Apply never creates a new learning example.
  history.push({before,after:JSON.stringify(strokes),learning});if(history.length>30)history.shift();syncUi();
  // Use the existing Pen button handler too, so selection state and toolbar UI reset.
  document.getElementById('penBtn')?.click();
  sayLocal(learning?.symbols?'Handwriting beautified · Reusable '+learning.symbols.char+' example saved':learning?.count?(learning.persistent?'Handwriting beautified · Examples saved on this browser':'Handwriting beautified · Examples learned for this session'):'Handwriting beautified · Undo restores the original writing');
 };
 actions.append(apply,learn,stopRead,retryRead,cancel);const exportInk=document.createElement('button');
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
 const settings=document.createElement('details');settings.className='handwriting-advanced-settings';settings.style.cssText='margin-top:12px;border-top:1px solid #d8e1e8;padding-top:10px';const settingsLabel=document.createElement('summary');settingsLabel.textContent='⚙ Settings';settingsLabel.style.cssText='cursor:pointer;font-weight:700;color:#17324d;padding:7px 2px;list-style:revert';const guide=document.createElement('div');guide.style.cssText='font-size:13px;line-height:1.5;margin:8px 0 12px';const guideTitle=document.createElement('strong');guideTitle.textContent='How handwriting recognition and learning work';const steps=document.createElement('ol');steps.style.paddingLeft='22px';['Write with Pen, select Beautify, and box the handwritten expression. Recognition runs locally using the existing recogniser, context and saved examples.','If the reading is correct, press Apply. It beautifies the selection without adding a learning example.','If the reading is wrong, edit it to match what you actually wrote. Press the blue Learn button to save the corrected strokes and label locally; then press Apply to beautify.','Learning stores labelled examples in this browser; it does not retrain the underlying AI model. Try different natural handwriting variations to check improvement.','Export learning creates a JSON backup of accumulated examples. Import learning merges examples into this browser, skipping duplicate features and respecting storage limits. Your existing examples take priority.','Export selected pen strokes is a separate diagnostic JSON for investigating one recognition error; it is not the learning backup.','No examples are automatically uploaded or shared. Back up learning before clearing browser site data or changing devices.'].forEach(t=>{const li=document.createElement('li');li.textContent=t;li.style.marginBottom='7px';steps.appendChild(li)});guide.append(guideTitle,steps);const learningActions=document.createElement('div');learningActions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px';const learningManage=document.createElement('button');learningManage.type='button';learningManage.className='btn soft';learningManage.textContent='Export / Import Learning JSON';learningManage.onclick=()=>{const legacy=document.getElementById('handwritingLearningBtn');if(legacy)legacy.click();else alert('Learning controls are unavailable. Refresh V2 and try again.')};learningActions.appendChild(learningManage);settings.append(settingsLabel,guide,learningActions,exportInk);panel.append(title,help,ink,label,input,appearance,status,contextArea,preview,feedbackArea,actions,settings);backdrop.appendChild(panel);document.body.appendChild(backdrop);cancel.focus();
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
let annotationContext='whiteboard';
const annotationHistories=new Map();
document.addEventListener('whiteboard-annotation-context',e=>{
 const key=e.detail?.key;if(!key||key===annotationContext)return;
 closeReview();endSelection();annotationHistories.set(annotationContext,history.slice());
 history.splice(0,history.length,...(annotationHistories.get(key)||[]));annotationContext=key;
 if(key==='whiteboard'){annotationHistories.clear();annotationHistories.set(key,history.slice())}
});
document.addEventListener('whiteboard-annotation-transform',e=>{
 const map=e.detail?.map;if(!map)return;
 for(const h of history){h.before=map(h.before);h.after=JSON.stringify(map(JSON.parse(h.after)))}
 if(dialog){closeReview();endSelection()}
});
document.getElementById('undoBtn')?.addEventListener('click',undoBeautify,true);
const oldSync=syncUi;syncUi=function(){const result=oldSync.apply(this,arguments);if(availableUndo())document.getElementById('undoBtn').disabled=false;return result};
})();
