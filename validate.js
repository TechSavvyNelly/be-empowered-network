/* Be Empowered Network — shared field validation.
   Loaded on every page so the contact form, the newsletter box and the
   sign-up form all judge an email the same way. The server re-checks
   all of this in the Edge Functions; nothing here is a security
   boundary, it just gives fast, kind feedback. */
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

  window.BenValidate = { email: checkEmail, phone: checkPhone, password: checkPassword };
})();
