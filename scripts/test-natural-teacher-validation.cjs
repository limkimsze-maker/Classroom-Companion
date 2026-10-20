/* Synthetic pipeline checks only; never publish these as teacher accuracy. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const V=require('../validation/priority6/core.js'),{loadProtocol,context,digest}=require('./benchmark-natural-teacher-ink.cjs');
const p=loadProtocol(),ctx=context(p);
assert.equal(p.readerSha256,'a6d7ae440512ab2733fb073c896ea6753918ab6f973006ea4e20b2ebf7272ae4');
assert.equal(digest(fs.readFileSync(p.workerDriver)),p.workerDriverSha256);
assert.equal(p.prompts.length,24);
assert.equal(ctx.Worker,undefined,'frozen inference cannot start production workers');
assert.equal(ctx.WhiteboardHandwritingLearning.matchInk([],100,100,'auto',()=>[]),null,'the frozen reader starts without personal teaching');
const batch={schema:V.schema,protocolId:p.id,protocolSha256:p._digest,bundleSha256:p.bundleSha256,sessionId:'synthetic-check-only',writerId:'SYNTHETIC-NOT-A-TEACHER',source:'teacher-whole-expression',teacherAttested:true,freshInkAttested:true,feedbackBeforeCapture:false,sealedAt:'test',records:p.prompts.map((r,i)=>({...r,status:i===0?'ink':'skipped',skipReason:'Synthetic harness check',width:800,height:300,strokes:i===0?[{size:3,points:[{x:.1,y:.2},{x:.2,y:.8}]}]:[]}))};
V.validate(batch,p);
const results=p.prompts.map(r=>({id:r.id,text:r.expected,flagged:false}));
const summary=V.summarize(batch,p,results).summary;assert.equal(summary.total,24);assert.equal(summary.correct,1);assert.equal(summary.skipped,23,'skips cannot improve the denominator');
assert.equal(V.canonical('6 - 2 = 5'),'6−2=5');assert.notEqual(V.canonical('6−2=5'),V.canonical('6−2=4'),'no answer solving');assert.notEqual(V.canonical('8ml'),V.canonical('8mL'),'case is preserved');assert.equal(V.canonical('10m^{2}'),'10m²');
function rejects(change){const b=structuredClone(batch);change(b);assert.throws(()=>V.validate(b,p));}
rejects(b=>b.records.pop());rejects(b=>b.records[0].expected='a guessed label');rejects(b=>b.records[0].strokes[0].points[0].x=Infinity);rejects(b=>b.records[0].strokes[0].points[0].x=1.1);rejects(b=>b.bundleSha256='wrong');rejects(b=>b.protocolSha256='wrong');rejects(b=>b.records[1]={...b.records[1],status:'ink',width:800,height:300,strokes:structuredClone(b.records[0].strokes)});rejects(b=>delete b.sealedAt);
const input=fs.readFileSync('validation/priority6/app.js','utf8');assert(input.includes('worker.postMessage({id:r.id,strokes:r.strokes,width:r.width,height:r.height})'),'expected labels never enter reader messages');
(async()=>{const ink=[{size:3,points:[{x:.2,y:.2},{x:.2,y:.7}]}],a=await ctx.WhiteboardHandwritingMath.recognize(ink,800,300,{mode:'digits'});assert(a.text.trim());console.log('PASS natural-ink pipeline: frozen checksums, isolated learning, complete denominator, duplicate/malformed/tampered rejection, preserved arithmetic and label-free inference. Synthetic checks are not accuracy evidence.');})().catch(e=>{console.error(e);process.exitCode=1});
