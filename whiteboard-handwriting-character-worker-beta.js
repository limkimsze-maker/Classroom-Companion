/* Same-origin worker: handwriting and results never leave this device. */
'use strict';
importScripts('whiteboard-handwriting-character-models-beta.js?v=20261018-letters-cnn1','whiteboard-handwriting-character-inference-beta.js?v=20261019-simulations1');
self.onmessage=e=>{
 const {id,images,mode}=e.data;try{
  if(!Array.isArray(images)||images.length>180)throw Error('Select a shorter piece of handwriting.');
  const results=[];for(let i=0;i<images.length;i++){results.push(self.WhiteboardCharacterInference.predict(images[i],mode));if(i%4===3)self.postMessage({id,done:i+1,total:images.length})}
  self.postMessage({id,results});
 }catch(error){self.postMessage({id,error:error.message||'Could not read these characters.'})}
};
