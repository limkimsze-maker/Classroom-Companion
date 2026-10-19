/* Classroom Companion Beta: offline arithmetic verification.
 * Pure, side-effect-free. Never infer a missing operand or change ambiguous ink.
 * This module is staged for integration into the Beta Beautify review.
 */
(function(root){
'use strict';
function verify(input){
 const source=String(input||'').trim();
 // Simple complete arithmetic only; leave units, fractions, algebra and multi-line work untouched.
 const match=/^\s*([+-]?\d+(?:\.\d+)?)\s*([+×x*÷/−-])\s*([+-]?\d+(?:\.\d+)?)\s*=\s*([+-]?\d+(?:\.\d+)?)\s*$/.exec(source);
 if(!match)return {supported:false,original:source,reason:'outside-safe-grammar'};
 const a=Number(match[1]),b=Number(match[3]),given=Number(match[4]),op=match[2];
 if(![a,b,given].every(Number.isFinite))return {supported:false,original:source,reason:'nonfinite'};
 if((op==='÷'||op==='/')&&b===0)return {supported:false,original:source,reason:'division-by-zero'};
 let value;
 switch(op){case '+':value=a+b;break;case '−':case '-':value=a-b;break;case '×':case 'x':case '*':value=a*b;break;default:value=a/b;}
 if(!Number.isFinite(value)||!Number.isSafeInteger(a*1e6)||!Number.isSafeInteger(b*1e6))return {supported:false,original:source,reason:'unsafe-precision'};
 const rounded=Number(value.toPrecision(12));
 const correct=Math.abs(given-rounded)<=1e-10*Math.max(1,Math.abs(rounded));
 return {supported:true,correct,original:source,expected:rounded,
  corrected:correct?source:source.slice(0,match.index)+source.replace(/=\s*[+-]?\d+(?:\.\d+)?\s*$/,'= '+String(rounded)),
  reason:correct?'verified':'arithmetic-mismatch'};
}
root.WhiteboardBetaArithmetic=Object.freeze({verify});
})(window);
