'use strict';
/* English Adventure Island: eight primary-friendly activities, one shared self-contained teaching engine. */
(function(){
const $=id=>document.getElementById(id);
const TYPE=document.body.dataset.activity;
const FEATURES={
 'sentence-scramble':{
  title:'Sentence Scramble',emoji:'🧩',subtitle:'Put the words in the right order.',
  prompt:'Tap the words in the correct order to build a complete sentence.',
  type:'scramble',
  samples:[
   {text:'The little rabbit hopped across the garden.'},
   {text:'Every morning, Maya packs her schoolbag carefully.'},
   {text:'My brother and I visited the library yesterday.'},
   {text:'The colourful butterflies danced above the flowers.'},
   {text:'After the rain, a bright rainbow appeared in the sky.'}
  ]},
 'missing-word':{
  title:'Missing Word Mission',emoji:'🎯',subtitle:'Choose the word that completes the sentence.',
  prompt:'Read the sentence and choose the best word for the blank.',
  type:'cloze',
  samples:[
   {sentence:'The ___ kitten slept peacefully on the sofa.',answer:'tiny',distractors:['enormous','noisy','angry']},
   {sentence:'Please walk ___ along the wet corridor.',answer:'carefully',distractors:['careless','loud','quick']},
   {sentence:'We brought an ___ because dark clouds filled the sky.',answer:'umbrella',distractors:['eraser','apple','pillow']},
   {sentence:'Grandmother told us an ___ story before bedtime.',answer:'interesting',distractors:['empty','hungry','icy']},
   {sentence:'The pupils worked ___ to clean up their classroom.',answer:'together',distractors:['tomorrow','outside','never']}
  ]},
 'punctuation-detective':{
  title:'Punctuation Detective',emoji:'🔎',subtitle:'Find the missing punctuation mark.',
  prompt:'Read the sentence and choose the punctuation mark that belongs in the blank.',
  type:'punctuation',
  samples:[
   {sentence:'Where did you put your reading book___',mark:'?'},
   {sentence:'What a wonderful surprise___',mark:'!'},
   {sentence:'We planted some seeds in the garden___',mark:'.'},
   {sentence:'Mum packed sandwiches___ fruit and water.',mark:','},
   {sentence:'Please remember these items___ a pencil, a ruler and an eraser.',mark:':'}
  ]},
 'story-sequencing':{
  title:'Story Sequencing',emoji:'📚',subtitle:'Put story events in a sensible order.',
  prompt:'Arrange the events in the correct sequence to tell the story.',
  type:'sequence',
  samples:[
   {title:'A Lost Water Bottle',lines:['Aisha placed her water bottle beside the school bench.','After recess, she realised that the bottle was missing.','She retraced her steps and looked near the bench.','A helpful prefect found it and returned it to her.']},
   {title:'Growing a Sunflower',lines:['Ben filled a pot with soil.','He planted a sunflower seed and watered it.','A small green shoot appeared a few days later.','The sunflower grew tall and produced a bright yellow flower.']},
   {title:'A Rainy Afternoon',lines:['Dark clouds gathered above the playground.','The teacher asked everyone to return to the classroom.','Heavy rain began to fall as the pupils entered.','The class watched the rain from their windows.']},
   {title:'Baking Muffins',lines:['Grandmother measured the flour and sugar.','We mixed the ingredients in a large bowl.','She poured the mixture into muffin cups.','Soon, delicious muffins came out of the oven.']},
   {title:'A Kind Act',lines:['Daniel noticed that his classmate had dropped her books.','He bent down to help her pick them up.','They carried the books back to the classroom together.','His classmate thanked him for being thoughtful.']}
  ]},
 'word-partners':{
  title:'Word Partners',emoji:'🤝',subtitle:'Match words with suitable partners.',
  prompt:'Choose one word on the left, then tap its matching phrase on the right.',
  type:'pairs',
  samples:[
   {title:'Describing Actions',pairs:[['whisper','softly'],['run','quickly'],['smile','brightly'],['wait','patiently']]},
   {title:'Describing Things',pairs:[['a fragrant','flower'],['a sparkling','diamond'],['a gentle','breeze'],['a brave','firefighter']]},
   {title:'Useful Word Pairs',pairs:[['make','a decision'],['take','a break'],['pay','attention'],['keep','a promise']]},
   {title:'Nature Words',pairs:[['heavy','rain'],['bright','sunshine'],['thick','fog'],['strong','wind']]},
   {title:'Everyday Phrases',pairs:[['brush','your teeth'],['tie','your shoelaces'],['pack','your bag'],['wash','your hands']]}
  ]},
 'sentence-doctor':{
  title:'Sentence Doctor',emoji:'🩺',subtitle:'Help poorly written sentences get better.',
  prompt:'Read the sentence with a mistake. Choose the corrected sentence.',
  type:'doctor',
  samples:[
   {wrong:'She go to school every day.',correct:'She goes to school every day.',distractors:['She going to school every day.','She gone to school every day.']},
   {wrong:'The childrens are playing outside.',correct:'The children are playing outside.',distractors:['The childs are playing outside.','The childrens is playing outside.']},
   {wrong:'I has a new storybook.',correct:'I have a new storybook.',distractors:['I having a new storybook.','I haves a new storybook.']},
   {wrong:'We was excited about the trip.',correct:'We were excited about the trip.',distractors:['We is excited about the trip.','We be excited about the trip.']},
   {wrong:'Yesterday, he eat his lunch early.',correct:'Yesterday, he ate his lunch early.',distractors:['Yesterday, he eats his lunch early.','Yesterday, he eating his lunch early.']}
  ]},
 'sentence-expander':{
  title:'Sentence Expander',emoji:'✨',subtitle:'Make a simple sentence more interesting.',
  prompt:'Add when, where and how to turn a short sentence into a richer one.',
  type:'builder',
  samples:[
   {base:'The children played',time:'After school',place:'in the playground',manner:'happily',wrongTime:['Under the table','Very loudly'],wrongPlace:['yesterday','carefully'],wrongManner:['near the gate','every morning']},
   {base:'The puppy slept',time:'In the afternoon',place:'beside the sofa',manner:'peacefully',wrongTime:['in its basket','very softly'],wrongPlace:['sleepily','last night'],wrongManner:['on Sunday','in the garden']},
   {base:'Mia read her book',time:'After dinner',place:'in her bedroom',manner:'quietly',wrongTime:['on the shelf','with care'],wrongPlace:['yesterday','slowly'],wrongManner:['next to her bed','at noon']},
   {base:'The pupils sang',time:'During assembly',place:'in the hall',manner:'confidently',wrongTime:['near the stage','sweetly'],wrongPlace:['early in the morning','beautifully'],wrongManner:['on the stage','before recess']},
   {base:'Father cooked dinner',time:'In the evening',place:'in the kitchen',manner:'carefully',wrongTime:['over the stove','deliciously'],wrongPlace:['at six o’clock','gently'],wrongManner:['in the kitchen','on Friday']}
  ]},
 'picture-talk':{
  title:'Picture Talk',emoji:'🎤',subtitle:'Look closely, think clearly and speak confidently.',
  prompt:'Study the picture. Describe what is happening in full sentences.',
  type:'picture',
  samples:[
   {title:'Helping at School',scene:'classroom',image:'',questions:['Where are the children?','What happened to the books?','How is one child helping the other?','What would you do in this situation?'],keywords:['classroom','helpful','books','kindness'],model:'The children are in their classroom. A pupil has dropped several books on the floor. Another pupil bends down to help pick them up. This is a thoughtful act because helping others makes the classroom a kinder place.'},
   {title:'Sharing an Umbrella',scene:'rain',image:'',questions:['What is the weather like?','Why are the children standing close together?','How do you think they feel?','What can we learn from this scene?'],keywords:['rain','umbrella','sharing','friendship'],model:'It is raining heavily after school. One child notices that a friend has no umbrella. They decide to share the umbrella so both can stay dry. This shows kindness and consideration for others.'},
   {title:'Caring for Our Park',scene:'park',image:'',questions:['Where are the children?','What are they collecting?','Why is it important to keep the park clean?','How can you help care for shared spaces?'],keywords:['park','litter','clean','environment'],model:'The children are in a park on a sunny day. They are picking up litter using safe equipment. They want to keep the park clean for everyone to enjoy. We should always put rubbish in the proper bins.'},
   {title:'At the Library',scene:'library',image:'',questions:['What place is shown in the picture?','What are the children doing?','Why should people speak softly here?','What do you like to read?'],keywords:['library','books','quiet','reading'],model:'This is a school library. The children are choosing books and reading quietly. They speak softly so everyone can concentrate. I enjoy visiting the library because I can discover new stories and information.'},
   {title:'Helping a Friend',scene:'playground',image:'',questions:['Where are the pupils?','What happened to one of them?','How should the other pupil respond?','Which adult can they ask for help?'],keywords:['playground','friend','care','teacher'],model:'The pupils are at the playground. One child has fallen and may be hurt. A friend checks whether the child is all right and informs a teacher. We should stay calm and seek help from an adult when someone is injured.'}
  ]}
};
const config=FEATURES[TYPE];
if(!config){document.body.textContent='Unknown activity.';return}
const DATA_KEY='english-adventure-v1:'+TYPE;
const deep=x=>JSON.parse(JSON.stringify(x));
const sceneNames={classroom:'School classroom',rain:'Rainy day',park:'Clean park',library:'Library',playground:'Playground',custom:'My uploaded picture'};
const e=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
const makeButton=(text,cls,fn)=>{const b=e('button',cls,text);b.type='button';if(fn)b.onclick=fn;return b};
const shuffle=items=>{const a=[...items];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const normal=s=>String(s||'').trim();
const lines=s=>String(s||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
const joinText=a=>Array.isArray(a)?a.join('\n'):'';
function safeStorageRead(){try{let raw=localStorage.getItem(DATA_KEY);if(raw){const data=JSON.parse(raw);if(data&&data.type===TYPE&&Array.isArray(data.items)&&data.items.length&&data.items.length<=25){return data.items}}}catch(err){}return null}
let items=deep(config.samples),index=0,score=0,completed=0,stageState={},mode='student',editing=false,recognition=null,voiceOn=false;
const saved=safeStorageRead();if(saved){try{validateAll(saved);items=deep(saved)}catch(err){items=deep(config.samples)}}
function setNotice(text,bad){$('notice').textContent=text;$('notice').classList.toggle('error',!!bad)}
function normaliseItem(q){
 const t=config.type;
 const v={};
 const copyField=k=>v[k]=normal(q[k]);
 if(t==='scramble'){copyField('text');}
 if(t==='cloze'){['sentence','answer'].forEach(copyField);v.distractors=asList(q.distractors)}
 if(t==='punctuation'){['sentence','mark'].forEach(copyField)}
 if(t==='sequence'){copyField('title');v.lines=asList(q.lines)}
 if(t==='pairs'){copyField('title');v.pairs=asPairs(q.pairs)}
 if(t==='doctor'){['wrong','correct'].forEach(copyField);v.distractors=asList(q.distractors)}
 if(t==='builder'){['base','time','place','manner'].forEach(copyField);['wrongTime','wrongPlace','wrongManner'].forEach(k=>v[k]=asList(q[k]))}
 if(t==='picture'){
  ['title','scene','model'].forEach(copyField);
  v.questions=asList(q.questions);v.keywords=asList(q.keywords);
  v.image=v.scene==='custom'&&typeof q.image==='string'?q.image:'';
 }
 return v;
}
function asList(v){return Array.isArray(v)?v.map(normal).filter(Boolean):lines(v)}
function asPairs(v){
 if(Array.isArray(v)&&v.every(Array.isArray))return v.map(x=>[normal(x[0]),normal(x[1])]);
 return lines(v).map(line=>line.split('|').map(normal));
}
function isSecurePicture(v){return typeof v==='string'&&v.length<1200000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(v)}
function validateItem(x,i){
 const q=normaliseItem(x),t=config.type,n=i+1;
 const fail=message=>{throw Error('Question '+n+': '+message)};
 if(t==='scramble'){const bits=q.text.split(/\s+/).filter(Boolean);if(bits.length<4||bits.length>35)fail('write a complete sentence of 4–35 words.')}
 if(t==='cloze'){
  if(q.sentence.split('___').length!==2)fail('use exactly one ___ blank in the sentence.');
  if(!q.answer||q.distractors.length<2||q.distractors.length>6)fail('provide the correct word and 2–6 other choices.');
  if(new Set([q.answer,...q.distractors].map(a=>a.toLowerCase())).size!==q.distractors.length+1)fail('all answer choices must be different.');
 }
 if(t==='punctuation'){if(q.sentence.split('___').length!==2)fail('use one ___ blank.');if(!['.','?','!',',',':',';'].includes(q.mark))fail('choose a valid punctuation mark.')}
 if(t==='sequence'){if(q.lines.length<3||q.lines.length>9)fail('enter 3–9 story events, one per line.');if(new Set(q.lines).size!==q.lines.length)fail('story events should be different.')}
 if(t==='pairs'){
  if(q.pairs.length<3||q.pairs.length>9||q.pairs.some(pair=>pair.length!==2||!pair[0]||!pair[1]))fail('enter 3–9 pairs, each written as word | match.');
  if(new Set(q.pairs.map(p=>p[0].toLowerCase())).size!==q.pairs.length||new Set(q.pairs.map(p=>p[1].toLowerCase())).size!==q.pairs.length)fail('both sides must contain different phrases.');
 }
 if(t==='doctor'){if(!q.wrong||!q.correct||q.distractors.length!==2)fail('enter the incorrect sentence, corrected version and exactly 2 wrong alternatives.');if(new Set([q.correct,...q.distractors]).size!==3)fail('the three choices must be different.')}
 if(t==='builder'){
  if(!q.base||!q.time||!q.place||!q.manner)fail('enter a base sentence and its when, where and how details.');
  for(const [name,answer,wrong] of [['when',q.time,q.wrongTime],['where',q.place,q.wrongPlace],['how',q.manner,q.wrongManner]]){
   if(wrong.length!==2||new Set([answer,...wrong].map(x=>x.toLowerCase())).size!==3)fail('provide 2 distinct incorrect choices for '+name+'.');
  }
 }
 if(t==='picture'){
  if(!q.title||!sceneNames[q.scene])fail('select a scene and give it a title.');
  if(q.scene==='custom'&&!isSecurePicture(q.image))fail('upload a JPEG picture before saving.');
  if(q.questions.length<2||q.questions.length>8||!q.model)fail('enter 2–8 guiding questions and a model response.');
 }
 const serial=JSON.stringify(q);
 if(serial.length>1400000)fail('the content is too long.');
 if(t!=='picture'&&serial.length>16000)fail('shorten the question text.');
 return q;
}
function validateAll(input){
 if(!Array.isArray(input)||input.length<1||input.length>25)throw Error('Please provide between 1 and 25 questions.');
 return input.map((v,i)=>validateItem(v,i));
}
function resetStudent(){index=0;score=0;completed=0;stageState={};stopMic();window.speechSynthesis?.cancel();renderStudent()}
function setMode(next){
 mode=next;editing=next==='teacher';$('studentArea').hidden=editing;$('teacherArea').hidden=!editing;
 $('gearButton').setAttribute('aria-pressed',String(editing));
 $('gearButton').setAttribute('aria-label',editing?'Return to pupil activity':'Open teacher settings');
 $('gearButton').title=editing?'Return to pupil activity':'Teacher settings';
 if(editing){stopMic();renderEditors();setNotice('Changes are saved only when you select “Save questions & play”.',false)}
 window.scrollTo?.({top:0,behavior:'smooth'});
}
function speaker(text){
 if(!('speechSynthesis' in window))return;
 window.speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(text);
 utterance.lang='en-GB';utterance.rate=.89;utterance.pitch=1.03;
 const list=window.speechSynthesis.getVoices?.()||[];
 const choice=list.find(v=>v.lang==='en-GB'&&/female|sonia|libby|serena|kate|susan|aria/i.test(v.name))||list.find(v=>v.lang==='en-GB')||list.find(v=>v.lang?.startsWith('en'));
 if(choice)utterance.voice=choice;
 window.speechSynthesis.speak(utterance);
}
function feedback(message,status){
 const el=$('feedback');el.textContent=message;el.className='feedback'+(status?' '+status:'');
}
function studentRoot(){return $('stageContent')}
function renderStudent(){
 $('toolTitle').textContent=config.title;
 $('toolEmoji').textContent=config.emoji;
 $('studentTitle').textContent=config.title;
 $('studentSubtitle').textContent=config.subtitle;
 $('questionProgress').textContent='Challenge '+(index+1)+' of '+items.length;
 $('scoreProgress').textContent=config.type==='picture'?'Your speaking adventure':'⭐ '+score+' correct';
 $('stageContent').replaceChildren();
 $('feedback').className='feedback';$('feedback').textContent='';
 $('stageActions').replaceChildren();
 $('resultsArea').hidden=true;$('questionStage').hidden=false;
 stageState={};
 if(config.type==='scramble')renderScramble();
 if(config.type==='cloze')renderCloze();
 if(config.type==='punctuation')renderPunctuation();
 if(config.type==='sequence')renderSequence();
 if(config.type==='pairs')renderPairs();
 if(config.type==='doctor')renderDoctor();
 if(config.type==='builder')renderBuilder();
 if(config.type==='picture')renderPicture();
}
function heading(text){studentRoot().append(e('p','instruction',text))}
function textPanel(text,cls){studentRoot().append(e('div',cls||'question-text',text))}
function actions(list){$('stageActions').replaceChildren(...list)}
function addNext(){actions([makeButton(index+1<items.length?'Next challenge →':'See my results →','btn primary',nextQuestion)])}
function nextQuestion(){stopMic();completed++;if(index+1<items.length){index++;renderStudent()}else showResults()}
function completeCorrect(){score++;feedback('Brilliant! You got it! ⭐','good');addNext()}
function markWrong(){feedback('Not quite. Have another go! You can do it.','bad')}
function showResults(){
 $('questionStage').hidden=true;$('resultsArea').hidden=false;
 const t=config.type==='picture';
 const root=$('resultsArea');root.replaceChildren();
 const box=e('div','full-result');
 box.append(e('div','trophy',t?'🎤':'🏆'),e('h2',null,t?'Well done, speaker!':'Adventure complete!'));
 box.append(e('p',null,t?'You explored '+completed+' picture'+(completed===1?'':'s')+' and practised expressing your ideas.':'You completed '+completed+' challenge'+(completed===1?'':'s')+'.'));
 if(!t)box.append(e('strong',null,score+' / '+items.length+' correct'));
 box.append(e('p',null,'Every attempt helps you become a stronger English learner.'));
 const buttons=e('div','stage-actions');
 buttons.append(makeButton('🔄 Play again','btn primary',resetStudent),makeButton('🏝️ Back to the Island','btn secondary',()=>{location.href='../'}));
 box.append(buttons);root.append(box);
}
function shuffleDifferent(list){
 const shuffled=shuffle(list);
 if(list.length>1&&shuffled.every((v,i)=>v===list[i]))[shuffled[0],shuffled[1]]=[shuffled[1],shuffled[0]];
 return shuffled;
}
function renderScramble(){
 const target=items[index].text.split(/\s+/);
 const deck=shuffleDifferent(target.map((word,i)=>({word,id:i})));
 const selected=[];
 heading('🧩 '+config.prompt);
 const answer=e('div','drop-zone empty');answer.setAttribute('aria-label','Your sentence');
 studentRoot().append(e('div','group-label','YOUR SENTENCE'),answer,e('div','group-label','TAP THE WORDS'));
 const choices=e('div','pill-row');studentRoot().append(choices);
 const display=()=>{
  answer.classList.toggle('empty',!selected.length);
  answer.replaceChildren(...selected.map(token=>makeButton(token.word,'tile selected',()=>{selected.splice(selected.indexOf(token),1);display()})));
  choices.replaceChildren(...deck.filter(token=>!selected.includes(token)).map(token=>makeButton(token.word,'tile',()=>{selected.push(token);display()})));
 };
 display();
 const submit=makeButton('Check sentence ✓','btn primary',()=>{
  if(selected.length!==target.length){feedback('Tap all the words before checking your sentence.','note');return}
  if(selected.map(x=>x.word).join(' ')===target.join(' ')){completeCorrect();submit.disabled=true;answer.querySelectorAll('button').forEach(b=>b.disabled=true);choices.replaceChildren()}
  else markWrong();
 });
 actions([submit,makeButton('Clear','btn secondary',()=>{selected.splice(0);display();feedback('')}),
  makeButton('🔊 Read answer','btn secondary',()=>speaker(items[index].text))]);
}
function renderChoices(options,correct,after,extra){
 const box=e('div','options');studentRoot().append(box);
 let locked=false;
 const order=shuffleDifferent(options);
 order.forEach(option=>{
  const b=makeButton(option,'option',()=>{
   if(locked)return;
   if(option===correct){
    locked=true;b.classList.add('correct');box.querySelectorAll('button').forEach(c=>c.disabled=true);
    if(after)after();else completeCorrect();
   }else{b.classList.add('incorrect');markWrong()}
  });
  box.append(b);
 });
 if(extra)studentRoot().append(extra);
}
function renderCloze(){
 const q=items[index];
 heading('🎯 '+config.prompt);
 const txt=e('div','question-text');
 const [left,right]=q.sentence.split('___');
 txt.append(document.createTextNode(left),e('span','', '_____'),document.createTextNode(right));
 studentRoot().append(txt);
 renderChoices([q.answer,...q.distractors],q.answer);
 actions([makeButton('🔊 Hear the sentence','btn secondary',()=>speaker(q.sentence.replace('___',q.answer)))]);
}
function renderPunctuation(){
 const q=items[index];
 heading('🔎 '+config.prompt);
 const box=e('div','question-text',q.sentence.replace('___',' □ '));studentRoot().append(box);
 renderChoices(['.','?','!',',',':',';'],q.mark);
 actions([makeButton('🔊 Listen to the complete sentence','btn secondary',()=>speaker(q.sentence.replace('___',q.mark)))]);
}
function renderSequence(){
 const q=items[index],ordered=q.lines;
 let tokens=shuffleDifferent(ordered.map((text,i)=>({text,id:i})));
 heading('📚 '+config.prompt);
 studentRoot().append(e('div','group-label',q.title||'Put the events in order'));
 const container=e('div');studentRoot().append(container);
 const draw=()=>{
  container.replaceChildren();
  tokens.forEach((item,i)=>{
   const row=e('div','story-line');
   row.append(e('span','story-number',String(i+1)),e('div','story-text',item.text));
   row.append(makeButton('↑','btn secondary',()=>{if(i>0){[tokens[i-1],tokens[i]]=[tokens[i],tokens[i-1]];draw()}}),
    makeButton('↓','btn secondary',()=>{if(i<tokens.length-1){[tokens[i+1],tokens[i]]=[tokens[i],tokens[i+1]];draw()}}));
   container.append(row);
  });
 };draw();
 const submit=makeButton('Check the order ✓','btn primary',()=>{
  if(tokens.every((token,i)=>token.id===i)){completeCorrect();submit.disabled=true}
  else markWrong();
 });
 actions([submit,makeButton('🔊 Hear the complete story','btn secondary',()=>speaker(q.lines.join(' ')))]);
}
function renderPairs(){
 const q=items[index],matched=new Set();
 let chosenLeft=-1;
 heading('🤝 '+config.prompt);
 studentRoot().append(e('div','group-label',q.title));
 const grid=e('div','match-grid'),leftCol=e('div','match-col'),rightCol=e('div','match-col');
 const leftCaption=e('div','match-caption','Choose a word'),rightCaption=e('div','match-caption','Choose its partner');
 leftCol.append(leftCaption);rightCol.append(rightCaption);
 const rightOrder=shuffleDifferent(q.pairs.map((_,i)=>i));
 const draw=()=>{
  while(leftCol.children.length>1)leftCol.lastElementChild.remove();
  while(rightCol.children.length>1)rightCol.lastElementChild.remove();
  q.pairs.forEach((pair,i)=>{
   const b=makeButton(pair[0],'match-choice',()=>{chosenLeft=i;draw();feedback('Now choose the matching phrase on the right.','note')});
   b.disabled=matched.has(i);if(matched.has(i))b.classList.add('done');
   if(chosenLeft===i)b.classList.add('active');
   leftCol.append(b);
  });
  rightOrder.forEach(i=>{
   const b=makeButton(q.pairs[i][1],'match-choice',()=>{
    if(chosenLeft<0){feedback('Choose a word on the left first.','note');return}
    if(chosenLeft===i){
     matched.add(i);chosenLeft=-1;
     if(matched.size===q.pairs.length){completeCorrect()}else feedback('Great match! '+matched.size+' of '+q.pairs.length+' pairs found.','good');
     draw();
    }else markWrong();
   });
   b.disabled=matched.has(i);if(matched.has(i))b.classList.add('done');
   rightCol.append(b);
  });
 };
 grid.append(leftCol,rightCol);studentRoot().append(grid);draw();
}
function renderDoctor(){
 const q=items[index];heading('🩺 '+config.prompt);
 studentRoot().append(e('div','group-label','The sentence needs a little help:'));
 const wrong=e('div','question-text sentence-strike',q.wrong);studentRoot().append(wrong);
 studentRoot().append(e('div','group-label','Choose the corrected sentence'));
 renderChoices([q.correct,...q.distractors],q.correct);
 actions([makeButton('🔊 Hear the correct sentence','btn secondary',()=>speaker(q.correct))]);
}
function buildExpanded(q){
 const final=q.base.replace(/[.!?]\s*$/,'');
 return q.time+', '+final.charAt(0).toLowerCase()+final.slice(1)+' '+q.place+' '+q.manner+'.';
}
function renderBuilder(){
 const q=items[index],phases=[
 {title:'WHEN did it happen?',answer:q.time,options:[q.time,...q.wrongTime]},
 {title:'WHERE did it happen?',answer:q.place,options:[q.place,...q.wrongPlace]},
 {title:'HOW did it happen?',answer:q.manner,options:[q.manner,...q.wrongManner]}
 ];
 let phase=0,missed=false;
 heading('✨ '+config.prompt);
 textPanel(q.base.replace(/[.!?]\s*$/,'')+'.');
 const holder=e('div','builder-block'),summary=e('div','builder-output','Let’s make the sentence more interesting!');
 studentRoot().append(summary,holder);
 const showPhase=()=>{
  if(phase>=3){
   summary.textContent=buildExpanded(q);
   holder.replaceChildren(e('h3',null,'You made the sentence richer! 🌈'));
   if(!missed)score++;
   feedback('Well done! You added time, place and manner details.','good');addNext();return;
  }
  const part=phases[phase];
  holder.replaceChildren(e('h3',null,(phase+1)+' of 3 — '+part.title));
  const buttons=e('div','options');holder.append(buttons);
  shuffleDifferent(part.options).forEach(option=>{
   buttons.append(makeButton(option,'option',()=>{
    if(option===part.answer){phase++;feedback('Excellent choice!','good');showPhase()}
    else{missed=true;markWrong()}
   }))
  });
 };
 showPhase();
}
const SVG_BASE='<svg viewBox="0 0 660 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Colourful school illustration">';
function person(x,y,shirt,pants,pose){
 const legs='<path d="M'+(x-17)+' '+(y+60)+' l-8 56 M'+(x+17)+' '+(y+60)+' l8 56" fill="none" stroke="'+pants+'" stroke-width="17" stroke-linecap="round"/>';
 const arms=pose==='help'?'<path d="M'+(x-27)+' '+(y+8)+' l-28 39 M'+(x+27)+' '+(y+8)+' l30 43"':'<path d="M'+(x-27)+' '+(y+8)+' l-22 30 M'+(x+27)+' '+(y+8)+' l24 28"';
 return legs+'<rect x="'+(x-28)+'" y="'+(y-12)+'" width="56" height="76" rx="19" fill="'+shirt+'"/>'+arms.replace('fill="none"','fill="none" stroke="#e7af84" stroke-width="13" stroke-linecap="round"')+'<circle cx="'+x+'" cy="'+(y-42)+'" r="28" fill="#edbd94"/><path d="M'+(x-27)+' '+(y-47)+' Q'+(x-30)+' '+(y-81)+' '+x+' '+(y-73)+' Q'+(x+29)+' '+(y-77)+' '+(x+27)+' '+(y-47)+'" fill="#4c566a"/><circle cx="'+(x-10)+'" cy="'+(y-43)+'" r="3" fill="#374657"/><circle cx="'+(x+9)+'" cy="'+(y-43)+'" r="3" fill="#374657"/><path d="M'+(x-6)+' '+(y-33)+' q7 7 14 0" stroke="#ab6656" stroke-width="2" fill="none"/>';
}
function sceneSVG(which){
 let sky='#c9eff5',ground='#b1e4b8',props='',people='';
 if(which==='classroom'){
  sky='#e7f4fd';ground='#e4d9bb';
  props='<rect x="78" y="57" width="235" height="112" rx="9" fill="#3f9989" stroke="#b77c50" stroke-width="13"/><text x="196" y="121" font-size="34" font-weight="bold" text-anchor="middle" fill="#ffffff">Be kind!</text><rect x="470" y="67" width="115" height="123" fill="#d7ae7f"/><path d="M488 98 H565 M488 129 H565 M488 160 H565" stroke="#b0855e" stroke-width="7"/><rect x="180" y="280" width="320" height="22" rx="11" fill="#b8896c"/><rect x="185" y="300" width="15" height="48" fill="#90705c"/><rect x="485" y="300" width="15" height="48" fill="#90705c"/><rect x="315" y="276" width="70" height="15" rx="4" fill="#f1ce5d"/><rect x="342" y="268" width="64" height="10" rx="3" fill="#6c9ad1"/>';
  people=person(225,189,'#ef8e79','#607bad','help')+person(430,189,'#f6c35b','#746ea2','help');
 }else if(which==='rain'){
  sky='#b5d4f0';ground='#9db5a5';
  props='<path d="M85 0 V212 M189 0 V176 M289 0 V165 M393 0 V185 M493 0 V150 M587 0 V176" stroke="#ffffff" stroke-width="5" stroke-dasharray="12 21" opacity=".7"/><path d="M200 149 Q330 -16 455 149Z" fill="#ed8688" stroke="#a94863" stroke-width="8"/><path d="M332 149 V289" stroke="#3b6d80" stroke-width="8"/><ellipse cx="315" cy="328" rx="260" ry="17" fill="#7fa6b5" opacity=".5"/>';
  people=person(282,210,'#66b5d2','#515f93')+person(386,210,'#f6ca69','#7b729c');
 }else if(which==='park'){
  sky='#d4f3f3';ground='#90cfa9';
  props='<path d="M65 310 V130 M590 310 V125" stroke="#97714a" stroke-width="21"/><circle cx="65" cy="127" r="81" fill="#68b988"/><circle cx="590" cy="120" r="87" fill="#69bd93"/><rect x="478" y="255" width="62" height="84" rx="11" fill="#419a89"/><rect x="466" y="242" width="86" height="21" rx="9" fill="#277e75"/><rect x="132" y="318" width="28" height="13" fill="#df8171"/><rect x="163" y="313" width="25" height="12" fill="#f6cc72"/>';
  people=person(274,203,'#ef9b75','#6e79ad','help')+person(396,204,'#70b5c9','#6e79ad');
 }else if(which==='library'){
  sky='#f5e9cb';ground='#cfdecb';
  props='<rect x="55" y="52" width="220" height="242" rx="10" fill="#b78d67"/><rect x="387" y="52" width="220" height="242" rx="10" fill="#b78d67"/>';
  for(const x of [72,116,160,203,401,445,489,533,576])for(const y of [89,161,232])props+='<rect x="'+x+'" y="'+y+'" width="30" height="60" rx="3" fill="'+(['#df9077','#77b5ac','#e9c36c','#8b9cce'][(x+y)%4])+'"/>';
  props+='<rect x="290" y="291" width="88" height="11" rx="6" fill="#c7a273"/>';
  people=person(322,205,'#f6cb64','#6793ad');
 }else{
  sky='#d2eff6';ground='#a7d6a9';
  props='<path d="M65 278 Q166 231 260 275 T625 268" stroke="#efd3a1" stroke-width="41" fill="none"/><rect x="83" y="118" width="145" height="13" rx="7" fill="#f7b379"/><path d="M92 132 V253 M219 132 V253" stroke="#8ca4d1" stroke-width="13"/><circle cx="543" cy="145" r="34" fill="#e8c95f"/><path d="M542 184 V281" stroke="#aa774d" stroke-width="9"/>';
  people=person(333,196,'#e98d8d','#646fac','help')+person(445,203,'#6fb4c8','#5c86a5','help');
 }
 return SVG_BASE+'<rect width="660" height="360" fill="'+sky+'"/><rect y="275" width="660" height="85" fill="'+ground+'"/><circle cx="570" cy="62" r="28" fill="#ffe4a3" opacity=".8"/>'+props+people+'</svg>';
}
function pictureArt(q){
 const holder=e('div','picture-scene');
 if(q.scene==='custom'&&isSecurePicture(q.image)){
  const img=e('img');img.src=q.image;img.alt='Teacher-uploaded picture: '+q.title;holder.append(img);
 }else holder.innerHTML=sceneSVG(q.scene);
 return holder;
}
function renderPicture(){
 const q=items[index];heading('🎤 '+config.prompt);
 studentRoot().append(e('div','group-label',q.title),pictureArt(q));
 const prompts=e('ol','question-list');q.questions.forEach(x=>prompts.append(e('li',null,x)));
 studentRoot().append(prompts);
 const keywords=e('div','keyword-row');q.keywords.forEach(word=>keywords.append(e('span','keyword',word)));
 const kwToggle=makeButton('💡 Show helpful words','btn secondary',()=>{keywords.hidden=!keywords.hidden;kwToggle.textContent=keywords.hidden?'💡 Show helpful words':'Hide helpful words'});
 keywords.hidden=true;studentRoot().append(kwToggle,keywords);
 studentRoot().append(e('div','group-label','Share your ideas'));
 const response=e('textarea','oral-area');
 response.setAttribute('aria-label','Type your oral response or the words recognised from your speech');
 response.placeholder='You can type here, use the microphone if supported, or speak aloud without recording.';
 studentRoot().append(response);
 const oralStatus=e('p','feedback note','If speech recognition is unavailable, you can still speak aloud and reflect.');
 studentRoot().append(oralStatus);
 const checks=e('div','oral-checks');
 for(const [key,label] of [['looked','I described what I saw'],['details','I used complete sentences'],['kind','I explained my ideas clearly']]){
  const check=e('input');check.type='checkbox';check.id='oral-'+key;const lab=e('label');lab.htmlFor=check.id;lab.append(check,document.createTextNode(label));checks.append(lab);
 }studentRoot().append(checks);
 const modelBox=e('div','builder-block');modelBox.hidden=true;modelBox.append(e('h3',null,'A possible model response'),e('p','story-text',q.model));
 studentRoot().append(modelBox);
 const micBtn=makeButton('🎙️ Start speaking','btn secondary',()=>{
  const API=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!API){oralStatus.textContent='Speech recognition is not available here. Speak aloud or type your ideas instead.';return}
  if(recognition){stopMic();micBtn.textContent='🎙️ Start speaking';oralStatus.textContent='Recording stopped.';return}
  try{
   const rec=new API();rec.lang='en-SG';rec.continuous=true;rec.interimResults=true;
   let base=normal(response.value);if(base)base+=' ';
   rec.onresult=evt=>{
    let final='',interim='';
    for(let i=0;i<evt.results.length;i++){
     const value=evt.results[i][0]?.transcript||'';
     if(evt.results[i].isFinal)final+=value+' ';else interim+=value;
    }
    response.value=(base+final+interim).trim();
   };
   rec.onerror=()=>{oralStatus.textContent='Microphone recognition unavailable. You can still speak aloud.';recognition=null;micBtn.textContent='🎙️ Start speaking'};
   rec.onend=()=>{recognition=null;micBtn.textContent='🎙️ Start speaking'};
   recognition=rec;rec.start();
   micBtn.textContent='⏹ Stop speaking';oralStatus.textContent='Listening in English. Please speak clearly.';
  }catch(err){recognition=null;oralStatus.textContent='Unable to start the microphone. Please speak aloud or type.'}
 });
 const finish=makeButton('I have spoken — reflect ✓','btn primary',()=>{
  stopMic();micBtn.textContent='🎙️ Start speaking';
  modelBox.hidden=false;
  feedback('Well done for sharing your ideas! Compare your response with the model and think about how to improve.','good');
  actions([makeButton('🔊 Hear the model','btn secondary',()=>speaker(q.model)),makeButton(index+1<items.length?'Next picture →':'Finish speaking adventure →','btn primary',nextQuestion)]);
 });
 actions([micBtn,finish]);
}
function stopMic(){
 if(recognition){const rec=recognition;recognition=null;try{rec.stop()}catch(err){}}
}
function fieldsFor(){
 const common=[
  {key:'text',label:'Correct sentence',wide:true,hint:'Write a complete sentence with at least four words.'}
 ];
 if(config.type==='scramble')return common;
 if(config.type==='cloze')return[
  {key:'sentence',label:'Sentence with one ___ blank',wide:true,hint:'Example: The ___ child carried the bag.'},
  {key:'answer',label:'Correct missing word'},
  {key:'distractors',label:'Incorrect choices (one per line)',multi:true,wide:true}
 ];
 if(config.type==='punctuation')return[{key:'sentence',label:'Sentence with one ___ blank',wide:true,hint:'Example: Where is my pencil___'},
  {key:'mark',label:'Correct punctuation mark',select:['.','?','!',',',':',';']}];
 if(config.type==='sequence')return[{key:'title',label:'Story title',wide:true},
  {key:'lines',label:'Story events in the RIGHT order (one per line)',multi:true,wide:true,hint:'Write 3 to 9 sentences. Students will rearrange them.'}];
 if(config.type==='pairs')return[{key:'title',label:'Topic / title',wide:true},
  {key:'pairs',label:'Correct pairs (one per line)',multi:true,wide:true,hint:'Write: word | matching phrase. Example: heavy | rain'}];
 if(config.type==='doctor')return[{key:'wrong',label:'Sentence with a mistake',wide:true},{key:'correct',label:'Corrected sentence',wide:true},
  {key:'distractors',label:'Two incorrect alternatives (one per line)',multi:true,wide:true}];
 if(config.type==='builder')return[
  {key:'base',label:'Short base sentence',wide:true},
  {key:'time',label:'Correct WHEN phrase'},{key:'wrongTime',label:'Two incorrect WHEN choices',multi:true},
  {key:'place',label:'Correct WHERE phrase'},{key:'wrongPlace',label:'Two incorrect WHERE choices',multi:true},
  {key:'manner',label:'Correct HOW phrase'},{key:'wrongManner',label:'Two incorrect HOW choices',multi:true}
 ];
 return [{key:'title',label:'Scene title',wide:true},{key:'scene',label:'Picture',select:Object.keys(sceneNames)},
  {key:'questions',label:'Guiding questions (one per line)',multi:true,wide:true},
  {key:'keywords',label:'Optional hint words (one per line)',multi:true,wide:true},
  {key:'model',label:'Teacher model response',multi:true,wide:true}];
}
const fieldSchema=fieldsFor();
let editorRowCounter=0;
function editorRow(data,number){
 const card=e('article','editor-card');card.dataset.row=String(++editorRowCounter);
 const top=e('div','editor-top'),title=e('strong',null,'Challenge '+number),moves=e('div','editor-move');
 const deleteBtn=makeButton('Remove','mini-btn danger',()=>{if($('editorList').children.length===1){setNotice('Keep at least one question.',true);return}card.remove();renumberEditors()});
 const up=makeButton('↑ Up','mini-btn',()=>{if(card.previousElementSibling){card.parentElement.insertBefore(card,card.previousElementSibling);renumberEditors()}});
 const down=makeButton('↓ Down','mini-btn',()=>{if(card.nextElementSibling){card.parentElement.insertBefore(card.nextElementSibling,card);renumberEditors()}});
 moves.append(up,down,deleteBtn);top.append(title,moves);card.append(top);
 const fields=e('div','form-grid');
 for(const descriptor of fieldSchema){
  const field=e('div','field'+(descriptor.wide?' wide':'')),label=e('label',null,descriptor.label);
  const id='entry-'+card.dataset.row+'-'+descriptor.key;label.htmlFor=id;
  let input;
  if(descriptor.select){
   input=e('select');
   for(const choice of descriptor.select){const opt=e('option');opt.value=choice;opt.textContent=descriptor.key==='scene'?sceneNames[choice]:choice;input.append(opt)}
  }else if(descriptor.multi){input=e('textarea');input.rows=descriptor.key==='lines'?5:3}
  else{input=e('input');input.type='text'}
  input.id=id;input.dataset.field=descriptor.key;
  input.value=Array.isArray(data[descriptor.key])?(descriptor.key==='pairs'?data[descriptor.key].map(p=>p.join(' | ')).join('\n'):data[descriptor.key].join('\n')):String(data[descriptor.key]||'');
  field.append(label,input);
  if(descriptor.hint)field.append(e('small',null,descriptor.hint));
  fields.append(field);
 }
 if(config.type==='picture'){
  const uploadField=e('div','field wide'),label=e('label',null,'Upload your own picture (JPG, PNG or WebP, up to 8 MB)');
  const file=e('input');file.type='file';file.accept='image/jpeg,image/png,image/webp';file.dataset.upload='true';
  const status=e('small',null,'Choose “My uploaded picture” above and upload an image to use it.');
  const image=e('img');image.alt='Preview of uploaded picture';image.style.cssText='display:none;max-height:150px;max-width:100%;object-fit:contain;border-radius:11px';
  card.dataset.image=typeof data.image==='string'?data.image:'';
  if(card.dataset.image){image.src=card.dataset.image;image.style.display='block'}
  file.onchange=async()=>{
   const selected=file.files?.[0];
   if(!selected)return;
   try{
    if(selected.size>8*1024*1024)throw Error('Image is larger than 8 MB.');
    const packed=await resizePicture(selected);
    card.dataset.image=packed;
    image.src=packed;image.style.display='block';status.textContent='✓ Your picture is ready.';
    fields.querySelector('[data-field="scene"]').value='custom';
   }catch(err){status.textContent='Unable to use this picture: '+(err?.message||'invalid file')}
   file.value='';
  };
  uploadField.append(label,file,status,image);fields.append(uploadField);
 }
 card.append(fields);
 return card;
}
function resizePicture(file){
 return new Promise((resolve,reject)=>{
  if(!/^image\/(jpeg|png|webp)$/.test(file.type))return reject(Error('Please choose JPG, PNG or WebP.'));
  const obj=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{
   try{
    const scale=Math.min(1,1000/Math.max(img.width,img.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
    const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const uri=canvas.toDataURL('image/jpeg',.73);
    if(!isSecurePicture(uri))throw Error('Unable to compress this image sufficiently.');
    resolve(uri);
   }catch(err){reject(err)}finally{URL.revokeObjectURL(obj)}
  };
  img.onerror=()=>{URL.revokeObjectURL(obj);reject(Error('Could not read the image.'))};
  img.src=obj;
 });
}
function renumberEditors(){[...$('editorList').children].forEach((card,i)=>{const title=card.querySelector('.editor-top strong');if(title)title.textContent='Challenge '+(i+1)})}
function renderEditors(){
 const root=$('editorList');root.replaceChildren();
 items.forEach((item,i)=>root.append(editorRow(item,i+1)));
}
function readEditors(){
 const rows=[...$('editorList').children];
 return rows.map(card=>{
  const item={};
  for(const field of card.querySelectorAll('[data-field]'))item[field.dataset.field]=field.value;
  if(config.type==='picture')item.image=card.dataset.image||'';
  return normaliseItem(item);
 });
}
function saveAndPlay(){
 try{
  const next=validateAll(readEditors());
  const json=JSON.stringify({app:'EnglishAdventureIsland',version:1,type:TYPE,items:next});
  if(json.length>18*1024*1024)throw Error('This lesson is too large. Use fewer pictures.');
  let persisted=false;
  try{localStorage.setItem(DATA_KEY,json);persisted=true}catch(err){}
  items=next;setMode('student');resetStudent();
  if(!persisted)feedback('The lesson is ready, but this browser could not save it. Please export a JSON backup.','note');
 }catch(err){setNotice(err.message||'Please check your questions.',true)}
}
function exportJSON(){
 try{
  const next=validateAll(readEditors()),payload={app:'EnglishAdventureIsland',version:1,type:TYPE,items:next};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='English-'+TYPE+'-lesson.json';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);setNotice('✓ Lesson exported with its questions and answers.',false);
 }catch(err){setNotice(err.message||'Cannot export lesson.',true)}
}
async function importJSON(file){
 if(!file)return;
 if(file.size>18*1024*1024){setNotice('The file is too large (maximum 18 MB).',true);return}
 try{
  const obj=JSON.parse(await file.text());
  if(!obj||obj.app!=='EnglishAdventureIsland'||obj.version!==1||obj.type!==TYPE)throw Error('This JSON file belongs to another activity or has an invalid format.');
  const incoming=validateAll(obj.items);
  const root=$('editorList');root.replaceChildren();
  incoming.forEach((q,i)=>root.append(editorRow(q,i+1)));
  setNotice('✓ '+incoming.length+' questions imported. Select “Save questions & play” to apply them.',false);
 }catch(err){setNotice(err.message||'Import failed.',true)}
}
$('toolTitle').textContent=config.title;$('toolEmoji').textContent=config.emoji;
$('gearButton').onclick=()=>setMode(editing?'student':'teacher');
$('savePlay').onclick=saveAndPlay;
$('cancelTeacher').onclick=()=>setMode('student');
$('addQuestion').onclick=()=>{
 if($('editorList').children.length>=25){setNotice('Maximum 25 questions per lesson.',true);return}
 $('editorList').append(editorRow(deep(config.samples[0]),$('editorList').children.length+1));
 setNotice('A new question has been added. Edit its details before saving.');
};
$('restoreExamples').onclick=()=>{
 if(!window.confirm('Replace all questions shown here with the five built-in examples?'))return;
 const root=$('editorList');root.replaceChildren();
 config.samples.forEach((q,i)=>root.append(editorRow(deep(q),i+1)));
 setNotice('Five examples loaded into the editor. Save to apply them.');
};
$('exportLesson').onclick=exportJSON;
$('importLesson').onclick=()=>$('jsonFile').click();
$('jsonFile').onchange=async evt=>{await importJSON(evt.target.files?.[0]);evt.target.value=''};
resetStudent();
})();