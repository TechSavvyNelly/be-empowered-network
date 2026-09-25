/* Be Empowered Network — pull events and directory entries from Supabase.
   ------------------------------------------------------------------
   events.js and directory.js still carry the original hardcoded arrays.
   Those are now the FALLBACK: if the database is reachable we replace
   them with live rows before anything renders, so staff can edit
   content in the admin page without a deploy. If Supabase is down or
   the tables are empty, the built-in arrays render instead and the
   site still works. */
(function () {
  'use strict';

  var TYPES = ['circle', 'campaign', 'training', 'webinar'];

  /* The type decides the tag on the card and which filter an event answers
     to. Prefer the column; if the database has not been migrated yet, read
     it off the slug (circle-*, training-*, wmhd-* ...), which is how the
     ids have always been written. Guessing from `mode` is not good enough:
     a training and a webinar are both online but neither is a circle. */
  function eventType(row) {
    if (row.type && TYPES.indexOf(row.type) !== -1) return row.type;
    var id = String(row.id || '');
    if (/^training-/.test(id)) return 'training';
    if (/^webinar-/.test(id)) return 'webinar';
    if (/^(wmhd|schools|campaign)-/.test(id)) return 'campaign';
    return 'circle';
  }

  function toEvent(row) {
    // Back to the shape events.js already knows how to render.
    var start = row.starts_at ? row.starts_at.slice(0, 16) : '';
    var end = row.ends_at ? row.ends_at.slice(0, 16) : start;
    return {
      id: row.id, title: row.title, blurb: row.summary || '',
      start: start, end: end,
      type: eventType(row),
      mode: row.mode || 'online',
      location: row.location || ''
    };
  }

  function toDirEntry(row) {
    return {
      name: row.name, type: row.category || 'ngo',
      states: (row.state || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      offers: row.description || '',
      phone: row.phone || undefined, phoneHref: row.phone_href || undefined,
      url: row.url || undefined
    };
  }

  window.BenData = {
    /* Resolves once live data has been merged in (or we've given up). */
    ready: (async function () {
      if (!window.BenApi || !window.BenApi.ready()) return { events: false, directory: false };
      var out = { events: false, directory: false };

      try {
        var evs = await window.BenApi.events();
        if (evs && evs.length) { window.EVENTS = evs.map(toEvent); out.events = true; }
      } catch (e) { /* keep the fallback */ }

      try {
        var dir = await window.BenApi.directory();
        if (dir && dir.length) { window.DIRECTORY = dir.map(toDirEntry); out.directory = true; }
      } catch (e) { /* keep the fallback */ }

      return out;
    })()
  };
})();
