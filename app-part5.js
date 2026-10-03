'use strict';

// The legacy floating mini-tools interface has been retired.
// The persistent horizontal strip is now the single compact controller.
function syncFloat(){}

const legacyFloatButton = $('#floatBtn');
if(legacyFloatButton) legacyFloatButton.remove();
const legacyFloatHint = $('#floatHint');
if(legacyFloatHint) legacyFloatHint.remove();

function renderAll(){
  renderClasses();
  renderReward();
  resetPicker();
  $('#pickedPupil').textContent=selectedClass()?'Ready':'Add or select a class';
  $('#groupPreview').textContent=selectedClass()?'Choose a group size and generate.':'Add or select a class.';
  updateClock();
  updateDailyTimetable();
}

renderTimer();
renderFocus();
renderAll();
