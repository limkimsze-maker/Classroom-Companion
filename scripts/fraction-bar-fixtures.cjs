'use strict';
// Independent traces of the three reported silhouettes, in screenshot pixels.
// They are geometry fixtures; no uploaded screenshot is bundled with the app.
const reported=[
 {name:'reported-five-parts',parts:5,paths:[[[638,474],[646,467],[670,465],[837,465],[980,470],[1087,487],[1275,503],[1273,555],[1087,551],[840,551],[771,545],[638,519],[638,474]],[[771,471],[771,545]],[[899,474],[900,515],[903,572]],[[1041,478],[1041,561]],[[1161,491],[1164,548]]]},
 {name:'reported-two-parts',parts:2,paths:[[[198,95],[230,94],[270,101],[350,104],[496,105],[570,110],[700,110],[793,101],[825,101],[834,185],[545,185],[410,181],[201,181],[198,95]],[[496,102],[496,183]]]},
 {name:'reported-six-parts',parts:6,paths:[[[178,150],[178,205],[813,206],[813,185],[809,155],[802,159],[711,157],[534,157],[513,154],[178,154],[178,150]],[[276,145],[275,208]],[[382,150],[377,154],[376,224]],[[495,155],[490,180],[490,215]],[[619,160],[620,203]],[[720,163],[720,208]]]}
];
function normalise(paths,width,height,vertical=false){
 const pts=paths.flat(),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),left=Math.min(...xs),top=Math.min(...ys),span=Math.max(...xs)-left;
 const long=vertical?Math.min(height*.55,540):width*.68,scale=long/span;
 return paths.map(points=>({colour:'#17324d',size:5,points:points.map(([x,y])=>vertical?{x:(width*.25+(y-top)*scale)/width,y:(height*.20+(x-left)*scale)/height}:{x:(width*.15+(x-left)*scale)/width,y:(height*.30+(y-top)*scale)/height})}));
}
function fixtures(width=1000,height=700){
 const all=[];
 for(const vertical of [false,true])for(const r of reported){
  const paths=r.paths;
  all.push({name:r.name+(vertical?'-vertical':''),parts:r.parts,horizontal:!vertical,ink:normalise(paths,width,height,vertical)});
  const edges=paths[0].slice(1).map((p,i)=>[paths[0][i],p]);
  all.push({name:r.name+'-separate-edges'+(vertical?'-vertical':''),parts:r.parts,horizontal:!vertical,ink:normalise([...paths.slice(1),...edges],width,height,vertical)});
 }
 for(const vertical of [false,true])for(const n of [2,3,4,5,6,8,10,12])for(let seed=1;seed<=8;seed++){
  let state=seed*97+n*7;const rand=()=>((state=(state*1664525+1013904223)>>>0)/2**32-.5);
  const jitter=(x,y)=>[x+rand()*4,y+rand()*4],left=80,top=100,w=650,h=70+seed*3;
  const outline=[[left,top],[left+w*.35,top+3],[left+w*.7,top+2],[left+w,top+7],[left+w,top+h+7],[left+w*.6,top+h+3],[left,top+h],[left,top]].map(([x,y])=>jitter(x,y));
  let paths=seed%2?outline.slice(1).map((p,i)=>[outline[i],p]):[outline];
  const cuts=[];
  for(let i=1;i<n;i++){
   const x=left+w*i/n+rand()*6,y0=top+7*i/n-5,y1=top+h+7*i/n+7;
   if(seed%3===0)cuts.push([jitter(x,y0),jitter(x+1,(y0+y1)/2)],[jitter(x+1,(y0+y1)/2),jitter(x+2,y1)]);
   else cuts.push([jitter(x,y0),jitter(x+2,y1)]);
   if(seed===7)cuts.push([jitter(x+2,y0),jitter(x+3,y1)]);
  }
  paths=seed%4===0?[...cuts,...paths]:[...paths,...cuts];
  if(seed===8){const chain=[...outline];for(let i=0;i<cuts.length;i++){const line=i%2?[...cuts[i]].reverse():cuts[i];chain.push(...line)}paths=[chain]}
  all.push({name:n+'-parts-seed-'+seed+(vertical?'-vertical':''),parts:n,horizontal:!vertical,ink:normalise(paths,width,height,vertical)});
 }
 return all;
}
module.exports={fixtures,reported,normalise};
