/* Promote only Chinese handwriting. Keep Alpha's existing editor, toolbar,
 * speech, document tools, storage and all other language editions unchanged. */
(function () {
  'use strict';
  if (!/\/whiteboard-smart-beta\.html$/.test(location.pathname) ||
      (new URLSearchParams(location.search).get('edition') || 'en').toLowerCase() !== 'zh') return;
  if (typeof strokes === 'undefined' || !window.ClassroomHandwritingEditHistory?.record) return;
  const base = new URL('./', document.currentScript.src);
  const clone = value => JSON.parse(JSON.stringify(value));
  window.__CC_CHINESE_ALPHA__ = true;

  // Match the established editor's wrapping and text-box padding without
  // replacing or changing any of its existing rendering/selection handlers.
  function lineCount(value, size, maxWidth) {
    ctx.save(); ctx.font = '400 ' + size + 'px "CCWenKai",Arial,sans-serif';
    const width = Math.max(6, maxWidth - 12), lines = [];
    for (const paragraph of value.replace(/\r/g, '').split('\n')) {
      if (!paragraph) { lines.push(''); continue; }
      let line = '';
      for (const word of paragraph.trim().split(/\s+/)) {
        const candidate = line ? line + ' ' + word : word;
        if (ctx.measureText(candidate).width <= width) { line = candidate; continue; }
        if (line) { lines.push(line); line = ''; }
        if (ctx.measureText(word).width <= width) { line = word; continue; }
        for (const character of Array.from(word)) {
          if (line && ctx.measureText(line + character).width > width) { lines.push(line); line = character; }
          else line += character;
        }
      }
      lines.push(line);
    }
    ctx.restore(); return lines.length;
  }
  window.CCChineseText = {
    create(text, area, requestedSize, inkColour, original) {
      const x = Math.max(0, Math.min(.9, area.x - 6 / cssW));
      const y = Math.max(0, Math.min(.9, area.y - 5 / cssH));
      const availableW = Math.max(20, cssW * (1 - x) - 12);
      const availableH = Math.max(20, cssH * (1 - y) - 12);
      const object = { type: 'text', x, y, text, colour: inkColour, size: requestedSize,
        font: 'CCWenKai', bold: false, italic: false, underline: false, align: 'left',
        chineseBeautified: true, chineseOriginal: clone(original), language: 'zh-Hans' };
      for (let font = requestedSize; font >= 12; font--) {
        object.size = font;
        ctx.save(); ctx.font = '400 ' + font + 'px "CCWenKai",Arial,sans-serif';
        const width = Math.min(availableW, Math.max(50, ...text.split('\n').map(line => ctx.measureText(line).width + 18)));
        ctx.restore(); object.w = width / cssW;
        const height = lineCount(text, font, width) * font * 1.25 + 16;
        if (height <= availableH) { object.h = height / cssH; return object; }
      }
      throw new Error('这段文字太长，无法完整放入白板。请分段美化。');
    },
    replace(targets, additions) {
      if (!targets.length || targets.some(s => !strokes.includes(s) || s.locked || s.background)) return false;
      // The established handwriting history records this as one Undo action.
      window.ClassroomObjectSelection?.clear?.();
      const before = clone(strokes), remove = new Set(targets);
      strokes = strokes.filter(s => !remove.has(s)); strokes.push(...additions);
      current = null; drawing = false; window.__smartBarLastHistory = null;
      window.WhiteboardMarqueeSelection?.clear?.();
      window.ClassroomUnifiedSmartTransforms?.clear?.();
      redraw(); window.ClassroomHandwritingEditHistory.record(before); syncUi();
      return true;
    }
  };
  const fonts = document.querySelector('#wordTextFormatBar select');
  if (fonts && ![...fonts.options].some(option => option.value === 'CCWenKai')) {
    const option = document.createElement('option'); option.value = 'CCWenKai'; option.textContent = '文楷'; fonts.appendChild(option);
  }
  function loadScript(path) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = new URL(path, base).href;
      script.onload = resolve; script.onerror = () => reject(new Error('Chinese handwriting resource did not load: ' + path));
      document.head.appendChild(script);
    });
  }
  const stylesheet = document.createElement('link'); stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('alpha-beautify.css?v=20261029-promotion1', base).href;
  document.head.appendChild(stylesheet);
  (async () => {
    if (!window.OpenCC) await loadScript('vendor/opencc-t2cn.js');
    await loadScript('recognizer.js?v=20261029-promotion1');
    await loadScript('beautify.js?v=20261029-promotion1');
  })().catch(error => console.warn('[Chinese handwriting]', error));
})();
