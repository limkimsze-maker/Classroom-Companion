(function(){
'use strict';
const S=window.Support,T=window.ClassroomTimetableData;
if(!S||!T||S.slug!=='daily-visual-timetable'||window.__ttSubjectAliases)return;
window.__ttSubjectAliases=true;

function norm(v){return String(v??'').trim().toUpperCase().replace(/\s+/g,' ')}
const oldIcon=T.icon;
T.icon=function(subject){
  const s=norm(subject);
  if(!s)return'✏️';
  if(/^(RECESS|BREAK)$/.test(s))return'🍎';
  if(/^(MATH|MATHS|MATHEMATICS)$/.test(s))return'🔢';
  if(/^(SC|SCI|SCIENCE)$/.test(s))return'🔬';
  if(/^(SS|SOCIAL STUDIES)$/.test(s))return'🌏';
  if(/^(MUSIC)$/.test(s))return'🎵';
  if(/^(ART)$/.test(s))return'🎨';
  if(/^(PE|PHYSICAL EDUCATION)$/.test(s))return'⚽';
  if(/^(MTL|MOTHER TONGUE|CHINESE|CL|HCL|MALAY|ML|TAMIL|TL)$/.test(s))return'🗣️';
  if(/^(EL|ENGLISH|ENGLISH LANGUAGE|LSP)$/.test(s))return'📚';
  if(/^(FTGP|FORM TEACHER GUIDANCE PERIOD|CCE)$/.test(s))return'🌟';
  if(/^(ASSEMBLY|ASSEMB)$/.test(s))return'🏫';
  if(/^(POP)$/.test(s))return'🧩';
  if(/^(PAL|PROGRAMME FOR ACTIVE LEARNING)$/.test(s))return'🎯';
  if(/^(ICT|COMPUTING|COMPUTER|ROBOTICS)$/.test(s))return'💻';
  return oldIcon?oldIcon(subject):'✏️';
};
window.ClassroomTimetableSubjectAliases={
  recognised:['FTGP','MATH','ASSEMBLY','MUSIC','EL','PE','MTL','SC','RECESS','CCE','SS','ART','POP','PAL','ICT']
};
})();