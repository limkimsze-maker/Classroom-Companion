(function(){
'use strict';
const tool=new URLSearchParams(location.search).get('tool');
if(tool==='quote-of-the-day') location.replace('quote.html?v=20261004quoteold2');
})();
