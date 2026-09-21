/* Be Empowered Network — shared behaviour */
(function () {
  const root = document.documentElement;

  /* ---- Theme toggle (system preference by default, manual override) ---- */
  const sun = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2M12 19.5v2M4.3 4.3l1.4 1.4M18.3 18.3l1.4 1.4M2.5 12h2M19.5 12h2M4.3 19.7l1.4-1.4M18.3 5.7l1.4-1.4"/></svg>';
  const moon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>';
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let theme = null; // null = follow system
  let stored = null;
  try { stored = localStorage.getItem('ben-theme'); } catch (e) {}
  if (stored === 'light' || stored === 'dark') { theme = stored; root.setAttribute('data-theme', theme); }

  function current() { return theme || (media.matches ? 'dark' : 'light'); }
  function paint(btn) {
    const c = current();
    btn.innerHTML = c === 'dark' ? sun : moon;
    btn.setAttribute('aria-label', 'Switch to ' + (c === 'dark' ? 'light' : 'dark') + ' mode');
  }
  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    paint(btn);
    btn.addEventListener('click', function () {
      theme = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      try { localStorage.setItem('ben-theme', theme); } catch (e) {}
      document.querySelectorAll('[data-theme-toggle]').forEach(paint);
    });
    media.addEventListener('change', function () { if (!theme) paint(btn); });
  });

  /* ---- Mobile menu ---- */
  const menuBtn = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      const open = menu.getAttribute('data-open') === 'true';
      menu.setAttribute('data-open', String(!open));
      menuBtn.setAttribute('aria-expanded', String(!open));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.getAttribute('data-open') === 'true') {
        menu.setAttribute('data-open', 'false');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.focus();
      }
    });
  }

  /* ---- Mark the current page in the nav ---- */
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a, .mobile-menu a').forEach(function (a) {
    const href = a.getAttribute('href');
    if (href === here || (here === 'index.html' && href === './')) a.setAttribute('aria-current', 'page');
  });

  /* ---- Reveal on scroll ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- Forms: no backend yet, so compose an email from the fields ----
     Replace this with a Formspree / Netlify Forms / own API endpoint when ready. */
  document.querySelectorAll('form[data-mailto]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const status = form.querySelector('.form-status');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const data = new FormData(form);
      const lines = [];
      data.forEach(function (v, k) { if (k !== '_subject') lines.push(k.replace(/_/g, ' ') + ': ' + v); });
      const subject = data.get('_subject') || 'Message from beempowerednetwork website';
      const href = 'mailto:' + form.getAttribute('data-mailto') +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));
      window.location.href = href;
      if (status) {
        status.setAttribute('data-state', 'ok');
        status.textContent = 'Your email app should now open with your message ready to send. If it did not, email us directly at ' + form.getAttribute('data-mailto') + '.';
      }
    });
  });

  /* ---- Animated counters ---- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return; cio.unobserve(en.target);
        const el = en.target, target = Number(el.getAttribute('data-count')), t0 = performance.now(), dur = 1200;
        (function tick(now) {
          const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * e).toLocaleString();
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---- Pre-select contact topic from ?topic= ---- */
  const topic = new URLSearchParams(location.search).get('topic');
  const topicSel = document.getElementById('c-topic');
  if (topic && topicSel && [...topicSel.options].some(function (o) { return o.value === topic; })) topicSel.value = topic;

  /* ---- Footer year ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
