(function(){
'use strict';
const canvas=document.getElementById('board');
if(!canvas)return;
const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const T={
 en:{paste:'📋 Paste image',empty:'No image found on the clipboard',blocked:'Clipboard access was blocked. Use Ctrl+V instead.'},
 zh:{paste:'📋 粘贴图片',empty:'剪贴板中没有找到图片',blocked:'浏览器阻止了剪贴板访问。请改用 Ctrl+V。'},
 ms:{paste:'📋 Tampal imej',empty:'Tiada imej ditemui dalam papan klip',blocked:'Akses papan klip disekat. Gunakan Ctrl+V.'},
 ta:{paste:'📋 படத்தை ஒட்டு',empty:'கிளிப்போர்டில் படம் இல்லை',blocked:'கிளிப்போர்டு அணுகல் தடுக்கப்பட்டது. Ctrl+V பயன்படுத்தவும்.'}
};
const L=T[edition]||T.en;
let menu=null;
function toast(msg){
 const el=document.getElementById('toast');
 if(!el)return;
 el.textContent=msg;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),1800);
}
function close(){if(menu){menu.remove();menu=null}}
function fileInput(){return document.querySelector('input[type="file"][accept="image/*"]')}
async function pasteImage(){
 close();
 try{
  if(!navigator.clipboard?.read)throw new Error('clipboard-read-unavailable');
  const items=await navigator.clipboard.read();
  let blob=null;
  for(const item of items){
   const type=item.types.find(t=>t.startsWith('image/'));
   if(type){blob=await item.getType(type);break}
  }
  if(!blob){toast(L.empty);return}
  const input=fileInput();if(!input){toast(L.blocked);return}
  const ext=(blob.type.split('/')[1]||'png').replace('jpeg','jpg');
  const f=new File([blob],`clipboard-image.${ext}`,{type:blob.type});
  const dt=new DataTransfer();dt.items.add(f);input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
 }catch(err){toast(L.blocked)}
}
function openMenu(e){
 e.preventDefault();e.stopPropagation();close();
 menu=document.createElement('div');
 menu.setAttribute('role','menu');
 Object.assign(menu.style,{position:'fixed',zIndex:'10000',left:`${Math.min(e.clientX,innerWidth-190)}px`,top:`${Math.min(e.clientY,innerHeight-56)}px`,background:'#fff',border:'1px solid #d8e1e8',borderRadius:'10px',boxShadow:'0 10px 28px rgba(18,32,46,.18)',padding:'6px',minWidth:'176px'});
 const btn=document.createElement('button');
 btn.type='button';btn.textContent=L.paste;btn.setAttribute('role','menuitem');
 Object.assign(btn.style,{width:'100%',border:'0',background:'#fff',color:'#17324d',padding:'9px 11px',borderRadius:'8px',textAlign:'left',font:'700 13px Inter,system-ui,sans-serif',cursor:'pointer'});
 btn.onmouseenter=()=>btn.style.background='#e7f7f4';btn.onmouseleave=()=>btn.style.background='#fff';btn.onclick=pasteImage;
 menu.appendChild(btn);document.body.appendChild(menu);btn.focus();
}
canvas.addEventListener('contextmenu',openMenu);
document.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target))close()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()},true);
window.addEventListener('blur',close);
})();
