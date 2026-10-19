/* Reproduce a stalled model download and recogniser in the real review UI.
 * A controlled clock expires only long deadlines; ordinary microtasks run.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture({missingModel=false,read}={}){
 let document,serial=100000;const timers=new Map();
 class Element{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.events={};this.attributes={};this.style={};this.value='';this.hidden=false;this.disabled=false;this.classList={add(){},remove(){},toggle(){}};}
  append(...children){for(const c of children){c.parent=this;this.children.push(c)}}
  appendChild(c){this.append(c);return c}
  insertBefore(c,b){c.parent=this;const i=this.children.indexOf(b);this.children.splice(i<0?this.children.length:i,0,c)}
  replaceChildren(...c){this.children=[];this.append(...c)}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this)}
  setAttribute(k,v){this.attributes[k]=String(v)}
  addEventListener(k,fn){(this.events[k]??=[]).push(fn)}
  async fire(k){for(const fn of this.events[k]||[])await fn({preventDefault(){},stopImmediatePropagation(){}})}
  async click(){if(this.disabled)return;await this.fire('click');return this.onclick?.()}
  focus(){document.activeElement=this}
 }
 const find=(e,fn)=>fn(e)?e:e.children.map(c=>find(c,fn)).find(Boolean);
 const body=new Element('body'),head=new Element('head'),tools=new Element('div'),board=new Element('div'),undo=new Element('button');
 board.id='boardWrap';undo.id='undoBtn';tools.append(undo);body.append(tools,board);
 document={head,body,createElement:t=>new Element(t),getElementById:id=>find(body,e=>e.id===id),querySelector:s=>s==='.tools'?tools:null};
 const raw={size:4,points:[{x:.2,y:.3},{x:.25,y:.4}]},result={text:'cat',tokens:[],uncertain:[],engine:'local-emnist-cnn'};
 let cancellations=0,confirmed=0;
 const ctx={document,console,Math,JSON,Number,Set,encodeURIComponent,AbortController,
  setTimeout(fn,ms){if(ms>=100){const id=++serial;timers.set(id,{fn,ms});return id}return setTimeout(fn,0)},
  clearTimeout(id){if(timers.has(id))timers.delete(id);else clearTimeout(id)},
  canvas:{releasePointerCapture(){}},strokes:[raw],cssW:800,cssH:600,tool:'select',redraw(){},syncUi(){},addEventListener(){},
  WhiteboardHandwritingMath:{build:'20261020-words2',recognize:read||(()=>Promise.resolve(result)),rasterDigit(){}},
  WhiteboardHandwritingLearning:{confirm(){confirmed++;return{count:1,persistent:true}},undo(){}},
  WhiteboardEquationFormatter:{font:()=> 'Arial',createHandwriting:(text,b,colour)=>text?{type:'image',src:'preview:'+text,colour,...b}:null},
  WhiteboardCharacterReader:{cancel(){cancellations++}},WhiteboardMarqueeSelection:{get:()=>ctx.strokes,clear(){}}};
 for(const key of ['WhiteboardDigitModel','WhiteboardCharacterModels','WhiteboardCharacterInference','WhiteboardUjiWeights','WhiteboardUjiReader','WhiteboardPrimaryMathGrammar','WhiteboardEqualSign','WhiteboardTrained9GQEquals','WhiteboardTrainedJ','WhiteboardTrainedRemaining','WhiteboardTeacherUnits','WhiteboardTeacherConfusables','WhiteboardUnitExponent','WhiteboardHandwritingContextModel','WhiteboardHandwritingContext'])ctx[key]={};
 if(missingModel)delete ctx.WhiteboardDigitModel;
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('whiteboard-handwriting-beautify-beta.js','utf8'),ctx);
 return{ctx,result,raw,timers,head,undo,id:id=>document.getElementById(id),button:text=>find(body,e=>e.textContent===text),
  status:()=>find(body,e=>e.attributes.role==='status')?.textContent,
  expire(ms){const t=[...timers.values()].find(t=>t.ms===ms);assert(t,'deadline '+ms+' exists');t.fn()},
  get confirmed(){return confirmed},get cancellations(){return cancellations}};
}
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function until(test){for(let i=0;i<30;i++){if(test())return;await tick()}assert(test(),'asynchronous job started')}
(async()=>{
 // A never-resolving read used to keep Apply disabled even after manual input.
 let finish,signal;
 const typed=fixture({read:(_s,_w,_h,o)=>{signal=o.signal;return new Promise(resolve=>finish=resolve)}});
 const waiting=typed.id('handwritingBeautifyBtn').click();await until(()=>finish);
 typed.id('handwritingReadText').value='The cat';await typed.id('handwritingReadText').fire('input');await waiting;
 assert(signal.aborted);assert.equal(typed.button('✓ Apply beautify').disabled,false);
 finish({...typed.result,text:'late wrong reading'});await tick();assert.equal(typed.id('handwritingReadText').value,'The cat');
 await typed.button('✓ Apply beautify').click();assert.equal(typed.ctx.strokes[0].src,'preview:The cat');assert.equal(typed.confirmed,1);
 await typed.undo.click();assert.equal(JSON.stringify(typed.ctx.strokes),JSON.stringify([typed.raw]));assert.equal(typed.timers.size,0);
 // A stuck backend times out, leaves the ink, and can be retried successfully.
 const slow=fixture({read:()=>new Promise(()=>{})}),pending=slow.id('handwritingBeautifyBtn').click();
 await until(()=>slow.timers.size);slow.expire(25000);await pending;
 assert(slow.status().includes('took too long'));assert.equal(slow.id('handwritingRetryReadBtn').hidden,false);
 assert.equal(slow.ctx.strokes[0],slow.raw);assert.equal(slow.confirmed,0);
 slow.ctx.WhiteboardHandwritingMath.recognize=()=>Promise.resolve(slow.result);
 await slow.id('handwritingRetryReadBtn').click();assert.equal(slow.id('handwritingReadText').value,'cat');assert.equal(slow.button('✓ Apply beautify').disabled,false);
 await slow.button('Cancel').click();assert.equal(slow.timers.size,0);
 // A stalled script request never fires load or error; its own deadline recovers.
 const loading=fixture({missingModel:true}),load=loading.id('handwritingBeautifyBtn').click();
 await until(()=>loading.head.children.some(e=>e.tagName==='SCRIPT'));loading.expire(10000);await load;
 assert(loading.status().includes('load'));assert(!loading.head.children.some(e=>e.tagName==='SCRIPT'));
 loading.ctx.WhiteboardDigitModel={};await loading.id('handwritingRetryReadBtn').click();assert.equal(loading.id('handwritingReadText').value,'cat');await loading.button('Cancel').click();
 // Stop settles a stuck request immediately; a later read starts cleanly.
 let stopSignal;
 const stopped=fixture({read:(_s,_w,_h,o)=>{stopSignal=o.signal;return new Promise(()=>{})}}),stop=stopped.id('handwritingBeautifyBtn').click();
 await until(()=>stopSignal);await stopped.id('handwritingStopReadBtn').click();await stop;assert(stopSignal.aborted);assert(stopped.status().includes('stopped'));
 stopped.ctx.WhiteboardHandwritingMath.recognize=()=>Promise.resolve(stopped.result);await stopped.id('handwritingRetryReadBtn').click();assert.equal(stopped.id('handwritingReadText').value,'cat');await stopped.button('Cancel').click();
 // Stop during a stalled learning check retains the pending example for Apply.
 let learnSignal;
 const learning=fixture();await learning.id('handwritingBeautifyBtn').click();
 learning.ctx.WhiteboardHandwritingMath.recognize=(_s,_w,_h,o)=>{learnSignal=o.signal;return new Promise(()=>{})};
 const learningRead=learning.button('↻ Learn & Test Again').click();await until(()=>learnSignal);
 await learning.id('handwritingStopReadBtn').click();await learningRead;assert(learnSignal.aborted);
 assert.equal(learning.button('✓ Apply beautify').disabled,false);await learning.button('✓ Apply beautify').click();assert.equal(learning.confirmed,1);assert.equal(learning.ctx.strokes[0].src,'preview:cat');
 // Optional vocabulary files do not prevent ordinary reading from starting.
 const optional=fixture();await optional.id('handwritingBeautifyBtn').click();assert.equal(optional.id('handwritingReadText').value,'cat');assert(!optional.head.children.some(e=>e.tagName==='SCRIPT'));await optional.button('Cancel').click();
 console.log('PASS actual stalled-read recovery: typed correction, late-result protection, timeout, retry, model-download timeout, Stop, optional vocabulary, Apply and Undo');
})().catch(e=>{console.error(e);process.exitCode=1});
