/* Public UJI V1 samples exercise the actual Beta controller, without mocks. */
const fs=require('node:fs'),zlib=require('node:zlib');
const {assemble}=require('./benchmark-handwriting-words.cjs');
const fixture=JSON.parse(zlib.gunzipSync(fs.readFileSync('scripts/handwriting-uji-word-fixtures.json.gz')));
const examples=Object.fromEntries(['C','cat','the cat'].map(text=>[text,assemble(fixture.samples['1'],text,0)]));
let html=fs.readFileSync('whiteboard-comer-beta.html','utf8');
const banner=`<aside id="wordExampleBar" style="padding:10px 14px;background:#e7f7f4;border:1px solid #9dc9c0;border-radius:12px;font:14px/1.5 Arial,sans-serif"><strong>Try word checking</strong> · Public UJI V1 pen samples, composed into words. Choose a sample, then drag around it to review.<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:5px"><button type="button" data-word-example="C">Try C / c</button><button type="button" data-word-example="cat">Try cat</button><button type="button" data-word-example="the cat">Try the cat</button><a href="whiteboard-comer-beta.html?v=20261020-words1">Open your whiteboard</a><span id="wordExampleLabel" aria-live="polite"></span></div></aside>`;
html=html.replace('<div class="shell">','<div class="shell">'+banner);
if(!html.includes('id="wordExampleBar"'))throw Error('Demo insertion point missing');
const script=`/* UJI Pen Characters V1, CC BY 4.0. D. Llorens, F. Prat, A. Marzal and J. M. Vilar.
 * https://doi.org/10.24432/C5731G — isolated glyph compositions, not natural words.
 * This page loads the unmodified production reader and Beautify controller. */
(function(){
 const examples=${JSON.stringify(examples)};
 document.querySelectorAll('[data-word-example]').forEach(button=>button.addEventListener('click',()=>{
  const label=button.dataset.wordExample,ink=examples[label],points=ink.flatMap(s=>s.points);
  const xmin=Math.min(...points.map(p=>p.x*2400)),ymin=Math.min(...points.map(p=>p.y*700));
  const ymax=Math.max(...points.map(p=>p.y*700)),scale=90/Math.max(1,ymax-ymin);
  strokes=ink.map(s=>({colour:'#17324d',size:3,points:s.points.map(p=>({x:(100+(p.x*2400-xmin)*scale)/cssW,y:(80+(p.y*700-ymin)*scale)/cssH}))}));
  current=null;drawing=false;window.WhiteboardMarqueeSelection?.clear();redraw();syncUi();
  document.getElementById('wordExampleLabel').textContent='Sample: '+label+' · writer 1, repetition 1';
  document.getElementById('handwritingBeautifyBtn').click();
 }));
})();
`;
fs.writeFileSync('whiteboard-handwriting-word-demo-beta.js',script);
html=html.replace('</body>','<script src="whiteboard-handwriting-word-demo-beta.js?v=20261020-words1"></script>\n</body>');
fs.writeFileSync('handwriting-word-check-demo.html',html);
console.log('Built public word-choice demo from the production Beta and labelled UJI V1 samples');
