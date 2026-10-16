(function(){
'use strict';
const edition=(new URLSearchParams(location.search).get('edition')||'en').toLowerCase();
const TXT={
 en:{button:'🧊 3D Solid',menu:'3D Solid'},
 zh:{button:'🧊 3D 立体图形',menu:'3D 立体图形'},
 ms:{button:'🧊 Pepejal 3D',menu:'Pepejal 3D'},
 ta:{button:'🧊 3D திண்மம்',menu:'3D திண்மம்'}
};
const L=TXT[edition]||TXT.en;
function openSolidPicker(){
 const solidMenuButton=[...document.querySelectorAll('button')].find(b=>b.id!=='smartSolidBtn'&&(b.textContent||'').trim()===L.menu);
 if(solidMenuButton){solidMenuButton.click();return;}
 const smart=document.getElementById('smartMathBtn');
 if(smart){smart.click();setTimeout(()=>{
   const b=[...document.querySelectorAll('button')].find(x=>x.id!=='smartSolidBtn'&&(x.textContent||'').trim()===L.menu);
   if(b)b.click();
 },0)}
}
function ensure(){
 const tools=document.querySelector('.tools');
 if(!tools)return false;
 if(document.getElementById('smartSolidBtn'))return true;
 const b=document.createElement('button');
 b.className='btn soft';
 b.type='button';
 b.id='smartSolidBtn';
 b.textContent=L.button;
 b.title=L.button;
 b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openSolidPicker()},true);
 const anchor=document.getElementById('smartMathBtn');
 if(anchor&&anchor.nextSibling)tools.insertBefore(b,anchor.nextSibling);
 else if(anchor)tools.appendChild(b);
 else tools.insertBefore(b,document.getElementById('undoBtn')||null);
 return true;
}
new MutationObserver(ensure).observe(document.body,{childList:true,subtree:true});
ensure();
})();
