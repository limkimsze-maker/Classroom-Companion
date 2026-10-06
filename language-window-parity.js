(function(){
'use strict';
if(window.__ccLanguageWindowParityV2)return;
window.__ccLanguageWindowParityV2=true;

const LANG=(document.documentElement.lang||'').toLowerCase();
const CFG=LANG.startsWith('zh')?{prefix:'ClassroomCompanionCN',full:'⛶ 全屏',exit:'↙ 退出全屏',close:'关闭',blocked:'请允许弹出式窗口',hint:'如果浏览器工具栏仍显示，请再点一次“⛶ 全屏”。'}:
LANG.startsWith('ms')?{prefix:'ClassroomCompanionMS',full:'⛶ Skrin penuh',exit:'↙ Keluar skrin penuh',close:'Tutup',blocked:'Sila benarkan tetingkap timbul',hint:'Jika bar Chrome masih kelihatan, klik “⛶ Skrin penuh” sekali lagi.'}:
{prefix:'ClassroomCompanionTA',full:'⛶ முழுத் திரை',exit:'↙ முழுத் திரையிலிருந்து வெளியேறு',close:'மூடு',blocked:'Pop-up சாளரங்களை அனுமதிக்கவும்',hint:'Chrome பட்டைகள் இன்னும் தெரிந்தால், “⛶ முழுத் திரை” என்பதை மீண்டும் அழுத்தவும்.'};
const expanded=new Map();

function translatedUrl(t,display){
  const base=DIRECT[t.slug];
  if(base)return base+'&v='+Date.now();
  return 'support-tool.html?tool='+encodeURIComponent(t.slug)+(display?'&display='+encodeURIComponent(display):'')+'&v='+Date.now();
}
function screenInfo(){
  const s=window.screen||{};
  return {left:Number.isFinite(s.availLeft)?s.availLeft:0,top:Number.isFinite(s.availTop)?s.availTop:0,width:Math.max(800,s.availWidth||s.width||1280),height:Math.max(600,s.availHeight||s.height||800)};
}
function isCompact(slug){return slug==='timer-calm-music'||slug==='transition-countdown'}
function pipSize(slug){return isCompact(slug)?{width:344,height:256,preferInitialWindowPlacement:true}:{width:430,height:320}}
function styleButton(b,primary){b.style.cssText='min-height:40px;padding:0 12px;border-radius:11px;border:1px solid '+(primary?'#0f766e':'#cad7df')+';background:'+(primary?'#0f766e':'rgba(255,255,255,.97)')+';color:'+(primary?'#fff':'#17324d')+';font:900 13px/1 system-ui;cursor:pointer;box-shadow:0 5px 16px rgba(18,32,46,.14);white-space:nowrap'}
function updateFsButton(win,b){if(!win||win.closed||!b)return;b.textContent=win.document.fullscreenElement?CFG.exit:CFG.full}
async function toggleFullscreen(win,b){try{if(win.document.fullscreenElement)await win.document.exitFullscreen();else if(win.document.documentElement.requestFullscreen)await win.document.documentElement.requestFullscreen({navigationUI:'hide'})}catch(e){}updateFsButton(win,b)}
function buildFullscreenWindow(win,t){
  const d=win.document;d.open();d.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title></title></head><body></body></html>');d.close();d.title=t.title;
  d.documentElement.style.cssText='margin:0;width:100%;height:100%;overflow:hidden;background:#fff';d.body.style.cssText='margin:0;width:100%;height:100%;overflow:hidden;background:#fff;position:relative';
  const frame=d.createElement('iframe');frame.src=translatedUrl(t,'fullscreen');frame.title=t.title;frame.allow='autoplay; fullscreen';frame.setAttribute('allowfullscreen','');frame.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff';d.body.appendChild(frame);
  const controls=d.createElement('div');controls.style.cssText='position:fixed;top:10px;right:12px;z-index:2147483647;display:flex;gap:8px;align-items:center';
  const fs=d.createElement('button');fs.type='button';fs.textContent=CFG.full;styleButton(fs,true);fs.onclick=e=>{e.preventDefault();e.stopPropagation();toggleFullscreen(win,fs)};
  const close=d.createElement('button');close.type='button';close.textContent='✕';close.title=CFG.close;styleButton(close,false);close.onclick=e=>{e.preventDefault();e.stopPropagation();try{win.close()}catch(err){}};controls.append(fs,close);d.body.appendChild(controls);
  const hint=d.createElement('div');hint.textContent=CFG.hint;hint.style.cssText='position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483646;background:rgba(23,50,77,.92);color:#fff;padding:9px 14px;border-radius:999px;font:800 12px/1.2 system-ui;box-shadow:0 5px 18px rgba(0,0,0,.18);opacity:0;transition:opacity .18s;pointer-events:none';d.body.appendChild(hint);
  d.addEventListener('fullscreenchange',()=>{updateFsButton(win,fs);if(d.fullscreenElement)hint.style.opacity='0'});setTimeout(()=>{if(!win.closed&&!d.fullscreenElement){hint.style.opacity='1';setTimeout(()=>{hint.style.opacity='0'},3200)}},450);
  try{const p=d.documentElement.requestFullscreen&&d.documentElement.requestFullscreen({navigationUI:'hide'});if(p&&typeof p.catch==='function')p.catch(()=>{})}catch(e){}
}
function openTrueFullscreen(t){
  const s=screenInfo();let win=null;try{win=window.open('',CFG.prefix+'_FULL_'+t.slug.replace(/[^a-z0-9_-]/gi,'_'),`popup=yes,resizable=yes,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,left=${s.left},top=${s.top},width=${s.width},height=${s.height}`)}catch(e){}
  if(!win){say(CFG.blocked);return false}try{win.moveTo(s.left,s.top);win.resizeTo(s.width,s.height)}catch(e){}buildFullscreenWindow(win,t);try{win.focus()}catch(e){}setTimeout(()=>{if(pip&&!pip.closed){try{pip.close()}catch(e){}}},100);return true;
}
async function enhancedPiP(t){
  if(!hasPiP)return false;
  try{
    if(pip&&!pip.closed&&pipSlug===t.slug){try{pip.focus()}catch(e){};return true}if(pip&&!pip.closed){try{pip.close()}catch(e){}}
    pip=await window.documentPictureInPicture.requestWindow(pipSize(t.slug));pipSlug=t.slug;mark(t.slug,true);
    const d=pip.document;d.title=t.title;d.documentElement.style.cssText='margin:0;width:100%;height:100%;overflow:hidden;background:#fff';d.body.style.cssText='margin:0;width:100%;height:100%;overflow:hidden;background:#fff;position:relative';
    const f=d.createElement('iframe');f.src=translatedUrl(t);f.title=t.title;f.allow='autoplay; fullscreen';f.setAttribute('allowfullscreen','');f.style.cssText='display:block;width:100%;height:100%;border:0;background:#fff';d.body.replaceChildren(f);
    const b=d.createElement('button');b.type='button';b.textContent='⛶';b.title=CFG.full;b.setAttribute('aria-label',CFG.full);b.style.cssText='position:fixed;top:7px;right:48px;z-index:2147483647;width:31px;height:31px;border:1px solid #cbd8df;border-radius:9px;background:rgba(255,255,255,.97);color:#17324d;font:900 17px/1 system-ui;display:grid;place-items:center;cursor:pointer;box-shadow:0 3px 10px rgba(18,32,46,.10);padding:0';b.onclick=e=>{e.preventDefault();e.stopPropagation();openTrueFullscreen(t)};d.body.appendChild(b);
    pip.addEventListener('pagehide',()=>{mark(t.slug,false);pip=null;pipSlug=''},{once:true});return true;
  }catch(e){pip=null;pipSlug='';mark(t.slug,false);return false}
}
function toggleExistingPopup(t,w){if(t.mode==='full'){try{w.focus()}catch(e){};return}const on=!expanded.get(t.slug);expanded.set(t.slug,on);const s=spec(on?'full':t.mode);try{w.resizeTo(s.w,s.h);w.moveTo(s.x,s.y);w.focus()}catch(e){}buttons.get(t.slug)?.classList.toggle('expanded',on)}
function enhancedPopup(t){
  const old=windows.get(t.slug);if(old){try{if(!old.closed){toggleExistingPopup(t,old);return}}catch(e){}}
  expanded.set(t.slug,false);const s=spec(t.mode),name=CFG.prefix+'_'+t.slug.replace(/[^a-z0-9]/gi,'_');const w=window.open(translatedUrl(t),name,`popup=yes,width=${s.w},height=${s.h},left=${s.x},top=${s.y},resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no`);if(!w){say(CFG.blocked);return}windows.set(t.slug,w);mark(t.slug,true);try{w.focus()}catch(e){}
}
async function enhancedOpen(t){if(t.mode==='mini'&&hasPiP){const ok=await enhancedPiP(t);if(ok)return}enhancedPopup(t)}
for(const t of TOOLS){const b=buttons.get(t.slug);if(b)b.onclick=()=>enhancedOpen(t)}
})();