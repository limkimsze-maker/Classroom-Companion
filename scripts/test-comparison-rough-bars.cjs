'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('smart-math-comparison-predrawn-robust3.js','utf8');
const a=source.indexOf('function rawInk('),b=source.indexOf('function synthetic(',a);
assert(a>=0&&b>a,'Comparison recogniser functions missing');
const recogniser=source.slice(a,b);
const context={
 document:{getElementById:()=>({getBoundingClientRect:()=>({width:900,height:1400})})},
 innerWidth:900,innerHeight:1400
};
vm.createContext(context);
vm.runInContext(recogniser,context);
const ink=coords=>({points:coords.map(([x,y])=>({x:x/900,y:y/1400}))});
function bar(x,y,w,h,rough=false){
 const pts=rough?[[x,y+2],[x+w*.3,y],[x+w,y+2],[x+w+2,y+h],[x+w*.5,y+h+2],[x,y+h],[x,y+2]]:[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]];
 return ink(pts);
}
function choose(items){
 context.testSource=items;
 return vm.runInContext('chooseBars(testSource)',context).map(c=>Array.from(c.items,q=>q.s));
}
function check(items,expected,title){
 const output=choose(items);
 assert.equal(output.length,expected.length,title+' row count');
 for(let i=0;i<expected.length;i++)assert.deepEqual(output[i],expected[i],title+' row '+i);
}
const upper=bar(150,350,410,85,true),lower=bar(150,470,220,76,true),dot=ink([[700,620]]);
check([upper,lower,dot],[[upper],[lower]],'rough bars and stray dot');
check([upper,lower],[[upper],[lower]],'draw-first bar grouping');
const distant=bar(720,750,150,70);
check([upper,lower,distant,dot],[[upper],[lower]],'ignore unrelated distant bar');
const equal=bar(150,470,410,76,true);
check([upper,equal,dot],[[upper],[equal]],'equal-length comparison');
const upperShort=bar(150,350,220,85,true),lowerLong=bar(150,470,410,76,true);
check([upperShort,lowerLong,dot],[[upperShort],[lowerLong]],'longer bottom bar');
const corners=(x,y,w,h)=>[
 ink([[x,y],[x+w,y]]),ink([[x+w,y],[x+w,y+h]]),
 ink([[x+w,y+h],[x,y+h]]),ink([[x,y+h],[x,y]])
];
const topParts=corners(150,330,410,50),bottomParts=corners(150,460,220,65);
check([...topParts,...bottomParts], [topParts,bottomParts], 'multi-stroke rectangular bars');
assert.equal(choose([upper,dot]).length,0,'A lone bar and stray dot are not a comparison');
console.log('PASS: 7 rough comparison candidate-grouping regression checks');