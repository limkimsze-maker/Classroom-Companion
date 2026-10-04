(function(){
'use strict';
const S=window.Support;
if(!S||S.slug!=='transition-countdown'||window.__transitionAnimationForceV1)return;
window.__transitionAnimationForceV1=true;

function install(){
  const band=document.getElementById('marchBand');
  const wrap=document.getElementById('marchWrap');
  if(!band||!wrap)return false;

  if(!document.getElementById('transitionAnimationForceStyle')){
    const style=document.createElement('style');
    style.id='transitionAnimationForceStyle';
    style.textContent=`
      #marchBand.marching,
      #marchBand.marching .bandMember,
      #marchBand.marching .bandMember:after,
      #marchBand.marching .leg,
      #marchBand.marching .arm,
      #marchBand.marching .instrument,
      #marchWrap.playing .marchGround,
      #marchWrap.playing .musicNote{animation:none!important}
    `;
    document.head.appendChild(style);
  }

  const members=[...band.querySelectorAll('.bandMember')];
  const ground=wrap.querySelector('.marchGround');
  const notes=[...wrap.querySelectorAll('.musicNote')];
  let raf=0;

  function reset(){
    cancelAnimationFrame(raf);raf=0;
    band.style.transform='translateX(-12%)';
    members.forEach(m=>{
      m.style.transform='';
      const legs=[...m.querySelectorAll('.leg')];
      const arms=[...m.querySelectorAll('.arm')];
      const inst=m.querySelector('.instrument');
      legs.forEach(x=>x.style.transform='');
      arms.forEach(x=>x.style.transform='');
      if(inst)inst.style.transform='translateX(-4px)';
    });
    if(ground)ground.style.backgroundPosition='0 0';
    notes.forEach(n=>{n.style.opacity='0';n.style.transform='';});
  }

  function frame(ts){
    if(!band.classList.contains('marching')){reset();return;}
    const fast=band.classList.contains('fast');
    const speed=fast?0.0135:0.0088;
    const p=ts*speed;

    const travel=Math.sin(p*.34)*72;
    band.style.transform=`translateX(${travel}px)`;

    members.forEach((m,i)=>{
      const q=p+i*.95;
      const bob=Math.abs(Math.sin(q))*11;
      const tilt=Math.sin(q)*3.2;
      m.style.transform=`translateY(${-bob}px) rotate(${tilt}deg)`;

      const legs=[...m.querySelectorAll('.leg')];
      if(legs[0])legs[0].style.transform=`rotate(${Math.sin(q)*34}deg)`;
      if(legs[1])legs[1].style.transform=`rotate(${-Math.sin(q)*34}deg)`;

      const arms=[...m.querySelectorAll('.arm')];
      if(arms[0])arms[0].style.transform=`rotate(${Math.sin(q+Math.PI)*31}deg)`;
      if(arms[1])arms[1].style.transform=`rotate(${Math.sin(q)*31}deg)`;

      const inst=m.querySelector('.instrument');
      if(inst){
        if(i===0)inst.style.transform=`translate(${-4+Math.sin(q)*3}px,${-Math.abs(Math.sin(q))*5}px) rotate(${Math.sin(q)*10}deg)`;
        else if(i===1)inst.style.transform=`translate(${-4+Math.sin(q)*5}px,${-2-Math.abs(Math.sin(q))*3}px) rotate(${Math.sin(q)*6}deg)`;
        else if(i===2)inst.style.transform=`translate(${-4+Math.sin(q)*4}px,${-1-Math.abs(Math.sin(q))*3}px) rotate(${Math.sin(q)*11}deg)`;
        else inst.style.transform=`translate(${-4+Math.sin(q)*5}px,${-4-Math.abs(Math.sin(q))*4}px) rotate(${Math.sin(q)*18}deg)`;
      }
    });

    if(ground)ground.style.backgroundPosition=`${(ts*(fast?.32:.20))%104}px 0`;

    notes.forEach((n,i)=>{
      const cycle=((ts/1700)+(i*.24))%1;
      const y=cycle*86;
      const x=Math.sin(cycle*Math.PI*2+i)*8;
      const opacity=cycle<.12?cycle/.12:cycle>.82?(1-cycle)/.18:1;
      n.style.opacity=String(Math.max(0,Math.min(1,opacity)));
      n.style.transform=`translate(${x}px,${-y}px) scale(${.78+cycle*.30}) rotate(${Math.sin(cycle*6.28+i)*10}deg)`;
    });

    raf=requestAnimationFrame(frame);
  }

  function sync(){
    if(band.classList.contains('marching')){
      if(!raf)raf=requestAnimationFrame(frame);
    }else reset();
  }

  new MutationObserver(sync).observe(band,{attributes:true,attributeFilter:['class']});
  sync();
  return true;
}

let tries=0;
const id=setInterval(()=>{tries++;if(install()||tries>100)clearInterval(id)},50);
})();
