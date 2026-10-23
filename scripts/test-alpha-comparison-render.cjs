'use strict';
// Install jsdom@26.1.0, then run node scripts/test-alpha-comparison-render.cjs.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const selectionPath='experimental/math-structure/whiteboard-text-drag-resizable-v2.js';
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const selectionSource=process.env.CC_SELECTION_SOURCE?fs.readFileSync(process.env.CC_SELECTION_SOURCE,'utf8'):read(selectionPath);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function check(pageName,width){
 const dom=new JSDOM(read(pageName),{url:'https://example.test/'+pageName,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,context=dom.getInternalVMContext(),errors=[],imageDraws=[],observers=[];
 const NativeObserver=w.MutationObserver;
 w.MutationObserver=class extends NativeObserver{constructor(callback){super(callback);observers.push(this)}};
 w.CanvasRenderingContext2D=class{fillText(){} stroke(){} drawImage(...args){imageDraws.push(args)} measureText(text){return{width:String(text).length*14}}};
 const ctx=new Proxy(new w.CanvasRenderingContext2D(), {get:(o,key)=>o[key]||(()=>{})});
 w.HTMLCanvasElement.prototype.getContext=()=>ctx;
 w.HTMLElement.prototype.getBoundingClientRect=function(){return{x:0,y:0,left:0,top:0,right:width,bottom:800,width,height:800}};
 w.ResizeObserver=class{observe(){} disconnect(){}};
 w.Image=class{constructor(){this.complete=true;this.naturalWidth=900;this.naturalHeight=440}set src(value){this._src=value;w.setTimeout(()=>this.onload?.(),0)}get src(){return this._src}};
 w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
 w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 w.addEventListener('error',event=>errors.push(event.error?.message||event.message));
 const run=code=>vm.runInContext(code,context);
 try{
  // Execute the real toolbar and complete Smart Math stack in page order.
  // Canvas calls are recorded: an object in strokes alone is insufficient.
  const scripts=[...w.document.scripts].map(s=>s.getAttribute('src')).filter(Boolean).map(s=>s.split('?')[0]);
  const needed=p=>p==='whiteboard-core.js'||p===selectionPath||p==='whiteboard-classroom-pro.js'||p==='experimental/math-structure/smart-math-recognition-v2.js'||p.startsWith('smart-math-')||p==='whiteboard-marquee-select-beta.js';
  for(const p of scripts.filter(needed))run(p===selectionPath?selectionSource:read(p));
  run(read('smart-math-comparison-3bar-count-fix.js'));
  await wait(150);
  assert(w.document.getElementById('imageBtn'),'Image controller must complete initialization');
  assert(w.WhiteboardAnnotationHistory,'Selection controller and history must be available');
  const choose=()=>{
   w.document.getElementById('smartMathBtn').click();
   [...w.document.querySelectorAll('button')].find(b=>b.textContent==='Bar Model').click();
   [...w.document.querySelectorAll('#smartBarTypeMenu button')].find(b=>b.textContent==='Comparison').click();
  };
  for(const count of [2,3]){
   run('strokes=[];redraw();syncUi()');choose();
   run(`strokes=Array.from({length:${count}},(_,i)=>({colour:'#17324d',size:5,points:[[.18,.22+i*.19],[.18+.58-i*.12,.22+i*.19],[.18+.58-i*.12,.30+i*.19],[.18,.30+i*.19],[.18,.22+i*.19]].map(([x,y])=>({x,y}))}));redraw();syncUi()`);
   const expected=JSON.parse(run('JSON.stringify(strokes)'));
   imageDraws.length=0;
   const finish=w.document.getElementById('smartMathBtn').nextElementSibling;
   finish.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true}));finish.click();
   await wait(400);
   const models=JSON.parse(run("JSON.stringify(strokes.filter(s=>s.smartBarType==='comparison'))"));
   assert.equal(models.length,1,'One comparison model must be created');
   assert.equal(models[0].barCount,count,'Preserve comparison row count');
   assert.equal(run('strokes.filter(s=>Array.isArray(s.points)).length'),0,'Replace rough bars');
   assert(imageDraws.some(args=>args[0].src?.startsWith('data:image/svg+xml')&&args[3]>0&&args[4]>0),'Comparison SVG must reach the canvas renderer');
   w.document.getElementById('undoBtn').click();
   assert.deepEqual(JSON.parse(run('JSON.stringify(strokes)')),expected,'One Undo restores the original drawing');
   console.log('PASS',pageName,width,count+'-bar creation, canvas rendering and Undo');
  }
  // Preserve the event used by the protected speech panel to insert text.
  run('strokes=[];redraw();syncUi()');
  const detail={text:'12 + 3 = 15'};
  w.document.dispatchEvent(new w.CustomEvent('whiteboard-insert-speech-text',{detail}));
  assert.equal(detail.inserted,true,'Speech text insertion remains connected');
  assert.equal(run('strokes[0].text'),'12 + 3 = 15');
  assert.deepEqual(errors,[],'No runtime errors');
  console.log('PASS',pageName,width,'toolbar initialization and speech text insertion');
 }finally{observers.forEach(o=>o.disconnect());w.close()}
}
(async()=>{for(const name of ['whiteboard.html','whiteboard-v2-trial.html'])for(const width of [1365,390])await check(name,width)})().catch(error=>{console.error(error);process.exitCode=1});
