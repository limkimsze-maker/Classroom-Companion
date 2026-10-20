'use strict';
// Compositions of existing UJI V1 glyphs. Invented layouts, never training data.
const fs=require('node:fs'),vm=require('node:vm');
const {assemble}=require('../../scripts/benchmark-handwriting-simulations.cjs');
const data={window:{}};vm.createContext(data);
vm.runInContext(fs.readFileSync('scripts/handwriting-uji-real-ink-fixtures.js','utf8'),data);
const samples=data.window.WhiteboardUJIInkFixtures?.samples||data.WhiteboardUJIInkFixtures?.samples;
function move(node,dx,dy,scale=1){return{w:node.w*scale,h:node.h*scale,
 strokes:node.strokes.map(s=>s.map(([x,y])=>[x*scale+dx,y*scale+dy]))};}
function number(text,writer=1){
 const raw=assemble(samples[writer],text,0).map(s=>s.points.map(p=>[p.x*1800,p.y*600]));
 const p=raw.flat(),xs=p.map(p=>p[0]),ys=p.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys);
 const scale=50/(Math.max(...ys)-y);
 return{w:(Math.max(...xs)-x)*scale,h:50,strokes:raw.map(s=>s.map(([px,py])=>[(px-x)*scale,(py-y)*scale]))};
}
function fraction(a,b){
 const w=Math.max(a.w,b.w)+32,bar=a.h+16;
 return{w,h:bar+16+b.h,strokes:[...move(a,(w-a.w)/2,0).strokes,
  [[0,bar],[w*.5,bar],[w,bar]],...move(b,(w-b.w)/2,bar+16).strokes]};
}
function root(a){
 const h=a.h+30,w=a.w+46;
 return{w,h,strokes:[[[0,h*.55],[5,h*.74],[9,h*.83],[14,h*.36],[19,0]],
  [[19,0],[w*.45,0],[w*.7,0],[w,0]],...move(a,30,14).strokes]};
}
function group(a){
 const h=a.h+20,w=a.w+44;
 return{w,h,strokes:[[[12,0],[5,h*.2],[0,h*.4],[0,h*.6],[5,h*.8],[12,h]],
  ...move(a,22,10).strokes,[[w-12,0],[w-5,h*.2],[w,h*.4],[w,h*.6],[w-5,h*.8],[w-12,h]]]};
}
function inline(a,op,b){
 const h=Math.max(a.h,b.h,50),x=a.w+18,cy=h/2,lines={
  '+':[[[x,cy],[x+30,cy]],[[x+15,cy-16],[x+15,cy+16]]],
  '−':[[[x,cy],[x+30,cy]]],
  '=':[[[x,cy-5],[x+30,cy-5]],[[x,cy+5],[x+30,cy+5]]]
 }[op];
 return{w:a.w+b.w+66,h,strokes:[...move(a,0,(h-a.h)/2).strokes,...lines,...move(b,a.w+66,(h-b.h)/2).strokes]};
}
function power(a,b){
 const small=move(b,0,0,.55),dy=small.h*.9;
 return{w:a.w+8+small.w,h:a.h+dy,strokes:[...move(a,0,dy).strokes,...move(small,a.w+8,0).strokes]};
}
function ink(node,{scale=1,reverse=false,direction=false}={}){
 let strokes=move(node,90,60,scale).strokes.map(points=>({size:3,points:points.map(([x,y])=>({x:x/1800,y:y/1200}))}));
 if(reverse)strokes.reverse();if(direction)strokes=strokes.map(s=>({...s,points:s.points.slice().reverse()}));return strokes;
}
function cases(){const n=number,f=fraction,r=root,g=group,p=power,s=inline;return[
 ['root of fraction',r(f(n('3'),n('4'))),'\\sqrt{\\frac{3}{4}}'],
 ['root in denominator',f(n('1'),r(n('9'))),'\\frac{1}{\\sqrt{9}}'],
 ['fraction in numerator',f(f(n('1'),n('2')),n('3')),'\\frac{\\frac{1}{2}}{3}'],
 ['fraction in denominator',f(n('1'),f(n('2'),n('3'))),'\\frac{1}{\\frac{2}{3}}'],
 ['root of grouped sum',r(g(s(n('3'),'+',n('4')))),'\\sqrt{(3+4)}'],
 ['nested roots',r(r(n('9'))),'\\sqrt{\\sqrt{9}}'],
 ['power in numerator',f(p(n('2'),n('3')),n('4')),'\\frac{2^{3}}{4}'],
 ['inline fraction sum',s(f(n('1'),n('2')),'+',n('3')),'\\frac{1}{2}+3'],
 ['fraction with sum numerator',f(s(n('3'),'+',n('4')),n('2')),'\\frac{3+4}{2}'],
 ['changed digits',r(f(n('7'),n('8'))),'\\sqrt{\\frac{7}{8}}'],
 ['unreduced fraction',r(f(n('10'),n('20'))),'\\sqrt{\\frac{10}{20}}'],
 ['zero denominator',r(f(n('9'),n('0'))),'\\sqrt{\\frac{9}{0}}']
];}
module.exports={number,fraction,root,group,inline,power,ink,cases};
