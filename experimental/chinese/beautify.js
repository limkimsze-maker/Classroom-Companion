(function () {
  'use strict';
  if ((!window.__CC_CHINESE_TRIAL__ && !window.__CC_CHINESE_ALPHA__) || typeof strokes === 'undefined') return;
  const clone = value => JSON.parse(JSON.stringify(value));
  const eligible = s => s && !s.erase && !s.highlighter && !s.locked && !s.background &&
    !s.smartGenerated && !s.shape && Array.isArray(s.points) && s.points.length > 0;
  const tools = document.querySelector('.tools');
  const button = document.createElement('button');
  button.id = 'ccChineseBeautifyBtn'; button.type = 'button'; button.className = 'btn';
  button.textContent = '✨ 美化汉字'; button.title = '框选手写汉字，识别为简体中文并用文楷呈现';
  tools.appendChild(button);
  let picker = null, modal = null, generation = 0;
  const bounds = group => {
    const points = group.flatMap(s => s.points), xs = points.map(p => p.x), ys = points.map(p => p.y);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  };
  function close() {
    generation++; picker?.remove(); picker = null; modal?.remove(); modal = null;
    button.classList.remove('active'); button.focus();
  }
  function raster(group) {
    const b = bounds(group), padding = 24;
    const scale = Math.min(2, 1800 / Math.max(1, b.w * cssW + padding * 2), 1000 / Math.max(1, b.h * cssH + padding * 2));
    const image = document.createElement('canvas');
    image.width = Math.max(80, Math.ceil((b.w * cssW + padding * 2) * scale));
    image.height = Math.max(64, Math.ceil((b.h * cssH + padding * 2) * scale));
    const c = image.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, image.width, image.height);
    c.scale(scale, scale); c.lineCap = c.lineJoin = 'round';
    const selected = new Set(group);
    for (const s of strokes) {
      if (!selected.has(s) && !s.erase) continue;
      if (!s.points?.length) continue;
      c.strokeStyle = c.fillStyle = s.erase ? '#fff' : '#111'; c.lineWidth = Number(s.size) || 4;
      const point = p => ({ x: (p.x - b.x) * cssW + padding, y: (p.y - b.y) * cssH + padding });
      const first = point(s.points[0]);
      if (s.points.length === 1) { c.beginPath(); c.arc(first.x, first.y, c.lineWidth / 2, 0, Math.PI * 2); c.fill(); }
      else { c.beginPath(); c.moveTo(first.x, first.y); s.points.slice(1).forEach(p => { const q = point(p); c.lineTo(q.x, q.y); }); c.stroke(); }
    }
    return image;
  }
  function begin() {
    close();
    const existing = window.ClassroomObjectSelection?.selected?.();
    if (existing?.chineseBeautified) { review([], existing); return; }
    const selected = window.WhiteboardMarqueeSelection?.get?.()?.filter(eligible) || [];
    if (selected.length) { review(selected); return; }
    window.ClassroomFingerPointer?.setActive(false);
    document.getElementById('selectBtn')?.click();
    const overlay = document.createElement('div'); overlay.className = 'ccChinesePicker'; picker = overlay;
    const help = document.createElement('div'); help.className = 'ccChinesePickerHelp';
    help.textContent = '拖动方框，完整框住要美化的汉字。按 Esc 取消。';
    const box = document.createElement('div'); box.className = 'ccChinesePickerBox'; box.hidden = true;
    overlay.append(help, box); wrap.appendChild(overlay); button.classList.add('active');
    let start = null, pointer = null;
    const point = event => { const r = overlay.getBoundingClientRect(); return {
      x: Math.min(1, Math.max(0, (event.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (event.clientY - r.top) / r.height)) }; };
    overlay.onpointerdown = event => {
      if (event.button !== 0 || pointer !== null) return;
      event.preventDefault(); start = point(event); pointer = event.pointerId;
      overlay.setPointerCapture(pointer); box.hidden = false;
    };
    overlay.onpointermove = event => {
      if (!start || event.pointerId !== pointer) return;
      const end = point(event);
      Object.assign(box.style, { left: Math.min(start.x, end.x) * 100 + '%', top: Math.min(start.y, end.y) * 100 + '%',
        width: Math.abs(start.x - end.x) * 100 + '%', height: Math.abs(start.y - end.y) * 100 + '%' });
    };
    overlay.onpointerup = event => {
      if (!start || event.pointerId !== pointer) return;
      event.preventDefault(); const end = point(event), left = Math.min(start.x, end.x), top = Math.min(start.y, end.y);
      const right = Math.max(start.x, end.x), bottom = Math.max(start.y, end.y);
      const group = strokes.filter(s => eligible(s) && s.points.every(p => p.x >= left && p.x <= right && p.y >= top && p.y <= bottom));
      start = null; pointer = null; box.hidden = true;
      if (!group.length) { help.textContent = '未找到完整的手写笔画。请把汉字的全部笔画框在方框内。'; return; }
      close(); review(group);
    };
    overlay.onpointercancel = () => { start = null; pointer = null; box.hidden = true; };
  }
  async function review(group, existing = null) {
    if (!existing && (group.length > 500 || group.reduce((n, s) => n + s.points.length, 0) > 65000)) {
      say('请分段选择，先美化一小段文字。'); return;
    }
    const id = ++generation;
    const originals = existing ? clone(existing.chineseOriginal || []) : clone(group);
    const signature = JSON.stringify(existing || group);
    const b = existing ? { x: existing.x, y: existing.y, w: existing.w, h: existing.h } : bounds(group);
    const image = existing ? null : raster(group);
    const backdrop = document.createElement('div'); backdrop.className = 'ccChineseBackdrop'; modal = backdrop;
    const panel = document.createElement('section'); panel.className = 'ccChineseReview'; panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'ccChineseTitle');
    const title = document.createElement('h2'); title.id = 'ccChineseTitle'; title.textContent = '美化汉字 · 简体中文';
    const intro = document.createElement('p'); intro.textContent = '核对识别结果，再用文楷呈现在白板上。可以修改错字；不会自动改写句子。';
    panel.append(title, intro);
    if (image) { const ink = document.createElement('img'); ink.className = 'ccChineseOriginal'; ink.src = image.toDataURL(); ink.alt = '所选的原笔迹'; panel.append(ink); }
    const label = document.createElement('label'); label.htmlFor = 'ccChineseReading'; label.textContent = '识别结果（可直接修改）';
    const input = document.createElement('textarea'); input.id = 'ccChineseReading'; input.lang = 'zh-Hans'; input.maxLength = 1200;
    input.placeholder = '正在识别……也可以手动输入简体中文。'; input.spellcheck = false; input.value = existing?.text || '';
    const previewLabel = document.createElement('label'); previewLabel.textContent = '美化预览';
    const preview = document.createElement('div'); preview.className = 'ccChinesePreview'; preview.lang = 'zh-Hans'; preview.setAttribute('aria-label', '文楷美化预览');
    const options = document.createElement('div'); options.className = 'ccChineseOptions';
    const sizeLabel = document.createElement('label'); sizeLabel.textContent = '字号';
    const sizeInput = document.createElement('input'); sizeInput.type = 'range'; sizeInput.min = '24'; sizeInput.max = '80';
    sizeInput.value = String(existing?.size || Math.max(32, Math.min(64, Math.round(b.h * cssH))));
    sizeInput.setAttribute('aria-label', '美化字号'); const sizeText = document.createElement('output'); sizeText.value = sizeInput.value;
    sizeLabel.append(sizeInput, sizeText);
    const colourLabel = document.createElement('label'); colourLabel.textContent = '颜色';
    const colourInput = document.createElement('input'); colourInput.type = 'color'; colourInput.value = existing?.colour || group[0]?.colour || '#17324d';
    colourInput.setAttribute('aria-label', '美化颜色'); colourLabel.append(colourInput); options.append(sizeLabel, colourLabel);
    const status = document.createElement('p'); status.className = 'ccChineseStatus'; status.setAttribute('role', 'status');
    const fontStatus = document.createElement('p'); fontStatus.className = 'ccChineseStatus'; fontStatus.textContent = '正在载入文楷字体……';
    const actions = document.createElement('div'); actions.className = 'ccChineseActions';
    const retry = document.createElement('button'); retry.type = 'button'; retry.textContent = '重新识别'; retry.hidden = !!existing;
    const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = '取消';
    const apply = document.createElement('button'); apply.type = 'button'; apply.className = 'primary'; apply.textContent = '应用到白板'; apply.disabled = true;
    actions.append(retry, cancel, apply); panel.append(label, input, previewLabel, preview, options, status, fontStatus, actions);
    backdrop.append(panel); document.body.appendChild(backdrop); input.focus();
    let revision = 0, fontReady = false, busy = false;
    function update() {
      preview.textContent = input.value || '今天我们一起学习。'; preview.style.color = colourInput.value;
      preview.style.fontSize = sizeInput.value + 'px'; sizeText.value = sizeInput.value;
      apply.disabled = !fontReady || !input.value.trim();
    }
    input.addEventListener('input', () => { revision++; update(); });
    sizeInput.oninput = colourInput.oninput = update; update();
    async function loadFont() {
      try {
        await document.fonts.load('32px CCWenKai', '简体中文学习');
        if (id !== generation) return;
        fontReady = document.fonts.check('32px CCWenKai', '简体中文学习');
        if (!fontReady) throw new Error('字体尚未载入');
        fontStatus.textContent = '文楷已就绪 · 文字和笔迹均在此设备处理'; update();
      } catch (_) { if (id === generation) { fontStatus.textContent = '文楷字体未能载入。请检查连接后点击“重试字体”。';
        const again = document.createElement('button'); again.type = 'button'; again.textContent = '重试字体'; again.onclick = () => { again.remove(); loadFont(); }; actions.prepend(again); } }
    }
    async function read() {
      if (busy || !image) return;
      busy = true; retry.disabled = true; const startedRevision = revision;
      status.classList.remove('error'); status.textContent = '正在载入本地识别引擎并识别汉字。首次使用需要较长时间……';
      try {
        const result = await window.CCChineseRecognizer.recognize(image);
        if (id !== generation) return;
        if (revision === startedRevision) input.value = result.text;
        status.textContent = result.text ? (result.metrics?.lineFallback ? '已按整行重新识别，请核对文字后应用。' : result.uncertain ? '部分文字不太确定，请逐字核对识别结果。' : '识别完成，请核对后应用。') : '未能识别这段笔迹。可以重新识别或手动输入。';
        update();
      } catch (error) { if (id === generation) { console.warn('[Chinese trial]', error); status.classList.add('error');
        status.textContent = '本次识别未完成，原笔迹保留。可以重试或手动输入。'; } }
      finally { busy = false; if (id === generation) retry.disabled = false; }
    }
    retry.onclick = read; cancel.onclick = close;
    apply.onclick = () => {
      try {
        if (!fontReady || !input.value.trim()) return;
        const targets = existing ? [existing] : group;
        if (targets.some(s => !strokes.includes(s)) || JSON.stringify(existing || group) !== signature) throw new Error('原笔迹已经改变，请取消后重新选择。');
        const value = window.CCChineseRecognizer.simplify(input.value).replace(/\r/g, '');
        const object = window.CCChineseText.create(value, b, Number(sizeInput.value), colourInput.value, originals);
        if (!window.CCChineseText.replace(targets, [object])) throw new Error('无法替换原笔迹，请重新选择。');
        close(); window.ClassroomFingerPointer?.setActive(true); say('已美化为简体中文。可撤销以恢复原笔迹。');
      } catch (error) { status.classList.add('error'); status.textContent = error.message; }
    };
    loadFont(); if (image) read(); else status.textContent = '可修改文字、字号和颜色。';
  }
  button.onclick = begin;
  window.addEventListener('keydown', event => {
    if (!picker && !modal) return;
    event.stopImmediatePropagation();
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    else if (modal && event.key === 'Tab') {
      const focusable = [...modal.querySelectorAll('button,input,textarea')].filter(e => !e.disabled && !e.hidden);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }, true);
  window.ClassroomToolbarGroups?.refresh();
  function localise() {
    document.documentElement.lang = 'zh-Hans-SG';
    document.title = '华文白板试用版 · Classroom Companion';
    document.getElementById('boardTitle').textContent = 'Classroom Companion · 华文白板试用版';
    document.getElementById('boardSubtitle').textContent = '简体中文 · 汉字识别与文楷美化 · 独立试用版';
    wrap.dataset.watermark = '华文白板 · 试用版';
    const labels = { mainSettingsBtn: '⚙ 设置', highlighterBtn: '🖍 荧光笔', speechToTextBtn: '🎙 语音转文字',
      ccFingerPointerBtn: '👆 指示', ccHandGrabToolbarBtn: '✋ 拖动', handwritingBeautifyBtn: '✨ 美化算式',
      openDocumentBtn: '📂 打开文件', ccPermanentSaveBtn: '💾 保存到我的文档', ccPermanentExitBtn: '✕ 退出',
      ccSavePageAnnotationsBtn: '💾 保存本页', ccSaveAllAnnotationsBtn: '💾 保存全部',
      ccDeletePageAnnotationsBtn: '🗑 删除本页批注', ccDeleteAllAnnotationsBtn: '🗑 删除全部批注' };
    for (const [id, label] of Object.entries(labels)) { const el = document.getElementById(id); if (el) el.textContent = label; }
    for (const el of tools.querySelectorAll('button')) {
      if (el.textContent.trim() === '📁 My Documents') el.textContent = '📁 我的文档';
    }
    for (const [kind, label] of [['draw', '书写'], ['create', '创建与教学'], ['files', '文件']]) {
      const group = document.querySelector('.ccToolGroup[data-kind="' + kind + '"]');
      const heading = group?.querySelector('.ccToolGroupLabel'); if (heading) heading.textContent = label;
    }
  }
  if (window.__CC_CHINESE_TRIAL__) {
    document.addEventListener('DOMContentLoaded', localise, { once: true });
    localise(); setTimeout(localise, 1100);
  }
  window.CCChineseBeautify = { begin, close };
})();
