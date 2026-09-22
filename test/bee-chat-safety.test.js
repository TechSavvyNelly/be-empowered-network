/* The bee-chat Edge Function carries its own copy of the crisis patterns,
   because a boundary must not depend on the client shipping correctly.
   This asserts the two copies agree on every case, so they cannot drift. */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');

// Load the server copy by stripping TypeScript syntax (no types at runtime).
const ts = fs.readFileSync(path.join(root, 'supabase/functions/bee-chat/safety.ts'), 'utf8')
  .replace(/export function isCrisis\(text: string\): boolean/, 'function isCrisis(text)')
  .replace(/^export /gm, '');
const serverIsCrisis = new Function(ts + '\nreturn isCrisis;')();

// Load the browser copy via the stubbed-DOM harness.
function el() {
  return { className:'', type:'', innerHTML:'', textContent:'', placeholder:'', style:{},
    setAttribute(){}, getAttribute(){return null;}, removeAttribute(){}, appendChild(){},
    addEventListener(){}, querySelector(){return el();}, querySelectorAll(){return [];},
    focus(){}, scrollHeight:0, scrollTop:0, classList:{add(){},remove(){}}, dataset:{}, hidden:false, disabled:false };
}
global.document = { createElement: el, querySelector: () => null, querySelectorAll: () => [],
  addEventListener(){}, body: el(), documentElement: el(), readyState:'complete', activeElement: el() };
global.location = { hash:'', search:'', href:'' };
global.localStorage = { getItem:()=>null, setItem(){}, removeItem(){} };
global.window = global;
global.requestAnimationFrame = () => {};
global.matchMedia = () => ({ matches:false });
require(path.join(root, 'chat-copy.js'));
require(path.join(root, 'chat.js'));
const browserIsCrisis = global.window.BeeSafety.isCrisis;

const CRISIS = [
  'i want to die', 'I want to kill myself', 'thinking about suicide', 'suicide',
  'i feel suicidal', "i don't want to live anymore", 'everyone would be better off dead',
  'i have been cutting myself', 'there is no reason to live', 'i might take an overdose',
  'i want to end my life', 'i keep thinking about self harm',
  'I wan die', 'i won die abeg', 'make i just die', 'I no wan live again',
  'I go kill myself', 'i wan kill myself', 'I don tire for life', 'life no get meaning',
  'e better make i die', 'i wan hurt myself', 'nobody go miss me',
  'i wan comot for this world', 'make i comot', 'I no wan see tomorrow',
  'life no make sense again', 'i dey cut myself', 'i be burden to my family',
];
const SAFE = [
  'i am so tired today', 'work dey stress me', 'i dey feel low small', 'my exam killed me',
  'i want to die of laughter', 'i am worried about my mother', 'e don tire me but i dey okay',
  'i no wan go work', 'the deadline is killing me', 'i am dying to see my sister',
  'this heat go kill person', 'wetin dey happen', 'i need help with my anxiety',
];

let pass = 0, fail = 0;
function check(text, want) {
  const s = serverIsCrisis(text), b = browserIsCrisis(text);
  const ok = s === want && b === want && s === b;
  ok ? pass++ : fail++;
  if (!ok) console.log(`  FAIL ${JSON.stringify(text)}  server=${s} browser=${b} want=${want}`);
}
console.log('--- crisis text: both copies must flag ---');
CRISIS.forEach(t => check(t, true));
console.log('--- safe text: neither copy may flag ---');
SAFE.forEach(t => check(t, false));

console.log(`\n${pass} passed, ${fail} failed  (${CRISIS.length + SAFE.length} cases x server+browser agreement)`);
process.exit(fail ? 1 : 0);
