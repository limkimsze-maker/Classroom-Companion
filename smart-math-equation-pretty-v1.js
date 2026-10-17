(function(){
'use strict';
if(typeof canvas==='undefined'||typeof strokes==='undefined'||typeof redraw!=='function'||typeof syncUi!=='function'||typeof wrap==='undefined')return;

const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{menu:'Equation',title:'Format math equation',hint:'$23.00 + $67.00 =, 4.6 + 2.9, or 2x + 3 = 11',format:'Format',cancel:'Cancel',bad:'Check the numbers, operators and brackets. You can end with =.',made:'Math equation created'},
 zh:{menu:'算式',title:'整理数学算式',hint:'$23.00 + $67.00 =、4.6 + 2.9 或 2x + 3 = 11',format:'整理',cancel:'取消',bad:'请检查数字、运算符和括号。末尾可以加 =。',made:'已创建数学算式'},
 ms:{menu:'Persamaan',title:'Format pengiraan Matematik',hint:'$23.00 + $67.00 =, 4.6 + 2.9, atau 2x + 3 = 11',format:'Format',cancel:'Batal',bad:'Semak nombor, operasi dan kurungan. Boleh diakhiri dengan =.',made:'Pengiraan Matematik dicipta'},
 ta:{menu:'சமன்பாடு',title:'கணிதக் கணக்கை வடிவமை',hint:'$23.00 + $67.00 =, 4.6 + 2.9, அல்லது 2x + 3 = 11',format:'வடிவமை',cancel:'ரத்து',bad:'எண்கள், குறிகள் மற்றும் அடைப்புக்குறிகளைச் சரிபார்க்கவும். இறுதியில் = சேர்க்கலாம்.',made:'கணிதக் கணக்கு உருவாக்கப்பட்டது'}
};
const L=TXT[edition]||TXT.en;
const MENU_LABELS=new Set(['Equation','算式','Persamaan','சமன்பாடு']);
let panel=null;
const uid=()=>`smeq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&apos;'}[c]))}
function svgData(svg){return'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)}
function notify(msg){if(typeof say==='function'){try{say(msg);return}catch{}}const t=document.getElementById('toast');if(t){t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1400)}}
function close(){if(panel){panel.remove();panel=null}}
function font(){return `'Comic Sans MS','Segoe Print','Trebuchet MS','Arial Rounded MT Bold',sans-serif`}

// Parse only mathematical tokens; never execute user input as JavaScript.
function parseEquation(input){
 let source=String(input??'').trim().replace(/[−–—﹣－]/g,'-').replace(/[＋﹢]/g,'+').replace(/[✕✖·∙＊]/g,'×').replace(/[／∕]/g,'÷').replace(/＝/g,'=').replace(/（/g,'(').replace(/）/g,')').replace(/[０-９]/g,c=>String(c.charCodeAt(0)-0xff10));
 if(!source||source.length>180)return null;
 // Retain the familiar 3x4 multiplication shorthand, while keeping x + 2 algebraic.
 source=source.replace(/(\d|\))\s*[xX]\s*(?=[\d.$€£¥])/g,'$1 × ');
 const tokens=[],number=/^(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/,currency=/^(?:S\$|SGD\s*\$?|\$|€|£|¥)\s*/i;
 for(let i=0;i<source.length;){
  if(/\s/.test(source[i])){i++;continue}
  const start=i,money=source.slice(i).match(currency);let prefix='',sign='';
  if(money){prefix=money[0].trim().replace(/\s+/g,'');i+=money[0].length;if(/[+-]/.test(source[i]||'!'))sign=source[i++];}
  const num=source.slice(i).match(number);
  if(num){
   const raw=num[0],text=raw.startsWith('.')?'0'+raw:raw,amount=Number(raw.replace(/,/g,''))*(sign==='-'?-1:1);
   if(!Number.isFinite(amount))return null;
   tokens.push({kind:'number',text:sign+prefix+text,value:amount});i+=raw.length;
  }else if(money)return null;
  else{
   const variable=source.slice(i).match(/^[A-Za-z\u0370-\u03ff][A-Za-z\u0370-\u03ff_0-9]*/);
   if(variable){tokens.push({kind:'variable',text:variable[0]});i+=variable[0].length}
   else if('+-×*÷/^()=%√'.includes(source[i])){const text=source[i++].replace('*','×').replace('/','÷');tokens.push({kind:'symbol',text})}
   else return null;
  }
  if(i===start||tokens.length>100)return null;
 }
 let pos=0;
 const peek=()=>tokens[pos]?.text,take=()=>tokens[pos++];
 function binary(op,left,right){
  if(op==='÷'&&right.value===0)throw Error('Division by zero');
  let value;
  if(Number.isFinite(left.value)&&Number.isFinite(right.value)){
   value=op==='+'?left.value+right.value:op==='-'?left.value-right.value:op==='×'?left.value*right.value:op==='÷'?left.value/right.value:Math.pow(left.value,right.value);
   if(!Number.isFinite(value))throw Error('Undefined real expression');
  }
  return{kind:'binary',op,left,right,value};
 }
 function primary(){
  let node;
  if(peek()==='('){take();node={kind:'group',child:add()};node.value=node.child.value;if(peek()!==')')throw Error('Missing bracket');take()}
  else{const t=take();if(!t||!['number','variable'].includes(t.kind))throw Error('Expected a term');node={...t}}
  while(peek()==='%'){take();node={kind:'percent',child:node,value:node.value===undefined?undefined:node.value/100}}
  return node;
 }
 function power(){const left=primary();return peek()==='^'?(take(),binary('^',left,unary())):left}
 function unary(){
  if(['+','-','√'].includes(peek())){const op=take().text,child=unary();if(op==='√'&&child.value<0)throw Error('Negative square root');return{kind:'unary',op,child,value:child.value===undefined?undefined:op==='-'?-child.value:op==='√'?Math.sqrt(child.value):child.value}}
  return power();
 }
 function multiply(){
  let node=unary();
  while(pos<tokens.length){
   if(['×','÷'].includes(peek())){const op=take().text;node=binary(op,node,unary())}
   else if(tokens[pos].kind==='variable'||['(','√'].includes(peek())||tokens[pos].kind==='number'&&tokens[pos-1]?.text===')')node=binary('×',node,unary());
   else break;
  }
  return node;
 }
 function add(){let node=multiply();while(['+','-'].includes(peek())){const op=take().text;node=binary(op,node,multiply())}return node}
 try{
  const left=add();let right=null,hasEquals=false;
  if(peek()==='='){take();hasEquals=true;if(pos<tokens.length)right=add()}
  if(pos!==tokens.length)return null;
  function literal(node){
   if(node.kind==='number'&&!/[eE]/.test(node.text))return node.text;
   if(node.kind!=='unary'||!['+','-'].includes(node.op)||node.child.kind!=='number'||/[eE]/.test(node.child.text))return null;
   const text=node.child.text;
   return node.op==='+'?text:text.startsWith('-')?text.slice(1):'-'+text.replace(/^\+/,'');
  }
  const a=left.kind==='binary'?literal(left.left):null,b=left.kind==='binary'?literal(left.right):null,result=right?literal(right):null;
  const simple=a!==null&&b!==null&&['+','-','×','÷'].includes(left.op)&&(!right||result!==null);
  const expression=tokens.map(t=>t.text).join(' ').replace(/\(\s+/g,'(').replace(/\s+\)/g,')').replace(/\s+%/g,'%').replace(/(\d)\s+([A-Za-z\u0370-\u03ff])/g,'$1$2').replace(/\s*\^\s*/g,'^').replace(/√\s+/g,'√').replace(/([A-Za-z0-9\u0370-\u03ff)%])\s+\(/g,'$1(');
  return{left,right,hasEquals,expression,simple,a,b,op:left.op,result};
 }catch{return null}
}

function paddedNumbers(values,op){
 if(!['+','-'].includes(op))return values;
 const places=Math.max(...values.filter(v=>v!==null).map(v=>(v.split('.')[1]||'').length));
 return values.map(v=>v===null||!places?v:v.includes('.')?v+('0'.repeat(places-(v.split('.')[1]||'').length)):v+'.'+'0'.repeat(places));
}
function numberRow(text,right,y,cell){
 // One fixed column per character keeps decimal points aligned in every font.
 return `<text y="${y}" text-anchor="middle">${Array.from(text,(c,i)=>`<tspan x="${right-(text.length-i-.5)*cell}">${esc(c)}</tspan>`).join('')}</text>`;
}
function verticalSvg(a,op,b,result=null){
 [a,b,result]=paddedNumbers([a,b,result],op);
 const cell=37,fontSize=58,maxChars=Math.max(a.length,b.length,result?.length||0),W=Math.max(210,(maxChars+2)*cell+40),H=result===null?190:250,right=W-24;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`+
 `<rect width="100%" height="100%" fill="white"/>`+
 `<g fill="#17324d" font-family="${font()}" font-size="${fontSize}" font-weight="700">`+
 numberRow(a,right,64,cell)+numberRow(b,right,126,cell)+`<text x="24" y="126">${esc(op)}</text>`+
 (result===null?'':numberRow(result,right,212,cell))+
 `</g><line x1="20" y1="148" x2="${right+4}" y2="148" stroke="#17324d" stroke-width="5" stroke-linecap="round"/>`+
 `</svg>`;
 return{svg,W,H};
}

function divisionSvg(dividend,divisor){
 const fontSize=58,digits=Math.max(1,dividend.length);
 const dividendWidth=Math.max(140,digits*42+30),roofX=Math.max(94,divisor.length*42+48),W=roofX+dividendWidth+24,H=280;
 const roofY=72,roofEnd=W-18;
 const dividendX=roofX+18,numberY=132,divisorX=roofX-22;
 const bracketBottom=numberY+24,corner=12;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`+
 `<rect width="100%" height="100%" fill="white"/>`+
 `<g fill="#17324d" font-family="${font()}" font-size="${fontSize}" font-weight="700">`+
 `<text x="${divisorX}" y="${numberY}" text-anchor="end">${esc(divisor)}</text>`+
 `<text x="${dividendX}" y="${numberY}" text-anchor="start">${esc(dividend)}</text>`+
 `</g>`+
 `<path d="M ${roofX} ${bracketBottom} L ${roofX} ${roofY+corner} Q ${roofX} ${roofY} ${roofX+corner} ${roofY} L ${roofEnd} ${roofY}" fill="none" stroke="#17324d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`+
 `</svg>`;
 return{svg,W,H};
}

function inlineSvg(expression){
 const W=Math.max(240,expression.length*31+48),H=120;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="white"/><text x="24" y="78" font-family="${font()}" font-size="52" font-weight="700" fill="#17324d" textLength="${W-48}" lengthAdjust="spacingAndGlyphs">${esc(expression)}</text></svg>`;
 return{svg,W,H};
}
function positionedInlineSvg(expression,placement){
 const W=Math.max(8,placement.w*Math.max(1,cssW)),H=Math.max(8,placement.h*Math.max(1,cssH));
 let metrics={width:expression.length*60,actualBoundingBoxAscent:78,actualBoundingBoxDescent:8,actualBoundingBoxLeft:0,actualBoundingBoxRight:expression.length*60};
 if(typeof ctx!=='undefined'&&typeof ctx.measureText==='function'){
  ctx.save();try{ctx.font=`700 100px ${font()}`;metrics=ctx.measureText(expression)}finally{ctx.restore()}
 }
 const advance=Math.max(1,Number(metrics.width)||expression.length*60),ascent=Math.max(1,Number(metrics.actualBoundingBoxAscent)||78),descent=Math.max(0,Number.isFinite(metrics.actualBoundingBoxDescent)?metrics.actualBoundingBoxDescent:8);
 const left=Number.isFinite(metrics.actualBoundingBoxLeft)?metrics.actualBoundingBoxLeft:0,right=Number.isFinite(metrics.actualBoundingBoxRight)?metrics.actualBoundingBoxRight:advance;
 const sx=W/Math.max(1,left+right),sy=H/(ascent+descent),size=100*sy;
 // Fit the visible glyph bounds directly over the selected ink, without padding
 // or an opaque background that could move or cover nearby teaching material.
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><text x="${left*sx}" y="${ascent*sy}" font-family="${font()}" font-size="${size}" font-weight="700" fill="#17324d" textLength="${advance*sx}" lengthAdjust="spacingAndGlyphs">${esc(expression)}</text></svg>`;
 return{svg,W,H};
}
function equationObject(parsed,options={}){
 const {a,op,b,result,simple,expression}=parsed,isDivision=simple&&op==='÷'&&!parsed.right;
 const inline=options.layout==='inline',placement=inline&&options.placement;
 const made=inline?(placement?positionedInlineSvg(expression,placement):inlineSvg(expression)):isDivision?divisionSvg(a,b):simple&&op!=='÷'?verticalSvg(a,op,b,result):inlineSvg(expression),svg=made.svg;
 const pxW=made.W,pxH=made.H;
 const W=Math.max(1,cssW),H=Math.max(1,cssH),scale=Math.min(1,W*.78/pxW,H*.55/pxH),w=pxW*scale/W,h=pxH*scale/H;
 const obj={type:'image',src:svgData(svg),x:clamp(isDivision?.24:.31,0,1-w),y:clamp(isDivision?.18:.24,0,1-h),w,h,smartGenerated:true,smartType:'equation',smartId:uid(),smartOriginal:[],equationExpression:expression,equationLayout:inline?'inline':isDivision?'long-division':simple&&op!=='÷'?'vertical':'inline'};
 if(placement){obj.x=placement.x;obj.y=placement.y;obj.w=made.W/W;obj.h=made.H/H}
 return obj;
}
function make(parsed){
 const obj=equationObject(parsed);
 strokes.push(obj);redraw();syncUi();try{tool='select';syncUi()}catch{}notify(L.made);
}
// The handwriting action uses the same parser, SVG renderer and fonts as Equation.
window.WhiteboardEquationFormatter=Object.freeze({
 create:text=>{const parsed=parseEquation(text);return parsed?equationObject(parsed):null},
 createInline:(text,placement)=>{const parsed=parseEquation(text);return parsed?equationObject(parsed,{layout:'inline',placement}):null},
 font
});

function openPanel(){
 close();panel=document.createElement('div');
 panel.style.cssText='position:absolute;z-index:10120;left:50%;top:16px;transform:translateX(-50%);width:min(380px,calc(100% - 24px));padding:12px;background:rgba(255,255,255,.99);border:1px solid #cfd9de;border-radius:13px;box-shadow:0 10px 28px rgba(18,32,46,.2)';
 const title=document.createElement('div');title.textContent=L.title;title.style.cssText='font-weight:950;color:#17324d;margin-bottom:7px';
 const inp=document.createElement('input');inp.type='text';inp.placeholder=L.hint;inp.maxLength=180;inp.autocomplete='off';inp.setAttribute('aria-label',L.title);inp.style.cssText='width:100%;padding:9px 10px;border:1px solid #cfd9de;border-radius:9px;margin-bottom:9px;font-weight:800;color:#17324d';
 const row=document.createElement('div');row.style.cssText='display:flex;gap:7px';
 const ok=document.createElement('button');ok.type='button';ok.className='btn soft';ok.textContent=L.format;ok.style.flex='1';
 const ca=document.createElement('button');ca.type='button';ca.className='btn';ca.textContent=L.cancel;
 ok.onclick=()=>{const parsed=parseEquation(inp.value);if(!parsed){notify(L.bad);return}close();make(parsed)};
 inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ok.click()}});
 ca.onclick=close;row.append(ok,ca);panel.append(title,inp,row);wrap.appendChild(panel);setTimeout(()=>inp.focus(),0);
}

document.addEventListener('click',e=>{
 const b=e.target?.closest?.('button');if(!b)return;
 if(!MENU_LABELS.has((b.textContent||'').trim()))return;
 if(b.id==='smartMathBtn')return;
 const parent=b.parentElement;
 if(!parent||!parent.style||parent.style.position!=='fixed')return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();parent.style.display='none';openPanel();
},true);

document.addEventListener('keydown',e=>{if(e.key==='Escape')close()},true);
})();
