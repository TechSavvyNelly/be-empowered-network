/* Be Empowered Network — sign in / sign up against Supabase
   ------------------------------------------------------------------
   Email authenticity is enforced in three layers:
     1. shape      — a real-world-strict format check
     2. plausible  — disposable domains blocked, obvious typos caught
     3. proof      — Supabase emails a confirmation link; the account
                     is not usable until that link is clicked
   Only step 3 actually proves the inbox exists. 1 and 2 just stop the
   common cases early so people aren't left waiting for mail that can
   never arrive.

   Phone numbers are validated to E.164 (Nigerian numbers normalised
   from the local 0801... form). Format validation does NOT prove
   ownership — that needs SMS OTP, which needs a paid SMS provider
   configured in Supabase. See README-auth.md. */
(function () {
  'use strict';

  /* ---------------------------------------------------------------
     Email
     --------------------------------------------------------------- */

  // Deliberately stricter than the spec: no quoted locals, no IP literals,
  // requires a sane TLD. Those are legal but never what a person types.
  var EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  var DISPOSABLE = [
    'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', '10minutemail.com',
    'tempmail.com', 'temp-mail.org', 'throwawaymail.com', 'yopmail.com',
    'trashmail.com', 'sharklasers.com', 'getnada.com', 'dispostable.com',
    'maildrop.cc', 'fakeinbox.com', 'mailnesia.com', 'tempinbox.com',
    'spamgourmet.com', 'mytemp.email', 'emailondeck.com', 'moakt.com',
    'tempr.email', 'discard.email', 'mailcatch.com', 'inboxbear.com'
  ];

  var COMMON_DOMAINS = [
    'gmail.com', 'yahoo.com', 'yahoo.co.uk', 'outlook.com', 'hotmail.com',
    'live.com', 'icloud.com', 'me.com', 'aol.com', 'protonmail.com',
    'proton.me', 'zoho.com', 'gmx.com', 'mail.com', 'yandex.com'
  ];

  function levenshtein(a, b) {
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(
          prev[j] + 1,
          cur[j - 1] + 1,
          prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)
        );
      }
      prev = cur.slice();
    }
    return prev[b.length];
  }

  /* Returns { ok, error, suggestion } */
  function checkEmail(raw) {
    var email = String(raw || '').trim().toLowerCase();
    if (!email) return { ok: false, error: 'Please enter your email address.' };
    if (email.length > 254) return { ok: false, error: 'That email address is too long.' };
    if (!EMAIL_RE.test(email)) return { ok: false, error: 'That email doesn’t look right — check for typos or a missing “.com”.' };

    var domain = email.split('@')[1];
    if (DISPOSABLE.indexOf(domain) !== -1) {
      return { ok: false, error: 'Please use a permanent email address — we need to reach you about your account.' };
    }

    // Catch gmial.com, yaho.com, outlok.com and friends.
    for (var i = 0; i < COMMON_DOMAINS.length; i++) {
      var d = COMMON_DOMAINS[i];
      if (domain !== d && levenshtein(domain, d) <= 2 && Math.abs(domain.length - d.length) <= 2) {
        return { ok: true, suggestion: email.split('@')[0] + '@' + d };
      }
    }
    return { ok: true };
  }

  /* ---------------------------------------------------------------
     Phone — normalise to E.164
     --------------------------------------------------------------- */

  /* Returns { ok, error, value } where value is E.164, e.g. +2348031234567 */
  function checkPhone(raw, required) {
    var s = String(raw || '').replace(/[\s()\-.]/g, '');
    if (!s) {
      return required
        ? { ok: false, error: 'Please enter a phone number.' }
        : { ok: true, value: null };
    }

    // Nigerian local form: 0803 123 4567 -> +234 803 123 4567
    if (/^0\d{10}$/.test(s)) s = '+234' + s.slice(1);
    else if (/^234\d{10}$/.test(s)) s = '+' + s;
    else if (/^\d{10}$/.test(s) && /^[789]/.test(s)) s = '+234' + s;   // bare 8031234567

    if (s.charAt(0) !== '+') {
      return { ok: false, error: 'Include the country code, e.g. +234 803 123 4567.' };
    }

    // Nigerian mobile numbers: +234 then 10 digits starting 7, 8 or 9.
    if (s.indexOf('+234') === 0) {
      if (!/^\+234[789]\d{9}$/.test(s)) {
        return { ok: false, error: 'That isn’t a valid Nigerian mobile number. Try 0803 123 4567.' };
      }
      return { ok: true, value: s };
    }

    // Any other country: E.164 allows up to 15 digits total.
    if (!/^\+[1-9]\d{7,14}$/.test(s)) {
      return { ok: false, error: 'That phone number doesn’t look right.' };
    }
    return { ok: true, value: s };
  }

  /* ---------------------------------------------------------------
     Password
     --------------------------------------------------------------- */

  function checkPassword(pw) {
    pw = String(pw || '');
    if (pw.length < 8) return { ok: false, error: 'Use at least 8 characters.' };
    if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) {
      return { ok: false, error: 'Include at least one letter and one number.' };
    }
    return { ok: true };
  }

  /* Expose the validators so other pages (and tests) can reuse them. */
  window.BenValidate = { email: checkEmail, phone: checkPhone, password: checkPassword };

  /* ---------------------------------------------------------------
     Supabase client
     --------------------------------------------------------------- */

  var cfg = window.SUPABASE_CONFIG || {};
  var sb = null;
  var configError = '';

  if (!window.supabase || !window.supabase.createClient) {
    configError = 'Could not load the sign-in service. Check your connection and refresh.';
  } else if (!cfg.url || !cfg.anonKey) {
    configError = 'Sign-in is not configured yet: the Supabase anon key is missing from supabase-config.js.';
  } else {
    sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  }

  /* ---------------------------------------------------------------
     DOM wiring
     --------------------------------------------------------------- */

  var root = document.getElementById('auth-root');
  if (!root) return;

  var tabs = root.querySelectorAll('[role="tab"]');
  var panels = root.querySelectorAll('[role="tabpanel"]');

  function selectTab(id) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('aria-controls') === id;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p) { p.hidden = p.id !== id; });
  }
  tabs.forEach(function (t) {
    t.addEventListener('click', function () { selectTab(t.getAttribute('aria-controls')); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var arr = Array.prototype.slice.call(tabs);
      var i = (arr.indexOf(t) + (e.key === 'ArrowRight' ? 1 : -1) + arr.length) % arr.length;
      arr[i].focus(); arr[i].click();
    });
  });
  root.querySelectorAll('[data-switch-tab]').forEach(function (b) {
    b.addEventListener('click', function () { selectTab(b.getAttribute('data-switch-tab')); });
  });

  var params = new URLSearchParams(location.search);
  if (params.get('tab') === 'signup') selectTab('panel-signup');

  function fieldOf(input) { return input.closest('.field'); }
  function setError(input, msg) {
    var f = fieldOf(input); if (!f) return;
    f.setAttribute('data-invalid', msg ? 'true' : 'false');
    var el = f.querySelector('.field-error'); if (el) el.textContent = msg || '';
  }
  function status(form, state, text) {
    var s = form.querySelector('.form-status');
    if (!s) return;
    s.setAttribute('data-state', state);
    s.textContent = text;
    s.hidden = !text;
  }
  function busy(form, on, label) {
    var b = form.querySelector('button[type="submit"]');
    if (!b) return;
    if (on) { b.dataset.label = b.textContent; b.textContent = label || 'Please wait…'; }
    else if (b.dataset.label) { b.textContent = b.dataset.label; }
    b.disabled = on;
  }

  var signup = document.getElementById('signup-form');
  var signin = document.getElementById('signin-form');

  if (configError) {
    [signup, signin].forEach(function (f) { if (f) status(f, 'err', configError); });
  }

  /* ---- live email typo hint ---- */
  var suEmail = document.getElementById('su-email');
  var emailHint = document.getElementById('su-email-suggest');
  if (suEmail && emailHint) {
    suEmail.addEventListener('blur', function () {
      var r = checkEmail(suEmail.value);
      if (r.ok && r.suggestion) {
        emailHint.hidden = false;
        emailHint.querySelector('button').textContent = r.suggestion;
      } else {
        emailHint.hidden = true;
      }
    });
    emailHint.querySelector('button').addEventListener('click', function () {
      suEmail.value = this.textContent;
      emailHint.hidden = true;
      setError(suEmail, '');
    });
  }

  /* ---- OAuth ---- */
  root.querySelectorAll('[data-oauth]').forEach(function (btn) {
    btn.addEventListener('click', async function () {
      if (!sb) { alert(configError); return; }
      var provider = btn.getAttribute('data-oauth');
      btn.disabled = true;
      var res = await sb.auth.signInWithOAuth({
        provider: provider,
        options: { redirectTo: cfg.redirectTo }
      });
      if (res.error) {
        btn.disabled = false;
        var form = document.getElementById(
          document.getElementById('panel-signup').hidden ? 'signin-form' : 'signup-form'
        );
        status(form, 'err', res.error.message.indexOf('not enabled') !== -1
          ? 'Sign in with ' + provider + ' isn’t switched on yet in Supabase.'
          : res.error.message);
      }
      // On success the browser navigates away to the provider.
    });
  });

  /* ---- Sign up ---- */
  if (signup) signup.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!sb) { status(signup, 'err', configError); return; }

    var name = signup.name.value.trim();
    var emailRaw = signup.email.value;
    var phoneRaw = signup.phone.value;
    var pw = signup.password.value;
    var ok = true;

    setError(signup.name, name ? '' : 'Please tell us your name.');
    if (!name) ok = false;

    var er = checkEmail(emailRaw);
    setError(signup.email, er.ok ? '' : er.error);
    if (!er.ok) ok = false;

    var pr = checkPhone(phoneRaw, true);
    setError(signup.phone, pr.ok ? '' : pr.error);
    if (!pr.ok) ok = false;

    var pwr = checkPassword(pw);
    setError(signup.password, pwr.ok ? '' : pwr.error);
    if (!pwr.ok) ok = false;

    if (!signup.consent.checked) {
      status(signup, 'err', 'Please agree to how we’ll use your details.');
      return;
    }
    if (!ok) { status(signup, 'err', ''); return; }

    busy(signup, true, 'Creating your account…');
    status(signup, '', '');

    var out = await sb.auth.signUp({
      email: emailRaw.trim().toLowerCase(),
      password: pw,
      options: {
        emailRedirectTo: cfg.redirectTo,
        data: {
          full_name: name,
          phone: pr.value,
          newsletter: signup.newsletter.checked,
          events: signup.events.checked,
          volunteering: signup.volunteering.checked
        }
      }
    });

    busy(signup, false);

    if (out.error) {
      status(signup, 'err', out.error.message);
      return;
    }

    // Write the preference columns the trigger doesn't know about.
    // With email confirmation on there's no session yet, so this only
    // succeeds for already-confirmed sessions; the trigger has already
    // stored name/email/phone either way.
    if (out.data.session && out.data.user) {
      await sb.from('profiles').update({
        phone: pr.value,
        newsletter: signup.newsletter.checked,
        events: signup.events.checked,
        volunteering: signup.volunteering.checked
      }).eq('id', out.data.user.id);
    }

    signup.reset();
    status(signup, 'ok',
      'Almost there. We’ve sent a confirmation link to ' + emailRaw.trim().toLowerCase() +
      ' — click it to activate your account. If it doesn’t arrive in a few minutes, check your spam folder.');
  });

  /* ---- Sign in ---- */
  if (signin) signin.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!sb) { status(signin, 'err', configError); return; }

    var email = signin.email.value.trim().toLowerCase();
    var pw = signin.password.value;
    if (!email || !pw) { status(signin, 'err', 'Enter your email and password.'); return; }

    busy(signin, true, 'Signing in…');
    status(signin, '', '');

    var out = await sb.auth.signInWithPassword({ email: email, password: pw });
    busy(signin, false);

    if (out.error) {
      var m = out.error.message || '';
      if (/email not confirmed/i.test(m)) {
        status(signin, 'err', 'Please click the confirmation link we emailed you first.');
      } else if (/invalid login/i.test(m)) {
        status(signin, 'err', 'We couldn’t find an account with that email and password.');
      } else {
        status(signin, 'err', m);
      }
      return;
    }

    var next = params.get('next');
    if (next && /^[a-z0-9-]+\.html$/.test(next)) { location.href = next; return; }
    showSignedIn(out.data.user);
  });

  /* Signed-in state, shown in place of the forms. account.html still runs
     the old localStorage accounts, so we don't send people there yet. */
  function showSignedIn(user) {
    var banner = document.getElementById('already-in');
    if (banner) {
      banner.hidden = false;
      var who = banner.querySelector('[data-who]');
      if (who) who.textContent = user && user.email ? user.email : 'your account';
    }
    root.querySelectorAll('.tabs, [role="tabpanel"]').forEach(function (el) { el.hidden = true; });
  }

  var signout = document.getElementById('signout-btn');
  if (signout) signout.addEventListener('click', async function () {
    if (sb) await sb.auth.signOut();
    location.href = 'signin.html';
  });

  /* ---- Forgot password ---- */
  var forgot = document.getElementById('forgot-link');
  if (forgot) forgot.addEventListener('click', async function (e) {
    e.preventDefault();
    if (!sb) { status(signin, 'err', configError); return; }
    var email = signin.email.value.trim().toLowerCase();
    var er = checkEmail(email);
    if (!er.ok) { setError(signin.email, 'Enter your email first, then tap this again.'); return; }
    var out = await sb.auth.resetPasswordForEmail(email, { redirectTo: cfg.redirectTo });
    status(signin, out.error ? 'err' : 'ok',
      out.error ? out.error.message : 'If that email has an account, a reset link is on its way.');
  });

  /* Hide provider buttons Supabase hasn't got switched on, so nobody
     clicks a button that can only fail. */
  if (cfg.url && cfg.anonKey) {
    fetch(cfg.url + '/auth/v1/settings', { headers: { apikey: cfg.anonKey } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (s) {
        if (!s || !s.external) return;
        root.querySelectorAll('[data-oauth]').forEach(function (btn) {
          if (!s.external[btn.getAttribute('data-oauth')]) btn.hidden = true;
        });
        root.querySelectorAll('[data-oauth-group]').forEach(function (g) {
          var live = g.querySelectorAll('[data-oauth]:not([hidden])').length;
          var note = g.querySelector('[data-oauth-empty]');
          if (note) note.hidden = live > 0;
        });
        if (!s.external.google && !s.external.apple) {
          root.querySelectorAll('[data-oauth-rule]').forEach(function (r) { r.hidden = true; });
        }
      })
      .catch(function () { /* leave the buttons up; clicking shows the real error */ });
  }

  /* Already signed in? Don't make them do it again. */
  if (sb) {
    sb.auth.getSession().then(function (r) {
      if (r.data && r.data.session) showSignedIn(r.data.session.user);
    });
  }
})();
