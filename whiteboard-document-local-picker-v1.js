(function(){
'use strict';

function toast(msg){
  try{if(typeof say==='function'){say(msg);return}}catch{}
  const t=document.getElementById('toast');
  if(!t)return;
  t.textContent=msg;
  t.classList.add('show');
  clearTimeout(t._localPickerTimer);
  t._localPickerTimer=setTimeout(()=>t.classList.remove('show'),1800);
}

function findDocumentInput(){
  return [...document.querySelectorAll('input[type="file"]')].find(el=>/pdf|docx|wordprocessingml/i.test(el.accept||''))||null;
}

function isDocumentOpenButton(target){
  const btn=target?.closest?.('button');
  if(!btn)return false;
  if(btn.id==='openDocumentBtn')return true;
  return (btn.title||'')==='Open another document';
}

async function chooseLocalDocument(){
  const input=findDocumentInput();
  if(!input){toast('Document opener is not ready.');return}

  if(typeof window.showOpenFilePicker!=='function'){
    input.click();
    return;
  }

  try{
    const [handle]=await window.showOpenFilePicker({
      multiple:false,
      excludeAcceptAllOption:false,
      types:[{
        description:'PDF or Word document',
        accept:{
          'application/pdf':['.pdf'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document':['.docx']
        }
      }]
    });
    if(!handle)return;
    const file=await handle.getFile();
    const name=(file.name||'').toLowerCase();
    if(!name.endsWith('.pdf')&&!name.endsWith('.docx')){
      toast('Please choose a PDF or .docx file.');
      return;
    }

    // Feed the locally chosen File into the existing proven document-opening path.
    const dt=new DataTransfer();
    dt.items.add(file);
    input.files=dt.files;
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }catch(err){
    if(err&&err.name==='AbortError')return;
    console.error(err);
    toast('Local file picker could not open this file.');
  }
}

// Capture before the existing button listener can call input.click().
document.addEventListener('click',e=>{
  if(!isDocumentOpenButton(e.target))return;
  if(typeof window.showOpenFilePicker!=='function')return;
  e.preventDefault();
  e.stopImmediatePropagation();
  chooseLocalDocument();
},true);
})();
