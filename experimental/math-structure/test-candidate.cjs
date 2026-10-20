'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const createContext=require('../../scripts/helpers/handwriting-context.cjs');
const source=require('./candidate.cjs').build();
const baseline=createContext(),candidate=createContext();
vm.runInContext(source,candidate);
const fixture=fs.readFileSync('scripts/test-math-structure-regression.cjs','utf8').match(/const teacherRows="([^"]+)"/);
assert(fixture,'Actual teacher fixture must be present');
const original=fixture[1].split('|').map(row=>({size:5,points:row.split(';').map(pair=>{
 const [x,y]=pair.split(',').map(Number);return{x:x/10000,y:y/10000};
})}));
const variants=[
 ['original',ink=>ink],
 ['translated',ink=>ink.map(s=>({...s,points:s.points.map(p=>({x:p.x+.02,y:p.y+.01}))}))],
 ['smaller',ink=>ink.map(s=>({...s,points:s.points.map(p=>({x:p.x*.85,y:p.y*.85}))}))],
 ['larger',ink=>ink.map(s=>({...s,points:s.points.map(p=>({x:p.x*1.2,y:p.y*1.2}))}))],
 ['reordered strokes',ink=>ink.slice().reverse()],
 ['reversed pen direction',ink=>ink.map(s=>({...s,points:s.points.slice().reverse()}))]
];
(async()=>{
 const records=[];
 for(const [name,transform] of variants){
  const ink=transform(structuredClone(original)),W=372,H=404.24444580078125;
  const a=await baseline.WhiteboardHandwritingMath.recognize(ink,W,H,{mode:'auto'});
  const b=await candidate.WhiteboardHandwritingMath.recognize(ink,W,H,{mode:'auto'});
  const expected='\\sqrt{8+(10)}';
  records.push({name,expected,v1:a.text,v2:b.text,v1Correct:a.text===expected,v2Correct:b.text===expected,flagged:!!b.uncertain.length});
  console.log(JSON.stringify(records.at(-1)));
  assert.equal(b.text,expected,name);
  assert(b.uncertain.length,'Weaker model evidence must retain teacher review');
 }
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({
  note:'One existing teacher expression with correlated geometric variants; development controls, not independent writer accuracy.',records
 },null,2)+'\n');
 console.log('PASS paired actual-ink expression and transform controls');
})().catch(error=>{console.error(error);process.exitCode=1});
