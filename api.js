/* Be Empowered Network — one place that talks to the backend.
   Every page loads this after supabase-config.js. Nothing else should
   call Supabase or the Edge Functions directly. */
(function () {
  'use strict';

  var cfg = window.SUPABASE_CONFIG || {};
  var client = null;

  function sb() {
    if (client) return client;
    if (!window.supabase || !cfg.url || !cfg.anonKey) return null;
    client = window.supabase.createClient(cfg.url, cfg.anonKey);
    return client;
  }

  function fnUrl(name) { return cfg.url + '/functions/v1/' + name; }

  /* Call an Edge Function. Resolves { ok, data } or { ok: false, error }. */
  async function callFn(name, opts) {
    opts = opts || {};
    var headers = { 'Content-Type': 'application/json', apikey: cfg.anonKey };

    // Pass the signed-in user's token through when there is one, so
    // functions that check permissions (send-campaign) can see who it is.
    var c = sb();
    if (c) {
      try {
        var s = await c.auth.getSession();
        var tok = s && s.data && s.data.session && s.data.session.access_token;
        headers.Authorization = 'Bearer ' + (tok || cfg.anonKey);
      } catch (e) { headers.Authorization = 'Bearer ' + cfg.anonKey; }
    }

    var url = fnUrl(name) + (opts.query || '');
    try {
      var res = await fetch(url, {
        method: opts.method || 'POST',
        headers: headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined
      });
      var json = await res.json().catch(function () { return {}; });
      if (!res.ok) return { ok: false, error: json.error || 'Something went wrong. Please try again.' };
      return { ok: true, data: json };
    } catch (e) {
      return { ok: false, error: 'We could not reach the server. Check your connection and try again.' };
    }
  }

  var BenApi = {
    client: sb,
    ready: function () { return !!sb(); },

    /* ---- forms ---- */
    submitEnquiry: function (payload) { return callFn('submit-enquiry', { body: payload }); },
    subscribe: function (payload) { return callFn('subscribe', { body: payload }); },
    newsletterAction: function (action, token) {
      return callFn('newsletter-action', { method: 'GET', query: '?action=' + encodeURIComponent(action) + '&token=' + encodeURIComponent(token) });
    },
    sendCampaign: function (payload) { return callFn('send-campaign', { body: payload }); },

    /* ---- session ---- */
    user: async function () {
      var c = sb(); if (!c) return null;
      var r = await c.auth.getUser();
      return (r.data && r.data.user) || null;
    },
    profile: async function () {
      var c = sb(); if (!c) return null;
      var u = await BenApi.user(); if (!u) return null;
      var r = await c.from('profiles').select('*').eq('id', u.id).maybeSingle();
      return r.data || null;
    },
    signOut: async function () { var c = sb(); if (c) await c.auth.signOut(); },

    /* ---- events ---- */
    events: async function () {
      var c = sb(); if (!c) return null;
      var r = await c.from('events').select('*').eq('is_published', true).order('starts_at', { ascending: true });
      return r.error ? null : r.data;
    },
    rsvpCounts: async function () {
      var c = sb(); if (!c) return {};
      var r = await c.from('event_rsvp_counts').select('*');
      var out = {};
      (r.data || []).forEach(function (row) { out[row.event_id] = row.rsvp_count; });
      return out;
    },
    myRsvps: async function () {
      var c = sb(); if (!c) return [];
      var u = await BenApi.user(); if (!u) return [];
      var r = await c.from('rsvps').select('event_id').eq('user_id', u.id);
      return (r.data || []).map(function (x) { return x.event_id; });
    },
    toggleRsvp: async function (eventId, note) {
      var c = sb(); if (!c) return { ok: false, error: 'Not connected.' };
      var u = await BenApi.user();
      if (!u) return { ok: false, error: 'signed-out' };
      var mine = await BenApi.myRsvps();
      if (mine.indexOf(eventId) !== -1) {
        var d = await c.from('rsvps').delete().eq('event_id', eventId).eq('user_id', u.id);
        return d.error ? { ok: false, error: d.error.message } : { ok: true, rsvped: false };
      }
      var i = await c.from('rsvps').insert({ event_id: eventId, user_id: u.id, note: note || null });
      return i.error ? { ok: false, error: i.error.message } : { ok: true, rsvped: true };
    },

    /* ---- directory ---- */
    directory: async function () {
      var c = sb(); if (!c) return null;
      var r = await c.from('directory_entries').select('*').eq('is_published', true)
        .order('sort_order', { ascending: true });
      return r.error ? null : r.data;
    }
  };

  window.BenApi = BenApi;
})();
