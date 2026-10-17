(function(){
'use strict';
let y=null,finishTimer=0,lastEvent=0;
const GAP=220,COMMIT_DELAY=150;
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function pageBox(){return document.querySelector('#documentQuickBar input[type="number"]')}
function maxPage(box){return Math.max(1,+box?.max||1)}
function currentPage(box,m){return clamp(+box?.value||1,1,m)}
function yForPage(stage,p,m){const h=Math.max(1,stage.clientHeight-20);return 10+(m<=1?0:(p-1)/(m-1))*h}
function pageForY(stage,pos,m){const h=Math.max(1,stage.clientHeight-20),q=clamp((pos-10)/h,0,1);return clamp(Math.round(1+q*(m-1)),1,m)}
function preview(stage,p,m,pos){
 const dial=stage.closest('#documentPageDial');if(!dial)return;
 const head=dial.querySelector('.dial-head strong');
 const total=dial.querySelector('.dial-head span');
 const thumb=dial.querySelector('.dial-thumb');
 const bubble=dial.querySelector('.dial-bubble');
 const progress=dial.querySelector('.dial-progress');
 if(head)head.textContent=String(p);
 if(total)total.textContent=`/ ${m}`;
 if(thumb)thumb.style.top=`${pos}px`;
 if(bubble){bubble.textContent=`Page ${p}`;bubble.style.top=`${pos}px`}
 if(progress)progress.style.height=`${Math.max(0,pos-10)}px`;
 dial.classList.add('dragging');
 stage.setAttribute('aria-valuenow',String(p));
 stage.setAttribute('aria-valuetext',`Page ${p} of ${m}`);
}
function commit(stage,box,m){
 const dial=stage.closest('#documentPageDial');
 dial?.classList.remove('dragging');
 const p=pageForY(stage,y,m);
 box.value=String(p);
 box.dispatchEvent(new Event('change',{bubbles:true}));
 y=null;
}
function onWheel(e){
 const stage=e.target?.closest?.('#documentPageDial .dial-stage');
 if(!stage)return;
 const box=pageBox();if(!box)return;
 e.preventDefault();
 e.stopImmediatePropagation();
 const m=maxPage(box),now=performance.now();
 if(y==null||now-lastEvent>GAP)y=yForPage(stage,currentPage(box,m),m);
 lastEvent=now;
 let dy=(e.deltaY||0); // inverted from previous handler: direct browser delta
 if(e.deltaMode===1)dy*=18;
 else if(e.deltaMode===2)dy*=stage.clientHeight;
 dy=clamp(dy,-70,70);
 y=clamp(y+dy,10,Math.max(10,stage.clientHeight-10));
 const p=pageForY(stage,y,m);
 preview(stage,p,m,y);
 clearTimeout(finishTimer);
 finishTimer=setTimeout(()=>commit(stage,box,m),COMMIT_DELAY);
}
window.addEventListener('wheel',onWheel,{passive:false,capture:true});
})();
