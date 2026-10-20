'use strict';
// Run existing tests unchanged, with fresh isolated storage and the candidate reader.
const vm=require('node:vm');
const helper=require.resolve('../../scripts/helpers/handwriting-context.cjs');
const createContext=require(helper),source=require('./candidate.cjs').build();
require.cache[helper].exports=function(...args){
 const ctx=createContext(...args);
 vm.runInContext(source,ctx,{filename:'experimental-v2-reader.js'});
 return ctx;
};
