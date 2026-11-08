/* Live browser smoke test for the ACTUAL Spotify Basic Pitch model.
 * Uses only locally generated audio. No microphone, uploads, paid APIs or
 * production Music Score Studio files are involved.
 * Distinct from seeded-note synthetic verification tests.
 */
'use strict';
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.cjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
let browser,server;
async function main(){
 server=http.createServer(async(req,res)=>{
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   const file=path.resolve(root,'.'+pathname);
   if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
   const bytes=await fs.promises.readFile(file);
   res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(bytes);
  }catch(_){res.writeHead(404).end('Not found')}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const port=server.address().port;
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+port+'/music-score-studio/hum-to-compose-benchmark.html',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#runSpotify').count(),1,'Spotify benchmark button must exist');
 await page.locator('#runSpotify').click();
 await page.waitForFunction(()=>{
  const result=document.querySelector('#spotifyResult')?.textContent||'';
  return result.includes('ACTUAL Spotify Basic Pitch inference')||result.includes('Real Spotify benchmark stopped after');
 },{timeout:600000});
 const result=await page.locator('#spotifyResult').innerText();
 console.log('\n'+result+'\n');
 assert.ok(result.startsWith('ACTUAL Spotify Basic Pitch inference'), 'Spotify model run failed: '+result+'\nPage errors: '+errors.join(' | '));
 const completed=/Melodies successfully analysed:\s*(\d+)\/(\d+)/.exec(result);
 assert.ok(completed,'Missing real-model completion count');
 assert.equal(Number(completed[1]),8,'Not all eight generated melodies were analysed');
 assert.equal(Number(completed[2]),8);
 const f1=/One-to-one note F1:\s*([\d.]+)%/.exec(result);
 assert.ok(f1,'Missing measured real-model F1');
 assert.ok(Number.isFinite(Number(f1[1])),'Non-numeric real-model F1');
 console.log('PASS: actual Spotify neural inference completed for 8/8 synthetic clips; F1='+f1[1]+'%.');
 console.log('This does NOT prove human humming or Samsung microphone reliability.');
}
main().catch(e=>{console.error('LIVE SPOTIFY BROWSER TEST FAILED:',e);process.exitCode=1})
 .finally(async()=>{if(browser)await browser.close().catch(()=>{});if(server)await new Promise(resolve=>server.close(resolve))});
