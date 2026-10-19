/* Compare a private teacher corpus locally; never bundle raw teacher traces.
 * node scripts/benchmark-trained-handwriting-controls.cjs corpus.json baseline-reader.js output.json
 */
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),make=require('./helpers/handwriting-context.cjs');
const a=make(),b=make();vm.runInContext(fs.readFileSync(process.argv[3],'utf8'),a);
const samples=JSON.parse(fs.readFileSync(process.argv[2],'utf8')).samples;
const normalized=t=>String(t).replace(/\s/g,'').replace(/mL/g,'ml');
(async()=>{
 let beforeCorrect=0,afterCorrect=0;const regressions=[],gains=[];
 for(let i=0;i<samples.length;i++){
  const s=samples[i],before=await a.WhiteboardHandwritingMath.recognize(s.strokes,s.canvas.width,s.canvas.height,{mode:'auto'}),after=await b.WhiteboardHandwritingMath.recognize(s.strokes,s.canvas.width,s.canvas.height,{mode:'auto'});
  const old=normalized(before.text)===normalized(s.label),now=normalized(after.text)===normalized(s.label);
  beforeCorrect+=old;afterCorrect+=now;
  if(old&&!now)regressions.push({index:i,label:s.label,before:before.text,after:after.text,engine:after.engine});
  if(!old&&now)gains.push({index:i,label:s.label,before:before.text,after:after.text,engine:after.engine});
  if(i%200===199)console.log('Teacher compatibility checked',i+1);
 }
 const result={total:samples.length,beforeCorrect,afterCorrect,regressions,gains,readerSha256:crypto.createHash('sha256').update(fs.readFileSync('whiteboard-handwriting-recognition-beta.js')).digest('hex'),method:'Training-corpus compatibility control; not an independent accuracy estimate. No raw strokes included.'};
 fs.writeFileSync(process.argv[4],JSON.stringify(result,null,2));
 console.log(JSON.stringify({total:result.total,beforeCorrect,afterCorrect,regressions,gains:gains.length}));
})().catch(error=>{console.error(error);process.exitCode=1});
