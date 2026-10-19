/* Real UJI V1 glyph compositions; NOT naturally written words or sentences.
 * Frozen development writers 1–5, verification writers 6–11. Never train on
 * these examples. Suggestion coverage is distinct from automatic accuracy.
 */
const fs=require('node:fs'),path=require('node:path');
const make=require('./helpers/handwriting-context.cjs');
const fixture=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync(path.join(__dirname,'handwriting-uji-word-fixtures.json.gz'))));
const W=2400,H=700;
const phrases=['cat','Cat','the cat','The cat','dog','school','hello','Hello','math','three','square','colour','C','c','ABC','NaCl'];
function assemble(samples,text,rep=0){
 let left=35;const result=[];
 for(const char of text){
  if(char===' '){left+=38;continue;}
  const parts=samples[char]?.[rep];if(!parts?.length)return null;
  const points=parts.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
  const height=/[A-Zbdfhklt]/.test(char)?70:/[gjpqy]/.test(char)?65:45;
  const bottom=/[gjpqy]/.test(char)?280:260,scale=height/Math.max(1,ymax-ymin);
  for(const part of parts)result.push({size:3,points:part.map(([x,y])=>({x:(left+(x-xmin)*scale)/W,y:(bottom+(y-ymax)*scale)/H}))});
  left+=(xmax-xmin)*scale+14;
 }
 return result;
}
async function run({split='all',out}={}){
 const ctx=make(),records=[];
 for(const [writer,samples]of Object.entries(fixture.samples)){
  const partition=Number(writer)<=5?'development':'verification';if(split!=='all'&&split!==partition)continue;
  for(const expected of phrases)for(const rep of [0,1]){
   const ink=assemble(samples,expected,rep),before=await ctx.WhiteboardHandwritingMath.recognize(ink,W,H,{mode:'auto',words:false});
   const after=await ctx.WhiteboardHandwritingMath.recognize(ink,W,H,{mode:'auto'});
   const choices=(after.context?.kind==='words'||after.context?.kind==='letter-case'?after.context.alternatives:[]).map(p=>p.text);
   records.push({writer,rep,partition,expected,before:before.text,after:after.text,correct:after.text===expected,
    offered:choices.includes(expected),available:after.text===expected||choices.includes(expected),choices,flagged:!!after.uncertain?.length});
  }
  console.log(JSON.stringify({writer,done:records.length}));
 }
 const summary=rows=>({total:rows.length,correct:rows.filter(r=>r.correct).length,correctOrOffered:rows.filter(r=>r.available).length,
  changed:rows.filter(r=>r.before!==r.after).length,withChoices:rows.filter(r=>r.choices.length>1).length});
 const report={build:ctx.WhiteboardHandwritingMath.build,method:'Fixed words composed from independent UJI V1 glyphs. Case-sensitive exact matching, correlated glyphs. Correct-or-offered includes the unchanged original and requires human selection. No real-world accuracy claim.',
  vocabulary:ctx.WhiteboardHandwritingWords.info(),summary:summary(records),development:summary(records.filter(r=>r.partition==='development')),verification:summary(records.filter(r=>r.partition==='verification')),records};
 if(out)fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({summary:report.summary,development:report.development,verification:report.verification},null,2));return report;
}
module.exports={assemble,run,phrases,W,H};
if(require.main===module){const arg=name=>{const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1]};run({split:arg('--split')||'all',out:arg('--out')}).catch(e=>{console.error(e);process.exitCode=1});}
