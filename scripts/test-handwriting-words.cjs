const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const ctx={window:null};ctx.window=ctx;vm.createContext(ctx);
for(const file of ['whiteboard-handwriting-word-list-beta.js','whiteboard-handwriting-words-beta.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
const words=ctx.WhiteboardHandwritingWords;
const evidence=(choices,personal)=>({letters:Object.entries(choices).map(([char,score])=>({char,score})).sort((a,b)=>b.score-a.score),personal});
assert(words.info().words>40000);assert(words.known('colour'));assert(words.known('color'));assert(words.known('recognise'));assert(words.known('recognize'));
const ambiguous=[evidence({c:.95}),evidence({a:.58,o:.39}),evidence({t:.95})];
assert.equal(words.rank(ambiguous)[0].text,'cat');assert(words.rank(ambiguous).some(p=>p.text==='cot'));
assert.deepEqual(Array.from(words.rank([evidence({q:.99}),evidence({z:.99}),evidence({x:.99})])),[],'do not invent a dictionary word without letter support');
assert(words.rank([evidence({c:.9}),evidence({a:.9},{char:'o'}),evidence({t:.9})]).every(p=>p.text==='cot'),'confirmed characters constrain the vocabulary');
const makeInk=(n,gap=18)=>Array.from({length:n},(_,i)=>({size:3,points:[{x:(40+i*(35+gap))/800,y:.3},{x:(75+i*(35+gap))/800,y:.4}]}));
let batches=[],fixed=null;
ctx.WhiteboardCharacterReader={async predictBatch(){return batches}};
ctx.WhiteboardUjiReader={read(points){return batches[points[0][0].index]?.map(p=>({label:p.char,p:p.score}))||[]}};
ctx.WhiteboardHandwritingLearning={match:()=>fixed};
function api(ink){return{segment:()=>ink.map((raw,i)=>({char:'?',score:.4,parts:[{source:raw,points:raw.points.map(p=>({x:p.x*800,y:p.y*600,index:i})),size:3}]})),rasterDigit:()=>new Float32Array(784)}};
const reading=text=>({text,tokens:[],uncertain:[],engine:'local-emnist-cnn'});
(async()=>{
 let ink=makeInk(3);batches=ambiguous.map(p=>p.letters);
 const result=await words.check(ink,800,600,{mode:'auto'},reading('c?t'),api(ink));
 assert.equal(result.text,'c?t','word checking preserves the original preview until a choice is made');
 const choices=Array.from(result.context.alternatives,p=>p.text);
 assert(choices.includes('cat'));assert(choices.includes('Cat'));assert(choices.includes('cot'));assert(result.uncertain.length);
 for(const choice of result.context.alternatives.filter(c=>!c.original)){
  assert.equal(choice.tokens.map(t=>t.char).join(''),choice.text.replace(/\s/g,''));
  assert.equal(new Set(choice.tokens.flatMap(t=>t.parts.map(p=>p.source))).size,ink.length);
 }
 for(const mode of ['lowercase','uppercase']){
  const r=await words.check(ink,800,600,{mode},reading('c?t'),api(ink));
  for(const choice of r.context.alternatives.filter(c=>!c.original))assert.equal(choice.text,mode==='lowercase'?choice.text.toLowerCase():choice.text.toUpperCase());
 }
 for(const text of ['NaCl','ABC']){
  ink=makeInk(text.length);batches=Array.from(text,c=>[{char:c.toLowerCase(),score:.99}]);
  const r=await words.check(ink,800,600,{mode:'auto'},reading(text),api(ink));
  assert.equal(r.text,text,'identifiers and acronyms are preserved');
 }
 ink=makeInk(1);batches=[[{char:'c',score:.99}]];
 const c=await words.check(ink,800,600,{mode:'auto'},reading('c'),api(ink));
 assert.deepEqual(Array.from(c.context.alternatives,p=>p.text),['c','C']);
 fixed={char:'c',score:1,personal:true};
 assert.equal((await words.check(ink,800,600,{mode:'auto'},reading('c'),api(ink))).context,undefined,'a personal letter correction suppresses case guesses');fixed=null;
 for(const mode of ['math','digits'])assert.equal((await words.check(ink,800,600,{mode},reading('c'),api(ink))).context,undefined);
 for(const input of [{...reading('10 cm'),format:'unit'},reading('123'),{...reading('Cat'),engine:'local-personal-ink'},reading('cm')])
  assert.equal((await words.check(ink,800,600,{mode:'auto'},input,api(ink))).context,undefined);
 const missing=api(ink);missing.segment=()=>[];
 assert.equal((await words.check(ink,800,600,{mode:'auto'},reading('c'),missing)).context,undefined);
 const real=require('./helpers/handwriting-context.cjs')(),fixture=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync(__dirname+'/handwriting-uji-word-fixtures.json.gz')));
 const {assemble,W,H}=require('./benchmark-handwriting-words.cjs');
 const wordInk=assemble(fixture.samples['1'],'cat',0),r=await real.WhiteboardHandwritingMath.recognize(wordInk,W,H,{mode:'auto'});
 assert(r.context.alternatives.some(p=>p.text==='cat'),'actual UJI V1 pen ink offers the intended whole word');
 const phraseInk=assemble(fixture.samples['1'],'the cat',0),phrase=await real.WhiteboardHandwritingMath.recognize(phraseInk,W,H,{mode:'auto'});
 assert.equal(phrase.text,'562 mm','preserve an existing measurement reading until the teacher chooses');
 assert(phrase.context.alternatives.some(p=>p.text==='the cat'),'strong whole-word evidence survives an incorrect measurement route');
 assert(phrase.context.alternatives.some(p=>p.text==='The cat'),'offer sentence case when the selection boundary is ambiguous');
 const caseInk=assemble(fixture.samples['1'],'C',0),letter=await real.WhiteboardHandwritingMath.recognize(caseInk,W,H,{mode:'auto'});
 assert(letter.context.alternatives.some(p=>p.text==='c')&&letter.context.alternatives.some(p=>p.text==='C'),'actual c/C pen ambiguity offers both cases');
 const original=r.text,tx=real.WhiteboardHandwritingLearning.confirm(r,'cat',real.WhiteboardHandwritingMath.rasterDigit,wordInk,W,H,'auto');
 assert(tx?.count);assert.equal((await real.WhiteboardHandwritingMath.recognize(wordInk,W,H,{mode:'auto'})).text,'cat','confirmed word training wins on replay');
 real.WhiteboardHandwritingLearning.undo(tx);
 assert.equal((await real.WhiteboardHandwritingMath.recognize(wordInk,W,H,{mode:'auto'})).text,original,'Undo removes word confirmation');
 const saved=real.WhiteboardHandwritingWords;
 real.WhiteboardHandwritingWords={check(){throw Error('missing word service')}};
 assert.equal((await real.WhiteboardHandwritingMath.recognize(wordInk,W,H,{mode:'auto'})).text,original,'optional word failure retains the original reading');
 real.WhiteboardHandwritingWords={check(){const e=Error('cancel');e.name='AbortError';throw e}};
 await assert.rejects(real.WhiteboardHandwritingMath.recognize(wordInk,W,H,{mode:'auto'}),e=>e.name==='AbortError');real.WhiteboardHandwritingWords=saved;
 console.log('PASS offline word checking: supported spelling alternatives, British/US vocabulary, case modes, full token coverage, personal priority, identifiers, numeric/unit/Math protection');
})().catch(e=>{console.error(e);process.exitCode=1});
