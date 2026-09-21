/* Be Empowered Network — account page (sign in / create account / dashboard) */
(function () {
  const authView = document.getElementById('auth-view');
  const dashView = document.getElementById('dash-view');
  if (!authView || !dashView) return;

  const params = new URLSearchParams(location.search);
  const next = params.get('next');
  const why = params.get('why');
  const tabs = document.querySelectorAll('[role="tab"]');
  const panels = document.querySelectorAll('[role="tabpanel"]');

  function selectTab(id) {
    tabs.forEach(function (t) {
      const on = t.getAttribute('aria-controls') === id;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p) { p.hidden = p.id !== id; });
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { selectTab(t.getAttribute('aria-controls')); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const arr = Array.from(tabs); let i = arr.indexOf(t) + (e.key === 'ArrowRight' ? 1 : -1);
      i = (i + arr.length) % arr.length; arr[i].focus(); arr[i].click();
    });
  });
  document.querySelectorAll('[data-switch-tab]').forEach(function (b) {
    b.addEventListener('click', function () { selectTab(b.getAttribute('data-switch-tab')); document.getElementById(b.getAttribute('data-switch-tab')).querySelector('input').focus(); });
  });
  if (params.get('tab') === 'signup' || why === 'rsvp') selectTab('panel-signup');

  const reason = document.getElementById('auth-reason');
  if (reason && why === 'rsvp') { reason.textContent = 'Create a free account (or sign in) to RSVP, and we\'ll keep your place and send you the joining details.'; reason.hidden = false; }

  function setError(field, msg) {
    field.setAttribute('data-invalid', msg ? 'true' : 'false');
    const el = field.querySelector('.field-error'); if (el) el.textContent = msg || '';
  }
  function status(form, state, text) {
    const s = form.querySelector('.form-status'); if (!s) return;
    s.setAttribute('data-state', state); s.textContent = text;
  }

  /* ---- Sign up ---- */
  const signup = document.getElementById('signup-form');
  signup.addEventListener('submit', async function (e) {
    e.preventDefault();
    const name = signup.name.value.trim(), email = signup.email.value.trim(), pw = signup.password.value;
    let ok = true;
    setError(signup.name.closest('.field'), name ? '' : 'Please tell us your name.'); ok = ok && !!name;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setError(signup.email.closest('.field'), emailOk ? '' : 'That email doesn\'t look right.'); ok = ok && emailOk;
    setError(signup.password.closest('.field'), pw.length >= 8 ? '' : 'Use at least 8 characters.'); ok = ok && pw.length >= 8;
    if (!signup.consent.checked) { status(signup, 'err', 'Please agree to how we\'ll use your details.'); return; }
    if (!ok) return;
    try {
      await BenAuth.signUp({ name: name, email: email, password: pw, prefs: {
        newsletter: signup.newsletter.checked, events: signup.events.checked, volunteering: signup.volunteering.checked } });
      BenAuth.toast('Welcome, ' + name.split(' ')[0] + '. Your account is ready.');
      afterAuth();
    } catch (err) { status(signup, 'err', err.message); }
  });

  /* ---- Sign in ---- */
  const signin = document.getElementById('signin-form');
  signin.addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      const me = await BenAuth.signIn(signin.email.value, signin.password.value);
      BenAuth.toast('Signed in as ' + me.name.split(' ')[0] + '.');
      afterAuth();
    } catch (err) { status(signin, 'err', err.message); }
  });

  function afterAuth() {
    if (next && /^[a-z-]+\.html$/.test(next)) { location.href = next; return; }
    renderDash();
  }

  /* ---- Dashboard ---- */
  function renderDash() {
    const me = BenAuth.current();
    if (!me) { authView.hidden = false; dashView.hidden = true; return; }
    authView.hidden = true; dashView.hidden = false;
    document.getElementById('dash-name').textContent = me.name.split(' ')[0];
    document.getElementById('dash-email').textContent = me.email;
    const prefs = document.getElementById('prefs-form');
    prefs.newsletter.checked = !!me.prefs.newsletter;
    prefs.events.checked = !!me.prefs.events;
    prefs.volunteering.checked = !!me.prefs.volunteering;

    const ul = document.getElementById('rsvp-list');
    const events = (window.EVENTS || []).filter(function (ev) { return me.rsvps.indexOf(ev.id) !== -1; })
      .sort(function (a, b) { return a.start < b.start ? -1 : 1; });
    ul.innerHTML = events.length ? '' : '<li><span>No RSVPs yet.</span> <a href="events.html">Browse upcoming events →</a></li>';
    events.forEach(function (ev) {
      const d = new Date(ev.start);
      const li = document.createElement('li');
      li.innerHTML = '<div><strong>' + ev.title + '</strong><br><span>' + d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + ev.location + '</span></div><button class="btn btn--link" type="button" data-cancel="' + ev.id + '">Cancel</button>';
      ul.appendChild(li);
    });
  }
  document.getElementById('rsvp-list').addEventListener('click', function (e) {
    const b = e.target.closest('[data-cancel]'); if (!b) return;
    BenAuth.toggleRsvp(b.getAttribute('data-cancel')); BenAuth.toast('RSVP cancelled.'); renderDash();
  });
  document.getElementById('prefs-form').addEventListener('change', function (e) {
    const f = e.currentTarget;
    BenAuth.update({ prefs: { newsletter: f.newsletter.checked, events: f.events.checked, volunteering: f.volunteering.checked } });
    BenAuth.toast('Preferences saved.');
  });
  document.getElementById('signout').addEventListener('click', function () { BenAuth.signOut(); BenAuth.toast('Signed out.'); renderDash(); selectTab('panel-signin'); });

  renderDash();
})();
