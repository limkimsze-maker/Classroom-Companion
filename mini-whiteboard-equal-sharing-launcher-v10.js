/* Whiteboard Smart v10 · original Equal Sharing question launcher.
 * Teacher can use a captured Whiteboard Smart drawing as a locked pupil background.
 * The pupil receives a private 1–30 counter bank. Worker v10 verifies the quota.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
if(new URLSearchParams(location.search).get('mode')==='projector')return;
const crop=$('cropResult'),launch=$('launchQuestion');
if(!crop||!launch)return;
const section=document.createElement('section');section.id='ccSharingLaunch';
section.innerHTML=[
'<div class="cc-share-head"><strong>Equal Sharing · Teacher prepares, pupils manipulate</strong><span>New in V10</span></div>',
'<label class="cc-share-check"><input type="checkbox" id="ccEqualSharingEnable"> Use captured circles as a fixed background on every pupil whiteboard</label>',
'<div class="cc-share-row"><label for="ccEqualSharingCount">Counters for each pupil</label><input type="number" id="ccEqualSharingCount" min="1" max="30" step="1" value="24"><button type="button" id="ccSharingSample">Try example: 4 circles + 24 counters</button></div>',
'<p>Draw four circles on Smart Math → <b>Capture what I wrote</b> → enable Equal Sharing → launch. Each pupil gets the same locked diagram but their own counter supply. The teacher can monitor all individual placements.</p>'
].join('');
const css=document.createElement('style');css.textContent=[
'#ccSharingLaunch{padding:12px;margin:10px 0;background:#f0f9f6;border:1px solid #abd6c7;border-radius:12px}',
'#ccSharingLaunch .cc-share-head{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px;color:#145e50;font:850 13px system-ui}',
'#ccSharingLaunch .cc-share-head span{font:750 11px system-ui;color:#538076}',
'#ccSharingLaunch .cc-share-check{display:flex;align-items:flex-start;gap:9px;font:750 13px system-ui;color:#254e49}',
'#ccSharingLaunch .cc-share-check input{min-width:20px;min-height:20px;margin:0}',
'#ccSharingLaunch .cc-share-row{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:9px 0}',
'#ccSharingLaunch .cc-share-row label{font:750 12px system-ui}',
'#ccSharingLaunch .cc-share-row input{width:70px;padding:8px;border:1px solid #9dcabc;border-radius:8px}',
'#ccSharingLaunch .cc-share-row button{padding:9px 12px;border-radius:9px;border:1px solid #7bbab1;background:#e3f4ed;color:#086b5f;font:800 12px system-ui}',
'#ccSharingLaunch p{font:12px/1.5 system-ui;color:#57736d;margin:0}'
].join('\n');document.head.appendChild(css);
crop.insertAdjacentElement('afterend',section);
const enabled=$('ccEqualSharingEnable'),count=$('ccEqualSharingCount');
const beforeMake=makeQuestion;
makeQuestion=function(){
 const q=beforeMake();
 if(enabled.checked){
  const n=Number(count.value);
  if(!Number.isInteger(n)||n<1||n>30)throw Error('Choose 1–30 counters per pupil.');
  if(!q.image||!/^data:image\//.test(q.image))throw Error('Capture a question drawing or load the four-circle sample first.');
  if(q.visibility==='projector')throw Error('Equal Sharing requires the drawing to be visible to pupils, not Projector only.');
  q.workspace={kind:'equalSharing',counterCount:n};
 }
 return q;
};
enabled.addEventListener('change',()=>{
 if(enabled.checked&&$('displayMode').value==='projector')$('displayMode').value='both';
});
$('ccSharingSample').onclick=()=>{
 const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=600;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,1000,600);
 ctx.font='bold 30px system-ui,Arial,sans-serif';ctx.fillStyle='#21475b';ctx.fillText('Share 24 counters equally into 4 groups',80,82);
 const positions=[[280,210],[690,210],[280,435],[690,435]];
 positions.forEach(([x,y],i)=>{
  ctx.beginPath();ctx.arc(x,y,99,0,Math.PI*2);
  ctx.fillStyle='#f7fffd';ctx.fill();ctx.strokeStyle='#1b7e72';ctx.lineWidth=5;ctx.stroke();
  ctx.fillStyle='#35675d';ctx.font='22px system-ui,Arial,sans-serif';
  ctx.textAlign='center';ctx.fillText('Group '+(i+1),x,y-119);
 });
 ctx.textAlign='left';
 state.cropData=canvas.toDataURL('image/png');
 state.sourceCanvas=null;state.selection=null;
 $('cropCanvas').classList.add('hidden');
 const preview=$('cropResult');preview.replaceChildren();
 const img=new Image();img.src=state.cropData;img.alt='Four empty circles for an Equal Sharing example';preview.append(img);
 enabled.checked=true;count.value='24';
 $('prompt').value='Share 24 counters equally into 4 groups. How many counters are in each group?';
 $('answerType').value='blank';updateAnswerUI();$('answerKey').value='6';$('displayMode').value='both';
 toast('Example ready: four fixed circles and 24 counters for each pupil. Choose Demo or create a live classroom, then launch.');
};
})();
