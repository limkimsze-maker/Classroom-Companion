/* Shared validation rules; never passed to the recognizer as expected answers. */
(function(root){
'use strict';
const schema='classroom-natural-ink-batch-v1';
function canonical(text){return String(text||'').normalize('NFC').replace(/\\(?:times|cdot)/g,'×').replace(/\\div/g,'÷').replace(/\\(?:left|right)/g,'').replace(/\^\{?2\}?/g,'²').replace(/\^\{?3\}?/g,'³').replace(/-/g,'−').replace(/\s+/g,'');}
function distance(a,b){let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=0;i<a.length;i++){const row=[i+1];for(let j=0;j<b.length;j++)row.push(Math.min(row[j]+1,prev[j+1]+1,prev[j]+(a[i]===b[j]?0:1)));prev=row;}return prev[b.length];}
function validate(batch,protocol,{sealed=true}={}){
 const fail=s=>{throw Error(s)};
 if(!batch||batch.schema!==schema||batch.protocolId!==protocol.id||batch.bundleSha256!==protocol.bundleSha256||protocol._digest&&batch.protocolSha256!==protocol._digest)fail('This file belongs to a different test version.');
 if(typeof batch.sessionId!=='string'||batch.sessionId.length>100||typeof batch.writerId!=='string'||!batch.writerId.trim()||batch.writerId.length>60)fail('Missing teacher or session identifier.');
 if(batch.source!=='teacher-whole-expression'||batch.teacherAttested!==true||batch.freshInkAttested!==true||typeof batch.feedbackBeforeCapture!=='boolean')fail('Missing handwriting provenance.');
 if(!Array.isArray(batch.records)||batch.records.length!==protocol.prompts.length)fail('The complete planned test must be retained.');
 if(sealed&&!batch.sealedAt)fail('Finish and seal the batch before scoring.');
 let inkCount=0;const seen=new Set();
 batch.records.forEach((r,i)=>{
  const p=protocol.prompts[i];if(r.id!==p.id||r.expected!==p.expected||r.category!==p.category)fail('A prompt or label was changed.');
  if(!['pending','ink','skipped'].includes(r.status)||sealed&&r.status==='pending')fail('Every prompt needs handwriting or an explicit skip.');
  if(r.status==='skipped'&&(!r.skipReason||String(r.skipReason).length>300))fail('Give a short reason for the skipped item.');
  if(r.status!=='ink'){if(r.strokes?.length)fail('Skipped or pending items cannot contain ink.');return;}
  if(!Number.isFinite(r.width)||!Number.isFinite(r.height)||r.width<1||r.height<1||r.width>10000||r.height>10000)fail('Invalid writing dimensions.');
  if(!Array.isArray(r.strokes)||!r.strokes.length||r.strokes.length>180)fail('Select valid pen strokes.');
  let count=0;r.strokes.forEach(s=>{if(!Number.isFinite(s.size)||s.size<=0||s.size>50||!Array.isArray(s.points)||!s.points.length)fail('Invalid stroke.');count+=s.points.length;for(const q of s.points)if(!Number.isFinite(q.x)||!Number.isFinite(q.y)||q.x<0||q.x>1||q.y<0||q.y>1)fail('Invalid pen coordinates.');});
  if(count>16000)fail('Too many pen points.');
  const key=JSON.stringify(r.strokes.map(s=>s.points.map(p=>[p.x,p.y])));
  if(seen.has(key))fail('Duplicate ink was detected; draw each expression separately.');seen.add(key);inkCount++;
 });
 if(sealed&&!inkCount)fail('At least one expression needs handwriting.');
 return true;
}
function summarize(batch,protocol,results){
 validate(batch,protocol);if(!Array.isArray(results)||results.length!==protocol.prompts.length||results.some((r,i)=>r.id!==protocol.prompts[i].id))throw Error('The result set is incomplete.');
 const rows=results.map((r,i)=>{const p=protocol.prompts[i],sample=batch.records[i],actual=r.text||'',correct=sample.status==='ink'&&!r.error&&canonical(actual)===canonical(p.expected);return{...r,expected:p.expected,category:p.category,correct,skipped:sample.status==='skipped',flagged:!!r.flagged||!!r.error,edits:distance(canonical(p.expected),canonical(actual))};});
 const count=items=>({correct:items.filter(r=>r.correct).length,total:items.length,attempted:items.filter(r=>!r.skipped).length,skipped:items.filter(r=>r.skipped).length,flagged:items.filter(r=>r.flagged).length,unflaggedWrong:items.filter(r=>!r.correct&&!r.skipped&&!r.flagged).length,exactPercent:100*items.filter(r=>r.correct).length/Math.max(1,items.length),characterErrorPercent:100*items.reduce((s,r)=>s+r.edits,0)/Math.max(1,items.reduce((s,r)=>s+canonical(r.expected).length,0))});
 const by={};for(const p of protocol.prompts)by[p.category]=count(rows.filter(r=>r.category===p.category));
 return{schema:'classroom-natural-ink-results-v1',protocolId:protocol.id,sessionId:batch.sessionId,writerId:batch.writerId,build:protocol.build,readerSha256:protocol.readerSha256,bundleSha256:protocol.bundleSha256,declaredFresh:!batch.feedbackBeforeCapture,provenance:'Teacher and fresh-whole-expression status are self-attested, not independently verified.',interpretation:'Descriptive score for this prompted writer/batch. Not a population accuracy estimate. Skips remain in the planned denominator.',summary:count(rows),by,records:rows};
}
const api={schema,canonical,validate,summarize};if(typeof module==='object'&&module.exports)module.exports=api;else root.NaturalInkValidation=api;
})(typeof self!=='undefined'?self:globalThis);
