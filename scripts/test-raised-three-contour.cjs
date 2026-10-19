const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('whiteboard-handwriting-recognition-beta.js','utf8');
new vm.Script(src);
const ctx={window:{},Float32Array,Int8Array,Math};vm.createContext(ctx);
vm.runInContext(src.replace(/\}\)\(\);\s*$/,'window.__three=raisedThreeContour;})();'),ctx);
const stroke=p=>({points:p.map(([x,y])=>({x,y}))});
const three=stroke([[.35,.13],[.54,0],[.77,.03],[.96,.19],[1,.44],[.73,.53],[.38,.53],[.5,.53],[.62,.62],[.73,.78],[.77,.97],[.58,1],[.31,1],[0,.94]]);
function dense(s){const out=[];for(let i=0;i<s.points.length-1;i++){const a=s.points[i],b=s.points[i+1];for(let t=0;t<4;t++)out.push({x:a.x+(b.x-a.x)*t/4,y:a.y+(b.y-a.y)*t/4})}out.push(s.points.at(-1));return{points:out}}
assert(ctx.window.__three(dense(three),40,40));
const two=dense(stroke([[.05,.1],[.4,0],[.9,.1],[1,.35],[.7,.58],[.1,.85],[0,.95],[.5,.95],[1,.95]]));
assert(!ctx.window.__three(two,40,40));
assert(src.includes('const trainedPower=window.WhiteboardUnitExponent?.match'));
assert(src.includes('!trainedPower&&contourThree'));
console.log('PASS geometric three fallback and trained-exponent precedence');
