(function(){
'use strict';
if(typeof strokes==='undefined'||typeof redraw!=='function'||typeof cssH==='undefined')return;
const FIXED_GAP_PX=16;
function adjustDifferencePosition(){
 for(const obj of strokes){
  if(!obj||obj.smartType!=='barModel'||obj.smartBarType!=='comparison'||Number(obj.barCount)!==2||!Array.isArray(obj.userDrawnBrackets))continue;
  const widths=Array.isArray(obj.barCompareWidths)?obj.barCompareWidths:[];
  if(widths.length<2)continue;
  const long=Number(widths[0])>=Number(widths[1])?0:1;
  const diff=obj.userDrawnBrackets.find(b=>b&&b.isDifference&&b.visible!==false);
  if(!diff||!String(diff.id||'').startsWith('auto-difference-'))continue;

  // The drawing code starts from a built-in 8 model-unit gap from the
  // longer bar. Convert that to screen space, then force one stable
  // 16px visual gap from the relevant bar edge for BOTH orientations.
  const baseModelY=long===0?(60+76+8):(60+145-8);
  const edgeModelY=long===0?(60+76):(60+145);
  const baseScreenY=(Number(obj.y||0)+Number(obj.h||0)*(baseModelY/440))*cssH;
  const edgeScreenY=(Number(obj.y||0)+Number(obj.h||0)*(edgeModelY/440))*cssH;
  const targetScreenY=long===0
    ? edgeScreenY+FIXED_GAP_PX
    : edgeScreenY-FIXED_GAP_PX;

  diff.verticalOffset=(targetScreenY-baseScreenY)/cssH;
 }
}
const priorRedraw=redraw;
redraw=function(){adjustDifferencePosition();priorRedraw()};
setTimeout(()=>{try{adjustDifferencePosition();redraw()}catch{}},0);
})();

(function(){
 if(document.querySelector('script[data-predrawn-comparison-fallback]'))return;
 const s=document.createElement('script');
 s.dataset.predrawnComparisonFallback='1';
 s.src='smart-math-comparison-predrawn-fallback.js?v=20261014-predrawn1';
 document.head.appendChild(s);
})();
