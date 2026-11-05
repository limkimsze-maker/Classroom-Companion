/* Two-hand piano TEST: pure source-driven checks (not live audio/browser).
 * Run: node --test music-score-studio/tests/two-hand-piano.test.cjs */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','two-hand-test.html'),'utf8');
const app=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
function extract(start,end){
 const a=app.indexOf(start),b=app.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Cannot locate '+start);return app.slice(a,b);
}
function setup(initial){
 let downloaded=null;
 const names=['C','D','E','F','G','A','B'],dens=[1,2,4,8,16];
 const labels={1:'Semibreve',2:'Minim',4:'Crotchet',8:'Quaver',16:'Semiquaver'};
 const code=extract('const ticks=','function bind(');
 const result=new Function('STEPS','DENS','NAMES','$','document','NS','KEY','localStorage','initial',
  code+'\ndata=initial;download=(s,n,t)=>{downloaded={s,n,t}};render=()=>{};'+
  '\nreturn {ticks,meterCap,barSum,pitchAt,yAt,locationForBar,timeX,performance,validate,printBar,exportXml,insert,annotationAnchor,annotationXY,annotationHit,annotationPointerDown,annotationPointerMove,annotationPointerEnd,annotationPointerCancel,deleteAnnotation,resizeAnnotation,undo,redo,adjustPitch,pitchPointerDown,pitchPointerMove,pitchPointerEnd,clickSheet,pickContextValue,setContextTarget:v=>{contextTarget=v},pianoBeamGroups,handLinks,toggleMark,toggleTie,toggleSlur,finishSlur,locate,setPlayingNotes,setSelected:id=>{selected=id},setPointerY:y=>{point=()=>({x:200,y})},setPoint:p=>{point=()=>p},setAnnotationToolDirect:tool=>{annotationTool=tool},setSelectedAnnotation:id=>{selectedAnnotation=id},getActive:()=>[...activeNotes],getData:()=>data,getDownloaded:()=>downloaded};'
 )(names,dens,labels,id=>({value:id==='kind'?'note':'',checked:false,textContent:'',hidden:id==='noteContext',
  setPointerCapture(){},releasePointerCapture(){}}),
 {createElementNS:()=>({setAttribute(){}})},'http://www.w3.org/2000/svg','TEST',{},initial);
 return {...result,get downloaded(){return result.getDownloaded()}};
}
const note=(step,octave,den=4,extras={})=>({id:step+octave+Math.random(),kind:'note',step,octave,den,dot:false,acc:'',...extras});
const project=(right,left,meter='4/4')=>({format:'cc-music-score-studio-twohand',version:1,title:'Piano TEST',tempo:120,meter,bars:[{right,left}],annotations:[]});
test('right and left notes on equal beats have precisely equal onset times',()=>{
 const rh=[note('C',5,4),note('D',5,4)],lh=[note('C',3,2)];
 const p=setup(project(rh,lh)),r=p.performance();
 assert.equal(r.events.length,3);
 assert.equal(r.events.filter(x=>x.at===0).length,2);
 assert.equal(r.events.find(x=>x.hand==='right'&&x.index===1).at,.5);
 assert.equal(r.events.find(x=>x.hand==='left').length,1);
});
test('different hands independently reject overfilled bars',()=>{
 const p=setup(project([],[]));
 assert.equal(p.meterCap(),96);
 assert.equal(p.barSum([note('C',3,1)]),96);
 assert.equal(p.barSum([note('G',3,2),note('G',3,2)]),96);
 assert.equal(p.barSum([note('G',3,2),note('G',3,2),note('G',3,4)]),120);
});
test('correct bass and treble pitch on five-line staves',()=>{
 const p=setup(project([],[]));
 assert.deepEqual(p.pitchAt(110+72,110,'right'),{step:'E',octave:4});
 assert.deepEqual(p.pitchAt(110+123+72,110+123,'left'),{step:'G',octave:2});
 assert.equal(p.yAt({step:'G',octave:2},233,'left'),305);
});
test('six-eight supports two dotted-crotchet beats and independent parts',()=>{
 const rh=[note('C',5,4,{dot:true}),note('D',5,4,{dot:true})];
 const lh=[note('C',3,2),note('G',2,4)];
 const p=setup(project(rh,lh,'6/8')),r=p.performance();
 assert.equal(p.meterCap(),72);
 assert.equal(p.barSum(rh),72);assert.equal(p.barSum(lh),72);
 assert.equal(r.events.find(x=>x.hand==='right'&&x.index===1).at,.75);
});
test('JSON validator keeps 40 bars and rejects 41 and invalid pitches',()=>{
 const p=setup(project([],[]));
 const forty={...project([],[]),bars:Array.from({length:40},()=>({right:[],left:[]}))};
 assert.equal(p.validate(forty).bars.length,40);
 assert.throws(()=>p.validate({...forty,bars:[...forty.bars,{right:[],left:[]}]}),/maximum 40 bars/);
 assert.throws(()=>p.validate(project([note('Q',9)],[])),/Invalid pitch/);
});
test('MusicXML creates independent treble and bass parts with matching bar duration',()=>{
 const p=setup(project([note('E',5,4)],[note('C',3,2)]));
 p.exportXml();
 const xml=p.downloaded.s;
 assert.match(xml,/<part id="P1">/);assert.match(xml,/<part id="P2">/);
 assert.match(xml,/<sign>G<\/sign><line>2<\/line>/);
 assert.match(xml,/<sign>F<\/sign><line>4<\/line>/);
 assert.match(xml,/<duration>24<\/duration>/);
 assert.match(xml,/<duration>48<\/duration>/);
 assert.match(xml,/<score-partwise version="4.0">/);
});
test('full page, minimisation, zoom and keyboard safety controls exist',()=>{
 assert.match(html,/id="full"/);assert.match(html,/id="zoom"/);
 assert.match(html,/e\.key==='Escape'/);assert.match(html,/active\?\.closest\('button,a,summary'\)/);
 assert.match(html,/min-width:780px/);
});
test('single-stave composition source is linked but not replaced',()=>{
 assert.match(html,/href="\.\/index\.html"/);
 assert.match(html,/British note values/);
});

test('automatic quaver grouping follows 4/4 crotchet beats and 6/8 dotted-crotchet beats',()=>{
 const quavers=Array.from({length:8},()=>note('C',5,8));
 const four=setup(project(quavers,[],'4/4'));
 assert.deepEqual(four.pianoBeamGroups(quavers),[[0,1],[2,3],[4,5],[6,7]]);
 const six=setup(project(quavers.slice(0,6),[],'6/8'));
 assert.deepEqual(six.pianoBeamGroups(quavers.slice(0,6)),[[0,1,2],[3,4,5]]);
 const interrupted=[note('C',5,8),{id:'rest',kind:'rest',den:8,dot:false},...quavers.slice(0,4)];
 assert.deepEqual(six.pianoBeamGroups(interrupted),[[3,4,5]]);
});

test('piano has a user-adjustable classroom volume with a safe output limiter',()=>{
 assert.match(html,/id="volume" type="range" min="0" max="100" value="75"/);
 assert.match(html,/const amp=\(hand==='left'\?\.18:\.15\)\*Math\.min/);
 assert.match(html,/function ensureMaster\(\)/);
 assert.match(html,/ctx\.createDynamicsCompressor\(\)/);
 assert.match(html,/masterGain\.connect\(limiter\);limiter\.connect\(ctx\.destination\)/);
 assert.match(html,/gain\.connect\(ensureMaster\(\)\)/);
 assert.match(html,/hGain\.connect\(ensureMaster\(\)\)/);
});
test('volume change is bounded and can mute playback without altering score data',()=>{
 const segment=extract('function setVolume(','function oscillator(');
 const ui={volume:{value:'75'},volumeValue:{textContent:'75%'}};
 const f=new Function('$','masterGain','ctx','volume',segment+
  '\nreturn v=>{setVolume(v);return {volume,slider:$(\'volume\').value,label:$(\'volumeValue\').textContent}};')(
  id=>ui[id],null,null,75);
 assert.deepEqual(f(0),{volume:0,slider:'0',label:'0%'});
 assert.deepEqual(f(110),{volume:100,slider:'100',label:'100%'});
 assert.deepEqual(f(55),{volume:55,slider:'55',label:'55%'});
});

test('staccato changes note duration but preserves beat timing, in either hand',()=>{
 const right=note('E',5,4,{staccato:true}),left=note('C',3,4);
 const p=setup(project([right],[left])),perf=p.performance();
 const short=perf.events.find(e=>e.hand==='right'),normal=perf.events.find(e=>e.hand==='left');
 assert.equal(short.at,normal.at);
 assert.ok(short.duration<normal.duration);
 assert.equal(short.length,normal.length);
});
test('accents raise playback strength while tenuto and portato affect duration',()=>{
 const base=setup(project([note('E',5,4),note('E',5,4,{accent:true}),note('E',5,4,{portato:true})],[note('C',3,4,{tenuto:true})]));
 const perf=base.performance(),rh=perf.events.filter(e=>e.hand==='right'),lh=perf.events.find(e=>e.hand==='left');
 assert.ok(rh[1].gain>rh[0].gain);
 assert.ok(rh[2].duration<rh[0].duration);
 assert.ok(lh.duration>rh[0].duration);
});
test('slurs can start from either endpoint and never cross piano hands',()=>{
 const a=note('C',5),b=note('D',5),c=note('C',3);
 const p=setup(project([a,b],[c]));
 p.setSelected(b.id);p.toggleSlur();
 assert.equal(p.finishSlur(c.id),true);
 assert.equal(p.getData().bars[0].right[0].slurTo,undefined);
 assert.equal(p.finishSlur(a.id),true);
 assert.equal(p.getData().bars[0].right[0].slurTo,b.id);
 assert.equal(p.handLinks('right').slurs.length,1);
 assert.equal(p.handLinks('left').slurs.length,0);
});
test('same-pitch ties sustain one voice, and playback tracks each notated endpoint',()=>{
 const a=note('C',5),b=note('C',5),left=note('G',2,2);
 const p=setup(project([a,b],[left]));
 p.setSelected(a.id);p.toggleTie();
 const perf=p.performance(),rh=perf.events.find(x=>x.hand==='right');
 assert.equal(perf.events.filter(x=>x.hand==='right').length,1);
 assert.equal(rh.ids.length,2);
 assert.equal(rh.segments[0].id,a.id);
 assert.equal(rh.segments[1].id,b.id);
 assert.ok(rh.duration>.9);
 assert.equal(perf.events.filter(x=>x.hand==='left').length,1);
});
test('two-hand MusicXML exports independent articulations, fermatas, slurs and ties',()=>{
 const a=note('C',5,4,{staccato:true,accent:true}),b=note('D',5,4),
       x=note('G',2,4),y=note('G',2,4,{fermata:true});
 a.slurTo=b.id;x.tieTo=y.id;
 const p=setup(project([a,b],[x,y]));
 p.exportXml();const xml=p.downloaded.s;
 assert.match(xml,/<staccato\/>/);assert.match(xml,/<accent\/>/);
 assert.match(xml,/<fermata type="upright"\/>/);
 assert.match(xml,/<slur number="1" type="start"\/>/);
 assert.match(xml,/<slur number="1" type="stop"\/>/);
 assert.match(xml,/<tie type="start"\/>/);
 assert.match(xml,/<tie type="stop"\/>/);
 assert.match(xml,/<tied type="start"\/>/);
});
test('saved two-hand JSON retains note expression marks and stable links',()=>{
 const a=note('C',5,4,{staccato:true,accent:true}),b=note('D',5,4);
 a.id='evtA';b.id='evtB';a.slurTo=b.id;
 const p=setup(project([a,b],[])),reopened=p.validate(JSON.parse(JSON.stringify(p.getData())));
 assert.equal(reopened.bars[0].right[0].id,'evtA');
 assert.equal(reopened.bars[0].right[0].slurTo,'evtB');
 assert.equal(reopened.bars[0].right[0].staccato,true);
 assert.equal(reopened.bars[0].right[0].accent,true);
});
test('score highlights active noteheads in gold and clears them on Stop',()=>{
 assert.match(html,/class:'playHalo'/);
 assert.match(html,/\.isPlaying \.playHalo\{opacity:1\}/);
 assert.match(html,/function setPlayingNotes\(ids\)/);
 assert.match(html,/setInterval\(\(\)=>\{/);
 assert.match(html,/for\(const e of perf\.events\)\{/);
 assert.match(html,/setPlayingNotes\(new Set\(\)\)/);
});
test('both hands can be highlighted together and all highlights can be cleared',()=>{
 const rh=note('C',5,4),lh=note('G',2,4),p=setup(project([rh],[lh]));
 p.setPlayingNotes(new Set([rh.id,lh.id]));
 assert.deepEqual(p.getActive().sort(),[rh.id,lh.id].sort());
 p.setPlayingNotes(new Set());
 assert.deepEqual(p.getActive(),[]);
});
test('playback follows sounding notes through later music systems',()=>{
 assert.match(html,/const line=Math\.floor\(first\.b\/4\)/);
 assert.match(html,/viewport\.scrollTop=Math\.max\(0,top\)/);
});
test('expression controls remain visible above the scrolling piano sheet',()=>{
 const edit=html.indexOf('id="editPanel"'),sheet=html.indexOf('id="sheetViewport"');
 assert.ok(edit>=0&&sheet>edit);
 assert.match(html,/id="articulations"/);
});

test('playback highlights update existing note symbols instead of redrawing the score',()=>{
 const body=extract('function setPlayingNotes(ids){','async function play(){');
 assert.match(body,/querySelectorAll\?\.\('g\[data-id\]'\)/);
 assert.match(body,/classList\.toggle\('isPlaying'/);
 assert.ok(!body.includes('render()'),'Playback highlight must not recreate the score SVG');
});

test('two-hand score registers a real right-click note menu with standard British values',()=>{
 assert.match(html,/\$\('sheet'\)\.addEventListener\('contextmenu',openNoteContext\)/);
 assert.match(html,/id="noteContext"[^>]+role="dialog"/);
 assert.match(html,/for\(const den of DENS\)\{\s*const button=document\.createElement\('button'\)/);
 assert.match(html,/button\.textContent=GLYPHS\[den\]\+' '\+NAMES\[den\]/);
});
test('right-click choice inserts a crotchet note on treble or bass without changing the other hand',()=>{
 const p=setup(project([],[]));
 p.setContextTarget({type:'insert',b:0,hand:'right',x:170,y:110+72});
 p.pickContextValue(4);
 assert.equal(p.getData().bars[0].right.length,1);
 assert.equal(p.getData().bars[0].left.length,0);
 assert.equal(p.getData().bars[0].right[0].step,'E');
 p.setContextTarget({type:'insert',b:0,hand:'left',x:170,y:110+123+72});
 p.pickContextValue(2);
 assert.equal(p.getData().bars[0].left.length,1);
 assert.equal(p.getData().bars[0].left[0].step,'G');
 assert.equal(p.getData().bars[0].left[0].den,2);
});
test('right-clicking existing notes changes duration but respects the bar capacity',()=>{
 const a=note('C',5,4),b=note('D',5,4);
 const p=setup(project([a,b],[]));
 p.setContextTarget({type:'edit',id:a.id});p.pickContextValue(2);
 assert.equal(p.getData().bars[0].right[0].den,2);
 p.setContextTarget({type:'edit',id:a.id});p.pickContextValue(1);
 assert.equal(p.getData().bars[0].right[0].den,2);
});
test('right-click menu can be dismissed and does not override normal note selection',()=>{
 assert.match(html,/function closeNoteContext\(\)/);
 assert.match(html,/if\(e\.key==='Escape'&&!\$\('noteContext'\)\.hidden\)/);
 assert.match(html,/if\(id\)\{if\(finishSlur\(id\)\)return;selected=id;render\(\);return\}/);
 assert.match(html,/menu\.querySelector\('button'\)\?\.focus\(\)/);
});

test('Higher and Lower buttons follow single-stave British editing conventions',()=>{
 assert.match(html,/for\(const \[label,direction\] of \[\['↑ Higher',1\],\['↓ Lower',-1\]\]\)/);
 const rh=note('C',5),lh=note('G',2),p=setup(project([rh],[lh]));
 p.setSelected(rh.id);
 assert.equal(p.adjustPitch(1),true);
 assert.equal(p.getData().bars[0].right[0].step,'D');
 assert.equal(p.getData().bars[0].right[0].octave,5);
 assert.equal(p.getData().bars[0].left[0].step,'G');
 p.setSelected(lh.id);
 assert.equal(p.adjustPitch(-1),true);
 assert.equal(p.getData().bars[0].left[0].step,'F');
 assert.equal(p.getData().bars[0].left[0].octave,2);
 assert.equal(p.getData().bars[0].right[0].step,'D');
});
test('pitch changes preserve duration, hand, bar and expression markings',()=>{
 const original=note('B',4,8,{dot:true,accent:true,staccato:true,acc:'#'});
 const p=setup(project([original],[]));p.setSelected(original.id);
 p.adjustPitch(1);const moved=p.getData().bars[0].right[0];
 assert.equal(moved.step,'C');assert.equal(moved.octave,5);
 assert.equal(moved.den,8);assert.equal(moved.dot,true);
 assert.equal(moved.accent,true);assert.equal(moved.staccato,true);
 assert.equal(moved.acc,'#');assert.equal(p.getData().bars[0].left.length,0);
 assert.equal(moved.id,original.id);
});
test('pointer drag uses snapped stave steps, stable SVG pointer capture and one Undo change',()=>{
 assert.match(html,/setPointerCapture\?\.\(ev\.pointerId\)/);
 assert.match(html,/Math\.round\(delta\/9\)/);
 assert.match(html,/if\(!drag\.changed\)\{snapshot\(\);drag\.changed=true\}/);
 assert.match(html,/pointercancel',pitchPointerEnd/);
 assert.match(html,/if\(suppressDragClick\)\{suppressDragClick=false;return\}/);
 const a=note('A',4);const p=setup(project([a],[]));
 p.setSelected(a.id);
 p.adjustPitch(1);p.adjustPitch(-1);
 assert.equal(p.getData().bars[0].right[0].step,'A');
});
test('notes at the supported pitch boundary cannot be moved beyond range',()=>{
 const lo=note('D',1),hi=note('B',6);const p=setup(project([lo,hi],[]));
 p.setSelected(lo.id);assert.equal(p.adjustPitch(-1),false);
 p.setSelected(hi.id);assert.equal(p.adjustPitch(1),false);
});

test('vertical pointer drag actually moves a right-hand note by two stave steps',()=>{
 const e=note('E',5,4,{staccato:true}),left=note('G',2,2),p=setup(project([e],[left]));
 const event={button:0,pointerId:7,target:{closest:selector=>selector==='[data-id]'?{dataset:{id:e.id}}:null}};
 p.setPointerY(100);p.pitchPointerDown(event);
 p.setPointerY(82);p.pitchPointerMove({...event,pointerId:7});
 p.pitchPointerEnd({...event,pointerId:7});
 const after=p.getData().bars[0];
 assert.equal(after.right[0].step,'G');
 assert.equal(after.right[0].octave,5);
 assert.equal(after.right[0].den,4);
 assert.equal(after.right[0].staccato,true);
 assert.equal(after.left[0].step,'G');
 assert.equal(after.right.length,1);
});
test('horizontal-only drag and wrong-pointer movement do not change notes',()=>{
 const e=note('E',5),p=setup(project([e],[]));
 const ev={button:0,pointerId:2,target:{closest:()=>({dataset:{id:e.id}})}};
 p.setPointerY(100);p.pitchPointerDown(ev);
 p.setPointerY(60);p.pitchPointerMove({...ev,pointerId:99});
 p.setPointerY(100);p.pitchPointerMove(ev);
 p.pitchPointerEnd(ev);
 assert.equal(p.getData().bars[0].right[0].step,'E');
});

test('simple score-first interface shows Compose, Listen and Music sheet in order',()=>{
 const compose=html.indexOf('aria-label="Compose notes"'),listen=html.indexOf('LISTEN &amp; LEARN'),sheet=html.indexOf('Your music sheet');
 assert.ok(compose>=0&&listen>compose&&sheet>listen);
 assert.match(html,/id="composeHint"/);
 assert.match(html,/Right-click for values/);
});
test('secondary tools remain available inside one clearly named disclosure',()=>{
 assert.match(html,/<details class="moreTools" id="moreTools">/);
 assert.match(html,/<summary aria-label="Save, open, export and more score tools">/);
 for(const id of ['save','open','openFile','musicxml','print','removeBar'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.ok(html.indexOf('id="moreTools"')<html.indexOf('id="musicxml"'));
});
test('selected note exposes explicitly labelled Pitch and Expression controls',()=>{
 assert.match(html,/heading\('Pitch'\)/);
 assert.match(html,/heading\('Expression · click to add or remove'\)/);
 assert.match(html,/id="editPanel" hidden/);
 assert.match(html,/Edit selected note/);
});
test('full page and fit, play and stop, accessible buttons are preserved',()=>{
 assert.match(html,/id="zoom"/);assert.match(html,/id="full"/);
 assert.match(html,/id="play"/);assert.match(html,/id="stop" disabled/);
 assert.match(html,/\.moreTools>summary:focus-visible/);
 assert.match(html,/active\?\.closest\('button,a,summary'\)/);
});

test('two-hand score has its own discoverable Play/Stop button beside zoom/full page',()=>{
 const header=html.match(/<div class="scorehead">([\s\S]*?)<\/div><\/div>/)?.[0]||'';
 assert.match(header,/id="sheetPlay"/);
 assert.match(header,/id="zoom"/);
 assert.match(header,/id="full"/);
 assert.match(header,/▶ Play/);
});
test('score Play button and transport share exactly the same playback state',()=>{
 assert.match(html,/function syncPlayButtons\(\)/);
 assert.match(html,/\$\('sheetPlay'\)\.textContent=playing\?'■ Stop':'▶ Play'/);
 assert.match(html,/\$\('sheetPlay'\)\.setAttribute\('aria-pressed',String\(playing\)\)/);
 assert.match(html,/\$\('sheetPlay'\)\.onclick=\(\)=>playing\?stop\(\):play\(\)/);
 assert.match(html,/function stop\(\)\{[\s\S]*?syncPlayButtons\(\);info\('Stopped\.'\)/);
 assert.match(html,/async function play\(\)\{\s*if\(playing\)return/);
});
test('play state is synchronized from both play and stop transitions',()=>{
 const sync=extract('function syncPlayButtons(){','async function play(){');
 let state=false;
 const elems={play:{disabled:null},stop:{disabled:null},sheetPlay:{
   textContent:'',attrs:{},classes:{},setAttribute(k,v){this.attrs[k]=v},classList:{toggle(k,v){this.owner.classes[k]=v}}}};
 elems.sheetPlay.classList.owner=elems.sheetPlay;
 const make=new Function('$','state',sync+'\nreturn value=>{playing=value;syncPlayButtons();return {play:$(\'play\').disabled,stop:$(\'stop\').disabled,label:$(\'sheetPlay\').textContent,pressed:$(\'sheetPlay\').attrs[\'aria-pressed\']}}');
 const update=make(id=>elems[id],state);
 assert.deepEqual(update(false),{play:false,stop:true,label:'▶ Play',pressed:'false'});
 assert.deepEqual(update(true),{play:true,stop:false,label:'■ Stop',pressed:'true'});
});

test('two-hand page visually reuses the approved single-stave header and paper-card pattern',()=>{
 assert.match(html,/linear-gradient\(115deg,#103449,#17516a\)/);
 assert.match(html,/class="studioHeader"/);
 assert.match(html,/class="brandLogo"/);
 assert.match(html,/class="studioShell"/);
 assert.match(html,/grid-template-columns:292px minmax\(0,1fr\)/);
 assert.match(html,/linear-gradient\(90deg,#f9fcfc,#edf6f6\)/);
 assert.match(html,/class="panel scorePanel" id="paper"/);
 assert.match(html,/class="paperScroll"/);
});
test('composer controls precede score settings and score is the main work region',()=>{
 const sidebar=html.indexOf('<aside class="studioSidebar"'),compose=html.indexOf('aria-label="Compose notes"',sidebar),
 setup=html.indexOf('class="panel setupPanel"'),work=html.indexOf('class="studioWork"'),
 score=html.indexOf('class="panel scorePanel"');
 assert.ok(sidebar>=0&&compose>sidebar&&setup>compose&&work>setup&&score>work);
 assert.match(html,/<main class="studioShell">/);
 assert.match(html,/<aside class="studioSidebar" aria-label="Composition tools">/);
});
test('full-page score sheet remains internally scrollable and offers minimisation',()=>{
 assert.match(html,/\.fullpage>#sheetViewport\{flex:1 1 auto!important/);
 assert.match(html,/\.fullpage #sheet\.zoomed\{min-width:880px;width:135%\}/);
 assert.match(html,/\.fullpage>#editPanel\{flex:0 0 auto/);
 assert.match(html,/id="full"/);
 assert.match(html,/id="sheetPlay"/);
 assert.match(html,/id="zoom"/);
});
test('small phone layouts keep the score and annotation controls usable',()=>{
 assert.match(html,/@media\(max-width:650px\)\{/);
 assert.match(html,/\.studioShell\{padding:8px;gap:8px\}/);
 assert.match(html,/\.scorehead \.controls button\{font-size:12px;padding:7px 9px\}/);
 assert.match(html,/\.fullpage #editPanel\{max-height:23dvh\}/);
});

test('two-hand annotations provide all eight teacher tools with a clear cursor mode',()=>{
 for(const tool of ['cursor','select','hand','arrow','pen','highlighter','circle','eraser'])
  assert.match(html,new RegExp('data-annotation-tool="'+tool+'"'));
 assert.match(html,/id="teacherAnnotations"/);
 assert.match(html,/id="annotationColour"/);
 assert.match(html,/id="annotationLarger"/);
 assert.match(html,/id="annotationSmaller"/);
 assert.match(html,/id="annotationDelete"/);
 assert.match(html,/class="annotationGuide"/);
});
test('bar-based anchors follow score reflow when a note moves to another staff system',()=>{
 const base=project([],[]),p=setup({...base,bars:Array.from({length:5},()=>({right:[],left:[]}))});
 const location=p.locationForBar(4);
 const q={x:location.left+30,y:location.top+120};
 const anchor=p.annotationAnchor(q);assert.equal(anchor.bar,4);
 assert.deepEqual(p.annotationXY(anchor),q);
 const first=p.annotationAnchor({x:location.left+20,y:location.top+18});
 assert.equal(first.bar,4);
});
test('annotation JSON roundtrip validates and preserves colours, points, and tools',()=>{
 const input=project([note('C',5)],[note('G',2)]);
 input.annotations=[{id:'ink1',tool:'highlighter',color:'#127f9b',points:[{bar:0,dx:35,dy:20},{bar:0,dx:85,dy:68}]}];
 const p=setup(input),restored=p.validate(JSON.parse(JSON.stringify(input)));
 assert.equal(restored.annotations.length,1);
 assert.equal(restored.annotations[0].tool,'highlighter');
 assert.equal(restored.annotations[0].color,'#127f9b');
 assert.deepEqual(restored.annotations[0].points,input.annotations[0].points);
 assert.equal(restored.bars[0].right[0].step,'C');
 const old={...input};delete old.annotations;
 assert.deepEqual(p.validate(old).annotations,[]);
});
test('annotation JSON rejects dangerous geometry and unknown drawing tools',()=>{
 const input=project([],[]);
 input.annotations=[
 {tool:'script',color:'#000000',points:[{bar:0,dx:1,dy:1}]},
 {tool:'pen',color:'javascript:alert(1)',points:[{bar:500,dx:2,dy:3}]},
 {tool:'circle',color:'#2e9657',points:[{bar:0,dx:40,dy:100},{bar:0,dx:84,dy:125}]}];
 const p=setup(input),validated=p.validate(input);
 assert.equal(validated.annotations.length,1);
 assert.equal(validated.annotations[0].tool,'circle');
});
test('teacher pen draws independently of note editing and uses same Undo history',()=>{
 const input=project([note('C',5)],[note('G',2)]);
 const p=setup(input),ev={button:0,pointerId:9,preventDefault(){},target:{closest:()=>null}};
 p.setAnnotationToolDirect('pen');p.setPoint({x:190,y:125});p.annotationPointerDown(ev);
 p.setPoint({x:218,y:143});p.annotationPointerMove(ev);
 p.annotationPointerEnd(ev);
 assert.equal(input.annotations.length,1);
 assert.equal(input.annotations[0].tool,'pen');
 assert.equal(input.bars[0].right.length,1);
 assert.equal(input.bars[0].left.length,1);
 p.undo();assert.equal(p.getData().annotations.length,0);
 assert.equal(p.getData().bars[0].right.length,1);
 p.redo();assert.equal(p.getData().annotations.length,1);
});
test('arrow and circle can be added to either hand; eraser protects actual notes',()=>{
 const input=project([note('E',5)],[note('G',2)]),p=setup(input);
 const ev={button:0,pointerId:11,preventDefault(){},target:{closest:()=>null}};
 p.setAnnotationToolDirect('circle');p.setPoint({x:190,y:250});p.annotationPointerDown(ev);
 p.setPoint({x:240,y:296});p.annotationPointerMove(ev);p.annotationPointerEnd(ev);
 assert.equal(p.getData().annotations.length,1);
 const hit=p.annotationHit({x:190,y:273});assert.ok(hit);
 p.setAnnotationToolDirect('eraser');p.setPoint({x:190,y:273});p.annotationPointerDown(ev);
 assert.equal(p.getData().annotations.length,0);
 assert.equal(p.getData().bars[0].left.length,1);
 assert.equal(p.getData().bars[0].right.length,1);
});
test('selection move and size changes affect only teacher marks',()=>{
 const input=project([note('C',5)],[note('G',2)]);
 input.annotations=[{id:'testMark',tool:'arrow',color:'#df654d',points:[{bar:0,dx:15,dy:18},{bar:0,dx:95,dy:48}]}];
 const p=setup(input);p.setAnnotationToolDirect('select');
 const ev={button:0,pointerId:2,preventDefault(){},target:{closest:()=>null}};
 const start=p.annotationXY(input.annotations[0].points[0]);
 p.setPoint(start);p.annotationPointerDown(ev);
 p.setPoint({x:start.x+20,y:start.y+15});p.annotationPointerMove(ev);p.annotationPointerEnd(ev);
 assert.ok(p.getData().annotations[0].points[0].dx>15);
 p.setSelectedAnnotation('testMark');p.resizeAnnotation(1.15);
 assert.ok(p.getData().annotations[0].points[0].dx!==input.annotations[0].points[0].dx);
 assert.equal(p.getData().bars[0].right[0].step,'C');
});
test('annotation mode guards musical editing and right-click note insertion',()=>{
 assert.match(html,/function clickSheet\(ev\)\{\s*if\(annotationTool!=='cursor'\)return/);
 assert.match(html,/function pitchPointerDown\(ev\)\{\s*if\(annotationTool!=='cursor'\)return/);
 assert.match(html,/function openNoteContext\(ev\)\{\s*if\(annotationTool!=='cursor'\)/);
 assert.match(html,/function drawAnnotations\(svg\)/);
 assert.match(html,/drawAnnotations\(svg\);/);
});
test('full page annotation tools stay inside score and Escape restores note-edit mode',()=>{
 const toolbar=html.indexOf('id="teacherAnnotations"'),sheet=html.indexOf('id="sheetViewport"');
 assert.ok(toolbar>=0&&sheet>toolbar);
 assert.match(html,/if\(e\.key==='Escape'&&annotationTool!=='cursor'\)/);
 assert.match(html,/if\(\$\('paper'\)\.classList\.contains\('fullpage'\)\)\$\('full'\)\.click\(\)/);
 assert.match(html,/@media print\{\.teacherAnnotations\{display:none!important\}\}/);
});
