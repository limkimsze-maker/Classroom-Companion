'use strict';
// Generated pen strokes, not copies of an individual's handwriting.
const {number}=require('./layout-fixtures.cjs');
const W=1200,H=500,S=(points,size=5)=>({size,points:points.map(([x,y])=>({x:x/W,y:y/H}))});
const eq=[S([[5,0],[8.2,-.5]]),S([[6,12],[10,10.5],[15,9]])];
const divide=[S([[0,0],[12,-1],[26,-3]]),S([[10,-13]]),S([[17,15]])];
const shift=(ink,dx,dy)=>ink.map(s=>({...s,points:s.points.map(p=>({x:p.x+dx/W,y:p.y+dy/H}))}));
function equation(a,b,c,operator=divide,scale=1){
 let x=20;const strokes=[];
 function digit(text){const n=number(text);strokes.push(...n.strokes.map(points=>S(points.map(([px,py])=>[x+px*scale,100+py*scale]))));x+=n.w*scale+20;}
 digit(a);strokes.push(...shift(operator,x,100+25*scale));x+=45;digit(b);strokes.push(...shift(eq,x,100+18*scale));x+=35;digit(c);return strokes;
}
module.exports={W,H,eq,divide,equation};
