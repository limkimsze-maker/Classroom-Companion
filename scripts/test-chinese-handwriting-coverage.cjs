'use strict';
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.woff2':'font/woff2','.png':'image/png'};
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://local');
  if(url.pathname==='/check.html'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><script>window.__CC_CHINESE_ALPHA__=true</script><script src="/experimental/chinese/vendor/opencc-t2cn.js"></script><script src="/experimental/chinese/recognizer.js"></script>');return}
  const file=path.join(root,decodeURIComponent(url.pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
 });await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/check.html');await page.waitForFunction(()=>!!window.CCChineseRecognizer);
  await page.evaluate(async()=>{const image=new Image();image.src='/scripts/fixtures/chinese-handwriting/wo-shi-hao-ren.png';await image.decode();window.fixture=image});
  let fallbacks=0;
  for(const config of [{scale:.5,pad:24},{scale:1,pad:24},{scale:2,pad:24},{scale:3,pad:24},{scale:4,pad:24},{scale:2,pad:0},{scale:3,pad:0},{scale:1,pad:60},{scale:2,pad:24,lines:2}]){
   const result=await page.evaluate(async config=>{
    const image=window.fixture,c=document.createElement('canvas'),rows=config.lines||1;
    c.width=image.width*config.scale+config.pad*2;c.height=image.height*config.scale*rows+config.pad*2+(rows-1)*70;
    const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);
    for(let i=0;i<rows;i++)ctx.drawImage(image,config.pad,config.pad+i*(image.height*config.scale+70),image.width*config.scale,image.height*config.scale);
    return CCChineseRecognizer.recognize(c);
   },config);
   assert.equal(result.text,Array(config.lines||1).fill('我是好人').join('\n'));if(result.metrics.lineFallback)fallbacks++;
   console.log('HANDWRITING_COVERAGE_OK',JSON.stringify(config),result.text,JSON.stringify(result.metrics));
  }
  assert(fallbacks>=3,'Must exercise the partial-detection fallback, not only easy reads');
  await page.evaluate(async()=>{const face=new FontFace('TestWenKai','url(/experimental/chinese/fonts/LXGWWenKaiGB-Regular.woff2)');await face.load();document.fonts.add(face)});
  for(const text of ['今天我们一起学习。','大','二','三','中文']){
   const result=await page.evaluate(async text=>{const c=document.createElement('canvas');c.width=Math.max(120,text.length*70+40);c.height=130;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#111';ctx.font='64px TestWenKai';ctx.fillText(text,20,95);return CCChineseRecognizer.recognize(c)},text);
   assert.equal(result.text,text);console.log('EXISTING_READING_OK',text);
  }
  const blank=await page.evaluate(async()=>{const c=document.createElement('canvas');c.width=200;c.height=120;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,200,120);return CCChineseRecognizer.recognize(c)});assert.equal(blank.text,'');
  assert.deepEqual(errors,[]);console.log('ALL_CHINESE_COVERAGE_CHECKS_PASSED');
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);process.exit(1)});
