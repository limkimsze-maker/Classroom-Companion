'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {build}=require('./candidate.cjs');
const root=path.resolve(__dirname,'../..'),source=build();
const version=source.match(/WhiteboardHandwritingMath\.build='([^']+)'/)[1];
let controller=fs.readFileSync(path.join(root,'whiteboard-handwriting-beautify-beta.js'),'utf8');
controller=controller.replace(/const readerBuild='[^']+'/,`const readerBuild='${version}'`)
 .replace("['whiteboard-handwriting-recognition-beta.js',","['experimental/math-structure/reader-v2.js',");
let html=fs.readFileSync(path.join(root,'whiteboard-smart-beta.html'),'utf8');
html=html.replace('<head>','<head>\n<script src="experimental/math-structure/preview-bootstrap.js?v='+version+'"></script>')
 .replace(/whiteboard-handwriting-recognition-beta\.js\?v=[^"']+/g,'experimental/math-structure/reader-v2.js?v='+version)
 .replace(/whiteboard-handwriting-beautify-beta\.js\?v=[^"']+/g,'experimental/math-structure/beautify-v2.js?v='+version);
assert(html.includes('experimental/math-structure/reader-v2.js?v='+version));
assert(html.includes('experimental/math-structure/beautify-v2.js?v='+version));
const output={'experimental/math-structure/reader-v2.js':source,
 'experimental/math-structure/beautify-v2.js':controller,'whiteboard-v2-trial.html':html};
for(const [file,content] of Object.entries(output)){
 const target=path.join(root,file);
 if(process.argv.includes('--check'))assert.equal(fs.readFileSync(target,'utf8'),content,'Regenerate '+file);
 else fs.writeFileSync(target,content);
}
console.log('PASS isolated V2 preview assets match source and reader/controller cache versions');
