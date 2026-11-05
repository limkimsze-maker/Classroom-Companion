/* Music Score Studio TEST VERSION score-first UI regression checks.
 * node --test music-score-studio/tests/score-first-ui.test.cjs
 * DOM is simulated: desktop/mobile appearance and sound still require live testing.
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const source=html.match(/<script>\s*(\/\* Temporary TEST VERSION presentation wiring:[\s\S]*?)<\/script>/);
assert.ok(source,'Found appended score-first test wiring');

function makeNode(id=''){
 return {
  id,children:[],parentElement:null,events:{},attrs:{},hidden:id==='testOpenPanel',disabled:false,open:false,
  append(...items){
   for(const item of items){
    if(item.parentElement)item.parentElement.children=item.parentElement.children.filter(x=>x!==item);
    item.parentElement=this;this.children.push(item);
   }
  },
  setAttribute(k,v){this.attrs[k]=String(v)},
  getAttribute(k){return this.attrs[k]},
  addEventListener(type,fn){this.events[type]=fn},
  click(){this.events.click?.({target:this});this.onclick?.()},
  focus(){this.focused=true},
  remove(){
   if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this);
  },
  querySelector(){return null},
  querySelectorAll(){return []}
 };
}
function preview(){
 const ids={};
 for(const name of ['testDockPlay','play','stop','testToolFiles','testToolImport','testToolSetup',
  'testToolTeacher','testToolHelp','toolRow','clearScoreTop','beautifyFeedback','teacherDrawer',
  'autoExpressionReview','pianoCounts','scanAnother','closePiano','helpAndProjects',
  'pianoNowPlaying','moreActions','testDockCompose','testDockOpen','testScoreTools',
  'omrChooseButton','engravedScore','testEngravedNav','testEngravedPrev','testEngravedNext',
  'testEngravedPageLabel','testEngravedResume','testOpenPanel'])ids[name]=makeNode(name);
 const filePanel=makeNode(''),scanner=makeNode('omrHero'),setup=makeNode('settings'),
  notice=makeNode('notice'),toolbar=makeNode('toolbar'),inner=makeNode('inner'),
  optionsItem=makeNode('openXML'),info=makeNode('info');
 filePanel.querySelector=q=>q==='.toolbar'?toolbar:null;
 inner.children.push(optionsItem);
 ids.moreActions.querySelector=q=>q==='.moreActionsInner'?inner:null;
 ids.pianoNowPlaying.parentElement=info;
 const labels=[makeNode('tempo'),makeNode('follow')];
 info.querySelectorAll=q=>q==='label'?labels:[];
 const pages=[makeNode('page1'),makeNode('page2'),makeNode('page3')];
 ids.engravedScore.querySelectorAll=q=>q===':scope > .omrRenderedPage'?pages:[];
 const document={
  getElementById:id=>ids[id]||null,
  querySelector:q=>({
   '.layout-main > .paperCard:first-child':filePanel,
   '.omrHero':scanner,'.shell > aside.panel':setup,'.layout-main > .notice':notice
  })[q]||null,
  createElement:()=>makeNode(),
  events:{},addEventListener(type,fn){this.events[type]=fn}
 };
 const window={};
 ids.play.onclick=()=>{},ids.stop.onclick=()=>{};
 new Function('document','window',source[1])(document,window);
 return {ids,window,document,pages,filePanel,scanner,setup,labels,toolbar};
}
test('there is one real Play and Stop and a visible TEST VERSION label',()=>{
 const markup=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
 const allIds=[...markup.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(allIds.length,new Set(allIds).size,'No duplicate IDs');
 assert.match(html,/TEST VERSION — PR #64 \+ PR #65/);
 assert.match(html,/id="testDockPlay"/);
 assert.match(html,/id="testScoreTools"/);
 assert.match(html,/id="testEngravedPrev"/);
 assert.match(html,/id="testEngravedNext"/);
});
test('moves original transport and core settings without replacing event handlers',()=>{
 const ui=preview();
 assert.equal(ui.ids.play.parentElement,ui.ids.testDockPlay);
 assert.equal(ui.ids.stop.parentElement,ui.ids.testDockPlay);
 assert.equal(typeof ui.ids.play.onclick,'function');
 assert.equal(typeof ui.ids.stop.onclick,'function');
 assert.ok(ui.ids.testToolImport.children.includes(ui.scanner));
 assert.ok(ui.ids.testToolSetup.children.includes(ui.setup));
 assert.ok(ui.ids.testToolFiles.children.includes(ui.filePanel));
 assert.ok(ui.ids.testToolTeacher.children.includes(ui.ids.teacherDrawer));
 assert.ok(ui.ids.testToolTeacher.children.includes(ui.ids.autoExpressionReview));
 assert.ok(ui.ids.testToolTeacher.children.includes(ui.labels[0]));
 assert.ok(ui.ids.testToolTeacher.children.includes(ui.labels[1]));
});
test('Open score opens only its import panel; Tools remains a separate menu',()=>{
 const ui=preview();
 assert.equal(ui.ids.testOpenPanel.hidden,true);
 ui.ids.testDockOpen.click();
 assert.equal(ui.ids.testOpenPanel.hidden,false);
 assert.equal(ui.ids.testScoreTools.open,false,'Open score must never open Tools');
 assert.equal(ui.ids.testDockOpen.getAttribute('aria-expanded'),'true');
 assert.equal(ui.ids.omrChooseButton.focused,true);
 assert.ok(ui.ids.testToolImport.children.includes(ui.scanner));
 assert.ok(ui.ids.testToolImport.children.some(node=>node.className==='testLegacyImport'),'Advanced imports stay under Open Score');
 assert.equal(ui.ids.testToolFiles.children.length,1,'Tools has file/editor settings but no duplicate import panel');
 assert.ok(ui.ids.testOpenPanel.children.includes(ui.ids.testToolImport) || html.includes('id="testToolImport"'));
 ui.document.events.keydown({key:'Escape'});
 assert.equal(ui.ids.testOpenPanel.hidden,true,'Escape closes import menu');
 assert.equal(ui.ids.testDockOpen.getAttribute('aria-expanded'),'false');
 ui.ids.testDockOpen.click();
 ui.ids.testDockOpen.click();
 assert.equal(ui.ids.testOpenPanel.hidden,true,'Open score toggles its own panel');
 ui.ids.testDockOpen.click();
 ui.ids.testScoreTools.open=true;
 ui.ids.testScoreTools.events.toggle();
 assert.equal(ui.ids.testOpenPanel.hidden,true,'Opening Tools closes import panel');
 assert.equal(ui.ids.testScoreTools.open,true);
 ui.document.events.keydown({key:'Escape'});
 assert.equal(ui.ids.testScoreTools.open,false,'Escape closes Tools');
});
test('engraved page buttons show exactly one page without modifying playback',()=>{
 const ui=preview();
 ui.window.testScoreShowPage(0);
 assert.deepEqual(ui.pages.map(p=>p.hidden),[false,true,true]);
 assert.equal(ui.ids.testEngravedPageLabel.textContent,'Page 1 of 3');
 assert.equal(ui.ids.testEngravedPrev.disabled,true);
 ui.ids.testEngravedNext.click();
 assert.deepEqual(ui.pages.map(p=>p.hidden),[true,false,true]);
 assert.equal(ui.ids.testEngravedPageLabel.textContent,'Page 2 of 3 · Browsing');
 ui.window.testScoreShowPage(2);
 assert.deepEqual(ui.pages.map(p=>p.hidden),[true,true,false]);
 assert.equal(ui.ids.testEngravedNext.disabled,true);
 ui.ids.testEngravedPrev.click();
 assert.deepEqual(ui.pages.map(p=>p.hidden),[true,false,true]);
 assert.match(html,/window\.testScoreFollowPage\?\.\(page\)/,'Playback cursor passes playhead page to the guarded follower');
 assert.match(html,/window\.testScoreShowPage\?\.\(0\)/,'Navigator starts after engraving');
});
test('responsive score frame, note palette, full-page and frozen source stay available',()=>{
 assert.match(html,/#editorScorePanel \.paperScroll\{height:clamp/);
 assert.match(html,/#pianoPanel #engravedScore,#pianoPanel \.pianoScoreScroll\{height:clamp/);
 assert.match(html,/@media\(max-width:700px\)/);
 assert.match(html,/@media\(max-width:480px\)/);
 assert.match(html,/id="fullPageEditor"/);
 assert.match(html,/id="fullPageImported"/);
 assert.match(html,/id="fullPageZoomEditor"/);
 assert.match(html,/id="fullPageZoomImported"/);
 assert.match(html,/function parseMusicXML\(source\)/);
 assert.match(html,/function createImportedRepeatedTiming\(/);
 assert.match(html,/AGPL-3\.0/);
 assert.match(html,/Semibreve/);
 assert.match(html,/Semiquaver/);
 assert.match(html,/#musicTermsPanel\{display:none!important\}/);
});

test('manual Previous/Next stays selected during playback until Resume following',()=>{
 const ui=preview();
 ui.window.testScoreShowPage(0);
 assert.equal(ui.ids.testEngravedResume.hidden,true);
 // Simulate pupils browsing while an audible piece is on page one.
 ui.ids.testEngravedNext.click();
 assert.deepEqual(ui.pages.map(p=>p.hidden),[true,false,true]);
 assert.equal(ui.ids.testEngravedResume.hidden,false);
 assert.match(ui.ids.testEngravedPageLabel.textContent,/Browsing/);
 ui.window.testScoreFollowPage(0); // playback still page 1: do not snap
 assert.deepEqual(ui.pages.map(p=>p.hidden),[true,false,true]);
 ui.window.testScoreFollowPage(2); // playback moves to page 3: still browse page 2
 assert.deepEqual(ui.pages.map(p=>p.hidden),[true,false,true]);
 ui.ids.testEngravedPrev.click();
 assert.deepEqual(ui.pages.map(p=>p.hidden),[false,true,true]);
 ui.window.testScoreFollowPage(2);
 assert.deepEqual(ui.pages.map(p=>p.hidden),[false,true,true]);
 // Resume immediately returns to the actual playhead and follows it thereafter.
 ui.ids.testEngravedResume.click();
 assert.deepEqual(ui.pages.map(p=>p.hidden),[true,true,false]);
 assert.equal(ui.ids.testEngravedResume.hidden,true);
 assert.doesNotMatch(ui.ids.testEngravedPageLabel.textContent,/Browsing/);
 ui.window.testScoreFollowPage(1);
 assert.deepEqual(ui.pages.map(p=>p.hidden),[true,false,true]);
});
test('real engraved playback cursor retains manual page without scrolling to hidden cursor',()=>{
 const ui=preview();
 ui.window.testScoreShowPage(0);
 ui.ids.testEngravedNext.click();
 const start=html.indexOf('function moveEngravedPlaybackCursor(globalTick){');
 const end=html.indexOf('\nfunction startPianoTracking(',start);
 assert.ok(start>=0&&end>start,'Actual engraved playback cursor implementation found');
 const cursor={iterator:{endReached:true},cursorElement:{},show(){this.shown=true},hide(){},reset(){},next(){},previous(){}};
 const slot={start:0,end:9600,section:ui.pages[0],cursor,visible:false,position:-1,ready:true,lastTarget:0};
 const realDoc={
  getElementById:id=>ui.ids[id],
  querySelectorAll:selector=>selector==='#engravedScore > .omrRenderedPage'?ui.pages:[]
 };
 let scrolled=0;
 const move=new Function('document','window','engravedCursors','osmdTimestampTicks','followPianoElement',
  html.slice(start,end)+'\nreturn moveEngravedPlaybackCursor;'
 )(realDoc,ui.window,[slot],()=>0,()=>scrolled++);
 move(60);
 assert.equal(cursor.shown,true,'Music cursor continues advancing during manual browsing');
 assert.equal(scrolled,0,'Do not scroll a hidden playing page into view');
 assert.deepEqual(ui.pages.map(p=>p.hidden),[true,false,true],'Manual page is not overwritten by cursor');
 ui.ids.testEngravedResume.click();
 assert.deepEqual(ui.pages.map(p=>p.hidden),[false,true,true],'Resumed page matches actual playing page');
});
test('reviewed mobile labels and page buttons have readable touch targets',()=>{
 assert.match(html,/#annotationToolbar \.noteStampName\{font-size:11px;line-height:1\.15/);
 assert.match(html,/@media\(max-width:380px\)\{\s*#annotationToolbar \.noteStampName\{font-size:11px/);
 assert.match(html,/\.testEngravedNav button\{min-height:44px\}/);
 assert.match(html,/id="testEngravedResume"/);
});

test('import entry points stay independent from advanced score settings',()=>{
 const markup=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
 const importStart=markup.indexOf('id="testOpenPanel"');
 const toolStart=markup.indexOf('id="testToolsPanel"');
 assert.ok(importStart>=0&&toolStart>importStart);
 const toolMarkup=markup.slice(toolStart,markup.indexOf('</div>',toolStart));
 assert.doesNotMatch(toolMarkup,/id="testToolImport"/);
 assert.match(markup,/id="testDockOpen" aria-expanded="false" aria-controls="testOpenPanel"/);
 assert.match(markup,/id="omrChooseButton"/);
 assert.match(markup,/id="omrImportButton"/);
 assert.match(markup,/id="omrCameraButton"/);
 assert.match(html,/function wireOneStepScanner\(\)/);
 assert.match(html,/function wireProfessionalScanner\(\)/);
});

test('import and compose actions remain available on narrow phones',()=>{
 assert.match(html,/.piano-active \.testDockInner\{flex-wrap:wrap\}/);
 assert.match(html,/.piano-active #testDockOpen,.piano-active \.testScoreTools>summary\{width:100%\}/);
 assert.doesNotMatch(html,/\.piano-active #testDockOpen\{display:none\}/);
});
