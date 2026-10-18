/* Only the isolated CoMER/ink-on experiment replaces Math reading.
   The original Beautify UI, learning layer, UJI V1, all other recognition
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
      const equal=window.WhiteboardEqualSign?.detect?.(strokes,W,H);
      if(equal)return Promise.resolve(equal);
      if(options.mode==='math') return demo.recognize(strokes,W,H,options);
      return original(strokes,W,H,options);
    }
  });
  const title=document.getElementById('boardSubtitle');
  if(title) title.textContent='Experimental original ink-on mathematical recognition · existing Beautify, UJI V1 and Undo preserved · test with non-sensitive sample content';
})();
