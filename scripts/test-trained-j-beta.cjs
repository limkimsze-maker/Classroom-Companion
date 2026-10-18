const fs=require('fs'),vm=require('vm'),assert=require('assert');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('whiteboard-trained-j-beta.js','utf8'),ctx);
const j=ctx.window.WhiteboardTrainedJ;
assert.equal(j.info().samples,23);
const W=326.58,H=340;
const stem={size:5,points:[[.55,.50],[.56,.60],[.57,.72],[.55,.80],[.51,.84],[.46,.85],[.42,.81]].map(([x,y])=>({x,y}))};
const dot={size:5,points:[[.55,.42],[.54,.415],[.54,.425],[.55,.43]].map(([x,y])=>({x,y}))};
assert.equal(j.detect([stem,dot],W,H)?.text,'j','two stroke lowercase j');
assert.equal(j.detect([dot,stem],W,H)?.text,'j','reverse pen order');
const flat={size:5,points:[{x:.5,y:.5},{x:.7,y:.5}]};
assert.equal(j.detect([flat,dot],W,H),null,'bar and dot not j');
assert.equal(j.detect([stem,flat],W,H),null,'hook without dot not j');
assert.equal(j.embeddedPairs([stem,dot],W,H).length,0,'standalone tested separately');
assert.equal(j.embeddedPairs([stem,dot,flat],W,H).length,1,'embedded j can be grouped');
console.log('PASS: derived 21 j examples, grouping, reject other symbols');
/* Synthetic reconstruction of the two wider dot gaps in the failing j × j
   diagnostic; raw teacher pen paths are not committed. */
const wideStem={points:[[.222,.346],[.238,.494],[.234,.530],[.199,.564],[.177,.519]].map(([x,y])=>({x,y}))};
const wideDot={points:[[.212,.216],[.210,.212],[.206,.210],[.205,.215]].map(([x,y])=>({x,y}))};
assert.equal(j.detect([wideStem,wideDot],372,360.4)?.text,'j','high dot is still j');
const farStem={points:[[.545,.340],[.554,.411],[.557,.504],[.549,.542],[.519,.559],[.497,.530]].map(([x,y])=>({x,y}))};
const farDot={points:[[.532,.248],[.532,.236],[.536,.238]].map(([x,y])=>({x,y}))};
assert.equal(j.detect([farStem,farDot],372,360.4)?.text,'j','second handwritten j');
assert.equal(j.embeddedPairs([wideStem,wideDot,flat,farStem,farDot],372,360.4).length,2,'both j pairs inside equation');
console.log('PASS extended dot gaps for both j in equation');
