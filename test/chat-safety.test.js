/* Safety net for Bee, the CBT companion.
   Run: node test/chat-safety.test.js
   These assertions guard the one thing in this codebase that must never
   silently regress -- whether a person in crisis is recognised, in
   English or in Nigerian Pidgin. */
// Stub just enough DOM for chat.js to load, then test its safety net.
function el() {
  return { className:'', type:'', innerHTML:'', textContent:'', placeholder:'', style:{},
    setAttribute(){}, getAttribute(){return null;}, removeAttribute(){}, appendChild(){},
    addEventListener(){}, querySelector(){return el();}, querySelectorAll(){return [];},
    focus(){}, scrollHeight:0, scrollTop:0, classList:{add(){},remove(){}}, dataset:{}, hidden:false, disabled:false };
}
global.document = {
  createElement: el, querySelector: () => null, querySelectorAll: () => [],
  addEventListener(){}, body: el(), documentElement: el(), readyState:'complete', activeElement: el()
};
global.location = { hash:'', search:'', href:'' };
global.localStorage = { getItem:()=>null, setItem(){}, removeItem(){} };
global.window = global;
global.requestAnimationFrame = () => {};
global.matchMedia = () => ({ matches:false });
global.setTimeout = setTimeout;

require(require('path').join(__dirname, '..', 'chat-copy.js'));
require(require('path').join(__dirname, '..', 'chat.js'));

const S = global.window.BeeSafety;
let pass = 0, fail = 0;
function t(label, got, want) {
  const ok = got === want; ok ? pass++ : fail++;
  console.log((ok ? '  ok   ' : '  FAIL ') + label + (ok ? '' : `  got=${got} want=${want}`));
}

console.log('--- CRISIS: English (must all be TRUE) ---');
[ 'i want to die', 'I want to kill myself', 'thinking about suicide',
  "i don't want to live anymore", 'everyone would be better off dead',
  'i have been cutting myself', 'there is no reason to live',
  'i might take an overdose', 'suicide', 'i feel suicidal',
  'i have suicidal thoughts', 'i want to end my life',
  'i keep thinking about self harm' ].forEach(s => t(JSON.stringify(s), S.isCrisis(s), true));

console.log('--- CRISIS: Pidgin (must all be TRUE) ---');
[ 'I wan die', 'i won die abeg', 'make i just die', 'I no wan live again',
  'I go kill myself', 'i wan kill myself', 'I don tire for life',
  'life no get meaning', 'e better make i die', 'i wan hurt myself',
  'nobody go miss me', 'i wan comot for this world', 'make i comot' ]
  .forEach(s => t(JSON.stringify(s), S.isCrisis(s), true));

console.log('--- NOT crisis (must all be FALSE) ---');
[ 'i am so tired today', 'work dey stress me', 'i dey feel low small',
  'my exam killed me', 'i want to die of laughter',
  'i am worried about my mother', 'e don tire me but i dey okay',
  'i no wan go work', 'the deadline is killing me',
  'i am dying to see my sister', 'this heat go kill person' ].forEach(s => t(JSON.stringify(s), S.isCrisis(s), false));

console.log('--- Pidgin detection ---');
[ ['wetin dey happen', true], ['abeg help me', true], ['i dey feel somehow, e don tey', true],
  ['na wahala be this', true], ['I am feeling quite anxious today', false],
  ['I cannot sleep at all tonight', false] ]
  .forEach(([s, want]) => t(JSON.stringify(s), S.looksPidgin(s), want));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
