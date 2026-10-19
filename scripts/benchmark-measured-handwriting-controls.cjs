/* Replay owner-provided unit/diagnostic files locally. No private ink is bundled.
 * node scripts/benchmark-measured-handwriting-controls.cjs corpus.json diagnostics-dir out.json
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ctx=require('./helpers/handwriting-context.cjs')();
const samples=JSON.parse(fs.readFileSync(process.argv[2],'utf8')).samples,folder=process.argv[3];
const diagnostic=JSON.parse(fs.readFileSync(path.join(folder,'equals-handwriting-strokes (3).json'),'utf8'));
const W=diagnostic.selection.width,H=diagnostic.selection.height,prefix=diagnostic.strokes.slice(0,2);
const points=prefix.flatMap(s=>s.points.map(p=>({x:p.x*W,y:p.y*H}))),right=Math.max(...points.map(p=>p.x)),bottom=Math.max(...points.map(p=>p.y));
const height=bottom-Math.min(...points.map(p=>p.y));
function compose(s){
 const p=s.strokes.flatMap(stroke=>stroke.points.map(p=>({x:p.x*s.canvas.width,y:p.y*s.canvas.height})));
 const left=Math.min(...p.map(p=>p.x)),low=Math.max(...p.map(p=>p.y)),top=Math.min(...p.map(p=>p.y)),scale=height/(low-top);
 return[...prefix,...s.strokes.map(stroke=>({...stroke,points:stroke.points.map(p=>({x:(right+height*.22+(p.x*s.canvas.width-left)*scale)/W,y:(bottom+(p.y*s.canvas.height-low)*scale)/H}))}))];
}
(async()=>{
 const area=samples.filter(s=>['mm²','cm²','m²','km²','mm³','cm³','m³'].includes(s.label)),failures=[],diagnostics=[];
 for(let i=0;i<area.length;i++){
  const s=area[i],r=await ctx.WhiteboardHandwritingMath.recognize(compose(s),W,H,{mode:'auto'});
  if(r.text!=='10 '+s.label)failures.push({index:i,expected:'10 '+s.label,actual:r.text});
 }
 for(const name of fs.readdirSync(folder).filter(n=>/^equals-handwriting-strokes.*\.json$/.test(n))){
  const d=JSON.parse(fs.readFileSync(path.join(folder,name),'utf8')),r=await ctx.WhiteboardHandwritingMath.recognize(d.strokes,d.selection.width,d.selection.height,{mode:'auto'});
  const expected=name==='equals-handwriting-strokes (4).json'?'6 − 2 = 4 cm²':'10 m³';
  diagnostics.push({file:name,expected,actual:r.text,correct:r.text===expected});
 }
 const result={readerSha256:crypto.createHash('sha256').update(fs.readFileSync('whiteboard-handwriting-recognition-beta.js')).digest('hex'),total:area.length,correct:area.length-failures.length,failures,diagnostics};
 fs.writeFileSync(process.argv[4],JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 if(failures.length||diagnostics.some(r=>!r.correct))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
