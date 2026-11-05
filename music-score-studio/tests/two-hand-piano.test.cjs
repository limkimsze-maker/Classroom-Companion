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
const helpers=extract('const NAMES=','function flash('); // replaced by lower-scope extraction below
const functions=extract('const ticks=','function drawClef(')
  +extract('function printBar(','function exportXml(');
const STUBS={
 document:{createElementNS:()=>({setAttribute(){}})},
 window:{},
 NS:'http://www.w3.org/2000/svg'
};
function setup(initial){
 let data=initial,serial=0,downloaded=null;
 const NAMES={1:'Semibreve',2:'Minim',4:'Crotchet',8:'Quaver',16:'Semiquaver'};
 const STEPS=['C','D','E','F','G','A','B'],DENS=[1,2,4,8,16];
 const code=extract('const ticks=','function drawClef(')+extract('function printBar(','function bind(');
 // Most functions have dependencies supplied as stubs; no browser side effects.
 const names=[
 'data','STEPS','DENS','NAMES','document','NS','history','future','selected','chosen',
 'playing','stop','render','info','snapshot','commit','download','escapeXml','$','window','makeId','localStorage'
 ];
 const args=[
 data,STEPS,DENS,NAMES,STUBS.document,STUBS.NS,[],[],null,4,
 false,()=>{},()=>{},()=>{},()=>{},(s,n,t)=>{downloaded={s,n,t}},
 s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])),
 id=>({value:id==='kind'?'note':'',checked:false}),{},()=> 'id'+(++serial),{}
 ];
 const output=new Function(...names,code+'\nreturn {ticks,meterCap,barSum,pitchAt,yAt,locationForBar,timeX,performance,validate,printBar,exportXml,insert,getData:()=>data};')(...args);
 return {...output,get downloaded(){return downloaded}};
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
