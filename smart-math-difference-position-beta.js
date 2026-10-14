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
  const bottomWhole=obj.userDrawnBrackets.find(b=>b&&!b.isDifference&&b.visible!==false&&Number(b.compareRow)===1&&b.position==='bottom');
  const baseLocalY=(60+76+8)/440;
  const targetLocalY=bottomWhole&&Number.isFinite(Number(bottomWhole.y))
    ? Number(bottomWhole.y)
    : ((60+145+76)/440 + 16/Math.max(1,Number(obj.h||0)*cssH));
  diff.verticalOffset=Number(obj.h||0)*(targetLocalY-baseLocalY);
 }
}
const priorRedraw=redraw;
redraw=function(){adjustDifferencePosition();priorRedraw()};
setTimeout(()=>{try{adjustDifferencePosition();redraw()}catch{}},0);
})();
