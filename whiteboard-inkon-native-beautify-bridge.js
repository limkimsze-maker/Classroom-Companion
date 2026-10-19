/* Only the isolated CoMER/ink-on experiment replaces Math reading.
   The original Beautify UI, learning layer, local UJI, all other recognition
   modes, layout, Apply, Cancel and Undo are unchanged. */
(function(){
  'use strict';
  const existing=window.WhiteboardHandwritingMath;
  const demo=window.WhiteboardInkOnOriginalDemo;
  if (!existing?.recognize || !demo?.recognize) return;
  const original=existing.recognize.bind(existing);
  window.WhiteboardHandwritingMath=Object.freeze({
    ...existing,
    recognize(strokes,W,H,options={}) {
      if(options.mode==='math') return original(strokes,W,H,{...options,mathRecognizer:demo.recognize.bind(demo)});
      return original(strokes,W,H,options);
    }
  });
  const math=window.WhiteboardMathReader;
  if(math)window.WhiteboardMathReader=Object.freeze({...math,cancel(){demo.cancel?.();math.cancel?.()}});
  const title=document.getElementById('boardSubtitle');
  if(title) title.textContent='Experimental original ink-on mathematical recognition · existing Beautify, local UJI and Undo preserved · test with non-sensitive sample content';
})();
