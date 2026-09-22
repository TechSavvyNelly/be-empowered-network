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

  var V = window.BenValidate;
  var checkEmail = V.email, checkPhone = V.phone, checkPassword = V.password;

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
