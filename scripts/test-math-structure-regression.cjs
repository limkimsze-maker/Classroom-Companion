'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const createContext=require('./helpers/handwriting-context.cjs');
const source=fs.readFileSync('whiteboard-handwriting-recognition-beta.js','utf8');
new vm.Script(source,{filename:'whiteboard-handwriting-recognition-beta.js'});
assert(source.includes("async function detectSquareRoot("),'square-root detector missing');
assert(source.includes("async function radicalExpression("),'radical grammar missing');
assert(source.includes("async function detectParenthesizedNumber("),'bracket detector missing');
assert(!source.includes(String.raw`[0-9+−×÷().\\s]`),'incorrect double-escaped whitespace grammar');
const ctx=createContext();
assert.equal(typeof ctx.WhiteboardHandwritingMath.recognize,'function');
const S=coords=>({size:5,points:coords.map(([x,y])=>({x:x/400,y:y/300}))});
const bracket=[S([[70,95],[61,106],[55,127],[55,150],[61,173],[70,185]]),
 S([[95,113],[95,163]]),S([[120,120],[133,110],[145,120],[147,148],[138,164],[124,157],[120,137]]),
 S([[166,95],[176,106],[182,127],[182,150],[176,173],[166,185]])];

// A roof-first radical must not be interpreted as the letter V.
const reverseRoot=[S([[112,71],[160,66],[220,62],[300,59]]),
 S([[110,76],[104,102],[97,116],[89,108],[74,98]]),
 ...bracket.map(stroke=>({...stroke,points:stroke.points.map(p=>({x:p.x+0.22,y:((p.y*300-95)*0.48+78)/300}))}))];
const radical=[S([[46,85],[52,111],[59,128],[68,92],[77,55]]),
 S([[77,55],[125,55],[170,55],[225,55],[270,55]])];
(async()=>{
 const nested=bracket.map(stroke=>({...stroke,points:stroke.points.map(p=>({x:p.x+0.19,y:((p.y*300-95)*0.55+62)/300}))}));
 const cases=[['standalone parentheses',bracket],['radical with parentheses',[...radical,...nested]],['roof-first radical with parentheses',reverseRoot]];
 let failures=0;
 for(const [label,ink] of cases){
  const r=await ctx.WhiteboardHandwritingMath.recognize(ink,400,300,{mode:'auto'});
  const ok=label==='standalone parentheses'?r.text.startsWith('(')&&r.text.endsWith(')'):r.text.startsWith('\\sqrt{')&&r.text.endsWith('}');
  console.log(JSON.stringify({label,output:r.text,engine:r.engine,pass:ok}));
  if(!ok)failures++;
 }

const teacherRows="2780,2387;2875,2400;2967,2405;3087,2410;3247,2410;3435,2398;3670,2378;3922,2340;4188,2300;4465,2259;4739,2216;5009,2181;5261,2159;5500,2147;5723,2135;5957,2117;6176,2094;6413,2067;6659,2045;6904,2025;7148,2011;7382,1998;7579,1988;7737,1977;7828,1967;7892,1957|2726,2541;2688,2575;2680,2634;2668,2682;2661,2754;2649,2878;2623,3067;2585,3299;2540,3539;2499,3722;2466,3834;2432,3881;2414,3818;2414,3764;2405,3710;2383,3665;2347,3630;2294,3599;2219,3564;2125,3507;2025,3424;1921,3326;1867,3271|3798,2961;3794,2914;3767,2846;3723,2809;3665,2783;3599,2778;3516,2804;3447,2851;3415,2912;3418,2991;3480,3091;3580,3202;3661,3307;3706,3389;3711,3453;3665,3494;3592,3513;3518,3518;3457,3497;3436,3431;3447,3330;3516,3212;3623,3127;3729,3079;3809,3062|4448,3000;4551,2983;4674,2974;4822,2976;4970,2992;5098,2997|4836,2516;4808,2559;4799,2684;4791,2873;4771,3087;4758,3253;4747,3365|5955,2445;5910,2448;5860,2484;5776,2560;5717,2702;5689,2888;5685,3070;5745,3203;5799,3284|6297,2645;6272,2816;6259,3045;6250,3263;6261,3368|6683,2881;6654,2951;6651,3078;6706,3203;6813,3284;6924,3304;7006,3250;7058,3118;7054,2961;6997,2795;6907,2654;6816,2619;6717,2698;6640,2852;6620,2966|7458,2225;7524,2269;7616,2459;7701,2774;7720,3115;7627,3417;7434,3610;7190,3683;7031,3648";
const teacherInk=teacherRows.split('|').map(row=>({size:5,points:row.split(';').map(pair=>{const [x,y]=pair.split(',').map(Number);return{x:x/10000,y:y/10000};})}));
const teacherResult=await ctx.WhiteboardHandwritingMath.recognize(teacherInk,372,404.24444580078125,{mode:'auto'});
console.log('Actual teacher bracketed radical:',JSON.stringify({text:teacherResult.text,engine:teacherResult.engine}));
assert.equal(teacherResult.text,'\\sqrt{8+(10)}','actual teacher bracketed square root');
 assert.equal(failures,0,'structural math recognition regression');
 console.log('PASS math structure regression');
})().catch(error=>{console.error(error);process.exitCode=1});
