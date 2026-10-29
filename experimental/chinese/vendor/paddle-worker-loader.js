/* Reassemble the pinned model/runtime assets from same-origin binary parts.
 * This keeps individual repository uploads small; recognition stays local. */
const nativeFetch = self.fetch.bind(self);
const waiting = [];
self.onmessage = event => waiting.push(event);
const parts = {
  'PP-OCRv5_mobile_rec.tar': 2,
  'ort-wasm-simd-threaded.jsep.wasm': 3
};
self.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, self.location.href);
  const count = parts[url.pathname.split('/').at(-1)];
  if (url.origin !== self.location.origin || !count) return nativeFetch(input, init);
  const buffers = await Promise.all(Array.from({ length: count }, async (_, i) => {
    const response = await nativeFetch(url.href + '.part' + (i + 1), init);
    if (!response.ok) throw new Error('无法载入本地识别资源：' + response.status);
    return response.arrayBuffer();
  }));
  return new Response(new Blob(buffers), { headers: { 'Content-Type': url.pathname.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream' } });
};
await import('./paddle-worker.js');
for (const event of waiting) self.onmessage(event);
