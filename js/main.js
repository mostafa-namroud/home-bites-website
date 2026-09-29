/* ============================================================================
   HOME BITES — page behaviour
   intro stamp · nav · scroll progress · word-split + reveals · parallax ·
   lazy map (the 3D stage lives in stage3d.js)
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var HB = window.HB = window.HB || {};
  HB.reduce = reduce;
  HB.finePointer = finePointer;

  function $(id) { return document.getElementById(id); }
  function session(k, v) {
    try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) {}
    return null;
  }

  /* ---------- toast (shared with cart.js) ---------- */
  var toastEl = $('toast'), toastT = 0;
  HB.toast = function (msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  };

  /* ==========================================================================
     WORD SPLIT — words only. Arabic letters join to each other, so a heading
     is never split below the word, or the script would break apart.
     ========================================================================== */
  [].forEach.call(document.querySelectorAll('[data-split]'), function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (w, i) {
      var o = document.createElement('span'), n = document.createElement('span');
      o.className = 'w'; n.className = 'wi';
      n.style.setProperty('--i', i);
      n.textContent = w;
      o.appendChild(n); el.appendChild(o);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ==========================================================================
     REVEALS — start only after the intro has lifted, so the hero animates in
     front of the visitor rather than behind the loader
     ========================================================================== */
  function startReveals() {
    var els = document.querySelectorAll('[data-reveal],[data-split],.step');
    if (reduce || !('IntersectionObserver' in window)) {
      [].forEach.call(els, function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    [].forEach.call(els, function (e) { io.observe(e); });
    HB.observeReveal = function (el) { io.observe(el); };
  }

  /* ==========================================================================
     INTRO — the seal stamps down, then the paper lifts away. Once per session.
     ========================================================================== */
  var ready = false;
  function setReady() {
    if (ready) return;
    ready = true;
    doc.classList.add('ready');
    startReveals();
    document.dispatchEvent(new CustomEvent('hb:ready'));
  }
  HB.whenReady = function (fn) { ready ? fn() : document.addEventListener('hb:ready', fn, { once: true }); };

  var loader = $('loader');
  if (!loader || doc.classList.contains('no-intro')) {
    if (loader) loader.remove();
    setReady();
  } else {
    session('hb-intro', '1');
    var finished = false;
    var finish = function () {
      if (finished) return;
      finished = true;
      loader.classList.add('out');
      setTimeout(setReady, 180);
      setTimeout(function () { loader.remove(); }, 1100);
    };
    setTimeout(finish, reduce ? 300 : 1550);
    loader.addEventListener('click', finish);
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { finish(); document.removeEventListener('keydown', onKey); }
    });
  }

  /* ==========================================================================
     NAV — solid once scrolled, hides on the way down, returns on the way up
     ========================================================================== */
  var nav = $('nav'), bar = $('progressBar');
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (nav) {
      nav.classList.toggle('scrolled', y > 12);
      var sheetOpen = burger && burger.getAttribute('aria-expanded') === 'true';
      if (!sheetOpen && y > 520 && y > lastY + 4) nav.classList.add('hide');
      else if (y < lastY - 4 || y < 520) nav.classList.remove('hide');
    }
    if (bar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ')';
    }
    lastY = y;
    parallax();
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* current section → nav underline */
  if ('IntersectionObserver' in window) {
    var links = [].slice.call(document.querySelectorAll('.nav__links a'));
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['menu', 'reviews', 'story', 'visit'].forEach(function (id) { var s = $(id); if (s) spy.observe(s); });
  }

  /* mobile sheet */
  var burger = $('burger'), sheet = $('sheet');
  function setSheet(open) {
    if (!burger || !sheet) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
    if (open) {
      sheet.hidden = false;
      requestAnimationFrame(function () { sheet.classList.add('open'); });
      doc.classList.add('lock');
      nav.classList.remove('hide');
    } else {
      sheet.classList.remove('open');
      doc.classList.remove('lock');
      setTimeout(function () { if (!sheet.classList.contains('open')) sheet.hidden = true; }, 400);
    }
  }
  if (burger) burger.addEventListener('click', function () { setSheet(burger.getAttribute('aria-expanded') !== 'true'); });
  if (sheet) sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setSheet(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setSheet(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 1080) setSheet(false); });

  /* ==========================================================================
     PARALLAX — only for elements on screen; off entirely under reduced motion
     ========================================================================== */
  var pxEls = [], pxOn = new Set();
  function collectParallax() {
    if (reduce || !('IntersectionObserver' in window)) return;
    pxEls = [].slice.call(document.querySelectorAll('[data-parallax]'));
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { en.isIntersecting ? pxOn.add(en.target) : pxOn.delete(en.target); });
      parallax();
    }, { rootMargin: '10% 0px' });
    pxEls.forEach(function (e) { io.observe(e); });
  }
  HB.refreshParallax = collectParallax;
  function parallax() {
    if (!pxOn.size) return;
    var vh = window.innerHeight;
    pxOn.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var off = (r.top + r.height / 2 - vh / 2);
      var k = parseFloat(el.getAttribute('data-parallax')) || 0;
      el.style.transform = 'translate3d(0,' + (off * k).toFixed(1) + 'px,0)';
    });
  }

  /* ==========================================================================
     MAP — load Google Maps only when the visitor gets close to it
     ========================================================================== */
  var map = $('mapFrame');
  if (map) {
    var loadMap = function () { if (!map.src) map.src = map.getAttribute('data-src'); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es, o) {
        if (es[0].isIntersecting) { loadMap(); o.disconnect(); }
      }, { rootMargin: '600px 0px' }).observe(map);
    } else loadMap();
  }

  var yr = $('year'); if (yr) yr.textContent = new Date().getFullYear();

  /* deferred scripts all run before DOMContentLoaded, so by then cart.js has
     rendered the menu cards and their photos can join the parallax set */
  document.addEventListener('DOMContentLoaded', function () {
    HB.whenReady(function () { collectParallax(); onScroll(); });
  });
})();
