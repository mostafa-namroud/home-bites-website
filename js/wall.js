/* ============================================================================
   HOME BITES — the feedback wall
   Two marquee rows drifting in opposite directions.

   The rows move with the Web Animations API on `transform`, which runs on the
   browser's compositor (GPU) thread: no JavaScript runs per frame and nothing
   is re-painted while the cards drift, so the wall stays smooth even while the
   page scrolls. (It used to push scrollLeft from requestAnimationFrame, which
   ran on the main thread every frame and caused the lag.)

     · each track holds its set of columns several times; one animation cycle
       moves exactly one set, so the wrap point is invisible
     · hover slows a row to 40% with updatePlaybackRate — no jump (mouse only;
       a tap on a phone never leaves it stuck)
     · keyboard focus holds a row still for reading
     · off screen or in a background tab the animations are paused
     · prefers-reduced-motion: no drift, the rows become swipeable scrollers
   ========================================================================== */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var SPEED_WIDE = 42, SPEED_NARROW = 30, HOVER_K = 0.4;

  var rows = [['wallA', 1], ['wallB', -1]].map(function (r) {
    var el = document.getElementById(r[0]);
    if (!el) return null;
    var track = el.querySelector('.wall__track');
    return { el: el, track: track, dir: r[1], set: [].slice.call(track.children), copies: 1,
             anim: null, setW: 0, over: false, focused: false, visible: false };
  }).filter(Boolean);
  if (!rows.length) return;

  if (reduce || !Element.prototype.animate) {
    rows.forEach(function (r) { r.el.classList.add('wall--static'); });
    return;
  }

  function speed() { return window.matchMedia('(max-width: 720px)').matches ? SPEED_NARROW : SPEED_WIDE; }

  /* enough copies that one set plus a full screen width is always covered */
  function fill(r) {
    var one = r.track.scrollWidth / r.copies;
    while (one > 0 && r.track.scrollWidth < one * 2 + r.el.clientWidth && r.copies < 8) {
      r.set.forEach(function (c) {
        var k = c.cloneNode(true);
        k.setAttribute('aria-hidden', 'true');
        [].forEach.call(k.querySelectorAll('img'), function (i) { i.alt = ''; });
        r.track.appendChild(k);
      });
      r.copies++;
    }
    return one;
  }

  function rate(r) { return r.focused ? 0 : (r.over ? HOVER_K : 1); }
  function setRate(r) {
    if (!r.anim) return;
    var k = rate(r);
    if (k === 0) { r.anim.pause(); return; }
    if (r.visible && !document.hidden && r.anim.playState !== 'running') r.anim.play();
    if (r.anim.updatePlaybackRate) r.anim.updatePlaybackRate(k); else r.anim.playbackRate = k;
  }
  function sync(r) {
    if (!r.anim) return;
    if (!r.visible || document.hidden || r.focused) r.anim.pause();
    else setRate(r);
  }

  function start(r) {
    var one = fill(r);
    if (!one) return;
    /* keep the current position when the layout changes (resize) */
    var phase = 0;
    if (r.anim && r.anim.effect) {
      var d = r.anim.effect.getTiming().duration;
      phase = ((r.anim.currentTime || 0) % d) / d;
      r.anim.cancel();
    }
    var dur = one / speed() * 1000;
    r.setW = one;
    r.anim = r.track.animate(
      [{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(' + (-one) + 'px,0,0)' }],
      { duration: dur, iterations: Infinity, easing: 'linear', direction: r.dir < 0 ? 'reverse' : 'normal' }
    );
    r.anim.currentTime = phase * dur;
    r.anim.playbackRate = rate(r) || 1;
    sync(r);
  }

  rows.forEach(function (r) {
    if (fine) {
      r.el.addEventListener('mouseenter', function () { r.over = true; setRate(r); });
      r.el.addEventListener('mouseleave', function () { r.over = false; setRate(r); });
    }
    r.el.addEventListener('focusin', function () { r.focused = r.el.matches(':focus-visible'); sync(r); });
    r.el.addEventListener('focusout', function () { r.focused = false; sync(r); });
    start(r);
  });

  var rt = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { rows.forEach(start); }, 150);
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        rows.forEach(function (r) { if (r.el === en.target) { r.visible = en.isIntersecting; sync(r); } });
      });
    }, { threshold: 0, rootMargin: '100px 0px' });
    rows.forEach(function (r) { io.observe(r.el); });
  } else {
    rows.forEach(function (r) { r.visible = true; sync(r); });
  }
  document.addEventListener('visibilitychange', function () { rows.forEach(sync); });
})();
