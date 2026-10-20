/* Runs after the hash-verified frozen bundle in an isolated worker. */
self.onmessage=async function(event){
 const {id,strokes,width,height}=event.data;
 try{
  const result=await self.WhiteboardHandwritingMath.recognize(strokes,width,height,{mode:'auto'});
  self.postMessage({id,text:result.text||'',engine:result.engine||'unknown',flagged:!!result.uncertain?.length});
 }catch(error){self.postMessage({id,text:'',flagged:true,error:String(error.message||error)});}
};
self.postMessage({ready:true,build:self.WhiteboardHandwritingMath.build});
