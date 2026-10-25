/* Alpha JSON import/export bridge. Reads the existing V2-compatible storage
 * schema without changing handwriting recognition, training, or model weights. */
(function(root){
'use strict';
const learner=root.WhiteboardHandwritingLearning;
if(!learner||learner.exportPack||learner.importPack)return;
const SCHEMA='classroom-handwriting-learning-v1',MAX_BYTES=2000000;
const CHAR_KEY='whiteboard.handwriting.examples.v1';
const INK_KEY='whiteboard.handwriting.ink-examples.v2';
const SYMBOL_KEY='whiteboard.handwriting.symbols.v1';
const validFeature=f=>typeof f==='string'&&/^[0-9a-f]{196}$/.test(f);
const validChar=s=>s&&typeof s.id==='string'&&s.id.length>0&&s.id.length<80&&typeof s.char==='string'&&/^[0-9A-Za-z]$/.test(s.char)&&validFeature(s.feature);
const validInk=s=>s&&typeof s.id==='string'&&s.id.length>0&&s.id.length<80&&typeof s.text==='string'&&s.text.trim().length>0&&s.text.length<=180&&!/[\u0000-\u001f\u007f]/.test(s.text)&&['auto','math','lowercase','uppercase','digits'].includes(s.mode)&&validFeature(s.feature)&&Number.isInteger(s.n)&&s.n>0&&s.n<=180&&Number.isFinite(s.aspect)&&s.aspect>.005&&s.aspect<1000&&(!('raw'in s)||typeof s.raw==='string'&&s.raw.length<=180);
const validPoints=ss=>Array.isArray(ss)&&ss.length>0&&ss.length<=3&&ss.every(s=>Array.isArray(s.points)&&s.points.length>0&&s.points.length<=64&&Number.isFinite(s.size)&&s.size>0&&s.size<=100&&s.points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x<=1&&p.y<=1));
const validSymbol=s=>s&&typeof s.id==='string'&&s.id.length>0&&s.id.length<80&&'=+−×÷'.includes(s.char)&&s.char.length===1&&validFeature(s.feature)&&Number.isFinite(s.aspect)&&s.aspect>=.005&&s.aspect<=1000&&validPoints(s.strokes);
const cleanChar=s=>({id:s.id,char:s.char,feature:s.feature});
const cleanInk=s=>({id:s.id,text:s.text,mode:s.mode,feature:s.feature,n:s.n,aspect:s.aspect,...(typeof s.raw==='string'?{raw:s.raw}:{})});
const cleanSymbol=s=>({id:s.id,char:s.char,feature:s.feature,aspect:s.aspect,strokes:s.strokes.map(t=>({size:t.size,points:t.points.map(p=>({x:p.x,y:p.y}))}))});
function stored(key,version,valid,limit){
 try{const raw=root.localStorage.getItem(key),obj=raw&&raw.length<MAX_BYTES?JSON.parse(raw):null;
  return obj?.version===version&&Array.isArray(obj.samples)?obj.samples.filter(valid).slice(-limit):[];
 }catch{return[]}
}
function exportPack(){
 return{schema:SCHEMA,version:1,createdAt:new Date().toISOString(),
  symbols:stored(SYMBOL_KEY,1,validSymbol,160).map(cleanSymbol),
  characters:stored(CHAR_KEY,1,validChar,360).map(cleanChar),
  selections:stored(INK_KEY,2,validInk,120).map(cleanInk)};
}
function validatePack(input){
 const raw=typeof input==='string'?input:JSON.stringify(input);
 if(raw.length>MAX_BYTES)throw Error('Learning file is too large.');
 let p;try{p=JSON.parse(raw)}catch{throw Error('Choose a valid learning JSON file.')}
 if(p?.schema!==SCHEMA||p.version!==1||
    !Array.isArray(p.symbols)||!Array.isArray(p.characters)||!Array.isArray(p.selections)||
    p.symbols.length>160||p.characters.length>360||p.selections.length>120||
    !p.symbols.every(validSymbol)||!p.characters.every(validChar)||!p.selections.every(validInk))
  throw Error('This file is not a supported learning export.');
 return{symbols:p.symbols.map(cleanSymbol),characters:p.characters.map(cleanChar),selections:p.selections.map(cleanInk)};
}
let serial=0;
function importPack(input){
 const incoming=validatePack(input),local=exportPack(),keys=[CHAR_KEY,INK_KEY,SYMBOL_KEY];
 const originals=keys.map(key=>root.localStorage.getItem(key));
 let added=0,skipped=0;
 const merge=(existing,samples,key,limit)=>{
  const seen=new Set(existing.map(key)),accepted=[];
  for(const item of samples){
   const fingerprint=key(item);
   if(seen.has(fingerprint)||accepted.length+existing.length>=limit){skipped++;continue}
   seen.add(fingerprint);
   accepted.push({...item,id:'import-'+Date.now().toString(36)+'-'+(++serial).toString(36)});
   added++;
  }
  return[...accepted,...existing];
 };
 const characters=merge(local.characters,incoming.characters,x=>x.feature,360);
 const selections=merge(local.selections,incoming.selections,x=>x.mode+':'+x.feature+':'+x.n+':'+x.aspect,120);
 const symbols=merge(local.symbols,incoming.symbols,x=>x.feature+':'+x.strokes.length+':'+x.aspect,160);
 const payload=[
  JSON.stringify({version:1,samples:characters}),
  JSON.stringify({version:2,samples:selections}),
  JSON.stringify({version:1,samples:symbols})
 ];
 try{keys.forEach((key,i)=>root.localStorage.setItem(key,payload[i]));}
 catch{
  keys.forEach((key,i)=>{try{if(originals[i]===null)root.localStorage.removeItem(key);else root.localStorage.setItem(key,originals[i])}catch{}});
  throw Error('Browser storage could not save the import. Existing learning was retained where storage allowed.');
 }
 return{added,skipped};
}
Object.assign(learner,{exportPack,validatePack,importPack});
})(window);