/* Chinese Alpha interface text only. Do not translate board objects, typed
 * text, transcripts, file contents or change any existing control handlers. */
(function () {
  'use strict';
  if (!window.__CC_CHINESE_ALPHA__) return;
  const labels = new Map(Object.entries({
    'draw':'书写','create & teach':'创建与教学','files':'文件',
    'settings':'设置','hand':'拖动','point':'指示','pen':'画笔','highlighter':'荧光笔',
    'highlight:':'荧光笔：','eraser':'橡皮擦','thickness':'粗细','text size':'字号',
    'text box':'文本框','speech to text':'语音转文字','image':'图片','shapes':'形状',
    'smart math':'智能数学','beautify':'美化算式','undo':'撤销','redo':'重做',
    'grid':'方格','blank':'空白','clear':'清除','open file':'打开文件',
    'my documents':'我的文档','save':'保存','restore':'恢复','export png':'导出 PNG',
    'save to my documents':'保存到我的文档','save page':'保存本页',
    'save all':'保存全部','delete page':'删除本页批注','delete all':'删除全部批注',
    'save annotations ▾':'保存批注 ▾','exit':'退出','close':'关闭',
    'duplicate':'复制','forward':'上移一层','backward':'下移一层','lock':'锁定','unlock':'解锁',
    'select':'选择','edit':'编辑','full screen':'全屏','how to use':'使用说明',
    'font':'字体','size':'字号','bold':'粗体','italic':'斜体','underline':'下划线',
    'align left':'左对齐','centre':'居中','align right':'右对齐',
    'start listening':'开始聆听','stop listening':'停止聆听','insert':'插入白板',
    'clear panel':'清空文字','convert maths':'转换算式',
    'press start to dictate, stop when finished. pauses will not end your session.':'点击“开始聆听”进行听写，完成后点击“停止聆听”。停顿不会结束本次聆听。',
    'automatically capitalise sentences, days, months and common names':'自动处理英文句首、星期、月份和常见姓名的大写',
    'additional names (comma-separated)':'补充姓名（用逗号分隔）',
    'settings · handwriting learning':'设置 · 手写学习',
    'point · presentation only':'指示 · 讲解模式',
    'last action undone':'已撤销上一步','original handwriting restored':'已恢复原笔迹'
  }));
  function translate(value) {
    const text = String(value || ''), trimmed = text.trim();
    let result = labels.get(trimmed.toLowerCase());
    if (!result) {
      const match = trimmed.match(/^([^A-Za-z]*)([A-Za-z].*)$/);
      const word = match && labels.get(match[2].toLowerCase());
      if (word) result = match[1] + word;
    }
    return result ? text.replace(trimmed, result) : text;
  }
  function localise(root) {
    if (!root) return;
    for (const element of [root, ...root.querySelectorAll('[aria-label],[title],[placeholder]')]) {
      for (const attribute of ['aria-label', 'title', 'placeholder']) {
        if (!element.hasAttribute(attribute)) continue;
        const value = element.getAttribute(attribute), next = translate(value);
        if (next !== value) element.setAttribute(attribute, next);
      }
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest('input,textarea,script,style,canvas,code')) continue;
      const next = translate(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
  }
  const observed = new WeakSet();
  const selectors = 'header.top,#ccSpeechToTextPanel,#mainSettingsDialog,#modeBadge,#toast,#wordTextFormatBar';
  let queued = false;
  function refresh() {
    queued = false;
    for (const root of document.querySelectorAll(selectors)) {
      localise(root);
      if (observed.has(root)) continue;
      observed.add(root);
      new MutationObserver(schedule).observe(root, { childList: true, subtree: true, characterData: true });
    }
  }
  function schedule() {
    if (queued) return;
    queued = true; requestAnimationFrame(refresh);
  }
  // Watch only new interface panels; drawing and document contents are excluded.
  new MutationObserver(schedule).observe(document.body, { childList: true });
  document.addEventListener('DOMContentLoaded', schedule, { once: true });
  refresh();
})();
