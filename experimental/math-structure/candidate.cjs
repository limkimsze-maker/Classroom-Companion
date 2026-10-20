'use strict';
// Build an isolated candidate from the exact protected reader. Never write to V1.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const protectedSha256='8f65225b10916834a4740353eb652b5bedf56f26144d523fdb384aa26718713f';
function build(){
 let source=fs.readFileSync(path.join(root,'whiteboard-handwriting-recognition-beta.js'),'utf8');
 const actual=crypto.createHash('sha256').update(source).digest('hex');
 if(actual!==protectedSha256)throw Error('Protected V1 reader differs; review and rebaseline before building V2');
 for(const {before,after} of require('./parser-patches.json')){
  if(!before||source.split(before).length!==2)throw Error('Experimental parser edit is missing or ambiguous');
  source=source.replace(before,()=>after);
 }
 const trigger="if((options.mode||'auto')==='auto'){\n  const radical=await detectSquareRoot(strokes,W,H,options);";
 if(source.split(trigger).length!==2)throw Error('Missing unique structural dispatch boundary');
 source=source.replace(trigger,"if((options.mode||'auto')==='auto'){\n  let structured;\n  try{structured=await structuralV2.recognize(strokes,W,H,options)}catch(error){if(error?.name==='AbortError')throw error}\n  if(structured)return reconcile(structured);\n  const radical=await detectSquareRoot(strokes,W,H,options);");
 const end="window.WhiteboardHandwritingMath={recognize,predictDigit,rasterDigit,segment};";
 source=source.replace(end,"const structuralV2=window.WhiteboardStructuralParserFactory({bounds,operatorStroke,operatorCrossing,radicalHook,radicalDescendingHook,radicalParenthesis,recognizeNumericContext,segment,predictDigit,rasterDigit,closedZeroInk,completeNumericExpression,checkCancelled});\nwindow.WhiteboardHandwritingMath={recognize,predictDigit,rasterDigit,segment,structuralV2};");
 source=source.replace("'20261020-v2-isolated-parser1'","'20261020-v2-structural-beam1'");
 return fs.readFileSync(path.join(__dirname,'structural-parser.js'),'utf8')+'\n'+source;
}
module.exports={build,protectedSha256};
if(require.main===module){
 const output=process.argv[2];
 if(!output)throw Error('Provide a separate candidate output path');
 if(path.resolve(output)===path.join(root,'whiteboard-handwriting-recognition-beta.js'))throw Error('Cannot overwrite protected V1');
 fs.writeFileSync(output,build());
 console.log('Built isolated V2:',output);
}
