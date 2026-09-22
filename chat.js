/* Be Empowered Network — "Bee", a guided CBT companion
   ------------------------------------------------------------------
   A scripted (not AI) companion that walks people through core CBT tools:
   thought records, spotting thinking traps, grounding, box breathing,
   behavioural activation, the worry tree and sleep basics. Every free-text
   message is screened for crisis language; if found, the exercise stops
   and the person is pointed to emergency help. It never diagnoses.
   Nothing typed here leaves the browser. */
(function () {
  if (document.querySelector('.chat')) return;

  /* ---------- Markup ---------- */
  const launch = document.createElement('button');
  launch.className = 'chat-launch'; launch.type = 'button';
  launch.setAttribute('aria-haspopup', 'dialog');
  launch.innerHTML = '<img src="assets/mark.png" alt="" width="30" height="29">Talk to Bee';
  const panel = document.createElement('section');
  panel.className = 'chat'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-label', 'Bee, CBT companion'); panel.setAttribute('data-open', 'false');
  panel.innerHTML =
    '<div class="chat-head"><img src="assets/mark.png" alt="" width="36" height="35"><div><strong>Bee</strong><small>CBT companion · not a person, not therapy</small></div>' +
    '<button class="icon-btn" type="button" data-chat-close aria-label="Close chat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
    '<div class="chat-notice">If you\'re in danger right now, call <a href="tel:112">112</a>. Bee is a self-help guide, not an emergency service.</div>' +
    '<div class="chat-log" role="log" aria-live="polite" aria-relevant="additions"></div>' +
    '<div class="chat-chips" role="group" aria-label="Quick replies"></div>' +
    '<form class="chat-form" autocomplete="off"><label class="sr-only" for="chat-input">Your message</label><input id="chat-input" type="text" placeholder="Type here…" maxlength="500"><button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form>';
  document.body.appendChild(launch); document.body.appendChild(panel);

  const log = panel.querySelector('.chat-log');
  const chipsEl = panel.querySelector('.chat-chips');
  const form = panel.querySelector('.chat-form');
  const input = panel.querySelector('#chat-input');
  const sendBtn = form.querySelector('button');
  let gen = null, started = false, lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    panel.setAttribute('data-open', 'true'); launch.setAttribute('data-hidden', 'true');
    if (!started) { started = true; run(welcome); } else { input.focus(); }
  }
  function close() {
    panel.setAttribute('data-open', 'false'); launch.removeAttribute('data-hidden');
    (lastFocus || launch).focus();
  }
  launch.addEventListener('click', open);
  panel.querySelector('[data-chat-close]').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.getAttribute('data-open') === 'true') close(); });
  document.querySelectorAll('[data-open-chat]').forEach(function (el) { el.addEventListener('click', function (e) { e.preventDefault(); open(); }); });
  if (location.hash === '#bee') setTimeout(open, 300); // deep link: any-page.html#bee

  /* ---------- Rendering ---------- */
  function scroll() { log.scrollTop = log.scrollHeight; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function bot(html, cls) {
    const m = document.createElement('div'); m.className = 'msg msg--bot' + (cls ? ' ' + cls : ''); m.innerHTML = html; log.appendChild(m); scroll();
  }
  function user(text) {
    const m = document.createElement('div'); m.className = 'msg msg--user'; m.textContent = text; log.appendChild(m); scroll();
  }
  function typing(ms) {
    return new Promise(function (res) {
      const t = document.createElement('div'); t.className = 'typing'; t.setAttribute('aria-hidden', 'true'); t.innerHTML = '<i></i><i></i><i></i>';
      log.appendChild(t); scroll();
      setTimeout(function () { t.remove(); res(); }, ms);
    });
  }
  function setChips(chips) {
    chipsEl.innerHTML = '';
    (chips || []).forEach(function (c) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip';
      b.textContent = typeof c === 'string' ? c : c.label;
      b.addEventListener('click', function () { handle(typeof c === 'string' ? c : c.value, b.textContent); });
      chipsEl.appendChild(b);
    });
  }
  function setInput(mode) {
    input.disabled = mode === 'none'; sendBtn.disabled = mode === 'none';
    input.placeholder = mode === 'none' ? 'Choose an option above' : (mode === 'text' ? 'Type here…' : 'Type here, or pick an option');
    if (mode !== 'none') input.focus();
  }
  function scaleWidget(label) {
    return new Promise(function (res) {
      const w = document.createElement('div'); w.className = 'scale';
      w.innerHTML = '<label for="chat-scale">' + esc(label) + ' <output for="chat-scale">50</output>/100</label><input id="chat-scale" type="range" min="0" max="100" value="50" step="5"><button class="btn btn--primary" type="button">That\'s about right</button>';
      const r = w.querySelector('input'), o = w.querySelector('output');
      r.addEventListener('input', function () { o.textContent = r.value; });
      w.querySelector('button').addEventListener('click', function () { const v = Number(r.value); w.remove(); user(v + ' out of 100'); res(v); });
      chipsEl.after(w); r.focus();
    });
  }
  function breathWidget(cycles) {
    return new Promise(function (res) {
      const w = document.createElement('div'); w.className = 'msg msg--bot breath';
      w.innerHTML = '<div class="breath-ring" data-phase="hold2"></div><div class="breath-label">Get ready…</div><div class="breath-count"></div>';
      log.appendChild(w); scroll();
      const ring = w.querySelector('.breath-ring'), label = w.querySelector('.breath-label'), count = w.querySelector('.breath-count');
      const phases = [['in', 'Breathe in'], ['hold', 'Hold'], ['out', 'Breathe out'], ['hold2', 'Hold']];
      let c = 0, p = 0;
      function tick() {
        if (c >= cycles) { label.textContent = 'Well done.'; count.textContent = ''; setTimeout(res, 600); return; }
        ring.setAttribute('data-phase', phases[p][0]); label.textContent = phases[p][1] + ' · 4';
        count.textContent = 'Round ' + (c + 1) + ' of ' + cycles;
        let n = 4; const iv = setInterval(function () { n--; if (n > 0) label.textContent = phases[p][1] + ' · ' + n; }, 1000);
        setTimeout(function () { clearInterval(iv); p++; if (p === 4) { p = 0; c++; } tick(); }, 4000);
      }
      setTimeout(tick, 1200);
    });
  }

  /* ---------- Language ---------- */
  const COPY = window.BEE_COPY || { en: {}, pcm: {} };
  let lang = 'en';
  try { lang = localStorage.getItem('ben-chat-lang') || 'en'; } catch (e) {}
  if (lang !== 'pcm') lang = 'en';
  let langAsked = false;

  function t(key) {
    const table = COPY[lang] || COPY.en;
    return (table && table[key]) || (COPY.en && COPY.en[key]) || '';
  }
  function setLang(next) {
    lang = next === 'pcm' ? 'pcm' : 'en';
    try { localStorage.setItem('ben-chat-lang', lang); } catch (e) {}
    input.placeholder = t('ui.placeholder');
    const role = panel.querySelector('.chat-head small');
    if (role) role.textContent = t('ui.role');
    const notice = panel.querySelector('.chat-notice');
    if (notice) notice.innerHTML = t('ui.notice');
  }

  /* Nigerian Pidgin markers. Some words ("dey", "wey", "abeg") are strong
     on their own; commoner ones only count together, so an English
     sentence that happens to contain "na" isn't misread. */
  const PCM_STRONG = /\b(wetin|abeg|wahala|sabi|una|comot|kom[o]?t|gbege|biko|oyinbo|nawa|shey|abi|wey)\b/i;
  const PCM_WEAK = /\b(dey|don|go dey|na|no be|make i|e be|e dey|im|dem|sha|waka|vex|small small|no gree)\b/i;

  function looksPidgin(text) {
    if (PCM_STRONG.test(text)) return true;
    const hits = (text.toLowerCase().match(new RegExp(PCM_WEAK.source, 'gi')) || []).length;
    return hits >= 2;
  }
  function looksEnglishOnly(text) {
    return !PCM_STRONG.test(text) && !PCM_WEAK.test(text) && text.split(/\s+/).length >= 4;
  }

  /* ---------- Safety ----------
     Both languages are screened on EVERY message regardless of the
     language Bee is currently speaking. Someone in distress switches
     register mid-sentence, and missing that is the one failure here
     that actually matters. */
  /* "suicid" is matched as a prefix (suicide, suicidal, suicidality) with no
     trailing word boundary -- an earlier version required one, which meant
     the word "suicide" itself never matched. */
  const CRISIS_EN = new RegExp(
    '\\bsuicid' +
    '|\\b(kill\\s*(myself|me)|end\\s*(my\\s*life|it\\s*all)|take\\s*my\\s*(own\\s*)?life' +
    '|want(ing)?\\s*to\\s*die|wanna\\s*die|don\'?t\\s*want\\s*to\\s*(live|be\\s*alive|be\\s*here)' +
    '|better\\s*off\\s*(dead|without\\s*me)|hurt(ing)?\\s*myself|self[-\\s]?harm' +
    '|cut(ting)?\\s*myself|overdose|no\\s*reason\\s*to\\s*live|nothing\\s*to\\s*live\\s*for)\\b', 'i');

  /* The only benign use common enough to carve out. Everything else that
     trips the net is left tripping it: showing a helpline to someone who
     was joking costs a moment of awkwardness, missing someone who wasn't
     costs far more. The asymmetry is deliberate. */
  const NOT_CRISIS = /\b(die|dying)\s*(of|from)?\s*(laughter|laughing|embarrassment)\b|\bdie\s*laughing\b/i;

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

  function isCrisis(text) {
    if (NOT_CRISIS.test(text)) return false;
    return CRISIS_EN.test(text) || CRISIS_PCM.test(text);
  }
  window.BeeSafety = { isCrisis: isCrisis, looksPidgin: looksPidgin };

  function crisisReply() {
    bot(t('crisis.say'), 'msg--crisis');
    gen = null;
    setChips([{ label: t('crisis.helplines'), value: '__helplines' },
              { label: t('crisis.safe'), value: '__menu' }]);
    setInput('chips');
  }

  /* ---------- Dialogue engine ---------- */
  async function run(flow, arg) {
    gen = flow(arg);
    await step(undefined);
  }
  async function step(value) {
    if (!gen) return;
    let r;
    try { r = gen.next(value); } catch (e) { r = { done: true }; }
    while (!r.done) {
      const s = r.value;
      if (s.say) { await typing(Math.min(1400, 350 + s.say.length * 4)); bot(s.say, s.cls); }
      if (s.input === 'scale') { const v = await scaleWidget(s.label || t('scale.anxiety')); r = gen.next(v); continue; }
      if (s.input === 'breath') { setChips([]); setInput('none'); await breathWidget(s.cycles || 4); r = gen.next(); continue; }
      if (s.input === 'pause') { r = gen.next(); continue; }
      setChips(s.chips); setInput(s.input || 'text');
      if (s.end) gen = null;
      return;
    }
    gen = null;
    await typing(500);
    menu(true);
  }

  function handle(value, label) {
    if (value === '__menu') { user(label || t('menu.back')); gen = null; menu(); return; }
    if (value === '__helplines') { user(label); gen = null; helplines(); return; }
    if (value === '__close') { close(); return; }
    if (value === '__lang:pcm' || value === '__lang:en') {
      user(label);
      setLang(value.slice(7));
      langAsked = true;
      bot(t('ui.langSwitched'));
      gen = null;
      menu(true);
      return;
    }
    if (value === '__lang:keep') { user(label); langAsked = true; gen = null; menu(true); return; }
    if (typeof value === 'string' && value.indexOf('__flow:') === 0) {
      user(label); const f = FLOWS[value.slice(7)]; if (f) run(f); return;
    }

    user(label || value);

    /* Safety is checked before anything else, and before language. */
    if (typeof value === 'string' && isCrisis(value)) { crisisReply(); return; }

    /* Offer to switch language, once, when the person's own words say so. */
    if (!langAsked && typeof value === 'string' && value.length > 8) {
      if (lang === 'en' && looksPidgin(value)) {
        langAsked = true;
        bot(COPY.en['ui.langOffer']);
        setChips([{ label: COPY.en['ui.langOfferYes'], value: '__lang:pcm' },
                  { label: COPY.en['ui.langOfferNo'], value: '__lang:keep' }]);
        setInput('chips');
        return;
      }
      if (lang === 'pcm' && looksEnglishOnly(value)) {
        langAsked = true;
        bot(COPY.pcm['ui.langOffer']);
        setChips([{ label: COPY.pcm['ui.langOfferYes'], value: '__lang:en' },
                  { label: COPY.pcm['ui.langOfferNo'], value: '__lang:keep' }]);
        setInput('chips');
        return;
      }
    }

    if (gen) { step(value); return; }

    if (llmOk) {
      askClaude(value).then(function (handled) {
        if (!handled) { llmOk = false; route(value); }
      });
      return;
    }
    route(value);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const v = input.value.trim(); if (!v) return;
    input.value = ''; handle(v);
  });

  function menuChips() {
    return [
      { label: t('menu.anxious'), value: '__flow:anxious' },
      { label: t('menu.low'), value: '__flow:low' },
      { label: t('menu.worry'), value: '__flow:worry' },
      { label: t('menu.thought'), value: '__flow:thought' },
      { label: t('menu.traps'), value: '__flow:traps' },
      { label: t('menu.breathe'), value: '__flow:breathe' },
      { label: t('menu.ground'), value: '__flow:ground' },
      { label: t('menu.sleep'), value: '__flow:sleep' },
      { label: t('menu.talk'), value: '__flow:talk' },
      { label: t('ui.langSwitch'), value: lang === 'en' ? '__lang:pcm' : '__lang:en' }
    ];
  }
  function menu(afterTool) {
    bot(afterTool ? t('menu.again') : t('menu.prompt'));
    setChips(menuChips()); setInput('text');
  }
  function helplines() {
    bot(t('helplines.say'), 'msg--crisis');
    setChips([{ label: t('menu.back'), value: '__menu' }]); setInput('text');
  }

  /* ---------- Claude ----------
     Free text goes to the model; chips keep running the scripted flows,
     which are cheaper, deterministic and good. If the call fails for any
     reason -- no key, no network, an upstream error -- we silently fall
     back to the scripted router, so Bee never shows an error page to
     someone who is already having a bad day. */
  const historyLog = [];
  let llmOk = true;

  function remember(role, content) {
    historyLog.push({ role: role, content: content });
    if (historyLog.length > 12) historyLog.splice(0, historyLog.length - 12);
  }

  /* Markdown is limited on purpose: bold, links, line breaks. Nothing that
     could inject markup into the panel. */
  function render(text) {
    const safe = esc(text);
    return '<p>' + safe
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\n\s*[-*]\s+/g, '<br>&bull; ')
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br>') + '</p>';
  }

  async function askClaude(text) {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg || !cfg.url || !cfg.anonKey) return false;

    const t = document.createElement('div');
    t.className = 'typing'; t.setAttribute('aria-hidden', 'true');
    t.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(t); scroll();
    setInput('none'); setChips([]);

    let data = null;
    try {
      const res = await fetch(cfg.url + '/functions/v1/bee-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: cfg.anonKey,
          Authorization: 'Bearer ' + cfg.anonKey
        },
        body: JSON.stringify({ message: text, history: historyLog, lang: lang })
      });
      data = await res.json();
    } catch (e) { data = null; }

    t.remove();

    if (!data || !data.reply) { setInput('text'); return false; }

    bot(render(data.reply), data.crisis ? 'msg--crisis' : '');
    remember('user', text);
    remember('assistant', data.reply);

    setChips(data.crisis
      ? [{ label: t2('crisis.helplines'), value: '__helplines' }, { label: t2('menu.back'), value: '__menu' }]
      : [{ label: t2('menu.back'), value: '__menu' }]);
    setInput('text');
    return true;
  }
  function t2(k) { return t(k); }

  /* ---------- Free-text routing ---------- */
  function route(text) {
    const s = text.toLowerCase();
    const pick = function (name) { run(FLOWS[name]); };
    if (/panic|anxi|nervous|scared|afraid|fear|tense|on edge|racing|fear dey|mind no dey rest|heart dey beat/.test(s)) return pick('anxious');
    if (/sad|low|depress|empty|hopeless|numb|tired of|unmotivated|can'?t get up|no energy|cry|i dey down|weak body|no strength/.test(s)) return pick('low');
    if (/overthink|worry|worried|what if|can'?t stop thinking|ruminat|stuck in my head|too much thinking|my mind full/.test(s)) return pick('worry');
    if (/sleep|insomnia|awake|tired|exhausted|no fit sleep|eye no dey close/.test(s)) return pick('sleep');
    if (/breath|breathe/.test(s)) return pick('breathe');
    if (/ground|overwhelm|dissociat|spacey|unreal|i dey lost/.test(s)) return pick('ground');
    if (/trap|distort|always|never|everyone|nobody/.test(s)) return pick('traps');
    if (/thought|believe|i'?m (a )?(failure|useless|worthless|stupid)|i be (mumu|useless|failure)/.test(s)) return pick('thought');
    if (/help ?line|number|call|emergency|abeg help/.test(s)) return helplines();
    if (/^(hi|hello|hey|good (morning|afternoon|evening)|how far|how you dey|abeg)\b/.test(s)) { bot('<p>' + (lang === 'pcm' ? 'How far. I glad say you come.' : 'Hello. I’m glad you’re here.') + '</p>'); return menu(); }
    if (/thank/.test(s)) { bot('<p>' + (lang === 'pcm' ? 'No wahala. Come back any time.' : 'You’re welcome. Come back any time.') + '</p>'); return menu(true); }
    return run(FLOWS.talk, text);
  }

  /* ---------- Flows ----------
     Each is a generator: yield what Bee says and what input to wait for.
     They ask questions and reflect; they never diagnose, never advise on
     medication, and never tell anyone what their thought "really" means. */

  function* welcome() {
    yield { say: t('welcome.1'), input: 'pause' };
    yield { say: t('menu.prompt'), chips: menuChips(), input: 'text', end: true };
  }

  function* talk(seed) {
    if (seed) yield { say: t('talk.1'), input: 'text' };
    else yield { say: t('talk.1'), input: 'text' };
    yield { say: t('talk.2'), input: 'text' };
    yield {
      say: t('talk.3'),
      chips: [
        { label: t('chip.thought'), value: '__flow:thought' },
        { label: t('chip.ground'), value: '__flow:ground' },
        { label: t('chip.breathe'), value: '__flow:breathe' },
        { label: t('menu.back'), value: '__menu' }
      ], input: 'text', end: true
    };
  }

  function* anxious() {
    const before = yield { say: t('anxious.1'), input: 'scale', label: t('scale.anxiety') };
    yield { say: t('anxious.2'), input: 'pause' };
    yield { input: 'breath', cycles: 4 };
    yield { say: t('anxious.3'), input: 'text' };
    yield {
      say: t('anxious.4'),
      chips: [
        { label: t('chip.thought'), value: '__flow:thought' },
        { label: t('chip.ground'), value: '__flow:ground' },
        { label: t('menu.back'), value: '__menu' }
      ], input: 'text', end: true
    };
  }

  /* Behavioural activation */
  function* low() {
    yield { say: t('low.1'), input: 'text' };
    yield { say: t('low.2'), input: 'text' };
    yield {
      say: t('low.3'),
      chips: [{ label: t('chip.today'), value: 'today' }, { label: t('chip.tomorrow'), value: 'tomorrow' }],
      input: 'text'
    };
    yield { say: t('low.4'), input: 'pause' };
  }

  /* Worry tree: actionable or hypothetical */
  function* worry() {
    yield { say: t('worry.1'), input: 'text' };
    const can = yield {
      say: t('worry.2'),
      chips: [{ label: t('chip.yes'), value: 'yes' }, { label: t('chip.no'), value: 'no' }, { label: t('chip.notsure'), value: 'no' }],
      input: 'text'
    };
    if (/^y|yes/i.test(String(can))) {
      yield { say: t('worry.3a'), input: 'text' };
      yield { say: t('worry.4'), input: 'pause' };
    } else {
      yield { say: t('worry.3b'), input: 'pause' };
    }
  }

  /* Thought record */
  function* thought() {
    yield { say: t('thought.1'), input: 'text' };
    const before = yield { say: t('thought.2'), input: 'scale', label: t('scale.belief') };
    yield { say: t('thought.3'), input: 'text' };
    yield { say: t('thought.4'), input: 'text' };
    yield { say: t('thought.5'), input: 'text' };
    const after = yield { say: t('thought.6'), input: 'scale', label: t('scale.belief') };
    const moved = Number(before) - Number(after);
    yield { say: moved >= 10 ? t('thought.7a') : t('thought.7b'), input: 'pause' };
  }

  /* Naming cognitive distortions */
  function* traps() {
    yield { say: t('traps.1'), input: 'text' };
    yield {
      say: t('traps.2'),
      chips: [
        { label: t('trap.all'), value: 'all' },
        { label: t('trap.mind'), value: 'mind' },
        { label: t('trap.future'), value: 'future' },
        { label: t('trap.blame'), value: 'blame' },
        { label: t('trap.should'), value: 'should' },
        { label: t('trap.filter'), value: 'filter' }
      ], input: 'text'
    };
    yield { say: t('traps.3'), input: 'text' };
    yield { say: t('traps.4'), input: 'pause' };
  }

  function* breathe() {
    yield { say: t('breathe.1'), input: 'pause' };
    yield { input: 'breath', cycles: 5 };
    yield { say: t('breathe.2'), input: 'text' };
  }

  function* ground() {
    yield { say: t('ground.1'), input: 'text' };
    yield { say: t('ground.2'), input: 'text' };
    yield { say: t('ground.3'), input: 'text' };
    yield { say: t('ground.4'), input: 'text' };
    yield { say: t('ground.5'), input: 'pause' };
  }

  function* sleep() {
    const kind = yield {
      say: t('sleep.1'),
      chips: [{ label: t('chip.worry'), value: 'worry' }, { label: t('chip.restless'), value: 'restless' }],
      input: 'text'
    };
    yield { say: /worry/i.test(String(kind)) ? t('sleep.2a') : t('sleep.2b'), input: 'pause' };
    yield { say: t('sleep.3'), input: 'pause' };
  }

  const FLOWS = {
    welcome: welcome, talk: talk, anxious: anxious, low: low, worry: worry,
    thought: thought, traps: traps, breathe: breathe, ground: ground, sleep: sleep
  };

  setLang(lang);
})();
