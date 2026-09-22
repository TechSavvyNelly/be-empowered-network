/* Crisis detection, English and Nigerian Pidgin.
   Mirrors the patterns in chat.js. Kept deliberately duplicated rather
   than imported: the browser copy is for speed, this copy is the
   boundary, and a boundary should not depend on the client shipping. */

const CRISIS_EN = new RegExp(
  '\\bsuicid' +
  '|\\b(kill\\s*(myself|me)|end\\s*(my\\s*life|it\\s*all)|take\\s*my\\s*(own\\s*)?life' +
  '|want(ing)?\\s*to\\s*die|wanna\\s*die|don\'?t\\s*want\\s*to\\s*(live|be\\s*alive|be\\s*here)' +
  '|better\\s*off\\s*(dead|without\\s*me)|hurt(ing)?\\s*myself|self[-\\s]?harm' +
  '|cut(ting)?\\s*myself|overdose|no\\s*reason\\s*to\\s*live|nothing\\s*to\\s*live\\s*for)\\b', 'i');

const CRISIS_PCM = new RegExp(
  '(\\bi\\s*(wan|won|wanna|want)\\s*(die|kill\\s*myself|end\\s*am|end\\s*my\\s*life)\\b)' +
  '|(\\bmake\\s*i\\s*(die|just\\s*die|kill\\s*myself|comot|kom[o]?t)\\b)' +
  '|(\\bi\\s*no\\s*(wan|won|want)\\s*(live|dey|dey\\s*alive|dey\\s*here|see\\s*tomorrow)\\b)' +
  '|(\\bi\\s*(go|wan|won)\\s*kill\\s*(myself|my\\s*self)\\b)' +
  '|(\\bi\\s*don\\s*tire\\s*(for|to)\\s*(life|dey|live)\\b)' +
  '|(\\blife\\s*no\\s*(get|make)\\s*(meaning|sense)\\b)' +
  '|(\\be\\s*better\\s*(make\\s*i|if\\s*i)\\s*(die|no\\s*dey)\\b)' +
  '|(\\bi\\s*(wan|won|dey)\\s*(hurt|injure|wound|cut)\\s*(myself|my\\s*body|my\\s*self)\\b)' +
  '|(\\bnobody\\s*(go|dey)\\s*(miss|notice)\\s*me\\b)' +
  '|(\\bi\\s*be\\s*burden\\b)' +
  '|(\\bi\\s*wan\\s*comot\\s*for\\s*(this\\s*)?(world|life)\\b)', 'i');

const NOT_CRISIS = /\b(die|dying)\s*(of|from)?\s*(laughter|laughing|embarrassment)\b|\bdie\s*laughing\b/i;

export function isCrisis(text: string): boolean {
  if (NOT_CRISIS.test(text)) return false;
  return CRISIS_EN.test(text) || CRISIS_PCM.test(text);
}
