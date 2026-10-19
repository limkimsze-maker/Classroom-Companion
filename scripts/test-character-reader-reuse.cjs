const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const workers=[];
class FakeWorker{
 constructor(){this.closed=false;workers.push(this)}
 postMessage({id,images}){setTimeout(()=>{if(!this.closed)this.onmessage({data:{id,results:images.map(()=>[{char:'4',score:.99}])}})},0)}
 terminate(){this.closed=true}
}
const ctx={Worker:FakeWorker,setTimeout,clearTimeout,window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('whiteboard-handwriting-character-reader-beta.js','utf8'),ctx);
(async()=>{
 const reader=ctx.window.WhiteboardCharacterReader;
 assert.equal((await reader.predictBatch([[0]],'auto'))[0][0].char,'4');
 await reader.predictBatch([[0]],'auto');assert.equal(workers.length,1,'completed jobs reuse decoded models');
 reader.cancel();assert(workers[0].closed);
 await reader.predictBatch([[0]],'auto');assert.equal(workers.length,2);
 const pending=reader.predictBatch([[0]],'auto');reader.cancel();await assert.rejects(pending,{name:'AbortError'});
 console.log('PASS character worker reuse, explicit cancellation and clean restart');
})().catch(error=>{console.error(error);process.exitCode=1});
