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
  '\nreturn {ticks,meterCap,barSum,pitchAt,yAt,locationForBar,timeX,performance,validate,printBar,exportXml,insert,pianoBeamGroups,handLinks,toggleMark,toggleTie,toggleSlur,finishSlur,locate,setPlayingNotes,setSelected:id=>{selected=id},getActive:()=>[...activeNotes],getData:()=>data,getDownloaded:()=>downloaded};'
 )(names,dens,labels,id=>({value:id==='kind'?'note':'',checked:false,textContent:''}),
 {createElementNS:()=>({setAttribute(){}})},'http://www.w3.org/2000/svg','TEST',{},initial);
 return {...result,get downloaded(){return result.getDownloaded()}};
}
const note=(step,octave,den=4,extras={})=>({id:step+octave+Math.random(),kind:'note',step,octave,den,dot:false,acc:'',...extras});
const project=(right,left,meter='4/4')=>({format:'cc-music-score-studio-twohand',version:1,title:'Piano TEST',tempo:120,meter,bars:[{right,left}]});
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
 assert.match(html,/British music terminology/);
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
 assert.match(html,/if\(activeNotes\.has\(e\.id\)\)group\.append\(el\('ellipse'/);
 assert.match(html,/fill:'#ffc64b'/);
 assert.match(html,/function setPlayingNotes\(ids\)/);
 assert.match(html,/setInterval\(\(\)=>\{/);
 assert.match(html,/for\(const e of perf\.events\)\{/);
 assert.match(html,/activeNotes\.clear\(\);render\(\)/);
});
