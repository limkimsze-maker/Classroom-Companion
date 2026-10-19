/* Compile labelled teacher ink into quantized shape centroids; never publish raw traces.
 * node scripts/build-teacher-units.cjs /path/to/classroom-units-operators-training.json
 */
const fs=require('node:fs'),vm=require('node:vm');
const target='whiteboard-teacher-units-beta.js';
const source=fs.readFileSync(target,'utf8');
const ctx={window:{},atob,Float32Array,Math};vm.createContext(ctx);
vm.runInContext(source.replaceAll('root.WhiteboardTeacherUnits=', 'root.__feature=feature;root.WhiteboardTeacherUnits='),ctx);
const input=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const samples=input.samples.filter(s=>/^(?:mm|cm|m|km)[²³]$/.test(s.label));
const groups=new Map(),labels=[];
for(const s of samples){
 if(!labels.includes(s.label))labels.push(s.label);
 const v=Array.from(ctx.window.__feature(s.strokes,s.canvas.width,s.canvas.height)||[]);
 if(!v.length)continue;
 const key=JSON.stringify([s.label,s.strokes.length]);
 if(!groups.has(key))groups.set(key,[]);groups.get(key).push(v);
}
const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
const normalize=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n)};
const metadata=[],packed=[];
for(const [key,rows] of groups){
 const [label,count]=JSON.parse(key),k=Math.min(8,Math.ceil(rows.length/3));
 let centers=[rows[0].slice()];
 while(centers.length<k){
  let index=0,distance=-1;
  rows.forEach((r,i)=>{const d=1-Math.max(...centers.map(c=>dot(r,c)));if(d>distance){index=i;distance=d}});
  if(distance<1e-6)break;centers.push(rows[index].slice());
 }
 for(let iteration=0;iteration<16;iteration++){
  const sums=centers.map(()=>Array(256).fill(0)),sizes=centers.map(()=>0);
  for(const row of rows){const scores=centers.map(c=>dot(row,c)),i=scores.indexOf(Math.max(...scores));sizes[i]++;row.forEach((x,j)=>sums[i][j]+=x)}
  centers=centers.map((c,i)=>sizes[i]?normalize(sums[i]):c);
 }
 for(const v of centers){
  metadata.push([labels.indexOf(label),count]);
  const peak=Math.max(...v)||1,q=v.map(x=>Math.round(x/peak*15));
  for(let i=0;i<q.length;i+=2)packed.push(q[i]*16+q[i+1]);
 }
}
const data={samples:samples.length,labels,metadata,encoded:Buffer.from(packed).toString('base64')};
fs.writeFileSync(target,source.replace(/const modelData=.*; \/\/ GENERATED MODEL/,`const modelData=${JSON.stringify(data)}; // GENERATED MODEL`));
console.log(JSON.stringify({samples:data.samples,labels:labels.length,prototypes:metadata.length,bytes:packed.length}));
