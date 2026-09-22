/* Handles the confirm / unsubscribe links we email people. */
(function () {
  'use strict';
  var title = document.getElementById('nl-title');
  var msg = document.getElementById('nl-message');
  var actions = document.getElementById('nl-actions');
  var resub = document.getElementById('nl-resub');
  if (!title) return;

  var params = new URLSearchParams(location.search);
  var action = params.get('action');
  var token = params.get('token');

  function show(h1, text, opts) {
    opts = opts || {};
    title.textContent = h1;
    msg.textContent = text;
    if (actions) actions.hidden = false;
    if (resub) resub.hidden = !opts.offerResub;
  }

  if (!action || !token) {
    show('Newsletter', 'Use the link in the email we sent you to confirm or cancel your subscription.', { offerResub: true });
    return;
  }

  (async function () {
    var res = await window.BenApi.newsletterAction(action, token);
    if (!res.ok) {
      show('That link didn’t work', res.error, { offerResub: true });
      return;
    }
    if (res.data.action === 'confirm') {
      show('You’re on the list', 'Thank you — we’ll send one email a month, and you can unsubscribe from any of them in a single click.');
    } else {
      show('You’ve been unsubscribed', 'You won’t receive the newsletter again. Sorry to see you go.', { offerResub: true });
    }
  })();
})();
