/* Be Empowered Network — real form submission.
   Replaces the old mailto: behaviour in main.js. Forms marked
   data-enquiry post to the submit-enquiry Edge Function; the newsletter
   form posts to subscribe. */
(function () {
  'use strict';

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
    if (on) { b.dataset.label = b.dataset.label || b.textContent; b.textContent = label; }
    else if (b.dataset.label) b.textContent = b.dataset.label;
    b.disabled = on;
  }
  function fieldError(form, name, msg) {
    var input = form.querySelector('[name="' + name + '"]');
    var field = input && input.closest('.field');
    if (!field) return;
    field.setAttribute('data-invalid', msg ? 'true' : 'false');
    var el = field.querySelector('.field-error');
    if (el) el.textContent = msg || '';
  }

  /* ---- Contact / volunteer / partnership ---- */
  document.querySelectorAll('form[data-enquiry]').forEach(function (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var data = new FormData(form);
      var payload = { kind: form.getAttribute('data-enquiry') };
      data.forEach(function (v, k) { payload[k] = typeof v === 'string' ? v.trim() : v; });

      ['name', 'email', 'phone', 'message'].forEach(function (f) { fieldError(form, f, ''); });

      var V = window.BenValidate;
      var bad = false;
      if (!payload.name || payload.name.length < 2) { fieldError(form, 'name', 'Please tell us your name.'); bad = true; }
      if (V) {
        var er = V.email(payload.email);
        if (!er.ok) { fieldError(form, 'email', er.error); bad = true; }
        if (payload.phone) {
          var pr = V.phone(payload.phone, false);
          if (!pr.ok) { fieldError(form, 'phone', pr.error); bad = true; }
          else payload.phone = pr.value;
        }
      }
      if (!payload.message || payload.message.length < 10) {
        fieldError(form, 'message', 'Please add a little more detail.'); bad = true;
      }
      if (bad) { status(form, 'err', 'Please check the highlighted fields.'); return; }

      busy(form, true, 'Sending…');
      status(form, '', '');
      var res = await window.BenApi.submitEnquiry(payload);
      busy(form, false);

      if (!res.ok) { status(form, 'err', res.error); return; }
      form.reset();
      status(form, 'ok', 'Thank you — your message is with us. We reply within two working days, to the email you gave.');
    });
  });

  /* ---- Newsletter sign-up (footer and anywhere else) ---- */
  document.querySelectorAll('form[data-subscribe]').forEach(function (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var email = String(data.get('email') || '').trim();
      var V = window.BenValidate;

      fieldError(form, 'email', '');
      if (V) {
        var er = V.email(email);
        if (!er.ok) { fieldError(form, 'email', er.error); status(form, 'err', er.error); return; }
        if (er.suggestion) { fieldError(form, 'email', 'Did you mean ' + er.suggestion + '?'); }
      }

      busy(form, true, 'Signing you up…');
      status(form, '', '');
      var res = await window.BenApi.subscribe({
        email: email,
        name: data.get('name') || null,
        source: form.getAttribute('data-subscribe') || 'footer',
        website: data.get('website') || ''
      });
      busy(form, false);

      if (!res.ok) { status(form, 'err', res.error); return; }
      form.reset();
      status(form, 'ok', res.data.message || 'Check your inbox to confirm your subscription.');
    });
  });
})();
