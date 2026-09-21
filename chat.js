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

  /* ---------- Safety ---------- */
  const CRISIS = /\b(suicid|kill (myself|me)|end (my|it all)|end my life|take my (own )?life|want to die|don'?t want to (live|be alive|be here)|better off (dead|without me)|hurt(ing)? myself|self[- ]?harm|cut(ting)? myself|overdose|no reason to live)\b/i;
  function crisisReply() {
    bot('<p>Thank you for telling me. What you just said matters, and I want to make sure you get more than a chatbot right now.</p>' +
        '<p><strong>If you are in immediate danger:</strong><a class="num-big" href="tel:112">Call 112</a>' +
        '<strong>To talk to a person now:</strong></p><ul><li>MANI: <a href="tel:+2348091116264">0809 111 6264</a></li><li>NSPI: <a href="tel:+2348062106493">0806 210 6493</a></li></ul>' +
        '<p>If you can, tell someone near you how you feel, or go to the nearest hospital. You deserve support from a real person tonight, not just from me.</p>', 'msg--crisis');
    gen = null;
    setChips([{ label: 'Show all helplines', value: '__helplines' }, { label: 'I\'m safe. Keep going', value: '__menu' }]);
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
      if (s.input === 'scale') { const v = await scaleWidget(s.label || 'How strong is it right now?'); r = gen.next(v); continue; }
      if (s.input === 'breath') { setChips([]); setInput('none'); await breathWidget(s.cycles || 4); r = gen.next(); continue; }
      if (s.input === 'pause') { r = gen.next(); continue; }
      setChips(s.chips); setInput(s.input || 'text');
      if (s.end) gen = null; // hand control back to free-text routing
      return; // wait for the person
    }
    gen = null;
    await typing(500);
    menu(true);
  }
  function handle(value, label) {
    if (value === '__menu') { user(label || 'Back to the menu'); gen = null; menu(); return; }
    if (value === '__helplines') { user(label); gen = null; helplines(); return; }
    if (value === '__close') { close(); return; }
    if (typeof value === 'string' && value.indexOf('__flow:') === 0) { user(label); const f = FLOWS[value.slice(7)]; if (f) { run(f); } return; }
    user(label || value);
    if (typeof value === 'string' && CRISIS.test(value)) { crisisReply(); return; }
    if (gen) { step(value); } else { route(value); }
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const v = input.value.trim(); if (!v) return;
    input.value = ''; handle(v);
  });

  const MENU_CHIPS = [
    { label: 'I\'m anxious', value: '__flow:anxious' },
    { label: 'I\'m feeling low', value: '__flow:low' },
    { label: 'I can\'t stop overthinking', value: '__flow:worry' },
    { label: 'Challenge a thought', value: '__flow:thought' },
    { label: 'Breathe with me', value: '__flow:breathe' },
    { label: 'Ground me', value: '__flow:ground' },
    { label: 'I can\'t sleep', value: '__flow:sleep' },
    { label: 'Just talk', value: '__flow:talk' }
  ];
  function menu(afterTool) {
    bot(afterTool ? '<p>What would you like to do next?</p>' : '<p>What\'s going on for you right now? Pick one, or type in your own words.</p>');
    setChips(MENU_CHIPS); setInput('text');
  }
  function helplines() {
    bot('<p><strong>Emergency (Nigeria):</strong> <a href="tel:112">112</a></p><p><strong>MANI:</strong> <a href="tel:+2348091116264">0809 111 6264</a><br><strong>NSPI:</strong> <a href="tel:+2348062106493">0806 210 6493</a></p><p><a href="get-help.html">All support options →</a></p>', 'msg--crisis');
    setChips([{ label: 'Back to the menu', value: '__menu' }]); setInput('text');
  }
  /* Free-text routing when no exercise is running */
  function route(text) {
    const t = text.toLowerCase();
    const pick = function (name) { run(FLOWS[name]); };
    if (/panic|anxi|nervous|scared|afraid|fear|tense|on edge|racing/.test(t)) return pick('anxious');
    if (/sad|low|depress|empty|hopeless|numb|tired of|unmotivated|can'?t get up|no energy|cry/.test(t)) return pick('low');
    if (/overthink|worry|worried|what if|can'?t stop thinking|ruminat|stuck in my head/.test(t)) return pick('worry');
    if (/sleep|insomnia|awake|tired|exhausted/.test(t)) return pick('sleep');
    if (/breath/.test(t)) return pick('breathe');
    if (/ground|overwhelm|dissociat|spacey|unreal/.test(t)) return pick('ground');
    if (/thought|believe|i'?m (a )?(failure|useless|worthless|stupid)|everyone|nobody|always|never/.test(t)) return pick('thought');
    if (/help ?line|number|call|emergency/.test(t)) return helplines();
    if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(t)) { bot('<p>Hello. I\'m glad you\'re here.</p>'); return menu(); }
    if (/thank/.test(t)) { bot('<p>You\'re welcome. Come back any time.</p>'); return menu(true); }
    return run(FLOWS.talk, text);
  }

  /* ---------- Flows (generators) ---------- */
  function* welcome() {
    yield { say: '<p>Hi, I\'m Bee. I\'m not a person and I\'m not therapy, but I can walk you through a few tools from cognitive behavioural therapy (CBT) that many people find useful when things get heavy.</p><p>Nothing you type here is stored or sent anywhere.</p>', input: 'pause' };
    yield { say: '<p>What\'s going on for you right now? Pick one, or type in your own words.</p>', chips: MENU_CHIPS, input: 'text', end: true };
  }

  function* talk(seed) {
    let what = seed;
    if (!what) what = yield { say: '<p>I\'m listening. What\'s been going on?</p>', input: 'text' };
    const feel = yield { say: '<p>Thank you for putting that into words. It takes something to do that.</p><p>If you had to name the main feeling underneath it, what would it be?</p>', chips: ['Anxious', 'Sad', 'Angry', 'Overwhelmed', 'Lonely', 'Ashamed', 'Numb'], input: 'text' };
    const f = String(feel).toLowerCase();
    const strength = yield { say: '<p>' + esc(feel) + '. That makes sense given what you described.</p>', input: 'scale', label: 'How strong is that feeling right now?' };
    const suggestion = /anx|panic|overwhelm/.test(f) ? ['ground', 'Try a grounding exercise'] :
                       /sad|lonely|numb|low/.test(f) ? ['low', 'Do one small thing'] :
                       /sham|angry/.test(f) ? ['thought', 'Look at the thought behind it'] : ['breathe', 'Take four slow breaths'];
    yield { say: '<p>' + (strength >= 70 ? 'That\'s a lot to be carrying. ' : '') + 'In CBT, feelings are linked to what we\'re thinking and what we\'re doing, and we can work on either side.</p><p>Would you like to try something?</p>',
            chips: [{ label: suggestion[1], value: '__flow:' + suggestion[0] }, { label: 'Challenge a thought', value: '__flow:thought' }, { label: 'Just keep talking', value: 'keep' }, { label: 'See the menu', value: '__menu' }], input: 'text' };
    // "keep talking" path
    const more = yield { say: '<p>Okay. Tell me more about what\'s hardest about it.</p>', input: 'text' };
    yield { say: '<p>It sounds like that part is weighing on you. Sometimes just saying it out loud loosens it a little.</p><p>If you want, a real person at Be Empowered Network will read a message from you. <a href="contact.html">Reach out here.</a></p>', input: 'pause' };
  }

  function* anxious() {
    const where = yield { say: '<p>Anxiety is your body\'s alarm going off. The alarm is real even when the danger isn\'t. Let\'s turn the volume down first, then look at what set it off.</p><p>Where do you feel it most right now?</p>', chips: ['Chest / breathing', 'Racing thoughts', 'Stomach', 'Restless / can\'t sit still', 'Everywhere'], input: 'text' };
    const w = String(where).toLowerCase();
    if (/chest|breath|everywhere/.test(w)) {
      yield { say: '<p>Let\'s slow your breathing. Follow the circle: in for 4, hold 4, out 4, hold 4. Four rounds.</p>', input: 'breath', cycles: 4 };
    } else if (/stomach|restless/.test(w)) {
      yield { say: '<p>Let\'s bring you back into the room. Look around and name <strong>5 things you can see</strong>.</p>', input: 'text' };
      yield { say: '<p>Good. Now <strong>4 things you can feel</strong>, like your feet on the floor, the chair, your clothes.</p>', input: 'text' };
      yield { say: '<p>And <strong>3 things you can hear</strong>.</p>', input: 'text' };
    } else {
      yield { say: '<p>Let\'s get the thoughts out of your head and onto the screen, where they\'re easier to look at. What\'s the main thought racing round?</p>', input: 'text' };
    }
    const after = yield { say: '<p>Nice work. Now, the thinking part. Anxiety almost always contains a prediction: "something bad is going to happen." What is the bad thing your mind is predicting?</p>', input: 'text' };
    const prob = yield { say: '<p>Okay: "<em>' + esc(after) + '</em>".</p>', input: 'scale', label: 'Honestly, how likely is that, 0 to 100?' };
    const cope = yield { say: '<p>' + (prob <= 40 ? 'So your mind is treating a ' + prob + '% possibility like a certainty. That\'s what anxiety does: it confuses <em>possible</em> with <em>probable</em>.' : 'You rate it fairly likely, so let\'s plan for it rather than dread it.') + '</p><p>If it did happen, what is one thing you could do to cope or get through it?</p>', input: 'text' };
    yield { say: '<p>"' + esc(cope) + '." That\'s your coping statement. Anxiety says <em>you couldn\'t handle it</em>. You just wrote down how you would.</p><p>Try saying it to yourself the next time the alarm goes off.</p>', input: 'pause' };
  }

  function* low() {
    yield { say: '<p>When mood is low, the natural pull is to do less: stay in bed, cancel plans, scroll. But doing less usually feeds the low mood. CBT calls the way out <strong>behavioural activation</strong>: one small action first, motivation follows later.</p>', input: 'pause' };
    const cat = yield { say: '<p>Which of these feels even slightly possible in the next hour?</p>', chips: ['Move my body', 'Contact someone', 'Take care of myself', 'Tidy one thing', 'Step outside', 'Do something I used to enjoy'], input: 'text' };
    const c = String(cat).toLowerCase();
    const ideas = /move/.test(c) ? 'Stand up and stretch for one minute. Walk to the end of the street and back. Ten slow squats.' :
                  /contact/.test(c) ? 'Send one message that just says "thinking of you". Call someone for five minutes. Reply to one message you\'ve been avoiding.' :
                  /care/.test(c) ? 'Drink a full glass of water. Have a shower. Eat something with protein in it. Open the curtains.' :
                  /tidy/.test(c) ? 'Make the bed. Clear one surface. Take the cups to the kitchen.' :
                  /outside/.test(c) ? 'Stand in the doorway for two minutes. Sit outside with a drink. Walk one block.' :
                  'Play one song you love. Read one page. Sketch, cook, pray, kick a ball, whatever it used to be, for ten minutes only.';
    const action = yield { say: '<p>Some ideas: ' + ideas + '</p><p>Pick one, and make it <strong>smaller</strong> than feels necessary. What exactly will you do?</p>', input: 'text' };
    const when = yield { say: '<p>"' + esc(action) + '." Good. When?</p>', chips: ['Right now', 'In the next hour', 'Later today'], input: 'text' };
    const before = yield { say: '<p>One more thing.</p>', input: 'scale', label: 'Before you do it, how is your mood right now?' };
    yield { say: '<p>Noted: ' + before + '. After you\'ve done "' + esc(action) + '", rate it again. Most people find the number moves, even a little, and that\'s the whole point: <em>action changes mood, not the other way round</em>.</p><p>If low mood has been with you most days for more than two weeks, please also talk to a person. <a href="get-help.html">Here\'s how.</a></p>', input: 'pause' };
  }

  function* thought() {
    const sit = yield { say: '<p>This is a <strong>thought record</strong>: catch it, check it, change it.</p><p>First, what was the situation? Where were you, what happened?</p>', input: 'text' };
    const th = yield { say: '<p>And what went through your mind? The exact words, if you can. ("I\'m going to fail." "They think I\'m useless.")</p>', input: 'text' };
    const belief = yield { say: '<p>"<em>' + esc(th) + '</em>". Let\'s check it.</p>', input: 'scale', label: 'How much do you believe it right now?' };
    const trap = yield { say: '<p>Does it fall into one of these common thinking traps?</p><ul><li><strong>All-or-nothing</strong>: one mistake means total failure</li><li><strong>Mind-reading</strong>: assuming you know what others think</li><li><strong>Fortune-telling</strong>: predicting the worst as fact</li><li><strong>Catastrophising</strong>: small problem, disaster ending</li><li><strong>Should statements</strong>: harsh rules about how you must be</li><li><strong>Labelling</strong>: "I\'m useless" instead of "I made a mistake"</li><li><strong>Discounting the positive</strong>: what went well doesn\'t count</li></ul>', chips: ['All-or-nothing', 'Mind-reading', 'Fortune-telling', 'Catastrophising', 'Should statements', 'Labelling', 'Discounting the positive', 'Not sure'], input: 'text' };
    const forE = yield { say: '<p>' + (/not sure/i.test(trap) ? 'That\'s fine; naming it isn\'t essential.' : esc(trap) + '. Very common, and very convincing from the inside.') + '</p><p>Now the evidence. What facts, not feelings, support the thought?</p>', input: 'text' };
    const against = yield { say: '<p>And what facts go <em>against</em> it? Think about what you\'d say to a friend who told you this about themselves.</p>', input: 'text' };
    const balanced = yield { say: '<p>Looking at both sides, write a more balanced thought. Not fake-positive, just fairer. For example: "I made a mistake in the meeting, and I\'ve also done good work there for two years."</p>', input: 'text' };
    const after = yield { say: '<p>"<em>' + esc(balanced) + '</em>". That\'s a thought you can stand on.</p>', input: 'scale', label: 'How much do you believe the original thought now?' };
    const diff = belief - after;
    yield { say: '<p>' + (diff > 0 ? 'From ' + belief + ' down to ' + after + '. The thought loosened by looking at it honestly. That\'s the skill, and it gets faster with practice.' : 'The number didn\'t move much, and that\'s okay. Some thoughts have deep roots. Writing them down is still the first step, and it\'s worth bringing this one to a circle or a professional.') + '</p>', input: 'pause' };
  }

  function* worry() {
    const w = yield { say: '<p>Overthinking is usually worry wearing a disguise. Let\'s use the <strong>worry tree</strong>.</p><p>What\'s the worry, in one sentence?</p>', input: 'text' };
    const can = yield { say: '<p>"<em>' + esc(w) + '</em>". Now the key question: is there <strong>anything you can actually do</strong> about this, right now or soon?</p>', chips: ['Yes, something', 'No, it\'s out of my hands', 'It might not even happen'], input: 'text' };
    if (/yes/i.test(can)) {
      const stepTxt = yield { say: '<p>Then this is a <em>practical</em> worry, and the answer is a plan, not more thinking. What is the very next small step?</p>', input: 'text' };
      const when = yield { say: '<p>"' + esc(stepTxt) + '." When will you do it?</p>', chips: ['Now', 'Today', 'Tomorrow', 'This week'], input: 'text' };
      yield { say: '<p>Done: "' + esc(stepTxt) + '", ' + esc(String(when).toLowerCase()) + '. Every time the worry comes back before then, remind yourself: <em>I have a plan and a time. I don\'t need to solve it again right now.</em></p>', input: 'pause' };
    } else {
      yield { say: '<p>Then this is a <em>hypothetical</em> worry: a "what if" your mind can\'t solve because there\'s nothing to do yet. Rumination feels productive, but it\'s just the same loop.</p><p>Two things that help:</p><ol><li><strong>Name it and park it.</strong> Say to yourself: "This is a what-if. I\'ll come back to it at my worry time." Then turn your attention to what you were doing, and keep turning it back.</li><li><strong>Worry time.</strong> Give worry 15 minutes at a fixed time each day (not bedtime). Outside that window, it waits. Most parked worries feel smaller by the time you get to them.</li></ol>', input: 'pause' };
      const next = yield { say: '<p>What were you doing before the worry took over? Let\'s point you back at it.</p>', input: 'text' };
      yield { say: '<p>Go back to "' + esc(next) + '". When the worry knocks, it can wait. You\'ve already decided that.</p>', input: 'pause' };
    }
  }

  function* breathe() {
    yield { say: '<p>Box breathing: in for 4, hold 4, out 4, hold 4. Breathe with the circle. Four rounds.</p>', input: 'breath', cycles: 4 };
    const how = yield { say: '<p>How do you feel now, compared with before?</p>', chips: ['Calmer', 'A little better', 'The same', 'Worse'], input: 'text' };
    yield { say: '<p>' + (/calm|better/i.test(how) ? 'Good. Slow exhales tell your nervous system the emergency is over. You can do this anywhere, no one can tell.' : 'That\'s okay. Breathing is a first-aid tool, not a cure, and sometimes it takes a few rounds. Grounding might suit you better; you can try that from the menu.') + '</p>', input: 'pause' };
  }

  function* ground() {
    yield { say: '<p>This is the <strong>5-4-3-2-1</strong> grounding exercise. It pulls attention out of your head and into the room. Take your time with each one.</p><p>Name <strong>5 things you can see</strong>.</p>', input: 'text' };
    yield { say: '<p><strong>4 things you can feel</strong>: your feet on the floor, fabric on your skin, the temperature of the air.</p>', input: 'text' };
    yield { say: '<p><strong>3 things you can hear</strong>, near or far.</p>', input: 'text' };
    yield { say: '<p><strong>2 things you can smell</strong> (or two smells you like).</p>', input: 'text' };
    yield { say: '<p><strong>1 thing you can taste</strong>, or one thing you\'re grateful for.</p>', input: 'text' };
    yield { say: '<p>You\'re here, in this room, in this moment. Whatever was pulling you away is still just thoughts, and you can come back to now any time using this.</p>', input: 'pause' };
  }

  function* sleep() {
    const issue = yield { say: '<p>Poor sleep and low mood feed each other, so this is worth fixing. What\'s the main problem?</p>', chips: ['Can\'t fall asleep', 'Wake in the night', 'Wake too early', 'Mind won\'t switch off'], input: 'text' };
    const i = String(issue).toLowerCase();
    let tips = /won'?t switch|fall asleep/.test(i) ?
      '<ul><li><strong>Get the thoughts out.</strong> Ten minutes before bed, write tomorrow\'s to-do list and any worries on paper. Your brain can stop holding them.</li><li><strong>The 20-minute rule.</strong> If you\'re awake more than about 20 minutes, get up, sit somewhere dim, do something dull, return when sleepy. Bed must mean sleep, not lying awake.</li><li><strong>No screens in bed.</strong> The phone goes on the other side of the room.</li></ul>' :
      /wake in the night/.test(i) ?
      '<ul><li><strong>Don\'t check the time.</strong> It only starts the maths ("only 3 hours left…").</li><li><strong>Get up if you\'re wide awake.</strong> Sit somewhere dim, return when sleepy.</li><li><strong>Watch the evening.</strong> Alcohol and heavy food late are the most common causes of 3am waking.</li></ul>' :
      '<ul><li><strong>Keep the same wake time</strong> seven days a week, even after a bad night. This is the single most powerful lever.</li><li><strong>Morning light.</strong> Get outside within an hour of waking; it anchors your body clock.</li><li><strong>Early waking with low mood</strong> for more than two weeks is worth mentioning to a professional. <a href="get-help.html">Here\'s how.</a></li></ul>';
    yield { say: '<p>' + tips + '</p><p>Pick <strong>one</strong> of these to try for a week. Changing everything at once rarely sticks.</p>', input: 'pause' };
    yield { say: '<p>And if racing thoughts are the real problem, the worry tree from the menu is built for that.</p>', input: 'pause' };
  }

  const FLOWS = { talk: talk, anxious: anxious, low: low, thought: thought, worry: worry, breathe: breathe, ground: ground, sleep: sleep };
})();
