/* Be Empowered Network — Support A Widow photo carousel.
   The track is a scroll-snapped strip, so it already swipes on a phone and
   works with no JS at all. This adds the arrows, the dots and keyboard
   control on top of it, and reads the current slide back off scroll
   position rather than keeping its own index, so a swipe and a button
   press can never disagree. */
(function () {
  'use strict';

  function init(root) {
    var track = root.querySelector('[data-slides-track]');
    var dots  = root.querySelector('[data-slides-dots]');
    var prev  = root.querySelector('[data-slides-prev]');
    var next  = root.querySelector('[data-slides-next]');
    var slides = Array.prototype.slice.call(root.querySelectorAll('.slide'));
    if (!track || slides.length < 2) return;

    /* Build the dots from the slides that are actually there. */
    var buttons = slides.map(function (slide, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.setAttribute('aria-label', 'Photograph ' + (i + 1) + ' of ' + slides.length);
      b.addEventListener('click', function () { go(i); });
      if (dots) dots.appendChild(b);
      return b;
    });

    /* Whichever slide's centre is closest to the track's centre is the
       current one. Works mid-swipe, unlike counting clicks. */
    function current() {
      var mid = track.scrollLeft + track.clientWidth / 2;
      var best = 0, bestGap = Infinity;
      slides.forEach(function (s, i) {
        var gap = Math.abs(s.offsetLeft + s.offsetWidth / 2 - mid);
        if (gap < bestGap) { bestGap = gap; best = i; }
      });
      return best;
    }

    function go(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      var s = slides[i];
      track.scrollTo({
        left: s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2,
        behavior: 'smooth'
      });
    }

    function paint() {
      var i = current();
      buttons.forEach(function (b, n) { b.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
    }

    if (prev) prev.addEventListener('click', function () { go(current() - 1); });
    if (next) next.addEventListener('click', function () { go(current() + 1); });

    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
      else if (e.key === 'Home') { e.preventDefault(); go(0); }
      else if (e.key === 'End') { e.preventDefault(); go(slides.length - 1); }
    });

    var frame = null;
    track.addEventListener('scroll', function () {
      if (frame) return;
      frame = requestAnimationFrame(function () { frame = null; paint(); });
    }, { passive: true });

    window.addEventListener('resize', paint);
    paint();
  }

  /* Copy-to-clipboard for the account number. */
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-slides]').forEach(init);
  });
})();
