/* Local mathematical SVG rendering. Ordinary writing retains the Equation font. */
(function(){
'use strict';
// A fixed package set prevents automatic extension or font downloads.
window.MathJax={startup:{typeset:false},tex:{packages:['base','ams'],maxBuffer:4096,maxMacros:200},svg:{fontCache:'local'},options:{enableMenu:false,enableAssistiveMml:false,menuOptions:{settings:{assistiveMml:false}}}};
// The 2.2 MB MathJax runtime is intentionally absent from the startup bundle.
// Load it only when a teacher opens the Beautify workflow. This stays fully local.
let loadingMathJax=null;
function ensure(){
 if(typeof window.MathJax?.tex2svg==='function')return Promise.resolve(window.MathJax);
 if(loadingMathJax)return loadingMathJax;
 loadingMathJax=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='vendor/mathjax/tex-svg-full-3.2.2.js';
  script.async=true;
  script.onload=()=>{
   Promise.resolve(window.MathJax?.startup?.promise).then(()=>{
    if(typeof window.MathJax?.tex2svg!=='function')throw new Error('Local maths renderer did not initialise');
    resolve(window.MathJax);
   },reject).catch(reject);
  };
  script.onerror=()=>reject(new Error('Local maths renderer could not load. Try again.'));
  document.head.appendChild(script);
 }).catch(err=>{loadingMathJax=null;throw err});
 return loadingMathJax;
}
const aliases={'²':'^{2}','³':'^{3}','⁻':'-','−':'-','×':'\\times ','÷':'\\div ','≤':'\\leq ','≥':'\\geq ','≠':'\\neq ','≈':'\\approx ','±':'\\pm ','∞':'\\infty ','∫':'\\int ','∑':'\\sum ','∏':'\\prod ','√':'\\sqrt ','π':'\\pi ','α':'\\alpha ','β':'\\beta ','θ':'\\theta ','°':'^{\\circ}'};
const allowed=new Set(('frac dfrac tfrac sqrt int iint iiint oint sum prod lim limits sin cos tan cot sec csc log ln exp min max sup inf det gcd alpha beta gamma Gamma delta Delta epsilon varepsilon zeta eta theta Theta vartheta iota kappa lambda Lambda mu nu xi Xi pi Pi varpi rho varrho sigma Sigma varsigma tau upsilon Upsilon phi Phi varphi chi psi Psi omega Omega times div cdot pm mp le leq ge geq ne neq approx cong equiv propto sim simeq in ni notin subset subseteq subsetneq supset supseteq sqsubseteq emptyset forall exists neg land lor cap cup bigcap bigcup vee wedge bigvee bigwedge oplus ominus otimes odot bigoplus bigcirc leftarrow rightarrow leftrightarrow Leftarrow Rightarrow Leftrightarrow to mapsto uparrow downarrow partial nabla infty angle triangle perpendicular parallel degree circ prime ldots cdots vdots ddots hat widehat tilde widetilde vec overline underline bar dot ddot not mathbb mathrm mathit mathbf mathcal mathsf mathtt operatorname text left right big Big bigg Bigg langle rangle lceil rceil lfloor rfloor lbrace rbrace lvert rvert lVert rVert backslash quad qquad space begin end').split(' '));
const units='mm|cm|km|m|mg|kg|g|mL|ml|kL|L|l|ms|s|min|h|Hz|kHz|MHz|N|kN|Pa|kPa|MPa|J|kJ|W|kW|MW|V|mV|A|mA|K|mol|rad|°C|°F|%|°';
for(const command of 'll gg longrightarrow hookrightarrow rightleftharpoons iff bullet aleph dagger hbar models perp top triangleleft triangleq vdash Vdash'.split(' '))allowed.add(command);
function unitText(value){
 let s=String(value??'').trim();if(!s||s.length>180||/[\\<>{}]/.test(s))return null;
 // Explicit unit mode/correction recognises only known measurement units.
 const term='(?:'+units+')(?:\\s*(?:\\^\\s*)?[-−]?[23²³])?';
 const quantity=new RegExp('^(?:[+−-]?\\d+(?:\\.\\d+)?\\s*)?'+term+'(?:\\s*[·*/]\\s*'+term+')*$');
 if(!quantity.test(s))return null;
 // Only exponents following unit names are raised; quantities such as 23 stay numbers.
 s=String(value).trim().replace(new RegExp('('+units+')\\s*(?:\\^\\s*)?([-−]?[23]|[²³])(?=\\s*(?:[·*/]|$))','g'),(_,u,p)=>u+(p.startsWith('-')||p.startsWith('−')?'⁻':'')+({'2':'²','3':'³','²':'²','³':'³'}[p.slice(-1)]));
 return s.replace(/(\d)(?=[a-zA-Z°])/g,'$1 ').replace(/\s*([·*/])\s*/g,' $1 ');
}
function normalize(value){
 let s=String(value??'').trim();if(!s||s.length>600)return null;
 // Unicode numeric roots need braces around the complete radicand.
 s=s.replace(/√\s*(\d+(?:\.\d+)?)/g,(_,number)=>'\\sqrt{'+number+'}');
 // Interpret ASCII / and * as arithmetic operators, without changing LaTeX commands.
 s=s.replace(/\*/g,' \\times ').replace(/\//g,' \\div ');
 s=s.replace(/[²³⁻−×÷≤≥≠≈±∞∫∑∏√παβθ°]/g,c=>aliases[c]);
 // Only literal measurement quantities are set upright; variables stay variables.
 s=s.replace(/(^|[\s+=({])([+-]?\d+(?:\.\d+)?)\s*(mm|cm|km|mg|kg|mL|ml|kL|mol|Hz|kHz|MHz|kPa|MPa|kJ|kW|mV|mA|rad|m|g|L|l|s|min|h|N|Pa|J|W|V|A|K)(?=\s*(?:[234^}/=+\-]|$))/g,(_,a,n,u)=>a+n+'\\,\\mathrm{'+u+'}');
 s=s.replace(/(\\mathrm\{[^}]+\})\s*([23])(?=\s*(?:$|[+\-=\/]))/g,'$1^{$2}');
 if(/(^|[^\\])[$#`]/.test(s))return null;
 let depth=0;for(let i=0;i<s.length;i++){if(s[i]==='\\'){i++;continue}if(s[i]==='{')depth++;if(s[i]==='}')depth--;if(depth<0||depth>16)return null}if(depth)return null;
 for(const m of s.matchAll(/\\([A-Za-z]+|.)/g)){if(/^[A-Za-z]+$/.test(m[1])?!allowed.has(m[1]):![' ', ',', ';', ':', '!', '{', '}', '|', '\\', '_', '%', '&', '#'].includes(m[1]))return null}
 for(const m of s.matchAll(/\\(?:begin|end)\{([^}]+)\}/g))if(!/^(?:[pbBvV]?matrix|cases|aligned|gathered)$/.test(m[1]))return null;
 return s;
}
function create(text,placement,colour){
 const tex=normalize(text),mj=window.MathJax;if(!tex||typeof mj?.tex2svg!=='function')return null;
 const ink=/^#[0-9a-f]{6}$/i.test(colour||'')?colour:'#17324d';
 try{
  const node=mj.tex2svg(tex,{display:true});if(node.querySelector('[data-mjx-error],merror'))return null;const svg=node.querySelector('svg');if(!svg||svg.querySelector('script,foreignObject,image,a'))return null;
  const W=Math.max(8,placement.w*Math.max(1,cssW)),H=Math.max(8,placement.h*Math.max(1,cssH));
  svg.setAttribute('width',String(W));svg.setAttribute('height',String(H));svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('style','color:'+ink);svg.setAttribute('color',ink);svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
  // MathJax uses currentColor and local SVG path definitions; no font requests.
  const xml=svg.outerHTML.replace(/currentColor/g,ink);
  return{type:'image',src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(xml),x:placement.x,y:placement.y,w:W/Math.max(1,cssW),h:H/Math.max(1,cssH),smartGenerated:true,smartType:'equation',smartId:'math-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),smartOriginal:[],equationExpression:String(text),equationLatex:tex,equationLayout:'in-place-math',equationColour:ink};
 }catch{return null}
}
window.WhiteboardMathRenderer=Object.freeze({create,normalize,unitText,ensure});
})();
