/* ============================================================================
   HOME BITES — 3D showcase in pure CSS 3D (the loversswitzerland.com way)
   ----------------------------------------------------------------------------
   No WebGL, no library, no module: every surface is an <i> positioned in 3D
   with transform-style: preserve-3d, so it works from a double-clicked file
   exactly like it works on the server.

     01 kraft bowl   — 40 trapezoid wall strips + rolled rim, food, clear lid,
                       lid skirt, logo sticker
     02 meal tray    — straight ribbed walls + rounded corners, flange, food,
                       sloped clear dome lid, sticker

   The idle float is CSS (@keyframes on .obj__wrap). This script builds the
   faces once, then handles drag / arrows / dots / keyboard, and re-shades the
   round walls as they turn so they read as solid, lit objects.
   ========================================================================== */
(function () {
  'use strict';

  var stage = document.getElementById('stage'), view = document.getElementById('stageView');
  if (!stage || !view) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var RAD = Math.PI / 180;
  var LIGHT = -32 * RAD;               /* key light from the front-left */

  /* ==========================================================================
     FACE BUILDERS — the model is a 0×0 point; every face is centred on it and
     placed with its own transform (y points down, +z towards the viewer)
     ========================================================================== */
  function face(parent, cls, w, h, tf, css) {
    var e = document.createElement('i');
    e.className = 'f ' + cls;
    e.style.width = w + 'px';
    e.style.height = h + 'px';
    e.style.marginLeft = (-w / 2) + 'px';
    e.style.marginTop = (-h / 2) + 'px';
    e.style.transform = tf;
    if (css) for (var k in css) e.style.setProperty(k, css[k]);
    parent.appendChild(e);
    return e;
  }
  /* a horizontal surface at height y (rotateX(90) turns it face-up) */
  function flat(parent, cls, w, h, y, css, x, z) {
    return face(parent, cls, w, h, 'translate3d(' + (x || 0) + 'px,' + y + 'px,' + (z || 0) + 'px) rotateX(90deg)', css);
  }
  function px(n) { return n.toFixed(2) + 'px'; }
  /* url() inside a CSS variable resolves against the stylesheet's folder, so
     the photos are passed as absolute URLs (works over http and file://) */
  function img(path) { return 'url("' + new URL(path, document.baseURI).href + '")'; }

  /* ---------------------------------------------------------------- BOWL */
  function buildBowl(m) {
    var rT = 130, rB = 104, H = 100, N = 40;
    var rM = (rT + rB) / 2, L = Math.hypot(H, rT - rB), phi = Math.atan2(rT - rB, H) / RAD;
    var wT = 2 * Math.PI * rT / N + 1.4, wB = 2 * Math.PI * rB / N + 1.4, ins = (wT - wB) / 2;
    var clip = 'polygon(0 0,100% 0,calc(100% - ' + px(ins) + ') 100%,' + px(ins) + ' 100%)';
    var walls = [];
    flat(m, 'f--shadow', 2 * rB + 120, 2 * rB + 120, H / 2 + 2);
    flat(m, 'f--kraft-deep f--disc', 2 * rB, 2 * rB, H / 2);
    for (var i = 0; i < N; i++) {
      var a = i * 360 / N;
      walls.push({ a: a, el: face(m, 'f--kraft f--wall', wT, L,
        'rotateY(' + a + 'deg) translateZ(' + rM + 'px) rotateX(' + (-phi).toFixed(3) + 'deg)',
        { 'clip-path': clip, '--bx': px(-i * wT) }) });
    }
    /* rolled rim: a darker underside and a light top ring */
    flat(m, 'f--rim-under', 2 * (rT + 7), 2 * (rT + 7), -H / 2 + 5);
    flat(m, 'f--rim', 2 * (rT + 7), 2 * (rT + 7), -H / 2);
    /* food, heaped a little in the middle */
    var food = { '--food': img('assets/textures/bowl-food.webp'), '--fs': (2 * (rT - 9)) + 'px' };
    flat(m, 'f--food f--disc', 2 * (rT - 9), 2 * (rT - 9), -H / 2 + 13, food);
    flat(m, 'f--mound', 180, 180, -H / 2 + 9, food);
    flat(m, 'f--mound', 110, 110, -H / 2 + 6, food);
    /* clear lid: skirt around the rim, flat top, raised step, sticker, sheen */
    var rL = rT + 9, NS = 40, wS = 2 * Math.PI * rL / NS + 1.2;
    for (var s = 0; s < NS; s++) {
      face(m, 'f--skirt', wS, 10, 'translate3d(0,' + (-H / 2 - 3) + 'px,0) rotateY(' + (s * 360 / NS) + 'deg) translateZ(' + rL + 'px)');
    }
    flat(m, 'f--lid f--disc', 2 * rL, 2 * rL, -H / 2 - 8);
    flat(m, 'f--lidstep f--disc', 2 * (rT - 22), 2 * (rT - 22), -H / 2 - 12);
    flat(m, 'f--sticker', 88, 88, -H / 2 - 12.6);
    var sheen = flat(m, 'f--sheen f--disc', 2 * rL, 2 * rL, -H / 2 - 12.8);
    return { walls: walls, sheen: sheen, sheenY: -H / 2 - 12.8 };
  }

  /* ---------------------------------------------------------------- TRAY */
  function buildTray(m) {
    var W = 300, Dp = 192, r = 36, H = 80, NC = 6;
    var walls = [], hw = W / 2, hd = Dp / 2, cx = hw - r, cz = hd - r;
    var rr = function (n) { return { 'border-radius': n + 'px' }; };
    flat(m, 'f--shadow f--rshadow', W + 90, Dp + 80, H / 2 + 2);
    flat(m, 'f--black', W, Dp, H / 2, rr(r));
    /* four straight ribbed walls */
    walls.push({ a: 0,   el: face(m, 'f--rib f--wall', W - 2 * r, H, 'translateZ(' + hd + 'px)') });
    walls.push({ a: 180, el: face(m, 'f--rib f--wall', W - 2 * r, H, 'rotateY(180deg) translateZ(' + hd + 'px)') });
    walls.push({ a: 90,  el: face(m, 'f--rib f--wall', Dp - 2 * r, H, 'rotateY(90deg) translateZ(' + hw + 'px)') });
    walls.push({ a: 270, el: face(m, 'f--rib f--wall', Dp - 2 * r, H, 'rotateY(-90deg) translateZ(' + hw + 'px)') });
    /* rounded corners, NC strips each */
    var corners = [[cx, cz, 0], [cx, -cz, 90], [-cx, -cz, 180], [-cx, cz, 270]];
    var wC = 2 * Math.PI * r / (4 * NC) + 1.2;
    corners.forEach(function (c) {
      for (var k = 0; k < NC; k++) {
        var a = c[2] + (k + 0.5) * 90 / NC, ar = a * RAD;
        var x = c[0] + r * Math.sin(ar), z = c[1] + r * Math.cos(ar);
        walls.push({ a: a, el: face(m, 'f--rib f--wall', wC, H,
          'translate3d(' + px(x) + ',0,' + px(z) + ') rotateY(' + a + 'deg)') });
      }
    });
    /* flange (two rings = thickness) */
    flat(m, 'f--flange2', W + 22, Dp + 22, -H / 2 + 4, rr(r + 11));
    flat(m, 'f--flange', W + 22, Dp + 22, -H / 2, rr(r + 11));
    /* food */
    var food = { '--food': img('assets/textures/tray-food.webp'), '--fs': (W - 12) + 'px ' + (Dp - 12) + 'px' };
    flat(m, 'f--tfood', W - 12, Dp - 12, -H / 2 + 12, Object.assign({ 'border-radius': (r - 6) + 'px' }, food));
    flat(m, 'f--tmound', W - 80, Dp - 70, -H / 2 + 8, Object.assign({ 'border-radius': '40%' }, food));
    /* clear dome lid: skirt ring, four sloped panels, flat top, sticker, sheen */
    var yB = -H / 2 - 3, yT = -H / 2 - 44, yC = (yB + yT) / 2, rise = yB - yT;
    var botW = W + 24, botD = Dp + 24, topW = W - 72, topD = Dp - 58;
    flat(m, 'f--lskirt', botW + 6, botD + 6, yB + 1, rr(r + 14));
    function panel(len, inset, off, rotY) {
      var run = off - (rotY % 180 === 0 ? topD : topW) / 2;
      var L = Math.hypot(run, rise), ang = Math.atan2(run, rise) / RAD;
      var zc = (off + (rotY % 180 === 0 ? topD : topW) / 2) / 2;
      face(m, 'f--panel', len, L,
        'rotateY(' + rotY + 'deg) translate3d(0,' + yC + 'px,' + px(zc) + ') rotateX(' + ang.toFixed(3) + 'deg)',
        { 'clip-path': 'polygon(0 100%,100% 100%,calc(100% - ' + inset + 'px) 0,' + inset + 'px 0)' });
    }
    panel(botW, (botW - topW) / 2, botD / 2, 0);
    panel(botW, (botW - topW) / 2, botD / 2, 180);
    panel(botD, (botD - topD) / 2, botW / 2, 90);
    panel(botD, (botD - topD) / 2, botW / 2, 270);
    flat(m, 'f--ltop', topW, topD, yT, rr(24));
    flat(m, 'f--sticker', 76, 76, yT - 0.6, null, 34, -4);
    var sheen = flat(m, 'f--sheen f--tsheen', topW, topD, yT - 0.8, rr(24));
    return { walls: walls, sheen: sheen, sheenY: yT - 0.8, sheenFlat: true };
  }

  var BUILD = { bowl: buildBowl, tray: buildTray };

  /* ==========================================================================
     STAGE — ported from the Lovers carousel
     ========================================================================== */
  var objs = [].slice.call(view.querySelectorAll('.obj'));
  /* rest pose: y = spin, x = camera tilt (negative looks down onto the lid) */
  var IDLE = [{ y: 24, x: -27 }, { y: -26, x: -25 }];
  var items = objs.map(function (el, i) {
    var model = el.querySelector('.model');
    var built = BUILD[model.getAttribute('data-build')](model);
    return {
      el: el, model: model, walls: built.walls, sheen: built.sheen, sheenY: built.sheenY,
      name: el.getAttribute('data-name'), sub: el.getAttribute('data-sub'), tab: el.getAttribute('data-tab'),
      ry: IDLE[i].y, rx: IDLE[i].x, ty: IDLE[i].y, tx: IDLE[i].x, vy: 0, vx: 0,
      idleY: IDLE[i].y, idleX: IDLE[i].x, lastShade: 999
    };
  });
  var active = 0, dragging = false, px0 = 0, py0 = 0, lastT = 0, raf = null, visible = true;

  ['dragstart', 'selectstart'].forEach(function (t) { stage.addEventListener(t, function (e) { e.preventDefault(); }); });

  /* shade the round walls from the angle each strip now faces */
  function shade(it) {
    if (Math.abs(it.ry - it.lastShade) < 0.6) return;
    it.lastShade = it.ry;
    for (var i = 0; i < it.walls.length; i++) {
      var w = it.walls[i], th = (w.a + it.ry) * RAD, c = Math.cos(th), d;
      if (c < 0) d = 0.5;                                      /* inner side, seen over the rim */
      else d = 0.46 - 0.42 * Math.max(0, Math.cos(th - LIGHT)) + (1 - c) * 0.12;
      w.el.style.setProperty('--d', d.toFixed(3));
    }
  }
  function paint(it) {
    it.model.style.transform = 'rotateX(' + it.rx.toFixed(2) + 'deg) rotateY(' + it.ry.toFixed(2) + 'deg)';
    if (it.sheen) {
      /* the highlight stays put while the lid turns under it */
      it.sheen.style.transform = 'translate3d(0,' + it.sheenY + 'px,0) rotateX(90deg) rotateZ(' + (-it.ry).toFixed(2) + 'deg)';
    }
    shade(it);
  }
  items.forEach(function (it) { paint(it); });

  function clamp(it) {
    if (it.tx < -58) { it.tx = -58; it.vx = 0; }
    if (it.tx > -8) { it.tx = -8; it.vx = 0; }
  }

  function loop() {
    var it = items[active];
    if (!dragging) {
      if (Math.abs(it.vy) > 0.02 || Math.abs(it.vx) > 0.02) {
        it.ty += it.vy; it.tx += it.vx; it.vy *= 0.94; it.vx *= 0.94;
      } else {
        it.vy = it.vx = 0;
        it.ty += (it.idleY - it.ty) * 0.02;
        it.tx += (it.idleX - it.tx) * 0.02;
      }
    }
    clamp(it);
    it.ry += (it.ty - it.ry) * 0.12;
    it.rx += (it.tx - it.rx) * 0.12;
    paint(it);
    /* settled: park the loop (the CSS float keeps it alive) */
    if (!dragging && Math.abs(it.vy) < 0.02 && Math.abs(it.vx) < 0.02 &&
        Math.abs(it.ry - it.idleY) < 0.05 && Math.abs(it.rx - it.idleX) < 0.05) {
      it.ry = it.ty = it.idleY; it.rx = it.tx = it.idleX;
      paint(it); raf = null; return;
    }
    raf = requestAnimationFrame(loop);
  }
  function play() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); }
  function wake() { visible = true; if (!raf && !document.hidden) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  /* ---- drag to rotate ---- */
  function down(e) {
    if (e.button > 0 || e.target.closest('.car-btn')) return;
    dragging = true;
    stage.classList.add('touched'); view.classList.add('dragging');
    px0 = e.clientX; py0 = e.clientY; lastT = performance.now();
    var it = items[active]; it.vy = it.vx = 0;
    wake();
    if (e.pointerType === 'mouse') e.preventDefault();
    try { view.setPointerCapture(e.pointerId); } catch (_) {}
  }
  function move(e) {
    if (!dragging) return;
    var now = performance.now(), dt = Math.max(8, now - lastT);
    var dx = e.clientX - px0, dy = e.clientY - py0;
    px0 = e.clientX; py0 = e.clientY; lastT = now;
    var it = items[active];
    it.ty += dx * 0.42; it.tx -= dy * 0.24;
    it.vy = dx * 0.42 * (16 / dt); it.vx = -dy * 0.24 * (16 / dt);
    clamp(it);
    if (e.cancelable && e.pointerType !== 'touch') e.preventDefault();
  }
  function up(e) {
    if (!dragging) return;
    dragging = false; view.classList.remove('dragging');
    var it = items[active];
    it.vy = Math.max(-9, Math.min(9, it.vy));
    it.vx = Math.max(-5, Math.min(5, it.vx));
    try { view.releasePointerCapture(e.pointerId); } catch (_) {}
  }
  view.addEventListener('pointerdown', down);
  view.addEventListener('pointermove', move);
  view.addEventListener('pointerup', up);
  view.addEventListener('pointercancel', up);

  view.addEventListener('keydown', function (e) {
    var it = items[active];
    if (e.key === 'ArrowLeft') it.ty -= 18;
    else if (e.key === 'ArrowRight') it.ty += 18;
    else if (e.key === 'ArrowUp') it.tx += 8;
    else if (e.key === 'ArrowDown') it.tx -= 8;
    else return;
    e.preventDefault(); stage.classList.add('touched'); clamp(it); wake();
  });

  /* gentle cursor-follow while resting (mouse only, until the first drag) */
  if (finePointer) {
    var touched = false;
    stage.addEventListener('pointerdown', function () { touched = true; });
    window.addEventListener('pointermove', function (e) {
      if (dragging || touched || !visible) return;
      var r = view.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var it = items[active];
      it.ty = it.idleY + ((e.clientX - (r.left + r.width / 2)) / window.innerWidth) * 16;
      it.tx = it.idleX - ((e.clientY - (r.top + r.height / 2)) / window.innerHeight) * 8;
      clamp(it);
      play();
    }, { passive: true });
  }

  /* ---- switching ---- */
  var switching = false;
  function show(i, dir) {
    i = (i + items.length) % items.length;
    if (i === active || switching) return;
    switching = true;
    var out = items[active], inn = items[i];
    /* RTL: "next" sits on the left, so the next item arrives from the left */
    out.el.style.transform = 'translateX(' + (dir * 70) + 'px) scale(.9)';
    out.el.classList.remove('is-active');
    inn.el.style.transition = 'none';
    inn.el.style.transform = 'translateX(' + (-dir * 70) + 'px) scale(.9)';
    inn.el.getBoundingClientRect();
    inn.el.style.transition = '';
    inn.el.classList.add('is-active');
    inn.el.style.transform = '';
    /* each item greets you from a quarter turn away and settles to rest */
    inn.vy = inn.vx = 0;
    inn.ry = inn.idleY - dir * 60; inn.ty = inn.idleY;
    inn.rx = inn.tx = inn.idleX;
    inn.lastShade = 999;
    active = i;
    wake();
    /* the visible label card is gone, so screen readers get the name here */
    view.setAttribute('aria-label', inn.name + ' — ' + inn.sub + '. اسحب أو استعمل الأسهم للتدوير');
    setTimeout(function () { out.el.style.transform = ''; switching = false; }, 520);
  }
  document.getElementById('carNext').addEventListener('click', function () { show(active + 1, 1); });
  document.getElementById('carPrev').addEventListener('click', function () { show(active - 1, -1); });

  /* run only while on screen and the tab is visible */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { visible = en.isIntersecting; visible ? play() : stop(); });
    }, { threshold: 0 }).observe(stage);
  }
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : play(); });
  stage.classList.add('is-built');
})();
