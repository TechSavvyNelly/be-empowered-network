/* Be Empowered Network — Bee's script, in English and Nigerian Pidgin.
   ------------------------------------------------------------------
   Every line Bee says lives here so the two languages stay in step. The
   engine (chat.js) only ever asks for a key; it never holds copy.

   On Pidgin: this is written as people actually speak it in Nigeria, not
   English with words knocked out. It stays warm and plain, because
   someone reaching for this is usually not at their best. */
(function () {
  'use strict';

  var EN = {
    'ui.launch':      'Talk to Bee',
    'ui.role':        'CBT companion · not a person, not therapy',
    'ui.notice':      'If you’re in danger right now, call <a href="tel:112">112</a>. Bee is a self-help guide, not an emergency service.',
    'ui.placeholder': 'Type here…',
    'ui.langSwitch':  'Pidgin',
    'ui.langSwitched':'<p>No wahala — I’ll speak Pidgin from now. You can switch back any time.</p>',
    'ui.langOffer':   '<p>I notice you dey write Pidgin. You want make I talk Pidgin too?</p>',
    'ui.langOfferYes':'Yes, speak Pidgin',
    'ui.langOfferNo': 'No, English is fine',

    'menu.prompt':    '<p>What’s going on for you right now? Pick one, or type in your own words.</p>',
    'menu.again':     '<p>What would you like to do next?</p>',
    'menu.anxious':   'I’m anxious',
    'menu.low':       'I’m feeling low',
    'menu.worry':     'I can’t stop overthinking',
    'menu.thought':   'Challenge a thought',
    'menu.traps':     'Spot a thinking trap',
    'menu.breathe':   'Breathe with me',
    'menu.ground':    'Ground me',
    'menu.sleep':     'I can’t sleep',
    'menu.pro':       'Find a professional',
    'pro.1':     '<p>Good. Talking to a professional is a step up from anything I can do, not a sign anything has gone wrong.</p><p>Which state are you in? I\u2019ll point you at the right part of our directory.</p>',
    'pro.2':     '<p>Thank you. Open the <a href="directory.html">directory</a> and filter by your state \u2014 it lists psychiatric hospitals, helplines, NGOs and online services.</p><p>Two things worth knowing before you pay anyone:</p>',
    'pro.3':     '<p><strong>Check they are registered.</strong> Psychiatrists are doctors, so they must be on the <a href="directory.html">MDCN register</a>. Psychologists and counsellors are covered by the NPA, NACP and ACMPN \u2014 all listed in the directory under \u201cProfessional bodies\u201d.</p><p><strong>Ask about cost up front.</strong> Fees vary a great deal, and many services offer a reduced rate if you ask.</p>',
    'pro.4':     '<p>Our own peer support circles are free, in person and online \u2014 <a href="events.html">the dates are here</a>. They are not therapy, but many people find them a gentler place to start.</p>',
    'signpost.en':'<p>One more thing. What we just did is a self-help tool, not treatment. If this has been going on for weeks, or it is getting in the way of work, sleep or the people around you, please talk to someone qualified \u2014 the <a href="directory.html">directory</a> lists services by state.</p>',
    'menu.talk':      'Just talk',
    'menu.back':      'Back to the menu',

    'crisis.say':
      '<p>Thank you for telling me. What you just said matters, and I want to make sure you get more than a chatbot right now.</p>' +
      '<p><strong>If you are in immediate danger:</strong><a class="num-big" href="tel:112">Call 112</a>' +
      '<strong>To talk to a person now:</strong></p>' +
      '<ul><li>MANI: <a href="tel:+2348091116264">0809 111 6264</a></li><li>NSPI: <a href="tel:+2348062106493">0806 210 6493</a></li></ul>' +
      '<p>If you can, tell someone near you how you feel, or go to the nearest hospital. You deserve support from a real person tonight, not just from me.</p>',
    'crisis.helplines':'Show all helplines',
    'crisis.safe':     'I’m safe. Keep going',
    'helplines.say':
      '<p><strong>Emergency (Nigeria):</strong> <a href="tel:112">112</a></p>' +
      '<p><strong>MANI:</strong> <a href="tel:+2348091116264">0809 111 6264</a><br>' +
      '<strong>NSPI:</strong> <a href="tel:+2348062106493">0806 210 6493</a></p>' +
      '<p><a href="get-help.html">All support options →</a></p>',

    'welcome.1': '<p>Hi, I’m Bee. I’m not a person and I’m not therapy, but I can walk you through a few tools from cognitive behavioural therapy (CBT) that many people find useful when things get heavy.</p><p>Nothing you type here is stored or sent anywhere.</p><p><em>I dey speak Pidgin too — just type Pidgin and I go follow you.</em></p>',

    'talk.1':    '<p>Thank you for putting that into words. It takes something to do that.</p><p>If you had to name the main feeling underneath it, what would it be?</p>',
    'talk.2':    '<p>That makes sense given what you’ve described. Feelings usually fit the story we’re telling ourselves about a situation — that’s the part CBT works on.</p><p>When did you first notice it today?</p>',
    'talk.3':    '<p>Thank you. Noticing <em>when</em> something starts is already useful — it tells us what set it off.</p><p>What would you like to do with it?</p>',

    'anxious.1': '<p>Anxiety is your body preparing for a threat, even when there isn’t one in front of you. It’s uncomfortable, but it is not dangerous and it does pass.</p><p>How strong is it right now?</p>',
    'anxious.2': '<p>Let’s bring that number down before we think about anything. Your body first, your thoughts after — that order matters.</p>',
    'anxious.3': '<p>Good. Now, what is your mind saying is about to go wrong?</p>',
    'anxious.4': '<p>Thank you. Let’s look at that thought properly rather than letting it run in the background.</p>',

    'low.1':     '<p>When mood drops, the things that would lift it are the first things we stop doing. That isn’t laziness — it’s how low mood protects itself.</p><p>CBT calls the way out <strong>behavioural activation</strong>: doing first, feeling second. Small, not heroic.</p><p>What’s one thing you used to enjoy, even slightly?</p>',
    'low.2':     '<p>What would the smallest possible version of that look like? Not the full thing — five minutes of it.</p>',
    'low.3':     '<p>That sounds doable. When could you do it — today or tomorrow?</p>',
    'low.4':     '<p>Good. One thing worth knowing: the motivation usually arrives <em>after</em> you start, not before. Waiting to feel like it is the trap.</p>',

    'worry.1':   '<p>Overthinking feels like problem-solving, but it rarely reaches an answer. CBT sorts worries into two piles.</p><p>What’s the worry, in one line?</p>',
    'worry.2':   '<p>Here’s the question that does the work: is there something you could actually <em>do</em> about this — today?</p>',
    'worry.3a':  '<p>Then it’s a problem, not a worry. Problems have next steps.</p><p>What is the very next small step?</p>',
    'worry.3b':  '<p>Then it’s a hypothetical worry — and no amount of thinking will resolve it, because there’s nothing to act on.</p><p>The skill isn’t to stop the thought. It’s to notice it, name it “worry”, and let it be there while you go back to what you were doing. It will come back. Name it again. That’s the practice.</p>',
    'worry.4':   '<p>Good. Write it somewhere you’ll see it, then let the rest go for now.</p>',

    'thought.1': '<p>This is a <strong>thought record</strong> — the central CBT tool. We’ll take one thought and hold it up to the light. I’m not going to tell you it’s wrong; we’re going to look at the evidence together.</p><p>What’s the thought, in your own words?</p>',
    'thought.2': '<p>How much do you believe that right now?</p>',
    'thought.3': '<p>Now the honest part. What’s the evidence <strong>for</strong> that thought? Real evidence — things that happened, not how it feels.</p>',
    'thought.4': '<p>Thank you for being fair to it. Now: what’s the evidence <strong>against</strong> it? What would a friend who knows you well point out?</p>',
    'thought.5': '<p>Looking at both sides, what’s a more balanced version of the thought? Not a positive one — a <em>truer</em> one.</p>',
    'thought.6': '<p>Now, how much do you believe the original thought?</p>',
    'thought.7a':'<p>That shift is the whole exercise. It rarely goes to zero, and it doesn’t need to — loosening its grip is enough to act differently.</p>',
    'thought.7b':'<p>It didn’t shift much, and that’s worth knowing rather than forcing. Some thoughts are held in place by something older, and those are better worked through with a real person than with me.</p>',

    'traps.1':   '<p>Thinking traps are habits of mind, not character flaws — everyone has them. Naming one takes some of its power away.</p><p>What’s the thought?</p>',
    'traps.2':   '<p>Which of these does it sound most like?</p>',
    'traps.3':   '<p>That’s the one. Now that it has a name, it’s a thought you’re having — not a fact about you.</p><p>If a friend said that exact sentence to you, what would you say back?</p>',
    'traps.4':   '<p>Notice how much kinder and more accurate that is. That voice is available to you too.</p>',

    'breathe.1': '<p>Box breathing. Four counts in, hold four, four out, hold four. It tells your nervous system the emergency is over.</p><p>Follow the ring. If four feels too long, make it three.</p>',
    'breathe.2': '<p>How is your body now, compared to when we started?</p>',

    'ground.1':  '<p>When your mind is somewhere else, the way back is through your senses. This is 5-4-3-2-1.</p><p>Look around and name <strong>five things you can see</strong>. Type them, or just say them under your breath.</p>',
    'ground.2':  '<p>Good. Now <strong>four things you can touch</strong>. Actually touch them — the chair, your sleeve, the floor under your feet.</p>',
    'ground.3':  '<p>Now <strong>three things you can hear</strong>.</p>',
    'ground.4':  '<p>Two things you can <strong>smell</strong>, and one you can <strong>taste</strong>.</p>',
    'ground.5':  '<p>You just brought yourself back to this room. That’s a skill, and it gets easier each time you use it.</p>',

    'sleep.1':   '<p>The hardest part of not sleeping is the thinking that fills the gap. Two things usually help.</p><p>First: is your mind busy with a worry, or is it just restless?</p>',
    'sleep.2a':  '<p>Try <strong>worry postponement</strong>. Write the worry down — on paper, beside the bed — and tell yourself you’ll deal with it at a set time tomorrow. You’re not dismissing it; you’re booking it in. The mind lets go more easily when it trusts it won’t be forgotten.</p>',
    'sleep.2b':  '<p>Then don’t fight it. Lying there trying to force sleep makes the bed a place of struggle. Get up, sit somewhere dim, do something dull, and go back when you feel heavy.</p>',
    'sleep.3':   '<p>One more thing, for tomorrow rather than tonight: getting up at the same time every morning does more for sleep than any bedtime rule.</p>',

    'close.1':   '<p>Before you go — one small thing you could do for yourself in the next hour?</p>',
    'close.2':   '<p>That’s enough. You came here and did something about how you feel, which is more than most people manage on a hard day.</p><p>If things get heavier, please talk to a real person: <a href="get-help.html">the ways to get help are here</a>.</p>',

    'chip.yes':      'Yes',
    'chip.no':       'No',
    'chip.notsure':  'Not sure',
    'chip.done':     'Done',
    'chip.continue': 'Continue',
    'chip.ground':   'Ground me',
    'chip.breathe':  'Breathe with me',
    'chip.thought':  'Look at the thought',
    'chip.justtalk': 'I just want to talk',
    'chip.helplines':'Show helplines',
    'chip.today':    'Today',
    'chip.tomorrow': 'Tomorrow',
    'chip.worry':    'A worry',
    'chip.restless': 'Just restless',
    'scale.anxiety': 'How strong is it right now? (0–10)',
    'scale.belief':  'How much do you believe it? (0–100%)',
    'trap.all':      'All-or-nothing thinking',
    'trap.mind':     'Mind reading',
    'trap.future':   'Predicting the future',
    'trap.blame':    'Blaming myself',
    'trap.should':   'Should statements',
    'trap.filter':   'Only seeing the bad'
  };

  var PCM = {
    'ui.launch':      'Talk to Bee',
    'ui.role':        'CBT companion · no be person, no be therapy',
    'ui.notice':      'If danger dey now now, call <a href="tel:112">112</a>. Bee na self-help guide, no be emergency service.',
    'ui.placeholder': 'Type am here…',
    'ui.langSwitch':  'English',
    'ui.langSwitched':'<p>No problem — I go talk English from now. You fit change am back any time.</p>',
    'ui.langOffer':   '<p>I see say you dey write English. You want make I talk English?</p>',
    'ui.langOfferYes':'Yes, speak English',
    'ui.langOfferNo': 'No, Pidgin dey okay',

    'menu.prompt':    '<p>Wetin dey happen for you right now? Pick one, or type am for your own words.</p>',
    'menu.again':     '<p>Wetin you wan make we do next?</p>',
    'menu.anxious':   'My mind no dey rest',
    'menu.low':       'I dey feel down',
    'menu.worry':     'I dey overthink',
    'menu.thought':   'Make we check one thought',
    'menu.traps':     'Find the trap for my mind',
    'menu.breathe':   'Make we breathe together',
    'menu.ground':    'Bring me back down',
    'menu.sleep':     'I no fit sleep',
    'menu.pro':       'Find professional',
    'pro.1':     '<p>Correct. To talk to professional na step up from anything wey I fit do \u2014 no be say something don spoil.</p><p>Which state you dey? Make I point you to the right part of our directory.</p>',
    'pro.2':     '<p>Thank you. Open the <a href="directory.html">directory</a> come filter by your state \u2014 e list psychiatric hospital, helpline, NGO and online service.</p><p>Two things wey you suppose know before you pay anybody:</p>',
    'pro.3':     '<p><strong>Check say dem register.</strong> Psychiatrist na doctor, so dem must dey for <a href="directory.html">MDCN register</a>. Psychologist and counsellor dey under NPA, NACP and ACMPN \u2014 all of dem dey the directory under \u201cProfessional bodies\u201d.</p><p><strong>Ask about money first.</strong> The fee dey different different, and plenty place go reduce am if you ask.</p>',
    'pro.4':     '<p>Our own peer support circle na free, face to face and online \u2014 <a href="events.html">the date dey here</a>. E no be therapy, but plenty people find am softer place to start.</p>',
    'signpost.en':'<p>One more thing. Wetin we just do na self-help tool, no be treatment. If e don tey weeks, or e dey disturb your work, your sleep or the people around you, abeg talk to person wey sabi \u2014 the <a href="directory.html">directory</a> list services by state.</p>',
    'menu.talk':      'I just wan talk',
    'menu.back':      'Go back to menu',

    'crisis.say':
      '<p>Thank you say you tell me. Wetin you talk now na serious thing, and I wan make you get better help pass ordinary chatbot.</p>' +
      '<p><strong>If danger dey now now:</strong><a class="num-big" href="tel:112">Call 112</a>' +
      '<strong>To talk to person wey go hear you:</strong></p>' +
      '<ul><li>MANI: <a href="tel:+2348091116264">0809 111 6264</a></li><li>NSPI: <a href="tel:+2348062106493">0806 210 6493</a></li></ul>' +
      '<p>If you fit, tell person wey dey near you how you dey feel, or go the hospital wey dey close. You deserve better than only me tonight.</p>',
    'crisis.helplines':'Show me all the numbers',
    'crisis.safe':     'I dey safe. Make we continue',
    'helplines.say':
      '<p><strong>Emergency (Nigeria):</strong> <a href="tel:112">112</a></p>' +
      '<p><strong>MANI:</strong> <a href="tel:+2348091116264">0809 111 6264</a><br>' +
      '<strong>NSPI:</strong> <a href="tel:+2348062106493">0806 210 6493</a></p>' +
      '<p><a href="get-help.html">See all the help wey dey →</a></p>',

    'welcome.1': '<p>How far, na Bee be this. I no be person and I no be therapy, but I fit waka you through small tools from cognitive behavioural therapy (CBT) wey plenty people dey find helpful when life heavy.</p><p>Wetin you type here no dey save, e no dey go anywhere.</p>',

    'talk.1':    '<p>Thank you say you put am for word. E no easy to talk am.</p><p>If you go name the main feeling wey dey under am, wetin e go be?</p>',
    'talk.2':    '<p>E make sense based on wetin you talk. The way we dey feel dey follow the story wey we dey tell ourself about wetin happen — na that part CBT dey work on.</p><p>Wetin time you first notice am today?</p>',
    'talk.3':    '<p>Thank you. To notice <em>when</em> e start na correct thing — e dey show wetin trigger am.</p><p>Wetin you wan make we do with am?</p>',

    'anxious.1': '<p>Anxiety na your body wey dey prepare for danger, even when nothing dey your front. E dey uncomfortable, but e no dey kill person, and e go pass.</p><p>How e strong reach right now?</p>',
    'anxious.2': '<p>Make we bring that number down first before we think anything. Body first, thought later — that order matter.</p>',
    'anxious.3': '<p>Correct. Now, wetin your mind dey tell you say e wan go wrong?</p>',
    'anxious.4': '<p>Thank you. Make we look that thought well well instead of make e dey run for background.</p>',

    'low.1':     '<p>When mood drop, the things wey for lift am na them we first stop to do. No be laziness — na so low mood dey protect itself.</p><p>CBT call the way out <strong>behavioural activation</strong>: do first, feel after. Small thing, no be big thing.</p><p>Wetin be one thing wey you bin dey enjoy before, even small?</p>',
    'low.2':     '<p>Wetin the smallest version of that one go be? No be the whole thing — five minutes of am.</p>',
    'low.3':     '<p>That one fit work. When you fit do am — today or tomorrow?</p>',
    'low.4':     '<p>Correct. One thing wey you suppose sabi: the mind to do am dey come <em>after</em> you don start, no be before. To wait till you feel like am na the trap.</p>',

    'worry.1':   '<p>Overthinking dey feel like say you dey solve problem, but e no dey reach answer. CBT dey divide worry into two.</p><p>Wetin be the worry, for one line?</p>',
    'worry.2':   '<p>Na this question dey do the work: something dey wey you fit actually <em>do</em> about am — today?</p>',
    'worry.3a':  '<p>Then na problem, no be worry. Problem get next step.</p><p>Wetin be the next small step?</p>',
    'worry.3b':  '<p>Then na “what if” worry — and no matter how you think am, e no go resolve, because nothing dey to do.</p><p>The skill no be to stop the thought. Na to notice am, call am “worry”, and leave am there while you go back to wetin you dey do. E go come back. Call am again. Na that one be the practice.</p>',
    'worry.4':   '<p>Correct. Write am for where you go see am, then leave the rest for now.</p>',

    'thought.1': '<p>This one na <strong>thought record</strong> — the main CBT tool. We go take one thought put am for light. I no go tell you say e wrong; na together we go look the evidence.</p><p>Wetin be the thought, for your own word?</p>',
    'thought.2': '<p>How you believe am reach right now?</p>',
    'thought.3': '<p>Now the honest part. Wetin be the evidence <strong>for</strong> the thought? Real evidence — things wey happen, no be how e dey feel.</p>',
    'thought.4': '<p>Thank you say you fair to am. Now: wetin be the evidence <strong>against</strong> am? Wetin better friend wey sabi you go talk?</p>',
    'thought.5': '<p>As you look the two side, wetin be the more balanced version of the thought? No be positive one — na the one wey <em>true</em> pass.</p>',
    'thought.6': '<p>Now, how you believe the first thought reach?</p>',
    'thought.7a':'<p>That change na the whole exercise. E no dey reach zero, and e no need reach — make the grip loose small na enough to do things different.</p>',
    'thought.7b':'<p>E no shift well, and e better make we know than make we force am. Some thought get old root, and person wey be real human go help you pass me for that kind one.</p>',

    'traps.1':   '<p>Thinking trap na habit of mind, no be say something spoil for you — everybody get am. When you name am, e dey lose power.</p><p>Wetin be the thought?</p>',
    'traps.2':   '<p>Which one among these e resemble pass?</p>',
    'traps.3':   '<p>Na im be that. Now wey e get name, na thought wey you dey get — no be fact about you.</p><p>If your friend talk that exact sentence give you, wetin you go tell am?</p>',
    'traps.4':   '<p>You see how that one soft and correct pass? That voice dey for you too.</p>',

    'breathe.1': '<p>Box breathing. Four count in, hold four, four out, hold four. E dey tell your body say the emergency don finish.</p><p>Follow the ring. If four too much, make e be three.</p>',
    'breathe.2': '<p>How your body be now, compare to when we start?</p>',

    'ground.1':  '<p>When your mind comot go another place, na through your senses you go take come back. This one na 5-4-3-2-1.</p><p>Look around, name <strong>five things wey you fit see</strong>. Type am, or just talk am small small.</p>',
    'ground.2':  '<p>Correct. Now <strong>four things wey you fit touch</strong>. Touch dem true true — the chair, your cloth, the floor under your leg.</p>',
    'ground.3':  '<p>Now <strong>three things wey you fit hear</strong>.</p>',
    'ground.4':  '<p>Two things wey you fit <strong>smell</strong>, and one wey you fit <strong>taste</strong>.</p>',
    'ground.5':  '<p>You don bring yourself back come this room. Na skill be that, and e dey easy small small as you dey use am.</p>',

    'sleep.1':   '<p>The hard part of no sleep na the thinking wey dey fill the space. Two things dey wey dey help.</p><p>First: your mind dey busy with worry, or na just say body no gree rest?</p>',
    'sleep.2a':  '<p>Try <strong>worry postponement</strong>. Write the worry for paper, put am near bed, and tell yourself say you go handle am for particular time tomorrow. You no dey throw am away; you dey book am. Mind dey let go easy when e trust say e no go forget.</p>',
    'sleep.2b':  '<p>Then no fight am. To lie down dey force sleep dey make bed turn place of struggle. Stand up, sit for where light small, do something wey no sweet, come back when body heavy.</p>',
    'sleep.3':   '<p>One more thing, for tomorrow no be tonight: to wake up same time every morning dey help sleep pass any bedtime rule.</p>',

    'close.1':   '<p>Before you go — one small thing wey you fit do for yourself for the next one hour?</p>',
    'close.2':   '<p>That one don do. You come here come do something about how you dey feel, and plenty people no dey manage that one for hard day.</p><p>If e come heavy pass, abeg talk to real person: <a href="get-help.html">the help dey here</a>.</p>',

    'chip.yes':      'Yes',
    'chip.no':       'No',
    'chip.notsure':  'I no sure',
    'chip.done':     'I don finish',
    'chip.continue': 'Continue',
    'chip.ground':   'Bring me down',
    'chip.breathe':  'Make we breathe',
    'chip.thought':  'Check the thought',
    'chip.justtalk': 'I just wan talk',
    'chip.helplines':'Show the numbers',
    'chip.today':    'Today',
    'chip.tomorrow': 'Tomorrow',
    'chip.worry':    'Na worry',
    'chip.restless': 'Body just no gree rest',
    'scale.anxiety': 'How e strong reach now? (0–10)',
    'scale.belief':  'How you believe am reach? (0–100%)',
    'trap.all':      'Na either everything or nothing',
    'trap.mind':     'I dey read person mind',
    'trap.future':   'I dey predict wetin never happen',
    'trap.blame':    'I dey blame myself',
    'trap.should':   '“I suppose…” talk',
    'trap.filter':   'Na only bad thing I dey see'
  };

  window.BEE_COPY = { en: EN, pcm: PCM };
})();
