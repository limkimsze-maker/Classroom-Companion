/* Original ink-on demo is first for every Beautify reading mode.
   Preserve the prior V1/UJI fallback only when ink-on cannot yield a valid
   non-empty LaTeX result. Do not treat uncertain but valid output as fact. */
(function(){
  'use strict';
  const existing=window.WhiteboardHandwritingMath;
  const demo=window.WhiteboardInkOnOriginalDemo;
  if (!existing?.recognize || !demo?.recognize) return;
  const original=existing.recognize.bind(existing);
  const isValid=r=>typeof r?.text==='string'&&r.text.trim().length>0&&r.text.length<=600;
  async function recognize(strokes,W,H,options={}){
    const mode=options.mode||'auto';
    try {
      const candidate=await demo.recognize(strokes,W,H,options);
      if(isValid(candidate))return {...candidate,engine:'inkon-original-demo-first'};
    } catch(err){
      if(err?.name==='AbortError')throw err;
    }
    // Failure, timeout, or no valid expression: use the existing reader.
    if(mode==='math'){
      const oldMath=window.WhiteboardMathReader;
      if(typeof oldMath?.recognize==='function')return oldMath.recognize(strokes,W,H,options);
    }
    return original(strokes,W,H,options);
  }
  window.WhiteboardHandwritingMath=Object.freeze({...existing,recognize});
  const title=document.getElementById('boardSubtitle');
  if(title) title.textContent='Experimental ink-on-first Beautify recognition · original UJI V1 fallback retained · use non-sensitive sample content';
})();
