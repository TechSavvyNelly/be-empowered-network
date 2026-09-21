/* Be Empowered Network — accounts (browser-local)
   ------------------------------------------------------------------
   The site is static, so accounts live in this browser's localStorage.
   Passwords are salted + SHA-256 hashed before storage, but this is NOT
   a substitute for a real backend. To go live, replace the `store`
   functions below with calls to Supabase / Firebase Auth / your own API;
   the rest of the site only talks to the `BenAuth` interface. */
(function () {
  const USERS = 'ben-users';
  const SESSION = 'ben-session';

  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (e) { return fallback; } }
  function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; } }

  async function hash(text) {
    if (!(window.crypto && crypto.subtle)) return 'plain:' + text; // very old browsers only
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
  function salt() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

  const store = {
    users: function () { return read(USERS, {}); },
    save: function (users) { return write(USERS, users); },
    session: function () { return read(SESSION, null); },
    setSession: function (email) { return email ? write(SESSION, { email: email, at: Date.now() }) : (localStorage.removeItem(SESSION), true); }
  };

  const BenAuth = {
    current: function () {
      const s = store.session();
      if (!s) return null;
      const u = store.users()[s.email];
      return u ? { email: u.email, name: u.name, prefs: u.prefs, rsvps: u.rsvps || [], createdAt: u.createdAt } : null;
    },
    signUp: async function (opts) {
      const email = String(opts.email || '').trim().toLowerCase();
      const users = store.users();
      if (users[email]) throw new Error('An account with that email already exists. Try signing in.');
      const s = salt();
      users[email] = {
        email: email, name: String(opts.name || '').trim(), salt: s,
        hash: await hash(s + opts.password),
        prefs: Object.assign({ newsletter: true, events: true, volunteering: false }, opts.prefs || {}),
        rsvps: [], createdAt: new Date().toISOString()
      };
      if (!store.save(users)) throw new Error('Your browser is blocking storage, so we could not create the account.');
      store.setSession(email);
      BenAuth.paint();
      return BenAuth.current();
    },
    signIn: async function (email, password) {
      email = String(email || '').trim().toLowerCase();
      const u = store.users()[email];
      if (!u || u.hash !== await hash(u.salt + password)) throw new Error('We could not find an account with that email and password.');
      store.setSession(email);
      BenAuth.paint();
      return BenAuth.current();
    },
    signOut: function () { store.setSession(null); BenAuth.paint(); },
    update: function (patch) {
      const s = store.session(); if (!s) return null;
      const users = store.users(); const u = users[s.email]; if (!u) return null;
      if (patch.name !== undefined) u.name = patch.name;
      if (patch.prefs) u.prefs = Object.assign({}, u.prefs, patch.prefs);
      if (patch.rsvps) u.rsvps = patch.rsvps;
      store.save(users);
      return BenAuth.current();
    },
    toggleRsvp: function (eventId) {
      const me = BenAuth.current(); if (!me) return null;
      const set = new Set(me.rsvps);
      set.has(eventId) ? set.delete(eventId) : set.add(eventId);
      return BenAuth.update({ rsvps: Array.from(set) });
    },
    /* Update every "Sign in" link in the header/menu to reflect state */
    paint: function () {
      const me = BenAuth.current();
      document.querySelectorAll('[data-account-link]').forEach(function (a) {
        a.textContent = me ? (me.name.split(' ')[0] || 'Account') : 'Sign in';
        a.setAttribute('aria-label', me ? 'Your account' : 'Sign in or create an account');
      });
      document.documentElement.setAttribute('data-signed-in', me ? 'true' : 'false');
    },
    toast: function (text) {
      let t = document.querySelector('.toast');
      if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
      t.textContent = text; t.setAttribute('data-show', 'true');
      clearTimeout(t._h); t._h = setTimeout(function () { t.setAttribute('data-show', 'false'); }, 2800);
    }
  };

  window.BenAuth = BenAuth;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', BenAuth.paint); else BenAuth.paint();
})();
