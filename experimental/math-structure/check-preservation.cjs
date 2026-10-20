'use strict';
const assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const baseline='531b6659a07694161d30f4be57903936905301fb';
require('./candidate.cjs').build();
const changed=execFileSync('git',['diff','--name-only',baseline,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const unexpected=changed.filter(p=>!p.startsWith('experimental/math-structure/')&&p!=='.github/workflows/experimental-math-structure.yml'&&p!=='whiteboard-v2-trial.html');
assert.deepEqual(unexpected,[],'Isolated V2 must not alter production source, models, samples, configuration or existing tests');
assert.equal(execFileSync('git',['ls-tree','--name-only',baseline,'whiteboard-v2-trial.html'],{encoding:'utf8'}).trim(),'','Preview must be a new page, never an existing V1 page');
console.log('PASS protected V1 preservation; changes confined to experimental files and their CI workflow');
