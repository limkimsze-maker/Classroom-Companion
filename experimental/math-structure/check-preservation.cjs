'use strict';
const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const baseline='531b6659a07694161d30f4be57903936905301fb';
require('./candidate.cjs').build();
const changed=execFileSync('git',['diff','--name-only',baseline,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const unexpected=changed.filter(p=>!p.startsWith('experimental/math-structure/')&&p!=='.github/workflows/experimental-math-structure.yml');
assert.deepEqual(unexpected,[],'Isolated V2 must not alter production source, models, samples, configuration or existing tests');
console.log('PASS protected V1 preservation; changes confined to experimental files and their CI workflow');
