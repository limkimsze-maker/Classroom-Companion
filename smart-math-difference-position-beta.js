(function(){
'use strict';
if(typeof strokes==='undefined'||typeof redraw!=='function'||typeof cssH==='undefined')return;
function adjustDifferencePosition(){
 for(const obj of strokes){
  if(!obj||obj.smartType!=='barModel'||obj.smartBarType!=='comparison'||Number(obj.barCount)!==2||!Array.isArray(obj.userDrawnBrackets))continue;
  const widths=Array.isArray(obj.barCompareWidths)?obj.barCompareWidths:[];
  if(widths.length<2)continue;
  const long=Number(widths[0])>=Number(widths[1])?0:1;
  if(long!==0)continue; // Current 2-bar textbook case: longer bar on top.
  const diff=obj.userDrawnBrackets.find(b=>b&&b.isDifference&&b.visible!==false);
  if(!diff||!String(diff.id||'').startsWith('auto-difference-'))continue;
  const baseLocalY=(60+76+8)/440;
  // Place the difference bracket midway in the clear gap between the
  // bottom of the top bar and the top of the lower bar. This is higher
  // than the previous placement but still avoids hugging the top bar.
  const topBarBottom=60+76;
  const lowerBarTop=60+145;
  const targetLocalY=((topBarBottom+lowerBarTop)/2)/440;
  diff.verticalOffset=Number(obj.h||0)*(targetLocalY-baseLocalY);
 }
}
const priorRedraw=redraw;
redraw=function(){adjustDifferencePosition();priorRedraw()};
setTimeout(()=>{try{adjustDifferencePosition();redraw()}catch{}},0);
})();
