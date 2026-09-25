/* Be Empowered Network — admin.
   The gate here is cosmetic: the real enforcement is row level security
   in Postgres and the is_admin check inside the send-campaign function.
   A non-admin who bypasses this page still gets nothing back. */
(function () {
  'use strict';

  var gate = document.getElementById('admin-gate');
  var body = document.getElementById('admin-body');
  if (!gate) return;

  var c = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function when(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function status(form, state, text) {
    var s = form.querySelector('.form-status');
    if (!s) return;
    s.setAttribute('data-state', state); s.textContent = text; s.hidden = !text;
  }

  /* ---- tabs ---- */
  var tabs = document.querySelectorAll('[role="tab"]');
  var panels = document.querySelectorAll('[role="tabpanel"]');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      var id = t.getAttribute('aria-controls');
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p) { p.hidden = p.id !== id; });
    });
  });

  /* ---- gate ---- */
  (async function () {
    if (!window.BenApi || !window.BenApi.ready()) {
      gate.textContent = 'Not connected to the database.';
      return;
    }
    var user = await window.BenApi.user();
    if (!user) { location.href = 'signin.html?next=admin.html'; return; }
    var me = await window.BenApi.profile();
    if (!me || !me.is_admin) {
      gate.textContent = 'This page is for administrators. If that should be you, ask another admin to grant access.';
      return;
    }
    c = window.BenApi.client();
    gate.hidden = true;
    body.hidden = false;
    loadEnquiries(); loadSubscribers(); loadCampaigns(); loadEvents(); loadDirectory();
  })();

  /* ---- enquiries ---- */
  async function loadEnquiries() {
    var ul = document.getElementById('enq-list');
    var r = await c.from('enquiries').select('*').order('created_at', { ascending: false }).limit(100);
    if (r.error) { ul.innerHTML = '<li>Could not load enquiries.</li>'; return; }
    if (!r.data.length) { ul.innerHTML = '<li>No enquiries yet.</li>'; return; }
    ul.innerHTML = r.data.map(function (e) {
      return '<li class="admin-item"><div>' +
        '<strong>' + esc(e.name) + '</strong> <span class="tag">' + esc(e.kind) + '</span>' +
        (e.status !== 'new' ? ' <span class="tag">' + esc(e.status) + '</span>' : '') +
        '<br><span class="dir-states">' + esc(e.email) + (e.phone ? ' · ' + esc(e.phone) : '') + ' · ' + when(e.created_at) + '</span>' +
        '<p>' + esc(e.message) + '</p></div>' +
        '<div class="dir-actions">' +
          '<a class="btn btn--ghost" href="mailto:' + esc(e.email) + '?subject=Re: your message to Be Empowered Network">Reply</a>' +
          '<button class="btn btn--link" type="button" data-enq-done="' + e.id + '">Mark replied</button>' +
        '</div></li>';
    }).join('');
  }
  document.getElementById('enq-list').addEventListener('click', async function (e) {
    var b = e.target.closest('[data-enq-done]'); if (!b) return;
    b.disabled = true;
    await c.from('enquiries').update({ status: 'replied' }).eq('id', b.getAttribute('data-enq-done'));
    loadEnquiries();
  });

  /* ---- subscribers ---- */
  async function loadSubscribers() {
    var ul = document.getElementById('subs-list');
    var r = await c.from('subscribers').select('*').order('created_at', { ascending: false }).limit(500);
    if (r.error) { ul.innerHTML = '<li>Could not load subscribers.</li>'; return; }
    var confirmed = r.data.filter(function (s) { return s.status === 'confirmed'; }).length;
    document.getElementById('subs-count').textContent =
      r.data.length + ' total · ' + confirmed + ' confirmed · ' +
      r.data.filter(function (s) { return s.status === 'pending'; }).length + ' awaiting confirmation';
    ul.innerHTML = r.data.map(function (s) {
      return '<li class="admin-item"><div><strong>' + esc(s.email) + '</strong> <span class="tag">' + esc(s.status) + '</span>' +
        '<br><span class="dir-states">' + esc(s.source || '') + ' · joined ' + when(s.created_at) + '</span></div></li>';
    }).join('') || '<li>No subscribers yet.</li>';
  }

  /* ---- campaigns ---- */
  async function loadCampaigns() {
    var ul = document.getElementById('cp-list');
    var r = await c.from('campaigns').select('*').order('created_at', { ascending: false }).limit(20);
    if (r.error || !r.data.length) { ul.innerHTML = '<li>Nothing sent yet.</li>'; return; }
    ul.innerHTML = r.data.map(function (x) {
      return '<li class="admin-item"><div><strong>' + esc(x.subject) + '</strong> <span class="tag">' + esc(x.status) + '</span>' +
        '<br><span class="dir-states">' + (x.sent_count || 0) + ' sent · ' + when(x.sent_at || x.created_at) + '</span></div></li>';
    }).join('');
  }

  var cpForm = document.getElementById('campaign-form');
  async function sendCampaign(test) {
    var subject = cpForm.subject.value.trim();
    var bodyHtml = cpForm.body_html.value.trim();
    if (!subject || !bodyHtml) { status(cpForm, 'err', 'Subject and body are both required.'); return; }
    if (!test && !confirm('Send "' + subject + '" to every confirmed subscriber? This cannot be undone.')) return;

    status(cpForm, '', 'Sending…');
    var res = await window.BenApi.sendCampaign({ subject: subject, body_html: bodyHtml, test: test });
    if (!res.ok) { status(cpForm, 'err', res.error); return; }
    status(cpForm, 'ok', test
      ? 'Test sent to you.'
      : 'Sent to ' + res.data.sent + ' subscribers' + (res.data.failed ? ', ' + res.data.failed + ' failed' : '') + '.');
    if (!test) { cpForm.reset(); loadCampaigns(); }
  }
  document.getElementById('cp-test').addEventListener('click', function () { sendCampaign(true); });
  cpForm.addEventListener('submit', function (e) { e.preventDefault(); sendCampaign(false); });

  /* ---- events ---- */
  async function loadEvents() {
    var ul = document.getElementById('evt-list');
    var r = await c.from('events').select('*').order('starts_at', { ascending: false });
    if (r.error) { ul.innerHTML = '<li>Could not load events.</li>'; return; }
    ul.innerHTML = r.data.map(function (e) {
      return '<li class="admin-item"><div><strong>' + esc(e.title) + '</strong>' +
        (e.is_published ? '' : ' <span class="tag">hidden</span>') +
        '<br><span class="dir-states">' + esc(e.id) + ' · ' + when(e.starts_at) + ' · ' + esc(e.location || '') + '</span></div>' +
        '<div class="dir-actions"><button class="btn btn--link" type="button" data-evt-toggle="' + esc(e.id) + '" data-pub="' + e.is_published + '">' +
        (e.is_published ? 'Hide' : 'Publish') + '</button></div></li>';
    }).join('') || '<li>No events yet.</li>';
  }
  document.getElementById('evt-list').addEventListener('click', async function (e) {
    var b = e.target.closest('[data-evt-toggle]'); if (!b) return;
    b.disabled = true;
    await c.from('events').update({ is_published: b.getAttribute('data-pub') !== 'true' }).eq('id', b.getAttribute('data-evt-toggle'));
    loadEvents();
  });
  var evForm = document.getElementById('event-form');
  evForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var row = {
      id: evForm.id.value.trim(), title: evForm.title.value.trim(),
      starts_at: evForm.starts_at.value ? new Date(evForm.starts_at.value).toISOString() : null,
      ends_at: evForm.ends_at.value ? new Date(evForm.ends_at.value).toISOString() : null,
      mode: evForm.mode.value, type: evForm.type.value, location: evForm.location.value.trim(),
      summary: evForm.summary.value.trim()
    };
    if (!row.id || !row.title || !row.starts_at) { status(evForm, 'err', 'ID, title and start time are required.'); return; }
    var r = await c.from('events').upsert(row);
    status(evForm, r.error ? 'err' : 'ok', r.error ? r.error.message : 'Event saved.');
    if (!r.error) { evForm.reset(); loadEvents(); }
  });

  /* ---- directory ---- */
  async function loadDirectory() {
    var ul = document.getElementById('dir-list');
    var r = await c.from('directory_entries').select('*').order('sort_order');
    if (r.error) { ul.innerHTML = '<li>Could not load the directory.</li>'; return; }
    ul.innerHTML = r.data.map(function (d) {
      return '<li class="admin-item"><div><strong>' + esc(d.name) + '</strong> <span class="tag">' + esc(d.category || '') + '</span>' +
        (d.is_published ? '' : ' <span class="tag">hidden</span>') +
        '<br><span class="dir-states">' + esc(d.state || '') + '</span></div>' +
        '<div class="dir-actions"><button class="btn btn--link" type="button" data-dir-toggle="' + d.id + '" data-pub="' + d.is_published + '">' +
        (d.is_published ? 'Hide' : 'Publish') + '</button></div></li>';
    }).join('') || '<li>No entries yet.</li>';
  }
  document.getElementById('dir-list').addEventListener('click', async function (e) {
    var b = e.target.closest('[data-dir-toggle]'); if (!b) return;
    b.disabled = true;
    await c.from('directory_entries').update({ is_published: b.getAttribute('data-pub') !== 'true' }).eq('id', b.getAttribute('data-dir-toggle'));
    loadDirectory();
  });
  var drForm = document.getElementById('dir-form');
  drForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var phone = drForm.phone.value.trim();
    var row = {
      name: drForm.name.value.trim(), category: drForm.category.value,
      state: drForm.state.value.trim(), description: drForm.description.value.trim(),
      phone: phone || null,
      phone_href: phone ? 'tel:' + phone.replace(/[^\d+]/g, '') : null,
      url: drForm.url.value.trim() || null
    };
    if (!row.name) { status(drForm, 'err', 'Name is required.'); return; }
    var r = await c.from('directory_entries').insert(row);
    status(drForm, r.error ? 'err' : 'ok', r.error ? r.error.message : 'Entry saved.');
    if (!r.error) { drForm.reset(); loadDirectory(); }
  });
})();
