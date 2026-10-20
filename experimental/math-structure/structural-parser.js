/* Original local implementation of recursive spatial parsing and bounded
 * hypothesis search. Research references and scope: RESEARCH.md.
 * No external services, weights, training data or third-party source code. */
(function(global){
'use strict';
function createStructuralParser(hooks){
 const {bounds,operatorStroke,operatorCrossing,radicalHook,radicalDescendingHook,
  radicalParenthesis,recognizeNumericContext,segment,predictDigit,rasterDigit,
  closedZeroInk,completeNumericExpression,checkCancelled}=hooks;
 const cap=x=>Math.max(.001,Math.min(.999,Number(x)||.001));
 const mean=a=>a.reduce((n,x)=>n+x,0)/Math.max(1,a.length);
 const unique=list=>[...new Set(list)];
 const latex=text=>text.replace(/×/g,'\\times ').replace(/÷/g,'\\div ').replace(/−/g,'-');
 const area=ps=>bounds(ps.map(p=>p.scaled));
 function join(type,children,marks,geometry,text,ids){
  const structural=type!=='inline',weight=children.reduce((s,c)=>s+c.weight,0)+2;
  const logScore=children.reduce((s,c)=>s+c.logScore,0)+2*Math.log(cap(geometry));
  return{type,children,marks,ids:ids.slice().sort((a,b)=>a-b),text,
   weight,logScore,score:Math.exp(logScore/weight),
   structures:children.reduce((s,c)=>s+c.structures,0)+(structural?1:0),
   tokens:children.flatMap(c=>c.tokens),uncertain:children.flatMap(c=>c.uncertain)};
 }
 function prune(items,K){
  const seen=new Set();return items.sort((a,b)=>b.score-a.score).filter(c=>{
   const key=c.type+':'+c.text;if(seen.has(key))return false;seen.add(key);return true;
  }).slice(0,K);
 }
 function labelGraph(tree,parts){
  const ids=new Map(parts.map(p=>[p.raw,p.id])),nodes=new Map(),edges=[];
  const label=char=>({'√':'\\sqrt','−':'-','×':'\\times','÷':'\\div'}[char]||char);
  function relation(a,b,type){for(const from of a)for(const to of b)if(from!==to)edges.push({from,to,label:type});}
  function symbol(strokeIds,char){
   if(!strokeIds.length||strokeIds.some(id=>nodes.has(id)))throw Error('Invalid symbol stroke assignment');
   strokeIds.forEach(id=>nodes.set(id,{id,label:label(char)}));relation(strokeIds,strokeIds,'*');return strokeIds;
  }
  function visit(n){
   if(n.type==='leaf'){
    const groups=n.tokens.map(t=>symbol(unique(t.parts.map(p=>ids.get(p.source)).filter(id=>id!==undefined)),t.char));
    for(let i=1;i<groups.length;i++)relation(groups[i-1],groups[i],'R');
    return{first:groups[0],last:groups.at(-1)};
   }
   const children=n.children.map(visit),marks=n.marks.map(m=>symbol(m.ids,m.char));
   if(n.type==='fraction'){
    relation(marks[0],children[0].first,'A');relation(marks[0],children[1].first,'B');return{first:marks[0],last:marks[0]};
   }
   if(n.type==='root'){relation(marks[0],children[0].first,'I');return{first:marks[0],last:marks[0]};}
   if(n.type==='group'){
    relation(marks[0],children[0].first,'R');relation(children[0].last,marks[1],'R');return{first:marks[0],last:marks[1]};
   }
   if(n.type==='inline'){
    relation(children[0].last,marks[0],'R');relation(marks[0],children[1].first,'R');return{first:children[0].first,last:children[1].last};
   }
   relation(children[0].last,children[1].first,n.type==='sup'?'Sup':'Sub');return children[0];
  }
  visit(tree);
  if(nodes.size!==parts.length)throw Error('Incomplete label graph');
  return{format:'CROHME primitive label graph',normalized:false,
   note:'Direct symbol-layout edges; inherited relations require normalization before official LgEval scoring.',
   nodes:[...nodes.values()].sort((a,b)=>a.id-b.id),edges};
 }
 async function recognize(strokes,W,H,options={}){
  if((options.mode||'auto')!=='auto'||options.disableStructuralV2||strokes.length<3||strokes.length>96)return null;
  checkCancelled(options);
  const parts=strokes.map((raw,id)=>{const scaled={source:raw,size:Number(raw.size)||4,
   points:raw.points.map(p=>({x:p.x*W,y:p.y*H}))};
   return{id,raw,scaled,box:bounds([scaled]),line:operatorStroke(scaled)};
  });
  // Plain inline text, ordinary units and isolated symbols retain V1 dispatch.
  const horizontal=parts.filter(p=>p.line.horizontal&&p.box.w>=14);
  const hasVertical=horizontal.some(p=>{
   const b=p.box,near=parts.filter(q=>q!==p&&q.box.cx>=b.x-b.w*.2&&q.box.cx<=b.x+b.w*1.2);
   const above=near.filter(q=>q.box.y+q.box.h<b.cy+2&&q.box.cy<b.cy-4);
   const below=near.filter(q=>q.box.y>b.cy-2&&q.box.cy>b.cy+4);
   return above.length&&below.length&&above.length+below.length===near.length&&
    Math.max(area(above).w,area(below).w)<b.w*1.34;
  });
  const opens=parts.filter(p=>radicalParenthesis(p.scaled)==='('),closes=parts.filter(p=>radicalParenthesis(p.scaled)===')');
  const hasBracket=opens.some(a=>closes.some(b=>b.box.x>a.box.x+a.box.w&&
   Math.abs(a.box.cy-b.box.cy)<Math.min(a.box.h,b.box.h)*.35));
  const hasRoot=horizontal.some(p=>parts.some(q=>{
   if(q===p)return false;
   const hook=radicalHook(q.scaled.points)||radicalDescendingHook(q.scaled.points);
   if(!hook)return false;
   const left=p.scaled.points.reduce((a,b)=>b.x<a.x?b:a,p.scaled.points[0]);
   return Math.abs(left.x-hook.end.x)<hook.box.h*.45&&Math.abs(left.y-hook.end.y)<hook.box.h*.55;
  }));
  if(!hasVertical&&!hasBracket&&!hasRoot)return null;
  const K=4,maxDepth=8,maxRegions=180,memo=new Map();let regions=0,exhausted=false;
  const partById=new Map(parts.map(p=>[p.id,p]));
  function mark(ids,char,score=.96){return{ids,char,score,parts:ids.map(id=>partById.get(id).scaled)};}
  function checked(node){
   const consumed=[...node.marks.flatMap(m=>m.ids),...node.children.flatMap(c=>c.ids)];
   return consumed.length===node.ids.length&&new Set(consumed).size===consumed.length&&
    node.ids.every(id=>consumed.includes(id));
  }
  async function leaves(ps){
   const ink=ps.map(p=>p.raw),ids=ps.map(p=>p.id),out=[];
   const glyphs=ps.filter(p=>!p.line.horizontal||p.box.h>4);
   if(glyphs.length>1){
    const centres=glyphs.map(p=>p.box.cy),height=Math.max(...glyphs.map(p=>p.box.h));
    if(Math.max(...centres)-Math.min(...centres)>height*.70)return out;
   }
   const base=await recognizeNumericContext(ink,W,H,{...options,measurementPrefix:true});
   if(base&&completeNumericExpression(base.text)){
    const score=mean(base.tokens.map(t=>cap(t.score)));
    out.push({type:'leaf',children:[],marks:[],ids,text:latex(base.text.replace(/\s+/g,'')),
     score,weight:Math.max(1,base.tokens.length),logScore:Math.log(cap(score))*Math.max(1,base.tokens.length),
     structures:0,tokens:base.tokens,uncertain:base.uncertain||[]});
   }
   // Preserve several symbol candidates until the numeric grammar is checked.
   // Never use an arithmetic answer to select a digit.
   const tokens=segment(ink,W,H);if(!tokens.length||tokens.length>16)return out;
   let beam=[{text:'',tokens:[],score:0}];
   for(const token of tokens){
    if(!token.parts?.length)return out;
    let choices=[];
    if(token.personal){
     if(!/^[0-9+−×÷=.]$/.test(token.char))return out;
     choices=[{char:token.char,score:cap(token.score),token}];
    }else if(['+','−','×','÷','=','.'].includes(token.char))choices=[{char:token.char,score:cap(token.score),token}];
    else{
     const pixels=rasterDigit(token.parts),digits=predictDigit(pixels);
     const pen=global.WhiteboardUjiReader?.read(token.parts.map(p=>p.points))||[];
     const image=global.WhiteboardCharacterInference?.predict(pixels,'auto')||[];
     const top=image[0],penTop=pen[0];
     // Strong agreement on an ordinary letter is not numerical evidence.
     if(top&&/^[A-Za-z]$/.test(top.char)&&!/[BIOQSZiloqsz]/.test(top.char)&&top.score>.9&&penTop?.label.toLowerCase()===top.char.toLowerCase())return out;
     const equivalent={O:'0',o:'0',I:'1',l:'1',Z:'2',z:'2',S:'5',s:'5',B:'8',g:'9',q:'9'};
     const family=(items,key,prob,c)=>items.reduce((n,p)=>n+((p[key]===c||equivalent[p[key]]===c)?p[prob]:0),0);
     choices=digits.map(d=>{
      const p=family(pen,'label','p',d.char),m=family(image,'char','score',d.char);
      let score=.35*d.score+.45*p+.20*m;
      if(d.char==='0'&&token.parts.length===1&&p>.95&&closedZeroInk(token.parts[0].source,W,H,.18))score=Math.max(score,.78);
      const uncertain=score<.85||d.char!==digits[0].char||penTop?.label!==d.char;
      return{char:d.char,score,token:{...token,char:d.char,score:uncertain?Math.min(.74,score):score,engine:'structural-symbol-hypothesis'}};
     }).filter(c=>c.score>=.18).sort((a,b)=>b.score-a.score).slice(0,3);
    }
    if(!choices.length)return out;
    beam=beam.flatMap(b=>choices.map(c=>({text:b.text+c.char,tokens:[...b.tokens,c.token],score:b.score+Math.log(cap(c.score))})))
     .sort((a,b)=>b.score-a.score).slice(0,K);
   }
   for(const b of beam){
    if(!completeNumericExpression(b.text))continue;
    const weight=Math.max(1,b.tokens.length),score=Math.exp(b.score/weight);
    out.push({type:'leaf',children:[],marks:[],ids,text:latex(b.text),score,weight,
     logScore:b.score,structures:0,tokens:b.tokens,uncertain:b.tokens.filter(t=>t.score<.85)});
   }
   return prune(out,K);
  }
  function operators(ps){
   const out=[];
   for(const p of ps)if(p.line.horizontal&&p.box.w>=8)out.push({ids:[p.id],box:p.box,char:'−',score:.91});
   for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){
    const a=ps[i],b=ps[j],u=a.line,v=b.line,box=area([a,b]);
    if(u.straight&&v.straight&&operatorCrossing(u,v)){
     if(u.horizontal&&v.vertical||v.horizontal&&u.vertical)out.push({ids:[a.id,b.id],box,char:'+',score:.98});
     else if(!u.horizontal&&!v.horizontal&&(u.z.x-u.a.x)*(u.z.y-u.a.y)*(v.z.x-v.a.x)*(v.z.y-v.a.y)<0)
      out.push({ids:[a.id,b.id],box,char:'×',score:.95});
    }
    if(u.horizontal&&v.horizontal&&Math.min(a.box.w,b.box.w)>.6*Math.max(a.box.w,b.box.w)&&
     Math.abs(a.box.cx-b.box.cx)<box.w*.18&&Math.abs(a.box.cy-b.box.cy)>2&&box.h<box.w*.5)
     out.push({ids:[a.id,b.id],box,char:'=',score:.96});
   }
   return out;
  }
  async function parse(ps,depth=0){
   checkCancelled(options);
   if(!ps.length||depth>maxDepth)return[];
   const ids=ps.map(p=>p.id).sort((a,b)=>a-b),key=ids.join(',');
   if(memo.has(key))return memo.get(key);
   if(++regions>maxRegions){exhausted=true;return[];}
   const work=(async()=>{
    const out=[],whole=area(ps);
    const combine=async(type,subsets,marks,geometry,render)=>{
     if(subsets.some(s=>!s.length||s.length>=ps.length))return;
     const choices=[];
     for(const subset of subsets){const c=await parse(subset,depth+1);if(!c.length)return;choices.push(c);}
     let beam=[[]];for(const cs of choices)beam=beam.flatMap(b=>cs.map(c=>[...b,c])).sort((a,b)=>mean(b.map(c=>c.score))-mean(a.map(c=>c.score))).slice(0,K);
     for(const children of beam){const node=join(type,children,marks,geometry,render(children),ids);if(checked(node))out.push(node);}
    };
    // Dominant horizontal structure: recursively parse both full regions.
    for(const bar of ps.filter(p=>p.line.horizontal&&p.box.w>=14).sort((a,b)=>b.box.w-a.box.w).slice(0,8)){
     const b=bar.box,top=[],bottom=[];let valid=true;
     for(const p of ps){if(p===bar)continue;const q=p.box,tol=Math.max(2,Math.min(7,q.h*.1));
      if(q.x<b.x-b.w*.20||q.x+q.w>b.x+b.w*1.20){valid=false;break;}
      if(q.y+q.h<b.cy+tol&&q.cy<b.cy-3)top.push(p);
      else if(q.y>b.cy-tol&&q.cy>b.cy+3)bottom.push(p);
      else{valid=false;break;}
     }
     if(valid&&top.length&&bottom.length){
      const span=Math.max(area(top).w,area(bottom).w);
      if(b.w>=span*.75)await combine('fraction',[top,bottom],[mark([bar.id],'−')],.97,c=>'\\frac{'+c[0].text+'}{'+c[1].text+'}');
     }
    }
    // Root hypotheses include either two pen strokes or a continuous hook/roof.
    const roots=[];
    const addRoot=(hook,roof,marks)=>{
     if(!hook)return;const line=operatorStroke({points:roof}),b=line.b,h=hook.box.h;
     const left=roof.reduce((a,q)=>q.x<a.x?q:a,roof[0]);
     if(!line.horizontal||b.w<Math.max(12,h*.45)||b.h>Math.max(h*.32,b.w*.12)||
      left.x<hook.end.x-h*.20||left.x>hook.end.x+h*.45||Math.abs(left.y-hook.end.y)>h*.55)return;
     const inside=ps.filter(p=>!marks.includes(p.id));
     if(!inside.length||inside.some(p=>p.box.x<hook.end.x-h*.08||p.box.x+p.box.w>b.x+b.w+h*.08||
      p.box.y<b.y-h*.08||p.box.cy<b.cy+h*.10||p.box.y+p.box.h>hook.box.y+h*1.2))return;
     roots.push({inside,marks});
    };
    for(const p of ps){
     for(const hook of [radicalHook(p.scaled.points),radicalDescendingHook(p.scaled.points)].filter(Boolean))
      for(const roof of ps)if(roof!==p)addRoot(hook,roof.scaled.points,[p.id,roof.id]);
     if(p.box.w>p.box.h*.8)for(const points of [p.scaled.points,p.scaled.points.slice().reverse()]){
      const steps=Math.min(20,points.length);
      for(let k=2;k<steps-1;k++){const at=Math.round(k*(points.length-1)/(steps-1));addRoot(radicalHook(points.slice(0,at+1)),points.slice(at),[p.id]);}
     }
    }
    for(const root of roots.slice(0,8))await combine('root',[root.inside],[mark(root.marks,'√')],.97,c=>'\\sqrt{'+c[0].text+'}');
    const ordered=ps.slice().sort((a,b)=>a.box.cx-b.box.cx),left=ordered[0],right=ordered.at(-1);
    if(ps.length>=3&&radicalParenthesis(left.scaled)==='('&&radicalParenthesis(right.scaled)===')'){
     const middle=ordered.slice(1,-1),height=Math.min(left.box.h,right.box.h),b=area(middle);
     if(b.x>left.box.cx&&b.x+b.w<right.box.cx&&b.h<Math.max(left.box.h,right.box.h)*1.15&&
      Math.abs(left.box.cy-right.box.cy)<height*.35)
      await combine('group',[middle],[mark([left.id],'('),mark([right.id],')')],.96,c=>'('+c[0].text+')');
    }
    // Competing inline splits share the same stroke coverage. A wide fraction
    // bar cannot silently become subtraction when its operands overlap it.
    for(const op of operators(ps)){
     const remaining=ps.filter(p=>!op.ids.includes(p.id)),a=[],b=[];let valid=true;
     for(const p of remaining){
      if(p.box.x+p.box.w<op.box.cx-1)a.push(p);
      else if(p.box.x>op.box.cx+1)b.push(p);
      else{valid=false;break;}
     }
     if(valid&&a.length&&b.length){
      const aa=area(a),bb=area(b),height=Math.max(aa.h,bb.h);
      if(Math.abs(aa.cy-bb.cy)<height*.55&&Math.abs(op.box.cy-(aa.cy+bb.cy)/2)<height*.45)
       await combine('inline',[a,b],[mark(op.ids,op.char,op.score)],op.score,c=>c[0].text+latex(op.char)+c[1].text);
     }
    }
    // Scripts may themselves contain a structure. Ordinary cm²/m³ never
    // enter this layer because the top-level structural gate excludes them.
    for(const direction of ['sup','sub']){
     for(let k=1;k<ordered.length;k++){
      const base=ordered.slice(0,k),script=ordered.slice(k),a=area(base),b=area(script);
      if(b.h>a.h*.78||b.x<a.x+a.w*.75||b.x>a.x+a.w+a.h*.7||b.w>a.h*1.8)continue;
      const raised=direction==='sup'?b.y+b.h<a.cy-a.h*.10:b.y>a.cy+a.h*.10;
      if(raised)await combine(direction,[base,script],[],.92,c=>c[0].text+(direction==='sup'?'^':'_')+'{'+c[1].text+'}');
     }
    }
    // Leaf alternatives participate in ranking, including when a tempting
    // structural split would otherwise discard valid symbol evidence.
    out.push(...await leaves(ps));
    return prune(out,K);
   })();
   memo.set(key,work);return work;
  }
  const candidates=await parse(parts);
  if(exhausted)return null; // Incomplete search must not produce a confident read.
  const composite=node=>node.type==='inline'||node.type==='leaf'&&/[+−×÷=]|\\times|\\div/.test(node.text)||node.children.some(composite);
  const eligible=candidates.filter(c=>c.structures>=2||c.structures>=1&&composite(c));
  if(!eligible.length)return null;
  const best=eligible[0];
  if(best.score<.66)return null;
  const all=prune([...candidates,...eligible],K),runner=all.find(c=>c.text!==best.text);
  const disputed=runner&&runner.score>=best.score-.035;
  if(runner?.score>best.score+.04)return null;
  const tokens=[...best.tokens];
  function visit(node){for(const m of node.marks)tokens.push({char:m.char,score:m.score,parts:m.parts,engine:'structural-layout'});node.children.forEach(visit);}
  visit(best);
  const uncertain=[...best.uncertain];
  if(disputed)uncertain.push({char:'?',score:.5,parts:[],engine:'structural-parse-review'});
  let graph;try{graph=labelGraph(best,parts);}catch(_){return null;}
  return{text:best.text,format:'latex',engine:'local-structural-v2',tokens,uncertain,
   structuralTree:best,structuralCandidates:all.map(c=>({text:c.text,score:c.score,type:c.type})),
   structuralSearch:{regions,maxRegions,beamWidth:K,maxDepth,exhausted:false},
   consumedStrokeIds:best.ids,labelGraph:graph,structuralConfidenceCalibrated:false};
 }
 function toLg(reading){
  const graph=reading?.labelGraph;if(!graph)throw Error('No structural label graph is available for this reading');
  return ['# Direct layout graph; normalize inherited edges for official LgEval.',
   ...graph.nodes.map(n=>'N, '+n.id+', '+n.label),
   ...graph.edges.map(e=>'E, '+e.from+', '+e.to+', '+e.label)].join('\n')+'\n';
 }
 return{recognize,toLg};
}
global.WhiteboardStructuralParserFactory=createStructuralParser;
})(typeof window==='object'?window:globalThis);
