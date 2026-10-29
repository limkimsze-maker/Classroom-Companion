/* Chinese trial only. No fallback reads or writes to Alpha's saved data. */
(function () {
  'use strict';
  if (!/\/whiteboard-chinese-trial\.html$/.test(location.pathname)) return;
  window.__CC_CHINESE_TRIAL__ = true;
  const url = new URL(location.href);
  url.searchParams.set('edition', 'zh');
  history.replaceState(null, '', url);
  const prefix = 'cc-chinese-trial-v1:';
  for (const name of ['localStorage', 'sessionStorage']) {
    const original = window[name];
    const keys = () => Array.from({ length: original.length }, (_, i) => original.key(i))
      .filter(k => k && k.startsWith(prefix)).map(k => k.slice(prefix.length));
    const storage = {
      getItem: k => original.getItem(prefix + String(k)),
      setItem: (k, v) => original.setItem(prefix + String(k), String(v)),
      removeItem: k => original.removeItem(prefix + String(k)),
      clear: () => keys().forEach(k => original.removeItem(prefix + k)),
      key: i => keys()[i] ?? null,
      get length() { return keys().length; }
    };
    Object.defineProperty(window, name, { value: storage, configurable: true });
  }
  const db = window.indexedDB;
  if (db) {
    const open = db.open.bind(db), remove = db.deleteDatabase.bind(db);
    db.open = (name, ...args) => open(prefix + String(name), ...args);
    db.deleteDatabase = (name, ...args) => remove(prefix + String(name), ...args);
  }
})();
