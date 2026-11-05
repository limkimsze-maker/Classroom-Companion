/* Teacher Music Score Studio: pure engraving geometry regressions.
 * Run in Node: node --test music-score-studio/tests/rhythm-engraving.test.cjs
 * These are SVG coordinate/function tests, NOT desktop/phone/audio checks. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function extract(a,b){
 const first=html.indexOf(a),last=html.indexOf(b,first+a.length);
 assert.ok(first>=0&&last>first,'Could not extract '+a);return html.slice(first,last);
}
const geometry=[
 extract('function engravingGap(','function staffLayout('),
 extract('function staffLayout(','function el('),
 extract('function printBarEvents(','function drawBarDirections('),
 extract('function staffNotePosition(','function hideMusicNoteMenu('),
 extract('function planRhythmBeams(','function rhythmBeamLookup(')
].join('\n');
const STEPS=['C','D','E','F','G','A','B'],TICKS=96;
const ev=(den=4,step='C',extra={})=>({kind:'note',id:'e'+Math.random(),step,octave:4,den,dot:false,acc:'',...extra});
const rest=(den=4,extra={})=>({kind:'rest',id:'r'+Math.random(),den,dot:false,...extra});
function make(bars,meter='4/4',extra={}){
 let data={title:'Engraving test',bars,clef:'treble',meter,completeBars:true,
  strokes:[],barDirectives:[],...extra};
 const ticks=e=>TICKS/e.den*(e.dot?1.5:1);
 const cap=()=>{const [n,d]=data.meter.split('/').map(Number);return n*TICKS/d};
 const sumBar=bar=>bar.reduce((n,e)=>n+ticks(e),0);
 const isTwoBarRest=index=>data.barDirectives?.[index]?.multiRest==='2'&&
  !data.bars[index].length&&index+1<data.bars.length&&!data.bars[index+1].length;
 const noteIndex=(step,octave)=>octave*7+STEPS.indexOf(step);
 const fromIndex=i=>({step:STEPS[((i%7)+7)%7],octave:Math.floor(i/7)});
 const bottomIndex=()=>data.clef==='treble'?noteIndex('E',4):noteIndex('G',2);
 const pitchOfY=(y,top)=>fromIndex(Math.max(8,Math.min(48,bottomIndex()+Math.round(((top+72)-y)/9))));
 const funcs=new Function('data','TICKS','ticks','cap','sumBar','isTwoBarRest',
  'noteIndex','fromIndex','bottomIndex','pitchOfY',geometry+
  '\nreturn {engravingGap,engravingMinWidth,eventPositions,findInsertIndex,staffLayout,staffNotePosition,planRhythmBeams,printBarEvents,setData(v){data=v}};'
 )(data,TICKS,ticks,cap,sumBar,isTwoBarRest,noteIndex,fromIndex,bottomIndex,pitchOfY);
 return {...funcs,get data(){return data;},setData:v=>{data=v;funcs.setData(v)},sumBar,cap,ticks};
}
const positions=(api,index,printing=false)=>{
 const layout=api.staffLayout(printing),cell=layout.cells[index];
 return api.eventPositions(printing?api.printBarEvents(api.data.bars[index]):api.data.bars[index],cell.left,cell.width);
};
function clearances(xs,bar,api){
 assert.equal(xs.length,bar.length);
 for(let i=1;i<xs.length;i++){
  const actual=xs[i]-xs[i-1];
  assert.ok(actual>=Math.min(api.engravingGap(bar[i-1],bar[i]),30)-1,
   'Adjacent notes overlap at '+i+': '+actual);
 }
}
test('four crotchets in 4/4 have consistent rhythmic gaps',()=>{
 const bar=[ev(4,'C'),ev(4,'D'),ev(4,'E'),ev(4,'F')],api=make([bar]);
 const xs=positions(api,0),gaps=xs.slice(1).map((x,i)=>x-xs[i]);
 assert.equal(gaps.length,3);assert.ok(gaps.every(x=>Math.abs(x-gaps[0])<.01));
 clearances(xs,bar,api);assert.equal(api.sumBar(bar),96);
});
test('minim, crotchet and quaver form semi-proportional rather than equal gaps',()=>{
 const bar=[ev(2,'G'),ev(4,'A'),ev(8,'B'),ev(8,'C',{octave:5})],api=make([bar]);
 const xs=positions(api,0),gaps=xs.slice(1).map((x,i)=>x-xs[i]);
 assert.ok(gaps[0]>gaps[1]&&gaps[1]>gaps[2],'minim needs more space than shorter values');
 clearances(xs,bar,api);
});
test('dotted notes and rests maintain clearance and do not change beat totals',()=>{
 const bar=[ev(4,'E',{dot:true}),rest(8),ev(8,'F'),rest(4)],api=make([bar],'4/4');
 const original=JSON.stringify(bar),xs=positions(api,0);
 clearances(xs,bar,api);assert.ok(xs[1]-xs[0]>=39);
 assert.equal(JSON.stringify(bar),original);
 assert.equal(api.sumBar(bar),24*1.5+12+12+24);
});
test('4/4 quavers and semiquavers beam only inside crotchet beats',()=>{
 const api=make([[...Array.from({length:8},(_,i)=>ev(8,STEPS[i%7]))]],'4/4');
 assert.deepEqual(api.planRhythmBeams(api.data.bars[0]),[[0,1],[2,3],[4,5],[6,7]]);
 const pattern=[ev(16),ev(16),ev(8),ev(4),ev(16),ev(16),ev(8)];
 assert.deepEqual(api.planRhythmBeams(pattern),[[0,1,2],[4,5,6]]);
});
test('6/8 beaming groups 3 quavers per dotted-crotchet beat and stops at rests',()=>{
 const bar=Array.from({length:6},()=>ev(8)),api=make([bar],'6/8');
 assert.deepEqual(api.planRhythmBeams(bar),[[0,1,2],[3,4,5]]);
 const withRest=[ev(8),rest(8),ev(8),ev(8),ev(8),ev(8)];
 assert.deepEqual(api.planRhythmBeams(withRest),[[3,4,5]]);
});
test('accidentals increase spacing and one-ledger pitch remains accurately mapped',()=>{
 const plain=[ev(8,'C'),ev(8,'D')],altered=[ev(8,'C'),ev(8,'D',{acc:'#'})];
 const first=make([plain]),second=make([altered]);
 assert.ok(second.engravingGap(altered[0],altered[1])>=first.engravingGap(plain[0],plain[1]));
 const l=second.staffLayout(),cell=l.cells[0];
 const c4=second.staffNotePosition({x:cell.left+50,y:cell.top+90});
 assert.ok(c4);assert.equal(c4.pitch.step,'C');assert.equal(c4.pitch.octave,4);
 clearances(positions(second,0),altered,second);
});
test('click insertion order is independent from final engraved x',()=>{
 const bar=[ev(4,'C',{posX:.12}),ev(4,'G',{posX:.80})],api=make([bar]);
 const l=api.staffLayout(),cell=l.cells[0],xs=positions(api,0);
 assert.equal(api.findInsertIndex(0,cell.left+cell.width*.46,cell.left,cell.width),1);
 const change=ev(8,'E',{posX:.46});bar.splice(1,0,change);
 assert.deepEqual(bar.map(e=>e.step),['C','E','G']);
 const reflow=positions(api,0);
 assert.ok(reflow[0]<reflow[1]&&reflow[1]<reflow[2]);
 assert.equal(bar[0].posX,.12);assert.equal(bar[2].posX,.80);
 assert.ok(xs[0]!==reflow[0]||xs[1]!==reflow[2],'adjacent positions reflow');
});
test('deleting a note reflows while leaving other note metadata intact',()=>{
 const bar=[ev(4,'C'),ev(4,'D'),ev(4,'E'),ev(4,'F')],api=make([bar]);
 const before=positions(api,0),saved=JSON.stringify([bar[0],bar[2],bar[3]]);
 bar.splice(1,1);const after=positions(api,0);
 assert.equal(after.length,3);assert.ok(before.length!==after.length);
 assert.equal(JSON.stringify(bar),saved);assert.equal(api.sumBar(bar),72);
});
test('changing duration triggers different spacing without modifying pitches/order',()=>{
 const bar=[ev(4,'C'),ev(4,'D'),ev(4,'E')],api=make([bar]);
 const before=positions(api,0),originalSteps=bar.map(e=>e.step);
 bar[0].den=2;const after=positions(api,0);
 assert.deepEqual(bar.map(e=>e.step),originalSteps);
 assert.ok(Math.abs((before[1]-before[0])-(after[1]-after[0]))>2);
 assert.ok(api.sumBar(bar)<=api.cap());
});
test('ties, slurs, articulations keep their own event references for renderer reflow',()=>{
 const a=ev(4,'C',{id:'one',tieTo:'two',accent:true});
 const b=ev(4,'C',{id:'two',slurTo:'three',staccato:true});
 const c=ev(4,'D',{id:'three'});
 const bar=[a,b,c],api=make([bar]);
 const before=JSON.stringify(bar);positions(api,0);
 assert.equal(JSON.stringify(bar),before);
 assert.equal(bar[0].tieTo,'two');assert.equal(bar[1].slurTo,'three');
 assert.match(html,/drawMusicConnections\(svg,notePositions,layout\)/);
 assert.match(html,/layout\.systemEnds\[a\.sys\]/);
});
test('long score layouts have content-dependent systems and no overlapping bars',()=>{
 const dense=Array.from({length:16},()=>ev(16));
 const sparse=[ev(1)];
 const bars=Array.from({length:40},(_,i)=>i%5===0?dense.map(x=>({...x})):sparse.map(x=>({...x})));
 const api=make(bars,'4/4'),layout=api.staffLayout();
 assert.equal(layout.cells.length,40);assert.ok(layout.sys>1);
 for(const cell of layout.cells){
  assert.ok(cell.width>=api.engravingMinWidth(bars[cell.bar])-1);
  assert.ok(cell.left+cell.width<=layout.systemEnds[cell.sys]+.1);
 }
 for(const row of layout.systemCells)for(let i=1;i<row.length;i++)
  assert.ok(row[i].left>=row[i-1].left+row[i-1].width-.001);
 for(let i=0;i<40;i++)clearances(positions(api,i),bars[i],api);
});
test('print-only completion rests influence measure width without changing saved data',()=>{
 const incomplete=[ev(8,'G')],api=make([incomplete,Array.from({length:8},()=>ev(8))],'4/4');
 const saved=JSON.stringify(api.data),printed=api.printBarEvents(incomplete);
 assert.ok(printed.length>incomplete.length);
 const printLayout=api.staffLayout(true);
 assert.ok(printLayout.cells[0].width>=api.engravingMinWidth(printed)-1);
 assert.equal(JSON.stringify(api.data),saved);
 assert.ok(positions(api,0,true).every(Number.isFinite));
});
test('JSON save/reopen keeps duration, order, position hints and computed engraving',()=>{
 const bar=[ev(4,'C',{posX:.15}),ev(8,'D',{posX:.55}),ev(8,'E',{posX:.8})];
 const api=make([bar]),before=positions(api,0),original=JSON.stringify(api.data);
 api.setData(JSON.parse(original));const after=positions(api,0);
 assert.deepEqual(after,before);assert.equal(JSON.stringify(api.data),original);
 assert.deepEqual(api.data.bars[0].map(x=>x.step),['C','D','E']);
 assert.equal(api.sumBar(api.data.bars[0]),48);
});
test('adding handwritten ink leaves the current engraving geometry unchanged',()=>{
 const api=make([[ev(4),ev(4)],[ev(8),ev(8)],[],[]]);
 const before=api.staffLayout();
 api.data.strokes.push({points:[[10,10],[20,20]],kind:'pen'});
 const after=api.staffLayout();
 assert.deepEqual(after.cells,before.cells);
 assert.deepEqual(after.systemEnds,before.systemEnds);
 assert.equal(after.W,before.W);
});
test('marked two-bar rests stay in the same adaptive system',()=>{
 const api=make([[],[],[ev(1)],[],[]],'4/4',{
  barDirectives:[{multiRest:'2'},null,null,{multiRest:'2'},null]
 });
 const l=api.staffLayout();
 assert.equal(l.cells[0].sys,l.cells[1].sys);
 assert.equal(l.cells[3].sys,l.cells[4].sys);
});
test('source retains recognition, playback, British values and licence notices',()=>{
 for(const key of ['function createImportedRepeatedTiming(',
  'function applyImportedDynamicEvents(','function playPiano(',
  'function makeMusicPerformance(','function wireOneStepScanner(',
  'function beautifyInk(','function drawMusicConnections(',
  'function renderRhythmBeams(','function setScoreFullPage(',
  'function printBarEvents('])assert.ok(html.includes(key),key);
 assert.match(html,/Semibreve/);assert.match(html,/Semiquaver/);
 assert.match(html,/AGPL-3\.0/);
});

function actualScoreRenderer(data){
 const STEPS=['C','D','E','F','G','A','B'],TICKS=96,NS='http://www.w3.org/2000/svg';
 const noteIndex=(step,oct)=>oct*7+STEPS.indexOf(step);
 const bottomIndex=()=>data.clef==='bass'?noteIndex('G',2):noteIndex('E',4);
 const ticks=e=>TICKS/e.den*(e.dot?1.5:1);
 const sumBar=bar=>bar.reduce((n,e)=>n+ticks(e),0);
 const cap=()=>{const [n,d]=data.meter.split('/').map(Number);return n*TICKS/d};
 function node(name){return {name,attrs:{},children:[],setAttribute(k,v){this.attrs[k]=String(v)},
  getAttribute(k){return this.attrs[k]},append(...items){this.children.push(...items)},
  appendChild(item){this.children.push(item)},get childNodes(){return this.children},remove(){},textContent:''};}
 const document={createElementNS:(_ns,name)=>node(name)};
 const stubs={data,document,TICKS,NS,noteIndex,bottomIndex,ticks,sumBar,cap,
  selected:null,playingId:null,boxSelectedNotes:new Set(),boxSelectedStrokes:new Set(),
  penDraft:null,boxDraft:null,barDirective:()=>({}),musicalLinks:()=>({ties:new Map(),slurs:new Map()}),den:4};
 const drawing=extract('function staffLayout(exportMode=false)','function render(){');
 const f=new Function(...Object.keys(stubs),geometry.split('function staffLayout')[0]+drawing+
  '\nreturn {makeScore,staffLayout};');
 return f(...Object.values(stubs));
}
function walkSvg(root){
 return [root,...root.children.flatMap(walkSvg)];
}
test('actual composer SVG reflows dense 16-semiquaver notes without notehead overlaps',()=>{
 const notes=Array.from({length:16},(_,i)=>ev(16,STEPS[i%7]));
 const data={title:'Dense rhythm',composer:'Teacher',clef:'treble',meter:'4/4',completeBars:false,
  bars:[notes],strokes:[],barDirectives:[],pitchNames:false};
 const render=actualScoreRenderer(data),svg=render.makeScore();
 const heads=svg.children.filter(n=>n.attrs['data-id']).map(group=>
  walkSvg(group).find(n=>n.name==='ellipse'&&n.attrs.cx!==undefined)).filter(Boolean);
 assert.equal(heads.length,16);
 const x=heads.map(n=>Number(n.attrs.cx));
 for(let i=1;i<x.length;i++)assert.ok(x[i]>x[i-1]+28,'No notehead collision at '+i);
 assert.ok(walkSvg(svg).some(n=>n.attrs.class==='autoRhythmBeams'),'Beam graphics drawn');
 assert.ok(Number(svg.attrs.viewBox.split(' ').at(-2))>=1120,'Stable projection width');
});
test('actual SVG print/engraving lays out completion rests without changing notes',()=>{
 const data={title:'In progress',composer:'',clef:'treble',meter:'6/8',completeBars:true,
  bars:[[ev(8,'C')],[ev(8,'D'),ev(8,'E'),ev(8,'F')]],strokes:[],barDirectives:[],pitchNames:false};
 const original=JSON.stringify(data),render=actualScoreRenderer(data);
 const screen=render.makeScore(false),print=render.makeScore(true);
 assert.ok(screen.children.length>0&&print.children.length>0);
 assert.ok(walkSvg(print).filter(n=>n.name==='g'&&n.attrs['data-id']).length>
  walkSvg(screen).filter(n=>n.name==='g'&&n.attrs['data-id']).length,'Print-only rests drawn');
 assert.equal(JSON.stringify(data),original,'No mutation to editable project');
});
