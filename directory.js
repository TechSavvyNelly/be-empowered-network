/* Be Empowered Network — mental health directory
   Add or edit entries in the DIRECTORY array. Keep `type` to one of:
   hospital | clinic | ngo | helpline | online.  `states` is where the
   service is available ("Nationwide" for online/helplines).
   Contact details change; verify every entry before publishing. */
window.DIRECTORY = [
  { name: 'Federal Neuropsychiatric Hospital, Yaba', type: 'hospital', states: ['Lagos'],
    offers: 'Public psychiatric hospital: emergency psychiatry, outpatient clinics, inpatient care, child and adolescent services, drug and alcohol unit.',
    note: 'Walk-in emergencies accepted. Bring ID and any current medication.' },
  { name: 'Lagos University Teaching Hospital (LUTH), Psychiatry Department', type: 'hospital', states: ['Lagos'],
    offers: 'Psychiatry outpatient clinic and inpatient care within a teaching hospital; clinical psychology services.' },
  { name: 'Neuropsychiatric Hospital, Aro', type: 'hospital', states: ['Ogun'],
    offers: 'One of Nigeria\'s oldest psychiatric hospitals (Abeokuta). Outpatient, inpatient, rehabilitation and community psychiatry.' },
  { name: 'Federal Neuropsychiatric Hospital, Enugu', type: 'hospital', states: ['Enugu'],
    offers: 'Public psychiatric hospital serving the South-East: emergency, outpatient and inpatient care.' },
  { name: 'Federal Neuropsychiatric Hospital, Kaduna', type: 'hospital', states: ['Kaduna'],
    offers: 'Public psychiatric hospital (Barnawa) serving the North-West: emergency, outpatient, inpatient and substance-use services.' },
  { name: 'Federal Neuropsychiatric Hospital, Maiduguri', type: 'hospital', states: ['Borno'],
    offers: 'Public psychiatric hospital serving the North-East, including trauma-related care.' },
  { name: 'Federal Neuropsychiatric Hospital, Calabar', type: 'hospital', states: ['Cross River'],
    offers: 'Public psychiatric hospital serving the South-South.' },
  { name: 'Federal Neuropsychiatric Hospital, Benin City', type: 'hospital', states: ['Edo'],
    offers: 'Public psychiatric hospital (Uselu): outpatient and inpatient psychiatric care.' },
  { name: 'Federal Neuropsychiatric Hospital, Sokoto', type: 'hospital', states: ['Sokoto'],
    offers: 'Public psychiatric hospital (Kware) serving the far North-West.' },
  { name: 'University College Hospital (UCH), Ibadan — Psychiatry', type: 'hospital', states: ['Oyo'],
    offers: 'Psychiatry department of a teaching hospital: outpatient clinics, inpatient care, child psychiatry.' },
  { name: 'Nigeria Emergency Number', type: 'helpline', states: ['Nationwide'],
    offers: 'National emergency line for police, fire and medical emergencies, including a person at immediate risk of harming themselves.',
    phone: '112', phoneHref: 'tel:112' },
  { name: 'Mentally Aware Nigeria Initiative (MANI)', type: 'helpline', states: ['Nationwide'],
    offers: 'Youth-led NGO running a peer support line and online communities; campaigns on stigma and suicide prevention.',
    phone: '0809 111 6264', phoneHref: 'tel:+2348091116264', url: 'https://mentallyaware.org' },
  { name: 'Nigeria Suicide Prevention Initiative (NSPI)', type: 'helpline', states: ['Nationwide'],
    offers: 'Suicide prevention charity with a counselling line and awareness training.',
    phone: '0806 210 6493', phoneHref: 'tel:+2348062106493' },
  { name: 'She Writes Woman', type: 'ngo', states: ['Lagos', 'Nationwide'],
    offers: 'Women-led mental health organisation: safe-space peer support, a support line, and mental health first-aid training.',
    url: 'https://shewriteswoman.org' },
  { name: 'Asido Foundation', type: 'ngo', states: ['Oyo', 'Nationwide'],
    offers: 'Ibadan-based NGO providing free counselling, peer support and mental health advocacy, with a strong campus presence.',
    url: 'https://asidofoundation.com' },
  { name: 'Be Empowered Network', type: 'ngo', states: ['Nationwide'],
    offers: 'That\'s us: free peer support circles (in person and online), school, workplace and faith-leader programmes, and signposting to professional care.',
    email: 'hello@beempowerednetwork.org', url: 'get-help.html' },
  { name: 'Online therapy platforms', type: 'online', states: ['Nationwide'],
    offers: 'Several Nigerian platforms connect you with licensed therapists by video, voice or chat at lower cost than in-person clinics. Check that the therapist is registered and ask about fees before booking.',
    note: 'We are compiling a vetted list. Email us if you\'d like a recommendation for your budget.' }
];

(function () {
  /* Live rows from Supabase replace the arrays above when available;
     data-sync.js resolves before we draw anything. */
  function boot(go) {
    if (window.BenData && window.BenData.ready) window.BenData.ready.then(go, go);
    else go();
  }

  const list = document.querySelector('[data-directory-list]');
  if (!list) return;
  const q = document.getElementById('dir-search');
  const typeSel = document.getElementById('dir-type');
  const stateSel = document.getElementById('dir-state');
  const count = document.getElementById('dir-count');
  const TYPE = { hospital: 'Hospital', clinic: 'Clinic', ngo: 'NGO / peer support', helpline: 'Helpline', online: 'Online' };

  // populate state filter from data
  const states = Array.from(new Set(window.DIRECTORY.flatMap(function (d) { return d.states; }))).sort(function (a, b) {
    if (a === 'Nationwide') return -1; if (b === 'Nationwide') return 1; return a.localeCompare(b);
  });
  states.forEach(function (s) { const o = document.createElement('option'); o.value = s; o.textContent = s; stateSel.appendChild(o); });

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function render() {
    const term = q.value.trim().toLowerCase();
    const t = typeSel.value, st = stateSel.value;
    const items = window.DIRECTORY.filter(function (d) {
      if (t !== 'all' && d.type !== t) return false;
      if (st !== 'all' && d.states.indexOf(st) === -1) return false;
      if (term && (d.name + ' ' + d.offers + ' ' + d.states.join(' ')).toLowerCase().indexOf(term) === -1) return false;
      return true;
    });
    count.textContent = items.length + ' ' + (items.length === 1 ? 'service' : 'services');
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = '<li class="empty-state"><h3>No matches yet</h3><p>Try a broader search, or <a href="contact.html?topic=other">tell us about a service we should list</a>.</p></li>';
      return;
    }
    items.forEach(function (d) {
      const li = document.createElement('li'); li.className = 'dir-item';
      li.innerHTML =
        '<div class="dir-meta"><span class="tag">' + TYPE[d.type] + '</span><span class="dir-states">' + d.states.map(esc).join(' · ') + '</span></div>' +
        '<h3>' + esc(d.name) + '</h3><p>' + esc(d.offers) + '</p>' +
        (d.note ? '<p class="dir-note">' + esc(d.note) + '</p>' : '') +
        '<div class="dir-actions">' +
          (d.phone ? '<a class="btn btn--ghost" href="' + d.phoneHref + '">Call ' + esc(d.phone) + '</a>' : '') +
          (d.email ? '<a class="btn btn--ghost" href="mailto:' + d.email + '">Email</a>' : '') +
          (d.url ? '<a class="btn btn--link" href="' + d.url + '"' + (/^https?:/.test(d.url) ? ' target="_blank" rel="noopener"' : '') + '>' + (/^https?:/.test(d.url) ? 'Website ↗' : 'Learn more →') + '</a>' : '') +
        '</div>';
      list.appendChild(li);
    });
  }
  [q, typeSel, stateSel].forEach(function (el) { el.addEventListener('input', render); });

  boot(function () {
    // Live rows may add states the hardcoded list didn't have.
    if (stateSel) {
      var have = Array.from(stateSel.options).map(function (o) { return o.value; });
      Array.from(new Set(window.DIRECTORY.flatMap(function (d) { return d.states; })))
        .sort()
        .forEach(function (s) {
          if (have.indexOf(s) === -1) {
            var o = document.createElement('option'); o.value = s; o.textContent = s;
            stateSel.appendChild(o);
          }
        });
    }
    render();
  });
})();
