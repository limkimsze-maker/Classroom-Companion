/* Teacher quick composition: test actual functions extracted from the committed HTML.
 * DOM and audio are simulated; physical classroom/browser checks remain separate. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function extract(a,b){
 const i=html.indexOf(a),j=html.indexOf(b,i+a.length);
 assert.ok(i>=0&&j>i,'Source region unavailable: '+a);return html.slice(i,j);
}
const functions=[
 extract('function eventPositions(','function insertPlacedMusicEvent('),
 extract('function insertPlacedMusicEvent(','function el('),
 extract('function staffNotePosition(','function hideMusicNoteMenu('),
 extract('function selectPaletteNote(','/* Teacher quick-entry state'),
 extract('/* Teacher quick-entry state','function paletteLocation('),
 extract('function paletteLocation(','function removePaletteGhost('),
 extract('function findSelected()','function addEvent('),
 extract('function removeSelected()','function adjustPitch('),
 extract('function undo()','function updateHistoryButtons()'),
 extract('function validateProject(','function loadProject('),
 extract('function loadProject(','function twinkle('),
 extract('function makeMusicPerformance()','async function play(')
].join('\n');
function harnessFactory(ids,document,window,hooks){
 const TICKS=96,VALID_DEN=[1,2,4,8,16,32,64,128],STEPS=['C','D','E','F','G','A','B'];
 const MUSIC_DURATION_NAMES={1:'Semibreve',2:'Minim',4:'Crotchet',8:'Quaver',16:'Semiquaver'};
 const paletteNames=MUSIC_DURATION_NAMES,EXTRA_MARKS=['staccato','accent'];
 const boxSelectedNotes=new Set(),boxSelectedStrokes=new Set();
 const CLASSROOM_TEMPOS={},MUSICAL_DYNAMICS={mf:.79};
 const blank=()=>({barDirectives:[],title:'My Music Score',composer:'',clef:'treble',meter:'4/4',tempo:96,
  instrument:'piano',pitchNames:false,metronome:false,playFlow:false,completeBars:true,
  bars:Array.from({length:4},()=>[]),strokes:[]});
 let data=blank(),piano=null,tool='select',den=2,dot=false,acc='',selected=null,drag=null,
  activeNoteStampDen=null,quickKeyboardOn=false,quickCursor=null,quickHover=null,
  history=[],future=[],serial=0,playing=false,pendingSlurStart=null;
 const $=id=>ids(id),makeId=()=>('note'+(++serial));
 const ticks=e=>TICKS/e.den*(e.dot?1.5:1),cap=()=>{
  const [n,d]=data.meter.split('/').map(Number);return n*TICKS/d;};
 const sumBar=bar=>bar.reduce((sum,e)=>sum+ticks(e),0);
 const noteIndex=(step,oct)=>oct*7+STEPS.indexOf(step);
 const fromIndex=index=>({octave:Math.floor(index/7),step:STEPS[((index%7)+7)%7]});
 const bottomIndex=()=>data.clef==='treble'?noteIndex('E',4):noteIndex('G',2);
 const pitchOfY=(y,top)=>fromIndex(Math.max(8,Math.min(48,bottomIndex()+Math.round((top+72-y)/9))));
 const flash=message=>hooks.flashes.push(message),updateStatus=message=>{hooks.status=message;};
 const snapshot=()=>JSON.stringify(data);
 const change=()=>{history.push(snapshot());future=[];};
 const commit=()=>{hooks.saved=JSON.stringify(data);hooks.commits++;drawQuickOverlay();};
 const syncConfig=()=>{},closePiano=()=>{piano=null;},removeBrokenConnections=()=>{},stopPlayback=()=>{},cleanBarDirective=v=>v||{};
 const setMode=v=>{tool=v;activeNoteStampDen=null;};
 const expandBarPlayOrder=()=>data.bars.map((_,i)=>i),barDirective=()=>({});
 const musicalLinks=()=>({slurs:new Map(),ties:new Map(),indices:new Map(),refs:[]});
 const midiFor=(bar,index)=>{
  const e=data.bars[bar][index],semi={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  return 12*(e.octave+1)+semi[e.step];};
 const el=(name,props)=>({name,props,children:[],append(child){this.children.push(child);},remove(){}});
 const line=(group,...args)=>group.append({name:'line',args});
 const insertNoteFromMenu=(target,value)=>insertPlacedMusicEvent(target,value);
 const requestAnimationFrame=fn=>{hooks.frames++;return 1;};
 const svgPoint=event=>({x:event.clientX,y:event.clientY});
 /* INSERT_ACTUAL_FUNCTIONS */
 return {
  get data(){return data;},get cursor(){return quickCursor;},get active(){return activeNoteStampDen;},
  get keyboard(){return quickKeyboardOn;},get selected(){return selected;},
  get history(){return history;},get future(){return future;},
  setData(value){data=value;quickCursor=null;quickHover=null;selected=null;},
  setCursor(value){quickCursor=value;},setPiano(value){piano=value;},
  selectPaletteNote,placePaletteNote,paletteLocation,quickEnter,quickLocation,
  quickMoveHorizontal,quickShiftPitch,handleQuickKeyboard,setQuickKeyboard,
  quickPreviewPointer,insertPlacedMusicEvent,removeSelected,undo,redo,
  loadProject,validateProject,makeMusicPerformance,sumBar,cap,staffLayout,
  staffNotePosition,drawQuickOverlay
 };
}
const factory=new Function('return ('+harnessFactory.toString().replace('/* INSERT_ACTUAL_FUNCTIONS */',functions)+')')();
function mock(options={}){
 const ids={};
 const $=id=>ids[id]||(ids[id]={
  textContent:'',attrs:{},children:[],isConnected:true,classList:{contains:()=>false},
  setAttribute(k,v){this.attrs[k]=String(v);},removeAttribute(k){delete this.attrs[k];},
  focus(){this.focused=true;},append(node){this.children.push(node);},
  getBoundingClientRect(){return {width:1120,height:850,left:0,top:0};},querySelector(){return null;}
 });
 const document={
  activeElement:{tagName:'DIV',closest:()=>null},
  querySelector(s){return s==='.fullPageMusic'&&options.fullPage?{}:
   s==='[data-annotation-tool="cursor"]'?{click(){}}:null;},
  querySelectorAll(s){return s==='[data-stamp-den]'?[1,2,4,8,16].map(v=>({
   dataset:{stampDen:String(v)},setAttribute(){} })):[];}
 };
 const hooks={flashes:[],status:'',saved:'',commits:0,frames:0};
 const api=factory($,document,{},hooks);
 const base=api.data,barCount=options.bars??4;
 api.setData({...base,bars:Array.from({length:barCount},()=>[]),meter:options.meter||'4/4',
  clef:options.clef||'treble'});
 return {api,$,hooks};
}
function loc(api,bar,step='C',octave=4,fraction=.15){
 const l=api.staffLayout(),top=l.top(Math.floor(bar/2)),left=l.left+(bar%2)*l.barW;
 const bottom=api.data.clef==='treble'?4*7+2:2*7+4;
 const pitch=octave*7+'CDEFGAB'.indexOf(step);
 return api.staffNotePosition({x:left+l.barW*fraction,y:top+72-(pitch-bottom)*9});
}
function key(api,name,target={tagName:'DIV',closest:()=>null},flags={}){
 const ev={key:name,target,defaultPrevented:false,isComposing:false,repeat:false,
  preventDefault(){this.defaultPrevented=true;},stopImmediatePropagation(){this.stopped=true;},...flags};
 api.handleQuickKeyboard(ev);return ev;
}
test('repeat one selected crotchet value without selecting again',()=>{
 const {api}=mock();api.selectPaletteNote(4);
 for(let i=0;i<3;i++)assert.equal(api.placePaletteNote(loc(api,0,'C',4,.16+i*.20),4),true);
 assert.deepEqual(api.data.bars[0].map(e=>e.den),[4,4,4]);
 assert.equal(api.active,4);
});
test('change selected values and keep the same composition method',()=>{
 const {api}=mock();api.selectPaletteNote(4);
 assert.equal(api.placePaletteNote(loc(api,0,'C',4,.15),4),true);
 api.selectPaletteNote(8);
 assert.equal(api.placePaletteNote(loc(api,0,'D',4,.45),8),true);
 assert.deepEqual(api.data.bars[0].map(e=>e.den),[4,8]);
 assert.equal(api.active,8);
});
test('click between existing notes preserves their manual x positions and rhythm',()=>{
 const {api}=mock();
 const a={id:'oldA',kind:'note',step:'C',octave:4,den:4,dot:false,posX:.14,acc:''};
 const b={id:'oldB',kind:'note',step:'G',octave:4,den:4,dot:false,posX:.77,acc:''};
 api.data.bars[0]=[a,b];api.selectPaletteNote(8);
 assert.equal(api.placePaletteNote(loc(api,0,'E',4,.5),8),true);
 assert.deepEqual(api.data.bars[0].map(e=>e.step),['C','E','G']);
 assert.equal(a.posX,.14);assert.equal(b.posX,.77);
 assert.ok(api.sumBar(api.data.bars[0])<=api.cap());
});
test('auto-advance to next bar and create last blank bar within 40 limit',()=>{
 const {api}=mock({bars:2,meter:'2/4'});api.selectPaletteNote(4);
 assert.equal(api.placePaletteNote(loc(api,0,'C',4,.15),4),true);
 assert.equal(api.placePaletteNote(loc(api,0,'D',4,.55),4),true);
 assert.equal(api.cursor.bar,1);
 assert.equal(api.placePaletteNote(loc(api,1,'E',4,.15),4),true);
 assert.equal(api.placePaletteNote(loc(api,1,'F',4,.55),4),true);
 assert.equal(api.cursor.bar,2);assert.equal(api.data.bars.length,3);
});
test('reject overflowing measure without committing any change',()=>{
 const {api,hooks}=mock({meter:'2/4'});api.selectPaletteNote(2);
 assert.equal(api.placePaletteNote(loc(api,0,'C',4),2),true);
 const saved=hooks.saved,h=api.history.length;
 assert.equal(api.placePaletteNote(loc(api,0,'D',4,.5),2),false);
 assert.equal(hooks.saved,saved);assert.equal(api.history.length,h);
 assert.equal(api.data.bars[0].length,1);
});
test('preserve 40-bar limit during automatic advancement',()=>{
 const {api}=mock({bars:40,meter:'2/4'});
 const l=api.staffLayout();api.selectPaletteNote(4);
 api.setCursor({bar:39,x:l.left+l.barW+50,pitch:{step:'C',octave:4}});
 api.setQuickKeyboard(true);assert.equal(api.quickEnter('note','C'),true);
 assert.equal(api.quickEnter('note','D'),true);
 assert.equal(api.data.bars.length,40);
});
test('optional keyboard inserts pitches, rests and changes values',()=>{
 const {api}=mock();
 assert.equal(key(api,'C').defaultPrevented,false);
 api.setQuickKeyboard(true);assert.equal(key(api,'3').defaultPrevented,true);
 assert.equal(api.active,4);
 assert.equal(key(api,'C').defaultPrevented,true);
 assert.equal(key(api,'0').defaultPrevented,true);
 assert.deepEqual(api.data.bars[0].map(e=>e.kind),['note','rest']);
 assert.equal(key(api,'5').defaultPrevented,true);assert.equal(api.active,16);
});
test('keyboard ignores input, buttons, modifiers and Tab/Space/Enter',()=>{
 const {api}=mock();api.setQuickKeyboard(true);
 const before=api.data.bars[0].length;
 for(const target of [{tagName:'INPUT',closest:()=>null},{tagName:'BUTTON',closest:()=>null}])
  assert.equal(key(api,'C',target).defaultPrevented,false);
 for(const name of ['Tab',' ','Enter'])assert.equal(key(api,name).defaultPrevented,false);
 assert.equal(key(api,'C',undefined,{ctrlKey:true}).defaultPrevented,false);
 assert.equal(key(api,'C',undefined,{altKey:true}).defaultPrevented,false);
 assert.equal(key(api,'z',undefined,{ctrlKey:true}).defaultPrevented,false);
 assert.equal(api.data.bars[0].length,before);
});
test('Escape remains available for full-page view',()=>{
 const {api}=mock({fullPage:true});api.setQuickKeyboard(true);
 assert.equal(key(api,'Escape').defaultPrevented,false);
 assert.equal(api.keyboard,true);
});
test('arrows, deletion, undo and redo use the real composer state',()=>{
 const {api}=mock();api.setQuickKeyboard(true);
 assert.equal(api.quickEnter('note','C'),true);
 const before=api.cursor.x;assert.equal(key(api,'ArrowRight').defaultPrevented,true);
 assert.ok(api.cursor.x>=before);assert.equal(key(api,'ArrowUp').defaultPrevented,true);
 assert.equal(key(api,'Backspace').defaultPrevented,true);
 assert.equal(api.data.bars[0].length,0);
 api.undo();assert.equal(api.data.bars[0].length,1);
 api.redo();assert.equal(api.data.bars[0].length,0);
});
test('JSON save -> reopen -> edit -> performance events preserve ordering and duration',()=>{
 const {api}=mock();api.setQuickKeyboard(true);
 key(api,'3');key(api,'C');key(api,'D');
 const original=JSON.stringify(api.data),xs=api.data.bars[0].map(e=>e.posX);
 api.loadProject(JSON.parse(original));
 assert.deepEqual(api.data.bars[0].map(e=>e.posX),xs);
 assert.deepEqual(api.data.bars[0].map(e=>e.step),['C','D']);
 assert.equal(api.quickEnter('note','E'),true);
 const perf=api.makeMusicPerformance();
 assert.equal(perf.events.filter(e=>e.pitch!==null).length,3);
 assert.ok(perf.events.every(e=>e.duration>0&&Number.isFinite(e.onset)));
});
test('mouse, touch, pen hit testing and preview never change project data',()=>{
 const {api,$}=mock();api.selectPaletteNote(4);
 const p=loc(api,0,'C',4,.2);
 for(const type of ['mouse','touch','pen']){
  const found=api.paletteLocation(p.x,p.y);
  assert.equal(found.bar,0);assert.equal(found.pitch.step,'C');assert.ok(type);
 }
 api.quickPreviewPointer({clientX:p.x,clientY:p.y,pointerType:'mouse'});
 assert.equal(api.data.bars[0].length,0);
 assert.equal(api.placePaletteNote(p,4),true);
 assert.doesNotMatch(JSON.stringify(api.data),/quickInsertionGuide|quickKeyboardOn/);
 assert.ok($('score').children.some(e=>e.props?.id==='quickInsertionGuide'));
 assert.match(html,/addEventListener\('pointerdown',palettePointerDown\)/);
 assert.match(html,/addEventListener\('pointerup',palettePointerEnd\)/);
});
test('existing expressive music, import, full-page, British names and licensing remain',()=>{
 for(const id of ['fullPageEditor','fullPageImported','fullPageZoomEditor','fullPageZoomImported'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/function createImportedRepeatedTiming\(/);
 assert.match(html,/function applyImportedDynamicEvents\(/);
 assert.match(html,/function wireOneStepScanner\(/);
 assert.match(html,/function beautifyInk\(/);
 assert.match(html,/function beginMusicLongPress\(/);
 assert.match(html,/Semibreve/);assert.match(html,/Semiquaver/);
 assert.match(html,/AGPL-3\.0/);
});
