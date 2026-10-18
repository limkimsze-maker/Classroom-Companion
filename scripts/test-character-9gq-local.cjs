const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const data=new Map();
const window={localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},document:{}};
const ctx={window,localStorage:window.localStorage,document:{readyState:'loading',addEventListener(){}},Float32Array,Math,Array,Number,JSON};
vm.runInNewContext(fs.readFileSync('whiteboard-character-9gq-local-beta.js','utf8'),ctx);
const api=window.WhiteboardCharacter9GQ;
function stroke(coords){return{size:5,points:coords.map(([x,y])=>({x,y}))}}
const nine=[stroke([[.2,.2],[.4,.15],[.5,.25],[.4,.4],[.2,.4],[.2,.2],[.52,.6],[.5,.9]])];
const g=[stroke([[.2,.2],[.42,.2],[.5,.4],[.38,.55],[.2,.45],[.2,.2],[.52,.6],[.42,.9],[.25,.9]])];
const q=[stroke([[.2,.2],[.42,.2],[.5,.4],[.38,.55],[.2,.45],[.2,.2],[.52,.95]])];
const samples=[];
for(const [label,strokes] of [['9',nine],['g',g],['q',q]])for(let i=0;i<5;i++)
 samples.push({label,strokes,canvas:{width:300,height:300}});
assert.equal(api.info().count,0);
const loaded=api.importExamples({schema:'classroom-character-samples-v1',samples});
assert.equal(loaded.count,15);
assert.equal(api.match(nine,300,300,'auto')?.text,'9');
assert.equal(api.match(g,300,300,'lowercase')?.text,'g');
assert.equal(api.match(q,300,300,'lowercase')?.text,'q');
assert.equal(api.match(g,300,300,'digits'),null);
const unrelated=[stroke([[.1,.2],[.9,.8]])];
assert.equal(api.match(unrelated,300,300,'auto'),null);
const equation=[...nine,...g,...q,...nine];
assert.equal(api.match(equation,300,300,'auto'),null);
console.log('PASS local private 9/g/q import, conservative matching, mode gating, unrelated ink and equation');
