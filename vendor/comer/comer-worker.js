(()=>{var xt=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof require<"u"?require:t)[r]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')});var Qe={};var Vn=Object.defineProperty,a0=Object.getOwnPropertyDescriptor,s0=Object.getOwnPropertyNames,o0=Object.prototype.hasOwnProperty,u0=(e=>typeof xt<"u"?xt:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof xt<"u"?xt:t)[r]}):e)(function(e){if(typeof xt<"u")return xt.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),P=(e,t)=>()=>(e&&(t=e(e=0)),t),Ft=(e,t)=>{for(var r in t)Vn(e,r,{get:t[r],enumerable:!0})},l0=(e,t,r,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of s0(t))!o0.call(e,n)&&n!==r&&Vn(e,n,{get:()=>t[n],enumerable:!(i=a0(t,n))||i.enumerable});return e},fr=e=>l0(Vn({},"__esModule",{value:!0}),e),Xt,ft,Lt,mo,Kd,Qd=P(()=>{"use strict";Xt=new Map,ft=[],Lt=(e,t,r)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let i=Xt.get(e);if(i===void 0)Xt.set(e,{backend:t,priority:r});else{if(i.priority>r)return;if(i.priority===r&&i.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let n=ft.indexOf(e);n!==-1&&ft.splice(n,1);for(let a=0;a<ft.length;a++)if(Xt.get(ft[a]).priority<=r){ft.splice(a,0,e);return}ft.push(e)}return}throw new TypeError("not a valid backend")},mo=async e=>{let t=Xt.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{return r||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(i){return r||(t.error=`${i}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},Kd=async e=>{let t=e.executionProviders||[],r=t.map(l=>typeof l=="string"?l:l.name),i=r.length===0?ft:r,n,a=[],s=new Set;for(let l of i){let p=await mo(l);typeof p=="string"?a.push({name:l,err:p}):(n||(n=p),n===p&&s.add(l))}if(!n)throw new Error(`no available backend found. ERR: ${a.map(l=>`[${l.name}] ${l.err}`).join(", ")}`);for(let{name:l,err:p}of a)r.includes(l)&&console.warn(`removing requested execution provider "${l}" from session options because it is not available: ${p}`);let u=t.filter(l=>s.has(typeof l=="string"?l:l.name));return[n,new Proxy(e,{get:(l,p)=>p==="executionProviders"?u:Reflect.get(l,p)})]}}),d0=P(()=>{"use strict";Qd()}),Zd,p0=P(()=>{"use strict";Zd="1.24.2"}),Ci,Ie,Yd=P(()=>{"use strict";p0(),Ci="warning",Ie={wasm:{},webgl:{},webgpu:{},versions:{common:Zd},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);Ci=e}},get logLevel(){return Ci}},Object.defineProperty(Ie,"logLevel",{enumerable:!0})}),he,c0=P(()=>{"use strict";Yd(),he=Ie}),Xd,Jd,h0=P(()=>{"use strict";Xd=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let i=r.getContext("2d");if(i!=null){let n,a;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(n=e.dims[2],a=e.dims[3]):(n=e.dims[3],a=e.dims[2]);let s=t?.format!==void 0?t.format:"RGB",u=t?.norm,l,p;u===void 0||u.mean===void 0?l=[255,255,255,255]:typeof u.mean=="number"?l=[u.mean,u.mean,u.mean,u.mean]:(l=[u.mean[0],u.mean[1],u.mean[2],0],u.mean[3]!==void 0&&(l[3]=u.mean[3])),u===void 0||u.bias===void 0?p=[0,0,0,0]:typeof u.bias=="number"?p=[u.bias,u.bias,u.bias,u.bias]:(p=[u.bias[0],u.bias[1],u.bias[2],0],u.bias[3]!==void 0&&(p[3]=u.bias[3]));let f=a*n,c=0,g=f,_=f*2,y=-1;s==="RGBA"?(c=0,g=f,_=f*2,y=f*3):s==="RGB"?(c=0,g=f,_=f*2):s==="RBG"&&(c=0,_=f,g=f*2);for(let $=0;$<a;$++)for(let S=0;S<n;S++){let v=(e.data[c++]-p[0])*l[0],w=(e.data[g++]-p[1])*l[1],I=(e.data[_++]-p[2])*l[2],T=y===-1?255:(e.data[y++]-p[3])*l[3];i.fillStyle="rgba("+v+","+w+","+I+","+T+")",i.fillRect(S,$,1,1)}if("toDataURL"in r)return r.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},Jd=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),i;if(r!=null){let n,a,s;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(n=e.dims[2],a=e.dims[1],s=e.dims[3]):(n=e.dims[3],a=e.dims[2],s=e.dims[1]);let u=t!==void 0&&t.format!==void 0?t.format:"RGB",l=t?.norm,p,f;l===void 0||l.mean===void 0?p=[255,255,255,255]:typeof l.mean=="number"?p=[l.mean,l.mean,l.mean,l.mean]:(p=[l.mean[0],l.mean[1],l.mean[2],255],l.mean[3]!==void 0&&(p[3]=l.mean[3])),l===void 0||l.bias===void 0?f=[0,0,0,0]:typeof l.bias=="number"?f=[l.bias,l.bias,l.bias,l.bias]:(f=[l.bias[0],l.bias[1],l.bias[2],0],l.bias[3]!==void 0&&(f[3]=l.bias[3]));let c=a*n;if(t!==void 0&&(t.format!==void 0&&s===4&&t.format!=="RGBA"||s===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let g=4,_=0,y=1,$=2,S=3,v=0,w=c,I=c*2,T=-1;u==="RGBA"?(v=0,w=c,I=c*2,T=c*3):u==="RGB"?(v=0,w=c,I=c*2):u==="RBG"&&(v=0,I=c,w=c*2),i=r.createImageData(n,a);for(let E=0;E<a*n;_+=g,y+=g,$+=g,S+=g,E++)i.data[_]=(e.data[v++]-f[0])*p[0],i.data[y]=(e.data[w++]-f[1])*p[1],i.data[$]=(e.data[I++]-f[2])*p[2],i.data[S]=T===-1?255:(e.data[T++]-f[3])*p[3]}else throw new Error("Can not access image data");return i}}),Ar,ep,tp,rp,ip,np,f0=P(()=>{"use strict";Gn(),Ar=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:r,width:i}=t,n=t.norm??{mean:255,bias:0},a,s;typeof n.mean=="number"?a=[n.mean,n.mean,n.mean,n.mean]:a=[n.mean[0],n.mean[1],n.mean[2],n.mean[3]??255],typeof n.bias=="number"?s=[n.bias,n.bias,n.bias,n.bias]:s=[n.bias[0],n.bias[1],n.bias[2],n.bias[3]??0];let u=t.format!==void 0?t.format:"RGBA",l=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",p=r*i,f=l==="RGBA"?new Float32Array(p*4):new Float32Array(p*3),c=4,g=0,_=1,y=2,$=3,S=0,v=p,w=p*2,I=-1;u==="RGB"&&(c=3,g=0,_=1,y=2,$=-1),l==="RGBA"?I=p*3:l==="RBG"?(S=0,w=p,v=p*2):l==="BGR"&&(w=0,v=p,S=p*2);for(let T=0;T<p;T++,g+=c,y+=c,_+=c,$+=c)f[S++]=(e[g]+s[0])/a[0],f[v++]=(e[_]+s[1])/a[1],f[w++]=(e[y]+s[2])/a[2],I!==-1&&$!==-1&&(f[I++]=(e[$]+s[3])/a[3]);return l==="RGBA"?new Me("float32",f,[1,4,r,i]):new Me("float32",f,[1,3,r,i])},ep=async(e,t)=>{let r=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,i=typeof ImageData<"u"&&e instanceof ImageData,n=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,a=typeof e=="string",s,u=t??{},l=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},p=f=>typeof HTMLCanvasElement<"u"&&f instanceof HTMLCanvasElement||f instanceof OffscreenCanvas?f.getContext("2d"):null;if(r){let f=l();f.width=e.width,f.height=e.height;let c=p(f);if(c!=null){let g=e.height,_=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(g=t.resizedHeight,_=t.resizedWidth),t!==void 0){if(u=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");u.tensorFormat="RGBA",u.height=g,u.width=_}else u.tensorFormat="RGBA",u.height=g,u.width=_;c.drawImage(e,0,0),s=c.getImageData(0,0,_,g).data}else throw new Error("Can not access image data")}else if(i){let f,c;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(f=t.resizedHeight,c=t.resizedWidth):(f=e.height,c=e.width),t!==void 0&&(u=t),u.format="RGBA",u.height=f,u.width=c,t!==void 0){let g=l();g.width=c,g.height=f;let _=p(g);if(_!=null)_.putImageData(e,0,0),s=_.getImageData(0,0,c,f).data;else throw new Error("Can not access image data")}else s=e.data}else if(n){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let f=l();f.width=e.width,f.height=e.height;let c=p(f);if(c!=null){let g=e.height,_=e.width;return c.drawImage(e,0,0,_,g),s=c.getImageData(0,0,_,g).data,u.height=g,u.width=_,Ar(s,u)}else throw new Error("Can not access image data")}else{if(a)return new Promise((f,c)=>{let g=l(),_=p(g);if(!e||!_)return c();let y=new Image;y.crossOrigin="Anonymous",y.src=e,y.onload=()=>{g.width=y.width,g.height=y.height,_.drawImage(y,0,0,g.width,g.height);let $=_.getImageData(0,0,g.width,g.height);u.height=g.height,u.width=g.width,f(Ar($.data,u))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(s!==void 0)return Ar(s,u);throw new Error("Input data provided is not supported - aborted tensor creation")},tp=(e,t)=>{let{width:r,height:i,download:n,dispose:a}=t,s=[1,i,r,4];return new Me({location:"texture",type:"float32",texture:e,dims:s,download:n,dispose:a})},rp=(e,t)=>{let{dataType:r,dims:i,download:n,dispose:a}=t;return new Me({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:i,download:n,dispose:a})},ip=(e,t)=>{let{dataType:r,dims:i,download:n,dispose:a}=t;return new Me({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:i,download:n,dispose:a})},np=(e,t,r)=>new Me({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),Et,lr,Ai,ap,m0=P(()=>{"use strict";Et=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),lr=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),Ai=!1,ap=()=>{if(!Ai){Ai=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,r=globalThis.Float16Array,i=typeof r<"u"&&r.from;e&&(Et.set("int64",BigInt64Array),lr.set(BigInt64Array,"int64")),t&&(Et.set("uint64",BigUint64Array),lr.set(BigUint64Array,"uint64")),i?(Et.set("float16",r),lr.set(r,"float16")):Et.set("float16",Uint16Array)}}}),sp,op,g0=P(()=>{"use strict";Gn(),sp=e=>{let t=1;for(let r=0;r<e.length;r++){let i=e[r];if(typeof i!="number"||!Number.isSafeInteger(i))throw new TypeError(`dims[${r}] must be an integer, got: ${i}`);if(i<0)throw new RangeError(`dims[${r}] must be a non-negative integer, got: ${i}`);t*=i}return t},op=(e,t)=>{switch(e.location){case"cpu":return new Me(e.type,e.data,t);case"cpu-pinned":return new Me({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new Me({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new Me({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new Me({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),Me,Gn=P(()=>{"use strict";h0(),f0(),m0(),g0(),Me=class{constructor(e,t,r){ap();let i,n;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,i=e.type,n=e.dims,e.location){case"cpu-pinned":{let s=Et.get(i);if(!s)throw new TypeError(`unsupported type "${i}" to create tensor from pinned buffer`);if(!(e.data instanceof s))throw new TypeError(`buffer should be of type ${s.name}`);this.cpuData=e.data;break}case"texture":{if(i!=="float32")throw new TypeError(`unsupported type "${i}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(i!=="float32"&&i!=="float16"&&i!=="int32"&&i!=="int64"&&i!=="uint32"&&i!=="uint64"&&i!=="int8"&&i!=="uint8"&&i!=="bool"&&i!=="uint4"&&i!=="int4")throw new TypeError(`unsupported type "${i}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let s,u;if(typeof e=="string")if(i=e,u=r,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");s=t}else{let l=Et.get(e);if(l===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&l===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${l.name} as data.`);e==="uint64"||e==="int64"?s=l.from(t,BigInt):s=l.from(t)}else if(t instanceof l)s=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")s=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&l!==Uint16Array)s=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${i} tensor's data must be type of ${l}`)}else if(u=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let l=typeof e[0];if(l==="string")i="string",s=e;else if(l==="boolean")i="bool",s=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${l}.`)}else if(e instanceof Uint8ClampedArray)i="uint8",s=Uint8Array.from(e);else{let l=lr.get(e.constructor);if(l===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);i=l,s=e}if(u===void 0)u=[s.length];else if(!Array.isArray(u))throw new TypeError("A tensor's dims must be a number array");n=u,this.cpuData=s,this.dataLocation="cpu"}let a=sp(n);if(this.cpuData&&a!==this.cpuData.length&&!((i==="uint4"||i==="int4")&&Math.ceil(a/2)===this.cpuData.length))throw new Error(`Tensor's size(${a}) does not match data length(${this.cpuData.length}).`);this.type=i,this.dims=n,this.size=a}static async fromImage(e,t){return ep(e,t)}static fromTexture(e,t){return tp(e,t)}static fromGpuBuffer(e,t){return rp(e,t)}static fromMLTensor(e,t){return ip(e,t)}static fromPinnedBuffer(e,t,r){return np(e,t,r)}toDataURL(e){return Xd(this,e)}toImageData(e){return Jd(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return op(this,e)}}}),Oe,up=P(()=>{"use strict";Gn(),Oe=Me}),Fr,Oi,tt,Ze,At,Ot,lp=P(()=>{"use strict";Yd(),Fr=(e,t)=>{(typeof Ie.trace>"u"?!Ie.wasm.trace:!Ie.trace)||console.timeStamp(`${e}::ORT::${t}`)},Oi=(e,t)=>{let r=new Error().stack?.split(/\r\n|\r|\n/g)||[],i=!1;for(let n=0;n<r.length;n++){if(i&&!r[n].includes("TRACE_FUNC")){let a=`FUNC_${e}::${r[n].trim().split(" ")[1]}`;t&&(a+=`::${t}`),Fr("CPU",a);return}r[n].includes("TRACE_FUNC")&&(i=!0)}},tt=e=>{(typeof Ie.trace>"u"?!Ie.wasm.trace:!Ie.trace)||Oi("BEGIN",e)},Ze=e=>{(typeof Ie.trace>"u"?!Ie.wasm.trace:!Ie.trace)||Oi("END",e)},At=e=>{(typeof Ie.trace>"u"?!Ie.wasm.trace:!Ie.trace)||console.time(`ORT::${e}`)},Ot=e=>{(typeof Ie.trace>"u"?!Ie.wasm.trace:!Ie.trace)||console.timeEnd(`ORT::${e}`)}}),dp,y0=P(()=>{"use strict";Qd(),up(),lp(),dp=class pp{constructor(t){this.handler=t}async run(t,r,i){tt(),At("InferenceSession.run");let n={},a={};if(typeof t!="object"||t===null||t instanceof Oe||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let s=!0;if(typeof r=="object"){if(r===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(r instanceof Oe)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(r)){if(r.length===0)throw new TypeError("'fetches' cannot be an empty array.");s=!1;for(let p of r){if(typeof p!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(p)===-1)throw new RangeError(`'fetches' contains invalid output name: ${p}.`);n[p]=null}if(typeof i=="object"&&i!==null)a=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else{let p=!1,f=Object.getOwnPropertyNames(r);for(let c of this.outputNames)if(f.indexOf(c)!==-1){let g=r[c];(g===null||g instanceof Oe)&&(p=!0,s=!1,n[c]=g)}if(p){if(typeof i=="object"&&i!==null)a=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else a=r}}else if(typeof r<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let p of this.inputNames)if(typeof t[p]>"u")throw new Error(`input '${p}' is missing in 'feeds'.`);if(s)for(let p of this.outputNames)n[p]=null;let u=await this.handler.run(t,n,a),l={};for(let p in u)if(Object.hasOwnProperty.call(u,p)){let f=u[p];f instanceof Oe?l[p]=f:l[p]=new Oe(f.type,f.data,f.dims)}return Ot("InferenceSession.run"),Ze(),l}async release(){return this.handler.dispose()}static async create(t,r,i,n){tt(),At("InferenceSession.create");let a,s={};if(typeof t=="string"){if(a=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(a=t,typeof r=="object"&&r!==null)s=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let f=t,c=0,g=t.byteLength;if(typeof r=="object"&&r!==null)s=r;else if(typeof r=="number"){if(c=r,!Number.isSafeInteger(c))throw new RangeError("'byteOffset' must be an integer.");if(c<0||c>=f.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${f.byteLength}).`);if(g=t.byteLength-c,typeof i=="number"){if(g=i,!Number.isSafeInteger(g))throw new RangeError("'byteLength' must be an integer.");if(g<=0||c+g>f.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${f.byteLength-c}].`);if(typeof n=="object"&&n!==null)s=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else if(typeof i<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof r<"u")throw new TypeError("'options' must be an object.");a=new Uint8Array(f,c,g)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[u,l]=await Kd(s),p=await u.createInferenceSessionHandler(a,l);return Ot("InferenceSession.create"),Ze(),new pp(p)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),Nt,_0=P(()=>{"use strict";y0(),Nt=dp}),w0=P(()=>{"use strict"}),b0=P(()=>{"use strict"}),$0=P(()=>{"use strict"}),v0=P(()=>{"use strict"}),x0={};Ft(x0,{InferenceSession:()=>Nt,TRACE:()=>Fr,TRACE_EVENT_BEGIN:()=>At,TRACE_EVENT_END:()=>Ot,TRACE_FUNC_BEGIN:()=>tt,TRACE_FUNC_END:()=>Ze,Tensor:()=>Oe,env:()=>he,registerBackend:()=>Lt});var qe=P(()=>{"use strict";d0(),c0(),_0(),up(),w0(),b0(),lp(),$0(),v0()}),Hn=P(()=>{"use strict"}),cp={};Ft(cp,{default:()=>hp});var Ri,Bi,hp,S0=P(()=>{"use strict";wf(),Dt(),Fn(),Ri="ort-wasm-proxy-worker",Bi=globalThis.self?.name===Ri,Bi&&(self.onmessage=e=>{let{type:t,in:r}=e.data;try{switch(t){case"init-wasm":jn(r.wasm).then(()=>{da(r).then(()=>{postMessage({type:t})},i=>{postMessage({type:t,err:i})})},i=>{postMessage({type:t,err:i})});break;case"init-ep":{let{epName:i,env:n}=r;pa(n,i).then(()=>{postMessage({type:t})},a=>{postMessage({type:t,err:a})});break}case"copy-from":{let{buffer:i}=r,n=Jr(i);postMessage({type:t,out:n});break}case"create":{let{model:i,options:n}=r;ca(i,n).then(a=>{postMessage({type:t,out:a})},a=>{postMessage({type:t,err:a})});break}case"release":ha(r),postMessage({type:t});break;case"run":{let{sessionId:i,inputIndices:n,inputs:a,outputIndices:s,options:u}=r;fa(i,n,a,s,new Array(s.length).fill(null),u).then(l=>{l.some(p=>p[3]!=="cpu")?postMessage({type:t,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:t,out:l},ga([...a,...l]))},l=>{postMessage({type:t,err:l})});break}case"end-profiling":ma(r),postMessage({type:t});break;default:}}catch(i){postMessage({type:t,err:i})}}),hp=Bi?null:e=>new Worker(e??Be,{type:"module",name:Ri})}),fp={};Ft(fp,{default:()=>mp});async function go(e={}){var t=e,r=!!globalThis.window,i=!!globalThis.WorkerGlobalScope,n=i&&self.name?.startsWith("em-pthread");t.mountExternalData=(o,d)=>{o.startsWith("./")&&(o=o.substring(2)),(t.Zc||(t.Zc=new Map)).set(o,d)},t.unmountExternalData=()=>{delete t.Zc},globalThis.SharedArrayBuffer??new WebAssembly.Memory({initial:0,maximum:0,ae:!0}).buffer.constructor;let a=o=>async(...d)=>{try{if(t.$c)throw Error("Session already started");let m=t.$c={Nd:d[0],errors:[]},h=await o(...d);if(t.$c!==m)throw Error("Session mismatch");t.gd?.flush();let b=m.errors;if(0<b.length){let k=await Promise.all(b);if(k=k.filter(C=>C),0<k.length)throw Error(k.join(`
`))}return h}finally{t.$c=null}};t.jsepInit=(o,d)=>{if(o==="webgpu"){[t.gd,t.Dd,t.Hd,t.jd,t.Gd,t.ac,t.Id,t.Kd,t.Ed,t.Fd,t.Jd]=d;let m=t.gd;t.jsepRegisterBuffer=(h,b,k,C)=>m.registerBuffer(h,b,k,C),t.jsepGetBuffer=h=>m.getBuffer(h),t.jsepCreateDownloader=(h,b,k)=>m.createDownloader(h,b,k),t.jsepOnCreateSession=h=>{m.onCreateSession(h)},t.jsepOnReleaseSession=h=>{m.onReleaseSession(h)},t.jsepOnRunStart=h=>m.onRunStart(h),t.Ld=(h,b)=>{m.upload(h,b)}}else if(o==="webnn"){let m=d[0];[t.Zd,t.vd,t.webnnEnsureTensor,t.xd,t.webnnDownloadTensor,t.Yd,t.webnnEnableTraceEvent]=d.slice(1),t.webnnReleaseTensorId=t.vd,t.webnnUploadTensor=t.xd,t.webnnRegisterMLContext=t.Yd,t.webnnOnRunStart=h=>m.onRunStart(h),t.webnnOnRunEnd=m.onRunEnd.bind(m),t.webnnOnReleaseSession=h=>{m.onReleaseSession(h)},t.webnnCreateMLTensorDownloader=(h,b)=>m.createMLTensorDownloader(h,b),t.webnnRegisterMLTensor=(h,b,k,C)=>m.registerMLTensor(h,b,k,C),t.webnnCreateMLContext=h=>m.createMLContext(h),t.webnnRegisterMLConstant=(h,b,k,C,B,q)=>m.registerMLConstant(h,b,k,C,B,t.Zc,q),t.webnnRegisterGraphInput=m.registerGraphInput.bind(m),t.webnnIsGraphInput=m.isGraphInput.bind(m),t.webnnRegisterGraphOutput=m.registerGraphOutput.bind(m),t.webnnIsGraphOutput=m.isGraphOutput.bind(m),t.webnnCreateTemporaryTensor=m.createTemporaryTensor.bind(m),t.webnnIsGraphInputOutputTypeSupported=m.isGraphInputOutputTypeSupported.bind(m)}};let s=()=>{let o=d=>(...m)=>{let h=Xe;return m=d(...m),Xe!=h?new Promise((b,k)=>{yi={resolve:b,reject:k}}):m};(()=>{for(let d of["_OrtAppendExecutionProvider","_OrtCreateSession","_OrtRun","_OrtRunWithBinding","_OrtBindInput"])t[d]=o(t[d])})(),a!==void 0&&(t._OrtRun=a(t._OrtRun),t._OrtRunWithBinding=a(t._OrtRunWithBinding)),s=void 0};t.asyncInit=()=>{s?.()};var u,l,p=(o,d)=>{throw d},f=Qe.url,c="";if(r||i){try{c=new URL(".",f).href}catch{}i&&(l=o=>{var d=new XMLHttpRequest;return d.open("GET",o,!1),d.responseType="arraybuffer",d.send(null),new Uint8Array(d.response)}),u=async o=>{if(O(o))return new Promise((m,h)=>{var b=new XMLHttpRequest;b.open("GET",o,!0),b.responseType="arraybuffer",b.onload=()=>{b.status==200||b.status==0&&b.response?m(b.response):h(b.status)},b.onerror=h,b.send(null)});var d=await fetch(o,{credentials:"same-origin"});if(d.ok)return d.arrayBuffer();throw Error(d.status+" : "+d.url)}}var g,_,y,$,S,v,w=console.log.bind(console),I=console.error.bind(console),T=w,E=I,z=!1,O=o=>o.startsWith("file://");function x(){dt.buffer!=Z.buffer&&J()}if(n){let o=function(d){try{var m=d.data,h=m.Uc;if(h==="load"){let b=[];self.onmessage=k=>b.push(k),v=()=>{postMessage({Uc:"loaded"});for(let k of b)o(k);self.onmessage=o};for(let k of m.Ad)t[k]&&!t[k].proxy||(t[k]=(...C)=>{postMessage({Uc:"callHandler",zd:k,args:C})},k=="print"&&(T=t[k]),k=="printErr"&&(E=t[k]));dt=m.Vd,J(),_=m.Wd,We(),Cr()}else if(h==="run"){(function(b){var k=(x(),U)[b+52>>>2>>>0];b=(x(),U)[b+56>>>2>>>0],xs(k,k-b),ne(k)})(m.Tc),vi(m.Tc,0,0,1,0,0),Sa(),fi(m.Tc),W||(ys(),W=!0);try{Kf(m.Pd,m.dd)}catch(b){if(b!="unwind")throw b}}else m.target!=="setimmediate"&&(h==="checkMailbox"?W&&xr():h&&(E(`worker: received unknown command ${h}`),E(m)))}catch(b){throw _s(),b}};var D=o,W=!1;self.onunhandledrejection=d=>{throw d.reason||d},self.onmessage=o}var Z,L,K,se,A,U,ee,Y,F,le,N,V=!1;function J(){var o=dt.buffer;t.HEAP8=Z=new Int8Array(o),K=new Int16Array(o),t.HEAPU8=L=new Uint8Array(o),se=new Uint16Array(o),t.HEAP32=A=new Int32Array(o),t.HEAPU32=U=new Uint32Array(o),ee=new Float32Array(o),Y=new Float64Array(o),F=new BigInt64Array(o),le=new BigUint64Array(o)}function de(){V=!0,n?v():nt.tb()}function Te(o){throw E(o="Aborted("+o+")"),z=!0,o=new WebAssembly.RuntimeError(o+". Build with -sASSERTIONS for more info."),S?.(o),o}function Re(){return{a:{ma:wg,hb:_g,g:Qf,J:Zf,f:Yf,o:Xf,h:Jf,ha:em,b:tm,T:rm,Ia:Ca,n:im,_:Ba,Ya:Ma,Ea:Na,Ga:Da,Za:Pa,Wa:Ua,Pa:qa,Va:Wa,ka:La,Fa:Va,Ca:Ga,Xa:Ha,Da:Fa,cb:nm,ea:sm,xa:om,va:lm,da:pm,O:cm,H:hm,wa:fm,Z:$m,ya:vm,Sa:xm,Aa:Tm,Ja:km,ta:Im,fa:Em,Ra:fi,$a:zm,R:Rm,s:Pm,c:ci,ib:Um,y:qm,M:Wm,D:Lm,m:Vm,t:es,jb:Gm,I:Hm,S:Fm,j:jm,v:Km,r:Qm,l:Zm,Ma:Ym,Na:Xm,Oa:Jm,Ka:ns,La:as,ua:ss,eb:tg,bb:ng,u:ag,aa:sg,ga:og,ab:rg,V:ug,_a:lg,Ba:dg,F:eg,U:pg,la:Er,za:hg,gb:cg,fb:fg,Ta:ds,Ua:ps,Ha:oi,$:cs,ja:hs,Qa:fs,ia:ms,lb:r0,na:Qg,mb:t0,oa:Kg,G:Ug,d:xg,q:$g,w:bg,B:Rg,pb:Hg,K:Ng,x:Tg,pa:Fg,X:Zg,ba:Gg,nb:e0,ob:Jg,ra:qg,qa:Vg,qb:Wg,N:Dg,Y:jg,e:Sg,A:kg,k:vg,kb:i0,p:Eg,z:zg,C:Ig,E:Cg,L:Bg,rb:Pg,Q:Yg,ca:Mg,W:Xg,sb:Og,sa:Ag,P:Lg,i:gg,a:dt,db:si}}}async function We(){function o(h,b){var k=nt=h.exports;h={};for(let[C,B]of Object.entries(k))typeof B=="function"?(k=Cm(B),h[C]=k):h[C]=B;return nt=h,nt=(function(){var C=nt,B=G=>ie=>G(ie)>>>0,q=G=>()=>G()>>>0;return(C=Object.assign({},C)).ub=B(C.ub),C.Yb=q(C.Yb),C._b=B(C._b),C.mc=B(C.mc),C.nc=q(C.nc),C.rc=B(C.rc),C})(),va.push(nt.$b),gs=(h=nt).ub,ys=h.vb,t._OrtInit=h.wb,t._OrtGetLastError=h.xb,t._OrtCreateSessionOptions=h.yb,t._OrtAppendExecutionProvider=h.zb,t._OrtAddFreeDimensionOverride=h.Ab,t._OrtAddSessionConfigEntry=h.Bb,t._OrtReleaseSessionOptions=h.Cb,t._OrtCreateSession=h.Db,t._OrtReleaseSession=h.Eb,t._OrtGetInputOutputCount=h.Fb,t._OrtGetInputOutputMetadata=h.Gb,t._OrtFree=h.Hb,t._OrtCreateTensor=h.Ib,t._OrtGetTensorData=h.Jb,t._OrtReleaseTensor=h.Kb,t._OrtCreateRunOptions=h.Lb,t._OrtAddRunConfigEntry=h.Mb,t._OrtReleaseRunOptions=h.Nb,t._OrtCreateBinding=h.Ob,t._OrtBindInput=h.Pb,t._OrtBindOutput=h.Qb,t._OrtClearBoundOutputs=h.Rb,t._OrtReleaseBinding=h.Sb,t._OrtRunWithBinding=h.Tb,t._OrtRun=h.Ub,t._OrtEndProfiling=h.Vb,t._JsepOutput=h.Wb,t._JsepGetNodeName=h.Xb,zr=h.Yb,Je=t._free=h.Zb,Zt=t._malloc=h._b,vi=h.bc,_s=h.cc,ws=h.dc,bs=h.ec,xi=h.fc,$s=h.gc,vs=h.hc,oe=h.ic,Yt=h.jc,xs=h.kc,ne=h.lc,Si=h.mc,ae=h.nc,Ss=h.oc,Ti=h.pc,Ts=h.qc,ks=h.rc,Is=h.sc,ki=h.tc,Es=h.uc,zs=h.vc,Cs=h.wc,As=h.xc,Os=h.yc,Rs=h.zc,Bs=h.Ac,Ms=h.Bc,Ns=h.Cc,Ds=h.Dc,Ps=h.Ec,Us=h.Fc,qs=h.Gc,Ws=h.Hc,Ls=h.Ic,Vs=h.Jc,Gs=h.Kc,Hs=h.Lc,Fs=h.Mc,js=h.Nc,Ks=h.Oc,Qs=h.Pc,Zs=h.Rc,Ys=h.Sc,Xs=h.bd,Js=h.cd,eo=h.hd,to=h.kd,ro=h.ld,io=h.md,no=h.nd,ao=h.od,so=h.pd,oo=h.qd,uo=h.rd,lo=h.wd,po=h.Rd,co=h.Sd,ho=h.Td,fo=h.Ud,_=b,nt}var d,m=Re();return t.instantiateWasm?new Promise(h=>{t.instantiateWasm(m,(b,k)=>{h(o(b,k))})}):n?o(new WebAssembly.Instance(_,Re()),_):(N??=t.locateFile?t.locateFile?t.locateFile("ort-wasm-simd-threaded.jsep.wasm",c):c+"ort-wasm-simd-threaded.jsep.wasm":new URL("ort-wasm-simd-threaded.jsep.wasm",Qe.url).href,d=await(async function(h){var b=N;if(!g&&!O(b))try{var k=fetch(b,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(k,h)}catch(C){E(`wasm streaming compile failed: ${C}`),E("falling back to ArrayBuffer instantiation")}return(async function(C,B){try{var q=await(async function(G){if(!g)try{var ie=await u(G);return new Uint8Array(ie)}catch{}if(G==N&&g)G=new Uint8Array(g);else{if(!l)throw"both async and sync fetching of the wasm failed";G=l(G)}return G})(C);return await WebAssembly.instantiate(q,B)}catch(G){E(`failed to asynchronously prepare wasm: ${G}`),Te(G)}})(b,h)})(m),o(d.instance,d.module))}class rt{name="ExitStatus";constructor(d){this.message=`Program terminated with exit(${d})`,this.status=d}}var xe=o=>{o.terminate(),o.onmessage=()=>{}},be=[],Ae=0,wt=null,_r=o=>{lt.length==0&&(ka(),Ta(lt[0]));var d=lt.pop();if(!d)return 6;Kt.push(d),bt[o.Tc]=d,d.Tc=o.Tc;var m={Uc:"run",Pd:o.Od,dd:o.dd,Tc:o.Tc};return d.postMessage(m,o.ud),0},ut=0,we=(o,d,...m)=>{var h,b=16*m.length,k=ae(),C=Si(b),B=C>>>3;for(h of m)typeof h=="bigint"?((x(),F)[B++>>>0]=1n,(x(),F)[B++>>>0]=h):((x(),F)[B++>>>0]=0n,(x(),Y)[B++>>>0]=h);return o=ws(o,0,b,C,d),ne(k),o};function si(o){if(n)return we(0,1,o);if(y=o,!(0<ut)){for(var d of Kt)xe(d);for(d of lt)xe(d);lt=[],Kt=[],bt={},z=!0}p(0,new rt(o))}function $a(o){if(n)return we(1,0,o);oi(o)}var oi=o=>{if(y=o,n)throw $a(o),"unwind";si(o)},lt=[],Kt=[],va=[],bt={},xa=o=>{var d=o.Tc;delete bt[d],lt.push(o),Kt.splice(Kt.indexOf(o),1),o.Tc=0,bs(d)};function Sa(){va.forEach(o=>o())}var Ta=o=>new Promise(d=>{o.onmessage=b=>{var k=b.data;if(b=k.Uc,k.ad&&k.ad!=zr()){var C=bt[k.ad];C?C.postMessage(k,k.ud):E(`Internal error! Worker sent a message "${b}" to target pthread ${k.ad}, but that thread no longer exists!`)}else b==="checkMailbox"?xr():b==="spawnThread"?_r(k):b==="cleanupThread"?vr(()=>{xa(bt[k.Qd])}):b==="loaded"?(o.loaded=!0,d(o)):k.target==="setimmediate"?o.postMessage(k):b==="uncaughtException"?o.onerror(k.error):b==="callHandler"?t[k.zd](...k.args):b&&E(`worker sent an unknown command ${b}`)},o.onerror=b=>{throw E(`worker sent an error! ${b.filename}:${b.lineno}: ${b.message}`),b};var m,h=[];for(m of[])t.propertyIsEnumerable(m)&&h.push(m);o.postMessage({Uc:"load",Ad:h,Vd:dt,Wd:_})});function ka(){var o=new Worker((()=>{let d=URL;return Qe.url>"file:"&&Qe.url<"file;"?new d("ort.bundle.min.mjs",Qe.url):new URL(Qe.url)})(),{type:"module",workerData:"em-pthread",name:"em-pthread"});lt.push(o)}var dt,Kf=(o,d)=>{ut=0,o=ki(o,d),0<ut?y=o:xi(o)},wr=[],br=0;function Qf(o){var d=new ui(o>>>=0);return(x(),Z)[d.Vc+12>>>0]==0&&(Ia(d,!0),br--),Ea(d,!1),wr.push(d),ks(o)}var Ut=0,Zf=()=>{oe(0,0);var o=wr.pop();Ss(o.ed),Ut=0};function Ia(o,d){d=d?1:0,(x(),Z)[o.Vc+12>>>0]=d}function Ea(o,d){d=d?1:0,(x(),Z)[o.Vc+13>>>0]=d}class ui{constructor(d){this.ed=d,this.Vc=d-24}}var li=o=>{var d=Ut;if(!d)return Yt(0),0;var m=new ui(d);(x(),U)[m.Vc+16>>>2>>>0]=d;var h=(x(),U)[m.Vc+4>>>2>>>0];if(!h)return Yt(0),d;for(var b of o){if(b===0||b===h)break;if(Ts(b,h,m.Vc+16))return Yt(b),d}return Yt(h),d};function Yf(){return li([])}function Xf(o){return li([o>>>0])}function Jf(o,d,m,h){return li([o>>>0,d>>>0,m>>>0,h>>>0])}var em=()=>{var o=wr.pop();o||Te("no exception to throw");var d=o.ed;throw(x(),Z)[o.Vc+13>>>0]==0&&(wr.push(o),Ea(o,!0),Ia(o,!1),br++),Ti(d),Ut=d};function tm(o,d,m){var h=new ui(o>>>=0);throw d>>>=0,m>>>=0,(x(),U)[h.Vc+16>>>2>>>0]=0,(x(),U)[h.Vc+4>>>2>>>0]=d,(x(),U)[h.Vc+8>>>2>>>0]=m,Ti(o),br++,Ut=o}var rm=()=>br;function za(o,d,m,h){return n?we(2,1,o,d,m,h):Ca(o,d,m,h)}function Ca(o,d,m,h){if(o>>>=0,d>>>=0,m>>>=0,h>>>=0,!globalThis.SharedArrayBuffer)return 6;var b=[];return n&&b.length===0?za(o,d,m,h):(o={Od:m,Tc:o,dd:h,ud:b},n?(o.Uc="spawnThread",postMessage(o,b),0):_r(o))}function im(o){throw Ut||=o>>>0,Ut}var Aa=globalThis.TextDecoder&&new TextDecoder,Oa=(o,d,m,h)=>{if(m=d+m,h)return m;for(;o[d]&&!(d>=m);)++d;return d},Ra=(o,d=0,m,h)=>{if(16<(m=Oa(o,d>>>=0,m,h))-d&&o.buffer&&Aa)return Aa.decode(o.buffer instanceof ArrayBuffer?o.subarray(d,m):o.slice(d,m));for(h="";d<m;){var b=o[d++];if(128&b){var k=63&o[d++];if((224&b)==192)h+=String.fromCharCode((31&b)<<6|k);else{var C=63&o[d++];65536>(b=(240&b)==224?(15&b)<<12|k<<6|C:(7&b)<<18|k<<12|C<<6|63&o[d++])?h+=String.fromCharCode(b):(b-=65536,h+=String.fromCharCode(55296|b>>10,56320|1023&b))}}else h+=String.fromCharCode(b)}return h},Se=(o,d,m)=>(o>>>=0)?Ra((x(),L),o,d,m):"";function Ba(o,d,m){return n?we(3,1,o,d,m):0}function Ma(o,d){if(n)return we(4,1,o,d)}function Na(o,d){if(n)return we(5,1,o,d)}function Da(o,d,m){if(n)return we(6,1,o,d,m)}function Pa(o,d,m){return n?we(7,1,o,d,m):0}function Ua(o,d){if(n)return we(8,1,o,d)}function qa(o,d,m){if(n)return we(9,1,o,d,m)}function Wa(o,d,m,h){if(n)return we(10,1,o,d,m,h)}function La(o,d,m,h){if(n)return we(11,1,o,d,m,h)}function Va(o,d,m,h){if(n)return we(12,1,o,d,m,h)}function Ga(o){if(n)return we(13,1,o)}function Ha(o,d){if(n)return we(14,1,o,d)}function Fa(o,d,m){if(n)return we(15,1,o,d,m)}var nm=()=>Te(""),Ye=o=>{o>>>=0;for(var d="";;){var m=(x(),L)[o++>>>0];if(!m)return d;d+=String.fromCharCode(m)}},di={},pi={},am={},qt=class extends Error{constructor(o){super(o),this.name="BindingError"}};function it(o,d,m={}){return(function(h,b,k={}){var C=b.name;if(!h)throw new qt(`type "${C}" must have a positive integer typeid pointer`);if(pi.hasOwnProperty(h)){if(k.Bd)return;throw new qt(`Cannot register type '${C}' twice`)}pi[h]=b,delete am[h],di.hasOwnProperty(h)&&(b=di[h],delete di[h],b.forEach(B=>B()))})(o,d,m)}var ja=(o,d,m)=>{switch(d){case 1:return m?h=>(x(),Z)[h>>>0]:h=>(x(),L)[h>>>0];case 2:return m?h=>(x(),K)[h>>>1>>>0]:h=>(x(),se)[h>>>1>>>0];case 4:return m?h=>(x(),A)[h>>>2>>>0]:h=>(x(),U)[h>>>2>>>0];case 8:return m?h=>(x(),F)[h>>>3>>>0]:h=>(x(),le)[h>>>3>>>0];default:throw new TypeError(`invalid integer width (${d}): ${o}`)}};function sm(o,d,m,h,b){o>>>=0,m>>>=0,d=Ye(d>>>0);let k=C=>C;if(h=h===0n){let C=8*m;k=B=>BigInt.asUintN(C,B),b=k(b)}it(o,{name:d,Qc:k,Xc:(C,B)=>(typeof B=="number"&&(B=BigInt(B)),B),Wc:ja(d,m,!h),Yc:null})}function om(o,d,m,h){it(o>>>=0,{name:d=Ye(d>>>0),Qc:function(b){return!!b},Xc:function(b,k){return k?m:h},Wc:function(b){return this.Qc((x(),L)[b>>>0])},Yc:null})}var Ka=[],$t=[0,1,,1,null,1,!0,1,!1,1];function ci(o){9<(o>>>=0)&&--$t[o+1]==0&&($t[o]=void 0,Ka.push(o))}var Pe=o=>{if(!o)throw new qt(`Cannot use deleted val. handle = ${o}`);return $t[o]},Le=o=>{switch(o){case void 0:return 2;case null:return 4;case!0:return 6;case!1:return 8;default:let d=Ka.pop()||$t.length;return $t[d]=o,$t[d+1]=1,d}};function hi(o){return this.Qc((x(),U)[o>>>2>>>0])}var um={name:"emscripten::val",Qc:o=>{var d=Pe(o);return ci(o),d},Xc:(o,d)=>Le(d),Wc:hi,Yc:null};function lm(o){return it(o>>>0,um)}var dm=(o,d)=>{switch(d){case 4:return function(m){return this.Qc((x(),ee)[m>>>2>>>0])};case 8:return function(m){return this.Qc((x(),Y)[m>>>3>>>0])};default:throw new TypeError(`invalid float width (${d}): ${o}`)}};function pm(o,d,m){m>>>=0,it(o>>>=0,{name:d=Ye(d>>>0),Qc:h=>h,Xc:(h,b)=>b,Wc:dm(d,m),Yc:null})}function cm(o,d,m,h,b){o>>>=0,m>>>=0,d=Ye(d>>>0);let k=B=>B;if(h===0){var C=32-8*m;k=B=>B<<C>>>C,b=k(b)}it(o,{name:d,Qc:k,Xc:(B,q)=>q,Wc:ja(d,m,h!==0),Yc:null})}function hm(o,d,m){function h(k){var C=(x(),U)[k>>>2>>>0];return k=(x(),U)[k+4>>>2>>>0],new b((x(),Z).buffer,k,C)}var b=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array][d];it(o>>>=0,{name:m=Ye(m>>>0),Qc:h,Wc:h},{Bd:!0})}var pt=(o,d,m)=>{var h=(x(),L);if(d>>>=0,0<m){var b=d;m=d+m-1;for(var k=0;k<o.length;++k){var C=o.codePointAt(k);if(127>=C){if(d>=m)break;h[d++>>>0]=C}else if(2047>=C){if(d+1>=m)break;h[d++>>>0]=192|C>>6,h[d++>>>0]=128|63&C}else if(65535>=C){if(d+2>=m)break;h[d++>>>0]=224|C>>12,h[d++>>>0]=128|C>>6&63,h[d++>>>0]=128|63&C}else{if(d+3>=m)break;h[d++>>>0]=240|C>>18,h[d++>>>0]=128|C>>12&63,h[d++>>>0]=128|C>>6&63,h[d++>>>0]=128|63&C,k++}}h[d>>>0]=0,o=d-b}else o=0;return o},$r=o=>{for(var d=0,m=0;m<o.length;++m){var h=o.charCodeAt(m);127>=h?d++:2047>=h?d+=2:55296<=h&&57343>=h?(d+=4,++m):d+=3}return d};function fm(o,d){it(o>>>=0,{name:d=Ye(d>>>0),Qc(m){var h=(x(),U)[m>>>2>>>0];return h=Se(m+4,h,!0),Je(m),h},Xc(m,h){h instanceof ArrayBuffer&&(h=new Uint8Array(h));var b=typeof h=="string";if(!(b||ArrayBuffer.isView(h)&&h.BYTES_PER_ELEMENT==1))throw new qt("Cannot pass non-string to std::string");var k=b?$r(h):h.length,C=Zt(4+k+1),B=C+4;return(x(),U)[C>>>2>>>0]=k,b?pt(h,B,k+1):(x(),L).set(h,B>>>0),m!==null&&m.push(Je,C),C},Wc:hi,Yc(m){Je(m)}})}var Qa=globalThis.TextDecoder?new TextDecoder("utf-16le"):void 0,mm=(o,d,m)=>{if(o>>>=1,16<(d=Oa((x(),se),o,d/2,m))-o&&Qa)return Qa.decode((x(),se).slice(o,d));for(m="";o<d;++o){var h=(x(),se)[o>>>0];m+=String.fromCharCode(h)}return m},gm=(o,d,m)=>{if(m??=2147483647,2>m)return 0;var h=d;m=(m-=2)<2*o.length?m/2:o.length;for(var b=0;b<m;++b){var k=o.charCodeAt(b);(x(),K)[d>>>1>>>0]=k,d+=2}return(x(),K)[d>>>1>>>0]=0,d-h},ym=o=>2*o.length,_m=(o,d,m)=>{var h="";o>>>=2;for(var b=0;!(b>=d/4);b++){var k=(x(),U)[o+b>>>0];if(!k&&!m)break;h+=String.fromCodePoint(k)}return h},wm=(o,d,m)=>{if(d>>>=0,m??=2147483647,4>m)return 0;var h=d;m=h+m-4;for(var b=0;b<o.length;++b){var k=o.codePointAt(b);if(65535<k&&b++,(x(),A)[d>>>2>>>0]=k,(d+=4)+4>m)break}return(x(),A)[d>>>2>>>0]=0,d-h},bm=o=>{for(var d=0,m=0;m<o.length;++m)65535<o.codePointAt(m)&&m++,d+=4;return d};function $m(o,d,m){if(o>>>=0,d>>>=0,m=Ye(m>>>=0),d===2)var h=mm,b=gm,k=ym;else h=_m,b=wm,k=bm;it(o,{name:m,Qc:C=>{var B=(x(),U)[C>>>2>>>0];return B=h(C+4,B*d,!0),Je(C),B},Xc:(C,B)=>{if(typeof B!="string")throw new qt(`Cannot pass non-string to C++ string type ${m}`);var q=k(B),G=Zt(4+q+d);return(x(),U)[G>>>2>>>0]=q/d,b(B,G+4,q+d),C!==null&&C.push(Je,G),G},Wc:hi,Yc(C){Je(C)}})}function vm(o,d){it(o>>>=0,{Cd:!0,name:d=Ye(d>>>0),Qc:()=>{},Xc:()=>{}})}function xm(o){vi(o>>>0,!i,1,!r,131072,!1),Sa()}var vr=o=>{if(!z)try{if(o(),!(0<ut))try{n?zr()&&xi(y):oi(y)}catch(d){d instanceof rt||d=="unwind"||p(0,d)}}catch(d){d instanceof rt||d=="unwind"||p(0,d)}},Sm=!Atomics.waitAsync||globalThis.navigator?.userAgent&&91>Number((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)||[])[2]);function fi(o){o>>>=0,Sm||(Atomics.waitAsync((x(),A),o>>>2,o).value.then(xr),o+=128,Atomics.store((x(),A),o>>>2,1))}var xr=()=>vr(()=>{var o=zr();o&&(fi(o),vs())});function Tm(o,d){(o>>>=0)==d>>>0?setTimeout(xr):n?postMessage({ad:o,Uc:"checkMailbox"}):(o=bt[o])&&o.postMessage({Uc:"checkMailbox"})}var mi=[];function km(o,d,m,h,b){for(d>>>=0,b>>>=0,mi.length=0,m=b>>>3,h=b+h>>>3;m<h;){var k;k=(x(),F)[m++>>>0]?(x(),F)[m++>>>0]:(x(),Y)[m++>>>0],mi.push(k)}return(d?Ii[d]:yg[o])(...mi)}var Im=()=>{ut=0};function Em(o){o>>>=0,n?postMessage({Uc:"cleanupThread",Qd:o}):xa(bt[o])}function zm(o){}var Sr=o=>{try{o()}catch(d){Te(d)}};function Cm(o){var d=(...m)=>{Tr.push(o);try{return o(...m)}finally{z||(Tr.pop(),Xe&&ct===1&&Tr.length===0&&(ct=0,ut+=1,Sr(co),typeof Fibers<"u"&&Fibers.ce()))}};return Xa.set(o,d),d}var ct=0,Xe=null,Za=0,Tr=[],gi=new Map,Ya=new Map,Xa=new Map,Am=0,yi=null,Om=[],Ja=o=>(function(d){if(!z){if(ct===0){var m=!1,h=!1;d((b=0)=>{if(!z&&(Za=b,m=!0,h)){ct=2,Sr(()=>ho(Xe)),typeof MainLoop<"u"&&MainLoop.yd&&MainLoop.resume(),b=!1;try{var k=(function(){var q=(x(),A)[Xe+8>>>2>>>0];return q=Ya.get(q),q=Xa.get(q),--ut,q()})()}catch(q){k=q,b=!0}var C=!1;if(!Xe){var B=yi;B&&(yi=null,(b?B.reject:B.resolve)(k),C=!0)}if(b&&!C)throw k}}),h=!0,m||(ct=1,Xe=(function(){var b=Zt(65548),k=b+12;if((x(),U)[b>>>2>>>0]=k,(x(),U)[b+4>>>2>>>0]=k+65536,k=Tr[0],!gi.has(k)){var C=Am++;gi.set(k,C),Ya.set(C,k)}return k=gi.get(k),(x(),A)[b+8>>>2>>>0]=k,b})(),typeof MainLoop<"u"&&MainLoop.yd&&MainLoop.pause(),Sr(()=>po(Xe)))}else ct===2?(ct=0,Sr(fo),Je(Xe),Xe=null,Om.forEach(vr)):Te(`invalid state: ${ct}`);return Za}})(d=>{o().then(d)});function Rm(o){return o>>>=0,Ja(async()=>{var d=await Pe(o);return Le(d)})}var _i=[],Bm=o=>{var d=_i.length;return _i.push(o),d},Mm=(o,d)=>{for(var m=Array(o),h=0;h<o;++h){var b=h,k=(x(),U)[d+4*h>>>2>>>0],C=pi[k];if(C===void 0)throw o=`parameter ${h}`,k=gs(k),d=Ye(k),Je(k),new qt(`${o} has unknown type ${d}`);m[b]=C}return m},Nm=(o,d,m)=>{var h=[];return o=o(h,m),h.length&&((x(),U)[d>>>2>>>0]=Le(h)),o},Dm={},kr=o=>{var d=Dm[o];return d===void 0?Ye(o):d};function Pm(o,d,m){var[h,...b]=Mm(o,d>>>0);d=h.Xc.bind(h);var k=b.map(q=>q.Wc.bind(q));o--;var C={toValue:Pe};switch(o=k.map((q,G)=>{var ie=`argFromPtr${G}`;return C[ie]=q,`${ie}(args${G?"+"+8*G:""})`}),m){case 0:var B="toValue(handle)";break;case 2:B="new (toValue(handle))";break;case 3:B="";break;case 1:C.getStringOrSymbol=kr,B="toValue(handle)[getStringOrSymbol(methodName)]"}return B+=`(${o})`,h.Cd||(C.toReturnWire=d,C.emval_returnValue=Nm,B=`return emval_returnValue(toReturnWire, destructorsRef, ${B})`),B=`return function (handle, methodName, destructorsRef, args) {
  ${B}
  }`,m=new Function(Object.keys(C),B)(...Object.values(C)),B=`methodCaller<(${b.map(q=>q.name)}) => ${h.name}>`,Bm(Object.defineProperty(m,"name",{value:B}))}function Um(o,d){return d>>>=0,(o=Pe(o>>>0))==Pe(d)}function qm(o){return(o>>>=0)?(o=kr(o),Le(globalThis[o])):Le(globalThis)}function Wm(o){return o=kr(o>>>0),Le(t[o])}function Lm(o,d){return d>>>=0,o=Pe(o>>>0),d=Pe(d),Le(o[d])}function Vm(o){9<(o>>>=0)&&($t[o+1]+=1)}function es(o,d,m,h,b){return _i[o>>>0](d>>>0,m>>>0,h>>>0,b>>>0)}function Gm(o,d,m,h,b){return es(o>>>0,d>>>0,m>>>0,h>>>0,b>>>0)}function Hm(){return Le([])}function Fm(o){o=Pe(o>>>0);for(var d=Array(o.length),m=0;m<o.length;m++)d[m]=o[m];return Le(d)}function jm(o){return Le(kr(o>>>0))}function Km(){return Le({})}function Qm(o){for(var d=Pe(o>>>=0);d.length;){var m=d.pop();d.pop()(m)}ci(o)}function Zm(o,d,m){d>>>=0,m>>>=0,o=Pe(o>>>0),d=Pe(d),m=Pe(m),o[d]=m}function Ym(o,d){o=-9007199254740992>o||9007199254740992<o?NaN:Number(o),d>>>=0,o=new Date(1e3*o),(x(),A)[d>>>2>>>0]=o.getUTCSeconds(),(x(),A)[d+4>>>2>>>0]=o.getUTCMinutes(),(x(),A)[d+8>>>2>>>0]=o.getUTCHours(),(x(),A)[d+12>>>2>>>0]=o.getUTCDate(),(x(),A)[d+16>>>2>>>0]=o.getUTCMonth(),(x(),A)[d+20>>>2>>>0]=o.getUTCFullYear()-1900,(x(),A)[d+24>>>2>>>0]=o.getUTCDay(),o=(o.getTime()-Date.UTC(o.getUTCFullYear(),0,1,0,0,0,0))/864e5|0,(x(),A)[d+28>>>2>>>0]=o}var ts=o=>o%4==0&&(o%100!=0||o%400==0),rs=[0,31,60,91,121,152,182,213,244,274,305,335],is=[0,31,59,90,120,151,181,212,243,273,304,334];function Xm(o,d){o=-9007199254740992>o||9007199254740992<o?NaN:Number(o),d>>>=0,o=new Date(1e3*o),(x(),A)[d>>>2>>>0]=o.getSeconds(),(x(),A)[d+4>>>2>>>0]=o.getMinutes(),(x(),A)[d+8>>>2>>>0]=o.getHours(),(x(),A)[d+12>>>2>>>0]=o.getDate(),(x(),A)[d+16>>>2>>>0]=o.getMonth(),(x(),A)[d+20>>>2>>>0]=o.getFullYear()-1900,(x(),A)[d+24>>>2>>>0]=o.getDay();var m=(ts(o.getFullYear())?rs:is)[o.getMonth()]+o.getDate()-1|0;(x(),A)[d+28>>>2>>>0]=m,(x(),A)[d+36>>>2>>>0]=-60*o.getTimezoneOffset(),m=new Date(o.getFullYear(),6,1).getTimezoneOffset();var h=new Date(o.getFullYear(),0,1).getTimezoneOffset();o=0|(m!=h&&o.getTimezoneOffset()==Math.min(h,m)),(x(),A)[d+32>>>2>>>0]=o}function Jm(o){o>>>=0;var d=new Date((x(),A)[o+20>>>2>>>0]+1900,(x(),A)[o+16>>>2>>>0],(x(),A)[o+12>>>2>>>0],(x(),A)[o+8>>>2>>>0],(x(),A)[o+4>>>2>>>0],(x(),A)[o>>>2>>>0],0),m=(x(),A)[o+32>>>2>>>0],h=d.getTimezoneOffset(),b=new Date(d.getFullYear(),6,1).getTimezoneOffset(),k=new Date(d.getFullYear(),0,1).getTimezoneOffset(),C=Math.min(k,b);return 0>m?(x(),A)[o+32>>>2>>>0]=+(b!=k&&C==h):0<m!=(C==h)&&(b=Math.max(k,b),d.setTime(d.getTime()+6e4*((0<m?C:b)-h))),(x(),A)[o+24>>>2>>>0]=d.getDay(),m=(ts(d.getFullYear())?rs:is)[d.getMonth()]+d.getDate()-1|0,(x(),A)[o+28>>>2>>>0]=m,(x(),A)[o>>>2>>>0]=d.getSeconds(),(x(),A)[o+4>>>2>>>0]=d.getMinutes(),(x(),A)[o+8>>>2>>>0]=d.getHours(),(x(),A)[o+12>>>2>>>0]=d.getDate(),(x(),A)[o+16>>>2>>>0]=d.getMonth(),(x(),A)[o+20>>>2>>>0]=d.getYear(),o=d.getTime(),BigInt(isNaN(o)?-1:o/1e3)}function ns(o,d,m,h,b,k,C){return n?we(16,1,o,d,m,h,b,k,C):-52}function as(o,d,m,h,b,k){if(n)return we(17,1,o,d,m,h,b,k)}var Qt={},eg=()=>performance.timeOrigin+performance.now();function ss(o,d){if(n)return we(18,1,o,d);if(Qt[o]&&(clearTimeout(Qt[o].id),delete Qt[o]),!d)return 0;var m=setTimeout(()=>{delete Qt[o],vr(()=>$s(o,performance.timeOrigin+performance.now()))},d);return Qt[o]={id:m,be:d},0}function tg(o,d,m,h){o>>>=0,d>>>=0,m>>>=0,h>>>=0;var b=new Date().getFullYear(),k=new Date(b,0,1).getTimezoneOffset();b=new Date(b,6,1).getTimezoneOffset();var C=Math.max(k,b);(x(),U)[o>>>2>>>0]=60*C,(x(),A)[d>>>2>>>0]=+(k!=b),o=(d=B=>{var q=Math.abs(B);return`UTC${0<=B?"-":"+"}${String(Math.floor(q/60)).padStart(2,"0")}${String(q%60).padStart(2,"0")}`})(k),d=d(b),b<k?(pt(o,m,17),pt(d,h,17)):(pt(o,h,17),pt(d,m,17))}var rg=()=>Date.now(),ig=1;function ng(o,d,m){if(m>>>=0,!(0<=o&&3>=o))return 28;if(o===0)o=Date.now();else{if(!ig)return 52;o=performance.timeOrigin+performance.now()}return o=Math.round(1e6*o),(x(),F)[m>>>3>>>0]=BigInt(o),0}var wi=[],os=(o,d)=>{wi.length=0;for(var m;m=(x(),L)[o++>>>0];){var h=m!=105;d+=(h&=m!=112)&&d%8?4:0,wi.push(m==112?(x(),U)[d>>>2>>>0]:m==106?(x(),F)[d>>>3>>>0]:m==105?(x(),A)[d>>>2>>>0]:(x(),Y)[d>>>3>>>0]),d+=h?8:4}return wi};function ag(o,d,m){return o>>>=0,d=os(d>>>0,m>>>0),Ii[o](...d)}function sg(o,d,m){return o>>>=0,d=os(d>>>0,m>>>0),Ii[o](...d)}var og=()=>{};function ug(o,d){return E(Se(o>>>0,d>>>0))}var lg=()=>{throw ut+=1,"unwind"};function dg(){return 4294901760}var pg=()=>navigator.hardwareConcurrency,vt={},Ir=o=>{var d;return(d=/\bwasm-function\[\d+\]:(0x[0-9a-f]+)/.exec(o))?+d[1]:(d=/:(\d+):\d+(?:\)|$)/.exec(o))?2147483648|+d[1]:0},us=o=>{for(var d of o)(o=Ir(d))&&(vt[o]=d)};function cg(){var o=Error().stack.toString().split(`
`);return o[0]=="Error"&&o.shift(),us(o),vt.sd=Ir(o[3]),vt.Md=o,vt.sd}function Er(o){if(!(o=vt[o>>>0]))return 0;var d;if(d=/^\s+at .*\.wasm\.(.*) \(.*\)$/.exec(o))o=d[1];else if(d=/^\s+at (.*) \(.*\)$/.exec(o))o=d[1];else{if(!(d=/^(.+?)@/.exec(o)))return 0;o=d[1]}Je(Er.td??0),d=$r(o)+1;var m=Zt(d);return m&&pt(o,m,d),Er.td=m,Er.td}function hg(o){o>>>=0;var d=(x(),L).length;if(o<=d||4294901760<o)return!1;for(var m=1;4>=m;m*=2){var h=d*(1+.2/m);h=Math.min(h,o+100663296);e:{h=(Math.min(4294901760,65536*Math.ceil(Math.max(o,h)/65536))-dt.buffer.byteLength+65535)/65536|0;try{dt.grow(h),J();var b=1;break e}catch{}b=void 0}if(b)return!0}return!1}function fg(o,d,m){if(o>>>=0,d>>>=0,vt.sd==o)var h=vt.Md;else(h=Error().stack.toString().split(`
`))[0]=="Error"&&h.shift(),us(h);for(var b=3;h[b]&&Ir(h[b])!=o;)++b;for(o=0;o<m&&h[o+b];++o)(x(),A)[d+4*o>>>2>>>0]=Ir(h[o+b]);return o}var bi,$i={},ls=()=>{if(!bi){var o,d={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(globalThis.navigator?.language??"C").replace("-","_")+".UTF-8",_:"./this.program"};for(o in $i)$i[o]===void 0?delete d[o]:d[o]=$i[o];var m=[];for(o in d)m.push(`${o}=${d[o]}`);bi=m}return bi};function ds(o,d){if(n)return we(19,1,o,d);o>>>=0,d>>>=0;var m,h=0,b=0;for(m of ls()){var k=d+h;(x(),U)[o+b>>>2>>>0]=k,h+=pt(m,k,1/0)+1,b+=4}return 0}function ps(o,d){if(n)return we(20,1,o,d);o>>>=0,d>>>=0;var m=ls();for(var h of((x(),U)[o>>>2>>>0]=m.length,o=0,m))o+=$r(h)+1;return(x(),U)[d>>>2>>>0]=o,0}function cs(o){return n?we(21,1,o):52}function hs(o,d,m,h){return n?we(22,1,o,d,m,h):52}function fs(o,d,m,h){return n?we(23,1,o,d,m,h):70}var mg=[null,[],[]];function ms(o,d,m,h){if(n)return we(24,1,o,d,m,h);d>>>=0,m>>>=0,h>>>=0;for(var b=0,k=0;k<m;k++){var C=(x(),U)[d>>>2>>>0],B=(x(),U)[d+4>>>2>>>0];d+=8;for(var q=0;q<B;q++){var G=o,ie=(x(),L)[C+q>>>0],pe=mg[G];ie===0||ie===10?((G===1?T:E)(Ra(pe)),pe.length=0):pe.push(ie)}b+=B}return(x(),U)[h>>>2>>>0]=b,0}function gg(o){return o>>>0}n||(function(){for(var o=t.numThreads-1;o--;)ka();be.push(async()=>{var d=(async function(){if(!n)return Promise.all(lt.map(Ta))})();Ae++,await d,--Ae==0&&wt&&(d=wt,wt=null,d())})})(),n||(dt=new WebAssembly.Memory({initial:256,maximum:65536,shared:!0}),J()),t.wasmBinary&&(g=t.wasmBinary),t.stackSave=()=>ae(),t.stackRestore=o=>ne(o),t.stackAlloc=o=>Si(o),t.setValue=function(o,d,m="i8"){switch(m.endsWith("*")&&(m="*"),m){case"i1":case"i8":(x(),Z)[o>>>0]=d;break;case"i16":(x(),K)[o>>>1>>>0]=d;break;case"i32":(x(),A)[o>>>2>>>0]=d;break;case"i64":(x(),F)[o>>>3>>>0]=BigInt(d);break;case"float":(x(),ee)[o>>>2>>>0]=d;break;case"double":(x(),Y)[o>>>3>>>0]=d;break;case"*":(x(),U)[o>>>2>>>0]=d;break;default:Te(`invalid type for setValue: ${m}`)}},t.getValue=function(o,d="i8"){switch(d.endsWith("*")&&(d="*"),d){case"i1":case"i8":return(x(),Z)[o>>>0];case"i16":return(x(),K)[o>>>1>>>0];case"i32":return(x(),A)[o>>>2>>>0];case"i64":return(x(),F)[o>>>3>>>0];case"float":return(x(),ee)[o>>>2>>>0];case"double":return(x(),Y)[o>>>3>>>0];case"*":return(x(),U)[o>>>2>>>0];default:Te(`invalid type for getValue: ${d}`)}},t.UTF8ToString=Se,t.stringToUTF8=pt,t.lengthBytesUTF8=$r;var gs,ys,zr,Je,Zt,vi,_s,ws,bs,xi,$s,vs,oe,Yt,xs,ne,Si,ae,Ss,Ti,Ts,ks,Is,ki,Es,zs,Cs,As,Os,Rs,Bs,Ms,Ns,Ds,Ps,Us,qs,Ws,Ls,Vs,Gs,Hs,Fs,js,Ks,Qs,Zs,Ys,Xs,Js,eo,to,ro,io,no,ao,so,oo,uo,lo,po,co,ho,fo,nt,yg=[si,$a,za,Ba,Ma,Na,Da,Pa,Ua,qa,Wa,La,Va,Ga,Ha,Fa,ns,as,ss,ds,ps,cs,hs,fs,ms],Ii={927820:(o,d,m,h,b)=>{if(t===void 0||!t.Zc)return 1;if((o=Se(Number(o>>>0))).startsWith("./")&&(o=o.substring(2)),!(o=t.Zc.get(o)))return 2;if(d=Number(d>>>0),m=Number(m>>>0),h=Number(h>>>0),d+m>o.byteLength)return 3;try{let k=o.subarray(d,d+m);switch(b){case 0:(x(),L).set(k,h>>>0);break;case 1:t.Xd?t.Xd(h,k):t.Ld(h,k);break;default:return 4}return 0}catch{return 4}},928644:(o,d,m)=>{t.xd(o,(x(),L).subarray(d>>>0,d+m>>>0))},928708:()=>t.Zd(),928750:o=>{t.vd(o)},928787:()=>{t.Ed()},928818:()=>{t.Fd()},928847:()=>{t.Jd()},928872:o=>t.Dd(o),928905:o=>t.Hd(o),928937:(o,d,m)=>{t.jd(Number(o),Number(d),Number(m),!0)},929e3:(o,d,m)=>{t.jd(Number(o),Number(d),Number(m))},929057:()=>typeof wasmOffsetConverter<"u",929114:o=>{t.ac("Abs",o,void 0)},929165:o=>{t.ac("Neg",o,void 0)},929216:o=>{t.ac("Floor",o,void 0)},929269:o=>{t.ac("Ceil",o,void 0)},929321:o=>{t.ac("Reciprocal",o,void 0)},929379:o=>{t.ac("Sqrt",o,void 0)},929431:o=>{t.ac("Exp",o,void 0)},929482:o=>{t.ac("Erf",o,void 0)},929533:o=>{t.ac("Sigmoid",o,void 0)},929588:(o,d,m)=>{t.ac("HardSigmoid",o,{alpha:d,beta:m})},929667:o=>{t.ac("Log",o,void 0)},929718:o=>{t.ac("Sin",o,void 0)},929769:o=>{t.ac("Cos",o,void 0)},929820:o=>{t.ac("Tan",o,void 0)},929871:o=>{t.ac("Asin",o,void 0)},929923:o=>{t.ac("Acos",o,void 0)},929975:o=>{t.ac("Atan",o,void 0)},930027:o=>{t.ac("Sinh",o,void 0)},930079:o=>{t.ac("Cosh",o,void 0)},930131:o=>{t.ac("Asinh",o,void 0)},930184:o=>{t.ac("Acosh",o,void 0)},930237:o=>{t.ac("Atanh",o,void 0)},930290:o=>{t.ac("Tanh",o,void 0)},930342:o=>{t.ac("Not",o,void 0)},930393:(o,d,m)=>{t.ac("Clip",o,{min:d,max:m})},930462:o=>{t.ac("Clip",o,void 0)},930514:(o,d)=>{t.ac("Elu",o,{alpha:d})},930572:o=>{t.ac("Gelu",o,void 0)},930624:o=>{t.ac("Relu",o,void 0)},930676:(o,d)=>{t.ac("LeakyRelu",o,{alpha:d})},930740:(o,d)=>{t.ac("ThresholdedRelu",o,{alpha:d})},930810:(o,d)=>{t.ac("Cast",o,{to:d})},930868:o=>{t.ac("Add",o,void 0)},930919:o=>{t.ac("Sub",o,void 0)},930970:o=>{t.ac("Mul",o,void 0)},931021:o=>{t.ac("Div",o,void 0)},931072:o=>{t.ac("Pow",o,void 0)},931123:o=>{t.ac("Equal",o,void 0)},931176:o=>{t.ac("Greater",o,void 0)},931231:o=>{t.ac("GreaterOrEqual",o,void 0)},931293:o=>{t.ac("Less",o,void 0)},931345:o=>{t.ac("LessOrEqual",o,void 0)},931404:(o,d,m,h,b)=>{t.ac("ReduceMean",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((x(),A).subarray(Number(h)>>>0,Number(b)>>>0)):[]})},931579:(o,d,m,h,b)=>{t.ac("ReduceMax",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((x(),A).subarray(Number(h)>>>0,Number(b)>>>0)):[]})},931753:(o,d,m,h,b)=>{t.ac("ReduceMin",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((x(),A).subarray(Number(h)>>>0,Number(b)>>>0)):[]})},931927:(o,d,m,h,b)=>{t.ac("ReduceProd",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((x(),A).subarray(Number(h)>>>0,Number(b)>>>0)):[]})},932102:(o,d,m,h,b)=>{t.ac("ReduceSum",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((x(),A).subarray(Number(h)>>>0,Number(b)>>>0)):[]})},932276:(o,d,m,h,b)=>{t.ac("ReduceL1",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((x(),A).subarray(Number(h)>>>0,Number(b)>>>0)):[]})},932449:(o,d,m,h,b)=>{t.ac("ReduceL2",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((x(),A).subarray(Number(h)>>>0,Number(b)>>>0)):[]})},932622:(o,d,m,h,b)=>{t.ac("ReduceLogSum",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((x(),A).subarray(Number(h)>>>0,Number(b)>>>0)):[]})},932799:(o,d,m,h,b)=>{t.ac("ReduceSumSquare",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((x(),A).subarray(Number(h)>>>0,Number(b)>>>0)):[]})},932979:(o,d,m,h,b)=>{t.ac("ReduceLogSumExp",o,{keepDims:!!d,noopWithEmptyAxes:!!m,axes:h?Array.from((x(),A).subarray(Number(h)>>>0,Number(b)>>>0)):[]})},933159:o=>{t.ac("Where",o,void 0)},933212:(o,d,m)=>{t.ac("Transpose",o,{perm:d?Array.from((x(),A).subarray(Number(d)>>>0,Number(m)>>>0)):[]})},933336:(o,d,m,h)=>{t.ac("DepthToSpace",o,{blocksize:d,mode:Se(m),format:h?"NHWC":"NCHW"})},933469:(o,d,m,h)=>{t.ac("DepthToSpace",o,{blocksize:d,mode:Se(m),format:h?"NHWC":"NCHW"})},933602:(o,d,m,h,b,k,C,B,q,G,ie,pe,ge,_e,ht)=>{t.ac("ConvTranspose",o,{format:q?"NHWC":"NCHW",autoPad:d,dilations:[m],group:h,kernelShape:[b],pads:[k,C],strides:[B],wIsConst:()=>!!(x(),Z)[G>>>0],outputPadding:ie?Array.from((x(),A).subarray(Number(ie)>>>0,Number(pe)>>>0)):[],outputShape:ge?Array.from((x(),A).subarray(Number(ge)>>>0,Number(_e)>>>0)):[],activation:Se(ht)})},934035:(o,d,m,h,b,k,C,B,q,G,ie,pe,ge,_e)=>{t.ac("ConvTranspose",o,{format:B?"NHWC":"NCHW",autoPad:d,dilations:Array.from((x(),A).subarray(Number(m)>>>0,2+(Number(m)>>>0)>>>0)),group:h,kernelShape:Array.from((x(),A).subarray(Number(b)>>>0,2+(Number(b)>>>0)>>>0)),pads:Array.from((x(),A).subarray(Number(k)>>>0,4+(Number(k)>>>0)>>>0)),strides:Array.from((x(),A).subarray(Number(C)>>>0,2+(Number(C)>>>0)>>>0)),wIsConst:()=>!!(x(),Z)[q>>>0],outputPadding:G?Array.from((x(),A).subarray(Number(G)>>>0,Number(ie)>>>0)):[],outputShape:pe?Array.from((x(),A).subarray(Number(pe)>>>0,Number(ge)>>>0)):[],activation:Se(_e)})},934696:(o,d,m,h,b,k,C,B,q,G,ie,pe,ge,_e,ht)=>{t.ac("ConvTranspose",o,{format:q?"NHWC":"NCHW",autoPad:d,dilations:[m],group:h,kernelShape:[b],pads:[k,C],strides:[B],wIsConst:()=>!!(x(),Z)[G>>>0],outputPadding:ie?Array.from((x(),A).subarray(Number(ie)>>>0,Number(pe)>>>0)):[],outputShape:ge?Array.from((x(),A).subarray(Number(ge)>>>0,Number(_e)>>>0)):[],activation:Se(ht)})},935129:(o,d,m,h,b,k,C,B,q,G,ie,pe,ge,_e)=>{t.ac("ConvTranspose",o,{format:B?"NHWC":"NCHW",autoPad:d,dilations:Array.from((x(),A).subarray(Number(m)>>>0,2+(Number(m)>>>0)>>>0)),group:h,kernelShape:Array.from((x(),A).subarray(Number(b)>>>0,2+(Number(b)>>>0)>>>0)),pads:Array.from((x(),A).subarray(Number(k)>>>0,4+(Number(k)>>>0)>>>0)),strides:Array.from((x(),A).subarray(Number(C)>>>0,2+(Number(C)>>>0)>>>0)),wIsConst:()=>!!(x(),Z)[q>>>0],outputPadding:G?Array.from((x(),A).subarray(Number(G)>>>0,Number(ie)>>>0)):[],outputShape:pe?Array.from((x(),A).subarray(Number(pe)>>>0,Number(ge)>>>0)):[],activation:Se(_e)})},935790:(o,d)=>{t.ac("GlobalAveragePool",o,{format:d?"NHWC":"NCHW"})},935881:(o,d,m,h,b,k,C,B,q,G,ie,pe,ge,_e)=>{t.ac("AveragePool",o,{format:_e?"NHWC":"NCHW",auto_pad:d,ceil_mode:m,count_include_pad:h,storage_order:b,dilations:k?Array.from((x(),A).subarray(Number(k)>>>0,Number(C)>>>0)):[],kernel_shape:B?Array.from((x(),A).subarray(Number(B)>>>0,Number(q)>>>0)):[],pads:G?Array.from((x(),A).subarray(Number(G)>>>0,Number(ie)>>>0)):[],strides:pe?Array.from((x(),A).subarray(Number(pe)>>>0,Number(ge)>>>0)):[]})},936360:(o,d)=>{t.ac("GlobalAveragePool",o,{format:d?"NHWC":"NCHW"})},936451:(o,d,m,h,b,k,C,B,q,G,ie,pe,ge,_e)=>{t.ac("AveragePool",o,{format:_e?"NHWC":"NCHW",auto_pad:d,ceil_mode:m,count_include_pad:h,storage_order:b,dilations:k?Array.from((x(),A).subarray(Number(k)>>>0,Number(C)>>>0)):[],kernel_shape:B?Array.from((x(),A).subarray(Number(B)>>>0,Number(q)>>>0)):[],pads:G?Array.from((x(),A).subarray(Number(G)>>>0,Number(ie)>>>0)):[],strides:pe?Array.from((x(),A).subarray(Number(pe)>>>0,Number(ge)>>>0)):[]})},936930:(o,d)=>{t.ac("GlobalMaxPool",o,{format:d?"NHWC":"NCHW"})},937017:(o,d,m,h,b,k,C,B,q,G,ie,pe,ge,_e)=>{t.ac("MaxPool",o,{format:_e?"NHWC":"NCHW",auto_pad:d,ceil_mode:m,count_include_pad:h,storage_order:b,dilations:k?Array.from((x(),A).subarray(Number(k)>>>0,Number(C)>>>0)):[],kernel_shape:B?Array.from((x(),A).subarray(Number(B)>>>0,Number(q)>>>0)):[],pads:G?Array.from((x(),A).subarray(Number(G)>>>0,Number(ie)>>>0)):[],strides:pe?Array.from((x(),A).subarray(Number(pe)>>>0,Number(ge)>>>0)):[]})},937492:(o,d)=>{t.ac("GlobalMaxPool",o,{format:d?"NHWC":"NCHW"})},937579:(o,d,m,h,b,k,C,B,q,G,ie,pe,ge,_e)=>{t.ac("MaxPool",o,{format:_e?"NHWC":"NCHW",auto_pad:d,ceil_mode:m,count_include_pad:h,storage_order:b,dilations:k?Array.from((x(),A).subarray(Number(k)>>>0,Number(C)>>>0)):[],kernel_shape:B?Array.from((x(),A).subarray(Number(B)>>>0,Number(q)>>>0)):[],pads:G?Array.from((x(),A).subarray(Number(G)>>>0,Number(ie)>>>0)):[],strides:pe?Array.from((x(),A).subarray(Number(pe)>>>0,Number(ge)>>>0)):[]})},938054:(o,d,m,h,b)=>{t.ac("Gemm",o,{alpha:d,beta:m,transA:h,transB:b})},938158:o=>{t.ac("MatMul",o,void 0)},938212:(o,d,m,h)=>{t.ac("ArgMax",o,{keepDims:!!d,selectLastIndex:!!m,axis:h})},938320:(o,d,m,h)=>{t.ac("ArgMin",o,{keepDims:!!d,selectLastIndex:!!m,axis:h})},938428:(o,d)=>{t.ac("Softmax",o,{axis:d})},938491:(o,d)=>{t.ac("Concat",o,{axis:d})},938551:(o,d,m,h,b)=>{t.ac("Split",o,{axis:d,numOutputs:m,splitSizes:h?Array.from((x(),A).subarray(Number(h)>>>0,Number(b)>>>0)):[]})},938707:o=>{t.ac("Expand",o,void 0)},938761:(o,d)=>{t.ac("Gather",o,{axis:Number(d)})},938832:(o,d)=>{t.ac("GatherElements",o,{axis:Number(d)})},938911:(o,d)=>{t.ac("GatherND",o,{batch_dims:Number(d)})},938990:(o,d,m,h,b,k,C,B,q,G,ie)=>{t.ac("Resize",o,{antialias:d,axes:m?Array.from((x(),A).subarray(Number(m)>>>0,Number(h)>>>0)):[],coordinateTransformMode:Se(b),cubicCoeffA:k,excludeOutside:C,extrapolationValue:B,keepAspectRatioPolicy:Se(q),mode:Se(G),nearestMode:Se(ie)})},939352:(o,d,m,h,b,k,C)=>{t.ac("Slice",o,{starts:d?Array.from((x(),A).subarray(Number(d)>>>0,Number(m)>>>0)):[],ends:h?Array.from((x(),A).subarray(Number(h)>>>0,Number(b)>>>0)):[],axes:k?Array.from((x(),A).subarray(Number(k)>>>0,Number(C)>>>0)):[]})},939616:o=>{t.ac("Tile",o,void 0)},939668:(o,d,m)=>{t.ac("InstanceNormalization",o,{epsilon:d,format:m?"NHWC":"NCHW"})},939782:(o,d,m)=>{t.ac("InstanceNormalization",o,{epsilon:d,format:m?"NHWC":"NCHW"})},939896:o=>{t.ac("Range",o,void 0)},939949:(o,d)=>{t.ac("Einsum",o,{equation:Se(d)})},940030:(o,d,m,h,b)=>{t.ac("Pad",o,{mode:d,value:m,pads:h?Array.from((x(),A).subarray(Number(h)>>>0,Number(b)>>>0)):[]})},940173:(o,d,m,h,b,k)=>{t.ac("BatchNormalization",o,{epsilon:d,momentum:m,spatial:!!b,trainingMode:!!h,format:k?"NHWC":"NCHW"})},940342:(o,d,m,h,b,k)=>{t.ac("BatchNormalization",o,{epsilon:d,momentum:m,spatial:!!b,trainingMode:!!h,format:k?"NHWC":"NCHW"})},940511:(o,d,m)=>{t.ac("CumSum",o,{exclusive:Number(d),reverse:Number(m)})},940608:(o,d,m)=>{t.ac("DequantizeLinear",o,{axis:d,blockSize:m})},940698:(o,d,m,h,b)=>{t.ac("GridSample",o,{align_corners:d,mode:Se(m),padding_mode:Se(h),format:b?"NHWC":"NCHW"})},940868:(o,d,m,h,b)=>{t.ac("GridSample",o,{align_corners:d,mode:Se(m),padding_mode:Se(h),format:b?"NHWC":"NCHW"})},941038:(o,d)=>{t.ac("ScatterND",o,{reduction:Se(d)})},941123:(o,d,m,h,b,k,C,B,q)=>{t.ac("Attention",o,{numHeads:d,isUnidirectional:m,maskFilterValue:h,scale:b,doRotary:k,qkvHiddenSizes:C?Array.from((x(),A).subarray(Number(B)>>>0,Number(B)+C>>>0)):[],pastPresentShareBuffer:!!q})},941395:o=>{t.ac("BiasAdd",o,void 0)},941450:o=>{t.ac("BiasSplitGelu",o,void 0)},941511:o=>{t.ac("FastGelu",o,void 0)},941567:(o,d,m,h,b,k,C,B,q,G,ie,pe,ge,_e,ht,Ei)=>{t.ac("Conv",o,{format:pe?"NHWC":"NCHW",auto_pad:d,dilations:m?Array.from((x(),A).subarray(Number(m)>>>0,Number(h)>>>0)):[],group:b,kernel_shape:k?Array.from((x(),A).subarray(Number(k)>>>0,Number(C)>>>0)):[],pads:B?Array.from((x(),A).subarray(Number(B)>>>0,Number(q)>>>0)):[],strides:G?Array.from((x(),A).subarray(Number(G)>>>0,Number(ie)>>>0)):[],w_is_const:()=>!!(x(),Z)[Number(ge)>>>0],activation:Se(_e),activation_params:ht?Array.from((x(),ee).subarray(Number(ht)>>>0,Number(Ei)>>>0)):[]})},942151:o=>{t.ac("Gelu",o,void 0)},942203:(o,d,m,h,b,k,C,B,q)=>{t.ac("GroupQueryAttention",o,{numHeads:d,kvNumHeads:m,scale:h,softcap:b,doRotary:k,rotaryInterleaved:C,smoothSoftmax:B,localWindowSize:q})},942420:(o,d,m,h)=>{t.ac("LayerNormalization",o,{axis:d,epsilon:m,simplified:!!h})},942531:(o,d,m,h)=>{t.ac("LayerNormalization",o,{axis:d,epsilon:m,simplified:!!h})},942642:(o,d,m,h,b,k)=>{t.ac("MatMulNBits",o,{k:d,n:m,accuracyLevel:h,bits:b,blockSize:k})},942769:(o,d,m,h,b,k)=>{t.ac("MultiHeadAttention",o,{numHeads:d,isUnidirectional:m,maskFilterValue:h,scale:b,doRotary:k})},942928:(o,d)=>{t.ac("QuickGelu",o,{alpha:d})},942992:(o,d,m,h,b)=>{t.ac("RotaryEmbedding",o,{interleaved:!!d,numHeads:m,rotaryEmbeddingDim:h,scale:b})},943131:(o,d,m)=>{t.ac("SkipLayerNormalization",o,{epsilon:d,simplified:!!m})},943233:(o,d,m)=>{t.ac("SkipLayerNormalization",o,{epsilon:d,simplified:!!m})},943335:(o,d,m,h)=>{t.ac("GatherBlockQuantized",o,{gatherAxis:d,quantizeAxis:m,blockSize:h})},943456:o=>{t.Id(o)},943490:(o,d)=>t.Kd(Number(o),Number(d),t.$c.Nd,t.$c.errors)};function _g(o,d,m){return Ja(async()=>{await t.Gd(Number(o),Number(d),Number(m))})}function wg(){return typeof wasmOffsetConverter<"u"}function bg(o,d,m,h){var b=ae();try{return Ms(o,d,m,h)}catch(k){if(ne(b),k!==k+0)throw k;oe(1,0)}}function $g(o,d,m){var h=ae();try{return As(o,d,m)}catch(b){if(ne(h),b!==b+0)throw b;oe(1,0)}}function vg(o,d,m){var h=ae();try{Is(o,d,m)}catch(b){if(ne(h),b!==b+0)throw b;oe(1,0)}}function xg(o,d){var m=ae();try{return ki(o,d)}catch(h){if(ne(m),h!==h+0)throw h;oe(1,0)}}function Sg(o){var d=ae();try{Es(o)}catch(m){if(ne(d),m!==m+0)throw m;oe(1,0)}}function Tg(o,d,m,h,b,k,C){var B=ae();try{return Rs(o,d,m,h,b,k,C)}catch(q){if(ne(B),q!==q+0)throw q;oe(1,0)}}function kg(o,d){var m=ae();try{Ns(o,d)}catch(h){if(ne(m),h!==h+0)throw h;oe(1,0)}}function Ig(o,d,m,h,b,k){var C=ae();try{zs(o,d,m,h,b,k)}catch(B){if(ne(C),B!==B+0)throw B;oe(1,0)}}function Eg(o,d,m,h){var b=ae();try{Bs(o,d,m,h)}catch(k){if(ne(b),k!==k+0)throw k;oe(1,0)}}function zg(o,d,m,h,b){var k=ae();try{Cs(o,d,m,h,b)}catch(C){if(ne(k),C!==C+0)throw C;oe(1,0)}}function Cg(o,d,m,h,b,k,C){var B=ae();try{Ps(o,d,m,h,b,k,C)}catch(q){if(ne(B),q!==q+0)throw q;oe(1,0)}}function Ag(o,d,m,h,b,k,C){var B=ae();try{Us(o,d,m,h,b,k,C)}catch(q){if(ne(B),q!==q+0)throw q;oe(1,0)}}function Og(o,d,m,h,b,k,C,B){var q=ae();try{Vs(o,d,m,h,b,k,C,B)}catch(G){if(ne(q),G!==G+0)throw G;oe(1,0)}}function Rg(o,d,m,h,b){var k=ae();try{return Ds(o,d,m,h,b)}catch(C){if(ne(k),C!==C+0)throw C;oe(1,0)}}function Bg(o,d,m,h,b,k,C,B){var q=ae();try{Gs(o,d,m,h,b,k,C,B)}catch(G){if(ne(q),G!==G+0)throw G;oe(1,0)}}function Mg(o,d,m,h,b,k,C,B,q,G,ie,pe){var ge=ae();try{qs(o,d,m,h,b,k,C,B,q,G,ie,pe)}catch(_e){if(ne(ge),_e!==_e+0)throw _e;oe(1,0)}}function Ng(o,d,m,h,b,k){var C=ae();try{return Ws(o,d,m,h,b,k)}catch(B){if(ne(C),B!==B+0)throw B;oe(1,0)}}function Dg(o,d,m){var h=ae();try{return Hs(o,d,m)}catch(b){if(ne(h),b!==b+0)throw b;return oe(1,0),0n}}function Pg(o,d,m,h,b,k,C,B,q){var G=ae();try{Os(o,d,m,h,b,k,C,B,q)}catch(ie){if(ne(G),ie!==ie+0)throw ie;oe(1,0)}}function Ug(o){var d=ae();try{return Fs(o)}catch(m){if(ne(d),m!==m+0)throw m;oe(1,0)}}function qg(o,d,m){var h=ae();try{return js(o,d,m)}catch(b){if(ne(h),b!==b+0)throw b;oe(1,0)}}function Wg(o,d){var m=ae();try{return lo(o,d)}catch(h){if(ne(m),h!==h+0)throw h;return oe(1,0),0n}}function Lg(o,d,m,h,b){var k=ae();try{Ks(o,d,m,h,b)}catch(C){if(ne(k),C!==C+0)throw C;oe(1,0)}}function Vg(o){var d=ae();try{return Qs(o)}catch(m){if(ne(d),m!==m+0)throw m;return oe(1,0),0n}}function Gg(o,d,m,h,b,k){var C=ae();try{return to(o,d,m,h,b,k)}catch(B){if(ne(C),B!==B+0)throw B;oe(1,0)}}function Hg(o,d,m,h,b,k){var C=ae();try{return ro(o,d,m,h,b,k)}catch(B){if(ne(C),B!==B+0)throw B;oe(1,0)}}function Fg(o,d,m,h,b,k,C,B){var q=ae();try{return Ls(o,d,m,h,b,k,C,B)}catch(G){if(ne(q),G!==G+0)throw G;oe(1,0)}}function jg(o,d,m,h,b){var k=ae();try{return io(o,d,m,h,b)}catch(C){if(ne(k),C!==C+0)throw C;return oe(1,0),0n}}function Kg(o,d,m,h){var b=ae();try{return no(o,d,m,h)}catch(k){if(ne(b),k!==k+0)throw k;oe(1,0)}}function Qg(o,d,m,h){var b=ae();try{return ao(o,d,m,h)}catch(k){if(ne(b),k!==k+0)throw k;oe(1,0)}}function Zg(o,d,m,h,b,k,C,B,q,G,ie,pe){var ge=ae();try{return so(o,d,m,h,b,k,C,B,q,G,ie,pe)}catch(_e){if(ne(ge),_e!==_e+0)throw _e;oe(1,0)}}function Yg(o,d,m,h,b,k,C,B,q,G,ie){var pe=ae();try{Js(o,d,m,h,b,k,C,B,q,G,ie)}catch(ge){if(ne(pe),ge!==ge+0)throw ge;oe(1,0)}}function Xg(o,d,m,h,b,k,C,B,q,G,ie,pe,ge,_e,ht,Ei){var n0=ae();try{eo(o,d,m,h,b,k,C,B,q,G,ie,pe,ge,_e,ht,Ei)}catch(zi){if(ne(n0),zi!==zi+0)throw zi;oe(1,0)}}function Jg(o,d,m,h){var b=ae();try{return oo(o,d,m,h)}catch(k){if(ne(b),k!==k+0)throw k;oe(1,0)}}function e0(o,d,m,h,b){var k=ae();try{return uo(o,d,m,h,b)}catch(C){if(ne(k),C!==C+0)throw C;oe(1,0)}}function t0(o,d,m){var h=ae();try{return Zs(o,d,m)}catch(b){if(ne(h),b!==b+0)throw b;oe(1,0)}}function r0(o,d,m){var h=ae();try{return Ys(o,d,m)}catch(b){if(ne(h),b!==b+0)throw b;oe(1,0)}}function i0(o,d,m,h){var b=ae();try{Xs(o,d,m,h)}catch(k){if(ne(b),k!==k+0)throw k;oe(1,0)}}function Cr(){if(0<Ae)wt=Cr;else if(n)$?.(t),de();else{for(var o=be;0<o.length;)o.shift()(t);0<Ae?wt=Cr:(t.calledRun=!0,z||(de(),$?.(t)))}}return n||(nt=await We(),Cr()),t.PTR_SIZE=4,V?t:new Promise((o,d)=>{$=o,S=d})}var mp,yo,T0=P(()=>{"use strict";mp=go,yo=globalThis.self?.name?.startsWith("em-pthread"),yo&&go()}),Mi,In,_o,Be,gp,Or,wo,bo,Ni,$o,Di,yp,Pi,_p,Fn=P(()=>{"use strict";Hn(),Mi=typeof location>"u"?void 0:location.origin,In=Qe.url>"file:"&&Qe.url<"file;",_o=()=>{if(In){let e=URL;return new URL(new e("ort.bundle.min.mjs",Qe.url).href,Mi).href}return Qe.url},Be=_o(),gp=()=>{if(Be&&!Be.startsWith("blob:"))return Be.substring(0,Be.lastIndexOf("/")+1)},Or=(e,t)=>{try{let r=t??Be;return(r?new URL(e,r):new URL(e)).origin===Mi}catch{return!1}},wo=(e,t)=>{let r=t??Be;try{return(r?new URL(e,r):new URL(e)).href}catch{return}},bo=(e,t)=>`${t??"./"}${e}`,Ni=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},$o=async e=>(await import(e)).default,Di=(S0(),fr(cp)).default,yp=async()=>{if(!Be)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(Or(Be))return[void 0,Di()];let e=await Ni(Be);return[e,Di(e)]},Pi=(T0(),fr(fp)).default,_p=async(e,t,r,i)=>{let n=Pi&&!(e||t);if(n)if(Be)n=Or(Be);else if(i&&!r)n=!0;else throw new Error("cannot determine the script source URL.");if(n)return[void 0,Pi];{let a="ort-wasm-simd-threaded.jsep.mjs",s=e??wo(a,t),u=r&&s&&!Or(s,t),l=u?await Ni(s):s??bo(a,t);return[u?l:void 0,await $o(l)]}}}),Ui,Rr,Jt,qi,vo,xo,So,jn,ye,Dt=P(()=>{"use strict";Fn(),Rr=!1,Jt=!1,qi=!1,vo=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},xo=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},So=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},jn=async e=>{if(Rr)return Promise.resolve();if(Jt)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(qi)throw new Error("previous call to 'initializeWebAssembly()' failed.");Jt=!0;let t=e.initTimeout,r=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!So())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!xo())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let i=vo();r>1&&!i&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let n=e.wasmPaths,a=typeof n=="string"?n:void 0,s=n?.mjs,u=s?.href??s,l=n?.wasm,p=l?.href??l,f=e.wasmBinary,[c,g]=await _p(u,a,r>1,!!f||!!p),_=!1,y=[];if(t>0&&y.push(new Promise($=>{setTimeout(()=>{_=!0,$()},t)})),y.push(new Promise(($,S)=>{let v={numThreads:r};if(f)v.wasmBinary=f;else if(p||a)v.locateFile=w=>p??a+w;else if(u&&u.indexOf("blob:")!==0)v.locateFile=w=>new URL(w,u).href;else if(c){let w=gp();w&&(v.locateFile=I=>w+I)}g(v).then(w=>{Jt=!1,Rr=!0,Ui=w,$(),c&&URL.revokeObjectURL(c)},w=>{Jt=!1,qi=!0,S(w)})})),await Promise.race(y),_)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},ye=()=>{if(Rr&&Ui)return Ui;throw new Error("WebAssembly is not initialized yet.")}}),Ke,jr,me,Kn=P(()=>{"use strict";Dt(),Ke=(e,t)=>{let r=ye(),i=r.lengthBytesUTF8(e)+1,n=r._malloc(i);return r.stringToUTF8(e,n,i),t.push(n),n},jr=(e,t,r,i)=>{if(typeof e=="object"&&e!==null){if(r.has(e))throw new Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([n,a])=>{let s=t?t+n:n;if(typeof a=="object")jr(a,s+".",r,i);else if(typeof a=="string"||typeof a=="number")i(s,a.toString());else if(typeof a=="boolean")i(s,a?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof a}`)})},me=e=>{let t=ye(),r=t.stackSave();try{let i=t.PTR_SIZE,n=t.stackAlloc(2*i);t._OrtGetLastError(n,n+i);let a=Number(t.getValue(n,i===4?"i32":"i64")),s=t.getValue(n+i,"*"),u=s?t.UTF8ToString(s):"";throw new Error(`${e} ERROR_CODE: ${a}, ERROR_MESSAGE: ${u}`)}finally{t.stackRestore(r)}}}),wp,k0=P(()=>{"use strict";Dt(),Kn(),wp=e=>{let t=ye(),r=0,i=[],n=e||{};try{if(e?.logSeverityLevel===void 0)n.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log severity level is not valid: ${e.logSeverityLevel}`);if(e?.logVerbosityLevel===void 0)n.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);e?.terminate===void 0&&(n.terminate=!1);let a=0;return e?.tag!==void 0&&(a=Ke(e.tag,i)),r=t._OrtCreateRunOptions(n.logSeverityLevel,n.logVerbosityLevel,!!n.terminate,a),r===0&&me("Can't create run options."),e?.extra!==void 0&&jr(e.extra,"",new WeakSet,(s,u)=>{let l=Ke(s,i),p=Ke(u,i);t._OrtAddRunConfigEntry(r,l,p)!==0&&me(`Can't set a run config entry: ${s} - ${u}.`)}),[r,i]}catch(a){throw r!==0&&t._OrtReleaseRunOptions(r),i.forEach(s=>t._free(s)),a}}}),To,ko,Io,er,Eo,bp,I0=P(()=>{"use strict";Dt(),Kn(),To=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"layout":return 3;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},ko=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},Io=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(r=>(typeof r=="string"?r:r.name)==="webgpu")&&(e.enableMemPattern=!1)},er=(e,t,r,i)=>{let n=Ke(t,i),a=Ke(r,i);ye()._OrtAddSessionConfigEntry(e,n,a)!==0&&me(`Can't set a session config entry: ${t} - ${r}.`)},Eo=async(e,t,r)=>{let i=t.executionProviders;for(let n of i){let a=typeof n=="string"?n:n.name,s=[];switch(a){case"webnn":if(a="WEBNN",typeof n!="string"){let c=n?.deviceType;c&&er(e,"deviceType",c,r)}break;case"webgpu":if(a="JS",typeof n!="string"){let c=n;if(c?.preferredLayout){if(c.preferredLayout!=="NCHW"&&c.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${c.preferredLayout}`);er(e,"preferredLayout",c.preferredLayout,r)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${a}`)}let u=Ke(a,r),l=s.length,p=0,f=0;if(l>0){p=ye()._malloc(l*ye().PTR_SIZE),r.push(p),f=ye()._malloc(l*ye().PTR_SIZE),r.push(f);for(let c=0;c<l;c++)ye().setValue(p+c*ye().PTR_SIZE,s[c][0],"*"),ye().setValue(f+c*ye().PTR_SIZE,s[c][1],"*")}await ye()._OrtAppendExecutionProvider(e,u,p,f,l)!==0&&me(`Can't append execution provider: ${a}.`)}},bp=async e=>{let t=ye(),r=0,i=[],n=e||{};Io(n);try{let a=To(n.graphOptimizationLevel??"all"),s=ko(n.executionMode??"sequential"),u=typeof n.logId=="string"?Ke(n.logId,i):0,l=n.logSeverityLevel??2;if(!Number.isInteger(l)||l<0||l>4)throw new Error(`log severity level is not valid: ${l}`);let p=n.logVerbosityLevel??0;if(!Number.isInteger(p)||p<0||p>4)throw new Error(`log verbosity level is not valid: ${p}`);let f=typeof n.optimizedModelFilePath=="string"?Ke(n.optimizedModelFilePath,i):0;if(r=t._OrtCreateSessionOptions(a,!!n.enableCpuMemArena,!!n.enableMemPattern,s,!!n.enableProfiling,0,u,l,p,f),r===0&&me("Can't create session options."),n.executionProviders&&await Eo(r,n,i),n.enableGraphCapture!==void 0){if(typeof n.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${n.enableGraphCapture}`);er(r,"enableGraphCapture",n.enableGraphCapture.toString(),i)}if(n.freeDimensionOverrides)for(let[c,g]of Object.entries(n.freeDimensionOverrides)){if(typeof c!="string")throw new Error(`free dimension override name must be a string: ${c}`);if(typeof g!="number"||!Number.isInteger(g)||g<0)throw new Error(`free dimension override value must be a non-negative integer: ${g}`);let _=Ke(c,i);t._OrtAddFreeDimensionOverride(r,_,g)!==0&&me(`Can't set a free dimension override: ${c} - ${g}.`)}return n.extra!==void 0&&jr(n.extra,"",new WeakSet,(c,g)=>{er(r,c,g,i)}),[r,i]}catch(a){throw r!==0&&t._OrtReleaseSessionOptions(r)!==0&&me("Can't release session options."),i.forEach(s=>t._free(s)),a}}}),zt,st,Ct,ei,Kr,Qn,Zn,En,X=P(()=>{"use strict";zt=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},st=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},Ct=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],i=typeof t=="number"?t:t.reduce((n,a)=>n*a,1);return r>0?Math.ceil(i*r):void 0},ei=e=>{switch(e){case"float16":return typeof Float16Array<"u"&&Float16Array.from?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},Kr=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},Qn=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Zn=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",En=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),Yn,$p=P(()=>{"use strict";Hn(),Yn=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),i=r?parseInt(r,10):0;if(i<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let n=t.body.getReader(),a;try{a=new ArrayBuffer(i)}catch(u){if(u instanceof RangeError){let l=Math.ceil(i/65536);a=new WebAssembly.Memory({initial:l,maximum:l}).buffer}else throw u}let s=0;for(;;){let{done:u,value:l}=await n.read();if(u)break;let p=l.byteLength;new Uint8Array(a,s,p).set(l),s+=p}return new Uint8Array(a,0,i)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),zo,Co,Ao,Oo,Xn,Ro,ue,ot=P(()=>{"use strict";X(),zo=["V","I","W","E","F"],Co=(e,t)=>{console.log(`[${zo[e]},${new Date().toISOString()}]${t}`)},Xn=(e,t)=>{Ao=e,Oo=t},Ro=(e,t)=>{let r=Kr(e),i=Kr(Ao);r>=i&&Co(r,typeof t=="function"?t():t)},ue=(...e)=>{Oo&&Ro(...e)}}),Bo,Gt,R,Qr,vp,xp,Sp,te=P(()=>{"use strict";Bo=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},Gt=class{static calcShape(e,t,r=!1){let i=e.length,n=t.length;if(i===0)return t;if(n===0)return e;let a=Math.max(e.length,t.length),s=new Array(a);if(r){if(i<2||n<2)return;let u=Bo.calcMatMulShape([e[i-2],e[i-1]],[t[n-2],t[n-1]]);if(u===void 0)return;[s[a-2],s[a-1]]=u}for(let u=r?3:1;u<=a;u++){let l=i-u<0?1:e[i-u],p=n-u<0?1:t[n-u];if(l!==p&&l>1&&p>1)return;let f=Math.max(l,p);if(l&&p)s[a-u]=Math.max(l,p);else{if(f>1)return;s[a-u]=0}}return s}static isValidBroadcast(e,t){let r=e.length,i=t.length;if(r>i)return!1;for(let n=1;n<=r;n++)if(e[r-n]!==1&&e[r-n]!==t[i-n])return!1;return!0}},R=class Gr{static size(t){return Gr.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,r=4){let i=t.length;if(i===0)return[];let n=new Array(i),a=i-1;for(;a>=0;){if(t[a]%r===0){n[a]=t[a]/r;break}if(r%t[a]!==0)throw new Error("cannot convert shape");n[a]=1,r/=t[a],a--}for(a--;a>=0;a--)n[a]=t[a];return n}static sizeFromDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return Gr.getSizeFromDimensionRange(t,r,t.length)}static sizeToDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeToDimension as Tensor has ${t.length} dimensions.`);return Gr.getSizeFromDimensionRange(t,0,r)}static getSizeFromDimensionRange(t,r,i){let n=1;for(let a=r;a<i;a++){if(t[a]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");n*=Number(t[a])}return n}static computeStrides(t){let r=t.length;if(r===0)return[];if(r===1)return[1];let i=new Array(r);i[r-1]=1,i[r-2]=t[r-1];for(let n=r-3;n>=0;--n)i[n]=i[n+1]*t[n+1];return i}static normalizeAxis(t,r){if(t<-r&&t>=r)throw new Error("unsupported axis for this operation.");return t<0?t+r:t}static normalizeAxes(t,r){return t.map(i=>this.normalizeAxis(i,r??t.length))}static sortBasedOnPerm(t,r){return r?r.map(i=>t[i]):t.slice().reverse()}static padShape(t,r){let i=t.length;return t.map((n,a)=>n+r[a]+r[a+i])}static areEqual(t,r){return t.length!==r.length?!1:t.every((i,n)=>i===r[n])}},Qr=class dr{static adjustPoolAttributes(t,r,i,n,a,s){if(!t&&i.length!==r.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let u=0;u<r.length-2;u++)u>=i.length?i.push(r[u+2]):i[u]=r[u+2];for(let u=0;u<i.length;u++)if(u<n.length){if(n[u]<0)throw new Error("strides should be greater than or equal to 1")}else n.push(1);for(let u=0;u<i.length;u++)if(u<a.length){if(a[u]<0)throw new Error("dilations should be greater than or equal to 1")}else a.push(1);for(let u=0;u<i.length*2;u++)if(u<s.length){if(s[u]<0)throw new Error("pad should be greater than or equal to 1")}else s.push(0);for(let u=0;u<i.length;u++){if(i[u]<=0)throw new Error("kernel shapes need to be greater than 0");if(s[u]>=i[u]||s[u+i.length]>=i[u])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,r,i,n,a,s,u){if(u){if(a.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(r.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(n.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let l=0;l<t.length-2;l++)dr.adjustPadAndReturnShape(t[l+(s?1:2)],r[l],i[l],n[l],a,l,l+t.length-2,u)}}static computePoolOutputShape(t,r,i,n,a,s,u){if(r.length<=0)throw new Error("input shape must be of size greater than 0");let l=[r[0],r[1]];return dr.computeShapeHelper(t,r,l,i,n,a,s,u),l}static computeConvOutputShape(t,r,i,n,a,s,u){if(t.length<=0||r.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let l=[t[0],r[0]];return dr.computeShapeHelper(!1,t,l,i,n,a,s,u),l}static computeShapeHelper(t,r,i,n,a,s,u,l){if(t)for(let p=0;p<r.length-2;p++)i.push(1);else for(let p=0;p<r.length-2;p++)i.push(dr.adjustPadAndReturnShape(r[p+2],n[p],a[p],s[p],u,p,p+r.length-2,l))}static adjustPadAndReturnShape(t,r,i,n,a,s,u,l){let p=i*(n-1)+1;if(l&&l!=="NOTSET")switch(l){case"VALID":return a[s]=0,a[u]=0,Math.floor((t-p)/r+1);case"SAME_LOWER":case"SAME_UPPER":if(i!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let f=((t+r-1)/r-1)*r+n-t;return a[s]=Math.floor(l==="SAME_LOWER"?(f+1)/2:f/2),a[u]=f-a[s],Math.floor((t+f-n)/r+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+a[s]+a[u]-p)/r+1)}},vp=class{static getShapeOfGemmResult(e,t,r,i,n){if(e.length!==2||r.length!==2)throw new Error("shape need to be of size 2");let a,s,u;t?(a=e[1],s=e[0]):(a=e[0],s=e[1]);let l=-1;if(i?(u=r[0],l=1):(u=r[1],l=0),r[l]!==s)throw new Error("dimension mismatch");if(a<=0||u<=0||s<=0)throw new Error("invalid shape specified");if(n&&!Gt.isValidBroadcast(n,[a,u]))throw new Error("gemm: invalid bias shape for broadcast");return[a,u,s]}},xp=-34028234663852886e22,Sp=34028234663852886e22}),Jn,Tp=P(()=>{"use strict";X(),Jn=(e,t)=>new(ei(t))(e)}),Wi,zn,Li,Mo,Vi,No,Gi,Hi,Fi,Do,kp,E0=P(()=>{"use strict";X(),ot(),Wi=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),zn=(e,t)=>{if(t==="int32")return e;let r=Wi.get(t);if(!r)throw new Error(`WebNN backend does not support data type: ${t}`);let i=r/8;if(e.byteLength%i!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${i}.`);let n=e.byteLength/i,a=new(ei(t))(e.buffer,e.byteOffset,n);switch(t){case"int64":case"uint64":{let s=new Int32Array(n);for(let u=0;u<n;u++){let l=a[u];if(l>2147483647n||l<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");s[u]=Number(l)}return new Uint8Array(s.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&a.some(u=>u>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let s=Int32Array.from(a,Number);return new Uint8Array(s.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},Li=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let r=e.byteLength/4,i=new Int32Array(e.buffer,e.byteOffset,r);switch(t){case"int64":{let n=BigInt64Array.from(i,BigInt);return new Uint8Array(n.buffer)}case"uint64":{if(i.some(a=>a<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let n=BigUint64Array.from(i,BigInt);return new Uint8Array(n.buffer)}case"int8":{if(i.some(a=>a<-128||a>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let n=Int8Array.from(i,Number);return new Uint8Array(n.buffer)}case"uint8":{if(i.some(n=>n<0||n>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(i,Number)}case"uint32":{if(i.some(a=>a<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let n=Uint32Array.from(i,Number);return new Uint8Array(n.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},Mo=1,Vi=()=>Mo++,No=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),Gi=(e,t)=>{let r=Wi.get(e);if(!r)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((i,n)=>i*n)*r/8):0},Hi=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:r,tensor:i,dataType:n,shape:a,fallbackDataType:s}=e;this.sessionId=t,this.mlContext=r,this.mlTensor=i,this.dataType=n,this.tensorShape=a,this.fallbackDataType=s}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return Gi(this.dataType,this.tensorShape)}destroy(){ue("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),r=Li(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(r);return}else return r.buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,r){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===r.length&&this.tensorShape.every((i,n)=>i===r[n])}setIsDataConverted(e){this.isDataConverted=e}},Fi=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,r,i){let n=this.tensorManager.getMLContext(e),a=this.tensorManager.getMLOpSupportLimits(e),s;if(!a?.input.dataTypes.includes(t)){if(s=No.get(t),!s||a?.input.dataTypes.includes(s))throw new Error(`WebNN backend does not support data type: ${t}`);ue("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${s}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(n,t,r))return this.wrapper.tensor;if(i){if(this.wrapper.byteLength!==Gi(t,r))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let u=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,r,u,!0,!0,s),i&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=zn(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else ue("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){if(this.activeUpload){let t=this.wrapper?.isDataConverted?Li(this.activeUpload,this.wrapper?.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(t):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(t);return}else return t.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},Do=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}getMLOpSupportLimits(e){return this.backend.getMLOpSupportLimits(e)}reserveTensorId(){let e=Vi();return this.tensorTrackersById.set(e,new Fi(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,r,i,n){ue("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${r}, shape: ${i}, copyOld: ${n}}`);let a=this.tensorTrackersById.get(t);if(!a)throw new Error("Tensor not found.");return a.ensureTensor(e,r,i,n)}upload(e,t){let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");r.upload(t)}async download(e,t){ue("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t?.byteLength}}`);let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");return r.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,r,i){let n=this.getMLContext(e),a=Vi(),s=new Hi({sessionId:e,context:n,tensor:t,dataType:r,shape:i});return this.tensorTrackersById.set(a,new Fi(this,s)),this.externalTensors.add(s),a}async getCachedTensor(e,t,r,i,n,a,s){let u=this.getMLContext(e);for(let[p,f]of this.freeTensors.entries())if(f.canReuseTensor(u,t,r)){ue("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}`);let c=this.freeTensors.splice(p,1)[0];return c.sessionId=e,c}ue("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${r}}`);let l=await u.createTensor({dataType:s??t,shape:r,dimensions:r,usage:i,writable:n,readable:a});return new Hi({sessionId:e,context:u,tensor:l,dataType:t,shape:r,fallbackDataType:s})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},kp=(...e)=>new Do(...e)}),tr,Po,Ip,z0=P(()=>{"use strict";X(),Dt(),Tp(),E0(),ot(),tr=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),Po=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let r=Object.keys(e).sort(),i=Object.keys(t).sort();return r.length===i.length&&r.every((n,a)=>n===i[a]&&e[n]===t[n])},Ip=class{constructor(e){this.tensorManager=kp(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,this.mlOpSupportLimitsBySessionId=new Map,Xn(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){ue("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){ue("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let r of t)ue("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${r}}`),this.tensorManager.releaseTensorId(r);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let r=this.mlContextCache.findIndex(i=>i.gpuDevice===e);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:i}),i}}else if(e===void 0){let r=this.mlContextCache.findIndex(i=>i.options===void 0&&i.gpuDevice===void 0);if(r!==-1)return this.mlContextCache[r].mlContext;{let i=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:i}),i}}let t=this.mlContextCache.findIndex(r=>Po(r.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:r}),r}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let r=this.sessionIdsByMLContext.get(t);r||(r=new Set,this.sessionIdsByMLContext.set(t,r)),r.add(e),this.mlOpSupportLimitsBySessionId.has(e)||this.mlOpSupportLimitsBySessionId.set(e,t.opSupportLimits()),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e),this.mlOpSupportLimitsBySessionId.delete(e);let r=this.sessionIdsByMLContext.get(t);if(r.delete(e),r.size===0){this.sessionIdsByMLContext.delete(t);let i=this.mlContextCache.findIndex(n=>n.mlContext===t);i!==-1&&this.mlContextCache.splice(i,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}getMLOpSupportLimits(e){return this.mlOpSupportLimitsBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){ue("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,r,i,n){let a=tr.get(r);if(!a)throw new Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,a,i,n)}async createTemporaryTensor(e,t,r){ue("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${r}}`);let i=tr.get(t);if(!i)throw new Error(`Unsupported ONNX data type: ${t}`);let n=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,n,i,r,!1);let a=this.temporarySessionTensorIds.get(e);return a?a.push(n):this.temporarySessionTensorIds.set(e,[n]),n}uploadTensor(e,t){if(!ye().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");ue("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let r=await this.tensorManager.download(e);return Jn(r,t)}}registerMLTensor(e,t,r,i){let n=tr.get(r);if(!n)throw new Error(`Unsupported ONNX data type: ${r}`);let a=this.tensorManager.registerTensor(e,t,n,i);return ue("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${n}, dimensions: ${i}} -> {tensorId: ${a}}`),a}registerMLConstant(e,t,r,i,n,a,s=!1){if(!a)throw new Error("External mounted files are not available.");let u=e;e.startsWith("./")&&(u=e.substring(2));let l=a.get(u);if(!l)throw new Error(`File with name ${u} not found in preloaded files.`);if(t+r>l.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let p=l.slice(t,t+r).buffer,f;switch(n.dataType){case"float32":f=new Float32Array(p);break;case"float16":f=typeof Float16Array<"u"&&Float16Array.from?new Float16Array(p):new Uint16Array(p);break;case"int32":f=new Int32Array(p);break;case"uint32":f=new Uint32Array(p);break;case"int64":if(s){let c=zn(new Uint8Array(p),"int64");f=new Int32Array(c.buffer),n.dataType="int32"}else f=new BigInt64Array(p);break;case"uint64":f=new BigUint64Array(p);break;case"int8":f=new Int8Array(p);break;case"int4":case"uint4":case"uint8":f=new Uint8Array(p);break;default:throw new Error(`Unsupported data type: ${n.dataType} in creating WebNN Constant from external data.`)}return ue("verbose",()=>`[WebNN] registerMLConstant {dataType: ${n.dataType}, shape: ${n.shape}}} ${s?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),i.constant(n,f)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let r=this.sessionGraphInputs.get(e);return r?r.includes(t):!1}isGraphOutput(e,t){let r=this.sessionGraphOutputs.get(e);return r?r.includes(t):!1}isGraphInputOutputTypeSupported(e,t,r=!0){let i=tr.get(zt(t)),n=this.mlOpSupportLimitsBySessionId.get(e);return typeof i>"u"?!1:r?!!n?.input.dataTypes.includes(i):!!n?.output.dataTypes.includes(i)}flush(){}}}),ea=P(()=>{"use strict"}),ji,Br,Mr,Uo,qo,Ki,Cn,Wo,Ep,C0=P(()=>{"use strict";ot(),ea(),ji=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),Br=[],Mr=e=>Math.ceil(Number(e)/16)*16,Uo=e=>{for(let t=0;t<Br.length;t++){let r=Br[t];if(e<=r)return r}return Math.ceil(e/16)*16},qo=1,Ki=()=>qo++,Cn=async(e,t,r,i)=>{let n=Mr(r),a=e.device.createBuffer({size:n,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let s=e.getCommandEncoder();e.endComputePass(),s.copyBufferToBuffer(t,0,a,0,n),e.flush(),await a.mapAsync(GPUMapMode.READ);let u=a.getMappedRange();if(i){let l=i();return l.set(new Uint8Array(u,0,r)),l}else return new Uint8Array(u.slice(0,r))}finally{a.destroy()}},Wo=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of ji)Br.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let r=t.buffer,i=t.byteOffset,n=t.byteLength,a=Mr(n),s=this.storageCache.get(e);if(!s)throw new Error("gpu data for uploading does not exist");if(Number(s.originalSize)!==n)throw new Error(`inconsistent data size. gpu data size=${s.originalSize}, data size=${n}`);let u=this.backend.device.createBuffer({mappedAtCreation:!0,size:a,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),l=u.getMappedRange();new Uint8Array(l).set(new Uint8Array(r,i,n)),u.unmap();let p=this.backend.device.createCommandEncoder();p.copyBufferToBuffer(u,0,s.gpuData.buffer,0,a),this.backend.device.queue.submit([p.finish()]),u.destroy(),ue("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let r=this.storageCache.get(e);if(!r)throw new Error("source gpu data for memcpy does not exist");let i=this.storageCache.get(t);if(!i)throw new Error("destination gpu data for memcpy does not exist");if(r.originalSize!==i.originalSize)throw new Error("inconsistent source and destination gpu data size");let n=Mr(r.originalSize),a=this.backend.getCommandEncoder();this.backend.endComputePass(),a.copyBufferToBuffer(r.gpuData.buffer,0,i.gpuData.buffer,0,n)}registerExternalBuffer(e,t,r){let i;if(r){if(i=r[0],e===r[1])return ue("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, buffer is the same, skip.`),i;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else i=Ki();return this.storageCache.set(i,{gpuData:{id:i,type:0,buffer:e},originalSize:t}),ue("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${i}, registered.`),i}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),ue("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=Uo(e),i,n=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,a=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(n||a){let u=(n?this.freeBuffers:this.freeUniformBuffers).get(r);u?u.length>0?i=u.pop():i=this.backend.device.createBuffer({size:r,usage:t}):i=this.backend.device.createBuffer({size:r,usage:t})}else i=this.backend.device.createBuffer({size:r,usage:t});let s={id:Ki(),type:0,buffer:i};return this.storageCache.set(s.id,{gpuData:s,originalSize:Number(e)}),ue("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${s.id}`),s}get(e){return this.storageCache.get(e)?.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,r=this.storageCache.get(t);if(!r){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return ue("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(e,t){let r=this.storageCache.get(Number(e));if(!r)throw new Error("data does not exist");await Cn(this.backend,r.gpuData.buffer,r.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=ji.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(r=>{r.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(ue("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(r=>{r.gpuData.buffer.destroy()}),this.storageCache=new Map)}},Ep=(...e)=>new Wo(...e)}),Lo,fe,ve=P(()=>{"use strict";Lo=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},fe=e=>new Lo(e)}),Ht,Nr,ke,ze,Q,$e,An,Vt,yt,j,rr,M,H,zp,ta,Vo,Cp,re=P(()=>{"use strict";X(),te(),Ht=64,Nr=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},ke=(e,t=1)=>{let r=Nr(e,t);return typeof r=="string"?r:r[0]},ze=(e,t=1)=>{let r=Nr(e,t);return typeof r=="string"?r:r[1]},Q=(...e)=>{let t=[];return e.forEach(r=>{r.length!==0&&t.push({type:12,data:r},{type:12,data:R.computeStrides(r)})}),t},$e=e=>e%4===0?4:e%2===0?2:1,An=(e="f32",t,r="0")=>!t||t===1?`${e}(${r})`:`vec${t}<${e}>(${r})`,Vt=(e,t,r)=>e==="f32"?r:t===1?`f32(${r})`:`vec${t}<f32>(${r})`,yt=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,j=(e,t,r,i)=>e.startsWith("uniforms.")&&r>4?typeof t=="string"?i==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:i==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:r>1?`${e}[${t}]`:e,rr=(e,t,r,i,n)=>{let a=typeof r=="number",s=a?r:r.length,u=[...new Array(s).keys()],l=s<2?"u32":s<=4?`vec${s}<u32>`:`array<u32, ${s}>`,p=Nr(t,n),f=typeof p=="string"?p:p[1],c=typeof p=="string"?p:p[0],g={indices:l,value:f,storage:c,tensor:t},_=N=>typeof N=="string"?N:`${N}u`,y={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},$=a?"uniforms.":"",S=`${$}${e}_shape`,v=`${$}${e}_strides`,w="";for(let N=0;N<s-1;N++)w+=`
    let dim${N} = current / ${j(v,N,s)};
    let rest${N} = current % ${j(v,N,s)};
    indices[${N}] = dim${N};
    current = rest${N};
    `;w+=`indices[${s-1}] = current;`;let I=s<2?"":`
  fn o2i_${e}(offset: u32) -> ${g.indices} {
    var indices: ${g.indices};
    var current = offset;
    ${w}
    return indices;
  }`,T=N=>(y.offsetToIndices=!0,s<2?N:`o2i_${e}(${N})`),E=[];if(s>=2)for(let N=s-1;N>=0;N--)E.push(`${j(v,N,s)} * (indices[${N}])`);let z=s<2?"":`
  fn i2o_${e}(indices: ${g.indices}) -> u32 {
    return ${E.join("+")};
  }`,O=N=>(y.indicesToOffset=!0,s<2?N:`i2o_${e}(${N})`),x=(...N)=>s===0?"0u":`${g.indices}(${N.map(_).join(",")})`,D=(N,V)=>s<2?`${N}`:`${j(N,V,s)}`,W=(N,V,J)=>s<2?`${N}=${J};`:`${j(N,V,s)}=${J};`,Z={},L=(N,V)=>{y.broadcastedIndicesToOffset=!0;let J=`${V.name}broadcastedIndicesTo${e}Offset`;if(J in Z)return`${J}(${N})`;let de=[];for(let Te=s-1;Te>=0;Te--){let Re=V.indicesGet("outputIndices",Te+V.rank-s);de.push(`${D(v,Te)} * (${Re} % ${D(S,Te)})`)}return Z[J]=`fn ${J}(outputIndices: ${V.type.indices}) -> u32 {
             return ${de.length>0?de.join("+"):"0u"};
           }`,`${J}(${N})`},K=(N,V)=>(()=>{if(g.storage===g.value)return`${e}[${N}]=${V};`;if(g.storage==="vec2<u32>"&&g.value==="i32")return`${e}[${N}]=vec2<u32>(u32(${V}), select(0u, 0xFFFFFFFFu, ${V} < 0));`;if(g.storage==="vec2<u32>"&&g.value==="u32")return`${e}[${N}]=vec2<u32>(u32(${V}), 0u);`;if(g.storage==="u32"&&g.value==="vec4<bool>")return`${e}[${N}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${V}));`;throw new Error(`not supported combination of storage type ${g.storage} and value type ${g.value} yet`)})(),se=N=>(()=>{if(g.storage===g.value)return`${e}[${N}]`;if(g.storage==="vec2<u32>"&&g.value==="i32")return`i32(${e}[${N}].x)`;if(g.storage==="vec2<u32>"&&g.value==="u32")return`u32(${e}[${N}].x)`;if(g.storage==="u32"&&g.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${N}] & 0xFFu), bool(${e}[${N}] & 0xFF00u), bool(${e}[${N}] & 0xFF0000u), bool(${e}[${N}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${g.storage} and value type ${g.value} yet`)})(),A=s<2?"":`
  fn get_${e}ByIndices(indices: ${g.indices}) -> ${f} {
    return ${se(`i2o_${e}(indices)`)};
  }`,U=s<2?"":(()=>{let N=u.map(J=>`d${J}: u32`).join(", "),V=u.map(J=>`d${J}`).join(", ");return`
  fn get_${e}(${N}) -> ${f} {
    return get_${e}ByIndices(${x(V)});
  }`})(),ee=(...N)=>{if(N.length!==s)throw new Error(`indices length must be ${s}`);let V=N.map(_).join(",");return s===0?se("0u"):s===1?se(V[0]):(y.get=!0,y.getByIndices=!0,y.indicesToOffset=!0,`get_${e}(${V})`)},Y=N=>s<2?se(N):(y.getByIndices=!0,y.indicesToOffset=!0,`get_${e}ByIndices(${N})`),F=s<2?"":`
  fn set_${e}ByIndices(indices: ${g.indices}, value: ${f}) {
    ${K(`i2o_${e}(indices)`,"value")}
  }`,le=s<2?"":(()=>{let N=u.map(J=>`d${J}: u32`).join(", "),V=u.map(J=>`d${J}`).join(", ");return`
  fn set_${e}(${N}, value: ${f}) {
    set_${e}ByIndices(${x(V)}, value);
  }`})();return{impl:()=>{let N=[],V=!1;return y.offsetToIndices&&(N.push(I),V=!0),y.indicesToOffset&&(N.push(z),V=!0),y.broadcastedIndicesToOffset&&(Object.values(Z).forEach(J=>N.push(J)),V=!0),y.set&&(N.push(le),V=!0),y.setByIndices&&(N.push(F),V=!0),y.get&&(N.push(U),V=!0),y.getByIndices&&(N.push(A),V=!0),!a&&V&&N.unshift(`const ${S} = ${g.indices}(${r.join(",")});`,`const ${v} = ${g.indices}(${R.computeStrides(r).join(",")});`),N.join(`
`)},type:g,offsetToIndices:T,indicesToOffset:O,broadcastedIndicesToOffset:L,indices:x,indicesGet:D,indicesSet:W,set:(...N)=>{if(N.length!==s+1)throw new Error(`indices length must be ${s}`);let V=N[s];if(typeof V!="string")throw new Error("value must be string");let J=N.slice(0,s).map(_).join(",");return s===0?K("0u",V):s===1?K(J[0],V):(y.set=!0,y.setByIndices=!0,y.indicesToOffset=!0,`set_${e}(${J}, ${V})`)},setByOffset:K,setByIndices:(N,V)=>s<2?K(N,V):(y.setByIndices=!0,y.indicesToOffset=!0,`set_${e}ByIndices(${N}, ${V});`),get:ee,getByOffset:se,getByIndices:Y,usage:i,name:e,strides:v,shape:S,rank:s}},M=(e,t,r,i=1)=>rr(e,t,r,"input",i),H=(e,t,r,i=1)=>rr(e,t,r,"output",i),zp=(e,t,r)=>rr(e,t,r,"atomicOutput",1),ta=(e,t,r,i=1)=>rr(e,t,r,"internal",i),Vo=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=Ht){let t=typeof e=="number"?e:e[0],r=typeof e=="number"?1:e[1],i=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||i>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*r*i>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${r}, ${i}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let n=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,a=n?`@builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(local_invocation_id) local_id : vec3<u32>`:`@builtin(global_invocation_id) global_id : vec3<u32>,
                                             @builtin(local_invocation_id) local_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(num_workgroups) num_workgroups : vec3<u32>`,s=n?`let global_idx = global_id.x;
         let workgroup_index = workgroup_id.x;`:`let workgroup_index = workgroup_id.z * num_workgroups[0] * num_workgroups[1] +
             workgroup_id.y * num_workgroups[0] + workgroup_id.x;
         let global_idx = workgroup_index * ${t*r*i}u + local_idx;`;return`@compute @workgroup_size(${t}, ${r}, ${i})
  fn main(${a}) {
    ${s}
  `}appendVariableUniforms(e){e.rank!==0&&(e.shape.startsWith("uniforms.")&&this.uniforms.push({name:e.shape.replace("uniforms.",""),type:"u32",length:e.rank}),e.strides.startsWith("uniforms.")&&this.uniforms.push({name:e.strides.replace("uniforms.",""),type:"u32",length:e.rank}))}declareVariable(e,t){if(e.usage==="internal")throw new Error("cannot use internal variable with declareVariable(). use registerInternalVariables() instead.");this.variables.push(e),this.appendVariableUniforms(e);let r=e.usage==="input"?"read":"read_write",i=e.usage==="atomicOutput"?"atomic<i32>":e.type.storage;return`@group(0) @binding(${t}) var<storage, ${r}> ${e.name}: array<${i}>;`}declareVariables(...e){return e.map(t=>this.declareVariable(t,this.variableIndex++)).join(`
`)}registerInternalVariable(e){if(e.usage!=="internal")throw new Error("cannot use input or output variable with registerInternalVariable(). use declareVariables() instead.");this.internalVariables.push(e),this.appendVariableUniforms(e)}registerInternalVariables(...e){return e.forEach(t=>this.registerInternalVariable(t)),this}registerUniform(e,t,r=1){return this.uniforms.push({name:e,type:t,length:r}),this}registerUniforms(e){return this.uniforms=this.uniforms.concat(e),this}uniformDeclaration(){if(this.uniforms.length===0)return"";let e=[];for(let{name:t,type:r,length:i}of this.uniforms)if(i&&i>4)r==="f16"?e.push(`@align(16) ${t}:array<mat2x4<${r}>, ${Math.ceil(i/8)}>`):e.push(`${t}:array<vec4<${r}>, ${Math.ceil(i/4)}>`);else{let n=i==null||i===1?r:`vec${i}<${r}>`;e.push(`${t}:${n}`)}return`
      struct Uniforms { ${e.join(", ")} };
      @group(0) @binding(${this.variableIndex}) var<uniform> uniforms: Uniforms;`}get additionalImplementations(){return this.uniformDeclaration()+this.variables.map(e=>e.impl()).join(`
`)+this.internalVariables.map(e=>e.impl()).join(`
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},Cp=(e,t)=>new Vo(e,t)}),Go,Qi,Ho,Fo,jo,Ko,Ne,Ap,Op,_t=P(()=>{"use strict";X(),te(),ve(),re(),Go=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},Qi=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),Ho=(e,t)=>R.sortBasedOnPerm(e,Qi(e.length,t)),Fo=(e,t,r,i)=>{let n=`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`;for(let a=0;a<t;++a)n+=`a[${e[a]}]=i[${a}];`;return n+="return a;}"},jo=(e,t)=>{let r=[],i=[];for(let n=0;n<e.length;++n)e[n]!==1&&r.push(e[n]),e[t[n]]!==1&&i.push(t[n]);return{newShape:r,newPerm:i}},Ko=(e,t)=>{let r=0;for(let i=0;i<e.length;++i)if(t[e[i]]!==1){if(e[i]<r)return!1;r=e[i]}return!0},Ne=(e,t)=>{let r=e.dataType,i=e.dims.length,n=Qi(i,t),a=Ho(e.dims,n),s=e.dims,u=a,l=i<2||Ko(n,e.dims),p;if(l)return p=y=>{let $=M("input",r,s,4),S=H("output",r,u,4);return`
  ${y.registerUniform("output_size","u32").declareVariables($,S)}
  ${y.mainStart()}
    ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let y=R.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(y/64/4)},programUniforms:[{type:12,data:Math.ceil(y/4)}]}},getShaderSource:p};let{newShape:f,newPerm:c}=jo(e.dims,n),g=R.areEqual(c,[2,3,1]),_=R.areEqual(c,[3,1,2]);if(f.length===2||g||_){s=g?[f[0],f[1]*f[2]]:_?[f[0]*f[1],f[2]]:f,u=[s[1],s[0]];let y=16;return p=$=>{let S=M("a",r,s.length),v=H("output",r,u.length);return`
  ${$.registerUniform("output_size","u32").declareVariables(S,v)}
  var<workgroup> tile : array<array<${v.type.value}, ${y+1}>, ${y}>;
  ${$.mainStart([y,y,1])}
    let stride = (uniforms.output_shape[1] - 1) / ${y} + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * ${y}u + local_id.x;
    let input_row = workgroup_id_x * ${y}u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${S.getByIndices(`${S.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * ${y}u + local_id.x;
    let output_row = workgroup_id_y * ${y}u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${v.setByIndices(`${v.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let $=R.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(u[1]/y),y:Math.ceil(u[0]/y)},programUniforms:[{type:12,data:$},...Q(s,u)]}},getShaderSource:p}}return p=y=>{let $=M("a",r,s.length),S=H("output",r,u.length);return`
  ${y.registerUniform("output_size","u32").declareVariables($,S)}

  ${Fo(n,i,$,S)}

  ${y.mainStart()}
    ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${S.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${S.setByOffset("global_idx",$.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let y=R.size(a);return{outputs:[{dims:a,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(y/64)},programUniforms:[{type:12,data:y},...Q(s,u)]}},getShaderSource:p}},Ap=(e,t)=>{Go(e.inputs,t.perm),e.compute(Ne(e.inputs[0],t.perm))},Op=e=>fe({perm:e.perm})}),Qo,Zo,Yo,Xo,Jo,eu,tu,ru,iu,nu,Ve,Rp,Bp,Mp,Np,Dp,Pp,Up,qp,Wp,Lp,A0=P(()=>{"use strict";X(),te(),re(),ra(),_t(),Qo={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},Zo={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},Yo={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},Xo={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},Jo=(e,t)=>{let r=[];for(let i=t-e;i<t;++i)r.push(i);return r},eu=(e,t)=>{let r=[],i=e.length;for(let a=0;a<i;a++)t.indexOf(a)===-1&&r.push(e[a]);let n=t.map(a=>e[a]);return[r,n]},tu=(e,t)=>{let r=e.length+t.length,i=[],n=0;for(let a=0;a<r;a++)t.indexOf(a)===-1?i.push(e[n++]):i.push(1);return i},ru=(e,t)=>{for(let r=0;r<e.length;++r)if(e[e.length-r-1]!==t-1-r)return!1;return!0},iu=(e,t)=>{let r=[];if(!ru(e,t)){for(let i=0;i<t;++i)e.indexOf(i)===-1&&r.push(i);e.forEach(i=>r.push(i))}return r},nu=(e,t,r,i,n,a,s)=>{let u=r[0].dims,l=R.size(a),p=R.size(s),f=M("_A",r[0].dataType,u),c=H("output",n,a),g=64;l===1&&(g=256);let _=`
          var<workgroup> aBestValues : array<f32, ${g}>;
       `,y=$=>`
        ${$.registerUniform("reduceSize","u32").declareVariables(f,c)}
        ${_}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${$.mainStart(g)}

          let outputIndex = global_idx / ${g};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${Yo[i]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${g}) {
           let candidate = f32(${f.getByOffset("offset + k")});
           bestValue = ${Qo[i]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${g}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${Zo[i]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${c.setByOffset("outputIndex",`${i==="mean"?`${c.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${c.type.storage}(${Xo[i]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${g}`,inputDependencies:["type"]},getShaderSource:y,getRunData:()=>({outputs:[{dims:a,dataType:n}],dispatchGroup:{x:l},programUniforms:[{type:12,data:p}]})}},Ve=(e,t,r,i)=>{let n=e.inputs.length===1?r:On(e.inputs,r),a=n.axes;a.length===0&&!n.noopWithEmptyAxes&&(a=e.inputs[0].dims.map((_,y)=>y));let s=R.normalizeAxes(a,e.inputs[0].dims.length),u=s,l=e.inputs[0],p=iu(u,e.inputs[0].dims.length);p.length>0&&(l=e.compute(Ne(e.inputs[0],p),{inputs:[0],outputs:[-1]})[0],u=Jo(u.length,l.dims.length));let[f,c]=eu(l.dims,u),g=f;n.keepDims&&(g=tu(f,s)),e.compute(nu(t,n.cacheKey,[l],i,e.inputs[0].dataType,g,c),{inputs:[l]})},Rp=(e,t)=>{Ve(e,"ReduceMeanShared",t,"mean")},Bp=(e,t)=>{Ve(e,"ReduceL1Shared",t,"l1")},Mp=(e,t)=>{Ve(e,"ReduceL2Shared",t,"l2")},Np=(e,t)=>{Ve(e,"ReduceLogSumExpShared",t,"logSumExp")},Dp=(e,t)=>{Ve(e,"ReduceMaxShared",t,"max")},Pp=(e,t)=>{Ve(e,"ReduceMinShared",t,"min")},Up=(e,t)=>{Ve(e,"ReduceProdShared",t,"prod")},qp=(e,t)=>{Ve(e,"ReduceSumShared",t,"sum")},Wp=(e,t)=>{Ve(e,"ReduceSumSquareShared",t,"sumSquare")},Lp=(e,t)=>{Ve(e,"ReduceLogSumShared",t,"logSum")}}),Ge,au,Zr,On,He,su,ou,uu,lu,du,pu,cu,hu,fu,mu,Fe,Vp,Gp,Hp,Fp,jp,Kp,Qp,Zp,Yp,Xp,ra=P(()=>{"use strict";X(),te(),ve(),re(),A0(),Ge=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},au=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],Zr=(e,t,r,i,n,a,s=!1,u=!1)=>{let l=[],p=r[0].dims,f=p.length,c=R.normalizeAxes(n,f),g=!u&&c.length===0;p.forEach(($,S)=>{g||c.indexOf(S)>=0?s&&l.push(1):l.push($)});let _=l.length,y=R.size(l);return{name:e,shaderCache:t,getShaderSource:$=>{let S=[],v=M("_A",r[0].dataType,f),w=H("output",a,_),I=i(v,w,c),T=I[2];for(let E=0,z=0;E<f;E++)g||c.indexOf(E)>=0?(s&&z++,T=`for(var j${E}: u32 = 0; j${E} < ${p[E]}; j${E}++) {
                  ${I[2].includes("last_index")?`let last_index = j${E};`:""}
                  ${v.indicesSet("input_indices",E,`j${E}`)}
                  ${T}
                }`):(S.push(`${v.indicesSet("input_indices",E,w.indicesGet("output_indices",z))};`),z++);return`

        ${$.registerUniform("output_size","u32").declareVariables(v,w)}

        ${$.mainStart()}
          ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${v.type.indices};
          let output_indices = ${w.offsetToIndices("global_idx")};

          ${S.join(`
`)}
          ${I[0]}       // init ops for reduce max/min
          ${I[1]}
          ${T}
          ${I[3]}
          ${I.length===4?w.setByOffset("global_idx","value"):I.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:l,dataType:a}],dispatchGroup:{x:Math.ceil(y/64)},programUniforms:[{type:12,data:y},...Q(p,l)]})}},On=(e,t)=>{let r=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(i=>r.push(Number(i))),fe({axes:r,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},He=(e,t,r,i)=>{let n=e.inputs,a=n.length===1?r:On(n,r);e.compute(Zr(t,{hint:a.cacheKey,inputDependencies:["rank"]},[n[0]],a.noopWithEmptyAxes&&a.axes.length===0?au:i,a.axes,n[0].dataType,a.keepDims,a.noopWithEmptyAxes),{inputs:[0]})},su=(e,t)=>{Ge(e.inputs),He(e,"ReduceLogSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,"value = log(value);"])},ou=(e,t)=>{Ge(e.inputs),He(e,"ReduceL1",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += abs(${r.getByIndices("input_indices")});`,""])},uu=(e,t)=>{Ge(e.inputs),He(e,"ReduceL2",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},lu=(e,t)=>{Ge(e.inputs),He(e,"ReduceLogSumExp",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += exp(${r.getByIndices("input_indices")});`,"value = log(value);"])},du=(e,t)=>{Ge(e.inputs),He(e,"ReduceMax",t,(r,i,n)=>{let a=[];for(let s=0;s<r.rank;s++)(n.indexOf(s)>=0||n.length===0)&&a.push(r.indicesSet("input_indices",s,0));return[`${a.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = max(value, ${r.getByIndices("input_indices")});`,""]})},pu=(e,t)=>{Ge(e.inputs),He(e,"ReduceMean",t,(r,i,n)=>{let a=1;for(let s=0;s<r.rank;s++)(n.indexOf(s)>=0||n.length===0)&&(a*=e.inputs[0].dims[s]);return["var sum = f32(0);","",`sum += f32(${r.getByIndices("input_indices")});`,`let value = ${i.type.value}(sum / ${a});`]})},cu=(e,t)=>{Ge(e.inputs),He(e,"ReduceMin",t,(r,i,n)=>{let a=[];for(let s=0;s<r.rank;s++)(n.indexOf(s)>=0||n.length===0)&&a.push(`input_indices[${s}] = 0;`);return[`${a.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = min(value, ${r.getByIndices("input_indices")});`,""]})},hu=(e,t)=>{Ge(e.inputs),He(e,"ReduceProd",t,(r,i)=>[`var value = ${i.type.storage}(1);`,"",`value *= ${r.getByIndices("input_indices")};`,""])},fu=(e,t)=>{Ge(e.inputs),He(e,"ReduceSum",t,(r,i)=>[`var value = ${i.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,""])},mu=(e,t)=>{Ge(e.inputs),He(e,"ReduceSumSquare",t,(r,i)=>[`var t = ${i.type.value}(0); var value = ${i.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += t * t;`,""])},Fe=(e,t,r)=>{if(t.length===0)return r;let i=1,n=1;for(let a=0;a<t.length;a++)t.indexOf(a)===-1?i*=e[a]:n*=e[a];return n<32&&i>1024},Vp=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?pu(e,t):Rp(e,t)},Gp=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?ou(e,t):Bp(e,t)},Hp=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?uu(e,t):Mp(e,t)},Fp=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?lu(e,t):Np(e,t)},jp=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?du(e,t):Dp(e,t)},Kp=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?cu(e,t):Pp(e,t)},Qp=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?hu(e,t):Up(e,t)},Zp=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?fu(e,t):qp(e,t)},Yp=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?mu(e,t):Wp(e,t)},Xp=(e,t)=>{Fe(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?su(e,t):Lp(e,t)}}),Zi,Jp,ec,Rn,O0=P(()=>{"use strict";X(),ve(),ra(),Zi=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},Jp=(e,t)=>{Zi(e.inputs);let r=(i,n,a)=>{let s=[];for(let u=0;u<i.rank;u++)(a.indexOf(u)>=0||a.length===0)&&s.push(`input_indices[${u}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",n.setByOffset("global_idx","best_index")]};e.compute(Zr("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},ec=(e,t)=>{Zi(e.inputs);let r=(i,n,a)=>{let s=[];for(let u=0;u<i.rank;u++)(a.indexOf(u)>=0||a.length===0)&&s.push(`input_indices[${u}] = 0;`);return[`${s.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${i.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${i.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",n.setByOffset("global_idx","best_index")]};e.compute(Zr("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},Rn=e=>fe(e)}),gu,Dr,yu,_u,wu,mr,bu,tc,ia=P(()=>{"use strict";X(),te(),ea(),re(),gu=(e,t)=>{let r=e[0],i=e[1],n=e[2],a=e[3],s=e[4],u=e[5];if(s&&u)throw new Error("Attention cannot have both past and attention_bias");if(r.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let l=r.dims[0],p=r.dims[1],f=r.dims[2];if(n.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(i.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(i.dims[0]!==f)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(n.dims[0]!==i.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let c=n.dims[0]/3,g=c,_=g;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let I of t.qkvHiddenSizes)if(I%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");c=t.qkvHiddenSizes[0],g=t.qkvHiddenSizes[1],_=t.qkvHiddenSizes[2]}let y=p;if(c!==g)throw new Error("qkv_hidden_sizes first element should be same as the second");if(n.dims[0]!==c+g+_)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let $=0;if(s){if(g!==_)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(s.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(s.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(s.dims[1]!==l)throw new Error('Input "past" second dimension must be batch_size');if(s.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(s.dims[4]!==g/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||($=s.dims[3])}let S=y+$,v=-1,w=0;if(a)throw new Error("Mask not supported");if(s)throw new Error("past is not supported");if(u){if(u.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(u.dims[0]!==l||u.dims[1]!==t.numHeads||u.dims[2]!==p||u.dims[3]!==S)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:l,sequenceLength:p,pastSequenceLength:$,kvSequenceLength:y,totalSequenceLength:S,maxSequenceLength:v,inputHiddenSize:f,hiddenSize:c,vHiddenSize:_,headSize:Math.floor(c/t.numHeads),vHeadSize:Math.floor(_/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},Dr=(e,t,r)=>t&&e?`
      let total_sequence_length_input = u32(${t.getByOffset("0")});
      let present_sequence_length = max(total_sequence_length_input, uniforms.past_sequence_length);
      let is_subsequent_prompt: bool = sequence_length > 1 && sequence_length != total_sequence_length_input;
      let is_first_prompt: bool = is_subsequent_prompt == false && sequence_length == total_sequence_length_input;
      total_sequence_length = u32(${e?.getByOffset("batchIdx")}) + 1;
      var past_sequence_length: u32 = 0;
      if (is_first_prompt == false) {
        past_sequence_length = total_sequence_length - sequence_length;
      }
       `:`
    ${r?"let past_sequence_length = uniforms.past_sequence_length":""};
    let present_sequence_length = total_sequence_length;
    `,yu=(e,t,r,i,n,a,s,u)=>{let l=$e(s?1:a),p=64,f=a/l;f<p&&(p=32);let c=Math.ceil(a/l/p),g=[{type:12,data:t},{type:12,data:r},{type:12,data:i},{type:12,data:n},{type:12,data:f},{type:12,data:c}],_=ke(e.dataType,l),y=ze(1,l),$=["type"];s&&$.push("type"),u&&$.push("type");let S=v=>{let w=H("x",e.dataType,e.dims,l),I=[w],T=s?M("seq_lens",s.dataType,s.dims):void 0;T&&I.push(T);let E=u?M("total_sequence_length_input",u.dataType,u.dims):void 0;E&&I.push(E);let z=ze(e.dataType),O=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${p}>;
  var<workgroup> thread_sum: array<f32, ${p}>;
  ${v.registerUniforms(O).declareVariables(...I)}
  ${v.mainStart([p,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${Dr(T,E,!1)}
    let local_offset = local_idx * uniforms.elements_per_thread;
    let offset = (global_idx / ${p}) * uniforms.total_sequence_length + local_offset;
    let seq_causal_length = ${s?"u32(past_sequence_length + workgroup_id.y + 1)":"total_sequence_length"};
    var thread_max_vector = ${y}(-3.4028234663852886e+38f);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      thread_max_vector = max(${y}(x[offset + i]), thread_max_vector);
    }
    thread_max[local_idx] = ${(()=>{switch(l){case 1:return"thread_max_vector";case 2:return"max(thread_max_vector.x, thread_max_vector.y)";case 4:return"max(max(thread_max_vector.x, thread_max_vector.y), max(thread_max_vector.z, thread_max_vector.w))";default:throw new Error(`Unsupported components: ${l}`)}})()};
    workgroupBarrier();

    var max_value =  f32(-3.4028234663852886e+38f);
    for (var i = 0u; i < ${p}; i++) {
      max_value = max(thread_max[i], max_value);
    }

    var sum_vector = ${y}(0);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      sum_vector += exp(${y}(x[offset + i]) - max_value);
    }
    thread_sum[local_idx] = ${(()=>{switch(l){case 1:return"sum_vector";case 2:return"sum_vector.x + sum_vector.y";case 4:return"sum_vector.x + sum_vector.y + sum_vector.z + sum_vector.w";default:throw new Error(`Unsupported components: ${l}`)}})()};
    workgroupBarrier();

    var sum: f32 = 0;
    for (var i = 0u; i < ${p}; i++) {
      sum += thread_sum[i];
    }

    if (sum == 0) {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        x[offset + i] = ${w.type.value}(${z}(1.0) / ${z}(seq_causal_length));
      }
    } else {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        var f32input = ${y}(x[offset + i]);
        x[offset + i] = ${w.type.value}(exp(f32input - max_value) / sum);
      }
    }
      ${s?`
        for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
          x[offset + total_seq_id] = ${w.type.value}(${z}(0));
        }`:""};
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${p};${_};${l}`,inputDependencies:$},getShaderSource:S,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:n,z:t*r},programUniforms:g})}},_u=(e,t,r,i,n,a,s,u,l)=>{let p=s+a.kvSequenceLength,f=[a.batchSize,a.numHeads,a.sequenceLength,p],c=e>1&&i,g=a.kvNumHeads?a.kvNumHeads:a.numHeads,_=c?[a.batchSize,g,p,a.headSize]:void 0,y=a.nReps?a.nReps:1,$=a.scale===0?1/Math.sqrt(a.headSize):a.scale,S=$e(a.headSize),v=a.headSize/S,w=12,I={x:Math.ceil(p/w),y:Math.ceil(a.sequenceLength/w),z:a.batchSize*a.numHeads},T=[{type:12,data:a.sequenceLength},{type:12,data:v},{type:12,data:p},{type:12,data:a.numHeads},{type:12,data:a.headSize},{type:1,data:$},{type:12,data:s},{type:12,data:a.kvSequenceLength},{type:12,data:y}],E=c&&i&&R.size(i.dims)>0,z=["type","type"];E&&z.push("type"),n&&z.push("type"),u&&z.push("type"),l&&z.push("type");let O=[{dims:f,dataType:t.dataType,gpuDataType:0}];c&&O.push({dims:_,dataType:t.dataType,gpuDataType:0});let x=D=>{let W=M("q",t.dataType,t.dims,S),Z=M("key",r.dataType,r.dims,S),L=[W,Z];if(E){let F=M("past_key",i.dataType,i.dims,S);L.push(F)}n&&L.push(M("attention_bias",n.dataType,n.dims));let K=u?M("seq_lens",u.dataType,u.dims):void 0;K&&L.push(K);let se=l?M("total_sequence_length_input",l.dataType,l.dims):void 0;se&&L.push(se);let A=H("output",t.dataType,f),U=[A];c&&U.push(H("present_key",t.dataType,_,S));let ee=ze(1,S),Y=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${w}u;

  var<workgroup> tileQ: array<${W.type.storage}, ${w*w}>;
  var<workgroup> tileK: array<${W.type.storage}, ${w*w}>;
  ${D.registerUniforms(Y).declareVariables(...L,...U)}
  ${D.mainStart([w,w,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${y===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${y===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${Dr(K,se,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${E&&c?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${c?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${ee}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${E&&c?`
              if (n + local_id.y < past_sequence_length) {
                tileK[idx] = past_key[pastKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
              } else if (n + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
                tileK[idx] = key[kOffset + (n + local_id.y - past_sequence_length) * uniforms.K + w + local_id.x];
              }`:`
          if (n + local_id.y < uniforms.kv_sequence_length) {
            tileK[idx] = key[kOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
          }`}
      ${c?`if (n + local_id.y < present_sequence_length) {
        present_key[presentKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x] = tileK[idx];
      }`:""}
      }
      workgroupBarrier();

      for (var k: u32 = 0u; k < TILE_SIZE && w+k < uniforms.K; k++) {
          value += ${ee}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch(S){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${S}`)}})()};
        output[outputIdx] = ${A.type.value} (sum * uniforms.alpha) + ${n?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${S};${n!==void 0};${i!==void 0};${e}`,inputDependencies:z},getRunData:()=>({outputs:O,dispatchGroup:I,programUniforms:T}),getShaderSource:x}},wu=(e,t,r,i,n,a,s=void 0,u=void 0)=>{let l=a+n.kvSequenceLength,p=n.nReps?n.nReps:1,f=n.vHiddenSize*p,c=e>1&&i,g=n.kvNumHeads?n.kvNumHeads:n.numHeads,_=c?[n.batchSize,g,l,n.headSize]:void 0,y=[n.batchSize,n.sequenceLength,f],$=12,S={x:Math.ceil(n.vHeadSize/$),y:Math.ceil(n.sequenceLength/$),z:n.batchSize*n.numHeads},v=[{type:12,data:n.sequenceLength},{type:12,data:l},{type:12,data:n.vHeadSize},{type:12,data:n.numHeads},{type:12,data:n.headSize},{type:12,data:f},{type:12,data:a},{type:12,data:n.kvSequenceLength},{type:12,data:p}],w=c&&i&&R.size(i.dims)>0,I=["type","type"];w&&I.push("type"),s&&I.push("type"),u&&I.push("type");let T=[{dims:y,dataType:t.dataType,gpuDataType:0}];c&&T.push({dims:_,dataType:t.dataType,gpuDataType:0});let E=z=>{let O=M("probs",t.dataType,t.dims),x=M("v",r.dataType,r.dims),D=[O,x];w&&D.push(M("past_value",i.dataType,i.dims));let W=s?M("seq_lens",s.dataType,s.dims):void 0;s&&D.push(W);let Z=u?M("total_sequence_length_input",u.dataType,u.dims):void 0;u&&D.push(Z);let L=[H("output",t.dataType,y)];c&&L.push(H("present_value",t.dataType,_));let K=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${$}u;
  var<workgroup> tileQ: array<${O.type.value}, ${$*$}>;
  var<workgroup> tileV: array<${O.type.value}, ${$*$}>;
  ${z.registerUniforms(K).declareVariables(...D,...L)}
  ${z.mainStart([$,$,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${p===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${p===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${Dr(W,Z,!0)}
   let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
   let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
   ${w&&c?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${c?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${O.type.storage}(0);
   for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
        ${w&&c?`
        if (w + local_id.y < past_sequence_length) {
          tileV[idx] = past_value[pastValueOffset + (w + local_id.y) * uniforms.N];
        } else if (w + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
          tileV[idx] = v[vOffset + (w + local_id.y - past_sequence_length) * uniforms.N];
        }
      `:`
            if (w + local_id.y < uniforms.kv_sequence_length) {
              tileV[idx] = v[vOffset + (w + local_id.y) * uniforms.N];
            }`}
        ${c?`
            if (w + local_id.y < present_sequence_length) {
          present_value[presentValueOffset + (w + local_id.y) * uniforms.N] = tileV[idx];
        }`:""}
      }
     workgroupBarrier();
     for (var k: u32 = 0u; k < TILE_SIZE && w+k < total_sequence_length; k++) {
       value += tileQ[TILE_SIZE * local_id.y + k] * tileV[TILE_SIZE * k + local_id.x];
     }
     workgroupBarrier();
   }

   // we need to transpose output from BNSH_v to BSND_v
   if (m < uniforms.M && n < uniforms.N) {
     let outputIdx = batchIdx * uniforms.M * uniforms.v_hidden_size + m * uniforms.v_hidden_size
       + headIdx * uniforms.N + n;
     output[outputIdx] = value;
   }
  }`};return{name:"AttentionScore",shaderCache:{hint:`${i!==void 0};${e}`,inputDependencies:I},getRunData:()=>({outputs:T,dispatchGroup:S,programUniforms:v}),getShaderSource:E}},mr=(e,t,r,i,n,a,s,u,l,p,f=void 0,c=void 0)=>{let g=Math.min(e.outputCount,1+(s?1:0)+(u?1:0)),_=g>1?p.pastSequenceLength:0,y=_+p.kvSequenceLength,$=l&&R.size(l.dims)>0?l:void 0,S=[t,r];g>1&&s&&R.size(s.dims)>0&&S.push(s),$&&S.push($),f&&S.push(f),c&&S.push(c);let v=e.compute(_u(g,t,r,s,$,p,_,f,c),{inputs:S,outputs:g>1?[-1,1]:[-1]})[0];e.compute(yu(v,p.batchSize,p.numHeads,_,p.sequenceLength,y,f,c),{inputs:f&&c?[v,f,c]:[v],outputs:[]});let w=[v,i];g>1&&u&&R.size(u.dims)>0&&w.push(u),f&&w.push(f),c&&w.push(c),e.compute(wu(g,v,i,u,p,_,f,c),{inputs:w,outputs:g>1?[0,2]:[0]})},bu=(e,t)=>{let r=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],i=t.sequenceLength,n=t.inputHiddenSize,a=t.headSize,s=12,u={x:Math.ceil(t.headSize/s),y:Math.ceil(t.sequenceLength/s),z:t.batchSize*t.numHeads},l=[e.inputs[0],e.inputs[1],e.inputs[2]],p=[{type:12,data:i},{type:12,data:n},{type:12,data:a},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],f=c=>{let g=H("output_q",l[0].dataType,r),_=H("output_k",l[0].dataType,r),y=H("output_v",l[0].dataType,r),$=M("input",l[0].dataType,l[0].dims),S=M("weight",l[1].dataType,l[1].dims),v=M("bias",l[2].dataType,l[2].dims),w=$.type.storage,I=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${s}u;
  var<workgroup> tileInput: array<${w}, ${s*s}>;
  var<workgroup> tileWeightQ: array<${w}, ${s*s}>;
  var<workgroup> tileWeightK: array<${w}, ${s*s}>;
  var<workgroup> tileWeightV: array<${w}, ${s*s}>;
  ${c.registerUniforms(I).declareVariables($,S,v,g,_,y)}
  ${c.mainStart([s,s,1])}
    let batchIndex = workgroup_id.z / uniforms.num_heads;
    let headNumber = workgroup_id.z % uniforms.num_heads;
    let m = global_id.y;
    let n = global_id.x;

    let inputOffset = batchIndex * (uniforms.M * uniforms.K) + m * uniforms.K;
    let biasOffsetQ = headNumber * uniforms.head_size;
    let biasOffsetK = uniforms.hidden_size + biasOffsetQ;
    let biasOffsetV = uniforms.hidden_size + biasOffsetK;

    var valueQ = ${w}(0);
    var valueK = ${w}(0);
    var valueV = ${w}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileInput[TILE_SIZE * local_id.y + local_id.x] = input[inputOffset + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        let offset = n + (w + local_id.y) * uniforms.ldb;
        tileWeightQ[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetQ + offset];
        tileWeightK[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetK + offset];
        tileWeightV[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetV + offset];
      }
      workgroupBarrier();
      for (var k: u32 = 0u; k<TILE_SIZE && w+k < uniforms.K; k++) {
        let inputTileOffset = TILE_SIZE * local_id.y + k;
        let weightTileOffset = TILE_SIZE * k + local_id.x;
        valueQ += tileInput[inputTileOffset] * tileWeightQ[weightTileOffset];
        valueK += tileInput[inputTileOffset] * tileWeightK[weightTileOffset];
        valueV += tileInput[inputTileOffset] * tileWeightV[weightTileOffset];
      }

      workgroupBarrier();
    }

    let headOffset = (m * uniforms.N + n) % uniforms.head_size;
    valueQ += bias[headOffset + biasOffsetQ];
    valueK += bias[headOffset + biasOffsetK];
    valueV += bias[headOffset + biasOffsetV];

    let offset = workgroup_id.z * uniforms.M * uniforms.N;
    if (m < uniforms.M && n < uniforms.N) {
      let outputIdx = offset + m * uniforms.N + n;
      output_q[outputIdx] = valueQ;
      output_k[outputIdx] = valueK;
      output_v[outputIdx] = valueV;
    }
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:u,programUniforms:p}),getShaderSource:f},{inputs:l,outputs:[-1,-1,-1]})},tc=(e,t)=>{let r=gu(e.inputs,t),[i,n,a]=bu(e,r);return mr(e,i,n,a,e.inputs[4],void 0,void 0,void 0,e.inputs[5],r)}}),$u,vu,xu,rc,R0=P(()=>{"use strict";qe(),X(),te(),ve(),re(),$u=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let r=(i,n,a)=>{let s=n.length;if(s!==i.length)throw new Error(`${a}: num dimensions != ${s}`);n.forEach((u,l)=>{if(u!==i[l])throw new Error(`${a}: dim[${l}] do not match`)})};if(e[0].dims.length>1){let i=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);r(e[1].dims,i,"Invalid input scale"),r(e[2].dims,i,"Invalid input B"),r(e[3].dims,i,"Invalid input mean"),r(e[4].dims,i,"Invalid input var")}else r(e[1].dims,[1],"Invalid input scale"),r(e[2].dims,[1],"Invalid input B"),r(e[3].dims,[1],"Invalid input mean"),r(e[4].dims,[1],"Invalid input var")},vu=(e,t)=>{let{epsilon:r,spatial:i,format:n}=t,a=e[0].dims,s=i?$e(a[a.length-1]):1,u=n==="NHWC"&&a.length>1?s:1,l=R.size(a)/s,p=i,f=p?a.length:a,c=M("x",e[0].dataType,e[0].dims,s),g=M("scale",e[1].dataType,e[1].dims,u),_=M("bias",e[2].dataType,e[2].dims,u),y=M("inputMean",e[3].dataType,e[3].dims,u),$=M("inputVar",e[4].dataType,e[4].dims,u),S=H("y",e[0].dataType,f,s),v=()=>{let I="";if(i)I=`let cOffset = ${a.length===1?"0u":n==="NHWC"?`outputIndices[${a.length-1}] / ${s}`:"outputIndices[1]"};`;else if(n==="NCHW")I=`
            ${S.indicesSet("outputIndices","0","0")}
            let cOffset = ${S.indicesToOffset("outputIndices")};`;else{I=`var cIndices = ${g.type.indices}(0);
                       cIndices[0] = outputIndices[${a.length-1}];`;for(let T=1;T<g.rank;T++)I+=`cIndices[${T}] = outputIndices[${T}];`;I+=`let cOffset = ${g.indicesToOffset("cIndices")};`}return I},w=I=>`
  const epsilon = ${r};
  ${I.registerUniform("outputSize","u32").declareVariables(c,g,_,y,$,S)}
  ${I.mainStart()}
  ${I.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${S.offsetToIndices(`global_idx * ${s}`)};
    ${v()}
    let scale = ${g.getByOffset("cOffset")};
    let bias = ${_.getByOffset("cOffset")};
    let inputMean = ${y.getByOffset("cOffset")};
    let inputVar = ${$.getByOffset("cOffset")};
    let x = ${c.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${S.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${i}_${s}`,inputDependencies:p?["rank","type","type","type","type"]:void 0},getShaderSource:w,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:p?[{type:12,data:l},...Q(a)]:[{type:12,data:l}]})}},xu=e=>fe(e),rc=(e,t)=>{let{inputs:r,outputCount:i}=e,n=xu({...t,outputCount:i});if(he.webgpu.validateInputContent&&$u(r,n),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(vu(r,n))}}),Su,Tu,ic,B0=P(()=>{"use strict";te(),re(),Su=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Tu=e=>{let t=e[0].dims,r=e[0].dims[2],i=R.size(t)/4,n=e[0].dataType,a=M("input",n,t,4),s=M("bias",n,[r],4),u=M("residual",n,t,4),l=H("output",n,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)}}),getShaderSource:p=>`
  const channels = ${r}u / 4;
  ${p.declareVariables(a,s,u,l)}

  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes(i)}
    let value = ${a.getByOffset("global_idx")}
      + ${s.getByOffset("global_idx % channels")} + ${u.getByOffset("global_idx")};
    ${l.setByOffset("global_idx","value")}
  }`}},ic=e=>{Su(e.inputs),e.compute(Tu(e.inputs))}}),ku,ce,nc,ac,sc,oc,uc,lc,dc,pc,cc,Iu,hc,fc,mc,gc,pr,yc,Hr,_c,wc,bc,$c,vc,xc,Sc,Tc,kc,Ic,Ec,zc,Cc,Ac,Oc,Rc,Yi,Bc,Bn,Mn,Mc,Nc,Dc,Eu,zu,Pc,na=P(()=>{"use strict";X(),te(),ve(),re(),ku=(e,t,r,i,n,a,s)=>{let u=Math.ceil(t/4),l="";typeof n=="string"?l=`${n}(a)`:l=n("a");let p=M("inputData",r,[u],4),f=H("outputData",i,[u],4),c=[{name:"vec_size",type:"u32"}];return s&&c.push(...s),`
      ${e.registerUniforms(c).declareVariables(p,f)}

  ${a??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${p.getByOffset("global_idx")};
    ${f.setByOffset("global_idx",l)}
  }`},ce=(e,t,r,i,n,a=e.dataType,s,u)=>{let l=[{type:12,data:Math.ceil(R.size(e.dims)/4)}];return s&&l.push(...s),{name:t,shaderCache:{hint:n,inputDependencies:["type"]},getShaderSource:p=>ku(p,R.size(e.dims),e.dataType,a,r,i,u),getRunData:p=>({outputs:[{dims:e.dims,dataType:a}],dispatchGroup:{x:Math.ceil(R.size(p[0].dims)/64/4)},programUniforms:l})}},nc=e=>{e.compute(ce(e.inputs[0],"Abs","abs"))},ac=e=>{e.compute(ce(e.inputs[0],"Acos","acos"))},sc=e=>{e.compute(ce(e.inputs[0],"Acosh","acosh"))},oc=e=>{e.compute(ce(e.inputs[0],"Asin","asin"))},uc=e=>{e.compute(ce(e.inputs[0],"Asinh","asinh"))},lc=e=>{e.compute(ce(e.inputs[0],"Atan","atan"))},dc=e=>{e.compute(ce(e.inputs[0],"Atanh","atanh"))},pc=e=>fe(e),cc=(e,t)=>{let r;switch(t.to){case 10:r="vec4<f16>";break;case 1:r="vec4<f32>";break;case 12:r="vec4<u32>";break;case 6:r="vec4<i32>";break;case 9:r="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(ce(e.inputs[0],"Cast",r,void 0,t.cacheKey,t.to))},Iu=e=>{let t,r,i=e.length>=2&&e[1].data!==0,n=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=i?e[1].getFloat32Array()[0]:-34028234663852886e22,r=n?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=i?e[1].getUint16Array()[0]:64511,r=n?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return fe({min:t,max:r})},hc=(e,t)=>{let r=t||Iu(e.inputs),i=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Clip",n=>`clamp(${n}, vec4<${i}>(uniforms.min), vec4<${i}>(uniforms.max))`,void 0,r.cacheKey,void 0,[{type:e.inputs[0].dataType,data:r.min},{type:e.inputs[0].dataType,data:r.max}],[{name:"min",type:i},{name:"max",type:i}]),{inputs:[0]})},fc=e=>{e.compute(ce(e.inputs[0],"Ceil","ceil"))},mc=e=>{e.compute(ce(e.inputs[0],"Cos","cos"))},gc=e=>{e.compute(ce(e.inputs[0],"Cosh","cosh"))},pr=e=>fe(e),yc=(e,t)=>{let r=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Elu",i=>`elu_vf32(${i})`,`
  const elu_alpha_ = ${r}(${t.alpha});

  fn elu_f32(a: ${r}) -> ${r} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${r}>) -> vec4<${r}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},Hr=(e="f32")=>`
const r0: ${e} = 0.3275911;
const r1: ${e} = 0.254829592;
const r2: ${e} = -0.284496736;
const r3: ${e} = 1.421413741;
const r4: ${e} = -1.453152027;
const r5: ${e} = 1.061405429;

fn erf_vf32(v: vec4<${e}>) -> vec4<${e}> {
  let absv = abs(v);
  let x = 1.0 / (1.0 + r0 * absv);
  return sign(v) * (1.0 - ((((r5 * x + r4) * x + r3) * x + r2) * x + r1) * x * exp(-absv * absv));
}`,_c=e=>{let t=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Erf",r=>`erf_vf32(${r})`,Hr(t)))},wc=e=>{e.compute(ce(e.inputs[0],"Exp","exp"))},bc=e=>{e.compute(ce(e.inputs[0],"Floor","floor"))},$c=e=>{let t=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Gelu",r=>`0.5 * ${r} * (1.0 + erf_vf32(${r} * 0.7071067811865475))`,Hr(t)))},vc=(e,t)=>{let r=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"LeakyRelu",i=>`select(leaky_relu_alpha_ * ${i}, ${i}, ${i} >= vec4<${r}>(0.0))`,`const leaky_relu_alpha_ = ${r}(${t.alpha});`,t.cacheKey))},xc=e=>{e.compute(ce(e.inputs[0],"Not",t=>`!${t}`))},Sc=e=>{e.compute(ce(e.inputs[0],"Neg",t=>`-${t}`))},Tc=e=>{e.compute(ce(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},kc=e=>{let t=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"Relu",r=>`select(vec4<${t}>(0.0), ${r}, ${r} > vec4<${t}>(0.0))`))},Ic=e=>{e.compute(ce(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},Ec=e=>fe(e),zc=(e,t)=>{let r=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"HardSigmoid",i=>`max(vec4<${r}>(0.0), min(vec4<${r}>(1.0), ${t.alpha} * ${i} + vec4<${r}>(${t.beta})))`,void 0,t.cacheKey))},Cc=e=>{e.compute(ce(e.inputs[0],"Sin","sin"))},Ac=e=>{e.compute(ce(e.inputs[0],"Sinh","sinh"))},Oc=e=>{e.compute(ce(e.inputs[0],"Sqrt","sqrt"))},Rc=e=>{e.compute(ce(e.inputs[0],"Tan","tan"))},Yi=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,Bc=e=>{e.compute(ce(e.inputs[0],"Tanh",Yi))},Bn=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${Yi("v")};
}
`,Mn=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,Mc=e=>{let t=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"FastGelu",Mn,Bn(t),void 0,e.inputs[0].dataType))},Nc=(e,t)=>{let r=ze(e.inputs[0].dataType);return e.compute(ce(e.inputs[0],"ThresholdedRelu",i=>`select(vec4<${r}>(0.0), ${i}, ${i} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${r}>(${t.alpha});`,t.cacheKey)),0},Dc=e=>{e.compute(ce(e.inputs[0],"Log","log"))},Eu=(e,t)=>`
const alpha = vec4<${e}>(${t});
const one = ${e}(1.0);
const zero = ${e}(0.0);

fn quick_gelu_impl(x: vec4<${e}>) -> vec4<${e}> {
  let v = x *alpha;
  var x1 : vec4<${e}>;
  for (var i = 0; i < 4; i = i + 1) {
    if (v[i] >= zero) {
      x1[i] = one / (one + exp(-v[i]));
    } else {
      x1[i] = one - one / (one + exp(v[i]));
    }
  }
  return x * x1;
}
`,zu=e=>`quick_gelu_impl(${e})`,Pc=(e,t)=>{let r=ze(e.inputs[0].dataType);e.compute(ce(e.inputs[0],"QuickGelu",zu,Eu(r,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),Cu,Au,Uc,M0=P(()=>{"use strict";te(),re(),na(),Cu=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Au=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let r=M("input",e[0].dataType,e[0].dims,4),i=M("bias",e[0].dataType,[e[0].dims[2]],4),n=H("output",e[0].dataType,t,4),a=R.size(t)/4,s=ke(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)}}),getShaderSource:u=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${u.declareVariables(r,i,n)}

  ${Hr(s)}

  ${u.mainStart()}
    ${u.guardAgainstOutOfBoundsWorkgroupSizes(a)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${n.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},Uc=e=>{Cu(e.inputs),e.compute(Au(e.inputs))}}),Ou,Ru,je,qc,Wc,Lc,Vc,Gc,Hc,Fc,jc,Kc,Qc,N0=P(()=>{"use strict";X(),te(),re(),Ou=(e,t,r,i,n,a,s,u,l,p,f,c)=>{let g,_;typeof u=="string"?g=_=(w,I)=>`${u}((${w}),(${I}))`:typeof u=="function"?g=_=u:(g=u.scalar,_=u.vector);let y=H("outputData",f,i.length,4),$=M("aData",l,t.length,4),S=M("bData",p,r.length,4),v;if(n)if(a){let w=R.size(t)===1,I=R.size(r)===1,T=t.length>0&&t[t.length-1]%4===0,E=r.length>0&&r[r.length-1]%4===0;w||I?v=y.setByOffset("global_idx",_(w?`${$.type.value}(${$.getByOffset("0")}.x)`:$.getByOffset("global_idx"),I?`${S.type.value}(${S.getByOffset("0")}.x)`:S.getByOffset("global_idx"))):v=`
            let outputIndices = ${y.offsetToIndices("global_idx * 4u")};
            let offsetA = ${$.broadcastedIndicesToOffset("outputIndices",y)};
            let offsetB = ${S.broadcastedIndicesToOffset("outputIndices",y)};
            ${y.setByOffset("global_idx",_(s||T?$.getByOffset("offsetA / 4u"):`${$.type.value}(${$.getByOffset("offsetA / 4u")}[offsetA % 4u])`,s||E?S.getByOffset("offsetB / 4u"):`${S.type.value}(${S.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else v=y.setByOffset("global_idx",_($.getByOffset("global_idx"),S.getByOffset("global_idx")));else{if(!a)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let w=(I,T,E="")=>{let z=`aData[indexA${T}][componentA${T}]`,O=`bData[indexB${T}][componentB${T}]`;return`
            let outputIndices${T} = ${y.offsetToIndices(`global_idx * 4u + ${T}u`)};
            let offsetA${T} = ${$.broadcastedIndicesToOffset(`outputIndices${T}`,y)};
            let offsetB${T} = ${S.broadcastedIndicesToOffset(`outputIndices${T}`,y)};
            let indexA${T} = offsetA${T} / 4u;
            let indexB${T} = offsetB${T} / 4u;
            let componentA${T} = offsetA${T} % 4u;
            let componentB${T} = offsetB${T} % 4u;
            ${I}[${T}] = ${E}(${g(z,O)});
          `};f===9?v=`
            var data = vec4<u32>(0);
            ${w("data",0,"u32")}
            ${w("data",1,"u32")}
            ${w("data",2,"u32")}
            ${w("data",3,"u32")}
            outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:v=`
            ${w("outputData[global_idx]",0)}
            ${w("outputData[global_idx]",1)}
            ${w("outputData[global_idx]",2)}
            ${w("outputData[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables($,S,y)}

        ${c??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${v}
      }`},Ru=(e,t,r,i,n,a,s=r.dataType)=>{let u=r.dims.map(Number),l=i.dims.map(Number),p=!R.areEqual(u,l),f=u,c=R.size(u),g=!1,_=!1,y=[p];if(p){let $=Gt.calcShape(u,l,!1);if(!$)throw new Error("Can't perform binary op on the given tensors");f=$.slice(),c=R.size(f);let S=R.size(u)===1,v=R.size(l)===1,w=u.length>0&&u[u.length-1]%4===0,I=l.length>0&&l[l.length-1]%4===0;y.push(S),y.push(v),y.push(w),y.push(I);let T=1;for(let E=1;E<f.length;E++){let z=u[u.length-E],O=l[l.length-E];if(z===O)T*=z;else break}T%4===0?(_=!0,g=!0):(S||v||w||I)&&(g=!0)}else g=!0;return y.push(g),{name:e,shaderCache:{hint:t+y.map($=>$.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:$=>Ou($,u,l,f,g,p,_,n,r.dataType,i.dataType,s,a),getRunData:()=>({outputs:[{dims:f,dataType:s}],dispatchGroup:{x:Math.ceil(c/64/4)},programUniforms:[{type:12,data:Math.ceil(R.size(f)/4)},...Q(u,l,f)]})}},je=(e,t,r,i,n,a)=>{e.compute(Ru(t,n??"",e.inputs[0],e.inputs[1],r,i,a))},qc=e=>{je(e,"Add",(t,r)=>`${t}+${r}`)},Wc=e=>{je(e,"Div",(t,r)=>`${t}/${r}`)},Lc=e=>{je(e,"Equal",{scalar:(t,r)=>`u32(${t}==${r})`,vector:(t,r)=>`vec4<u32>(${t}==${r})`},void 0,void 0,9)},Vc=e=>{je(e,"Mul",(t,r)=>`${t}*${r}`)},Gc=e=>{let t=M("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;je(e,"Pow",{scalar:(r,i)=>`pow_custom(${r},${i})`,vector:(r,i)=>`pow_vector_custom(${r},${i})`},`
    fn pow_custom(a : ${t}, b : ${t}) -> ${t} {
      if (b == ${t}(0.0)) {
        return ${t}(1.0);
      } else if (a < ${t}(0.0) && f32(b) != floor(f32(b))) {
        return ${t}(pow(f32(a), f32(b))); // NaN
      }
      return select(sign(a), ${t}(1.0), round(f32(abs(b) % ${t}(2.0))) != 1.0) * ${t}(${t==="i32"?"round":""}(pow(f32(abs(a)), f32(b))));
    }
    fn pow_vector_custom(a : vec4<${t}>, b : vec4<${t}>) -> vec4<${t}> {
      // TODO: implement vectorized pow
      return vec4<${t}>(pow_custom(a.x, b.x), pow_custom(a.y, b.y), pow_custom(a.z, b.z), pow_custom(a.w, b.w));
    }
      `)},Hc=e=>{je(e,"Sub",(t,r)=>`${t}-${r}`)},Fc=e=>{je(e,"Greater",{scalar:(t,r)=>`u32(${t}>${r})`,vector:(t,r)=>`vec4<u32>(${t}>${r})`},void 0,void 0,9)},jc=e=>{je(e,"Less",{scalar:(t,r)=>`u32(${t}<${r})`,vector:(t,r)=>`vec4<u32>(${t}<${r})`},void 0,void 0,9)},Kc=e=>{je(e,"GreaterOrEqual",{scalar:(t,r)=>`u32(${t}>=${r})`,vector:(t,r)=>`vec4<u32>(${t}>=${r})`},void 0,void 0,9)},Qc=e=>{je(e,"LessOrEqual",{scalar:(t,r)=>`u32(${t}<=${r})`,vector:(t,r)=>`vec4<u32>(${t}<=${r})`},void 0,void 0,9)}}),Bu,Mu,Nu,Du,Zc,Yc,D0=P(()=>{"use strict";X(),te(),ve(),re(),Bu=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let r=0,i=e[r],n=i.dataType,a=i.dims.length;e.forEach((s,u)=>{if(u!==r){if(s.dataType!==n)throw new Error("input tensors should be one type");if(s.dims.length!==a)throw new Error("input tensors should have the same shape");s.dims.forEach((l,p)=>{if(p!==t&&l!==i.dims[p])throw new Error("non concat dimensions must match")})}})},Mu=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,Nu=(e,t)=>{let r=e.length,i=[];for(let n=0;n<r;++n){let a=t.setByOffset("global_idx",e[n].getByIndices("indices"));r===1?i.push(a):n===0?i.push(`if (inputIndex == ${n}u) { ${a} }`):n===r-1?i.push(`else { ${a} }`):i.push(`else if (inputIndex == ${n}) { ${a} }`)}return i.join(`
`)},Du=(e,t,r,i)=>{let n=R.size(r),a=new Array(e.length),s=new Array(e.length),u=0,l=[],p=[],f=[{type:12,data:n}];for(let $=0;$<e.length;++$)u+=e[$].dims[t],a[$]=u,p.push(e[$].dims.length),s[$]=M(`input${$}`,i,p[$]),l.push("rank"),f.push({type:12,data:a[$]});for(let $=0;$<e.length;++$)f.push(...Q(e[$].dims));f.push(...Q(r));let c=H("output",i,r.length),g=c.indicesGet("indices",t),_=Array.from(Array(a.length).keys()).map($=>`uniforms.sizeInConcatAxis${$}`).join(","),y=$=>`

  ${(()=>{$.registerUniform("outputSize","u32");for(let S=0;S<e.length;S++)$.registerUniform(`sizeInConcatAxis${S}`,"u32");return $.declareVariables(...s,c)})()}

  ${Mu(a.length,_)}

  ${$.mainStart()}
    ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${c.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${g});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${a.length}u>(${_});
      ${g} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${Nu(s,c)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:l},getRunData:()=>({outputs:[{dims:r,dataType:i}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:f}),getShaderSource:y}},Zc=(e,t)=>{let r=e.inputs,i=r[0].dims,n=R.normalizeAxis(t.axis,i.length);Bu(r,n);let a=i.slice();a[n]=r.reduce((u,l)=>u+(l.dims.length>n?l.dims[n]:0),0);let s=r.filter(u=>R.size(u.dims)>0);e.compute(Du(s,n,a,r[0].dataType),{inputs:s})},Yc=e=>fe({axis:e.axis})}),Rt,Bt,Mt,aa,Pt=P(()=>{"use strict";X(),te(),Rt=(e,t,r="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${r}(uniforms.clip_min)), ${t}(${r}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${r}(uniforms.alpha) * value + ${r}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${r}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},Bt=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},Mt=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},aa=e=>{let t=e?.activation||"";if(t==="HardSigmoid"){let[r,i]=e?.activation_params||[.2,.5];return{activation:t,alpha:r,beta:i}}else if(t==="Clip"){let[r,i]=e?.activation_params||[xp,Sp];return{activation:t,clipMax:i,clipMin:r}}else if(t==="LeakyRelu"){let[r]=e?.activation_params||[.01];return{activation:t,alpha:r}}return{activation:t}}}),Ee,Xc,sa=P(()=>{"use strict";Ee=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},Xc=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),Jc,P0=P(()=>{"use strict";Jc=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),hr,oa,ua=P(()=>{"use strict";X(),te(),re(),Pt(),hr=(e,t,r,i,n)=>{let a=i-r;return`
      ${Array.from({length:r}).map((s,u)=>`
      if (${j(t.shape,u,t.rank)} != 1) {
        ${t.indicesSet(e,u,j(n,u+a,i))}
      } else {
        ${t.indicesSet(e,u,0)}
      }`).join("")}
`},oa=(e,t,r,i,n=!1,a)=>{let s=e[0].dims,u=e[1].dims,l=s[s.length-2],p=u[u.length-1],f=s[s.length-1],c=$e(p),g=$e(f),_=$e(l),y=R.size(r)/c/_,$=e.length>2,S=i?i.slice(0,-2):r.slice(0,-2),v=[R.size(S),l,p],w=[{type:12,data:y},{type:12,data:l},{type:12,data:p},{type:12,data:f}];Bt(t,w),w.push(...Q(S,s,u)),$&&w.push(...Q(e[2].dims)),w.push(...Q(v));let I=T=>{let E=ta("batch_dims",e[0].dataType,S.length),z=M("a",e[0].dataType,s.length,g),O=M("b",e[1].dataType,u.length,c),x=H("output",e[0].dataType,v.length,c),D=ke(x.type.tensor),W=Rt(t,x.type.value,D),Z=[z,O],L="";if($){let A=n?c:1;Z.push(M("bias",e[2].dataType,e[2].dims.length,A)),L=`${n?`value += bias[col / ${A}];`:`value += ${x.type.value}(bias[row + i]);`}`}let K=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];Mt(t,K);let se=()=>{let A=`var a_data: ${z.type.value};`;for(let U=0;U<g;U++)A+=`
              let b_data${U} = b[(b_offset + (k + ${U}) * uniforms.N + col) / ${c}];`;for(let U=0;U<_;U++){A+=`a_data = a[(a_offset + (row + ${U}) * uniforms.K + k) / ${g}];`;for(let ee=0;ee<g;ee++)A+=`
            values[${U}] = fma(${O.type.value}(a_data${g===1?"":`[${ee}]`}), b_data${ee}, values[${U}]);
`}return A};return`
  ${T.registerUniforms(K).registerInternalVariables(E).declareVariables(...Z,x)}
  ${T.mainStart()}
    ${T.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${c})) * ${c};
    var index1 = global_idx / (uniforms.N / ${c});
    let stride1 = uniforms.M / ${_};
    let row = (index1 % stride1) * ${_};
    let batch = index1 / stride1;

    ${r.length===2?"":`let batch_indices = ${E.offsetToIndices("batch")};`}

    var a_indices: ${z.type.indices};
    ${hr("a_indices",z,z.rank-2,E.rank,"batch_indices")}
    ${z.indicesSet("a_indices",z.rank-2,0)}
    ${z.indicesSet("a_indices",z.rank-1,0)}
    let a_offset = ${z.indicesToOffset("a_indices")};

    var b_indices: ${O.type.indices};
    ${hr("b_indices",O,O.rank-2,E.rank,"batch_indices")}
    ${O.indicesSet("b_indices",O.rank-2,0)}
    ${O.indicesSet("b_indices",O.rank-1,0)}
    let b_offset = ${O.indicesToOffset("b_indices")};
    var values: array<${x.type.value}, ${_}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${g}) {
      ${se()}
    }
    for (var i = 0u; i < ${_}u; i++) {
      var value = values[i];
      ${L}
      ${W}
      let cur_indices = ${x.type.indices}(batch, row + i, col);
      let offset = ${x.indicesToOffset("cur_indices")};
      ${x.setByOffset(`offset / ${c}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${c};${g};${_};${n}`,inputDependencies:$?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:a?a(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(y/64)},programUniforms:w}),getShaderSource:I}}}),Pu,Uu,Nn,Xi,qu,Dn,Wu,Yr,la=P(()=>{"use strict";X(),te(),re(),Pt(),ua(),sa(),Pu=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,Uu=(e,t)=>e?`
        let ACached0 = mm_Asub[k * innerElementSize][localRow];
        let ACached1 = mm_Asub[k * innerElementSize + 1][localRow];
        let ACached2 = mm_Asub[k * innerElementSize + 2][localRow];
        ${t===3?"":"let ACached3 = mm_Asub[k * innerElementSize + 3][localRow];"}
        for (var i = 0; i < rowPerThread; i = i + 1) {
          acc[i] = BCached0 * ACached0[i] + acc[i];
          acc[i] = BCached1 * ACached1[i] + acc[i];
          acc[i] = BCached2 * ACached2[i] + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached3[i] + acc[i];"}
        }`:`
        for (var i = 0; i < rowPerThread; i = i + 1) {
          let ACached = mm_Asub[tileRow + i][k];
          acc[i] = BCached0 * ACached.x + acc[i];
          acc[i] = BCached1 * ACached.y + acc[i];
          acc[i] = BCached2 * ACached.z + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached.w + acc[i];"}
        }`,Nn=(e,t,r="f32",i,n=!1,a=32,s=!1,u=32)=>{let l=t[1]*e[1],p=t[0]*e[0],f=n?l:a,c=n?a:l,g=f/t[0],_=a/t[1];if(!((n&&g===4&&e[1]===4||!n&&(g===3||g===4))&&f%t[0]===0&&a%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${n} is true, innerElementSize ${g} and workPerThread[1] ${e[1]} must be 4.
      Otherwise, innerElementSize ${g} must be 3 or 4.
  tileAWidth ${f} must be divisible by workgroupSize[0]${t[0]}. tileInner ${a} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${e[0]} must be 4.`);return`
var<workgroup> mm_Asub: array<array<vec${g}<${r}>, ${f/g}>, ${c}>;
var<workgroup> mm_Bsub: array<array<vec4<${r}>, ${p/e[0]}>, ${a}>;

const rowPerThread = ${e[1]};
const colPerThread = ${e[0]};
const innerElementSize = ${g};
const tileInner = ${a};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
  let localRow = i32(localId.y);
  let tileRow = localRow * rowPerThread;
  let tileCol = i32(localId.x);

  let globalRow =i32(globalId.y) * rowPerThread;
  let globalCol = i32(globalId.x);
  let batch = ${s?"0":"i32(globalId.z)"};
  ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
  let globalRowStart = i32(workgroupId.y) * ${l};

  let num_tiles = ${s?`${Math.ceil(u/a)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
  var kStart = ${s?`i32(globalId.z) * ${u}`:"0"};

  var acc: array<vec4<${r}>, rowPerThread>;

  // Loop over shared dimension.
  let tileRowB = localRow * ${_};
  for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let inputRow = tileRow + innerRow;
          let inputCol = tileCol;
          ${Pu(n,i)}
      }

      // Load one tile of B into local memory.
      for (var innerRow = 0; innerRow < ${_}; innerRow = innerRow + 1) {
          let inputRow = tileRowB + innerRow;
          let inputCol = tileCol;
          mm_Bsub[inputRow][inputCol] = mm_readB(batch, kStart + inputRow, globalCol${i?", batchIndices":""});
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      for (var k = 0; k < tileInner / innerElementSize; k = k + 1) {
          let BCached0 = mm_Bsub[k * innerElementSize][tileCol];
          let BCached1 = mm_Bsub[k * innerElementSize + 1][tileCol];
          let BCached2 = mm_Bsub[k * innerElementSize + 2][tileCol];
          ${g===3?"":"let BCached3 = mm_Bsub[k * innerElementSize + 3][tileCol];"}

          ${Uu(n,g)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},Xi=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,qu=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",Dn=(e,t,r="f32",i,n=!1,a=32,s=!1,u=32,l=!1)=>{let p=e[1]*t[1],f=e[0]*t[0],c=n?p:a,g=n?a:p;if(!(g%t[1]===0&&c%t[0]===0&&a%t[1]===0))throw new Error(`tileAHight ${g} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${c} must be divisible by workgroupSize[0]${t[0]}, tileInner ${a} must be divisible by workgroupSize[1]${t[1]}`);let _=g/t[1],y=c/t[0],$=a/t[1],S=l?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${p};
    let globalColStart = i32(workgroupId.x) * ${f};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${g}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${c}; inputCol = inputCol + ${t[0]}) {
          ${Xi(n,i)}
        }
      }
      // Load one tile of B into local memory.
      for (var inputRow = localRow; inputRow < ${a}; inputRow = inputRow + ${t[1]}) {
            for (var inputCol = localCol; inputCol < ${f}; inputCol = inputCol + ${t[0]}) {
          mm_Bsub[inputRow][inputCol] = mm_readB(batch,
            kStart + inputRow,
            globalColStart + inputCol${i?", batchIndices":""});
        }
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      var BCached : array<${r}, colPerThread>;
      for (var k = 0; k < tileInner; k = k + 1) {
        for (var inner = 0; inner < colPerThread; inner = inner + 1) {
          BCached[inner] = mm_Bsub[k][localCol + inner * ${t[0]}];
        }
        for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let ACached = ${n?`mm_Asub[k][localRow + innerRow * ${t[1]}];`:`mm_Asub[localRow + innerRow * ${t[1]}][k];`}
          for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
            acc[innerRow][innerCol] = acc[innerRow][innerCol] +
                ACached * BCached[innerCol];
          }
        }
      }
      workgroupBarrier();
    }
    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      let gRow = globalRowStart + localRow + innerRow * ${t[1]};
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        let gCol = globalColStart + localCol + innerCol * ${t[0]};
        mm_write(batch, gRow, gCol, acc[innerRow][innerCol]);
      }
    }
    `:`
let tileRow = i32(localId.y) * rowPerThread;
let tileCol = i32(localId.x) * colPerThread;

let globalRow = i32(globalId.y) * rowPerThread;
let globalCol = i32(globalId.x) * colPerThread;
let globalRowStart = i32(workgroupId.y) * ${p};

let tileRowA = i32(localId.y) * ${_};
let tileColA = i32(localId.x) * ${y};
let tileRowB = i32(localId.y) * ${$};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${_}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${y}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${Xi(n,i)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${$}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
      let inputRow = tileRowB + innerRow;
      let inputCol = tileCol + innerCol;
      mm_Bsub[inputRow][inputCol] = mm_readB(batch,
        kStart + inputRow,
        globalCol + innerCol${i?", batchIndices":""});
    }
  }
  kStart = kStart + tileInner;
  workgroupBarrier();

  // Compute acc values for a single thread.
  var BCached : array<${r}, colPerThread>;
  for (var k = 0; k < tileInner; k = k + 1) {
    for (var inner = 0; inner < colPerThread; inner = inner + 1) {
      BCached[inner] = mm_Bsub[k][tileCol + inner];
    }

    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      ${qu(n)}
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        acc[innerRow][innerCol] = acc[innerRow][innerCol] + ACached * BCached[innerCol];
      }
    }
  }

  workgroupBarrier();
}

for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
  for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
    mm_write(batch, globalRow + innerRow, globalCol + innerCol,
        acc[innerRow][innerCol]);
  }
}
`;return`
  var<workgroup> mm_Asub : array<array<${r}, ${c}>, ${g}>;
  var<workgroup> mm_Bsub : array<array<${r}, ${f}>, ${a}>;
  const rowPerThread = ${e[1]};
  const colPerThread = ${e[0]};
  const tileInner = ${a};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
    let batch = ${s?"0":"i32(globalId.z)"};
    ${i?`let batchIndices = ${i.offsetToIndices("u32(batch)")};`:""}
    let num_tiles = ${s?`${Math.ceil(u/a)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
    var kStart = ${s?`i32(globalId.z) * ${u}`:"0"};

    var acc : array<array<${r}, colPerThread>, rowPerThread>;
    ${S}
  }
`},Wu=(e,t,r,i,n=!1)=>{let[a,s,u,l]=i,p=ke(i[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${a.type.indices}) -> ${Ee(e,p)} {
      var value = ${Ee(e,p)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${s.type.indices};
        ${hr("aIndices",s,s.rank-2,a.rank,"batchIndices")}
        ${s.indicesSet("aIndices",s.rank-2,"u32(row)")}
        ${s.indicesSet("aIndices",s.rank-1,"u32(colIn)")}
        value = ${s.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${a.type.indices}) -> ${Ee(e,p)} {
      var value = ${Ee(e,p)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${u.type.indices};
        ${hr("bIndices",u,u.rank-2,a.rank,"batchIndices")}
        ${u.indicesSet("bIndices",u.rank-2,"u32(row)")}
        ${u.indicesSet("bIndices",u.rank-1,"u32(colIn)")}
        value = ${u.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${Ee(e,p)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${n?"bias[colIn]":`${Ee(e,p)}(bias[row])`};`:""}
        ${r}
        ${l.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},Yr=(e,t,r,i,n=!1,a)=>{let s=e[0].dims,u=e[1].dims,l=s.slice(0,-2),p=u.slice(0,-2),f=i?i.slice(0,-2):r.slice(0,-2),c=R.size(f),g=s[s.length-2],_=s[s.length-1],y=u[u.length-1],$=_%4===0&&y%4===0,S=g<=8?[4,1,1]:[4,4,1],v=[8,8,1],w=[Math.ceil(y/v[0]/S[0]),Math.ceil(g/v[1]/S[1]),Math.ceil(c/v[2]/S[2])],I=$?4:1,T=[...l,g,_/I],E=T.length,z=[...p,_,y/I],O=z.length,x=[c,g,y/I],D=[{type:6,data:g},{type:6,data:y},{type:6,data:_}];Bt(t,D),D.push(...Q(f,T,z));let W=["rank","rank"],Z=e.length>2;Z&&(D.push(...Q(e[2].dims)),W.push("rank")),D.push(...Q(x));let L=K=>{let se=f.length,A=ta("batchDims",e[0].dataType,se,1),U=ke(e[0].dataType),ee=M("a",e[0].dataType,E,I),Y=M("b",e[1].dataType,O,I),F=H("result",e[0].dataType,x.length,I),le=[ee,Y];if(Z){let Te=n?I:1;le.push(M("bias",e[2].dataType,e[2].dims.length,Te))}let N=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];Mt(t,N);let V=ke(F.type.tensor),J=Rt(t,F.type.value,V),de=Wu(I,Z,J,[A,ee,Y,F],n);return`
  ${K.registerUniforms(N).registerInternalVariables(A).declareVariables(...le,F)}
  ${de}
  ${$?Nn(S,v,U,A):Dn(S,v,U,A)}
                   `};return{name:"MatMul",shaderCache:{hint:`${S};${t.activation};${$};${n}`,inputDependencies:W},getRunData:()=>({outputs:[{dims:a?a(r):r,dataType:e[0].dataType}],dispatchGroup:{x:w[0],y:w[1],z:w[2]},programUniforms:D}),getShaderSource:L}}}),Lu,eh,U0=P(()=>{"use strict";X(),ot(),re(),Pt(),sa(),P0(),la(),Lu=(e,t,r,i,n=!1,a,s=4,u=4,l=4,p="f32")=>{let f=D=>{switch(D){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${p}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${D} is not supported.`)}},c=D=>{switch(D){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${D} is not supported.`)}},g=e?`
    let coord = vec4<i32>(batch, xRow, xCol, xCh);
    `:`
    let coord = vec4<i32>(batch, xCh, xRow, xCol);
    `,_=e?`
    let coords = vec4<i32>(
      batch,
      row / outWidth,
      row % outWidth,
      col);
    `:`
    let coords = vec4<i32>(
      batch,
      row,
      col / outWidth,
      col % outWidth);
    `,y=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",$=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",S=e?"row":"col",v=e?"col":"row",w=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${S} / outWidth;
    let outCol = ${S} % outWidth;

    let WRow = ${v} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${v} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${v} % inChannels;
    var resData = ${Ee(s,p)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${y} && xCol >= 0 && xCol < ${$}) {
      ${g}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${f(s)}
    }
    return resData;`,I=e?t&&i?`
    let col = colIn * ${s};
    ${w}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${w}
    }
    return ${Ee(s,p)}(0.0);`:i&&r?`
    let col = colIn * ${s};
    ${w}`:`
    let col = colIn * ${s};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${w}
    }
    return ${Ee(s,p)}(0.0);`,T=e?i&&r?c(u):`
    let col = colIn * ${u};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${c(u)}
    }
    return ${Ee(u,p)}(0.0);`:`
    let col = colIn * ${u};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${c(u)}
    }
    return ${Ee(u,p)}(0.0);`,E=Ee(l,p),z=Ee(e?s:u,p),O=Ee(e?u:s,p),x=Rt(a,E,p);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${z} {
      ${e?I:T}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${O} {
      ${e?T:I}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${E}) {
      let col = colIn * ${l};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${_}
      ${Xc(n)}
      ${x}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},eh=(e,t,r,i,n,a,s,u,l)=>{let p=t.format==="NHWC",f=p?e[0].dims[3]:e[0].dims[1],c=r[0],g=p?r[2]:r[3],_=p?r[1]:r[2],y=p?r[3]:r[1],$=p&&(f%4===0||f%3===0)&&y%4===0,S=p?y:g*_,v=p?g*_:y,w=[8,8,1],I=i<=8?[4,1,1]:[4,4,1],T=[Math.ceil(S/w[0]/I[0]),Math.ceil(v/w[1]/I[1]),Math.ceil(c/w[2]/I[2])];ue("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${T}`);let E=$?p&&f%4!==0?3:4:1,z=w[1]*I[1],O=w[0]*I[0],x=Math.max(w[0]*E,w[1]),D=i%z===0,W=n%O===0,Z=a%x===0,L=$?[E,4,4]:[1,1,1],K=[{type:6,data:i},{type:6,data:n},{type:6,data:a},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];Bt(t,K),K.push(...Q(e[0].dims,e[1].dims));let se=["rank","rank"];s&&(K.push(...Q(e[2].dims)),se.push("rank")),K.push(...Q(r));let A=U=>{let ee=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];Mt(t,ee);let Y=$?4:1,F=ke(e[0].dataType),le=`
      fn setOutputAtIndex(flatIndex : i32, value : ${$?`vec4<${F}>`:F}) {
        result[flatIndex] = ${$?`vec4<${F}>`:F}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${$?`vec4<${F}>`:F}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${$?"/ 4":""}, value);
      }`,N=M("x",e[0].dataType,e[0].dims.length,E===3?1:E),V=M("w",e[1].dataType,e[1].dims.length,Y),J=[N,V],de=H("result",e[0].dataType,r.length,Y);if(s){let Te=M("bias",e[2].dataType,e[2].dims.length,Y);J.push(Te),le+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${$?`vec4<${F}>`:F} {
          return bias[coords.${p?"w":"y"}${$?"/ 4":""}];
        }`}return`
        ${Jc("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${U.registerUniforms(ee).declareVariables(...J,de)}
        ${le}
        ${Lu(p,D,W,Z,s,t,L[0],L[1],L[2],F)}
        ${$?Nn(I,w,F,void 0,!p,x):Dn(I,w,F,void 0,!p,x,!1,void 0,u)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${E};${$};${D};${W};${Z};${z};${O};${x}`,inputDependencies:se},getRunData:()=>({outputs:[{dims:l?l(r):r,dataType:e[0].dataType}],dispatchGroup:{x:T[0],y:T[1],z:T[2]},programUniforms:K}),getShaderSource:A}}}),Vu,Ji,ir,Gu,en,Hu,th,rh,q0=P(()=>{"use strict";X(),ot(),te(),re(),Pt(),sa(),Vu=e=>{let t=1;for(let r=0;r<e.length;r++)t*=e[r];return t},Ji=e=>typeof e=="number"?[e,e,e]:e,ir=(e,t)=>t<=1?e:e+(e-1)*(t-1),Gu=(e,t,r,i=1)=>{let n=ir(t,i);return Math.floor((e[0]*(r-1)-r+n)/2)},en=(e,t,r,i,n)=>{n==null&&(n=Gu(e,t[0],i[0]));let a=[0,0,0,r];for(let s=0;s<3;s++)e[s]+2*n>=t[s]&&(a[s]=Math.trunc((e[s]-t[s]+2*n)/i[s]+1));return a},Hu=(e,t,r,i,n,a,s,u,l,p)=>{let f,c,g,_;if(e==="VALID"&&(e=0),typeof e=="number"){f={top:e,bottom:e,left:e,right:e,front:e,back:e};let y=en([t,r,i,1],[u,l,p],1,[n,a,s],e);c=y[0],g=y[1],_=y[2]}else if(Array.isArray(e)){if(!e.every(($,S,v)=>$===v[0]))throw Error(`Unsupported padding parameter: ${e}`);f={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let y=en([t,r,i,1],[u,l,p],1,[n,a,s],e[0]);c=y[0],g=y[1],_=y[2]}else if(e==="SAME_UPPER"){c=Math.ceil(t/n),g=Math.ceil(r/a),_=Math.ceil(i/s);let y=(c-1)*n+u-t,$=(g-1)*a+l-r,S=(_-1)*s+p-i,v=Math.floor(y/2),w=y-v,I=Math.floor($/2),T=$-I,E=Math.floor(S/2),z=S-E;f={top:I,bottom:T,left:E,right:z,front:v,back:w}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:f,outDepth:c,outHeight:g,outWidth:_}},th=(e,t,r,i,n,a=!1,s="channelsLast")=>{let u,l,p,f,c;if(s==="channelsLast")[u,l,p,f,c]=e;else if(s==="channelsFirst")[u,c,l,p,f]=e;else throw new Error(`Unknown dataFormat ${s}`);let[g,,_,y,$]=t,[S,v,w]=Ji(r),[I,T,E]=Ji(i),z=ir(_,I),O=ir(y,T),x=ir($,E),{padInfo:D,outDepth:W,outHeight:Z,outWidth:L}=Hu(n,l,p,f,S,v,w,z,O,x),K=a?g*c:g,se=[0,0,0,0,0];return s==="channelsFirst"?se=[u,K,W,Z,L]:s==="channelsLast"&&(se=[u,W,Z,L,K]),{batchSize:u,dataFormat:s,inDepth:l,inHeight:p,inWidth:f,inChannels:c,outDepth:W,outHeight:Z,outWidth:L,outChannels:K,padInfo:D,strideDepth:S,strideHeight:v,strideWidth:w,filterDepth:_,filterHeight:y,filterWidth:$,effectiveFilterDepth:z,effectiveFilterHeight:O,effectiveFilterWidth:x,dilationDepth:I,dilationHeight:T,dilationWidth:E,inShape:e,outShape:se,filterShape:t}},rh=(e,t,r,i,n,a)=>{let s=a==="channelsLast",u=s?e[0].dims[3]:e[0].dims[1],l=!1,p=[64,1,1],f={x:r.map((w,I)=>I)},c=[Math.ceil(Vu(f.x.map(w=>r[w]))/p[0]),1,1];ue("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${c}`);let g=l?s&&u%4!==0?3:4:1,_=R.size(r),y=[{type:12,data:_},{type:12,data:i},{type:12,data:n},{type:12,data:t.strides},{type:12,data:t.dilations}];Bt(t,y),y.push(...Q(e[0].dims,e[1].dims));let $=["rank","rank"],S=e.length===3;S&&(y.push(...Q(e[2].dims)),$.push("rank")),y.push(...Q(r));let v=w=>{let I=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:i.length},{name:"pads",type:"u32",length:n.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];Mt(t,I);let T=l?4:1,E=ke(e[0].dataType),z=M("x",e[0].dataType,e[0].dims.length,g===3?1:g),O=M("W",e[1].dataType,e[1].dims.length,T),x=[z,O],D=H("result",e[0].dataType,r.length,T),W="";if(S){let K=M("bias",e[2].dataType,e[2].dims.length,T);x.push(K),W+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${l?`vec4<${E}>`:E} {
          return bias[${s?j("coords",4,5):j("coords",1,5)}${l?"/ 4":""}];
        }`}let Z=Ee(g,E),L=Rt(t,Z,E);return`
            ${W}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${z.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${O.getByIndices("aIndices")};
            }
          ${w.registerUniforms(I).declareVariables(...x,D)}
          ${w.mainStart()}
          ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
              let coords = ${D.offsetToIndices("global_idx")};
              let batch = ${j("coords",0,z.rank)};
              let d2 = ${s?j("coords",z.rank-1,z.rank):j("coords",1,z.rank)};
              let xFRCCorner = vec3<u32>(${s?j("coords",1,z.rank):j("coords",2,z.rank)},
              ${s?j("coords",2,z.rank):j("coords",3,z.rank)},
              ${s?j("coords",3,z.rank):j("coords",4,z.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${s?j("uniforms.x_shape",1,z.rank):j("uniforms.x_shape",2,z.rank)};
              let xShapeZ = ${s?j("uniforms.x_shape",2,z.rank):j("uniforms.x_shape",3,z.rank)};
              let xShapeW = ${s?j("uniforms.x_shape",3,z.rank):j("uniforms.x_shape",4,z.rank)};
              let xShapeU = ${s?j("uniforms.x_shape",4,z.rank):j("uniforms.x_shape",1,z.rank)};
              let inputDepthNearestVec4 = (xShapeU / 4) * 4;
              let inputDepthVec4Remainder = xShapeU % 4;

              var value = 0.0;
              for (var wF = 0u; wF < uniforms.filter_dims[0]; wF++) {
                let xF = xFCorner + wF * uniforms.dilations[0];
                if (xF < 0 || xF >= xShapeY) {
                  continue;
                }

                for (var wR = 0u; wR < uniforms.filter_dims[1]; wR++) {
                  let xR = xRCorner + wR * uniforms.dilations[1];
                  if (xR < 0 || xR >= xShapeZ) {
                    continue;
                  }

                  for (var wC = 0u; wC < uniforms.filter_dims[2]; wC++) {
                    let xC = xCCorner + wC * uniforms.dilations[2];
                    if (xC < 0 || xC >= xShapeW) {
                      continue;
                    }

                    for (var d1 = 0u; d1 < inputDepthNearestVec4; d1 += 4) {
                      ${s?`let xValues = vec4<f32>(
                               getX(batch, xF, xR, xC, d1),
                               getX(batch, xF, xR, xC, d1 + 1),
                               getX(batch, xF, xR, xC, d1 + 2),
                               getX(batch, xF, xR, xC, d1 + 3));
                            `:`let xValues = vec4<f32>(
                               getX(batch, d1, xF, xR, xC),
                               getX(batch, d1 + 1, xF, xR, xC),
                               getX(batch, d1 + 2, xF, xR, xC),
                               getX(batch, d1 + 3, xF, xR, xC));
                            `}
                            let wValues = vec4<f32>(
                              getW(d2, d1, wF, wR, wC),
                              getW(d2, d1 + 1, wF, wR, wC),
                              getW(d2, d1 + 2, wF, wR, wC),
                              getW(d2, d1 + 3, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                    if (inputDepthVec4Remainder == 1) {
                        ${s?`value += getX(batch, xF, xR, xC, inputDepthNearestVec4)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`:`value += getX(batch, inputDepthNearestVec4, xF, xR, xC)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`}
                    } else if (inputDepthVec4Remainder == 2) {
                      ${s?`let xValues = vec2<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1));
                      `:`let xValues = vec2<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC));
                    `}
                    let wValues = vec2<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC));
                      value += dot(xValues, wValues);
                    } else if (inputDepthVec4Remainder == 3) {
                      ${s?`let xValues = vec3<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 2));
                      `:`let xValues = vec3<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 2, xF, xR, xC));
                    `}
                    let wValues = vec3<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 2, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                  }
                }
              }
              ${S?"value = value + getBiasByOutputCoords(coords)":""};
              ${L}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${s};${g};${S}`,inputDependencies:$},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:c[0],y:c[1],z:c[2]},programUniforms:y}),getShaderSource:v}}}),ih,nh,W0=P(()=>{"use strict";X(),te(),re(),Pt(),ih=(e,t,r,i)=>{let n=e.length>2,a=n?"value += b[output_channel];":"",s=e[0].dims,u=e[1].dims,l=t.format==="NHWC",p=l?r[3]:r[1],f=p/t.group,c=l&&f>=4?$e(p):1,g=R.size(r)/c,_=[{type:12,data:g},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:f}];Bt(t,_),_.push(...Q(s,[u[0],u[1],u[2],u[3]/c]));let y=n?["rank","rank","rank"]:["rank","rank"];_.push(...Q([r[0],r[1],r[2],r[3]/c]));let $=S=>{let v=H("output",e[0].dataType,r.length,c),w=ke(v.type.tensor),I=Rt(t,v.type.value,w),T=M("x",e[0].dataType,s.length),E=M("w",e[1].dataType,u.length,c),z=[T,E];n&&z.push(M("b",e[2].dataType,e[2].dims,c));let O=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];Mt(t,O);let x=l?`
      for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[0]; wHeight++) {
        let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

        if (xHeight < 0u || xHeight >= uniforms.x_shape[1]) {
          continue;
        }

        for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[1]; wWidth++) {
          let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
          if (xWidth < 0u || xWidth >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[2]; wInChannel++) {
            let input_channel = in_channel_offset + wInChannel;
            let xVal = ${T.get("batch","xHeight","xWidth","input_channel")};
            let wVal = ${E.get("wHeight","wWidth","wInChannel","output_channel")};
            value += xVal * wVal;
          }
        }
      }
      `:`
      for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[1]; wInChannel++) {
        let input_channel = in_channel_offset + wInChannel;
        for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[2]; wHeight++) {
          let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

          if (xHeight < 0u || xHeight >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[3]; wWidth++) {
            let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
            if (xWidth < 0u || xWidth >= uniforms.x_shape[3]) {
              continue;
            }

            let xVal = ${T.get("batch","input_channel","xHeight","xWidth")};
            let wVal = ${E.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${S.registerUniforms(O).declareVariables(...z,v)}

  ${S.mainStart()}
    ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let outputIndices = ${v.offsetToIndices("global_idx")};
    let batch: u32 = outputIndices[0];
    let output_channel: u32 = outputIndices[${l?3:1}];
    let xRCCorner: vec2<u32> = vec2<u32>(outputIndices[${l?1:2}], outputIndices[${l?2:3}]) * uniforms.strides - uniforms.pads;
    let group_id: u32 = output_channel * ${c} / uniforms.output_channels_per_group;
    var in_channel_offset = group_id * uniforms.w_shape[${l?2:1}];

    var value: ${v.type.value} = ${v.type.value}(0);
    ${x}
    ${a}
    ${I}
    ${v.setByOffset("global_idx","value")}
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${c}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:_}),getShaderSource:$}},nh=(e,t,r,i)=>{let n=e.length>2,a=$e(r[3]),s=$e(r[2]),u=R.size(r)/a/s,l=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/a],p=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/a],f=[r[0],r[1],r[2],r[3]/a],c=[{type:12,data:u},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];Bt(t,c),c.push(...Q(l,p,f));let g=(s-1)*t.strides[1]+p[1],_=y=>{let $=H("output",e[0].dataType,f.length,a),S=ke($.type.tensor),v=Rt(t,$.type.value,S),w=M("x",e[0].dataType,l.length,a),I=M("w",e[1].dataType,p.length,a),T=[w,I];n&&T.push(M("b",e[2].dataType,e[2].dims,a));let E=n?"value += b[output_channel];":"",z=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return Mt(t,z),`
  ${y.registerUniforms(z).declareVariables(...T,$)}
  ${y.mainStart()}
    ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let width0 = uniforms.output_shape[3];
    let output_channel = global_idx % width0;
    var index1 = global_idx / width0;
    let width1 = uniforms.output_shape[2] / ${s}u;
    let col = (index1 % width1) * ${s}u;
    index1 = index1 / width1;
    let row = index1 % uniforms.output_shape[1];
    let batch = index1 / uniforms.output_shape[1];

    let x_corner = vec2<i32>(i32(row), i32(col)) * uniforms.strides - uniforms.pads;

    var x_vals: array<${w.type.value}, ${g}>;
    var values: array<${$.type.value}, ${s}>;
    let input_channel = output_channel;
    // Use constant instead of uniform can give better performance for w's height/width.
    for (var w_height: u32 = 0u; w_height < ${p[0]}; w_height++) {
      let x_height = x_corner.x + i32(w_height);
      if (x_height >= 0 && u32(x_height) < uniforms.x_shape[1]) {
        for (var i = 0; i < ${g}; i++) {
          let x_width = x_corner.y + i;
          if (x_width >= 0 && u32(x_width) < uniforms.x_shape[2]) {
            x_vals[i] = ${w.get("batch","u32(x_height)","u32(x_width)","input_channel")};
          } else {
            x_vals[i] = ${w.type.value}(0);
          }
        }
        for (var w_width: u32 = 0u; w_width < ${p[1]}; w_width++) {
          let w_val = ${I.get("w_height","w_width","0","output_channel")};
          for (var i = 0u; i < ${s}u; i++) {
            values[i] = fma(x_vals[i * u32(uniforms.strides[1]) + w_width], w_val, values[i]);
          }
        }
      }
    }

    for (var i = 0u; i < ${s}u; i++) {
      var value = values[i];
      ${E}
      ${v}
      ${$.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${a};${s};${g};${p[0]};${p[1]}`,inputDependencies:n?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:c}),getShaderSource:_}}}),Fu,Pr,ju,Ur,Pn,tn,Ku,Qu,Un,L0=P(()=>{"use strict";te(),U0(),q0(),la(),W0(),Pt(),ua(),_t(),Fu=(e,t,r,i,n,a)=>{let s=e[0],u=e.slice(a?1:2,a?3:4),l=u.length,p=t[0],f=t.slice(2).map((g,_)=>g+(g-1)*(r[_]-1)),c=u.map((g,_)=>g+i[_]+i[_+l]).map((g,_)=>Math.floor((g-f[_]+n[_])/n[_]));return c.splice(0,0,s),c.splice(a?3:1,0,p),c},Pr=[2,3,1,0],ju=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[1]*t.group;if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let n=e[0].dims.length-2;if(t.dilations.length!==n)throw new Error(`dilations should be ${n}D`);if(t.strides.length!==n)throw new Error(`strides should be ${n}D`);if(t.pads.length!==n*2)throw new Error(`pads should be ${n*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},Ur=(e,t)=>{let r=e.kernelShape.slice();r.length<t[1].dims.length-2&&r.push(...Array(t[1].dims.length-2-r.length).fill(0));for(let a=2;a<t[1].dims.length;++a)r[a-2]===0&&(r[a-2]=t[1].dims[a]);let i=e.pads.slice();Qr.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,r,i,e.format==="NHWC",e.autoPad);let n=Object.assign({},e);return Object.assign(n,{kernelShape:r,pads:i}),n},Pn=e=>{let t=aa(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],n=e.dilations,a=e.group,s=e.kernel_shape,u=e.pads,l=e.strides,p=e.w_is_const();return{autoPad:i,format:r,dilations:n,group:a,kernelShape:s,pads:u,strides:l,wIsConst:p,...t,cacheKey:`${e.format};${t.activation};`}},tn=(e,t,r,i)=>{let n=r.format==="NHWC",a=Fu(t[0].dims,t[1].dims,r.dilations,r.pads,r.strides,n);if(r.group!==1){let z=[t[0]];if(n){let O=e.kernelCustomData.wT??e.compute(Ne(t[1],Pr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=O),z.push(O)}else z.push(t[1]);t.length===3&&z.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&n&&t[1].dims[0]===r.group&&t[1].dims[1]===1&&r.dilations[0]===1&&r.dilations[1]===1?e.compute(nh(z,r,a,i),{inputs:z}):e.compute(ih(z,r,a,i),{inputs:z});return}let s=t.length===3,u=t[0].dims[n?1:2],l=t[0].dims[n?2:3],p=t[0].dims[n?3:1],f=t[1].dims[2],c=t[1].dims[3],g=a[n?1:2],_=a[n?2:3],y=a[n?3:1],$=n&&f===u&&c===l&&r.pads[0]===0&&r.pads[1]===0;if($||f===1&&c===1&&r.dilations[0]===1&&r.dilations[1]===1&&r.strides[0]===1&&r.strides[1]===1&&r.pads[0]===0&&r.pads[1]===0){let z=a[0],O,x,D,W=[];if(n){let K=e.kernelCustomData.wT??e.compute(Ne(t[1],Pr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];if(r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=K),$){let se=u*l*p;O=t[0].reshape([1,z,se]),x=K.reshape([1,se,y]),D=[1,z,y]}else O=t[0].reshape([z,u*l,p]),x=K.reshape([1,p,y]),D=[z,g*_,y];W.push(O),W.push(x)}else O=t[0].reshape([z,p,u*l]),x=t[1].reshape([1,y,p]),D=[z,y,g*_],W.push(x),W.push(O);s&&W.push(t[2]);let Z=D[2],L=W[0].dims[W[0].dims.length-1];Z<8&&L<8?e.compute(oa(W,r,a,D,n,i),{inputs:W}):e.compute(Yr(W,r,a,D,n,i),{inputs:W});return}let S=!0,v=e.kernelCustomData.wT??e.compute(Ne(t[1],Pr),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=v);let w=[t[0],v];s&&w.push(t[2]);let I=n?g*_:y,T=n?y:g*_,E=f*c*p;e.compute(eh(w,r,a,I,T,E,s,S,i),{inputs:w})},Ku=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let n=[0,t.pads[0],0,t.pads[1]],a=[1].concat(t.strides),s=[1].concat(t.dilations),u=[1].concat(t.kernelShape),l=Ur({...t,pads:n,strides:a,dilations:s,kernelShape:u},i);tn(e,i,l,p=>r?[p[0],p[2],p[3]]:[p[0],p[1],p[3]])},Qu=(e,t,r)=>{let i=r.format==="NHWC"?"channelsLast":"channelsFirst",n=Ur(r,t),a=r.autoPad==="NOTSET"?r.pads:r.autoPad,s=th(t[0].dims,t[1].dims,r.strides,r.dilations,a,!1,i);e.compute(rh(t,n,s.outShape,[s.filterDepth,s.filterHeight,s.filterWidth],[s.padInfo.front,s.padInfo.top,s.padInfo.left],i))},Un=(e,t)=>{if(ju(e.inputs,t),e.inputs[0].dims.length===3)Ku(e,t);else if(e.inputs[0].dims.length===5)Qu(e,e.inputs,t);else{let r=Ur(t,e.inputs);tn(e,e.inputs,r)}}}),ah,V0=P(()=>{"use strict";X(),ot(),te(),re(),ah=(e,t,r)=>{let i=e.length>2,n=t.outputShape,a=t.format==="NHWC",s=t.group,u=e[1].dims,l=u[2]/s,p=u[3],f=a?$e(l):1,c=a&&p===1&&l>=4,g=c?Math.floor(l/4)*4:Math.floor(l/f)*f,_=l-g,y=a?$e(p):1,$=a?p===1?f:y:1,S=R.size(n)/y,v=[Math.ceil(S/64),1,1];ue("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${v}`);let w=["rank","rank"],I=[t.strides[0],t.strides[1]],T=[t.kernelShape[a?1:2],t.kernelShape[a?2:3]],E=[t.dilations[0],t.dilations[1]],z=[T[0]+(t.dilations[0]<=1?0:(t.kernelShape[a?1:2]-1)*(t.dilations[0]-1)),T[1]+(t.dilations[1]<=1?0:(t.kernelShape[a?2:3]-1)*(t.dilations[1]-1))],O=[z[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),z[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],x=[{type:12,data:S},{type:12,data:I},{type:12,data:T},{type:12,data:E},{type:12,data:z},{type:6,data:O},{type:12,data:g},{type:12,data:l},{type:12,data:p},...Q(e[0].dims,e[1].dims)];i&&(x.push(...Q(e[2].dims)),w.push("rank")),x.push(...Q(n));let D=W=>{let Z=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:I.length},{name:"filter_dims",type:"u32",length:T.length},{name:"dilations",type:"u32",length:T.length},{name:"effective_filter_dims",type:"u32",length:z.length},{name:"pads",type:"i32",length:O.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],L=ke(e[0].dataType),K=a?1:2,se=a?2:3,A=a?3:1,U=M("W",e[1].dataType,e[1].dims.length,$),ee=M("Dy",e[0].dataType,e[0].dims.length,f),Y=[ee,U];i&&Y.push(M("bias",e[2].dataType,[n[A]].length,y));let F=H("result",e[0].dataType,n.length,y),le=()=>{let J="";if(c)f===4?J+=`
        let xValue = ${ee.getByOffset("x_offset")};
        let wValue = ${U.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:f===2?J+=`
          dotProd = dotProd + dot(vec4<${L}>(${ee.getByOffset("x_offset")}, ${ee.getByOffset("x_offset + 1u")}), vec4<${L}>(${U.getByOffset("w_offset")}, ${U.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:f===1&&(J+=`
          dotProd = dotProd + dot(vec4<${L}>(${ee.getByOffset("x_offset")}, ${ee.getByOffset("x_offset + 1u")}, ${ee.getByOffset("x_offset + 2u")}, ${ee.getByOffset("x_offset + 3u")}), vec4<${L}>(${U.getByOffset("w_offset")}, ${U.getByOffset("w_offset + 1u")}, ${U.getByOffset("w_offset + 2u")}, ${U.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(J+=`
                  let xValue = ${a?ee.getByOffset(`${ee.indicesToOffset(`${ee.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${f}`):ee.get("batch","inputChannel","idyR","idyC")};
        `,f===1)J+=`
          let w_offset = ${U.indicesToOffset(`${U.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${U.getByOffset(`w_offset / ${$}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let de=0;de<f;de++)J+=`
            let wValue${de} = ${U.getByOffset(`${U.indicesToOffset(`${U.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${de}, wOutChannel)`)} / ${$}`)};
            dotProd = dotProd + xValue[${de}] * wValue${de};`;return J},N=()=>{if(_===0)return"";if(!c)throw new Error(`packInputAs4 ${c} is not true.`);let J="";if(f===1){J+="dotProd = dotProd";for(let de=0;de<_;de++)J+=`
            + ${ee.getByOffset(`x_offset + ${de}`)} * ${U.getByOffset(`w_offset + ${de}`)}`;J+=";"}else if(f===2){if(_!==2)throw new Error(`Invalid inputChannelsRemainder ${_}.`);J+=`
          let xValue = ${ee.getByOffset("x_offset")};
          let wValue = ${U.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return J},V=`
            let outputIndices = ${F.offsetToIndices(`global_idx * ${y}`)};
            let batch = ${F.indicesGet("outputIndices",0)};
            let d1 = ${F.indicesGet("outputIndices",A)};
            let r = ${F.indicesGet("outputIndices",K)};
            let c = ${F.indicesGet("outputIndices",se)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${F.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${L}(dyRCorner) + ${L}(wR)) / ${L}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${L}(uniforms.Dy_shape[${K}]) || fract(dyR) > 0.0 ||
                  wRPerm < 0) {
                continue;
              }
              let idyR: u32 = u32(dyR);
              var wC: u32 = 0;
              if (uniforms.dilations.y == 1) {
                // Minimum wC >= 0 that satisfies (dyCCorner + wC) % (uniforms.strides.y) == 0
                wC = u32(((dyCCorner + i32(uniforms.strides.y) - 1) / i32(uniforms.strides.y)) * i32(uniforms.strides.y) - dyCCorner);
              }
              for (; wC < uniforms.effective_filter_dims.y; wC = wC + 1) {
                if (wC % uniforms.dilations.y != 0) {
                  continue;
                }
                let dyC = (${L}(dyCCorner) + ${L}(wC)) / ${L}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${L}(uniforms.Dy_shape[${se}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${c?`
                var x_offset = ${ee.indicesToOffset(`${ee.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${f};
                var w_offset = ${U.indicesToOffset(`${U.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${$};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${c?4:f}) {
                  ${le()}
                  inputChannel = inputChannel + ${c?4:f};
                }
                ${N()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${i?` + bias[d1 / ${y}]`:""};
            ${F.setByOffset("global_idx","value")};
          `;return`
    ${W.registerUniforms(Z).declareVariables(...Y,F)}
      ${W.mainStart()}
      ${W.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${V}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${f}${$}${y}${c}${_}`,inputDependencies:w},getRunData:()=>({dispatchGroup:{x:v[0],y:v[1],z:v[2]},outputs:[{dims:r?r(n):n,dataType:e[0].dataType}],programUniforms:x}),getShaderSource:D}}}),Zu,Yu,Xu,rn,sh,Ju,nn,el,oh,G0=P(()=>{"use strict";V0(),Pt(),_t(),Zu=(e,t,r,i,n,a)=>(e-1)*t+r+(i-1)*n+1-a,Yu=(e,t,r,i,n)=>{let a=Math.floor(e/2);t==="SAME_UPPER"?(r[i]=a,r[n]=e-a):t==="SAME_LOWER"&&(r[i]=e-a,r[n]=a)},Xu=(e,t,r,i,n,a,s,u,l,p)=>{let f=e.length-2,c=p.length===0;l.length<f&&l.push(...Array(f-l.length).fill(0));let g=e[0],_=t[u?3:1]*n;for(let y=0,$=e.length-f-(u?1:0);y<f;++y,++$){let S=e[$],v=c?S*s[y]:p[y],w=Zu(S,s[y],a[y],t[$],r[y],v);Yu(w,i,a,y,y+f),c&&p.push(s[y]*(S-1)+l[y]+(t[$]-1)*r[y]+1-a[y]-a[y+f])}p.splice(0,0,g),p.splice(u?3:1,0,_)},rn=(e,t)=>{let r=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((c,g)=>c*g,1)===0){r.length=0;for(let c=2;c<t[1].dims.length;++c)r.push(t[1].dims[c])}let i=e.format==="NHWC";r.splice(0,0,t[1].dims[0]),r.splice(i?3:1,0,t[1].dims[1]);let n=e.pads.slice(),a=e.outputShape.slice(),s=e.outputPadding.slice(),u=t[0].dims,l=e.dilations.slice();if(l.reduce((c,g)=>c+g,0)===0){let c=t[0].dims.length-2;l=new Array(c).fill(1)}let p=e.strides.slice();if(p.reduce((c,g)=>c+g,0)===0){let c=t[0].dims.length-2;p=new Array(c).fill(1)}Xu(u,r,l,e.autoPad,e.group,n,p,i,s,a);let f=Object.assign({},e);return Object.assign(f,{kernelShape:r,pads:n,outputPadding:s,outputShape:a,dilations:l,strides:p}),f},sh=e=>{let t=aa(e),r=e.format,i=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],n=e.dilations,a=e.group??1,s=e.kernelShape,u=e.pads,l=e.strides,p=e.wIsConst(),f=e.outputPadding,c=e.outputShape;return{autoPad:i,format:r,dilations:n,group:a,kernelShape:s,outputPadding:f,outputShape:c,pads:u,strides:l,wIsConst:p,...t,cacheKey:`${e.format};${t.activation};`}},Ju=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],i=e[1].dims[0];if(r!==i)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let n=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==n))throw new Error("invalid bias");let a=e[0].dims.length-2;if(t.dilations.reduce((s,u)=>s+u,0)>0&&t.dilations.length!==a)throw new Error(`dilations should be ${a}D`);if(t.strides.reduce((s,u)=>s+u,0)>0&&t.strides.length!==a)throw new Error(`strides should be ${a}D`);if(t.pads.reduce((s,u)=>s+u,0)>0&&t.pads.length!==a*2)throw new Error(`pads should be ${a*2}D`);if(t.outputPadding.length!==a&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${a}D`);if(t.kernelShape.reduce((s,u)=>s+u,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},nn=(e,t,r,i)=>{let n=e.kernelCustomData.wT??e.compute(Ne(t[1],[2,3,0,1]),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=n);let a=[t[0],n];t.length===3&&a.push(t[2]),e.compute(ah(a,r,i),{inputs:a})},el=(e,t)=>{let r=t.format==="NHWC",i=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&i.push(e.inputs[2]);let n=t.kernelShape;(n.length===0||n[0]===0)&&(n=[e.inputs[1].dims[2]]);let a=t.dilations;(a.length===0||a[0]===0)&&(a=[1]);let s=t.strides;(s.length===0||s[0]===0)&&(s=[1]);let u=t.pads;u.length===0&&(u=[0,0]),u=[0,u[0],0,u[1]],s=[1].concat(s),a=[1].concat(a),n=[1].concat(n);let l=t.outputPadding;l=[0].concat(l);let p=rn({...t,pads:u,strides:s,dilations:a,kernelShape:n,outputPadding:l},i);nn(e,i,p,f=>r?[f[0],f[2],f[3]]:[f[0],f[1],f[3]])},oh=(e,t)=>{if(Ju(e.inputs,t),e.inputs[0].dims.length===3)el(e,t);else{let r=rn(t,e.inputs);nn(e,e.inputs,r)}}}),tl,uh,lh,H0=P(()=>{"use strict";X(),te(),ve(),re(),tl=(e,t,r,i)=>{let n=R.size(t),a=t.length,s=M("input",e,a),u=H("output",e,a),l=r.dataType===6?r.getInt32Array()[0]:Number(r.getBigInt64Array()[0]),p=R.normalizeAxis(l,a),f=c=>{let g=` i32(${s.indicesGet("inputIndices","uniforms.axis")}) `,_=j("uniforms.input_shape","uniforms.axis",a),y=i.reverse?g+(i.exclusive?" + 1":""):"0",$=i.reverse?_:g+(i.exclusive?"":" + 1");return`
                ${c.registerUniform("outputSize","u32").registerUniform("axis","u32").declareVariables(s,u)}
                ${c.mainStart()}
                  ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
                  var inputIndices = ${u.offsetToIndices("global_idx")};
                  var sum = ${u.type.value}(0);
                  let first : i32 = ${y};
                  let last : i32 = ${$};
                  for (var i : i32 = first; i < last; i++) {
                    ${s.indicesSet("inputIndices","uniforms.axis","u32(i)")};
                    sum = sum + ${s.getByIndices("inputIndices")};
                  }
                  ${u.setByOffset("global_idx","sum")};
                }`};return{name:"CumSum",shaderCache:{hint:i.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:[{type:12,data:n},{type:12,data:p},...Q(t,t)]}),getShaderSource:f}},uh=(e,t)=>{let r=e.inputs[0].dims,i=e.inputs[0].dataType,n=e.inputs[1];e.compute(tl(i,r,n,t),{inputs:[0]})},lh=e=>{let t=e.exclusive===1,r=e.reverse===1;return fe({exclusive:t,reverse:r})}}),rl,il,nl,dh,ph,F0=P(()=>{"use strict";X(),te(),ve(),re(),rl=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},il=(e,t,r,i)=>{let n=[];n.push(`fn perm(i: ${i.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`);for(let a=0;a<t;++a)n.push(r.indicesSet("a",e[a],`i[${a}]`));return n.push("return a;}"),n.join(`
`)},nl=(e,t)=>{let r,i,n,a,s,u,l=t.format==="NHWC",p=t.blocksize,f=t.mode==="DCR";l?([r,i,n,a]=e.dims,s=f?[r,i,n,p,p,a/p**2]:[r,i,n,a/p**2,p,p],u=f?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([r,i,n,a]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],s=f?[r,p,p,a/p**2,i,n]:[r,a/p**2,p,p,i,n],u=f?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let c=e.reshape(s),g=c.dims.length,_=e.dataType,y=M("a",_,g),$=H("output",_,g),S=v=>`
  ${v.registerUniform("output_size","u32").declareVariables(y,$)}

  ${il(u,g,y,$)}

  ${v.mainStart()}
    ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${$.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${$.setByOffset("global_idx",y.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:v=>{let w=l?[r,i*p,n*p,a/p**2]:[r,a/p**2,i*p,n*p],I=R.size(w),T=c.dims,E=R.sortBasedOnPerm(T,u);return{outputs:[{dims:w,dataType:v[0].dataType}],dispatchGroup:{x:Math.ceil(I/64)},programUniforms:[{type:12,data:I},...Q(T,E)]}},getShaderSource:S}},dh=(e,t)=>{rl(e.inputs),e.compute(nl(e.inputs[0],t))},ph=e=>fe({blocksize:e.blocksize,mode:e.mode,format:e.format})}),qr,nr,an,al,sl,ol,ul,sn,ll,ch,hh,j0=P(()=>{"use strict";X(),te(),ve(),re(),qr="[a-zA-Z]|\\.\\.\\.",nr="("+qr+")+",an="^"+nr+"$",al="("+nr+",)*"+nr,sl="^"+al+"$",ol=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let r=this.symbolToIndices.get(e);r===void 0?r=[t]:r.push(t),this.symbolToIndices.set(e,r)}},ul=class{constructor(e,t){this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[r,i]=t.includes("->")?t.split("->",2):[t,""];if(!r.match(RegExp(sl)))throw new Error("Invalid LHS term");if(r.split(",").forEach((n,a)=>{let s=e[a].dims.slice();if(!n.match(RegExp(an)))throw new Error("Invalid LHS term");let u=this.processTerm(n,!0,s,a);this.lhs.push(u)}),i==="")i+=[...this.symbolToInfo.entries()].filter(([n,a])=>a.count===1||n==="...").map(([n])=>n).join("");else if(!i.match(RegExp(nr)))throw new Error("Invalid RHS");i.match(RegExp(qr,"g"))?.forEach(n=>{if(n==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let a=this.symbolToInfo.get(n);if(a===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(a.dimValue)}}),this.rhs=this.processTerm(i,!1,this.outputDims)}addSymbol(e,t,r){let i=this.symbolToInfo.get(e);if(i!==void 0){if(i.dimValue!==t&&i.count!==1)throw new Error("Dimension mismatch");i.count++,i.inputIndices.push(r)}else i={count:1,dimValue:t,inputIndices:[r]};this.symbolToInfo.set(e,i)}processTerm(e,t,r,i=-1){let n=r.length,a=!1,s=[],u=0;if(!e.match(RegExp(an))&&!t&&e!=="")throw new Error("Invalid LHS term");let l=e.match(RegExp(qr,"g")),p=new ol(i);return l?.forEach((f,c)=>{if(f==="..."){if(a)throw new Error("Only one ellipsis is allowed per input term");a=!0;let g=n-l.length+1;if(g<0)throw new Error("Ellipsis out of bounds");if(s=r.slice(u,u+g),this.hasEllipsis){if(this.ellipsisDims.length!==s.length||this.ellipsisDims.toString()!==s.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=s;else throw new Error("Ellipsis must be specified in the LHS");for(let _=0;_<s.length;_++){let y=String.fromCharCode(48+_);p.addSymbol(y,c+_),this.addSymbol(y,r[u++],i)}}else p.addSymbol(f,c+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(f,r[u++],i)}),p}},sn=e=>e+"_max",ll=(e,t,r,i)=>{let n=e.map(p=>p.length).map((p,f)=>M(`input${f}`,t,p)),a=R.size(i),s=H("output",t,i.length),u=[...r.symbolToInfo.keys()].filter(p=>!r.rhs.symbolToIndices.has(p)),l=p=>{let f=[],c="var prod = 1.0;",g="var sum = 0.0;",_="sum += prod;",y=[],$=[],S=[],v=[],w=r.symbolToInfo.size===r.rhs.symbolToIndices.size;r.symbolToInfo.forEach((T,E)=>{if(r.rhs.symbolToIndices.has(E)){let z=r.rhs.symbolToIndices.get(E)?.[0];z!==void 0&&r.lhs.forEach((O,x)=>{if(T.inputIndices.includes(x)){let D=O.symbolToIndices.get(E);if(D===void 0)throw new Error("Invalid symbol error");D.forEach(W=>{f.push(`${n[x].indicesSet(`input${x}Indices`,W,s.indicesGet("outputIndices",z))}`)})}})}else r.lhs.forEach((z,O)=>{if(T.inputIndices.includes(O)){let x=z.symbolToIndices.get(E);if(x===void 0)throw new Error("Invalid symbol error");x.forEach(D=>{y.push(`${n[O].indicesSet(`input${O}Indices`,D,`${E}`)}`)}),v.push(`prod *= ${n[O].getByIndices(`input${O}Indices`)};`)}}),$.push(`for(var ${E}: u32 = 0; ${E} < uniforms.${sn(E)}; ${E}++) {`),S.push("}")});let I=w?[...f,`let sum = ${n.map((T,E)=>T.getByIndices(`input${E}Indices`)).join(" * ")};`]:[...f,g,...$,...y,c,...v,_,...S];return`
            ${p.registerUniforms(u.map(T=>({name:`${sn(T)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...n,s)}

            ${p.mainStart()}
            ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${s.offsetToIndices("global_idx")};
            ${n.map((T,E)=>`var input${E}Indices: ${n[E].type.indices};`).join(`
`)}
            ${I.join(`
`)};
            ${s.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:r.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let p=u.filter(c=>r.symbolToInfo.has(c)).map(c=>({type:12,data:r.symbolToInfo.get(c)?.dimValue||0}));p.push({type:12,data:a});let f=e.map((c,g)=>[...Q(c)]).reduce((c,g)=>c.concat(g),p);return f.push(...Q(i)),{outputs:[{dims:i,dataType:t}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:f}},getShaderSource:l}},ch=(e,t)=>{let r=new ul(e.inputs,t.equation),i=r.outputDims,n=e.inputs.map((a,s)=>a.dims);e.compute(ll(n,e.inputs[0].dataType,r,i))},hh=e=>{let t=e.equation.replace(/\s+/g,"");return fe({equation:t})}}),dl,on,pl,cl,fh,K0=P(()=>{"use strict";X(),te(),re(),dl=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=r.length<t.length?0:r.length-t.length,n=t.length<r.length?0:t.length-r.length;for(;i<r.length&&n<t.length;++i,++n)if(r[i]!==t[n]&&r[i]!==1&&t[n]!==1)throw new Error("Expand requires shape to be broadcastable to input")},on=(e,t)=>{let r=e.length-t.length,i=[];for(let n=0;n<r;++n)i.push(e[n]);for(let n=0;n<t.length;++n)i.push(t[n]===1?e[n+r]:t[n]);return i},pl=(e,t)=>e.length>t.length?on(e,t):on(t,e),cl=e=>{let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),i=pl(t,r),n=e[0].dataType,a=n===9||R.size(t)===1,s=n===9||t.length>0&&t[t.length-1]%4===0?4:1,u=a||i.length>0&&i[i.length-1]%4===0?4:1,l=Math.ceil(R.size(i)/u),p=c=>{let g=M("input",n,t.length,s),_=H("output",n,i.length,u),y;if(n===9){let $=(S,v,w="")=>`
          let outputIndices${v} = ${_.offsetToIndices(`outputOffset + ${v}u`)};
          let offset${v} = ${g.broadcastedIndicesToOffset(`outputIndices${v}`,_)};
          let index${v} = offset${v} / 4u;
          let component${v} = offset${v} % 4u;
          ${S}[${v}] = ${w}(${g.getByOffset(`index${v}`)}[component${v}]);
        `;y=`
        let outputOffset = global_idx * ${u};
        var data = vec4<u32>(0);
        ${$("data",0,"u32")}
        ${$("data",1,"u32")}
        ${$("data",2,"u32")}
        ${$("data",3,"u32")}
        ${_.setByOffset("global_idx","data")}
      }`}else y=`
        let outputIndices = ${_.offsetToIndices(`global_idx * ${u}`)};
        let inputOffset = ${g.broadcastedIndicesToOffset("outputIndices",_)};
        let data = ${_.type.value}(${g.getByOffset(`inputOffset / ${s}`)});
        ${_.setByOffset("global_idx","data")}
      }`;return`
    ${c.registerUniform("vec_size","u32").declareVariables(g,_)}
    ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
    ${y}`},f=[{type:12,data:l},...Q(t,i)];return{name:"Expand",shaderCache:{hint:`${i.length};${s}${u}`,inputDependencies:["rank"]},getShaderSource:p,getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:f})}},fh=e=>{dl(e.inputs),e.compute(cl(e.inputs),{inputs:[0]})}}),hl,mh,Q0=P(()=>{"use strict";X(),te(),re(),na(),hl=e=>{let t=e[0].dataType,r=R.size(e[0].dims),i=R.size(e[1].dims),n=i%4===0,a=s=>{let u=M("x",t,[1],4),l=M("bias",t,[1],4),p=H("y",t,[1],4),f=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],c=_=>`
      let bias${_}_offset: u32 = (global_idx * 4 + ${_}) % uniforms.bias_size;
      let bias${_} = ${l.getByOffset(`bias${_}_offset / 4`)}[bias${_}_offset % 4];`,g=n?`
      let bias = ${l.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${c(0)}${c(1)}${c(2)}${c(3)}
      let bias = ${u.type.value}(bias0, bias1, bias2, bias3);`;return`${s.registerUniforms(f).declareVariables(u,l,p)}

    ${Bn(ze(t))}

    ${s.mainStart(Ht)}
      ${s.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${u.getByOffset("global_idx")};
      ${g}
      let x_in = x + bias;
      ${p.setByOffset("global_idx",Mn("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${n}`,inputDependencies:["type","type"]},getShaderSource:a,getRunData:s=>({outputs:[{dims:s[0].dims,dataType:s[0].dataType}],programUniforms:[{type:12,data:Math.ceil(r/4)},{type:12,data:i}],dispatchGroup:{x:Math.ceil(r/Ht/4)}})}},mh=e=>{e.inputs.length<2||R.size(e.inputs[1].dims)===0?Mc(e):e.compute(hl(e.inputs))}}),fl,ml,gh,yh,Z0=P(()=>{"use strict";X(),te(),ve(),re(),fl=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},ml=(e,t)=>{let r=e[0].dims,i=e[1].dims,n=r.length,a=R.normalizeAxis(t.axis,n),s=r.slice(0);s.splice(a,1,...i);let u=r[a],l=e[0].dataType===9?4:1,p=Math.ceil(R.size(s)/l),f=[{type:12,data:p},{type:6,data:u},{type:12,data:a},...Q(e[0].dims,e[1].dims,s)],c=g=>{let _=M("data",e[0].dataType,e[0].dims.length,l),y=M("inputIndices",e[1].dataType,e[1].dims.length),$=H("output",e[0].dataType,s.length,l),S=w=>{let I=i.length,T=`var indicesIndices${w}  = ${y.type.indices}(0);`;for(let E=0;E<I;E++)T+=`${I>1?`indicesIndices${w}[${E}]`:`indicesIndices${w}`} = ${s.length>1?`outputIndices${w}[uniforms.axis + ${E}]`:`outputIndices${w}`};`;T+=`
          var idx${w} = ${y.getByIndices(`indicesIndices${w}`)};
          if (idx${w} < 0) {
            idx${w} = idx${w} + uniforms.axisDimLimit;
          }
          var dataIndices${w} : ${_.type.indices};
        `;for(let E=0,z=0;E<n;E++)E===a?(T+=`${n>1?`dataIndices${w}[${E}]`:`dataIndices${w}`} = u32(idx${w});`,z+=I):(T+=`${n>1?`dataIndices${w}[${E}]`:`dataIndices${w}`} = ${s.length>1?`outputIndices${w}[${z}]`:`outputIndices${w}`};`,z++);return T},v;if(e[0].dataType===9){let w=(I,T,E="")=>`
          let outputIndices${T} = ${$.offsetToIndices(`outputOffset + ${T}u`)};
          ${S(T)};
          let offset${T} = ${_.indicesToOffset(`dataIndices${T}`)};
          let index${T} = offset${T} / 4u;
          let component${T} = offset${T} % 4u;
          ${I}[${T}] = ${E}(${_.getByOffset(`index${T}`)}[component${T}]);
        `;v=`
        let outputOffset = global_idx * ${l};
        var value = vec4<u32>(0);
        ${w("value",0,"u32")}
        ${w("value",1,"u32")}
        ${w("value",2,"u32")}
        ${w("value",3,"u32")}
        ${$.setByOffset("global_idx","value")}
      `}else v=`
      let outputIndices = ${$.offsetToIndices("global_idx")};
      ${S("")};
      let value = ${_.getByIndices("dataIndices")};
      ${$.setByOffset("global_idx","value")};
      `;return`
      ${g.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(_,y,$)}
      ${g.mainStart()}
        ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${v}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:f}),getShaderSource:c}},gh=e=>fe({axis:e.axis}),yh=(e,t)=>{let r=e.inputs;fl(r),e.compute(ml(e.inputs,t))}}),gl,_h,wh,Y0=P(()=>{"use strict";X(),te(),re(),gl=(e,t,r,i,n,a,s,u,l)=>{let p=[{type:12,data:a},{type:12,data:i},{type:12,data:n},{type:12,data:r},{type:12,data:s},{type:12,data:u},{type:12,data:l}],f=[a];p.push(...Q(t.dims,f));let c=g=>{let _=M("indices_data",t.dataType,t.dims.length),y=H("input_slice_offsets_data",12,1,1),$=[_,y],S=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:n.length},{name:"sizes_from_slice_dims_data",type:"u32",length:r.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${g.registerUniforms(S).declareVariables(...$)}
  ${g.mainStart()}
    ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let batch_idx = global_idx / uniforms.num_slices_per_batch;
    let base_offset = batch_idx * uniforms.input_batch_stride;

    let slice_indices_base_offset = global_idx * uniforms.num_slice_dims;
    var relative_slice_offset = 0;
    for (var dim_idx = 0u; dim_idx < uniforms.num_slice_dims; dim_idx ++) {
      var index = i32(indices_data[dim_idx + slice_indices_base_offset].x);
      let input_dim_idx = uniforms.batch_dims + dim_idx;
      if (index < 0) {
        ${n.length===1?"index += i32(uniforms.input_dims);":"index += i32(uniforms.input_dims[input_dim_idx]);"}
      }
      ${r.length===1?"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data);":"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data[dim_idx]);"}
    }

    input_slice_offsets_data[global_idx] =  base_offset + u32(relative_slice_offset);
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${n.length}_${r.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:f,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:p}),getShaderSource:c},{inputs:[t],outputs:[-1]})[0]},_h=(e,t)=>{let r=e.inputs,i=r[0].dims,n=r[0].dataType,a=r[1].dims,s=a[a.length-1],u=R.sizeToDimension(a,a.length-1),l=R.sizeFromDimension(i,t.batchDims+s),p=R.sizeToDimension(i,t.batchDims),f=R.sizeFromDimension(i,t.batchDims),c=u/p,g=new Array(s),_=l;for(let T=0;T<s;++T)g[s-1-T]=_,_*=i[t.batchDims+s-1-T];let y=gl(e,r[1],g,t.batchDims,i,u,c,f,s),$=t.batchDims+s;if($>i.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let S=a.slice(0,-1).concat(i.slice($)),v=R.size(S),w=[{type:12,data:v},{type:12,data:l},...Q(r[0].dims,y.dims,S)],I=T=>{let E=M("data",r[0].dataType,r[0].dims.length),z=M("slice_offsets",12,y.dims.length),O=H("output",r[0].dataType,S.length);return`
          ${T.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(E,z,O)}
            ${T.mainStart()}
            ${T.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:S,dataType:n}],dispatchGroup:{x:Math.ceil(v/64)},programUniforms:w}),getShaderSource:I},{inputs:[r[0],y]})},wh=e=>({batchDims:e.batch_dims,cacheKey:""})}),yl,_l,bh,$h,X0=P(()=>{"use strict";X(),te(),ve(),re(),yl=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let r=R.normalizeAxis(t.quantizeAxis,e[0].dims.length),i=t.blockSize,n=e[0],a=e[2],s=e.length===4?e[3]:void 0;if(a.dims.length!==n.dims.length||!n.dims.map((u,l)=>l===r?Math.ceil(u/i)===a.dims[l]:u===a.dims[l]).reduce((u,l)=>u&&l,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(s){if(s.dataType!==n.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(s.dims.length!==a.dims.length||!s.dims.map((u,l)=>u===a.dims[l]).reduce((u,l)=>u&&l,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},_l=(e,t)=>{let r=e[0].dims,i=e[1].dims,n=r.length,a=R.normalizeAxis(t.gatherAxis,n),s=R.normalizeAxis(t.quantizeAxis,n),u=r.slice(0);u.splice(a,1,...i);let l=R.size(u),p=e[2].dataType,f=e[0].dataType===22,c=[{type:12,data:l},{type:12,data:s},{type:12,data:a},{type:12,data:t.blockSize},...Q(...e.map((_,y)=>_.dims),u)],g=_=>{let y=M("data",e[0].dataType,e[0].dims.length),$=M("inputIndices",e[1].dataType,e[1].dims.length),S=M("scales",e[2].dataType,e[2].dims.length),v=e.length>3?M("zeroPoint",e[3].dataType,e[3].dims.length):void 0,w=H("output",p,u.length),I=[y,$,S];v&&I.push(v);let T=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${_.registerUniforms(T).declareVariables(...I,w)}
        ${_.mainStart()}
        let output_indices = ${w.offsetToIndices("global_idx")};
        var indices_indices = ${$.type.indices}(0);
        ${i.length>1?`
          for (var i: u32 = 0; i < ${i.length}; i++) {
            let index = ${w.indicesGet("output_indices","uniforms.gather_axis + i")};
            ${$.indicesSet("indices_indices","i","index")};
          }`:`indices_indices = ${w.indicesGet("output_indices","uniforms.gather_axis")};`};
        var data_indices = ${y.type.indices}(0);
        for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
          let index = ${w.indicesGet("output_indices","i")};
          ${y.indicesSet("data_indices","i","index")};
        }
        var index_from_indices = ${$.getByIndices("indices_indices")};
        if (index_from_indices < 0) {
          index_from_indices += ${r[a]};
        }
        ${y.indicesSet("data_indices","uniforms.gather_axis","u32(index_from_indices)")};
        for (var i = uniforms.gather_axis + 1; i < ${u.length}; i++) {
          let index = ${w.indicesGet("output_indices",`i + ${i.length} - 1`)};
          ${y.indicesSet("data_indices","i","index")};
        }
        let data_offset = ${y.indicesToOffset("data_indices")};
        let data_index = data_offset % 8;
        // Convert 4-bit packed data to 8-bit packed data.
        let packed_4bit_quantized_data = ${y.getByOffset("data_offset / 8")};
        let packed_8bit_quantized_data = (packed_4bit_quantized_data >> (4 * (data_index % 2))) & 0x0f0f0f0f;
        let quantized_data_vec = ${f?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_quantized_data));
        let quantized_data = quantized_data_vec[data_index / 2];
        var scale_indices = data_indices;
        let quantize_axis_index = ${S.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
        ${S.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
        var scale = ${S.getByIndices("scale_indices")};
        ${v?`
              let zero_point_indices = scale_indices;
              let zero_point_offset = ${v.indicesToOffset("zero_point_indices")};
              let zero_point_index = zero_point_offset % 8;
              let packed_4bit_zero_points = ${v.getByOffset("zero_point_offset / 8")};
              let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
              let zero_point_vec = ${f?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${ze(p)}(quantized_data - zero_point) * scale;
        ${w.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((_,y)=>y!==1).map(_=>_.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(_,y)=>"rank")},getRunData:()=>({outputs:[{dims:u,dataType:p}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:c}),getShaderSource:g}},bh=(e,t)=>{let r=e.inputs;yl(r,t),e.compute(_l(e.inputs,t))},$h=e=>fe({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),wl,bl,vh,xh,J0=P(()=>{"use strict";X(),te(),ve(),re(),wl=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},bl=(e,t)=>{let r=e[0].dims,i=e[0].dataType,n=r.length,a=e[1].dims,s=e[1].dataType,u=R.normalizeAxis(t.axis,n),l=r[u],p=a.slice(0),f=R.size(p),c=M("input",i,n),g=M("indicesInput",s,a.length),_=H("output",i,p.length),y=[{type:12,data:f},{type:6,data:l},{type:12,data:u}];return y.push(...Q(r,a,p)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:p,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:y}),getShaderSource:$=>`
      ${$.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(c,g,_)}
      ${$.mainStart()}
      ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

      let outputIndices = ${_.offsetToIndices("global_idx")};

      var idx = ${g.getByOffset("global_idx")};
      if (idx < 0) {
        idx = idx + uniforms.axisDimLimit;
      }
      var inputIndices = ${c.type.indices}(outputIndices);
      ${c.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
      let value = ${c.getByIndices("inputIndices")};

      ${_.setByOffset("global_idx","value")};
  }`}},vh=e=>fe({axis:e.axis}),xh=(e,t)=>{let r=e.inputs;wl(r),e.compute(bl(e.inputs,t))}}),$l,vl,Sh,Th,ey=P(()=>{"use strict";X(),te(),re(),$l=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},vl=(e,t)=>{let r=e[0].dims.slice(),i=e[1].dims.slice(),[n,a,s]=vp.getShapeOfGemmResult(r,t.transA,i,t.transB,e.length===3?e[2].dims:void 0),u=[n,a];if(!u)throw new Error("Can't use gemm on the given tensors");let l=16,p=Math.ceil(a/l),f=Math.ceil(n/l),c=!0,g=R.size(u),_=[{type:12,data:c?p:g},{type:12,data:n},{type:12,data:a},{type:12,data:s},{type:1,data:t.alpha},{type:1,data:t.beta}],y=["type","type"];e.length===3&&(_.push(...Q(e[2].dims)),y.push("rank")),_.push(...Q(u));let $=v=>{let w="";t.transA&&t.transB?w="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?w="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?w="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(w="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let I=t.alpha===1?"":"value *= uniforms.alpha;",T=M("a",e[0].dataType,e[0].dims),E=M("b",e[1].dataType,e[1].dims),z=T.type.value,O=null,x=[T,E];e.length===3&&(O=M("c",e[2].dataType,e[2].dims.length),x.push(O));let D=H("output",e[0].dataType,u.length);x.push(D);let W=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${v.registerUniforms(W).declareVariables(...x)}

  ${v.mainStart()}
    ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${z}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${w}
    }

    ${I}
    ${O!=null?`let cOffset = ${O.broadcastedIndicesToOffset("vec2(m, n)",D)}; value += ${z}(uniforms.beta) * ${O.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},S=v=>{let w=M("a",e[0].dataType,e[0].dims),I=M("b",e[1].dataType,e[1].dims),T=null,E=[w,I];e.length===3&&(T=M("c",e[2].dataType,e[2].dims.length),E.push(T));let z=H("output",e[0].dataType,u.length);E.push(z);let O=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],x="",D="";t.transA&&t.transB?(D=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${I.type.value}(0);
      }
      `,x="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(D=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${I.type.value}(0);
      }
      `,x="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(D=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${I.type.value}(0);
      }
      `,x="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(D=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${w.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${I.type.value}(0);
      }
      `,x="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let W=t.alpha===1?"":"value *= uniforms.alpha;";return`
  ${v.registerUniforms(O).declareVariables(...E)}
  var<workgroup> tile_a: array<array<${w.type.storage}, ${l}>, ${l}>;
  var<workgroup> tile_b: array<array<${I.type.storage}, ${l}>, ${l}>;
  ${v.mainStart([l,l,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${l};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${l};
    let num_tiles = (uniforms.K - 1) / ${l} + 1;
    var k_start = 0u;
    var value = ${z.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${D}
      k_start = k_start + ${l};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${l}; k++) {
        ${x}
      }
      workgroupBarrier();
    }

    ${W}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${T!=null?`let cOffset = ${T.broadcastedIndicesToOffset("vec2(m, n)",z)}; value += ${z.type.value}(uniforms.beta) * ${T.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return c?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:u,dataType:e[0].dataType}],dispatchGroup:{x:p*f},programUniforms:_}),getShaderSource:S}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:u,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:_}),getShaderSource:$}},Sh=e=>{let t=e.transA,r=e.transB,i=e.alpha,n=e.beta;return{transA:t,transB:r,alpha:i,beta:n,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},Th=(e,t)=>{$l(e.inputs),e.compute(vl(e.inputs,t))}}),et,at,St,Tt,xl,Sl,Tl,kl,Il,El,zl,Cl,kh,Ih,ty=P(()=>{"use strict";X(),te(),ve(),re(),[et,at,St,Tt]=[0,1,2,3],xl=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},Sl=`
  fn gs_get_cubic_coeffs(x: f32) -> vec4<f32> {
    let cubic_alpha = -0.75f;
    let x_abs = abs(x);
    var coeffs: vec4<f32>;
    coeffs[0] = (((cubic_alpha * (x_abs + 1) - 5 * cubic_alpha) * (x_abs + 1) + 8 * cubic_alpha) * (x_abs + 1) - 4 * cubic_alpha);
    coeffs[1] = (((cubic_alpha + 2) * x_abs - (cubic_alpha + 3)) * x_abs * x_abs + 1);
    coeffs[2] = (((cubic_alpha + 2) * (1 - x_abs) - (cubic_alpha + 3)) * (1 - x_abs) * (1 - x_abs) + 1);
    coeffs[3] = (((cubic_alpha * (2 - x_abs) - 5 * cubic_alpha) * (2 - x_abs) + 8 * cubic_alpha) * (2 - x_abs) - 4 * cubic_alpha);
    return coeffs;
  }
`,Tl=e=>`
  fn gs_bicubic_interpolate(p: mat4x4<${e}>, x: f32, y: f32) -> ${e} {
    var v: vec4<f32>;
    var coeffs = gs_get_cubic_coeffs(x);
    for (var i = 0; i < 4; i++) {
      v[i] = coeffs[0] * p[i][0] + coeffs[1] * p[i][1] + coeffs[2] * p[i][2] + coeffs[3] * p[i][3];
    }
    coeffs = gs_get_cubic_coeffs(y);
    let pixel = ${e}(coeffs[0] * v[0] + coeffs[1] * v[1] + coeffs[2] * v[2] + coeffs[3] * v[3]);
    return pixel;
  }
`,kl=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,Il=e=>`
  ${e.paddingMode==="reflection"?`
      fn gs_reflect(x: i32, x_min: f32, x_max: f32) -> u32 {
        var dx = 0.0;
        var fx = f32(x);
        let range = x_max - x_min;
        if (fx < x_min) {
          dx = x_min - fx;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_min + r;
          } else {
            fx = x_max - r;
          }
        } else if (fx > x_max) {
          dx = fx - x_max;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_max - r;
          } else {
            fx = x_min + r;
          }
        }
        return u32(fx);
      }`:""}
`,El=(e,t,r)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${et}] = batch;
     indices[${at}] = channel;`+(()=>{switch(r.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${St}] = u32(r);
            indices[${Tt}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${St}] = u32(clamp(r, 0, H - 1));
          indices[${Tt}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${St}] = gs_reflect(r, border[1], border[3]);
          indices[${Tt}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${r.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,zl=(e,t,r)=>(()=>{switch(r.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${et}], indices[${at}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${et}], indices[${at}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${et}], indices[${at}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${et}], indices[${at}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${et}], indices[${at}], border);

          let dx2 = ${t}(f32(x2) - x);
          let dx1 = ${t}(x - f32(x1));
          let dy2 = ${t}(f32(y2) - y);
          let dy1 = ${t}(y - f32(y1));
          let result = dy2 * (dx2 * p11 + dx1 * p12) + dy1 * (dx2 * p21 + dx1 * p22);
        `;case"bicubic":return`
          let x0 = i32(floor(x)) - 1;
          let y0 = i32(floor(y)) - 1;
          var p: mat4x4<${t}>;
          for (var h = 0; h < 4; h++) {
            for (var w = 0; w < 4; w++) {
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${et}], indices[${at}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${r.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,Cl=(e,t)=>{let r=M("x",e[0].dataType,e[0].dims.length),i=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],n=M("grid",e[1].dataType,i.length,2),a=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(a=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[et,at,St,Tt]=[0,3,1,2]);let s=H("output",e[0].dataType,a.length),u=r.type.value,l=R.size(a),p=[{type:12,data:l},...Q(e[0].dims,i,a)],f=c=>`
  ${c.registerUniform("output_size","u32").declareVariables(r,n,s)}
  ${Sl}
  ${Tl(u)}
  ${kl(t)}
  ${Il(t)}
  ${El(r,u,t)}

  ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${St}]);
      let W_in = i32(uniforms.x_shape[${Tt}]);

      ${t.alignCorners===0?`
      let x_min = -0.5;
      let x_max = f32(W_in) - 0.5;
      let y_min = -0.5;
      let y_max = f32(H_in) - 0.5;
      `:`
      let x_min = 0.0;
      let x_max = f32(W_in) - 1.0;
      let y_min = 0.0;
      let y_max = f32(H_in) - 1.0;
      `};
      let border = vec4<f32>(x_min, y_min, x_max, y_max);

      let indices = ${s.offsetToIndices("global_idx")};
      var grid_indices = vec3<u32>(indices[${et}], indices[${St}], indices[${Tt}]);
      let nxy = ${n.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${zl(s,u,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:c=>{let g=R.size(a);return{outputs:[{dims:a,dataType:c[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:p}},getShaderSource:f}},kh=(e,t)=>{xl(e.inputs),e.compute(Cl(e.inputs,t))},Ih=e=>fe({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),Ce,Al,Eh,un,Ol,cr,zh,Ch=P(()=>{"use strict";X(),te(),ve(),ea(),ia(),re(),_t(),Ce=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,Al=(e,t)=>{let r=e[0],i=Ce(e,1),n=Ce(e,2),a=Ce(e,3),s=Ce(e,4),u=Ce(e,5),l=Ce(e,6),p=Ce(e,7);if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let f=r.dims[0],c=r.dims[1],g=r.dims.length===3?r.dims[2]:t.numHeads*r.dims[4],_=c,y=0,$=0,S=Math.floor(g/t.numHeads);if(l&&p&&R.size(l.dims)&&R.size(p.dims)){if(l.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(l.dims[0]!==f||l.dims[1]!==t.numHeads||l.dims[3]!==S)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(p.dims[0]!==f||p.dims[1]!==t.numHeads||p.dims[3]!==S)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(l.dims[2]!==p.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(p.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');y=l.dims[2],$=l.dims[2]}else if(l&&R.size(l.dims)||p&&R.size(p.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let v;if(i&&R.size(i.dims)>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(i.dims[2]!==r.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');v=2,_=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==S)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(n)throw new Error('Expect "value" be none when "key" has packed kv format.');v=5,_=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==S)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');v=0,_=i.dims[2]}}else{if(r.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(r.dims[2]!==t.numHeads||r.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');v=3}if(a&&R.size(a.dims)>0){if(a.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(i&&i.dims.length===5&&i.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let w=y+_,I=0;if(s&&R.size(s.dims)>0){I=8;let O=s.dims;throw O.length===1?O[0]===f?I=1:O[0]===3*f+2&&(I=3):O.length===2&&O[0]===f&&O[1]===w&&(I=5),I===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let T=!1,E=g;if(n&&R.size(n.dims)>0){if(n.dims.length!==3&&n.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(n.dims.length===3){if(_!==n.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');E=n.dims[2]}else{if(_!==n.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');E=n.dims[1]*n.dims[3],T=!0}}let z=!1;if(s&&R.size(s.dims)>0)throw new Error("Key padding mask is not supported");if(u&&R.size(u.dims)>0){if(u.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(u.dims[0]!==f||u.dims[1]!==t.numHeads||u.dims[2]!==c||u.dims[3]!==w)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:f,sequenceLength:c,pastSequenceLength:y,kvSequenceLength:_,totalSequenceLength:w,maxSequenceLength:$,inputHiddenSize:0,hiddenSize:g,vHiddenSize:E,headSize:S,vHeadSize:Math.floor(E/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:I,scale:t.scale,broadcastResPosBias:z,passPastInKv:T,qkvFormat:v}},Eh=e=>fe({...e}),un=fe({perm:[0,2,1,3]}),Ol=(e,t,r,i,n,a,s)=>{let u=[i,n,a],l=R.size(u),p=[{type:12,data:l},{type:12,data:s},{type:12,data:a}],f=c=>{let g=H("qkv_with_bias",t.dataType,u),_=M("qkv",t.dataType,u),y=M("bias",r.dataType,u),$=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${c.registerUniforms($).declareVariables(_,y,g)}
  ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:u,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:p}),getShaderSource:f},{inputs:[t,r],outputs:[-1]})[0]},cr=(e,t,r,i,n,a,s,u)=>{let l=a;if(s&&R.size(s.dims)>0){if(i===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return l=Ol(e,a,s,t,i,r*n,u),l=l.reshape([t,i,r,n]),r===1||i===1?l:e.compute(Ne(l,un.perm),{inputs:[l],outputs:[-1]})[0]}else return a.dims.length===3&&(l=a.reshape([t,i,r,n])),r===1||i===1?l:e.compute(Ne(l,un.perm),{inputs:[l],outputs:[-1]})[0]},zh=(e,t)=>{let r=Al(e.inputs,t),i=e.inputs[0],n=Ce(e.inputs,1),a=Ce(e.inputs,2),s=Ce(e.inputs,3),u=Ce(e.inputs,4),l=Ce(e.inputs,5),p=Ce(e.inputs,6),f=Ce(e.inputs,7);if(i.dims.length===5)throw new Error("Packed QKV is not implemented");if(n?.dims.length===5)throw new Error("Packed KV is not implemented");let c=n&&a&&n.dims.length===4&&a.dims.length===4,g=cr(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,i,s,0);if(c)return mr(e,g,n,a,u,void 0,p,f,l,r);if(!n||!a)throw new Error("key and value must be provided");let _=cr(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.headSize,n,s,r.hiddenSize),y=cr(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.vHeadSize,a,s,2*r.hiddenSize);mr(e,g,_,y,u,void 0,p,f,l,r)}}),Rl,Bl,Ml,Nl,qn,Ah,Oh,Rh=P(()=>{"use strict";X(),te(),ve(),re(),Rl=e=>{if(!e||e.length<1)throw new Error("too few inputs")},Bl=(e,t)=>{let r=[],i=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(n=>r.push(Number(n))),i=r.length),fe({numOutputs:i,axis:t.axis,splitSizes:r})},Ml=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${j("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,Nl=e=>{let t=e.length,r=[];for(let i=0;i<t;++i){let n=e[i].setByIndices("indices","input[global_idx]");t===1?r.push(n):i===0?r.push(`if (output_number == ${i}u) { ${n} }`):i===t-1?r.push(`else { ${n} }`):r.push(`else if (output_number == ${i}) { ${n} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${r.join(`
`)}
      }`},qn=(e,t)=>{let r=e[0].dims,i=R.size(r),n=e[0].dataType,a=R.normalizeAxis(t.axis,r.length),s=new Array(t.numOutputs),u=M("input",n,r.length),l=new Array(t.numOutputs),p=[],f=[],c=0,g=[{type:12,data:i}];for(let y=0;y<t.numOutputs;y++){c+=t.splitSizes[y],l[y]=c;let $=r.slice();$[a]=t.splitSizes[y],f.push($),s[y]=H(`output${y}`,n,$.length),p.push({dims:f[y],dataType:e[0].dataType})}g.push({type:12,data:l},...Q(r,...f));let _=y=>`
  ${y.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",l.length).declareVariables(u,...s)}
  ${Ml(l.length)}
  ${Nl(s)}

  ${y.mainStart()}
    ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${u.offsetToIndices("global_idx")};
    var index = ${u.indicesGet("indices",a)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${j("uniforms.size_in_split_axis","output_number - 1u",l.length)};
      ${u.indicesSet("indices",a,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:_,getRunData:()=>({outputs:p,dispatchGroup:{x:Math.ceil(i/64)},programUniforms:g})}},Ah=(e,t)=>{Rl(e.inputs);let r=e.inputs.length===1?t:Bl(e.inputs,t);e.compute(qn(e.inputs,r),{inputs:[0]})},Oh=e=>{let t=e.axis,r=e.splitSizes,i=e.numOutputs<0?r.length:e.numOutputs;if(i!==r.length)throw new Error("numOutputs and splitSizes length must be equal");return fe({axis:t,numOutputs:i,splitSizes:r})}}),Dl,Xr,Bh,Mh=P(()=>{"use strict";X(),te(),ve(),re(),Dl=(e,t)=>{let[r,i,n,a]=e,{numHeads:s,rotaryEmbeddingDim:u}=t;if(r.dims.length!==3&&r.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${r.dims.length}`);if(!R.areEqual(i.dims,[])&&!R.areEqual(i.dims,[1])&&i.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${i.dims.length}`);if(n.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${n.dims.length}`);if(a.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${a.dims.length}`);if(!R.areEqual(n.dims,a.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(u>0&&s===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let l=r.dims[0],p=r.dims[r.dims.length-2],f=n.dims[0],c=R.sizeFromDimension(r.dims,1)/p,g=u===0?n.dims[1]*2:c/s;if(u>g)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(i.dims.length===2){if(l!==i.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${i.dims[0]}`);if(p!==i.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${i.dims[1]}`)}if(g/2!==n.dims[1]&&u/2!==n.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${n.dims[1]}`);if(p>f)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported")},Xr=(e,t)=>{let{interleaved:r,numHeads:i,rotaryEmbeddingDim:n,scale:a}=t,s=e[0].dims[0],u=R.sizeFromDimension(e[0].dims,1),l=e[0].dims[e[0].dims.length-2],p=u/l,f=e[2].dims[1],c=n===0?f*2:p/i,g=new Array(s,l,p/c,c-f),_=R.computeStrides(g),y=[{type:1,data:a},{type:12,data:g},{type:12,data:_},...e[0].dims.length===3?new Array({type:12,data:[u,p,c,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[u,c,l*c,1]}):[],...Q(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],$=S=>{let v=M("input",e[0].dataType,e[0].dims.length),w=M("position_ids",e[1].dataType,e[1].dims.length),I=M("cos_cache",e[2].dataType,e[2].dims.length),T=M("sin_cache",e[3].dataType,e[3].dims.length),E=H("output",e[0].dataType,e[0].dims.length);return S.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:g.length},{name:"global_strides",type:"u32",length:_.length},{name:"input_output_strides",type:"u32",length:_.length}]),`
        ${S.declareVariables(v,w,I,T,E)}

        ${S.mainStart(Ht)}
          let half_rotary_emb_dim = uniforms.${I.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${S.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${w.broadcastedIndicesToOffset("bsnh.xy",H("",w.type.tensor,2))};
            let position_id =
                u32(${w.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${r});
            let j = i + select(half_rotary_emb_dim, 1, ${r});
            let re = ${v.getByOffset("i")} * ${I.get("position_id","bsnh[3]")} -
                ${v.getByOffset("j")} * ${T.get("position_id","bsnh[3]")};
            ${E.setByOffset("i","re")}
            let im = ${v.getByOffset("i")} * ${T.get("position_id","bsnh[3]")} +
                ${v.getByOffset("j")} * ${I.get("position_id","bsnh[3]")};
            ${E.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${E.setByOffset("k",v.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:fe({interleaved:r}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:$,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(R.size(g)/Ht)},programUniforms:y})}},Bh=(e,t)=>{Dl(e.inputs,t),e.compute(Xr(e.inputs,t))}}),Pl,Ul,ln,ql,Nh,ry=P(()=>{"use strict";ve(),X(),ia(),Ch(),Rh(),_t(),Mh(),re(),Pl=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let r=e[0],i=e[1],n=e[2],a=e[3],s=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let u=!1,l=r.dims[0],p=r.dims[1],f=r.dims.length===3?u?r.dims[2]/3:r.dims[2]:t.numHeads*r.dims[4],c=p,g=0,_=!i||i.dims.length===0,y=Math.floor(_?f/(t.numHeads+2*t.kvNumHeads):f/t.numHeads);_&&(f=y*t.numHeads);let $=a&&a.dims.length!==0,S=s&&s.dims.length!==0;if($&&a.dims.length===4&&a.dims[0]===l&&a.dims[1]!==t.kvNumHeads&&a.dims[2]===t.kvNumHeads&&a.dims[3]===y)throw new Error("BSNH pastKey/pastValue is not supported");if($&&S){if(a.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');g=a.dims[2]}else if($||S)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let v=1;if(i&&i.dims.length>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(i.dims.length<3||i.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==i.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(i.dims.length===3){if(r.dims[2]%i.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');c=i.dims[1]}else if(i.dims.length===5){if(i.dims[2]!==t.numHeads||i.dims[3]!==2||i.dims[4]!==y)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(n)throw new Error('Expect "value" be none when "key" has packed kv format.');c=i.dims[1]}else{if(i.dims[1]!==t.numHeads||i.dims[3]!==y)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');c=i.dims[2]}}else{if(r.dims.length!==3&&r.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(r.dims.length===5&&(r.dims[2]!==t.numHeads||r.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');v=3}let w=0,I=!1,T=t.kvNumHeads?y*t.kvNumHeads:f;if(n&&n.dims.length>0){if(n.dims.length!==3&&n.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(n.dims.length===3){if(c!==n.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');T=n.dims[2]}else{if(c!==n.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');T=n.dims[1]*n.dims[3],I=!0}}let E=e.length>4?e[5]:void 0;if(E&&E.dims.length!==1&&E.dims[0]!==l)throw new Error('Input "seqlens" is expected to have 1 dimension and the same dim 0 as batch_size');return{batchSize:l,sequenceLength:p,pastSequenceLength:g,kvSequenceLength:c,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:f,vHiddenSize:T,headSize:y,vHeadSize:Math.floor(T/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:w,scale:t.scale,broadcastResPosBias:!1,passPastInKv:I,qkvFormat:v}},Ul=fe({perm:[0,2,1,3]}),ln=(e,t,r)=>{let i=t,n=r.kvNumHeads;return t.dims.length===3&&r.kvSequenceLength!==0&&(i=t.reshape([r.batchSize,r.kvSequenceLength,n,r.headSize]),i=e.compute(Ne(i,Ul.perm),{inputs:[i],outputs:[-1]})[0]),i},ql=(e,t,r,i)=>{let n=7,a=["type","type"],s=[e*t],u=e*t,l=[{type:12,data:u},{type:12,data:t},{type:12,data:e}],p=f=>{let c=M("seq_lens",r.dataType,r.dims),g=M("total_seq_lens",i.dataType,i.dims),_=H("pos_ids",n,s),y=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
  ${f.registerUniforms(y).declareVariables(c,g,_)}
  ${f.mainStart()}
    ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let total_sequence_length = u32(${g.getByOffset("0")});
    let is_subsequent_prompt = uniforms.sequence_length > 1 && uniforms.sequence_length != total_sequence_length;
    let is_first_prompt = !is_subsequent_prompt && uniforms.sequence_length == total_sequence_length;
    let batch_idx = global_idx / uniforms.sequence_length;
    let sequence_idx = i32(global_idx % uniforms.sequence_length);
    var pos_id: i32 = 0;
    let seqlen = ${c.getByOffset("batch_idx")};
    let total_seqlen = seqlen + 1;
    if (is_first_prompt) {
      if (sequence_idx < total_seqlen) {
        pos_id = sequence_idx;
      } else {
        pos_id = 1;
      }
      ${_.setByOffset("global_idx","pos_id")}
    } else if (is_subsequent_prompt) {
      let past_seqlen = total_seqlen - i32(uniforms.sequence_length);
      if (past_seqlen + sequence_idx < total_seqlen) {
        pos_id = past_seqlen + sequence_idx;
      } else {
        pos_id = 1;
      }
      ${_.setByOffset("global_idx","pos_id")}
    } else if (global_idx < uniforms.batch_size) {
      ${_.setByOffset("global_idx","seqlen")}
    };
  }
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:a},getRunData:()=>({outputs:[{dims:s,dataType:n}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l}),getShaderSource:p}},Nh=(e,t)=>{let r=Pl(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(e.inputs[1]?.dims.length===5)throw new Error("Packed KV is not implemented");let i=e.inputs[0],n=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,a=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,s=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,u=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,l=e.inputs.length>4?e.inputs[5]:void 0,p=e.inputs.length>5?e.inputs[6]:void 0,f=r.kvNumHeads?r.kvNumHeads:r.numHeads,c=fe({axis:2,numOutputs:3,splitSizes:[r.numHeads*r.headSize,f*r.headSize,f*r.headSize]}),[g,_,y]=!n&&!a?e.compute(qn([i],c),{inputs:[i],outputs:[-1,-1,-1]}):[i,n,a],$,S;if(t.doRotary){let T=e.compute(ql(r.batchSize,r.sequenceLength,l,p),{inputs:[l,p],outputs:[-1]})[0],E=e.inputs[7],z=e.inputs[8],O=fe({interleaved:t.rotaryInterleaved!==0,numHeads:r.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),x=[g,T,E,z],D=[-1];$=e.compute(Xr(x,O),{inputs:x,outputs:D})[0],x.splice(0,1,_);let W=fe({interleaved:t.rotaryInterleaved!==0,numHeads:r.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});S=e.compute(Xr(x,W),{inputs:x,outputs:D})[0]}let v=cr(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,t.doRotary?$:g,void 0,0),w=ln(e,t.doRotary?S:_,r),I=ln(e,y,r);mr(e,v,w,I,void 0,void 0,s,u,void 0,r,l,p)}}),dn,Wl,Ll,Dh,iy=P(()=>{"use strict";X(),te(),_t(),re(),dn=(e,t,r,i,n,a,s,u)=>{let l=$e(a),p=l===1?"f32":`vec${l}f`,f=l===1?"vec2f":`mat2x${l}f`,c=n*s,g=64;c===1&&(g=256);let _=[n,s,a/l],y=[n,s,2],$=["rank","type","type"],S=[];S.push(...Q(_,y));let v=w=>{let I=M("x",t.dataType,3,l),T=M("scale",r.dataType,r.dims),E=M("bias",i.dataType,i.dims),z=H("output",1,3,2),O=[I,T,E,z];return`
  var<workgroup> workgroup_shared : array<${f}, ${g}>;
  const workgroup_size = ${g}u;
  ${w.declareVariables(...O)}
  ${w.mainStart(g)}
    let batch = workgroup_index / uniforms.x_shape[1];
    let channel = workgroup_index % uniforms.x_shape[1];
    let hight = uniforms.x_shape[2];
    // initialize workgroup memory
    var sum = ${p}(0);
    var squared_sum = ${p}(0);
    for (var h = local_idx; h < hight; h += workgroup_size) {
      let value = ${p}(${I.get("batch","channel","h")});
      sum += value;
      squared_sum += value * value;
    }
    workgroup_shared[local_idx] = ${f}(sum, squared_sum);
    workgroupBarrier();

    for (var currSize = workgroup_size >> 1;  currSize > 0; currSize = currSize >> 1) {
      if (local_idx < currSize) {
        workgroup_shared[local_idx] = workgroup_shared[local_idx] + workgroup_shared[local_idx + currSize];
      }
      workgroupBarrier();
    }
    if (local_idx == 0) {
      let sum_final = ${yt("workgroup_shared[0][0]",l)} / f32(hight * ${l});
      let squared_sum_final = ${yt("workgroup_shared[0][1]",l)} / f32(hight * ${l});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${u}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${l};${u};${g}`,inputDependencies:$},getRunData:()=>({outputs:[{dims:y,dataType:1}],dispatchGroup:{x:c},programUniforms:S}),getShaderSource:v},{inputs:[t,r,i],outputs:[-1]})[0]},Wl=(e,t,r)=>{let i=t[0].dims,n=i,a=2,s=i[0],u=i[1],l=R.sizeFromDimension(i,a),p=$e(l),f=R.size(n)/p,c=dn(e,t[0],t[1],t[2],s,l,u,r.epsilon),g=[s,u,l/p],_=[s,u],y=["type","none"],$=S=>{let v=M("x",t[0].dataType,g.length,p),w=M("scale_shift",1,_.length,2),I=H("output",t[0].dataType,g.length,p),T=[v,w,I];return`
  ${S.registerUniform("output_size","u32").declareVariables(...T)}
  ${S.mainStart()}
  ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${I.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${w.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${v.getByOffset("global_idx")} * ${I.type.value}(scale_shift.x) + ${I.type.value}(scale_shift.y);
      ${I.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${p}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:n,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:[{type:12,data:f},...Q(g,_,g)]}),getShaderSource:$},{inputs:[t[0],c]})},Ll=(e,t,r)=>{let i=t[0].dims,n=i,a=i[0],s=i[i.length-1],u=R.sizeFromDimension(i,1)/s,l=$e(s),p=R.size(n)/l,f=[{type:12,data:u},{type:12,data:Math.floor(s/l)}],c=["type","type"],g=!1,_=[0,i.length-1];for(let v=0;v<i.length-2;v++)g=g||i[v+1]!==1,_.push(v+1);g=g&&i[i.length-1]!==1;let y=g?e.compute(Ne(e.inputs[0],_),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:i.length},(v,w)=>i[_[w]])),$=dn(e,y,t[1],t[2],a,u,s,r.epsilon),S=v=>{let w=ke(t[0].dataType),I=l===1?"vec2f":`mat${l}x2f`,T=O=>{let x=O===0?"x":"y",D=l===1?"f32":`vec${l}f`;switch(l){case 1:return`${w}(${D}(scale.${x}))`;case 2:return`vec2<${w}>(${D}(scale[0].${x}, scale[1].${x}))`;case 4:return`vec4<${w}>(${D}(scale[0].${x}, scale[1].${x}, scale[2].${x}, scale[3].${x}))`;default:throw new Error(`Not supported compoents ${l}`)}},E=M("input",t[0].dataType,t[0].dims,l),z=H("output",t[0].dataType,n,l);return`
  @group(0) @binding(0) var<storage, read> input : array<${E.type.storage}>;
  @group(0) @binding(1) var<storage, read> scale_input : array<${I}>;
  @group(0) @binding(2) var<storage, read_write> output : array<${z.type.storage}>;
  struct Uniforms {H: u32, C : u32};
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;

  ${v.mainStart()}
    let current_image_number = global_idx / (uniforms.C * uniforms.H);
    let current_channel_number = global_idx % uniforms.C;

    let scale_offset = current_image_number * uniforms.C + current_channel_number;
    let scale = scale_input[scale_offset];
    output[global_idx] = fma(input[global_idx], ${T(0)}, ${T(1)});
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${l}`,inputDependencies:c},getRunData:()=>({outputs:[{dims:n,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(p/64)},programUniforms:f}),getShaderSource:S},{inputs:[t[0],$]})},Dh=(e,t)=>{t.format==="NHWC"?Ll(e,e.inputs,t):Wl(e,e.inputs,t)}}),Vl,Gl,Ph,ny=P(()=>{"use strict";X(),te(),re(),Vl=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},Gl=(e,t,r)=>{let i=t.simplified,n=e[0].dims,a=e[1],s=!i&&e[2],u=n,l=R.normalizeAxis(t.axis,n.length),p=R.sizeToDimension(n,l),f=R.sizeFromDimension(n,l),c=R.size(a.dims),g=s?R.size(s.dims):0;if(c!==f||s&&g!==f)throw new Error(`Size of X.shape()[axis:] == ${f}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${c} and bias size of ${g}`);let _=[];for(let E=0;E<n.length;++E)E<l?_.push(n[E]):_.push(1);let y=$e(f),$=["type","type"],S=[{type:12,data:p},{type:1,data:f},{type:12,data:Math.floor(f/y)},{type:1,data:t.epsilon}];s&&$.push("type");let v=r>1,w=r>2,I=E=>{let z=ke(e[0].dataType),O=[M("x",e[0].dataType,e[0].dims,y),M("scale",a.dataType,a.dims,y)];s&&O.push(M("bias",s.dataType,s.dims,y)),O.push(H("output",e[0].dataType,u,y)),v&&O.push(H("mean_data_output",1,_)),w&&O.push(H("inv_std_output",1,_));let x=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${E.registerUniforms(x).declareVariables(...O)}
  ${E.mainStart()}
    ${E.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${An("f32",y)};
    var mean_square_vector = ${An("f32",y)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${Vt(z,y,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${yt("mean_vector",y)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${yt("mean_square_vector",y)} / uniforms.norm_size ${i?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${Vt(z,y,"x[j + offset]")};
      let f32scale = ${Vt(z,y,"scale[j]")};
      output[j + offset] = ${O[0].type.value}((f32input ${i?"":"- mean"}) * inv_std_dev * f32scale
        ${s?`+ ${Vt(z,y,"bias[j]")}`:""}
      );
    }

    ${v?"mean_data_output[global_idx] = mean":""};
    ${w?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},T=[{dims:u,dataType:e[0].dataType}];return v&&T.push({dims:_,dataType:1}),w&&T.push({dims:_,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${y};${r};${i}`,inputDependencies:$},getRunData:()=>({outputs:T,dispatchGroup:{x:Math.ceil(p/64)},programUniforms:S}),getShaderSource:I}},Ph=(e,t)=>{Vl(e.inputs),e.compute(Gl(e.inputs,t,e.outputCount))}}),Hl,Uh,ay=P(()=>{"use strict";te(),ua(),la(),Hl=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},Uh=e=>{Hl(e.inputs);let t=Gt.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let r=t[t.length-1],i=e.inputs[0].dims[e.inputs[0].dims.length-1];if(r<8&&i<8)e.compute(oa(e.inputs,{activation:""},t));else{let n=t[t.length-2],a=R.size(e.inputs[0].dims.slice(0,-2)),s=R.size(e.inputs[1].dims.slice(0,-2));if(a!==1&&n===1&&s===1){let u=e.inputs[0].reshape([1,a,i]),l=e.inputs[1].reshape([1,i,r]),p=[1,a,r],f=[u,l];e.compute(Yr(f,{activation:""},t,p),{inputs:f})}else e.compute(Yr(e.inputs,{activation:""},t))}}}),Fl,jl,Kl,qh,Wh,sy=P(()=>{"use strict";X(),te(),ve(),re(),Fl=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let r=e[0],i=r.dims.length;if(r.dims[i-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let n=Math.floor((t.k+t.blockSize-1)/t.blockSize),a=t.blockSize/8*t.bits,s=e[1];if(!R.areEqual(s.dims,[t.n,n,a]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let u=e[2].dims;if(R.size(u)!==t.n*n)throw new Error("scales input size error.");if(e.length===4){let l=e[3].dims,p=t.n*(t.bits===8?n:Math.floor((n*t.bits+7)/8));if(R.size(l)!==p)throw new Error("zeroPoints input size error.")}},jl=(e,t)=>{let r=e[0].dims,i=r.length,n=r[i-2],a=t.k,s=t.n,u=r.slice(0,i-2),l=R.size(u),p=e[1].dims[2]/4,f=e[0].dataType,c=$e(t.k),g=$e(p),_=$e(s),y=u.concat([n,s]),$=n>1&&s/_%2===0?2:1,S=R.size(y)/_/$,v=64,w=[],I=[l,n,a/c],T=R.convertShape(e[1].dims).slice();T.splice(-1,1,p/g),w.push(...Q(I)),w.push(...Q(T)),w.push(...Q(e[2].dims)),e.length===4&&w.push(...Q(R.convertShape(e[3].dims)));let E=[l,n,s/_];w.push(...Q(E));let z=O=>{let x=I.length,D=M("a",e[0].dataType,x,c),W=M("b",12,T.length,g),Z=M("scales",e[2].dataType,e[2].dims.length),L=[D,W,Z],K=e.length===4?M("zero_points",12,e[3].dims.length):void 0;K&&L.push(K);let se=E.length,A=H("output",e[0].dataType,se,_),U=ke(e[0].dataType),ee=(()=>{switch(c){case 1:return`array<${U}, 8>`;case 2:return`mat4x2<${U}>`;case 4:return`mat2x4<${U}>`;default:throw new Error(`${c}-component is not supported.`)}})(),Y=()=>{let N=`
          // reuse a data
            var input_offset = ${D.indicesToOffset(`${D.type.indices}(batch, row, word_offset)`)};
            var a_data: ${ee};
            for (var j: u32 = 0; j < ${8/c}; j++) {
              a_data[j] = ${D.getByOffset("input_offset")};
              input_offset++;
            }
          `;for(let V=0;V<_*$;V++)N+=`
            b_value = ${g===1?`b${V}_data`:`b${V}_data[i]`};
            b_value_lower = unpack4xU8(b_value & b_mask);
            b_value_upper = unpack4xU8((b_value >> 4) & b_mask);
            b_quantized_values = ${ee}(${Array.from({length:4},(J,de)=>`${U}(b_value_lower[${de}]), ${U}(b_value_upper[${de}])`).join(", ")});
            b_dequantized_values = ${c===1?`${ee}(${Array.from({length:8},(J,de)=>`(b_quantized_values[${de}] - ${K?`zero_point${V}`:"zero_point"}) * scale${V}`).join(", ")});`:`(b_quantized_values - ${ee}(${Array(8).fill(`${K?`zero_point${V}`:"zero_point"}`).join(",")})) * scale${V};`};
            workgroup_shared[local_id.x * ${$} + ${Math.floor(V/_)}]${_>1?`[${V%_}]`:""} += ${Array.from({length:8/c},(J,de)=>`${c===1?`a_data[${de}] * b_dequantized_values[${de}]`:`dot(a_data[${de}], b_dequantized_values[${de}])`}`).join(" + ")};
          `;return N},F=()=>{let N=`
            var col_index = col * ${_};
            ${K?`
            let zero_point_bytes_per_col = (nBlocksPerCol + 1) / 2;
            var zero_point_byte_count: u32;
            var zero_point_word_index: u32;
            var zero_point_byte_offset: u32;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            var zero_point_bits_offset: u32;
            var zero_point_word: u32;`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${U}(8);`}
            `;for(let V=0;V<_*$;V++)N+=`
            let scale${V} = ${Z.getByOffset("col_index * nBlocksPerCol + block")};
            ${K?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block >> 0x1u);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            zero_point_word = ${K.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${V} = ${U}((zero_point_word) & 0xFu);`:""}
            col_index += 1;`;return N},le=()=>{let N=`col_index = col * ${_};`;for(let V=0;V<_*$;V++)N+=`
            let b${V}_data = ${W.getByIndices(`${W.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return N+=`
            var b_value: u32;
            let b_mask: u32 = 0x0F0F0F0Fu;
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${ee};
            var b_dequantized_values: ${ee};`,N};return`
        var<workgroup> workgroup_shared: array<${A.type.value}, ${$*v}>;
        ${O.declareVariables(...L,A)}
        ${O.mainStart([v,1,1])}
          let output_indices = ${A.offsetToIndices(`(global_idx / ${v}) * ${$}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${v}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/c};
            ${F()}
            for (var word: u32 = 0; word < ${p}; word += ${g}) {
              ${le()}
              for (var i: u32 = 0; i < ${g}; i++) {
                ${Y()}
                word_offset += ${8/c};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${$}) {
            var output_value: ${A.type.value} = ${A.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${v}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${$};
            }
            ${A.setByIndices(`${A.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${c};${g};${_};${$};${v}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:y,dataType:f}],dispatchGroup:{x:S},programUniforms:w}),getShaderSource:z}},Kl=(e,t)=>{let r=e[0].dims,i=r.length,n=r[i-2],a=t.k,s=t.n,u=r.slice(0,i-2),l=R.size(u),p=e[1].dims[2]/4,f=e[0].dataType,c=$e(t.k),g=$e(p),_=u.concat([n,s]),y=128,$=s%8===0?8:s%4===0?4:1,S=y/$,v=S*g*8,w=v/c,I=v/t.blockSize,T=R.size(_)/$,E=[],z=[l,n,a/c],O=R.convertShape(e[1].dims).slice();O.splice(-1,1,p/g),E.push(...Q(z)),E.push(...Q(O)),E.push(...Q(e[2].dims)),e.length===4&&E.push(...Q(R.convertShape(e[3].dims)));let x=[l,n,s];E.push(...Q(x));let D=W=>{let Z=z.length,L=M("a",e[0].dataType,Z,c),K=M("b",12,O.length,g),se=M("scales",e[2].dataType,e[2].dims.length),A=[L,K,se],U=e.length===4?M("zero_points",12,e[3].dims.length):void 0;U&&A.push(U);let ee=x.length,Y=H("output",e[0].dataType,ee),F=ke(e[0].dataType),le=()=>{switch(c){case 1:return`
          let a_data0 = vec4<${F}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${F}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${F}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${F}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${c}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${L.type.value}, ${w}>;
        var<workgroup> inter_results: array<array<${Y.type.value}, ${S}>, ${$}>;
        ${W.declareVariables(...A,Y)}
        ${W.mainStart([S,$,1])}
          let output_indices = ${Y.offsetToIndices(`workgroup_index * ${$}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let n_blocks_per_col = uniforms.b_shape[1];
          let num_tiles =  (n_blocks_per_col - 1) / ${I} + 1;

          // Loop over shared dimension.
          for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
            let a_col_start = tile * ${w};
            // load one tile A data into shared memory.
            for (var a_offset = local_idx; a_offset < ${w}; a_offset += ${y})
            {
              let a_col = a_col_start + a_offset;
              if (a_col < uniforms.a_shape[2])
              {
                sub_a[a_offset] = ${L.getByIndices(`${L.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${L.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${I} + local_id.x;
            ${U?`
            let zero_point_bytes_per_col = (n_blocks_per_col + 1) / 2;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block >> 0x1u);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            let zero_point_word = ${U.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${F}((zero_point_word) & 0xFu);`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${F}(8);`}
            let scale = ${se.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${K.getByIndices(`${K.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/c};
            for (var i: u32 = 0; i < ${g}; i++) {
              ${le()}
              let b_value = ${g===1?"b_data":"b_data[i]"};
              let b_value_lower = unpack4xU8(b_value & 0x0F0F0F0Fu);
              let b_value_upper = unpack4xU8((b_value >> 4) & 0x0F0F0F0Fu);
              let b_quantized_values = mat2x4<${F}>(${Array.from({length:4},(N,V)=>`${F}(b_value_lower[${V}]), ${F}(b_value_upper[${V}])`).join(", ")});
              let b_dequantized_values = (b_quantized_values - mat2x4<${F}>(${Array(8).fill("zero_point").join(",")})) * scale;
              inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(N,V)=>`${`dot(a_data${V}, b_dequantized_values[${V}])`}`).join(" + ")};
              word_offset += ${8/c};
            }
            workgroupBarrier();
          }

          if (local_idx < ${$}) {
            var output_value: ${Y.type.value} = ${Y.type.value}(0);
            for (var b = 0u; b < ${S}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${Y.setByIndices(`${Y.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${c};${g};${S};${$}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:_,dataType:f}],dispatchGroup:{x:T},programUniforms:E}),getShaderSource:D}},qh=(e,t)=>{Fl(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(Kl(e.inputs,t)):e.compute(jl(e.inputs,t))},Wh=e=>fe(e)}),Ql,Zl,Yl,Xl,Jl,ed,td,rd,Lh,oy=P(()=>{"use strict";X(),te(),re(),Ql=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},Zl=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
            k = i32(${e.indicesGet("indices",n)}) - ${j("uniforms.pads",n,r)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${j("uniforms.x_shape",n,t)})) {
              break;
            }
            offset += k * i32(${j("uniforms.x_strides",n,t)});
        `;return`
          value = ${e.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${i}
            value = x[offset];
          }
      `},Yl=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
                k = i32(${e.indicesGet("indices",n)}) - ${j("uniforms.pads",n,r)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${j("uniforms.x_shape",n,t)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${j("uniforms.x_shape",n,t)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${j("uniforms.x_strides",n,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Xl=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
                k = i32(${e.indicesGet("indices",n)}) - ${j("uniforms.pads",n,r)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${j("uniforms.x_shape",n,t)})) {
                  k = i32(${j("uniforms.x_shape",n,t)}) - 1;
                }
                offset += k * i32(${j("uniforms.x_strides",n,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},Jl=(e,t,r)=>{let i="";for(let n=t-1;n>=0;--n)i+=`
                k = i32(${e.indicesGet("indices",n)}) - ${j("uniforms.pads",n,r)};
                if (k < 0)  {
                  k += i32(${j("uniforms.x_shape",n,t)}]);
                }
                if (k >= i32(${j("uniforms.x_shape",n,t)})) {
                  k -= i32(${j("uniforms.x_shape",n,t)});
                }
                offset += k * i32(${j("uniforms.x_strides",n,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${i}
              value = x[offset];
          `},ed=(e,t,r)=>{switch(r.mode){case 0:return Zl(e,t,r.pads.length);case 1:return Yl(e,t,r.pads.length);case 2:return Xl(e,t,r.pads.length);case 3:return Jl(e,t,r.pads.length);default:throw new Error("Invalid mode")}},td=(e,t)=>{let r=R.padShape(e[0].dims.slice(),t.pads),i=e[0].dims,n=R.size(r),a=[{type:12,data:n},{type:6,data:t.pads}],s=e.length>=3&&e[2].data;t.mode===0&&a.push({type:s?e[2].dataType:1,data:t.value}),a.push(...Q(e[0].dims,r));let u=["rank"],l=p=>{let f=H("output",e[0].dataType,r.length),c=M("x",e[0].dataType,i.length),g=c.type.value,_=ed(f,i.length,t),y=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&y.push({name:"constant_value",type:s?g:"f32"}),`
            ${p.registerUniforms(y).declareVariables(c,f)}
            ${p.mainStart()}
            ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${f.offsetToIndices("global_idx")};

            var value = ${g}(0);
            ${_}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${s}`,inputDependencies:u},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(R.size(r)/64)},programUniforms:a}),getShaderSource:l}},rd=(e,t)=>{if(e.length>1){let r=e[1].getBigInt64Array(),i=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,n=e[0].dims.length,a=new Int32Array(2*n).fill(0);if(e.length>=4){let u=e[3].getBigInt64Array();for(let l=0;l<u.length;l++)a[Number(u[l])]=Number(r[l]),a[Number(u[l])+n]=Number(r[l+u.length])}else r.forEach((u,l)=>a[Number(l)]=Number(u));let s=[];return a.forEach(u=>s.push(u)),{mode:t.mode,value:i,pads:s}}else return t},Lh=(e,t)=>{Ql(e.inputs);let r=rd(e.inputs,t);e.compute(td(e.inputs,r),{inputs:[0]})}}),ar,pn,cn,hn,fn,id,nd,mn,gn,Vh,Gh,yn,Hh,Fh,_n,jh,Kh,Qh,Zh,uy=P(()=>{"use strict";qe(),X(),te(),re(),ar=e=>{if(he.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},pn=(e,t,r)=>{let i=t.format==="NHWC",n=e.dims.slice();i&&n.splice(1,0,n.pop());let a=Object.hasOwnProperty.call(t,"dilations"),s=t.kernelShape.slice(),u=t.strides.slice(),l=a?t.dilations.slice():[],p=t.pads.slice();Qr.adjustPoolAttributes(r,n,s,u,l,p);let f=Qr.computePoolOutputShape(r,n,u,l,s,p,t.autoPad),c=Object.assign({},t);a?Object.assign(c,{kernelShape:s,strides:u,pads:p,dilations:l,cacheKey:t.cacheKey}):Object.assign(c,{kernelShape:s,strides:u,pads:p,cacheKey:t.cacheKey});let g=f.slice();return g.push(g.splice(1,1)[0]),[c,i?g:f]},cn=(e,t)=>{let r=t.format==="NHWC",i=R.size(e),n=R.size(t.kernelShape),a=[{type:12,data:i},{type:12,data:n}],s=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let u=t.kernelShape[t.kernelShape.length-1],l=t.strides[t.strides.length-1],p=t.pads[t.pads.length/2-1],f=t.pads[t.pads.length-1],c=!!(p+f);a.push({type:12,data:u},{type:12,data:l},{type:12,data:p},{type:12,data:f}),s.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let g=!1;if(t.kernelShape.length===2){let _=t.kernelShape[t.kernelShape.length-2],y=t.strides[t.strides.length-2],$=t.pads[t.pads.length/2-2],S=t.pads[t.pads.length-2];g=!!($+S),a.push({type:12,data:_},{type:12,data:y},{type:12,data:$},{type:12,data:S}),s.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[a,s,!0,c,g]}else{if(r)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let u=R.computeStrides(t.kernelShape);a.push({type:12,data:u},{type:12,data:t.pads},{type:12,data:t.strides}),s.push({name:"kernelStrides",type:"u32",length:u.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let l=t.pads.reduce((p,f)=>p+f);return[a,s,!!l,!1,!1]}},hn=(e,t,r,i,n,a,s,u,l,p,f,c)=>{let g=n.format==="NHWC",_=t.type.value,y=H("output",t.type.tensor,i);if(n.kernelShape.length<=2){let $="",S="",v="",w=r-(g?2:1);if(f?$=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${w}] = indices[${w}] * uniforms.sw - uniforms.pwStart + i;
                  if (xIndices[${w}] < 0 || xIndices[${w}]
                      >= uniforms.x_shape[${w}]) {
                    pad++;
                    continue;
                  }
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${a}
                }`:$=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${w}] = indices[${w}] * uniforms.sw - uniforms.pwStart + i;
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${a}
                }`,n.kernelShape.length===2){let I=r-(g?3:2);c?S=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${I}] = indices[${I}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${I}] < 0 || xIndices[${I}] >= uniforms.x_shape[${I}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:S=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${I}] = indices[${I}] * uniforms.sh - uniforms.phStart + j;
                `,v=`
              }
            `}return`
            ${e.registerUniforms(l).declareVariables(t,y)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

              let indices = ${y.offsetToIndices("global_idx")};
              var xIndices = ${y.offsetToIndices("global_idx")};

              var value = ${_}(${u});
              var pad = 0;
              ${S}
              ${$}
              ${v}
              ${s}

              output[global_idx] = value;
            }`}else{if(g)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let $=n.kernelShape.length,S=n.pads.length,v="";return p?v=`
                if (xIndices[j] >= uniforms.x_shape[j]) {
                  pad++;
                  isPad = true;
                  break;
                }
              }
              if (!isPad) {
                let x_val = x[${t.indicesToOffset("xIndices")}];
                ${a}
              }`:v=`
              }
              let x_val = x[${t.indicesToOffset("xIndices")}];
              ${a}
            `,`
            ${e.registerUniforms(l).declareVariables(t,y)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
              let indices = ${y.offsetToIndices("global_idx")};
              var xIndices = ${y.offsetToIndices("global_idx")};

              var offsets: array<u32, ${$}>;

              var value = ${_}(${u});
              var pad = 0;
              var isPad = false;

              for (var i: u32 = 0u; i < uniforms.kernelSize; i++) {
                var offset = i;
                for (var j = 0u; j < ${$-1}u; j++) {
                  offsets[j] = offset / ${j("uniforms.kernelStrides","j",$)};
                  offset -= offsets[j] * ${j("uniforms.kernelStrides","j",$)};
                }
                offsets[${$-1}] = offset;

                isPad = false;
                for (var j = ${r-$}u; j < ${r}u; j++) {
                  xIndices[j] = indices[j] * ${j("uniforms.strides",`j - ${r-$}u`,$)}
                    + offsets[j - ${r-$}u] - ${j("uniforms.pads","j - 2u",S)};
                  ${v}
              }
              ${s}

              output[global_idx] = value;
            }`}},fn=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,id=e=>`${fn(e)};${e.countIncludePad}`,nd=e=>`${fn(e)};${e.storageOrder};${e.dilations}`,mn=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),gn=(e,t,r,i)=>{let[n,a]=pn(t,i,r),s=M("x",t.dataType,t.dims.length),u=s.type.value,l="value += x_val;",p="";n.countIncludePad?p+=`value /= ${u}(uniforms.kernelSize);`:p+=`value /= ${u}(i32(uniforms.kernelSize) - pad);`;let[f,c,g,_,y]=cn(a,n);f.push(...Q(t.dims,a));let $=["rank"];return{name:e,shaderCache:{hint:`${i.cacheKey};${g};${_};${y}`,inputDependencies:$},getRunData:()=>({outputs:[{dims:a,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(R.size(a)/64)},programUniforms:f}),getShaderSource:S=>hn(S,s,t.dims.length,a.length,n,l,p,0,c,g,_,y)}},Vh=e=>{let t=e.count_include_pad!==0,r=mn(e);if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let i={countIncludePad:t,...r,cacheKey:""};return{...i,cacheKey:id(i)}},Gh=(e,t)=>{ar(e.inputs),e.compute(gn("AveragePool",e.inputs[0],!1,t))},yn={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},Hh=e=>{let t=e.format;return{format:t,...yn,cacheKey:t}},Fh=(e,t)=>{ar(e.inputs),e.compute(gn("GlobalAveragePool",e.inputs[0],!0,t))},_n=(e,t,r,i)=>{let[n,a]=pn(t,i,r),s=`
      value = max(x_val, value);
    `,u="",l=M("x",t.dataType,t.dims.length),p=["rank"],[f,c,g,_,y]=cn(a,n);return f.push(...Q(t.dims,a)),{name:e,shaderCache:{hint:`${i.cacheKey};${g};${_};${y}`,inputDependencies:p},getRunData:()=>({outputs:[{dims:a,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(R.size(a)/64)},programUniforms:f}),getShaderSource:$=>hn($,l,t.dims.length,a.length,n,s,u,t.dataType===10?-65504:-1e5,c,g,_,y)}},jh=(e,t)=>{ar(e.inputs),e.compute(_n("MaxPool",e.inputs[0],!1,t))},Kh=e=>{let t=e.storage_order,r=e.dilations,i=mn(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(i.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let n={storageOrder:t,dilations:r,...i,cacheKey:""};return{...n,cacheKey:nd(n)}},Qh=e=>{let t=e.format;return{format:t,...yn,cacheKey:t}},Zh=(e,t)=>{ar(e.inputs),e.compute(_n("GlobalMaxPool",e.inputs[0],!0,t))}}),ad,sd,Yh,Xh,ly=P(()=>{"use strict";X(),te(),ve(),re(),ad=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[0].dataType===6&&e.length>2)throw new Error("In the case of dequantizing int32 there is no zero point.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((r,i)=>r===e[2].dims[i]).reduce((r,i)=>r&&i,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((n,a)=>a===t.axis||n===e[0].dims[a]).reduce((n,a)=>n&&a,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let r=e[0].dims[t.axis],i=e[1].dims[t.axis];if(t.blockSize<Math.ceil(r/i)||t.blockSize>Math.ceil(r/(i-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},sd=(e,t)=>{let r=R.normalizeAxis(t.axis,e[0].dims.length),i=e[0].dataType,n=i===3,a=e[0].dims,s=e[1].dataType,u=R.size(a),l=i===3||i===2,p=l?[Math.ceil(R.size(e[0].dims)/4)]:e[0].dims,f=e[1].dims,c=e.length>2?e[2]:void 0,g=c?l?[Math.ceil(R.size(c.dims)/4)]:c.dims:void 0,_=f.length===0||f.length===1&&f[0]===1,y=_===!1&&f.length===1,$=$e(u),S=_&&(!l||$===4),v=S?$:1,w=S&&!l?$:1,I=M("input",l?12:i,p.length,w),T=M("scale",s,f.length),E=c?M("zero_point",l?12:i,g.length):void 0,z=H("output",s,a.length,v),O=[I,T];E&&O.push(E);let x=[p,f];c&&x.push(g);let D=[{type:12,data:u/v},{type:12,data:r},{type:12,data:t.blockSize},...Q(...x,a)],W=Z=>{let L=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${Z.registerUniforms(L).declareVariables(...O,z)}
      ${Z.mainStart()}
          ${Z.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${z.offsetToIndices("global_idx")};

          // Set input x
          ${l?`
            let input = ${I.getByOffset("global_idx / 4")};
            let x_vec = ${n?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${v===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${I.getByOffset("global_idx")};`};

          // Set scale input
          ${_?`let scale_value= ${T.getByOffset("0")}`:y?`
            let scale_index = ${z.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${T.getByOffset("scale_index")};`:`
            var scale_indices: ${T.type.indices} = output_indices;
            let index = ${T.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${T.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${T.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${E?_?l?`
                let zero_point_input = ${E.getByOffset("0")};
                let zero_point_vec =  ${n?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${E.getByOffset("0")}`:y?l?`
                let zero_point_index = ${z.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${E.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${n?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${z.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${E.getByOffset("zero_point_index")};`:l?`
                let zero_point_offset = ${T.indicesToOffset("scale_indices")};
                let zero_point_input = ${E.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${n?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${E.getByIndices("scale_indices")};`:`let zero_point_value = ${l?n?"i32":"u32":I.type.value}(0);`};
      // Compute and write output
      ${z.setByOffset("global_idx",`${z.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:E?["rank","rank","rank"]:["rank","rank"]},getShaderSource:W,getRunData:()=>({outputs:[{dims:a,dataType:s}],dispatchGroup:{x:Math.ceil(u/v/64),y:1,z:1},programUniforms:D})}},Yh=(e,t)=>{ad(e.inputs,t),e.compute(sd(e.inputs,t))},Xh=e=>fe({axis:e.axis,blockSize:e.blockSize})}),od,ud,Jh,dy=P(()=>{"use strict";qe(),X(),re(),od=(e,t,r)=>{let i=e===t,n=e<t&&r<0,a=e>t&&r>0;if(i||n||a)throw new Error("Range these inputs' contents are invalid.")},ud=(e,t,r,i)=>{let n=Math.abs(Math.ceil((t-e)/r)),a=[n],s=n,u=[{type:12,data:s},{type:i,data:e},{type:i,data:r},...Q(a)],l=p=>{let f=H("output",i,a.length),c=f.type.value,g=[{name:"outputSize",type:"u32"},{name:"start",type:c},{name:"delta",type:c}];return`
        ${p.registerUniforms(g).declareVariables(f)}
        ${p.mainStart()}
        ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${c}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${i}`},getShaderSource:l,getRunData:()=>({outputs:[{dims:a,dataType:i}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:u})}},Jh=e=>{let t=0,r=0,i=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],r=e.inputs[1].getInt32Array()[0],i=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],r=e.inputs[1].getFloat32Array()[0],i=e.inputs[2].getFloat32Array()[0]),he.webgpu.validateInputContent&&od(t,r,i),e.compute(ud(t,r,i,e.inputs[0].dataType),{inputs:[]})}}),ld,dd,ef,tf,py=P(()=>{"use strict";X(),te(),ve(),re(),ld=(e,t,r,i)=>{if(e!=="none"&&i!=="i32"&&i!=="u32"&&i!=="f32")throw new Error(`Input ${i} is not supported with reduction ${e}.`);let n=`{
                var oldValue = 0;
                loop {
                  let newValueF32 =`,a=`;
                  let newValue = bitcast<i32>(newValueF32);
                  let res = atomicCompareExchangeWeak(&${t}, oldValue, newValue);
                  if res.exchanged {
                    break;
                  }
                  oldValue = res.old_value;
                }
              }`;switch(e){case"none":return`${t}=${r};`;case"add":return i==="i32"||i==="u32"?`atomicAdd(&${t}, bitcast<${i}>(${r}));`:`
              ${n}bitcast<${i}>(oldValue) + (${r})${a}`;case"max":return i==="i32"||i==="u32"?`atomicMax(&${t}, bitcast<${i}>(${r}));`:`
                ${n}max(bitcast<f32>(oldValue), (${r}))${a}`;case"min":return i==="i32"||i==="u32"?`atomicMin(&${t}, bitcast<${i}>(${r}));`:`${n}min(bitcast<${i}>(oldValue), (${r}))${a}`;case"mul":return`${n}(bitcast<${i}>(oldValue) * (${r}))${a}`;default:throw new Error(`Reduction ${e} is not supported.`)}},dd=(e,t)=>{let r=e[0].dims,i=e[1].dims,n=r,a=1,s=Math.ceil(R.sizeToDimension(i,i.length-1)/a),u=i[i.length-1],l=R.sizeFromDimension(r,u),p=[{type:12,data:s},{type:12,data:u},{type:12,data:l},...Q(e[1].dims,e[2].dims,n)],f=c=>{let g=M("indices",e[1].dataType,e[1].dims.length),_=M("updates",e[2].dataType,e[2].dims.length,a),y=t.reduction!=="none"&&t.reduction!==""?zp("output",e[0].dataType,n.length):H("output",e[0].dataType,n.length,a);return`
      ${c.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(g,_,y)}
      ${c.mainStart()}
        ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
  var data_offset = 0u;
  let indices_start = uniforms.last_index_dimension * global_idx;
  let indices_end = indices_start + uniforms.last_index_dimension;
  for (var i = indices_start; i < indices_end; i++) {
    var index = i32(indices[i].x);
    ${e[0].dims.length===1?`
    let element_count_dim = uniforms.output_strides;
    let dim_value = uniforms.output_shape;`:`
    let element_count_dim = uniforms.output_strides[i - indices_start];
    let dim_value = uniforms.output_shape[i - indices_start];`}
    if (index >= 0) {
      if (index >= i32(dim_value)) {
        index = i32(dim_value - 1);
      }
    } else {
      if (index < -i32(dim_value)) {
        index = 0;
      } else {
        index += i32(dim_value);
      }
    }
    data_offset += u32((u32(index) * element_count_dim));
  }

  for (var i = 0u; i < uniforms.num_updates_elements; i++) {
    let value = updates[uniforms.num_updates_elements * global_idx + i];
    ${ld(t.reduction,"output[data_offset + i]","value",y.type.value)}
  }

      }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:p}),getShaderSource:f}},ef=e=>fe({reduction:e.reduction}),tf=(e,t)=>{e.compute(dd(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),pd,cd,hd,wn,fd,md,gd,yd,_d,wd,bd,$d,bn,vd,xd,Sd,Td,kd,rf,nf,cy=P(()=>{"use strict";X(),te(),ve(),re(),pd=(e,t)=>{if(e.every(r=>r>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},cd=(e,t,r)=>{t.every(n=>n>=0&&n<r||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let i=new Array(r).fill(1);return t.forEach((n,a)=>i[n]=e[a]),i},hd=(e,t,r,i,n,a)=>{let[s,u,l]=r>10?[1,2,3]:[-1,e.length>1?1:-1,-1],p=e[0].dims.length;if(s>0&&e.length>s&&e[s].dims.length>0)e[s].getFloat32Array().forEach(f=>a.push(f));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(u>0&&e.length>u&&e[u].dims.length===1&&e[u].dims[0]>0){if(e[u].getFloat32Array().forEach(f=>i.push(f)),i.length!==0&&i.length!==p&&r>=18&&i.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");pd(i,t),t.axes.length>0&&cd(i,t.axes,p).forEach((f,c)=>i[c]=f)}if(l>0&&e.length>l&&e[l].dims.length===1&&e[l].dims[0]>0&&(e[l].getBigInt64Array().forEach(f=>n.push(Number(f))),n.length!==0&&n.length!==p&&r>=18&&n.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(i.length!==0&&i.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(n.length!==0&&n.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof i<"u"&&typeof n<"u"&&i.length>0&&n.length>p)throw new Error("Resize requires only of scales or sizes to be specified")},wn=(e,t,r,i)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${i}(big / (${r}));
  let fract = ${i}(big % (${r})) / ${i}(${r});
  return whole + fract;
`,fd=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${wn("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${wn("xResized","lengthOriginal - 1","lengthResized - 1",t)}
                  }`;case"tf_crop_and_resize":return`if (lengthResized > 1) {
                    return ${t}(roiStart) * ${t}(lengthOriginal - 1) +
                        (${t}(xResized) * ${t}(roiEnd - roiStart) * ${t}(lengthOriginal - 1)) /
                        ${t}(lengthResized - 1);
                  } else {
                    return 0.5 * ${t}(roiStart + roiEnd) * ${t}(lengthOriginal - 1);
                  }`;case"half_pixel_symmetric":return`const outputWidth = ${t}xScale * ${t}(lengthResized);
                  const adjustment = ${t}(lengthResized) / outputWidth;
                  const center = ${t}(lengthOriginal) / 2;
                  const offset = center * (1 - adjustment);
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",md=(e,t,r)=>`fn getNearestPixelFromOriginal(xOriginal: ${r}, isDownSample: bool) -> ${r} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";case"simple":default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",gd=(e,t,r)=>{let i=new Array(r).fill(0).concat(new Array(r).fill(1)),n=e.length===0?i:e.slice();return t.length>0?(t.forEach((a,s)=>{i[a]=n[s],i[s+r]=n[t.length+s]}),i):n},yd=(e,t,r,i)=>{let n=[];if(r.length>0)if(i.length>0){if(e.forEach(a=>n.push(a)),Math.max(...i)>e.length)throw new Error("axes is out of bound");i.forEach((a,s)=>n[a]=r[s])}else r.forEach(a=>n.push(a));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");n=e.map((a,s)=>Math.round(a*t[s]))}return n},_d=(e,t,r)=>{let i=(()=>{switch(r.keepAspectRatioPolicy){case"not_larger":return r.axes.length>0?Math.min(...r.axes.map(a=>t[a]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return r.axes.length>0?Math.max(...r.axes.map(a=>t[a]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${r.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let n=e.slice();return r.axes.length>0?(r.axes.forEach(a=>t[a]=i),r.axes.forEach(a=>n[a]=Math.round(e[a]*t[a]))):(t.fill(i,0,t.length),n.forEach((a,s)=>n[s]=Math.round(a*t[s]))),n},wd=(e,t,r,i,n)=>`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${r.length}> {
      var original_indices: array<${e.type.value}, ${r.length}>;
      for (var i:u32 = 0; i < ${r.length}; i++) {
        var output_index = ${e.indicesGet("output_indices","i")};
        var scale = ${j("uniforms.scales","i",i)};
        var roi_low = ${j("uniforms.roi","i",n)};
        var roi_hi = ${j("uniforms.roi",`i + ${t.length}`,n)};
        if (scale == 1.0) {
          original_indices[i] = ${e.type.value}(output_index);
        } else {
          var input_shape_i = ${j("uniforms.input_shape","i",t.length)};
          var output_shape_i = ${j("uniforms.output_shape","i",r.length)};
          original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                           input_shape_i, roi_low, roi_hi);
        }
      }
      return original_indices;
    }`,bd=(e,t,r,i,n,a,s)=>`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
      var input_indices: ${e.type.indices};
      for (var i:u32 = 0; i < ${i.length}; i++) {
        var output_index = ${t.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${j("uniforms.scales","i",n)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${j("uniforms.roi","i",a)};
          var roi_hi = ${j("uniforms.roi",`i + ${r.length}`,a)};
          var input_shape_i = ${j("uniforms.input_shape","i",r.length)};
          var output_shape_i = ${j("uniforms.output_shape","i",i.length)};
          var original_idx = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                        input_shape_i, roi_low, roi_hi);
          if (!${s} || (original_idx >= 0 && original_idx < ${t.type.value}(input_shape_i))) {
            if (original_idx < 0) {
              input_index = 0;
            } else if (original_idx > ${t.type.value}(input_shape_i - 1)) {
              input_index = input_shape_i - 1;
            } else {
              input_index = u32(getNearestPixelFromOriginal(original_idx, scale < 1));
            }
          } else {
            input_index = u32(original_idx);
          }
        }
        ${e.indicesSet("input_indices","i","input_index")}
      }
      return input_indices;
    }`,$d=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${j("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,bn=(e,t,r,i)=>e.rank>i?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",r,"batch")};
`:"",vd=(e,t,r,i,n)=>{let[a,s,u,l]=r.length===2?[-1,0,1,-1]:[0,2,3,1],p=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${p} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(row, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(col, ${r[u]} - 1))`)};
      ${bn(e,l,a,2)}
      return ${e.getByIndices("input_indices")};
    }

    fn bilinearInterpolation(output_indices: ${t.type.indices}) -> ${p} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var row:${p} = originalIndices[${s}];
      var col:${p} = originalIndices[${u}];
      ${i?`if (row < 0 || row > (${r[s]} - 1) || col < 0 || col > (${r[u]} - 1)) {
        return ${n};
      }`:""};
      row = max(0, min(row, ${r[s]} - 1));
      col = max(0, min(col, ${r[u]} - 1));
      var row1: u32 = u32(row);
      var col1: u32 = u32(col);
      var row2: u32 = u32(row + 1);
      var col2: u32 = u32(col + 1);
      var channel: u32 = ${r.length>2?`u32(originalIndices[${l}])`:"0"};
      var batch: u32 =  ${r.length>2?`u32(originalIndices[${a}])`:"0"};
      var x11: ${p} = getInputValue(batch, channel, row1, col1);
      var x12: ${p} = getInputValue(batch, channel, row1, col2);
      var x21: ${p} = getInputValue(batch, channel, row2, col1);
      var x22: ${p} = getInputValue(batch, channel, row2, col2);
      var dx1: ${p} = abs(row - ${p}(row1));
      var dx2: ${p} = abs(${p}(row2) - row);
      var dy1: ${p} = abs(col - ${p}(col1));
      var dy2: ${p} = abs(${p}(col2) - col);
      if (row1 == row2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (col1 == col2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      return (x11 * dx2 * dy2 + x12 * dx2 * dy1 + x21 * dx1 * dy2 + x22 * dx1 * dy1);
    }`},xd=(e,t,r,i,n,a,s,u,l,p)=>{let f=r.length===2,c=!0,[g,_]=f?[0,1]:c?[2,3]:[1,2],y=e.type.value,$=S=>{let v=S===g?"row":"col";return`
      fn ${v}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${y} {
        var output_index = ${t.indicesGet("output_indices",S)};
        var originalIdx: ${y} = getOriginalCoordinateFromResizedCoordinate(output_index, ${n[S]},
        ${i[S]}, ${r[S]}, ${a[S]}, ${a[S]} + ${r.length});
        var fractOriginalIdx: ${y} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${u} && (originalIdx < 0 || originalIdx > (${r[S]} - 1))) {
          return ${l};
        }
        var data: array<${y}, 4> = array<${y}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${v}: ${y} = originalIdx + ${y}(i);
          if (${v} < 0 || ${v} >= ${r[S]}) {
            ${p?`coefs[i + 1] = 0.0;
                        continue;`:u?`return ${l};`:`${v} = max(0, min(${v}, ${r[S]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",S,`u32(${v})`)};
          data[i + 1] = ${S===g?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
        }
        return cubicInterpolation1D(data, coefs);
      }`};return`
    ${$(g)};
    ${$(_)};
  fn getCubicInterpolationCoefs(s: ${y}) -> array<${y}, 4> {
    var absS = abs(s);
    var coeffs: array<${y}, 4> = array<${y}, 4>(0.0, 0.0, 0.0, 0.0);
    var oneMinusAbsS: ${y} = 1.0 - absS;
    var twoMinusAbsS: ${y} = 2.0 - absS;
    var onePlusAbsS: ${y} = 1.0 + absS;
    coeffs[0] = ((${s} * onePlusAbsS - 5 * ${s}) * onePlusAbsS + 8 * ${s}) * onePlusAbsS - 4 * ${s};
    coeffs[1] = ((${s} + 2) * absS - (${s} + 3)) * absS * absS + 1;
    coeffs[2] = ((${s} + 2) * oneMinusAbsS - (${s} + 3)) * oneMinusAbsS * oneMinusAbsS + 1;
    coeffs[3] = ((${s} * twoMinusAbsS - 5 * ${s}) * twoMinusAbsS + 8 * ${s}) * twoMinusAbsS - 4 * ${s};
    return coeffs;
  }

  fn cubicInterpolation1D(x: array<${y}, 4>, coefs: array<${y}, 4>) -> ${y} {
    var coefsSum: ${y} = coefs[0] + coefs[1] + coefs[2] + coefs[3];
    return (x[0] * coefs[0] + x[1] * coefs[1]+ x[2] * coefs[2]+ x[3] * coefs[3]) / coefsSum;
  }

  fn bicubicInterpolation(output_indices: ${t.type.indices}) -> ${y} {
    var input_indices: ${e.type.indices} = output_indices;
    return colCubicInterpolation(input_indices, output_indices);
  }
    `},Sd=(e,t,r,i,n)=>{let[a,s,u,l,p]=r.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],f=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${f} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",s,`max(0, min(depth, ${r[s]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(height, ${r[u]} - 1))`)};
      ${e.indicesSet("input_indices",l,`max(0, min(width, ${r[l]} - 1))`)};
      ${bn(e,p,a,3)}
      return ${e.getByIndices("input_indices")};
    }

    fn trilinearInterpolation(output_indices: ${t.type.indices}) -> ${f} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var depth:${f} = originalIndices[${s}];
      var height:${f} = originalIndices[${u}];
      var width:${f} = originalIndices[${l}];
      ${i?`if (depth < 0 || depth > (${r[s]} - 1) || height < 0 || height > (${r[u]} - 1) || width < 0 || (width > ${r[l]} - 1)) {
      return ${n};
        }`:""};

    depth = max(0, min(depth, ${r[s]} - 1));
      height = max(0, min(height, ${r[u]} - 1));
      width = max(0, min(width, ${r[l]} - 1));
      var depth1: u32 = u32(depth);
      var height1: u32 = u32(height);
      var width1: u32 = u32(width);
      var depth2: u32 = u32(depth + 1);
      var height2: u32 = u32(height + 1);
      var width2: u32 = u32(width + 1);
      var channel: u32 = ${r.length>3?`u32(originalIndices[${p}])`:"0"};
      var batch: u32 =  ${r.length>3?`u32(originalIndices[${a}])`:"0"};

      var x111: ${f} = getInputValue(batch, channel, depth1, height1, width1);
      var x112: ${f} = getInputValue(batch, channel, depth1, height1, width2);
      var x121: ${f} = getInputValue(batch, channel, depth1, height2, width1);
      var x122: ${f} = getInputValue(batch, channel, depth1, height2, width2);
      var x211: ${f} = getInputValue(batch, channel, depth2, height1, width1);
      var x212: ${f} = getInputValue(batch, channel, depth2, height1, width2);
      var x221: ${f} = getInputValue(batch, channel, depth2, height2, width1);
      var x222: ${f} = getInputValue(batch, channel, depth2, height2, width2);
      var dx1: ${f} = abs(depth - ${f}(depth1));
      var dx2: ${f} = abs(${f}(depth2) - depth);
      var dy1: ${f} = abs(height - ${f}(height1));
      var dy2: ${f} = abs(${f}(height2) - height);
      var dz1: ${f} = abs(width - ${f}(width1));
      var dz2: ${f} = abs(${f}(width2) - width);
      if (depth1 == depth2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (height1 == height2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      if (width1 == width2) {
        dz1 = 0.5;
        dz2 = 0.5;
      }
      return (x111 * dx2 * dy2 * dz2 + x112 * dx2 * dy2 * dz1 + x121 * dx2 * dy1 *dz2 + x122 * dx2 * dy1 * dz1 +
              x211 * dx1 * dy2 * dz2 + x212 * dx1 * dy2 * dz1 + x221 * dx1 * dy1 *dz2 + x222 * dx1 * dy1 * dz1);
    }`},Td=(e,t,r,i,n,a)=>{let s=e.dims,u=gd(a,t.axes,s.length),l=yd(s,i,n,t.axes),p=i.slice();i.length===0&&(p=s.map((w,I)=>w===0?1:l[I]/w),t.keepAspectRatioPolicy!=="stretch"&&(l=_d(s,p,t)));let f=H("output",e.dataType,l.length),c=M("input",e.dataType,s.length),g=R.size(l),_=s.length===l.length&&s.every((w,I)=>w===l[I]),y=t.coordinateTransformMode==="tf_crop_and_resize",$=t.extrapolationValue,S=c.type.value,v=w=>`
      ${_?"":`
      ${fd(t.coordinateTransformMode,S)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${$d(c,s)};
              ${md(t.nearestMode,r,S)};
              ${bd(c,f,s,l,p.length,u.length,y)};
              `;case"linear":return`
              ${wd(f,s,l,p.length,u.length)};
              ${(()=>{if(s.length===2||s.length===4)return`${vd(c,f,s,y,$)}`;if(s.length===3||s.length===5)return`${Sd(c,f,s,y,$)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(s.length===2||s.length===4)return`${xd(c,f,s,l,p,u,t.cubicCoeffA,y,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${w.registerUniform("output_size","u32").registerUniform("scales","f32",p.length).registerUniform("roi","f32",u.length).declareVariables(c,f)}
      ${w.mainStart()}
        ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
        ${_?"output[global_idx] = input[global_idx];":`
        let output_indices = ${f.offsetToIndices("global_idx")};
        var input_indices: ${c.type.indices};
        ${(()=>{switch(t.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
                if (checkInputIndices(input_indices)) {
                  output[global_idx] = ${c.getByIndices("input_indices")};
                } else {
                  output[global_idx] = ${t.extrapolationValue};
                }`;case"linear":return`output[global_idx] = ${s.length===2||s.length===4?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${t.mode}`)}})()};
`}
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${r}|${p.length>0?t.mode==="cubic"?p:p.length:""}|${n.length>0?n:""}|${u.length>0?u:""}|${_}|${t.mode==="nearest"?s.length:s}`,inputDependencies:["rank"]},getShaderSource:v,getRunData:()=>({outputs:[{dims:l,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:[{type:12,data:g},{type:1,data:p},{type:1,data:u},...Q(s,l)]})}},kd=e=>{let t=e.customDataBuffer;return new Uint32Array(t,t.byteOffset,1)[0]},rf=(e,t)=>{let r=[],i=[],n=[],a=kd(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");hd(e.inputs,t,a,r,i,n),e.compute(Td(e.inputs[0],t,a,r,i,n),{inputs:[0]})},nf=e=>{let t=e.antialias,r=e.axes,i=e.coordinateTransformMode,n=e.cubicCoeffA,a=e.excludeOutside!==0,s=e.extrapolationValue,u=e.keepAspectRatioPolicy,l=e.mode,p=e.nearestMode===""?"simple":e.nearestMode;return fe({antialias:t,axes:r,coordinateTransformMode:i,cubicCoeffA:n,excludeOutside:a,extrapolationValue:s,keepAspectRatioPolicy:u,mode:l,nearestMode:p})}}),Id,Ed,af,hy=P(()=>{"use strict";X(),te(),re(),Id=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],r=e[1],i=e[2];if(t.dataType!==r.dataType||t.dataType!==i.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(r.dims.length!==3&&r.dims.length!==2)throw new Error("Skip must be 2D or 3D");let n=t.dims[t.dims.length-1],a=t.dims[t.dims.length-2];if(r.dims[r.dims.length-1]!==n)throw new Error("Skip must have the same hidden size as input");if(r.dims[r.dims.length-2]!==a)throw new Error("Skip must have the same sequence length as input");if(i.dims.length!==1)throw new Error("Gamma must be 1D");if(i.dims[i.dims.length-1]!==n)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let s=e[3];if(s.dims.length!==1)throw new Error("Beta must be 1D");if(s.dims[s.dims.length-1]!==n)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let s=e[4];if(s.dims.length!==1)throw new Error("Bias must be 1D");if(s.dims[s.dims.length-1]!==n)throw new Error("Bias must have the same hidden size as input")}},Ed=(e,t,r,i)=>{let n=t.simplified,a=e[0].dims,s=R.size(a),u=a,l=s,p=a.slice(-1)[0],f=i?a.slice(0,-1).concat(1):[],c=!n&&e.length>3,g=e.length>4,_=i&&r>1,y=i&&r>2,$=r>3,S=64,v=$e(p),w=[{type:12,data:l},{type:12,data:v},{type:12,data:p},{type:1,data:t.epsilon}],I=E=>{let z=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],O=[M("x",e[0].dataType,e[0].dims,v),M("skip",e[1].dataType,e[1].dims,v),M("gamma",e[2].dataType,e[2].dims,v)];c&&O.push(M("beta",e[3].dataType,e[3].dims,v)),g&&O.push(M("bias",e[4].dataType,e[4].dims,v)),O.push(H("output",e[0].dataType,u,v)),_&&O.push(H("mean_output",1,f)),y&&O.push(H("inv_std_output",1,f)),$&&O.push(H("input_skip_bias_sum",e[0].dataType,u,v));let x=ke(e[0].dataType),D=ke(1,v);return`

      ${E.registerUniforms(z).declareVariables(...O)}
      var<workgroup> sum_shared : array<${D}, ${S}>;
      var<workgroup> sum_squared_shared : array<${D}, ${S}>;

      ${E.mainStart([S,1,1])}
        let ix = local_id.x;
        let iy = global_id.x / ${S};

        let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
        var stride = hidden_size_vectorized / ${S};
        let offset = ix * stride + iy * hidden_size_vectorized;
        let offset1d = stride * ix;
        if (ix == ${S-1}) {
          stride = hidden_size_vectorized - stride * ix;
        }
        for (var i: u32 = 0; i < stride; i++) {
          let skip_value = skip[offset + i];
          let bias_value = ${g?"bias[offset1d + i]":x+"(0.0)"};
          let input_value = x[offset + i];
          let value = input_value + skip_value + bias_value;
          ${$?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${Vt(x,v,"value")};
          sum_shared[ix] += f32_value;
          sum_squared_shared[ix] += f32_value * f32_value;
        }
        workgroupBarrier();

        var reduce_size : u32 = ${S};
        for (var curr_size = reduce_size >> 1;  curr_size > 0; curr_size = reduce_size >> 1) {
          reduce_size = curr_size + (reduce_size & 1);
          if (ix < curr_size) {
            sum_shared[ix] += sum_shared[ix + reduce_size];
            sum_squared_shared[ix] += sum_squared_shared[ix + reduce_size];
          }
          workgroupBarrier();
        }

        let sum = sum_shared[0];
        let square_sum = sum_squared_shared[0];
        let mean = ${yt("sum",v)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${yt("square_sum",v)} / f32(uniforms.hidden_size) ${n?"":"- mean * mean"} + uniforms.epsilon);
        ${_?"mean_output[global_idx] = mean;":""}
        ${y?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${n?"":`- ${x}(mean)`}) *
            ${x}(inv_std_dev) * gamma[offset1d + i]
            ${c?"+ beta[offset1d + i]":""};
        }
      }`},T=[{dims:u,dataType:e[0].dataType}];return r>1&&T.push({dims:f,dataType:1}),r>2&&T.push({dims:f,dataType:1}),r>3&&T.push({dims:a,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${v};${_};${y};${$}`,inputDependencies:e.map((E,z)=>"type")},getShaderSource:I,getRunData:()=>({outputs:T,dispatchGroup:{x:Math.ceil(l/p)},programUniforms:w})}},af=(e,t)=>{Id(e.inputs);let r=[0];e.outputCount>1&&r.push(-3),e.outputCount>2&&r.push(-3),e.outputCount>3&&r.push(3),e.compute(Ed(e.inputs,t,e.outputCount,!1),{outputs:r})}}),zd,sr,Cd,$n,Ad,Od,sf,of,fy=P(()=>{"use strict";X(),te(),ve(),re(),zd=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((r,i)=>{if(e[i+1].dataType!==6&&e[i+1].dataType!==7)throw new Error(`Input ${i} must be an array of int32 or int64`)})},sr=(e,t)=>{let r=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(i=>r.push(Number(i)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(i=>r.push(Number(i)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return r},Cd=(e,t)=>{if(e.length>1){let r=sr(e,1),i=sr(e,2),n=sr(e,3);return n.length===0&&(n=[...Array(e[0].dims.length).keys()]),fe({starts:r,ends:i,axes:n})}else return t},$n=(e,t,r,i,n)=>{let a=e;return e<0&&(a+=r[i[t]]),n[t]<0?Math.max(0,Math.min(a,r[i[t]]-1)):Math.max(0,Math.min(a,r[i[t]]))},Ad=(e,t,r)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
          var input_indices: ${e.type.indices};
          var carry = 0u;
          for (var i = ${r.length-1}; i >= 0; i--) {
            let input_shape_i = ${j("uniforms.input_shape","i",r.length)};
            let steps_i = ${j("uniforms.steps","i",r.length)};
            let signs_i = ${j("uniforms.signs","i",r.length)};
            let starts_i = ${j("uniforms.starts","i",r.length)};
            var output_index = ${t.indicesGet("output_indices","i")};
            var input_index = output_index * steps_i + starts_i + carry;
            carry = input_index / input_shape_i;
            input_index = input_index % input_shape_i;
            if (signs_i < 0) {
              input_index = input_shape_i - input_index - 1u + starts_i;
            }
            ${e.indicesSet("input_indices","i","input_index")};
          }
          return input_indices;
      }`,Od=(e,t)=>{let r=e[0].dims,i=R.size(r),n=t.axes.length>0?R.normalizeAxes(t.axes,r.length):[...Array(r.length).keys()],a=sr(e,4);a.forEach(v=>v!==0||(()=>{throw new Error("step cannot be 0")})),a.length===0&&(a=Array(n.length).fill(1));let s=t.starts.map((v,w)=>$n(v,w,r,n,a)),u=t.ends.map((v,w)=>$n(v,w,r,n,a));if(n.length!==s.length||n.length!==u.length)throw new Error("start, ends and axes should have the same number of elements");if(n.length!==r.length)for(let v=0;v<r.length;++v)n.includes(v)||(s.splice(v,0,0),u.splice(v,0,r[v]),a.splice(v,0,1));let l=a.map(v=>Math.sign(v));a.forEach((v,w,I)=>{if(v<0){let T=(u[w]-s[w])/v,E=s[w],z=E+T*a[w];s[w]=z,u[w]=E,I[w]=-v}});let p=r.slice(0);n.forEach((v,w)=>{p[v]=Math.ceil((u[v]-s[v])/a[v])});let f={dims:p,dataType:e[0].dataType},c=H("output",e[0].dataType,p.length),g=M("input",e[0].dataType,e[0].dims.length),_=R.size(p),y=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:s.length},{name:"signs",type:"i32",length:l.length},{name:"steps",type:"u32",length:a.length}],$=[{type:12,data:_},{type:12,data:s},{type:6,data:l},{type:12,data:a},...Q(e[0].dims,p)],S=v=>`
      ${v.registerUniforms(y).declareVariables(g,c)}
        ${Ad(g,c,r)}
        ${v.mainStart()}
          ${v.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${c.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${c.setByOffset("global_idx",g.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${l.length}_${s.length}_${a.length}`,inputDependencies:["rank"]},getShaderSource:S,getRunData:()=>({outputs:[f],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:$})}},sf=(e,t)=>{zd(e.inputs,t);let r=Cd(e.inputs,t);e.compute(Od(e.inputs,r),{inputs:[0]})},of=e=>{let t=e.starts,r=e.ends,i=e.axes;return fe({starts:t,ends:r,axes:i})}}),Rd,Bd,uf,lf,my=P(()=>{"use strict";X(),te(),ve(),_t(),re(),Rd=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},Bd=(e,t)=>{let r=e.inputs[0],i=r.dims,n=R.size(i),a=i.length,s=R.normalizeAxis(t.axis,a),u=s<i.length-1,l,p=[];u?(p=Array.from({length:a},(O,x)=>x),p[s]=a-1,p[a-1]=s,l=e.compute(Ne(r,p),{inputs:[r],outputs:[-1]})[0]):l=r;let f=l.dims,c=f[a-1],g=n/c,_=$e(c),y=c/_,$=64;g===1&&($=256);let S=(O,x)=>x===4?`max(max(${O}.x, ${O}.y), max(${O}.z, ${O}.w))`:x===2?`max(${O}.x, ${O}.y)`:x===3?`max(max(${O}.x, ${O}.y), ${O}.z)`:O,v=M("x",l.dataType,l.dims,_),w=H("result",l.dataType,l.dims,_),I=v.type.value,T=ke(l.dataType)==="f32"?`var threadMax = ${I}(-3.4028234663852886e+38f);`:`var threadMax = ${I}(-65504.0h);`,E=O=>`
      var<workgroup> rowMaxShared : ${I};
      var<workgroup> rowSumShared : ${I};
      var<workgroup> threadShared : array<${I}, ${$}>;

      fn getValue(row: i32, col: i32, row_stride: i32) -> ${I} {
        let index = row * row_stride + col;
        return x[index];
      }

      fn setValue(row: i32, col: i32, row_stride: i32, value: ${I}) {
        let index = row * row_stride + col;
        result[index] = value;
      }
      ${O.registerUniform("packedCols","i32").declareVariables(v,w)}
      ${O.mainStart($)}
        let gindex = i32(global_idx);
        let lindex = i32(local_idx);
        const wg = ${$};
        let row = gindex / wg;
        let cols = uniforms.packedCols;
        let row_stride : i32 = uniforms.packedCols;

        // find the rows max
        ${T}
        for (var col = lindex; col < cols; col += wg) {
          let value = getValue(row, col, row_stride);
          threadMax = max(threadMax, value);
        }
        if (lindex < cols) {
          threadShared[lindex] = threadMax;
        }
        workgroupBarrier();

        var reduceSize = min(cols, wg);
        for (var currSize = reduceSize >> 1;  currSize > 0; currSize = reduceSize >> 1) {
          reduceSize = currSize + (reduceSize & 1);
          if (lindex < currSize) {
            threadShared[lindex] = max(threadShared[lindex], threadShared[lindex + reduceSize]);
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowMaxShared = ${I}(${S("threadShared[0]",_)});
        }
        workgroupBarrier();

        // find the rows sum
        var threadSum = ${I}(0.0);
        for (var col = lindex; col < cols; col += wg) {
          let subExp = exp(getValue(row, col, row_stride) - rowMaxShared);
          threadSum += subExp;
        }
        threadShared[lindex] = threadSum;
        workgroupBarrier();

        for (var currSize = wg >> 1;  currSize > 0; currSize = currSize >> 1) {
          if (lindex < currSize) {
            threadShared[lindex] = threadShared[lindex] + threadShared[lindex + currSize];
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowSumShared = ${I}(${yt("threadShared[0]",_)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          var value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          // max operation protects against NaN since all values should be >=0
          value = max(value, ${I}(0.0));
          setValue(row, col, row_stride, value);
        }
      }`,z=e.compute({name:"Softmax",shaderCache:{hint:`${_};${$}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:f,dataType:l.dataType}],dispatchGroup:{x:g},programUniforms:[{type:6,data:y}]}),getShaderSource:E},{inputs:[l],outputs:[u?-1:0]})[0];u&&e.compute(Ne(z,p),{inputs:[z]})},uf=(e,t)=>{Rd(e.inputs),Bd(e,t)},lf=e=>fe({axis:e.axis})}),vn,Md,Nd,Dd,df,gy=P(()=>{"use strict";X(),te(),re(),vn=e=>Array.from(e.getBigInt64Array(),Number),Md=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(vn(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},Nd=(e,t)=>{let r=[];for(let i=0;i<e.length;++i)r.push(e[i]*t[i]);return r},Dd=(e,t)=>{let r=e[0].dims,i=t??vn(e[1]),n=Nd(r,i),a=R.size(n),s=e[0].dataType,u=M("input",s,r.length),l=H("output",s,n.length),p=f=>`
      const inputShape = ${u.indices(...r)};
      ${f.registerUniform("output_size","u32").declareVariables(u,l)}
      ${f.mainStart()}
      ${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let output_indices = ${l.offsetToIndices("global_idx")};
      var input_indices: ${u.type.indices};
      for (var i = 0; i < ${r.length}; i++) {
        let input_dim_i = ${u.indicesGet("uniforms.input_shape","i")};
        let input_dim_value = ${l.indicesGet("output_indices","i")}  % input_dim_i;

        ${u.indicesSet("input_indices","i","input_dim_value")}
      }
      ${l.setByOffset("global_idx",u.getByIndices("input_indices"))}
    }`;return{name:"Tile",shaderCache:{hint:`${i}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:[{type:12,data:a},...Q(e[0].dims,n)]}),getShaderSource:p}},df=e=>{Md(e.inputs),e.compute(Dd(e.inputs),{inputs:[0]})}}),Pd,Ud,pf,yy=P(()=>{"use strict";X(),te(),re(),Pd=(e,t,r,i,n)=>{let a=H("output_data",n,r.length,4),s=M("a_data",t[1].dataType,t[1].dims.length,4),u=M("b_data",t[2].dataType,t[2].dims.length,4),l=M("c_data",t[0].dataType,t[0].dims.length,4),p,f=(c,g,_)=>`select(${g}, ${c}, ${_})`;if(!i)p=a.setByOffset("global_idx",f(s.getByOffset("global_idx"),u.getByOffset("global_idx"),l.getByOffset("global_idx")));else{let c=(g,_,y="")=>{let $=`a_data[index_a${_}][component_a${_}]`,S=`b_data[index_b${_}][component_b${_}]`,v=`bool(c_data[index_c${_}] & (0xffu << (component_c${_} * 8)))`;return`
            let output_indices${_} = ${a.offsetToIndices(`global_idx * 4u + ${_}u`)};
            let offset_a${_} = ${s.broadcastedIndicesToOffset(`output_indices${_}`,a)};
            let offset_b${_} = ${u.broadcastedIndicesToOffset(`output_indices${_}`,a)};
            let offset_c${_} = ${l.broadcastedIndicesToOffset(`output_indices${_}`,a)};
            let index_a${_} = offset_a${_} / 4u;
            let index_b${_} = offset_b${_} / 4u;
            let index_c${_} = offset_c${_} / 4u;
            let component_a${_} = offset_a${_} % 4u;
            let component_b${_} = offset_b${_} % 4u;
            let component_c${_} = offset_c${_} % 4u;
            ${g}[${_}] = ${y}(${f($,S,v)});
          `};n===9?p=`
            var data = vec4<u32>(0);
            ${c("data",0,"u32")}
            ${c("data",1,"u32")}
            ${c("data",2,"u32")}
            ${c("data",3,"u32")}
            output_data[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:p=`
            ${c("output_data[global_idx]",0)}
            ${c("output_data[global_idx]",1)}
            ${c("output_data[global_idx]",2)}
            ${c("output_data[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(l,s,u,a)}
        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${p}
      }`},Ud=e=>{let t=e[1].dims,r=e[2].dims,i=e[0].dims,n=e[1].dataType,a=!(R.areEqual(t,r)&&R.areEqual(r,i)),s=t,u=R.size(t);if(a){let p=Gt.calcShape(Gt.calcShape(t,r,!1),i,!1);if(!p)throw new Error("Can't perform where op on the given tensors");s=p,u=R.size(s)}let l=Math.ceil(u/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:p=>Pd(p,e,s,a,n),getRunData:()=>({outputs:[{dims:s,dataType:n}],dispatchGroup:{x:Math.ceil(u/64/4)},programUniforms:[{type:12,data:l},...Q(i,t,r,s)]})}},pf=e=>{e.compute(Ud(e.inputs))}}),cf,_y=P(()=>{"use strict";O0(),ia(),R0(),B0(),M0(),N0(),D0(),L0(),G0(),H0(),F0(),j0(),K0(),Q0(),Z0(),Y0(),X0(),J0(),ey(),ty(),ry(),iy(),ny(),ay(),sy(),Ch(),oy(),uy(),ly(),dy(),py(),ra(),cy(),Mh(),hy(),fy(),my(),Rh(),gy(),_t(),na(),yy(),cf=new Map([["Abs",[nc]],["Acos",[ac]],["Acosh",[sc]],["Add",[qc]],["ArgMax",[ec,Rn]],["ArgMin",[Jp,Rn]],["Asin",[oc]],["Asinh",[uc]],["Atan",[lc]],["Atanh",[dc]],["Attention",[tc]],["AveragePool",[Gh,Vh]],["BatchNormalization",[rc]],["BiasAdd",[ic]],["BiasSplitGelu",[Uc]],["Cast",[cc,pc]],["Ceil",[fc]],["Clip",[hc]],["Concat",[Zc,Yc]],["Conv",[Un,Pn]],["ConvTranspose",[oh,sh]],["Cos",[mc]],["Cosh",[gc]],["CumSum",[uh,lh]],["DepthToSpace",[dh,ph]],["DequantizeLinear",[Yh,Xh]],["Div",[Wc]],["Einsum",[ch,hh]],["Elu",[yc,pr]],["Equal",[Lc]],["Erf",[_c]],["Exp",[wc]],["Expand",[fh]],["FastGelu",[mh]],["Floor",[bc]],["FusedConv",[Un,Pn]],["Gather",[yh,gh]],["GatherElements",[xh,vh]],["GatherBlockQuantized",[bh,$h]],["GatherND",[_h,wh]],["Gelu",[$c]],["Gemm",[Th,Sh]],["GlobalAveragePool",[Fh,Hh]],["GlobalMaxPool",[Zh,Qh]],["Greater",[Fc]],["GreaterOrEqual",[Kc]],["GridSample",[kh,Ih]],["GroupQueryAttention",[Nh]],["HardSigmoid",[zc,Ec]],["InstanceNormalization",[Dh]],["LayerNormalization",[Ph]],["LeakyRelu",[vc,pr]],["Less",[jc]],["LessOrEqual",[Qc]],["Log",[Dc]],["MatMul",[Uh]],["MatMulNBits",[qh,Wh]],["MaxPool",[jh,Kh]],["Mul",[Vc]],["MultiHeadAttention",[zh,Eh]],["Neg",[Sc]],["Not",[xc]],["Pad",[Lh]],["Pow",[Gc]],["QuickGelu",[Pc,pr]],["Range",[Jh]],["Reciprocal",[Tc]],["ReduceMin",[Kp]],["ReduceMean",[Vp]],["ReduceMax",[jp]],["ReduceSum",[Zp]],["ReduceProd",[Qp]],["ReduceL1",[Gp]],["ReduceL2",[Hp]],["ReduceLogSum",[Xp]],["ReduceLogSumExp",[Fp]],["ReduceSumSquare",[Yp]],["Relu",[kc]],["Resize",[rf,nf]],["RotaryEmbedding",[Bh]],["ScatterND",[tf,ef]],["Sigmoid",[Ic]],["Sin",[Cc]],["Sinh",[Ac]],["Slice",[sf,of]],["SkipLayerNormalization",[af]],["Split",[Ah,Oh]],["Sqrt",[Oc]],["Softmax",[uf,lf]],["Sub",[Hc]],["Tan",[Rc]],["Tanh",[Bc]],["ThresholdedRelu",[Nc,pr]],["Tile",[df]],["Transpose",[Ap,Op]],["Where",[pf]]])}),hf,wy=P(()=>{"use strict";qe(),ot(),re(),hf=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,r,i,n){tt(e.programInfo.name);let a=this.backend.device,s=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let u=[];for(let p of t)u.push({binding:u.length,resource:{buffer:p.buffer}});for(let p of r)u.push({binding:u.length,resource:{buffer:p.buffer}});n&&u.push({binding:u.length,resource:n});let l=a.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:u,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let p={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:l,dispatchGroup:i};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(p)}s.setPipeline(e.computePipeline),s.setBindGroup(0,l),s.dispatchWorkgroups(...i),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),Ze(e.programInfo.name)}dispose(){}build(e,t){tt(e.name);let r=this.backend.device,i=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(p=>{r.features.has(p.feature)&&i.push(`enable ${p.extension};`)});let n=Cp(t,this.backend.device.limits),a=e.getShaderSource(n),s=`${i.join(`
`)}
${n.additionalImplementations}
${a}`,u=r.createShaderModule({code:s,label:e.name});ue("verbose",()=>`[WebGPU] ${e.name} shader code: ${s}`);let l=r.createComputePipeline({compute:{module:u,entryPoint:"main"},layout:"auto",label:e.name});return Ze(e.name),{programInfo:e,computePipeline:l,uniformVariablesInfo:n.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,r=typeof e=="number"?1:e.y||1,i=typeof e=="number"?1:e.z||1,n=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=n&&r<=n&&i<=n)return[t,r,i];let a=t*r*i,s=Math.ceil(Math.sqrt(a));if(s>n){if(s=Math.ceil(Math.cbrt(a)),s>n)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[s,s,s]}else return[s,s,1]}}}),ff={};Ft(ff,{WebGpuBackend:()=>mf});var qd,Wd,Ld,mf,by=P(()=>{"use strict";qe(),X(),ot(),Tp(),C0(),_y(),wy(),qd=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let r=[];for(let i=0;i<e.length;++i){let n=e[i].dataType;switch(t[i]){case"none":{r.push("");break}case"type":{r.push(`${n}`);break}case"rank":{let a=e[i].dims.length;r.push(`${n};${a}`);break}case"dims":{let a=e[i].dims.join(",");r.push(`${n};${a}`);break}default:throw new Error(`unsupported input dependency: ${t[i]}`)}}return r.join("|")},Wd=(e,t,r)=>{let i=e.name;return e.shaderCache?.hint&&(i+="["+e.shaderCache.hint+"]"),i+=":"+r+`:${qd(t,e.shaderCache?.inputDependencies??new Array(t.length).fill("dims"))}`,i},Ld=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},mf=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let r=[],i={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},n=a=>t.features.has(a)&&r.push(a)&&!0;n("chromium-experimental-timestamp-query-inside-passes")||n("timestamp-query"),n("shader-f16"),n("subgroups"),this.device=await t.requestDevice(i),this.adapterInfo=new Ld(t.info||await t.requestAdapterInfo()),this.gpuDataManager=Ep(this),this.programManager=new hf(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,Xn(e.logLevel,!!e.debug),this.device.onuncapturederror=a=>{a.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${a.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!1}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose()}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;tt(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{let t=new BigUint64Array(e.getMappedRange()),r=this.pendingQueries.get(e);for(let i=0;i<t.length/2;i++){let n=r[i],a=n.kernelId,s=this.kernels.get(a),u=s.kernelType,l=s.kernelName,p=n.programName,f=n.inputTensorViews,c=n.outputTensorViews,g=t[i*2],_=t[i*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=g);let y=Number(g-this.queryTimeBase),$=Number(_-this.queryTimeBase);if(!Number.isSafeInteger(y)||!Number.isSafeInteger($))throw new RangeError("incorrect timestamp range");if(this.env.webgpu.profiling?.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:f.map(S=>({dims:S.dims,dataType:st(S.dataType)})),outputsMetadata:c.map(S=>({dims:S.dims,dataType:st(S.dataType)})),kernelId:a,kernelType:u,kernelName:l,programName:p,startTime:y,endTime:$});else{let S="";f.forEach((w,I)=>{S+=`input[${I}]: [${w.dims}] | ${st(w.dataType)}, `});let v="";c.forEach((w,I)=>{v+=`output[${I}]: [${w.dims}] | ${st(w.dataType)}, `}),console.log(`[profiling] kernel "${a}|${u}|${l}|${p}" ${S}${v}start time: ${y} ns, execution time: ${$-y} ns`)}Fr("GPU",`${p}::${g}::${_}`)}e.unmap(),this.pendingQueries.delete(e)}),Ze()}run(e,t,r,i,n,a){tt(e.name);let s=[];for(let w=0;w<t.length;++w){let I=t[w].data;if(I===0)continue;let T=this.gpuDataManager.get(I);if(!T)throw new Error(`no GPU data for input: ${I}`);s.push(T)}let{outputs:u,dispatchGroup:l,programUniforms:p}=e.getRunData(t),f=r.length===0?u.map((w,I)=>I):r;if(f.length!==u.length)throw new Error(`Output size ${f.length} must be equal to ${u.length}.`);let c=[],g=[];for(let w=0;w<u.length;++w){if(!Number.isInteger(f[w])||f[w]<-3||f[w]>=a)throw new Error(`Invalid output index: ${f[w]}`);if(f[w]===-3)continue;let I=f[w]===-1,T=f[w]===-2,E=I||T?n(u[w].dataType,u[w].dims):i(f[w],u[w].dataType,u[w].dims);if(c.push(E),E.data===0)continue;let z=this.gpuDataManager.get(E.data);if(!z)throw new Error(`no GPU data for output: ${E.data}`);if(I&&this.temporaryData.push(z),T){let O=this.kernelPersistentData.get(this.currentKernelId);O||(O=[],this.kernelPersistentData.set(this.currentKernelId,O)),O.push(z)}g.push(z)}if(s.length!==t.length||g.length!==c.length){if(g.length===0)return Ze(e.name),c;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let _;if(p){let w=0,I=[];p.forEach(O=>{let x=typeof O.data=="number"?[O.data]:O.data;if(x.length===0)return;let D=O.type===10?2:4,W,Z;O.type===10?(Z=x.length>4?16:x.length>2?8:x.length*D,W=x.length>4?16:D*x.length):(Z=x.length<=2?x.length*D:16,W=16),w=Math.ceil(w/Z)*Z,I.push(w);let L=O.type===10?8:4;w+=x.length>4?Math.ceil(x.length/L)*W:x.length*D});let T=16;w=Math.ceil(w/T)*T;let E=new ArrayBuffer(w);p.forEach((O,x)=>{let D=I[x],W=typeof O.data=="number"?[O.data]:O.data;if(O.type===6)new Int32Array(E,D,W.length).set(W);else if(O.type===12)new Uint32Array(E,D,W.length).set(W);else if(O.type===10)new Uint16Array(E,D,W.length).set(W);else if(O.type===1)new Float32Array(E,D,W.length).set(W);else throw new Error(`Unsupported uniform type: ${st(O.type)}`)});let z=this.gpuDataManager.create(w,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(z.buffer,0,E,0,w),this.gpuDataManager.release(z.id),_={offset:0,size:w,buffer:z.buffer}}let y=this.programManager.normalizeDispatchGroupSize(l),$=y[1]===1&&y[2]===1,S=Wd(e,t,$),v=this.programManager.getArtifact(S);if(v||(v=this.programManager.build(e,y),this.programManager.setArtifact(S,v),ue("info",()=>`[artifact] key: ${S}, programName: ${e.name}`)),p&&v.uniformVariablesInfo){if(p.length!==v.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${v.uniformVariablesInfo.length}, got ${p.length} in program "${v.programInfo.name}".`);for(let w=0;w<p.length;w++){let I=p[w],T=I.type,E=typeof I.data=="number"?1:I.data.length,[z,O]=v.uniformVariablesInfo[w];if(T!==z||E!==O)throw new Error(`Uniform variable ${w} mismatch: expect type ${z} with size ${O}, got type ${T} with size ${E} in program "${v.programInfo.name}".`)}}if(ue("info",()=>`[ProgramManager] run "${e.name}" (key=${S}) with ${y[0]}x${y[1]}x${y[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let w={kernelId:this.currentKernelId,programName:v.programInfo.name,inputTensorViews:t,outputTensorViews:c};this.pendingKernels.push(w),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(w)}return this.programManager.run(v,s,g,y,_),Ze(e.name),c}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,r,i){let n=cf.get(e);if(!n)throw new Error(`kernel not implemented: ${e}`);let a={kernelType:e,kernelName:i,kernelEntry:n[0],attributes:[n[1],r]};this.kernels.set(t,a)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let r of t)this.gpuDataManager.release(r.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,r){let i=this.kernels.get(e);if(!i)throw new Error(`kernel not created: ${e}`);let n=i.kernelType,a=i.kernelName,s=i.kernelEntry,u=i.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${n}] ${a}" is not allowed to be called recursively`);this.currentKernelId=e,u[0]&&(u[1]=u[0](u[1]),u[0]=void 0),ue("info",()=>`[WebGPU] Start to run kernel "[${n}] ${a}"...`);let l=this.env.debug;this.temporaryData=[];try{return l&&this.device.pushErrorScope("validation"),s(t,u[1]),0}catch(p){return r.push(Promise.resolve(`[WebGPU] Kernel "[${n}] ${a}" failed. ${p}`)),1}finally{l&&r.push(this.device.popErrorScope().then(p=>p?`GPU validation error for kernel "[${n}] ${a}": ${p.message}`:null));for(let p of this.temporaryData)this.gpuDataManager.release(p.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,r,i){let n=this.sessionExternalDataMapping.get(e);n||(n=new Map,this.sessionExternalDataMapping.set(e,n));let a=n.get(t),s=this.gpuDataManager.registerExternalBuffer(r,i,a);return n.set(t,[s,r]),s}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(r=>this.gpuDataManager.unregisterExternalBuffer(r[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,r){return async()=>{let i=await Cn(this,e,t);return Jn(i.buffer,r)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){this.queryType="none",(this.env.webgpu.profiling?.mode==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){ue("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){ue("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){ue("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),r=e.length;this.pendingKernels=[];for(let i=0;i<r;i++){let n=this.getComputePassEncoder(),a=e[i];this.writeTimestamp(this.pendingDispatchNumber*2),n.setPipeline(a.computePipeline),n.setBindGroup(0,a.bindGroup),n.dispatchWorkgroups(...a.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[i]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),gf={};Ft(gf,{init:()=>yf});var Wr,Vd,yf,$y=P(()=>{"use strict";X(),ot(),te(),z0(),Wr=class _f{constructor(t,r,i,n){this.module=t,this.dataType=r,this.data=i,this.dims=n}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=R.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(R.size(t)!==R.size(this.dims))throw new Error("Invalid new shape");return new _f(this.module,this.dataType,this.data,t)}},Vd=class{constructor(e,t,r){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let i=e.PTR_SIZE,n=r/e.PTR_SIZE,a=i===4?"i32":"i64";this.opKernelContext=Number(e.getValue(i*n++,a));let s=Number(e.getValue(i*n++,a));this.outputCount=Number(e.getValue(i*n++,a)),this.customDataOffset=Number(e.getValue(i*n++,"*")),this.customDataSize=Number(e.getValue(i*n++,a));let u=[];for(let l=0;l<s;l++){let p=Number(e.getValue(i*n++,a)),f=Number(e.getValue(i*n++,"*")),c=Number(e.getValue(i*n++,a)),g=[];for(let _=0;_<c;_++)g.push(Number(e.getValue(i*n++,a)));u.push(new Wr(e,p,f,g))}this.inputs=u}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){let r=t?.inputs?.map(s=>typeof s=="number"?this.inputs[s]:s)??this.inputs,i=t?.outputs??[],n=(s,u,l)=>new Wr(this.module,u,this.output(s,l),l),a=(s,u)=>{let l=Ct(s,u);if(!l)throw new Error(`Unsupported data type: ${s}`);let p=l>0?this.backend.gpuDataManager.create(l).id:0;return new Wr(this.module,s,p,u)};return this.backend.run(e,r,i,n,a,this.outputCount)}output(e,t){let r=this.module.stackSave();try{let i=this.module.PTR_SIZE,n=i===4?"i32":"i64",a=this.module.stackAlloc((1+t.length)*i);this.module.setValue(a,t.length,n);for(let s=0;s<t.length;s++)this.module.setValue(a+i*(s+1),t[s],n);return this.module._JsepOutput(this.opKernelContext,e,a)}catch(i){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${i}`)}finally{this.module.stackRestore(r)}}},yf=async(e,t,r,i)=>{let n=t.jsepInit;if(!n)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let a=(by(),fr(ff)).WebGpuBackend,s=new a;await s.initialize(r,i),n("webgpu",[s,u=>s.alloc(Number(u)),u=>s.free(u),(u,l,p,f=!1)=>{if(f)ue("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(u)}, dst=${Number(l)}, size=${Number(p)}`),s.memcpy(Number(u),Number(l));else{ue("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(u)}, gpuDataId=${Number(l)}, size=${Number(p)}`);let c=t.HEAPU8.subarray(Number(u>>>0),Number(u>>>0)+Number(p));s.upload(Number(l),c)}},async(u,l,p)=>{ue("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${u}, dataOffset=${l}, size=${p}`),await s.download(Number(u),()=>t.HEAPU8.subarray(Number(l)>>>0,Number(l+p)>>>0))},(u,l,p)=>s.createKernel(u,Number(l),p,t.UTF8ToString(t._JsepGetNodeName(Number(l)))),u=>s.releaseKernel(u),(u,l,p,f)=>{ue("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${p}, kernel=${u}, contextDataOffset=${l}`);let c=new Vd(t,s,Number(l));return s.computeKernel(Number(u),c,f)},()=>s.captureBegin(),()=>s.captureEnd(),()=>s.replay()])}else{let a=new Ip(r);n("webnn",[a,()=>a.reserveTensorId(),s=>a.releaseTensorId(s),async(s,u,l,p,f)=>a.ensureTensor(s,u,l,p,f),(s,u)=>{a.uploadTensor(s,u)},async(s,u)=>a.downloadTensor(s,u),(s,u)=>a.registerMLContext(s,u),!!r.trace])}}}),Gd,da,pa,mt,Hd,xn,Jr,ca,ha,Sn,fa,ma,ga,wf=P(()=>{"use strict";qe(),k0(),I0(),X(),Dt(),Kn(),$p(),Gd=(e,t)=>{ye()._OrtInit(e,t)!==0&&me("Can't initialize onnxruntime.")},da=async e=>{Gd(e.wasm.numThreads,Kr(e.logLevel))},pa=async(e,t)=>{ye().asyncInit?.();let r=e.webgpu.adapter;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");if(r){if(typeof r.limits!="object"||typeof r.features!="object"||typeof r.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let i=e.webgpu.powerPreference;if(i!==void 0&&i!=="low-power"&&i!=="high-performance")throw new Error(`Invalid powerPreference setting: "${i}"`);let n=e.webgpu.forceFallbackAdapter;if(n!==void 0&&typeof n!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${n}"`);if(r=await navigator.gpu.requestAdapter({powerPreference:i,forceFallbackAdapter:n}),!r)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}}if(t==="webnn"&&(typeof navigator>"u"||!navigator.ml))throw new Error("WebNN is not supported in current environment");{let i=($y(),fr(gf)).init;t==="webgpu"&&await i("webgpu",ye(),e,r),t==="webnn"&&await i("webnn",ye(),e)}},mt=new Map,Hd=e=>{let t=ye(),r=t.stackSave();try{let i=t.PTR_SIZE,n=t.stackAlloc(2*i);t._OrtGetInputOutputCount(e,n,n+i)!==0&&me("Can't get session input/output count.");let a=i===4?"i32":"i64";return[Number(t.getValue(n,a)),Number(t.getValue(n+i,a))]}finally{t.stackRestore(r)}},xn=(e,t)=>{let r=ye(),i=r.stackSave(),n=0;try{let a=r.PTR_SIZE,s=r.stackAlloc(2*a);r._OrtGetInputOutputMetadata(e,t,s,s+a)!==0&&me("Can't get session input/output metadata.");let u=Number(r.getValue(s,"*"));n=Number(r.getValue(s+a,"*"));let l=r.HEAP32[n/4];if(l===0)return[u,0];let p=r.HEAPU32[n/4+1],f=[];for(let c=0;c<p;c++){let g=Number(r.getValue(n+8+c*a,"*"));f.push(g!==0?r.UTF8ToString(g):Number(r.getValue(n+8+(c+p)*a,"*")))}return[u,l,f]}finally{r.stackRestore(i),n!==0&&r._OrtFree(n)}},Jr=e=>{let t=ye(),r=t._malloc(e.byteLength);if(r===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},ca=async(e,t)=>{let r,i,n=ye();Array.isArray(e)?[r,i]=e:e.buffer===n.HEAPU8.buffer?[r,i]=[e.byteOffset,e.byteLength]:[r,i]=Jr(e);let a=0,s=0,u=0,l=[],p=[],f=[];try{if([s,l]=await bp(t),t?.externalData&&n.mountExternalData){let T=[];for(let E of t.externalData){let z=typeof E=="string"?E:E.path;T.push(Yn(typeof E=="string"?E:E.data).then(O=>{n.mountExternalData(z,O)}))}await Promise.all(T)}for(let T of t?.executionProviders??[])if((typeof T=="string"?T:T.name)==="webnn"){if(n.shouldTransferToMLTensor=!1,typeof T!="string"){let E=T,z=E?.context,O=E?.gpuDevice,x=E?.deviceType,D=E?.powerPreference;z?n.currentContext=z:O?n.currentContext=await n.webnnCreateMLContext(O):n.currentContext=await n.webnnCreateMLContext({deviceType:x,powerPreference:D})}else n.currentContext=await n.webnnCreateMLContext();break}a=await n._OrtCreateSession(r,i,s),n.webgpuOnCreateSession?.(a),a===0&&me("Can't create a session."),n.jsepOnCreateSession?.(),n.currentContext&&(n.webnnRegisterMLContext(a,n.currentContext),n.currentContext=void 0,n.shouldTransferToMLTensor=!0);let[c,g]=Hd(a),_=!!t?.enableGraphCapture,y=[],$=[],S=[],v=[],w=[];for(let T=0;T<c;T++){let[E,z,O]=xn(a,T);E===0&&me("Can't get an input name."),p.push(E);let x=n.UTF8ToString(E);y.push(x),S.push(z===0?{name:x,isTensor:!1}:{name:x,isTensor:!0,type:st(z),shape:O})}for(let T=0;T<g;T++){let[E,z,O]=xn(a,T+c);E===0&&me("Can't get an output name."),f.push(E);let x=n.UTF8ToString(E);$.push(x),v.push(z===0?{name:x,isTensor:!1}:{name:x,isTensor:!0,type:st(z),shape:O});{if(_&&t?.preferredOutputLocation===void 0){w.push("gpu-buffer");continue}let D=typeof t?.preferredOutputLocation=="string"?t.preferredOutputLocation:t?.preferredOutputLocation?.[x]??"cpu",W=n.webnnIsGraphOutput;if(D==="cpu"&&W&&W(a,x)){w.push("ml-tensor-cpu-output");continue}if(D!=="cpu"&&D!=="cpu-pinned"&&D!=="gpu-buffer"&&D!=="ml-tensor")throw new Error(`Not supported preferred output location: ${D}.`);if(_&&D!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${D}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);w.push(D)}}let I=null;return w.some(T=>T==="gpu-buffer"||T==="ml-tensor"||T==="ml-tensor-cpu-output")&&(u=n._OrtCreateBinding(a),u===0&&me("Can't create IO binding."),I={handle:u,outputPreferredLocations:w,outputPreferredLocationsEncoded:w.map(T=>T==="ml-tensor-cpu-output"?"ml-tensor":T).map(T=>En(T))}),mt.set(a,[a,p,f,I,_,!1]),[a,y,$,S,v]}catch(c){throw p.forEach(g=>n._OrtFree(g)),f.forEach(g=>n._OrtFree(g)),u!==0&&n._OrtReleaseBinding(u)!==0&&me("Can't release IO binding."),a!==0&&n._OrtReleaseSession(a)!==0&&me("Can't release session."),c}finally{n._free(r),s!==0&&n._OrtReleaseSessionOptions(s)!==0&&me("Can't release session options."),l.forEach(c=>n._free(c)),n.unmountExternalData?.()}},ha=e=>{let t=ye(),r=mt.get(e);if(!r)throw new Error(`cannot release session. invalid session id: ${e}`);let[i,n,a,s,u]=r;s&&(u&&t._OrtClearBoundOutputs(s.handle)!==0&&me("Can't clear bound outputs."),t._OrtReleaseBinding(s.handle)!==0&&me("Can't release IO binding.")),t.jsepOnReleaseSession?.(e),t.webnnOnReleaseSession?.(e),t.webgpuOnReleaseSession?.(e),n.forEach(l=>t._OrtFree(l)),a.forEach(l=>t._OrtFree(l)),t._OrtReleaseSession(i)!==0&&me("Can't release session."),mt.delete(e)},Sn=async(e,t,r,i,n,a,s=!1)=>{if(!e){t.push(0);return}let u=ye(),l=u.PTR_SIZE,p=e[0],f=e[1],c=e[3],g=c,_,y;if(p==="string"&&(c==="gpu-buffer"||c==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(s&&c!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${a} when enableGraphCapture is true.`);if(c==="gpu-buffer"){let v=e[2].gpuBuffer;y=Ct(zt(p),f);{let w=u.jsepRegisterBuffer;if(!w)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');_=w(i,a,v,y)}}else if(c==="ml-tensor"){let v=e[2].mlTensor;y=Ct(zt(p),f);let w=u.webnnRegisterMLTensor;if(!w)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');_=w(i,v,zt(p),f)}else{let v=e[2];if(Array.isArray(v)){y=l*v.length,_=u._malloc(y),r.push(_);for(let w=0;w<v.length;w++){if(typeof v[w]!="string")throw new TypeError(`tensor data at index ${w} is not a string`);u.setValue(_+w*l,Ke(v[w],r),"*")}}else{let w=u.webnnIsGraphInput,I=u.webnnIsGraphOutput;if(p!=="string"&&w&&I){let T=u.UTF8ToString(n);if(w(i,T)||I(i,T)){let E=zt(p);y=Ct(E,f),g="ml-tensor";let z=u.webnnCreateTemporaryTensor,O=u.webnnUploadTensor;if(!z||!O)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let x=await z(i,E,f);O(x,new Uint8Array(v.buffer,v.byteOffset,v.byteLength)),_=x}else y=v.byteLength,_=u._malloc(y),r.push(_),u.HEAPU8.set(new Uint8Array(v.buffer,v.byteOffset,y),_)}else y=v.byteLength,_=u._malloc(y),r.push(_),u.HEAPU8.set(new Uint8Array(v.buffer,v.byteOffset,y),_)}}let $=u.stackSave(),S=u.stackAlloc(4*f.length);try{f.forEach((w,I)=>u.setValue(S+I*l,w,l===4?"i32":"i64"));let v=u._OrtCreateTensor(zt(p),_,y,S,f.length,En(g));v===0&&me(`Can't create tensor for input/output. session=${i}, index=${a}.`),t.push(v)}finally{u.stackRestore($)}},fa=async(e,t,r,i,n,a)=>{let s=ye(),u=s.PTR_SIZE,l=mt.get(e);if(!l)throw new Error(`cannot run inference. invalid session id: ${e}`);let p=l[0],f=l[1],c=l[2],g=l[3],_=l[4],y=l[5],$=t.length,S=i.length,v=0,w=[],I=[],T=[],E=[],z=[],O=s.stackSave(),x=s.stackAlloc($*u),D=s.stackAlloc($*u),W=s.stackAlloc(S*u),Z=s.stackAlloc(S*u);try{[v,w]=wp(a),At("wasm prepareInputOutputTensor");for(let A=0;A<$;A++)await Sn(r[A],I,E,e,f[t[A]],t[A],_);for(let A=0;A<S;A++)await Sn(n[A],T,E,e,c[i[A]],$+i[A],_);Ot("wasm prepareInputOutputTensor");for(let A=0;A<$;A++)s.setValue(x+A*u,I[A],"*"),s.setValue(D+A*u,f[t[A]],"*");for(let A=0;A<S;A++)s.setValue(W+A*u,T[A],"*"),s.setValue(Z+A*u,c[i[A]],"*");if(g&&!y){let{handle:A,outputPreferredLocations:U,outputPreferredLocationsEncoded:ee}=g;if(f.length!==$)throw new Error(`input count from feeds (${$}) is expected to be always equal to model's input count (${f.length}).`);At("wasm bindInputsOutputs");for(let Y=0;Y<$;Y++){let F=t[Y];await s._OrtBindInput(A,f[F],I[Y])!==0&&me(`Can't bind input[${Y}] for session=${e}.`)}for(let Y=0;Y<S;Y++){let F=i[Y];n[Y]?.[3]?(z.push(T[Y]),s._OrtBindOutput(A,c[F],T[Y],0)!==0&&me(`Can't bind pre-allocated output[${Y}] for session=${e}.`)):s._OrtBindOutput(A,c[F],0,ee[F])!==0&&me(`Can't bind output[${Y}] to ${U[Y]} for session=${e}.`)}Ot("wasm bindInputsOutputs"),mt.set(e,[p,f,c,g,_,!0])}s.jsepOnRunStart?.(p),s.webnnOnRunStart?.(p);let L;g?L=await s._OrtRunWithBinding(p,g.handle,S,W,v):L=await s._OrtRun(p,D,x,$,Z,S,W,v),L!==0&&me("failed to call OrtRun().");let K=[],se=[];At("wasm ProcessOutputTensor");for(let A=0;A<S;A++){let U=Number(s.getValue(W+A*u,"*"));if(U===T[A]||z.includes(T[A])){K.push(n[A]),U!==T[A]&&s._OrtReleaseTensor(U)!==0&&me("Can't release tensor.");continue}let ee=s.stackSave(),Y=s.stackAlloc(4*u),F=!1,le,N=0;try{s._OrtGetTensorData(U,Y,Y+u,Y+2*u,Y+3*u)!==0&&me(`Can't access output tensor data on index ${A}.`);let V=u===4?"i32":"i64",J=Number(s.getValue(Y,V));N=s.getValue(Y+u,"*");let de=s.getValue(Y+u*2,"*"),Te=Number(s.getValue(Y+u*3,V)),Re=[];for(let xe=0;xe<Te;xe++)Re.push(Number(s.getValue(de+xe*u,V)));s._OrtFree(de)!==0&&me("Can't free memory for tensor dims.");let We=Re.reduce((xe,be)=>xe*be,1);le=st(J);let rt=g?.outputPreferredLocations[i[A]];if(le==="string"){if(rt==="gpu-buffer"||rt==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let xe=[];for(let be=0;be<We;be++){let Ae=s.getValue(N+be*u,"*"),wt=s.getValue(N+(be+1)*u,"*"),_r=be===We-1?void 0:wt-Ae;xe.push(s.UTF8ToString(Ae,_r))}K.push([le,Re,xe,"cpu"])}else if(rt==="gpu-buffer"&&We>0){let xe=s.jsepGetBuffer;if(!xe)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let be=xe(N),Ae=Ct(J,We);if(Ae===void 0||!Qn(le))throw new Error(`Unsupported data type: ${le}`);F=!0,K.push([le,Re,{gpuBuffer:be,download:s.jsepCreateDownloader(be,Ae,le),dispose:()=>{s._OrtReleaseTensor(U)!==0&&me("Can't release tensor.")}},"gpu-buffer"])}else if(rt==="ml-tensor"&&We>0){let xe=s.webnnEnsureTensor,be=s.webnnIsGraphInputOutputTypeSupported;if(!xe||!be)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(Ct(J,We)===void 0||!Zn(le))throw new Error(`Unsupported data type: ${le}`);if(!be(e,le,!1))throw new Error(`preferredLocation "ml-tensor" for ${le} output is not supported by current WebNN Context.`);let Ae=await xe(e,N,J,Re,!1);F=!0,K.push([le,Re,{mlTensor:Ae,download:s.webnnCreateMLTensorDownloader(N,le),dispose:()=>{s.webnnReleaseTensorId(N),s._OrtReleaseTensor(U)}},"ml-tensor"])}else if(rt==="ml-tensor-cpu-output"&&We>0){let xe=s.webnnCreateMLTensorDownloader(N,le)(),be=K.length;F=!0,se.push((async()=>{let Ae=[be,await xe];return s.webnnReleaseTensorId(N),s._OrtReleaseTensor(U),Ae})()),K.push([le,Re,[],"cpu"])}else{let xe=ei(le),be=new xe(We);new Uint8Array(be.buffer,be.byteOffset,be.byteLength).set(s.HEAPU8.subarray(N,N+be.byteLength)),K.push([le,Re,be,"cpu"])}}finally{s.stackRestore(ee),le==="string"&&N&&s._free(N),F||s._OrtReleaseTensor(U)}}g&&!_&&(s._OrtClearBoundOutputs(g.handle)!==0&&me("Can't clear bound outputs."),mt.set(e,[p,f,c,g,_,!1]));for(let[A,U]of await Promise.all(se))K[A][2]=U;return Ot("wasm ProcessOutputTensor"),K}finally{s.webnnOnRunEnd?.(p),s.stackRestore(O),I.forEach(L=>s._OrtReleaseTensor(L)),T.forEach(L=>s._OrtReleaseTensor(L)),E.forEach(L=>s._free(L)),v!==0&&s._OrtReleaseRunOptions(v),w.forEach(L=>s._free(L))}},ma=e=>{let t=ye(),r=mt.get(e);if(!r)throw new Error("invalid session id");let i=r[0],n=t._OrtEndProfiling(i);n===0&&me("Can't get an profile file name."),t._OrtFree(n)},ga=e=>{let t=[];for(let r of e){let i=r[2];!Array.isArray(i)&&"buffer"in i&&t.push(i.buffer)}return t}}),gt,Ue,Wt,or,ur,Lr,Tn,Vr,kt,It,Fd,bf,$f,vf,xf,Sf,Tf,kf,If=P(()=>{"use strict";qe(),wf(),Dt(),Fn(),gt=()=>!!he.wasm.proxy&&typeof document<"u",Wt=!1,or=!1,ur=!1,Vr=new Map,kt=(e,t)=>{let r=Vr.get(e);r?r.push(t):Vr.set(e,[t])},It=()=>{if(Wt||!or||ur||!Ue)throw new Error("worker not ready")},Fd=e=>{switch(e.data.type){case"init-wasm":Wt=!1,e.data.err?(ur=!0,Tn[1](e.data.err)):(or=!0,Tn[0]()),Lr&&(URL.revokeObjectURL(Lr),Lr=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=Vr.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}default:}},bf=async()=>{if(!or){if(Wt)throw new Error("multiple calls to 'initWasm()' detected.");if(ur)throw new Error("previous call to 'initWasm()' failed.");if(Wt=!0,gt())return new Promise((e,t)=>{Ue?.terminate(),yp().then(([r,i])=>{try{Ue=i,Ue.onerror=a=>t(a),Ue.onmessage=Fd,Tn=[e,t];let n={type:"init-wasm",in:he};!n.in.wasm.wasmPaths&&(r||In)&&(n.in.wasm.wasmPaths={wasm:new URL("ort-wasm-simd-threaded.jsep.wasm",Qe.url).href}),Ue.postMessage(n),Lr=r}catch(n){t(n)}},t)});try{await jn(he.wasm),await da(he),or=!0}catch(e){throw ur=!0,e}finally{Wt=!1}}},$f=async e=>{if(gt())return It(),new Promise((t,r)=>{kt("init-ep",[t,r]);let i={type:"init-ep",in:{epName:e,env:he}};Ue.postMessage(i)});await pa(he,e)},vf=async e=>gt()?(It(),new Promise((t,r)=>{kt("copy-from",[t,r]);let i={type:"copy-from",in:{buffer:e}};Ue.postMessage(i,[e.buffer])})):Jr(e),xf=async(e,t)=>{if(gt()){if(t?.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return It(),new Promise((r,i)=>{kt("create",[r,i]);let n={type:"create",in:{model:e,options:{...t}}},a=[];e instanceof Uint8Array&&a.push(e.buffer),Ue.postMessage(n,a)})}else return ca(e,t)},Sf=async e=>{if(gt())return It(),new Promise((t,r)=>{kt("release",[t,r]);let i={type:"release",in:e};Ue.postMessage(i)});ha(e)},Tf=async(e,t,r,i,n,a)=>{if(gt()){if(r.some(s=>s[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(n.some(s=>s))throw new Error("pre-allocated output tensor is not supported for proxy.");return It(),new Promise((s,u)=>{kt("run",[s,u]);let l=r,p={type:"run",in:{sessionId:e,inputIndices:t,inputs:l,outputIndices:i,options:a}};Ue.postMessage(p,ga(l))})}else return fa(e,t,r,i,n,a)},kf=async e=>{if(gt())return It(),new Promise((t,r)=>{kt("end-profiling",[t,r]);let i={type:"end-profiling",in:e};Ue.postMessage(i)});ma(e)}}),kn,jd,Ef,vy=P(()=>{"use strict";qe(),If(),X(),Hn(),$p(),kn=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},jd=e=>{switch(e[3]){case"cpu":return new Oe(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!Qn(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:i,dispose:n}=e[2];return Oe.fromGpuBuffer(r,{dataType:t,dims:e[1],download:i,dispose:n})}case"ml-tensor":{let t=e[0];if(!Zn(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:i,dispose:n}=e[2];return Oe.fromMLTensor(r,{dataType:t,dims:e[1],download:i,dispose:n})}default:throw new Error(`invalid data location: ${e[3]}`)}},Ef=class{async fetchModelAndCopyToWasmMemory(e){return vf(await Yn(e))}async loadModel(e,t){tt();let r;typeof e=="string"?r=await this.fetchModelAndCopyToWasmMemory(e):r=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await xf(r,t),Ze()}async dispose(){return Sf(this.sessionId)}async run(e,t,r){tt();let i=[],n=[];Object.entries(e).forEach(c=>{let g=c[0],_=c[1],y=this.inputNames.indexOf(g);if(y===-1)throw new Error(`invalid input '${g}'`);i.push(_),n.push(y)});let a=[],s=[];Object.entries(t).forEach(c=>{let g=c[0],_=c[1],y=this.outputNames.indexOf(g);if(y===-1)throw new Error(`invalid output '${g}'`);a.push(_),s.push(y)});let u=i.map((c,g)=>kn(c,()=>`input "${this.inputNames[n[g]]}"`)),l=a.map((c,g)=>c?kn(c,()=>`output "${this.outputNames[s[g]]}"`):null),p=await Tf(this.sessionId,n,u,s,l,r),f={};for(let c=0;c<p.length;c++)f[this.outputNames[s[c]]]=a[c]??jd(p[c]);return Ze(),f}startProfiling(){}endProfiling(){kf(this.sessionId)}}}),zf={};Ft(zf,{OnnxruntimeWebAssemblyBackend:()=>Ln,initializeFlags:()=>Wn,wasmBackend:()=>Cf});var Wn,Ln,Cf,xy=P(()=>{"use strict";qe(),If(),vy(),Wn=()=>{(typeof he.wasm.initTimeout!="number"||he.wasm.initTimeout<0)&&(he.wasm.initTimeout=0);let e=he.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),he.wasm.simd=!1),typeof he.wasm.proxy!="boolean"&&(he.wasm.proxy=!1),typeof he.wasm.trace!="boolean"&&(he.wasm.trace=!1),typeof he.wasm.numThreads!="number"||!Number.isInteger(he.wasm.numThreads)||he.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)he.wasm.numThreads=1;else{let t=typeof navigator>"u"?u0("node:os").cpus().length:navigator.hardwareConcurrency;he.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},Ln=class{async init(e){Wn(),await bf(),await $f(e)}async createInferenceSessionHandler(e,t){let r=new Ef;return await r.loadModel(e,t),r}},Cf=new Ln});qe();qe();qe();var Sy="1.24.2";{let e=(xy(),fr(zf)).wasmBackend;Lt("webgpu",e,5),Lt("webnn",e,5),Lt("cpu",e,10),Lt("wasm",e,10)}Object.defineProperty(he.versions,"web",{value:Sy,enumerable:!0});var jt=256,Of=1024,Ty=128,Rf=64,ky=128,De=16,Bf=null,Mf=null;function Lf(e,t,r){let i=Math.max(1,Math.floor(e)),n=Math.max(1,Math.floor(t));if(r){let s=r==="raw"?Bf:Mf;if(s&&s.width===i&&s.height===n)return s}let a=document.createElement("canvas");return a.width=i,a.height=n,r==="raw"?Bf=a:r==="target"&&(Mf=a),a}function Iy(e,t=3){if(e.length<2)return e;let r=[e[0]],i=t;for(let n=1;n<e.length;n++){let a=e[n-1],s=e[n],u=s.x-a.x,l=s.y-a.y,p=Math.sqrt(u*u+l*l);if(p<=i){i-=p;continue}let f=i;for(;f<=p;){let c=f/p;r.push({x:a.x+u*c,y:a.y+l*c}),f+=t}i=f-p}return r.push(e[e.length-1]),r}function Vf(e){let t=1/0,r=1/0,i=-1/0,n=-1/0;for(let a of e)for(let s of a.points)s.x<t&&(t=s.x),s.y<r&&(r=s.y),s.x>i&&(i=s.x),s.y>n&&(n=s.y);return{minX:t,minY:r,maxX:i,maxY:n}}function Ey(e){let t=Vf(e),r=Math.max(1,Math.ceil(t.maxX-t.minX)),i=Math.max(1,Math.ceil(t.maxY-t.minY)),n=Lf(r+De*2,i+De*2,"raw"),a=n.getContext("2d");a.fillStyle="#000000",a.fillRect(0,0,n.width,n.height),a.strokeStyle="#ffffff",a.lineCap="round",a.lineJoin="round";for(let s of e){if(s.points.length===0)continue;let u=Iy(s.points);a.beginPath(),a.lineWidth=Math.max(2,s.lineWidth);let l=u[0];if(a.moveTo(l.x-t.minX+De,l.y-t.minY+De),u.length===2)a.lineTo(u[1].x-t.minX+De,u[1].y-t.minY+De);else if(u.length>2){for(let f=1;f<u.length-1;f++){let c=(u[f].x+u[f+1].x)/2-t.minX+De,g=(u[f].y+u[f+1].y)/2-t.minY+De;a.quadraticCurveTo(u[f].x-t.minX+De,u[f].y-t.minY+De,c,g)}let p=u[u.length-1];a.lineTo(p.x-t.minX+De,p.y-t.minY+De)}a.stroke()}return n}function zy(e){let t=Math.min(ky/e.height,Of/e.width),r=Math.max(1,Math.round(e.width*t)),i=Math.max(1,Math.round(e.height*t)),n=Math.min(Of,Math.max(Ty,Math.ceil((r+De)/Rf)*Rf)),a=Lf(n,jt,"target"),s=a.getContext("2d");return s.fillStyle="#000000",s.fillRect(0,0,n,jt),s.drawImage(e,0,0,r,i),{canvas:a,contentH:i,contentW:r,canvasW:n}}function Cy(e){let r=e.getContext("2d").getImageData(0,0,e.width,e.height),{data:i}=r,n=e.width*e.height,a=new Float32Array(n);for(let s=0;s<n;s++){let u=s*4,l=(i[u]*.299+i[u+1]*.587+i[u+2]*.114)/255;a[s]=l}return a}var Nf=8,Ay=6,Oy=15;function _a(e){if(e.length===0)return!1;let t=Vf(e),r=t.maxX-t.minX,i=t.maxY-t.minY;if(r<Nf&&i<Nf)return!1;let n=0,a=0;for(let s of e){n+=s.points.length;for(let u=1;u<s.points.length;u++){let l=s.points[u].x-s.points[u-1].x,p=s.points[u].y-s.points[u-1].y;a+=Math.sqrt(l*l+p*p)}}return n>=Ay&&a>=Oy}function wa(e){let t=Ey(e),{canvas:r,contentH:i,contentW:n,canvasW:a}=zy(t),s=Cy(r),u=new Uint8Array(jt*a);for(let l=0;l<jt;l++)for(let p=0;p<a;p++)u[l*a+p]=l<i&&p<n?0:1;return{tensor:s,height:jt,width:a,mask:u,maskHeight:jt,maskWidth:a}}var ti=null;async function ba(e){return ti||(ti=await(await fetch(e)).json(),ti)}function ri(e,t){let{sos:r,eos:i,pad:n}=t.special_tokens,a=new Set([r,i,n]),s=[];for(let u of e){if(a.has(u))continue;let l=t.idx2word[String(u)];l!==void 0&&s.push(l)}return s}var Ry="math-handwrite-models",By=1,gr="onnx-models";function Gf(){return new Promise((e,t)=>{let r=indexedDB.open(Ry,By);r.onupgradeneeded=()=>{r.result.createObjectStore(gr)},r.onsuccess=()=>e(r.result),r.onerror=()=>t(r.error)})}async function Hf(e){try{let t=await Gf();return new Promise((r,i)=>{let a=t.transaction(gr,"readonly").objectStore(gr).get(e);a.onsuccess=()=>r(a.result??null),a.onerror=()=>i(a.error)})}catch{return null}}async function Ff(e,t){try{let r=await Gf();return new Promise((i,n)=>{let s=r.transaction(gr,"readwrite").objectStore(gr).put(t,e);s.onsuccess=()=>i(),s.onerror=()=>n(s.error)})}catch{}}async function ya(e){let t=await Hf(e);if(t)return t;let i=await(await fetch(e)).arrayBuffer();return await Ff(e,i),i}function ii(e){let t=[...e];return t=My(t),t=Ny(t),t=Dy(t),t}function My(e){let t=[],r=0;for(let i of e)i==="{"?(r++,t.push(i)):i==="}"?r>0&&(r--,t.push(i)):t.push(i);for(;r>0;)t.push("}"),r--;return t}function Ny(e){let t=[],r=0;for(;r<e.length;)if(e[r]==="\\frac"){t.push(e[r]),r++;let i=0;for(;r<e.length&&i<2;)if(e[r]==="{"){i++;let n=1;for(t.push(e[r]),r++;r<e.length&&n>0;)e[r]==="{"?n++:e[r]==="}"&&n--,t.push(e[r]),r++}else t.push(e[r]),r++,i++;for(;r<e.length&&e[r]==="{";){let n=1;for(r++;r<e.length&&n>0;)e[r]==="{"?n++:e[r]==="}"&&n--,r++}}else t.push(e[r]),r++;return t}function Dy(e){let t=[],r=0;for(;r<e.length;)if(e[r]==="\\sqrt"){t.push(e[r]),r++;let i=0;for(;r<e.length&&i<1;)if(e[r]==="{"){i++;let n=1;for(t.push(e[r]),r++;r<e.length&&n>0;)e[r]==="{"?n++:e[r]==="}"&&n--,t.push(e[r]),r++}else t.push(e[r]),r++,i++;for(;r<e.length&&e[r]==="{";){let n=1;for(r++;r<e.length&&n>0;)e[r]==="{"?n++:e[r]==="}"&&n--,r++}}else t.push(e[r]),r++;return t}var Py=new Set(["\\sum","\\int","\\sin","\\cos","\\tan","\\log","\\lim","\\sqrt","\\frac"]);function jf(e){if(e.length===0||e.length===1&&Py.has(e[0]))return!1;for(let t=0;t<e.length;t++){if(e[t]==="\\frac"){let r=e.slice(t+1);if(Df(r)<2)return!1}if(e[t]==="\\sqrt"){let r=e.slice(t+1);if(Df(r)<1)return!1}}return!0}function Df(e){let t=0,r=0;for(;r<e.length&&e[r]==="{";){t++;let i=1;for(r++;r<e.length&&i>0;)e[r]==="{"?i++:e[r]==="}"&&i--,r++}return t}he.wasm.numThreads=navigator.hardwareConcurrency||4;he.wasm.simd=!0;var Uy=50,Pf=3,qy=new Set([0,1,2,4,5,6,8,9,10,11,12,13,14,15,16,17,18,19,20,22,50,53,69,78,82,83,110,112]);function Uf(){return new Promise(e=>setTimeout(e,0))}function qf(e,t,r){if(r)for(let i=0;i<t;i++)r.has(i)||(e[i]=-1/0)}var yr=class{encoderSession=null;decoderSession=null;options;loading=null;constructor(t){this.options={maxDecodeSteps:Uy,beamWidth:3,executionProvider:"wasm",...t}}async init(){if(!(this.encoderSession&&this.decoderSession)){if(this.loading)return this.loading;this.loading=this._loadSessions(),await this.loading}}async _loadSessions(){let t=this.options.executionProvider,[r,i]=await Promise.all([ya(this.options.encoderUrl),ya(this.options.decoderUrl)]),n={executionProviders:[t]};try{[this.encoderSession,this.decoderSession]=await Promise.all([Nt.create(r,n),Nt.create(i,n)])}catch{if(t!=="wasm"){let a={executionProviders:["wasm"]};[this.encoderSession,this.decoderSession]=await Promise.all([Nt.create(r,a),Nt.create(i,a)])}else throw new Error("Failed to create ONNX sessions")}}async runDecoder(t,r,i){let n=new Oe("int64",BigInt64Array.from(i.map(BigInt)),[1,i.length]),a=await this.decoderSession.run({encoder_features:t,encoder_mask:r,input_ids:n});return n.dispose(),a.logits.data}logSoftmax(t,r,i){let n=new Float64Array(i),a=-1/0;for(let l=0;l<i;l++){let p=t[r+l];p>a&&(a=p)}let s=0;for(let l=0;l<i;l++)s+=Math.exp(t[r+l]-a);let u=Math.log(s);for(let l=0;l<i;l++)n[l]=t[r+l]-a-u;return n}topK(t,r){let i=Array.from({length:t.length},(n,a)=>a);return i.sort((n,a)=>(t[a]??0)-(t[n]??0)),i.slice(0,r)}async recognize(t,r,i="auto"){await this.init();let n=performance.now(),a=new Oe("float32",t.tensor,[1,1,t.height,t.width]),s=new Oe("bool",t.mask,[1,t.maskHeight,t.maskWidth]),u=await this.encoderSession.run({pixel_values:a,pixel_mask:s});a.dispose(),s.dispose();let l=u.encoder_features,p=u.encoder_mask,f=performance.now(),{sos:c,eos:g}=r.special_tokens,_=r.vocab_size,y=this.options.beamWidth,$=i==="number"?qy:null,S,v;if(y<=1){S=await this.greedyDecode(l,p,c,g,_,$);let I=ri(S,r);v=ii(I).join(" ")}else{let I=await this.beamDecode(l,p,c,g,_,y,$);v="",S=I[0]?.ids??[];for(let T of I){let E=ri(T.ids,r),z=ii(E),O=z.join(" ");if(!(i==="auto"&&!jf(z))&&Wf(O)){v=O,S=T.ids;break}}if(!v&&I.length>0){let T=ri(I[0].ids,r),z=ii(T).join(" ");v=Wf(z)?z:"",S=I[0].ids}}l.dispose(),p.dispose();let w=performance.now();return{latex:v,tokenIds:S,encoderMs:Math.round(f-n),decoderMs:Math.round(w-f),totalMs:Math.round(w-n)}}async greedyDecode(t,r,i,n,a,s){let u=[i],l=0,p=-1;for(let f=0;f<this.options.maxDecodeSteps;f++){f>0&&f%5===0&&await Uf();let c=await this.runDecoder(t,r,u),g=(u.length-1)*a,_=this.logSoftmax(c,g,a);qf(_,a,s);let y=-1/0,$=0;for(let S=0;S<a;S++)_[S]>y&&(y=_[S],$=S);if($===n)break;if($===p){if(l++,l>=Pf)break}else l=0;p=$,u.push($)}return u.slice(1)}async beamDecode(t,r,i,n,a,s,u){let l=[{logProb:0,ids:[i],finished:!1}];for(let c=0;c<this.options.maxDecodeSteps;c++){c>0&&c%3===0&&await Uf();let g=[];for(let _ of l){if(_.finished){g.push(_);continue}let y=await this.runDecoder(t,r,_.ids),$=(_.ids.length-1)*a,S=this.logSoftmax(y,$,a);qf(S,a,u);let v=this.topK(S,s*2);for(let w of v){let I=_.logProb+(S[w]??0);if(w===n)g.push({logProb:I,ids:_.ids,finished:!0});else{let T=_.ids,E=0;for(let z=T.length-1;z>=1&&T[z]===w;z--)E++;E>=Pf?g.push({logProb:I,ids:_.ids,finished:!0}):g.push({logProb:I,ids:[..._.ids,w],finished:!1})}}}if(g.sort((_,y)=>y.logProb/Math.max(y.ids.length,1)-_.logProb/Math.max(_.ids.length,1)),l=g.slice(0,s),l.every(_=>_.finished))break}let p=l.filter(c=>c.finished);return(p.length>0?p:l).sort((c,g)=>g.logProb/Math.max(g.ids.length,1)-c.logProb/Math.max(c.ids.length,1)).slice(0,s).map(c=>({ids:c.ids.slice(1),logProb:c.logProb}))}dispose(){this.encoderSession?.release(),this.decoderSession?.release(),this.encoderSession=null,this.decoderSession=null,this.loading=null}};function Wf(e){if(!e.trim())return!1;try{return Wy(e)}catch{return!1}}function Wy(e){let t=e.split(" ").filter(Boolean);if(t.length===0)return!1;let r=0;for(let i of t)if(i==="{"?r++:i==="}"&&r--,r<0)return!1;if(r!==0)return!1;for(let i=0;i<t.length;i++){if(t[i]==="\\frac"){let n=t.slice(i+1);if(Ly(n)<2)return!1}if(t[i]==="\\sqrt"&&t.slice(i+1).length===0)return!1}return!0}function Ly(e){let t=0,r=0;for(;r<e.length&&e[r]==="{";){t++;let i=1;for(r++;r<e.length&&i>0;)e[r]==="{"?i++:e[r]==="}"&&i--,r++}return t}he.wasm.numThreads=1;he.wasm.simd=!0;he.wasm.wasmPaths=new URL("./",self.location.href).href;var ni=null,ai=null;function Vy(){return ni||(ni=(async()=>{let e=new yr({encoderUrl:new URL("./encoder_int8.onnx",self.location.href).href,decoderUrl:new URL("./decoder_int8.onnx",self.location.href).href,executionProvider:"wasm",beamWidth:2,maxDecodeSteps:65});return await e.init(),e})().catch(e=>{throw ni=null,e})),ni}function Gy(){return ai||(ai=ba(new URL("./vocab.json",self.location.href).href).catch(e=>{throw ai=null,e})),ai}self.onmessage=async({data:e})=>{let{id:t,strokes:r,mode:i}=e||{};if(Number.isSafeInteger(t))try{if(!_a(r))throw new Error("Draw a mathematical expression with several clear pen points.");let[n,a]=await Promise.all([Vy(),Gy()]),s=await n.recognize(wa(r),a,i==="number"?"number":"expression");self.postMessage({id:t,latex:s.latex,totalMs:s.totalMs})}catch(n){self.postMessage({id:t,error:n?.message||"CoMER recognition failed"})}};})();
/*! Bundled license information:

onnxruntime-web/dist/ort.bundle.min.mjs:
  (*!
   * ONNX Runtime Web v1.24.2
   * Copyright (c) Microsoft Corporation. All rights reserved.
   * Licensed under the MIT License.
   *)

onnxruntime-web/dist/ort.bundle.min.mjs:
  (**
   * @license
   * Copyright 2021 Google LLC. All Rights Reserved.
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * =============================================================================
   *)
  (**
   * @license
   * Copyright 2020 Google LLC. All Rights Reserved.
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * =============================================================================
   *)
  (**
   * @license
   * Copyright 2019 Google LLC. All Rights Reserved.
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   * =============================================================================
   *)
*/
