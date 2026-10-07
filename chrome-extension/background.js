'use strict';

const TOOLBAR_URL='https://limkimsze-maker.github.io/Classroom-Companion/widget-launch.html';
const STORE_KEY='classroomCompanionLauncherWindowId';
const WIDTH=370;

async function getHostWindow(){
  try{return await chrome.windows.getLastFocused({windowTypes:['normal']})}
  catch(e){return null}
}

function geometry(host){
  const top=(Number.isFinite(host?.top)?host.top:0)+8;
  const left=(Number.isFinite(host?.left)?host.left:0)+8;
  const available=Math.max(620,(Number.isFinite(host?.height)?host.height:780)-16);
  const height=Math.min(760,available);
  return {left,top,width:WIDTH,height};
}

async function getStoredWindowId(){
  try{
    const data=await chrome.storage.local.get(STORE_KEY);
    return Number.isInteger(data[STORE_KEY])?data[STORE_KEY]:null;
  }catch(e){return null}
}

async function saveWindowId(id){
  try{await chrome.storage.local.set({[STORE_KEY]:id})}catch(e){}
}

async function clearWindowId(){
  try{await chrome.storage.local.remove(STORE_KEY)}catch(e){}
}

async function focusExisting(id,bounds){
  if(!Number.isInteger(id))return false;
  try{
    await chrome.windows.get(id);
    await chrome.windows.update(id,{...bounds,focused:true,state:'normal'});
    return true;
  }catch(e){
    await clearWindowId();
    return false;
  }
}

async function openStrip(){
  const host=await getHostWindow();
  const bounds=geometry(host);
  const existingId=await getStoredWindowId();
  if(await focusExisting(existingId,bounds))return;

  try{
    const win=await chrome.windows.create({
      url:TOOLBAR_URL+'?launcher=extension&v='+Date.now(),
      type:'popup',
      focused:true,
      ...bounds
    });
    if(Number.isInteger(win?.id))await saveWindowId(win.id);
  }catch(e){
    try{await chrome.tabs.create({url:TOOLBAR_URL+'?launcher=extension&v='+Date.now()})}catch(_){}
  }
}

chrome.action.onClicked.addListener(()=>{openStrip()});
chrome.windows.onRemoved.addListener(async id=>{
  const saved=await getStoredWindowId();
  if(saved===id)await clearWindowId();
});
