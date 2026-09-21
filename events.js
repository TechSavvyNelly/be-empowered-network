/* Be Empowered Network — events
   Edit the EVENTS array to publish events. Dates are local Nigerian time (WAT).
   The entries below are examples of the kinds of events the network runs —
   replace them with the real calendar. */
window.EVENTS = [
  {
    id: 'circle-2026-10-03', title: 'Online Peer Support Circle',
    start: '2026-10-03T19:00', end: '2026-10-03T20:30', type: 'circle', mode: 'online',
    location: 'Online (link sent after RSVP)',
    blurb: 'Our monthly open circle for adults. Come as you are, listen or share, no diagnosis needed. Facilitated by two trained volunteers.'
  },
  {
    id: 'wmhd-2026', title: 'World Mental Health Day: Walk & Talk',
    start: '2026-10-10T08:00', end: '2026-10-10T11:00', type: 'campaign', mode: 'in-person',
    location: 'Venue to be announced',
    blurb: 'A community walk followed by an open conversation on this year\'s World Mental Health Day theme. Families, students and workplaces welcome.'
  },
  {
    id: 'training-2026-10-24', title: 'Volunteer Facilitator Training (Part 1)',
    start: '2026-10-24T10:00', end: '2026-10-24T14:00', type: 'training', mode: 'online',
    location: 'Online',
    blurb: 'The first of two sessions for new circle facilitators: listening skills, group safety, boundaries and when to refer on. Open to accepted volunteers.'
  },
  {
    id: 'circle-2026-11-07', title: 'Online Peer Support Circle',
    start: '2026-11-07T19:00', end: '2026-11-07T20:30', type: 'circle', mode: 'online',
    location: 'Online (link sent after RSVP)',
    blurb: 'Our monthly open circle for adults. Come as you are, listen or share, no diagnosis needed.'
  },
  {
    id: 'webinar-2026-11-21', title: 'Workplace Wellbeing: Spotting Burnout Early',
    start: '2026-11-21T12:00', end: '2026-11-21T13:00', type: 'webinar', mode: 'online',
    location: 'Online webinar',
    blurb: 'A lunchtime session for line managers and HR: the early signs of burnout, how to open a supportive conversation, and what to do next.'
  },
  {
    id: 'circle-2026-09-05', title: 'Online Peer Support Circle',
    start: '2026-09-05T19:00', end: '2026-09-05T20:30', type: 'circle', mode: 'online',
    location: 'Online',
    blurb: 'September\'s monthly circle.'
  },
  {
    id: 'wmhd-2025', title: 'World Mental Health Day 2025: Community Conversation',
    start: '2025-10-10T10:00', end: '2025-10-10T13:00', type: 'campaign', mode: 'in-person',
    location: 'Community hall (in person)',
    blurb: 'An open conversation on mental health in the workplace, with a panel of volunteers, an employer and a clinician, followed by a peer circle taster.'
  },
  {
    id: 'training-2025-06', title: 'Volunteer Facilitator Training Cohort',
    start: '2025-06-14T10:00', end: '2025-06-14T15:00', type: 'training', mode: 'online',
    location: 'Online',
    blurb: 'A full-day training for our new cohort of peer circle facilitators: active listening, group safety and referral pathways.'
  },
  {
    id: 'schools-2025-03', title: 'Secondary School Mental Health Week',
    start: '2025-03-17T09:00', end: '2025-03-21T14:00', type: 'campaign', mode: 'in-person',
    location: 'Partner secondary schools',
    blurb: 'A week of student assemblies and teacher sessions on stress, anxiety and where to get help, delivered with partner schools.'
  },
  {
    id: 'wmhd-2024', title: 'World Mental Health Day 2024: Walk & Talk',
    start: '2024-10-12T08:00', end: '2024-10-12T11:00', type: 'campaign', mode: 'in-person',
    location: 'In person',
    blurb: 'Our annual community walk followed by open-mic stories from people with lived experience.'
  }
];

(function () {
  const list = document.querySelector('[data-event-list]');
  if (!list) return;
  const filters = document.querySelectorAll('[data-event-filter]');
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const TYPE_LABEL = { circle: 'Peer circle', campaign: 'Campaign', training: 'Training', webinar: 'Webinar' };
  const ICON_PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>';
  const ICON_CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  let filter = 'all';

  function fmtTime(iso) {
    const d = new Date(iso);
    let h = d.getHours(), m = d.getMinutes();
    const ampm = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12;
    return h + (m ? ':' + String(m).padStart(2, '0') : '') + ampm;
  }
  function ics(ev) {
    const stamp = function (iso) { return iso.replace(/[-:]/g, '') + '00'; };
    return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Be Empowered Network//Events//EN','BEGIN:VEVENT',
      'UID:' + ev.id + '@beempowerednetwork', 'DTSTART:' + stamp(ev.start), 'DTEND:' + stamp(ev.end),
      'SUMMARY:' + ev.title, 'LOCATION:' + ev.location, 'DESCRIPTION:' + ev.blurb.replace(/\n/g, ' '),
      'END:VEVENT','END:VCALENDAR'].join('\r\n');
  }

  function render() {
    const me = window.BenAuth && BenAuth.current();
    const now = new Date();
    const items = window.EVENTS
      .filter(function (e) { return filter === 'all' || e.mode === filter || e.type === filter; })
      .sort(function (a, b) { return a.start < b.start ? -1 : 1; });
    const upcoming = items.filter(function (e) { return new Date(e.end) >= now; });
    const past = items.filter(function (e) { return new Date(e.end) < now; }).reverse();

    const pastList = document.querySelector('[data-event-past]');
    list.innerHTML = '';
    if (pastList) pastList.innerHTML = '';
    if (!upcoming.length) {
      list.innerHTML = '<li class="empty-state"><h3>Nothing scheduled in this category yet</h3><p>New circles and sessions are added every month. Create an account and turn on event updates to hear first.</p></li>';
    }
    if (pastList && !past.length) pastList.innerHTML = '<li class="empty-state"><p>No past events in this category.</p></li>';
    upcoming.concat(past).forEach(function (ev) {
      const d = new Date(ev.start);
      const isPast = new Date(ev.end) < now;
      const going = me && me.rsvps.indexOf(ev.id) !== -1;
      const li = document.createElement('li');
      li.className = 'event' + (isPast ? ' event--past' : '');
      li.innerHTML =
        '<div class="event-date"><span class="d">' + d.getDate() + '</span><span class="m">' + MONTHS[d.getMonth()] + '</span><span class="y">' + d.getFullYear() + '</span></div>' +
        '<div class="event-body">' +
          '<div class="event-meta"><span class="tag">' + (TYPE_LABEL[ev.type] || ev.type) + '</span><span>' + ICON_CLOCK + fmtTime(ev.start) + ' – ' + fmtTime(ev.end) + ' WAT</span><span>' + ICON_PIN + ev.location + '</span></div>' +
          '<h3>' + ev.title + '</h3><p>' + ev.blurb + '</p>' +
        '</div>' +
        '<div class="event-actions">' +
          (isPast ? '<span class="tag">Past event</span>' :
            '<button class="btn ' + (going ? 'btn--ghost' : 'btn--primary') + '" type="button" data-rsvp="' + ev.id + '">' + (going ? 'Cancel RSVP' : 'RSVP') + '</button>' +
            (going ? '<span class="going">You\'re going</span>' : '') +
            '<a class="btn btn--link" href="#" data-ics="' + ev.id + '">Add to calendar</a>') +
        '</div>';
      (isPast && pastList ? pastList : list).appendChild(li);
    });
  }

  document.addEventListener('click', function (e) {
    const rsvp = e.target.closest('[data-rsvp]');
    const cal = e.target.closest('[data-ics]');
    if (rsvp) {
      const me = window.BenAuth && BenAuth.current();
      if (!me) { location.href = 'account.html?next=events.html&why=rsvp'; return; }
      const after = BenAuth.toggleRsvp(rsvp.getAttribute('data-rsvp'));
      const nowGoing = after.rsvps.indexOf(rsvp.getAttribute('data-rsvp')) !== -1;
      BenAuth.toast(nowGoing ? 'RSVP saved. See you there.' : 'RSVP cancelled.');
      render();
    }
    if (cal) {
      e.preventDefault();
      const ev = window.EVENTS.find(function (x) { return x.id === cal.getAttribute('data-ics'); });
      const blob = new Blob([ics(ev)], { type: 'text/calendar' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = ev.id + '.ics'; a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }
  });

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filter = btn.getAttribute('data-event-filter');
      filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      render();
    });
  });

  render();
})();
