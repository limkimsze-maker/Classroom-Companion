(function(){
'use strict';
const style=document.createElement('style');
style.id='documentRightDockStyles';
style.textContent=`
/* Document controls: slim vertical dock on the right */
#documentQuickBar{
  position:fixed!important;
  right:6px!important;
  top:50%!important;
  left:auto!important;
  bottom:auto!important;
  transform:translateY(-50%)!important;
  width:44px!important;
  max-height:calc(100vh - 18px)!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:flex-start!important;
  gap:4px!important;
  padding:5px 4px!important;
  border-radius:12px!important;
  background:rgba(255,255,255,.96)!important;
  box-shadow:0 5px 18px rgba(18,32,46,.18)!important;
  scrollbar-width:none!important;
}
#documentQuickBar::-webkit-scrollbar{display:none!important}
#documentQuickBar button{
  width:34px!important;
  min-width:34px!important;
  height:30px!important;
  min-height:30px!important;
  padding:0!important;
  flex:0 0 auto!important;
}
#documentQuickBar input[type="number"]{
  width:36px!important;
  height:30px!important;
  min-height:30px!important;
  padding:1px 2px!important;
  flex:0 0 auto!important;
}
#documentQuickBar span{
  width:36px!important;
  min-width:36px!important;
  line-height:1.05!important;
  white-space:normal!important;
  text-align:center!important;
  flex:0 0 auto!important;
}
/* Free the top teaching toolbar now that document controls are no longer horizontal. */
body.document-open-mode .tools{
  padding-right:0!important;
}
/* Search opens as a compact vertical flyout immediately to the left of the right dock. */
#documentSearchPanel{
  position:fixed!important;
  right:56px!important;
  top:50%!important;
  left:auto!important;
  bottom:auto!important;
  transform:translateY(-50%)!important;
  width:176px!important;
  flex-direction:column!important;
  align-items:stretch!important;
  gap:4px!important;
  padding:6px!important;
  border-radius:10px!important;
  background:rgba(255,255,255,.98)!important;
  box-shadow:0 5px 18px rgba(18,32,46,.18)!important;
}
#documentSearchPanel input{
  width:100%!important;
  min-width:0!important;
  height:30px!important;
}
#documentSearchPanel #documentSearchStatus{
  width:100%!important;
  max-width:none!important;
  min-width:0!important;
  text-align:center!important;
}
#documentSearchPanel button{
  width:100%!important;
  min-width:0!important;
  height:29px!important;
}
@media(max-height:620px){
  #documentQuickBar{top:6px!important;transform:none!important;max-height:calc(100vh - 12px)!important}
  #documentQuickBar button{height:27px!important;min-height:27px!important}
  #documentQuickBar input[type="number"]{height:27px!important;min-height:27px!important}
  #documentSearchPanel{top:6px!important;transform:none!important;max-height:calc(100vh - 12px)!important;overflow:auto!important}
}
`;
document.head.appendChild(style);
})();
