/* Be Empowered Network — account dashboard, backed by Supabase.
   Signing in happens on signin.html; this page is what you see after. */
(function () {
  'use strict';

  var authView = document.getElementById('auth-view');
  var dashView = document.getElementById('dash-view');
  if (!dashView) return;

  var me = null;

  function toast(text) {
    var t = document.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = text; t.setAttribute('data-show', 'true');
    clearTimeout(t._h); t._h = setTimeout(function () { t.setAttribute('data-show', 'false'); }, 2800);
  }

  async function load() {
    if (!window.BenApi || !window.BenApi.ready()) {
      if (authView) authView.hidden = false;
      dashView.hidden = true;
      return;
    }
    var user = await window.BenApi.user();
    if (!user) {
      // Not signed in: the sign-in page is the single front door.
      location.href = 'signin.html?next=account.html';
      return;
    }
    me = await window.BenApi.profile();
    if (authView) authView.hidden = true;
    dashView.hidden = false;
    paint(user);
  }

  async function paint(user) {
    var first = ((me && me.full_name) || user.email || '').split(' ')[0] || 'there';
    var nameEl = document.getElementById('dash-name');
    var mailEl = document.getElementById('dash-email');
    if (nameEl) nameEl.textContent = first;
    if (mailEl) mailEl.textContent = user.email || '';

    var prefs = document.getElementById('prefs-form');
    if (prefs && me) {
      if (prefs.newsletter) prefs.newsletter.checked = !!me.newsletter;
      if (prefs.events) prefs.events.checked = !!me.events;
      if (prefs.volunteering) prefs.volunteering.checked = !!me.volunteering;
    }

    // Admins get a way in.
    if (me && me.is_admin) {
      var head = document.querySelector('.dash-head');
      if (head && !document.getElementById('admin-link')) {
        var a = document.createElement('a');
        a.id = 'admin-link'; a.className = 'btn btn--ghost'; a.href = 'admin.html';
        a.textContent = 'Admin';
        head.appendChild(a);
      }
    }

    await paintRsvps();
  }

  async function paintRsvps() {
    var ul = document.getElementById('rsvp-list');
    if (!ul) return;
    var ids = await window.BenApi.myRsvps();
    var all = (await window.BenApi.events()) || [];
    var mine = all.filter(function (e) { return ids.indexOf(e.id) !== -1; })
                  .sort(function (a, b) { return a.starts_at < b.starts_at ? -1 : 1; });

    ul.innerHTML = mine.length ? '' :
      '<li><span>No RSVPs yet.</span> <a href="events.html">Browse upcoming events →</a></li>';

    mine.forEach(function (ev) {
      var d = new Date(ev.starts_at);
      var li = document.createElement('li');
      var when = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      li.innerHTML = '<div><strong></strong><br><span></span></div>' +
                     '<button class="btn btn--link" type="button" data-cancel="' + ev.id + '">Cancel</button>';
      li.querySelector('strong').textContent = ev.title;
      li.querySelector('span').textContent = when + ' · ' + (ev.location || '');
      ul.appendChild(li);
    });
  }

  var list = document.getElementById('rsvp-list');
  if (list) list.addEventListener('click', async function (e) {
    var b = e.target.closest('[data-cancel]');
    if (!b) return;
    b.disabled = true;
    var res = await window.BenApi.toggleRsvp(b.getAttribute('data-cancel'));
    if (!res.ok) { b.disabled = false; toast('Could not cancel that RSVP.'); return; }
    toast('RSVP cancelled.');
    await paintRsvps();
  });

  var prefsForm = document.getElementById('prefs-form');
  if (prefsForm) prefsForm.addEventListener('change', async function () {
    var c = window.BenApi.client();
    var user = await window.BenApi.user();
    if (!c || !user) return;
    var patch = {
      newsletter: !!prefsForm.newsletter.checked,
      events: !!prefsForm.events.checked,
      volunteering: !!prefsForm.volunteering.checked
    };
    var r = await c.from('profiles').update(patch).eq('id', user.id);
    toast(r.error ? 'Could not save your preferences.' : 'Preferences saved.');
  });

  var out = document.getElementById('signout');
  if (out) out.addEventListener('click', async function () {
    await window.BenApi.signOut();
    location.href = 'signin.html';
  });

  load();
})();
