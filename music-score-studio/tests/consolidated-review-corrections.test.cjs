/* Regression checks for PR #70 review corrections. Run with node --test.
 * Synthetic score geometry only: not a browser, stylus, audio or print audition. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','consolidated-test.html'),'utf8');
const extract=(a,b)=>{
 const start=html.indexOf(a),end=html.indexOf(b,start+a.length);
 assert.ok(start>=0&&end>start,'missing '+a);return html.slice(start,end);
};
const funcs=[
 extract('function engravingGap(','function el('),
 extract('function drawMusicConnections(','function drawNote(')
].join('\n');
function run(bars,other={}){
 let data={bars,clef:'treble',meter:'4/4',completeBars:true,strokes:[],barDirectives:[],...other};
 const TICKS=96,NS='http://www.w3.org/2000/svg';
 const ticks=e=>TICKS/e.den*(e.dot?1.5:1),cap=()=>96;
 const sumBar=bar=>bar.reduce((n,e)=>n+ticks(e),0);
 const isTwoBarRest=()=>false,barDirective=()=>({});
 const noteIndex=(s,o)=>o*7+['C','D','E','F','G','A','B'].indexOf(s);
 const bottomIndex=()=>noteIndex('E',4);
 const musicalLinks=()=>({ties:[],slurs:[]});
 const document={createElementNS:(_ns,name)=>({name,attrs:{},setAttribute(k,v){this.attrs[k]=v;}})};
 const f=new Function('data','TICKS','ticks','cap','sumBar','isTwoBarRest',
 'barDirective','noteIndex','bottomIndex','musicalLinks','document','NS',
 funcs+'\nreturn {eventPositions,findInsertIndex,staffLayout,scoreInkBar,reprojectScoreInk,drawMusicConnections};');
 return {api:f(data,TICKS,ticks,cap,sumBar,isTwoBarRest,barDirective,noteIndex,bottomIndex,musicalLinks,document,NS),data};
}
const note=(id,posX,den=4)=>({id,kind:'note',step:'C',octave:4,den,dot:false,acc:'',posX});
test('legacy clustered/far-right x hints never override visible insertion order',()=>{
 const b=[note('C',.8),note('D',.84),note('E',.88),note('F',.92)];
 const {api}=run([b]),cell=api.staffLayout().cells[0];
 const xs=api.eventPositions(b,cell.left,cell.width);
 assert.equal(api.findInsertIndex(0,(xs[0]+xs[1])/2,cell.left,cell.width),1);
 assert.equal(api.findInsertIndex(0,xs[0]-1,cell.left,cell.width),0);
 assert.equal(api.findInsertIndex(0,xs[3]+1,cell.left,cell.width),4);
});
test('leftmost and rightmost old posX hints do not move the insertion boundary',()=>{
 const b=[note('a',.03,8),note('b',.97,8)];
 const {api}=run([b]),cell=api.staffLayout().cells[0],xs=api.eventPositions(b,cell.left,cell.width);
 assert.equal(api.findInsertIndex(0,xs[0]-8,cell.left,cell.width),0);
 assert.equal(api.findInsertIndex(0,(xs[0]+xs[1])/2,cell.left,cell.width),1);
 assert.equal(api.findInsertIndex(0,xs[1]+8,cell.left,cell.width),2);
});
test('save/reopen and adaptive reflow keep horizontal index independent of old hints',()=>{
 const bars=Array.from({length:6},(_,i)=>[note('x'+i,.95)]);
 const loaded=JSON.parse(JSON.stringify(bars));
 const {api,data}=run(loaded);
 const first=api.staffLayout();
 data.bars[0]=Array.from({length:16},(_,i)=>note('dense'+i,.99,16));
 data.bars[1]=Array.from({length:16},(_,i)=>note('dense2'+i,.99,16));
 const reflow=api.staffLayout(),b=1,c=reflow.cells[b];
 assert.notEqual(reflow.cells[b].top,first.cells[b].top);
 const xs=api.eventPositions(data.bars[b],c.left,c.width);
 assert.equal(api.findInsertIndex(b,xs[0]-10,c.left,c.width),0);
 assert.equal(api.findInsertIndex(b,xs[0]+10,c.left,c.width),1);
});
test('ink follows its bar after system break and remains attached after JSON round trip',()=>{
 const bars=[[],[],[],[],[]],{api,data}=run(bars);
 const before=api.staffLayout(),target=before.cells[2];
 const ink={kind:'music',points:[[target.left+20,target.top+20],[target.left+35,target.top+35]],headX:target.left+20,headY:target.top+20};
 data.strokes=[ink];
 bars[0]=Array.from({length:16},(_,i)=>note('n'+i,.5,16));
 bars[1]=Array.from({length:16},(_,i)=>note('m'+i,.5,16));
 const after=api.staffLayout();
 assert.notEqual(before.cells[2].top,after.cells[2].top);
 api.reprojectScoreInk(data.strokes,before,after);
 assert.equal(Math.round(ink.points[0][1]-after.cells[2].top),20);
 assert.equal(Math.round(ink.headY-after.cells[2].top),20);
 const saved=JSON.parse(JSON.stringify(data.strokes));
 assert.deepEqual(saved,data.strokes);
});
test('cross-system connections use passed printed layout, not editable breaks',()=>{
 const {api}=run([[note('a',.1)],[note('b',.2)]]);
 const paths=[];const svg={append(n){paths.push(n);}};
 const layout={left:144,systemEnds:[380,590],top:i=>104+i*202};
 const positions=new Map([['a',{x:300,y:172,top:104,sys:0}],['b',{x:330,y:374,top:306,sys:1}]]);
 // The implementation must accept layout supplied by the caller.
 assert.match(html,/function drawMusicConnections\(svg,positions,layout\)/);
 assert.match(html,/drawMusicConnections\(svg,notePositions,layout\)/);
 const code=extract('function drawMusicConnections(','function drawNote(');
 const draw=new Function('musicalLinks','el',code+'\nreturn drawMusicConnections;')(
  ()=>({ties:[['a','b']],slurs:[['a','b']]}),
  (_name,attrs)=>attrs);
 draw(svg,positions,layout);
 assert.equal(paths.filter(p=>p.class==='musicTie').length,2);
 assert.equal(paths.filter(p=>p.class==='musicSlur').length,2);
});
test('JSON project import explicitly rejects more than 40 bars',()=>{
 assert.match(html,/raw\.bars\.length>40\)throw Error\('Classroom projects support a maximum of 40 bars'\)/);
 assert.doesNotMatch(html,/raw\.bars\.length>60\)/);
});

test('real project validator accepts 40 bars, rejects 41/60 without truncating',()=>{
 const code=extract('function validateProject(','function loadProject(');
 const blank=()=>({title:'',composer:'',clef:'treble',meter:'4/4',tempo:96,instrument:'piano',bars:[],strokes:[]});
 const validator=new Function('blank','VALID_DEN','makeId','STEPS','EXTRA_MARKS','cleanBarDirective','TICKS','sumBar',
  code+'\nreturn validateProject;')(
  blank,[1,2,4,8,16],()=>Math.random().toString(36).slice(2),['C','D','E','F','G','A','B'],[],x=>x||{},96,()=>0);
 const make=n=>({bars:Array.from({length:n},()=>[])});
 assert.equal(validator(make(40)).bars.length,40);
 for(const n of [41,60])assert.throws(()=>validator(make(n)),/maximum of 40 bars/);
});
