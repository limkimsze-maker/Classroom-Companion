/* Compare a private teacher batch with its frozen baseline, without teaching it.
 * Candidate results are development replays, not untouched validation scores.
 * node scripts/replay-natural-ink-current.cjs batch.json --out comparison.json
 */
const fs=require('node:fs'),crypto=require('node:crypto'),V=require('../validation/priority6/core.js');
const {loadProtocol,run:frozenRun}=require('./benchmark-natural-teacher-ink.cjs'),createContext=require('./helpers/handwriting-context.cjs');
async function compare(batch){
 const protocol=loadProtocol();V.validate(batch,protocol);const before=await frozenRun(batch),ctx=createContext(),rows=[];
 for(const sample of batch.records){let r={id:sample.id,text:'',flagged:false};if(sample.status==='ink')try{const p=await ctx.WhiteboardHandwritingMath.recognize(sample.strokes,sample.width,sample.height,{mode:'auto'});r={id:sample.id,text:p.text||'',engine:p.engine,flagged:!!p.uncertain?.length};}catch(error){r={id:sample.id,text:'',flagged:true,error:error.message};}rows.push(r);}
 const after={...V.summarize(batch,protocol,rows),build:ctx.WhiteboardHandwritingMath.build,readerSha256:crypto.createHash('sha256').update(fs.readFileSync('whiteboard-handwriting-recognition-beta.js')).digest('hex'),stage:'development-replay',declaredFresh:false,independentValidation:false,baselineBundleSha256:protocol.bundleSha256,interpretation:'This batch has informed the candidate fix. These are development results, not an independent accuracy estimate.'};
 delete after.bundleSha256;
 const gains=after.records.filter((r,i)=>r.correct&&!before.records[i].correct).map(r=>r.id),regressions=after.records.filter((r,i)=>!r.correct&&before.records[i].correct).map(r=>r.id);
 return{schema:'classroom-natural-ink-development-comparison-v1',before,after,gains,regressions};
}
module.exports={compare};
if(require.main===module)(async()=>{const batch=JSON.parse(fs.readFileSync(process.argv[2])),report=await compare(batch),i=process.argv.indexOf('--out');if(i>=0)fs.writeFileSync(process.argv[i+1],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({before:report.before.summary,after:report.after.summary,gains:report.gains,regressions:report.regressions},null,2));if(report.regressions.length)process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});
