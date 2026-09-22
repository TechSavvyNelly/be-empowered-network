/* Bee's conduct: it must ask rather than tell, never present itself as a
   therapist, and always leave a route to real care. Asserted in both
   languages so the Pidgin side cannot quietly drift. */
// Walk the scripted flows and assert Bee asks questions and signposts.
function el(){return{className:'',type:'',innerHTML:'',textContent:'',placeholder:'',style:{},
 setAttribute(){},getAttribute(){return null},removeAttribute(){},appendChild(){},addEventListener(){},
 querySelector(){return el()},querySelectorAll(){return[]},focus(){},scrollHeight:0,scrollTop:0,
 classList:{add(){},remove(){}},dataset:{},hidden:false,disabled:false};}
global.document={createElement:el,querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},
 body:el(),documentElement:el(),readyState:'complete',activeElement:el()};
global.location={hash:'',search:'',href:''};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.window=global; global.requestAnimationFrame=()=>{}; global.matchMedia=()=>({matches:false});
require(require('path').join(__dirname,'..','chat-copy.js'));
const C = global.window.BEE_COPY;

let pass=0, fail=0;
function t(label, cond){ cond?pass++:fail++; console.log((cond?'  ok   ':'  FAIL ')+label); }

for (const lang of ['en','pcm']) {
  const L = C[lang];
  console.log(`--- ${lang} ---`);
  // Bee must ask, not tell: the core prompts end in a question.
  const asks = ['talk.1','talk.2','anxious.3','low.1','worry.2','thought.1','thought.3','traps.1','pro.1'];
  t(`${lang}: core prompts ask a question`, asks.every(k => (L[k]||'').includes('?')));
  // Never claims to be a therapist.
  const all = Object.values(L).join(' ').toLowerCase();
  t(`${lang}: never calls itself a therapist`, !/i am a therapist|i'm a therapist|as your therapist/.test(all));
  t(`${lang}: states it is not therapy`, /not therapy|no be therapy/.test(all));
  // Signposts to professionals and the directory.
  t(`${lang}: links the directory`, all.includes('directory.html'));
  t(`${lang}: names a registration body`, /mdcn/.test(all));
  t(`${lang}: says it is not treatment`, /not treatment|no be treatment/.test(all));
  // Crisis copy carries the emergency number and a human line.
  t(`${lang}: crisis copy has 112`, L['crisis.say'].includes('112'));
  t(`${lang}: crisis copy has a helpline`, /0809 111 6264/.test(L['crisis.say']));
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
