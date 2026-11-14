/* Optional launch button. Include this script in a REVIEWED development copy only.
   Existing Whiteboard Smart and its local-only security settings stay unchanged. */
(()=>{
  function add(){
    if(document.getElementById('ccClassroomModeLaunch'))return;
    const toolbar=document.querySelector('header.top .tools');if(!toolbar)return;
    const link=document.createElement('a');
    link.id='ccClassroomModeLaunch';link.className='btn soft';
    link.href='whiteboard-classroom-mode.html';link.target='_blank';link.rel='noopener noreferrer';
    link.textContent='👥 Classroom Mode';
    link.title='Open the separate Classroom Mode without altering your existing whiteboard';
    Object.assign(link.style,{display:'inline-flex',alignItems:'center',justifyContent:'center',textDecoration:'none',whiteSpace:'nowrap',minHeight:'38px'});
    toolbar.prepend(link);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add,{once:true});else add();
})();
