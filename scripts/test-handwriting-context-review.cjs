/* Exercise the actual review controller with a small DOM event fixture.
 * Neural/context inference is tested independently with actual pen fixtures.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let document;
class Element{
 constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.events={};this.style={};this.value='';this.hidden=false;this.disabled=false;this.classList={add(){},remove(){},toggle(){}}}
 append(...children){for(const c of children){c.parent=this;this.children.push(c)}}
 appendChild(child){this.append(child);return child}
 insertBefore(child,before){const i=this.children.indexOf(before);child.parent=this;this.children.splice(i<0?this.children.length:i,0,child)}
 replaceChildren(...children){this.children=[];this.append(...children)}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this)}
 setAttribute(name,value){this.attributes[name]=String(value)}
 getAttribute(name){return this.attributes[name]??null}
 addEventListener(name,fn){(this.events[name]??=[]).push(fn)}
 async fire(name,event={}){for(const fn of this.events[name]||[])await fn({preventDefault(){},stopImmediatePropagation(){},...event})}
 async click(){if(this.disabled)return;await this.fire('click');return this.onclick?.()}
 focus(){document.activeElement=this}
}
const find=(root,predicate)=>predicate(root)?root:root.children.map(c=>find(c,predicate)).find(Boolean);
const body=new Element('body'),head=new Element('head'),tools=new Element('div'),board=new Element('div'),undo=new Element('button'),pen=new Element('button');
board.id='boardWrap';undo.id='undoBtn';pen.id='penBtn';tools.append(pen,undo);body.append(tools,board);
document={body,head,activeElement:null,createElement:tag=>new Element(tag),querySelector:s=>s==='.tools'?tools:null,getElementById:id=>find(body,e=>e.id===id)||find(head,e=>e.id===id)};
const raw={size:4,points:[{x:.2,y:.3},{x:.25,y:.4}]},alternateTokens=[{char:'3',parts:[{points:[{x:20,y:30},{x:25,y:40}]}]}];
let recognition={text:'10 m²',tokens:[],uncertain:[{char:'?',score:0}],engine:'local-context-language-model',format:'unit',context:{applied:false,originalText:'10 m²',alternatives:[{text:'10 m²',tokens:[]},{text:'10 m³',tokens:alternateTokens}]}};
let confirmed=[],undone=[],cancelled=0;
const ctx={document,console,Math,JSON,Number,Set,setTimeout,clearTimeout,encodeURIComponent,AbortController,
 canvas:{releasePointerCapture(){}},strokes:[raw],cssW:800,cssH:600,tool:'select',redraw(){},syncUi(){},addEventListener(){},requestAnimationFrame:fn=>setTimeout(fn,0),
 WhiteboardHandwritingMath:{build:'20261020-words2',recognize:async()=>recognition,rasterDigit(){}},
 WhiteboardHandwritingLearning:{confirm(...args){confirmed.push(args);return{count:1,persistent:true}},undo:tx=>undone.push(tx)},
 WhiteboardEquationFormatter:{font:()=> 'Arial',createHandwriting:(text,b,colour)=>text?{type:'image',src:'preview:'+text,colour,...b}:null},
 WhiteboardCharacterReader:{cancel(){cancelled++}},WhiteboardMarqueeSelection:{get:()=>ctx.strokes,clear(){}}};
for(const name of ['WhiteboardDigitModel','WhiteboardCharacterModels','WhiteboardCharacterInference','WhiteboardUjiWeights','WhiteboardUjiReader','WhiteboardPrimaryMathGrammar','WhiteboardEqualSign','WhiteboardTrained9GQEquals','WhiteboardTrainedJ','WhiteboardTrainedRemaining','WhiteboardTeacherUnits','WhiteboardTeacherConfusables','WhiteboardUnitExponent','WhiteboardHandwritingContextModel','WhiteboardHandwritingContext','WhiteboardHandwritingWordList','WhiteboardHandwritingWords'])ctx[name]={};
ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('whiteboard-handwriting-beautify-beta.js','utf8'),ctx);
(async()=>{
 await document.getElementById('handwritingBeautifyBtn').click();
 const area=document.getElementById('handwritingContextChoices'),input=document.getElementById('handwritingReadText');
 assert.equal(area.hidden,false);assert.equal(area.children[1].children.length,2);
 await area.children[1].children[1].click();
 assert.equal(input.value,'10 m³');assert.equal(confirmed.length,0,'choosing an alternative does not teach or alter the board');
 assert.equal(ctx.strokes[0],raw);
 const apply=find(body,e=>e.textContent==='✓ Apply beautify');await apply.click();
 assert.equal(ctx.strokes[0].src,'preview:10 m³');assert.equal(ctx.tool,'pen');
 assert.equal(confirmed.length,1);assert.equal(confirmed[0][1],'10 m³');assert.equal(confirmed[0][0].tokens,alternateTokens,'learning uses the selected hypothesis alignment');
 await undo.click();assert.equal(JSON.stringify(ctx.strokes),JSON.stringify([raw]));assert.equal(undone.length,1);
 await document.getElementById('handwritingBeautifyBtn').click();
 const next=document.getElementById('handwritingReadText');next.value='97 kg';await next.fire('input');
 assert.equal(document.getElementById('handwritingContextChoices').hidden,true,'manual edits hide stale alternatives');
 await find(body,e=>e.textContent==='Cancel').click();assert.equal(confirmed.length,1,'Cancel teaches nothing');
 recognition={text:'c',tokens:[],uncertain:[{char:'?',score:0}],context:{kind:'letter-case',alternatives:[{text:'c',tokens:[]},{text:'C',tokens:alternateTokens}]}};
 await document.getElementById('handwritingBeautifyBtn').click();
 const letterArea=document.getElementById('handwritingContextChoices');
 assert(letterArea.children[0].textContent.includes('Lowercase or uppercase'));
 await letterArea.children[1].children[1].click();assert.equal(document.getElementById('handwritingReadText').value,'C');
 assert.equal(confirmed.length,1,'choosing capital C does not teach before Apply');
 await find(body,e=>e.textContent==='Cancel').click();
 recognition={text:'c?t',tokens:[],uncertain:[{char:'?',score:0}],context:{kind:'words',alternatives:[{text:'c?t',tokens:[]},{text:'cat',tokens:alternateTokens}]}};
 await document.getElementById('handwritingBeautifyBtn').click();
 const wordArea=document.getElementById('handwritingContextChoices');assert(wordArea.children[0].textContent.includes('Possible words'));
 await wordArea.children[1].children[1].click();await find(body,e=>e.textContent==='✓ Apply beautify').click();
 assert.equal(ctx.strokes[0].src,'preview:cat');assert.equal(confirmed[1][1],'cat');assert.equal(confirmed[1][0].tokens,alternateTokens);
 await undo.click();assert.equal(JSON.stringify(ctx.strokes),JSON.stringify([raw]));
 assert(cancelled>0);console.log('PASS actual review controller: unit/word/case alternatives, preview, Apply token alignment, pen recovery, Undo, manual edits and Cancel');
})().catch(e=>{console.error(e);process.exitCode=1});
