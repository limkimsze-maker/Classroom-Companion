/* Only this edition permits local model/font GETs. Ink never leaves the page. */
(function () {
  'use strict';
  if (!window.__CC_CHINESE_TRIAL__) return;
  window.__MOE_SAFE_MODE__ = true;
  const original = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.href);
    const method = String(init.method || input?.method || 'GET').toUpperCase();
    if (url.origin !== location.origin || !['GET', 'HEAD'].includes(method))
      return Promise.reject(new Error('此试用版只允许读取本地资源。'));
    return original(input, init);
  };
  window.XMLHttpRequest = function () { throw new Error('此试用版不上传文件。'); };
  window.WebSocket = window.EventSource = function () { throw new Error('此试用版不连接外部服务。'); };
  try { navigator.sendBeacon = () => false; } catch (_) {}
})();
