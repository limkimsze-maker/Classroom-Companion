const assert=require('node:assert/strict');
const fix=t=>t.replace(/(?:\\s*×){2,}(?=\\s|$)/g,' ×').trim();
assert.equal(fix('j × × j = 81'),'j × j = 81');
assert.equal(fix('j × j = 81'),'j × j = 81');
assert.equal(fix('3 × 4 × 5'),'3 × 4 × 5');
assert.equal(fix('j + j = 81'),'j + j = 81');
assert.equal(fix('3 × × × 4'),'3 × 4');
console.log('PASS accidental adjacent multiplication deduplication');
