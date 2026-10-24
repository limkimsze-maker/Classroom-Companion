/* Alpha Word page viewer. All DOCX parsing and drawing stays on this device. */
(function(){
'use strict';
const base=new URL('.',document.currentScript.src);
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const W14='http://schemas.microsoft.com/office/word/2010/wordml';
const WP='http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
const A='http://schemas.openxmlformats.org/drawingml/2006/main';
const MC='http://schemas.openxmlformats.org/markup-compatibility/2006';
const V='urn:schemas-microsoft-com:vml';
const R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const WPG='http://schemas.microsoft.com/office/word/2010/wordprocessingGroup';
const emu=n=>(Number(n)||0)/9525;
const all=(el,ns,name)=>Array.from(el?.getElementsByTagNameNS(ns,name)||[]);
const one=(el,ns,name)=>all(el,ns,name)[0];
const child=(el,ns,name)=>Array.from(el?.children||[]).find(e=>e.namespaceURI===ns&&e.localName===name);
const attr=(el,name)=>el?.getAttributeNS(W,name)??el?.getAttribute(name);
const val=el=>attr(el,'val');
const xml=text=>new DOMParser().parseFromString(text,'application/xml');
const fonts='"CC Arial",sans-serif';
let fontKinds=new Map();
let themeFamilies={minor:'Calibri',major:'Cambria'};
let engines;
function load(src,name){
 if(window[name])return Promise.resolve();
 return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL(src,base);s.onload=resolve;s.onerror=()=>{s.remove();reject(Error('Word viewer could not load'))};document.head.appendChild(s)});
}
function init(){
 if(!engines)engines=Promise.all([load('vendor/moe/jszip.min.js?v=3.10.1','JSZip'),load('vendor/moe/docx-layout.js?v=0.4.0-20261024','docx')]).catch(e=>{engines=null;throw e});
 if(!document.getElementById('ccWordFonts')){
  const s=document.createElement('style');s.id='ccWordFonts';
  s.textContent=[['CC Arial','LiberationSans-Regular',400,'normal'],['CC Arial','LiberationSans-Bold',700,'normal'],['CC Arial','LiberationSans-Italic',400,'italic'],['CC Arial','LiberationSans-BoldItalic',700,'italic'],['CC Times','LiberationSerif-Regular',400,'normal'],['CC Calibri','Carlito-Regular',400,'normal'],['CC Comic','ComicNeue-Regular',400,'normal'],['CC Comic','ComicNeue-Bold',700,'normal'],['CC Comic','ComicNeue-Italic',400,'italic'],['CC Comic','ComicNeue-BoldItalic',700,'italic']].map(([family,file,weight,style])=>`@font-face{font-family:"${family}";src:url("${new URL('vendor/moe/fonts/'+file+'.woff',base)}");font-weight:${weight};font-style:${style};font-display:block}`).join('\n');
  s.textContent+='\n.ccword-wrapper{padding:0!important;background:transparent!important;display:block!important}.ccword-wrapper>section.ccword{margin:0!important;box-shadow:none!important;position:relative;flex-shrink:0}.ccword-wrapper article{position:relative}.ccword-wrapper section>article>:first-child{margin-top:0!important}.ccword-floats{position:absolute;inset:0;pointer-events:none;overflow:visible}.ccword-floats p{margin:0}.ccword-floats svg{overflow:visible}.ccword-floats *{box-sizing:border-box}';
  document.head.appendChild(s);
 }
 return engines;
}
function family(name){
 if(/^var\(/.test(name||''))name=themeFamilies[/docx-major/.test(name)?'major':'minor'];
 const safe=String(name||'Calibri').replace(/["\\\r\n<>]/g,'');
 const fallback=/arial|helvetica/i.test(safe)?fonts:/times/i.test(safe)?'"CC Times",serif':/calibri/i.test(safe)?'"CC Calibri",sans-serif':'sans-serif';
 const generic={roman:'serif',swiss:'sans-serif',modern:'monospace',script:'cursive',decorative:'fantasy'}[fontKinds.get(safe)]||'sans-serif';
 if(/^comic sans(?: ms)?$/i.test(safe))return `"${safe}","CC Comic",cursive`;
 return /^(arial|helvetica|times new roman|calibri)$/i.test(safe)?`"${safe}",${fallback}`:`"${safe}",${generic}`;
}
function runStyle(rPr){
 const out={};if(!rPr)return out;
 const f=child(rPr,W,'rFonts'),size=val(child(rPr,W,'sz'));
 if(f){const themed=attr(f,'asciiTheme')||attr(f,'hAnsiTheme'),name=attr(f,'ascii')||attr(f,'hAnsi')||(themed?themeFamilies[themed.startsWith('major')?'major':'minor']:null);if(name)out['font-family']=family(name)}
 if(size)out['font-size']=`${Number(size)/2}pt`;
 const b=child(rPr,W,'b'),i=child(rPr,W,'i');
 if(b)out['font-weight']=val(b)==='0'?'normal':'bold';
 if(i)out['font-style']=val(i)==='0'?'normal':'italic';
 const color=val(child(rPr,W,'color'));if(/^[\da-f]{6}$/i.test(color))out.color='#'+color;
 const u=val(child(rPr,W,'u'));if(u&&u!=='none')out['text-decoration']='underline';
 return out;
}
function resolveProperties(styles,id,seen=new Set()){
 if(!id||seen.has(id))return {run:{},spacing:{}};seen.add(id);
 const s=styles.get(id);if(!s)return {run:{},spacing:{}};
 const inherited=resolveProperties(styles,val(child(s,W,'basedOn')),seen);
 return {run:{...inherited.run,...runStyle(child(s,W,'rPr'))},spacing:{...inherited.spacing,...spacing(child(child(s,W,'pPr'),W,'spacing'))}};
}
function spacing(el){const out={};for(const key of ['line','lineRule','before','after','beforeLines','afterLines']){const n=attr(el,key);if(n!=null)out[key]=n}return out}
function normalLine(style){
 const size=parseFloat(style['font-size']||'11')*4/3;
 const c=document.createElement('canvas').getContext('2d');
 c.font=`${style['font-style']||'normal'} ${style['font-weight']||'normal'} ${size}px ${style['font-family']||family('Calibri')}`;
 const name=style['font-family']||'';
 if(/CC Arial/.test(name))return size*2355/2048;
 if(/CC Times/.test(name))return size*2355/2048;
 if(/CC Calibri/.test(name))return size*1.220703125;
 const m=c.measureText('Hg');return (m.fontBoundingBoxAscent+m.fontBoundingBoxDescent)||size*1.15;
}
function visit(el,fn){if(!el)return;fn(el);for(const c of el.children||[])visit(c,fn)}
function prepareModel(doc,meta){
 const roots=[doc.documentPart.body,...(doc.parts||[]).map(p=>p.rootElement).filter(Boolean)];
 const seen=new Set();
 for(const root of roots)visit(root,e=>{
  if(seen.has(e))return;seen.add(e);
  if(e.type==='table'&&e.cssStyle?.float){e.cssStyle['margin-left']='0';e.cssStyle['margin-right']='0'}
  for(let i=0;i<(e.children?.length||0);i++){
   const table=e.children[i],following=meta.get(e.children[i+1]?.paraId);
   if(table.type==='table'&&table.cssStyle?.float&&following){
    const s=following.spacing,size=parseFloat(following.run['font-size']||11)*4/3;
    table.cssStyle['margin-bottom']=(s.beforeLines!=null?size*Number(s.beforeLines)/100:Number(s.before||0)/15)+'px';
   }
  }
  if(e.cssStyle?.['font-family']){
   const first=e.cssStyle['font-family'].split(',')[0].replace(/["']/g,'');e.cssStyle['font-family']=family(first);
  }
  const m=meta.get(e.paraId);if(!m)return;
  e.cssStyle={...e.cssStyle,...m.run};
  const s=m.spacing,line=Math.max(normalLine(m.run),...m.lines.map(normalLine));
  if(s.lineRule==='exact')e.cssStyle['line-height']=`${Number(s.line)/20}pt`;
  else if(s.lineRule==='atLeast')e.cssStyle['line-height']=`${Math.max(line,Number(s.line)/15)}px`;
  else e.cssStyle['line-height']=`${line*(Number(s.line||240)/240)}px`;
  // before/afterLines take precedence over the twip fallback in Word.
  if(s.beforeLines!=null)e.cssStyle['margin-top']=`${parseFloat(m.run['font-size']||11)*4/3*Number(s.beforeLines)/100}px`;
  if(s.afterLines!=null)e.cssStyle['margin-bottom']=`${parseFloat(m.run['font-size']||11)*4/3*Number(s.afterLines)/100}px`;
  if((!s.lineRule||s.lineRule==='auto')&&Number(s.line||240)>240){e.cssStyle.position='relative';e.cssStyle.top=`${-line*(Number(s.line)/240-1)/2}px`}
 });
}
async function preparePackage(data){
 const zip=await JSZip.loadAsync(data),meta=new Map(),floats=[];
 const theme=xml(await zip.file('word/theme/theme1.xml')?.async('string')||'<theme/>');
 themeFamilies={minor:one(one(theme,A,'minorFont'),A,'latin')?.getAttribute('typeface')||'Calibri',major:one(one(theme,A,'majorFont'),A,'latin')?.getAttribute('typeface')||'Cambria'};
 const fontTable=xml(await zip.file('word/fontTable.xml')?.async('string')||'<fonts/>');
 fontKinds=new Map(all(fontTable,W,'font').map(f=>[attr(f,'name'),val(child(f,W,'family'))]));
 const styleXml=xml(await zip.file('word/styles.xml')?.async('string')||'<styles/>');
 const styles=new Map(all(styleXml,W,'style').map(s=>[attr(s,'styleId'),s]));
 const defaults=one(styleXml,W,'docDefaults');
 const defaultRun={ 'font-family':family('Calibri'),'font-size':'11pt',...runStyle(one(defaults,W,'rPr'))};
 const defaultSpacing=spacing(one(defaults,W,'spacing'));
 let serial=0;
 for(const file of Object.values(zip.files).filter(f=>/^word\/(document|header\d*|footer\d*)\.xml$/.test(f.name))){
  const part=xml(await file.async('string'));
  for(const p of all(part,W,'p')){
   const id='CC'+String(++serial).padStart(6,'0');p.setAttributeNS(W14,'w14:paraId',id);
   const pp=child(p,W,'pPr'),inherited=resolveProperties(styles,val(child(pp,W,'pStyle')));
   const mark=child(pp,W,'rPr');
   const run={...defaultRun,...inherited.run,...runStyle(mark)};
   const lines=Array.from(p.children).filter(r=>r.namespaceURI===W&&r.localName==='r'&&one(r,W,'t')).map(r=>({...run,...runStyle(child(r,W,'rPr'))}));
   meta.set(id,{run,lines,spacing:{...defaultSpacing,...inherited.spacing,...spacing(child(pp,W,'spacing'))}});
  }
  // Floating drawings have their own coordinate system. Keep them out of the
  // text flow and restore them on their source page after pagination.
  for(const anchor of all(part,WP,'anchor')){
   // Retain native group and custom-path rendering in the document engine.
   if(one(anchor,WPG,'wgp')||one(anchor,A,'custGeom'))continue;
   let p=anchor.parentElement;while(p&&!(p.namespaceURI===W&&p.localName==='p'))p=p.parentElement;
   if(!p)continue;
   floats.push({anchor:anchor.cloneNode(true),paraId:p.getAttributeNS(W14,'paraId'),part:file.name});
   const ac=anchor.closest('AlternateContent')||anchor.parentElement;
   if(ac.namespaceURI===MC)ac.remove();else anchor.remove();
  }
  zip.file(file.name,new XMLSerializer().serializeToString(part));
 }
 return {data:await zip.generateAsync({type:'uint8array'}),zip,meta,floats,theme};
}
function svgNode(name,attrs={}){const el=document.createElementNS('http://www.w3.org/2000/svg',name);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);return el}
function color(el,fallback,theme){
 const rgb=one(el,A,'srgbClr'),sys=one(el,A,'sysClr');
 const v=rgb?.getAttribute('val')||sys?.getAttribute('lastClr');
 if(/^[\da-f]{6}$/i.test(v))return '#'+v;
 const scheme=one(el,A,'schemeClr')?.getAttribute('val'),aliases={tx1:'dk1',tx2:'dk2',bg1:'lt1',bg2:'lt2'};
 const ref=theme&&one(theme,A,aliases[scheme]||scheme);
 return ref?color(ref,fallback):fallback;
}
function presetGeometry(name,w,h,adjustments){
 if(name==='line')return svgNode('line',{x1:0,y1:0,x2:w,y2:h});
 if(name==='ellipse')return svgNode('ellipse',{cx:w/2,cy:h/2,rx:w/2,ry:h/2});
 if(name==='triangle')return svgNode('polygon',{points:`${w/2},0 ${w},${h} 0,${h}`});
 if(name==='irregularSeal2'){
  // ECMA-376 preset vertices, on the standard 21600 by 21600 coordinate grid.
  const pts=[[11462,4342],[9722,1887],[8550,6382],[4502,3625],[5372,7817],[1172,8270],[3935,11592],[0,12877],[3330,15370],[1285,17825],[4805,18240],[4917,21600],[7527,18125],[8700,19712],[9872,17370],[11612,18842],[12180,15935],[14942,17370],[14640,14350],[18877,15632],[16380,12310],[18270,11290],[16985,9402],[21600,6645],[16380,6532],[18007,3172],[14525,5777],[14790,0]];
  return svgNode('polygon',{points:pts.map(([x,y])=>`${x*w/21600},${y*h/21600}`).join(' ')});
 }
 const d=docx.presetGeometryToSvgPath(name,w,h,adjustments);
 return d?svgNode('path',{d}):svgNode('rect',{x:0,y:0,width:w,height:h});
}
function textBox(anchor,shape,host,pkg){
 const content=one(anchor,W,'txbxContent');if(!content)return;
 const body=one(shape,A,'bodyPr')||all(shape,'http://schemas.microsoft.com/office/word/2010/wordprocessingShape','bodyPr')[0];
 const box=document.createElement('div');box.style.cssText='position:absolute;inset:0;overflow:visible;display:flex;flex-direction:column;';
 for(const [key,css,def]of[['lIns','paddingLeft',91440],['rIns','paddingRight',91440],['tIns','paddingTop',45720],['bIns','paddingBottom',45720]])box.style[css]=emu(body?.getAttribute(key)??def)+'px';
 const align=body?.getAttribute('anchor');if(align==='ctr')box.style.justifyContent='center';else if(align==='b')box.style.justifyContent='flex-end';
 for(const p of Array.from(content.children).filter(e=>e.localName==='p')){
  const out=document.createElement('p'),pp=child(p,W,'pPr'),m=pkg.meta.get(p.getAttributeNS(W14,'paraId'));out.style.cssText='margin:0;line-height:normal;white-space:pre-wrap;';
  Object.assign(out.style,m?.run,runStyle(child(pp,W,'rPr')));out.style.textAlign=val(child(pp,W,'jc'))||'left';
  if(body?.getAttribute('wrap')==='none')out.style.whiteSpace='pre';
  for(const r of Array.from(p.children).filter(e=>e.localName==='r')){
   const span=document.createElement('span');Object.assign(span.style,runStyle(child(r,W,'rPr')));
   for(const c of r.children){if(c.localName==='t')span.append(document.createTextNode(c.textContent));else if(c.localName==='br')span.append(document.createElement('br'));else if(c.localName==='tab')span.append(document.createTextNode('\t'))}
   out.append(span);
  }
  box.append(out);
 }
 host.append(box);
}
function position(anchor,axis,page,p,anchorOrigins){
 const el=child(anchor,WP,axis==='x'?'positionH':'positionV'),rel=el?.getAttribute('relativeFrom');
 const cs=getComputedStyle(page),pr=page.getBoundingClientRect(),rr=p.getBoundingClientRect();
 const horizontal=axis==='x',full=horizontal?page.offsetWidth:page.offsetHeight;
 const before=parseFloat(horizontal?cs.paddingLeft:cs.paddingTop)||0,after=parseFloat(horizontal?cs.paddingRight:cs.paddingBottom)||0;
 let origin=rel==='page'?0:(rel==='paragraph'||rel==='line')?(horizontal?rr.left-pr.left:rr.top-pr.top):before;
 const original=anchorOrigins.get(p);
 if(!horizontal&&(rel==='paragraph'||rel==='line')&&original?.section===page)origin=original.top;
 if(horizontal&&rel==='column')origin=rr.left-pr.left-(parseFloat(getComputedStyle(p).marginLeft)||0);
 if(rel==='character')origin=rr.left-pr.left;
 const offset=child(el,WP,'posOffset');if(offset)return origin+emu(offset.textContent);
 const align=child(el,WP,'align')?.textContent,extent=child(anchor,WP,'extent'),size=emu(extent?.getAttribute(horizontal?'cx':'cy'));
 const area=rel==='page'?full:full-before-after;
 if(align==='center')origin+=(area-size)/2;else if(align==='right'||align==='bottom'||align==='outside')origin+=area-size;
 return origin;
}
async function addFloats(pkg,root,anchorOrigins){
 for(const f of pkg.floats)for(const p of root.querySelectorAll(`[data-para-id="${f.paraId}"]`)){
  const page=p.closest('section.ccword');if(!page)continue;
  let overlay=page.querySelector(':scope>.ccword-floats');if(!overlay){overlay=document.createElement('div');overlay.className='ccword-floats';page.append(overlay)}
  const anchor=f.anchor,ext=child(anchor,WP,'extent'),w=emu(ext?.getAttribute('cx')),h=emu(ext?.getAttribute('cy'));
  const host=document.createElement('div');host.className='ccword-floating-object';
  host.style.cssText=`position:absolute;left:${position(anchor,'x',page,p,anchorOrigins)}px;top:${position(anchor,'y',page,p,anchorOrigins)}px;width:${w}px;height:${h}px;`;
  host.dataset.anchorParagraph=f.paraId;
  const spPr=one(anchor,'http://schemas.microsoft.com/office/word/2010/wordprocessingShape','spPr')||one(anchor,'http://schemas.openxmlformats.org/drawingml/2006/picture','spPr')||one(anchor,A,'spPr');
  const geom=one(spPr,A,'prstGeom')?.getAttribute('prst')||'rect';
  const xfrm=one(spPr,A,'xfrm'),rot=Number(xfrm?.getAttribute('rot')||0)/60000;
  if(rot)host.style.transform=`rotate(${rot}deg)`;
  const flipX=xfrm?.getAttribute('flipH')==='1',flipY=xfrm?.getAttribute('flipV')==='1';
  if(flipX||flipY)host.style.transform=(host.style.transform||'')+` scale(${flipX?-1:1},${flipY?-1:1})`;
  const picture=one(anchor,A,'blip');
  if(picture){
   const relId=picture.getAttributeNS(R,'embed'),partName=f.part.split('/').pop(),relsPath=f.part.replace(partName,'_rels/'+partName+'.rels');
   const rels=xml(await pkg.zip.file(relsPath)?.async('string')||'<Relationships/>');
   const rel=Array.from(rels.documentElement.children).find(e=>e.getAttribute('Id')===relId&&e.getAttribute('TargetMode')!=='External');
   const target=rel?.getAttribute('Target');
   if(target){const path=new URL(target,'https://local.invalid/'+f.part).pathname.slice(1),file=pkg.zip.file(path);if(file){
    const image=document.createElement('img'),ext=path.split('.').pop().toLowerCase(),mime={jpg:'jpeg',jpeg:'jpeg',svg:'svg+xml',gif:'gif',webp:'webp',bmp:'bmp'}[ext]||'png';
    image.src='data:image/'+mime+';base64,'+await file.async('base64');image.style.cssText='width:100%;height:100%;display:block';
    const crop=one(anchor,A,'srcRect');if(crop){const l=Number(crop.getAttribute('l')||0)/100000,r=Number(crop.getAttribute('r')||0)/100000,t=Number(crop.getAttribute('t')||0)/100000,b=Number(crop.getAttribute('b')||0)/100000;host.style.overflow='hidden';Object.assign(image.style,{position:'absolute',width:100/Math.max(.01,1-l-r)+'%',height:100/Math.max(.01,1-t-b)+'%',left:-100*l/Math.max(.01,1-l-r)+'%',top:-100*t/Math.max(.01,1-t-b)+'%'})}
    host.append(image);
   }}
  }else{
   const line=child(spPr,A,'ln'),fill=child(spPr,A,'solidFill'),noFill=!!child(spPr,A,'noFill');
   const lnRef=one(anchor,A,'lnRef'),lineStyles=one(pkg.theme,A,'lnStyleLst');
   const themeLine=lineStyles?.children[Number(lnRef?.getAttribute('idx')||0)-1];
   const shape=one(anchor,'http://schemas.microsoft.com/office/word/2010/wordprocessingShape','wsp')||anchor;
   const svg=svgNode('svg',{width:Math.max(1,w),height:Math.max(1,h),viewBox:`0 0 ${Math.max(1,w)} ${Math.max(1,h)}`});svg.style.cssText='position:absolute;left:0;top:0;overflow:visible';
   const adjustments={};for(const gd of all(one(spPr,A,'avLst'),A,'gd')){const m=/^val\s+(-?\d+)$/.exec(gd.getAttribute('fmla')||'');if(m)adjustments[gd.getAttribute('name')]=Number(m[1])}
   const path=presetGeometry(geom,w,h,adjustments);path.setAttribute('fill',geom==='line'||noFill?'none':color(fill||one(anchor,A,'fillRef'),'white',pkg.theme));
   path.setAttribute('stroke',child(line,A,'noFill')?'none':color(line||lnRef,'black',pkg.theme));
   path.setAttribute('stroke-width',line?.hasAttribute('w')?emu(line.getAttribute('w')):themeLine?emu(themeLine.getAttribute('w')):1);
   path.setAttribute('stroke-linejoin','round');svg.append(path);host.append(svg);textBox(anchor,shape,host,pkg);
  }
  overlay.append(host);
 }
}
function splitParagraph(p,bottom){
 if(!/^P$/.test(p.tagName))return null;
 const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT),nodes=[];let n,total=0;
 while((n=walker.nextNode())){if(n.nodeValue.length){nodes.push({node:n,start:total});total+=n.nodeValue.length}}
 if(total<2)return null;
 const range=document.createRange();
 const point=index=>{let i=nodes.length-1;while(i>0&&nodes[i].start>index)i--;return {node:nodes[i].node,offset:index-nodes[i].start}};
 const rect=index=>{const at=point(index);range.setStart(at.node,at.offset);range.setEnd(at.node,at.offset+1);return range.getBoundingClientRect()};
 const leading=Math.max(0,(parseFloat(getComputedStyle(p).lineHeight)-rect(0).height)/2);
 const lines=[];
 for(const item of nodes){range.selectNodeContents(item.node);for(const r of range.getClientRects())if(r.height&&r.width&&!lines.some(y=>Math.abs(y-r.top)<.5))lines.push(r.top)}
 lines.sort((a,b)=>a-b);
 let fit=lines.filter(y=>y+rect(0).height+leading<=bottom+.5).length;
 if(lines.length-fit===1&&fit>2)fit--;
 if(fit<2||fit>=lines.length)return null;
 const target=lines[fit];let lo=0,hi=total-1;
 while(lo<hi){const mid=(lo+hi)>>1;if(rect(mid).top<target-.5)lo=mid+1;else hi=mid}
 if(lo===0)return null;
 const at=point(lo),tail=p.cloneNode(false);tail.dataset.wordContinuation='true';
 range.setStart(at.node,at.offset);range.setEnd(p,p.childNodes.length);tail.append(range.extractContents());
 tail.style.textIndent='0';tail.style.marginTop='0';p.style.marginBottom='0';p.after(tail);
 return tail;
}
function splitTable(table,bottom){
 if(table.tagName!=='TABLE')return null;
 const rows=Array.from(table.querySelectorAll(':scope>tbody>tr,:scope>tr'));
 const fit=rows.filter(row=>row.getBoundingClientRect().bottom<=bottom+.5).length;
 if(fit<1||fit>=rows.length)return null;
 const tail=table.cloneNode(false);
 for(const col of table.querySelectorAll(':scope>colgroup,:scope>thead'))tail.append(col.cloneNode(true));
 const body=document.createElement('tbody');rows.slice(fit).forEach(row=>body.append(row));tail.append(body);table.after(tail);return tail;
}
function paginate(root){
 // The engine handles explicit breaks and sections. Split long flowing content
 // at actual block boundaries once fonts, images and tab widths have settled.
 for(const page of Array.from(root.querySelectorAll('section.ccword'))){
  const article=page.querySelector(':scope>article');if(!article)continue;
  const cs=getComputedStyle(page),limit=parseFloat(cs.minHeight)-parseFloat(cs.paddingBottom);
  if(!Number.isFinite(limit))continue;
  let current=page,currentArticle=article;
  let block=article.firstElementChild;
  while(block){
   const bottom=block.getBoundingClientRect().bottom-current.getBoundingClientRect().top;
   if(bottom<=limit+.75){block=block.nextElementSibling;continue}
   const boundary=current.getBoundingClientRect().top+limit;
   const avoid=getComputedStyle(block).breakInside==='avoid'&&block!==currentArticle.firstElementChild;
   const tail=avoid?null:(splitTable(block,boundary)||splitParagraph(block,boundary));
   if(tail)block=tail;
   else if(block===currentArticle.firstElementChild){block=block.nextElementSibling;continue}
   const next=page.cloneNode(false),nextArticle=article.cloneNode(false);delete next.dataset.wordNumberStart;
   for(const header of page.querySelectorAll(':scope>header'))next.append(header.cloneNode(true));
   next.append(nextArticle);for(const footer of page.querySelectorAll(':scope>footer'))next.append(footer.cloneNode(true));
   current.after(next);let node=block;while(node){const after=node.nextElementSibling;nextArticle.append(node);node=after}
   current=next;currentArticle=nextArticle;
  }
 }
}
function settleFullWidthTables(root){
 const origins=new Map(),tables=[];
 for(const table of root.querySelectorAll('article>table')){
  if(getComputedStyle(table).cssFloat==='none')continue;
  const article=table.parentElement;
  // A full-width floating table leaves no usable text column. CSS otherwise
  // lets zero-width blank lines sit beside it, unlike Word's paragraph flow.
  if(table.getBoundingClientRect().width>=article.getBoundingClientRect().width-.75){
   const tr=table.getBoundingClientRect(),section=table.closest('section.ccword'),sr=section.getBoundingClientRect();
   for(const p of article.querySelectorAll(':scope>p[data-para-id]')){
    const r=p.getBoundingClientRect();
    if(r.top>=tr.top-.5&&r.top<tr.bottom)origins.set(p,{section,top:r.top-sr.top});
   }
   tables.push(table);
  }
 }
 tables.forEach(table=>table.style.cssFloat='none');
 return origins;
}
async function render(data,root){
 await init();
 await Promise.all(['16px "CC Arial"','bold 16px "CC Arial"','16px "CC Times"','16px "CC Calibri"','16px "CC Comic"'].map(f=>document.fonts.load(f)));
 const pkg=await preparePackage(data);
 const options={className:'ccword',inWrapper:true,ignoreWidth:false,ignoreHeight:false,ignoreFonts:false,breakPages:true,ignoreLastRenderedPageBreak:false,experimental:true,useBase64URL:true,renderHeaders:true,renderFooters:true,renderComments:false};
 const doc=await docx.parseAsync(pkg.data,options);prepareModel(doc,pkg.meta);
 const nodes=await docx.renderDocument(doc,options);root.replaceChildren(...nodes);
 await document.fonts.ready;
 // The pinned engine calculates tab stops after insertion into the document.
 await new Promise(resolve=>setTimeout(resolve,550));
 const anchorOrigins=settleFullWidthTables(root);paginate(root);await addFloats(pkg,root,anchorOrigins);
 const pages=Array.from(root.querySelectorAll('section.ccword'));
 let pageNumber=1;
 const roman=n=>{let out='';for(const[v,s]of[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']])while(n>=v){out+=s;n-=v}return out};
 pages.forEach((page,i)=>{
  page.dataset.wordPage=String(i+1);
  if(page.dataset.wordNumberStart!=null)pageNumber=Number(page.dataset.wordNumberStart);
  for(const el of page.querySelectorAll('[data-field="PAGE"],[data-field="NUMPAGES"]')){
   const n=el.dataset.field==='NUMPAGES'?pages.length:pageNumber,format=el.dataset.fieldFormat||'',sectionFormat=page.dataset.wordNumberFormat;
   let text=String(n);if(/\\\*\s+ROMAN\b/.test(format)||sectionFormat==='upperRoman')text=roman(n);else if(/\\\*\s+roman\b/.test(format)||sectionFormat==='lowerRoman')text=roman(n).toLowerCase();
   const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),first=walker.nextNode();if(first){first.nodeValue=text;let next;while((next=walker.nextNode()))next.nodeValue=''}else el.textContent=text;
  }
  pageNumber++;
 });
 return {pages};
}
window.CCWordLayout={render};
})();
