(()=>{
  const learnerQuotes=[
    'You do not have to understand everything at once. Learn one step at a time.',
    'Slow progress is still progress. Keep the next step small and clear.',
    'Not knowing yet is the beginning of learning.',
    'A hard question is not a stop sign. Try a different strategy.',
    'Your first answer does not need to be perfect. It only needs to get you started.',
    'Mistakes show you what to work on next.',
    'When one way does not work, change the way — not the goal.',
    'Ask for help when you need it. Strong learners do.',
    'You can learn difficult things by breaking them into smaller parts.',
    'Today, aim to understand one thing better than yesterday.',
    'Getting stuck does not mean you cannot learn it. It means you need a next move.',
    'Try, check, change, and try again. That is learning.',
    'You are allowed to take your time. Keep thinking.',
    'One careful step is better than rushing through ten.',
    'If the work feels hard, choose one part you can do first.',
    'Every time you correct a mistake, your understanding gets stronger.',
    'You do not need to be the fastest learner. You need to keep learning.',
    'A small success today can become confidence tomorrow.',
    'Say what you know first. Then work out what is missing.',
    'When you feel unsure, use a strategy instead of giving up.',
    'Learning can feel difficult before it starts to feel familiar.',
    'Compare your work with your last attempt, not with someone else’s.',
    'You can pause, think, and try again.',
    'A question you ask today can unlock something tomorrow.',
    'Keep the parts you understand and work on one confusing part at a time.',
    'Effort helps most when you also change your strategy.',
    'You have learnt hard things before. Use the same patience again.',
    'Read it again. Draw it. Say it. Try another way.',
    'Being confused is a signal to slow down and look for the next clue.',
    'You do not have to get it right immediately to get better at it.',
    'Keep going until the next small step makes sense.'
  ];
  function dailyQuote(){
    const d=new Date();
    const day=Math.floor(new Date(d.getFullYear(),d.getMonth(),d.getDate())/86400000);
    return learnerQuotes[((day%learnerQuotes.length)+learnerQuotes.length)%learnerQuotes.length];
  }
  window.ClassroomLearnerQuotes=learnerQuotes;
  window.ClassroomDailyLearnerQuote=dailyQuote;

  const originalInstant=window.instantTool;
  if(typeof originalInstant==='function'){
    window.instantTool=function(t){
      if(t?.slug==='quote-of-the-day'){
        if(typeof window.showValue==='function')window.showValue('Quote of the Day',dailyQuote());
        return;
      }
      return originalInstant(t);
    };
  }

  const originalOptions=window.toolOptions;
  if(typeof originalOptions==='function'){
    window.toolOptions=function(t){
      if(t?.slug==='quote-of-the-day'){
        if(typeof window.showQuick==='function')window.showQuick('Quote of the Day',[{type:'value',label:dailyQuote()}]);
        return;
      }
      return originalOptions(t);
    };
  }
})();