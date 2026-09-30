/* ============================================================================
   HOME BITES — 3D showcase in pure CSS 3D (the loversswitzerland.com way)
   ----------------------------------------------------------------------------
   No WebGL, no library, no module: every surface is an <i> positioned in 3D
   with transform-style: preserve-3d, so it works from a double-clicked file
   exactly like it works on the server.

     01 kraft bowl   — 28 leaning wall strips + rolled rim, food, clear lid,
                       logo sticker; built as three stacked scenes (see
                       buildBowl) so it stays cheap to draw
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
  /* Why three scenes: each time the page repaints, the browser depth-sorts
     every piece of a 3D scene and CUTS any piece that crosses the plane of
     another. The 32 round wall strips face 32 directions, so in one scene
     their planes would slice the food, rim and lid into hundreds of fragments
     every frame. Split into shadow / walls / top scenes (painted in that
     order), nothing ever crosses: the strips form a closed ring, and the top
     pieces are all flat and parallel. Same look, a fraction of the work. */
  function buildBowl(p) {
    var rT = 130, rB = 104, H = 100, N = 28;
    var rM = (rT + rB) / 2, L = Math.hypot(H, rT - rB), phi = Math.atan2(rT - rB, H) / RAD;
    /* Plain rectangles as wide as the TOP of each facet — deliberately no
       clip-path. A clip-path on a 3D (GPU) layer is drawn through its own mask
       pass every frame; 32 of them were what made this bowl lag while the tray
       (no clipped walls) stayed smooth. The strips still lean in for the taper;
       neighbours just overlap ~3px at the bottom, same colour, invisible. */
    var wT = 2 * Math.PI * rT / N + 1.4;
    var walls = [];
    /* scene 1 — floor shadow (the base disc is never visible from above, so
       it is not drawn at all) */
    flat(p.shadow, 'f--shadow', 2 * rB + 120, 2 * rB + 120, H / 2 + 2);
    /* scene 2 — the kraft wall */
    for (var i = 0; i < N; i++) {
      var a = i * 360 / N;
      walls.push({ a: a, el: face(p.walls, 'f--kraft f--wall', wT, L,
        'rotateY(' + a + 'deg) translateZ(' + rM + 'px) rotateX(' + (-phi).toFixed(3) + 'deg)',
        { '--bx': px(-i * wT) }) });
    }
    /* scene 3 — everything flat on top, painted over the wall:
       rolled rim (dark outer lip + light ring), food just under the rim so the
       rim hides its edge, then the clear lid (two edge rings for thickness,
       flat top, raised step), sticker and sheen */
    var t = p.top, rL = rT + 9;
    flat(t, 'f--rim-under', 2 * (rT + 7), 2 * (rT + 7), -H / 2 + 5);
    flat(t, 'f--food f--disc', 2 * (rT - 9), 2 * (rT - 9), -H / 2 + 4, { '--food': img('assets/textures/bowl-food.webp') });
    flat(t, 'f--rim', 2 * (rT + 7), 2 * (rT + 7), -H / 2 - 0.6);
    flat(t, 'f--lidring', 2 * rL, 2 * rL, -H / 2 - 2);
    flat(t, 'f--lidring', 2 * rL, 2 * rL, -H / 2 - 5.5);
    flat(t, 'f--lid f--disc', 2 * rL, 2 * rL, -H / 2 - 8);
    flat(t, 'f--lidstep f--disc', 2 * (rT - 22), 2 * (rT - 22), -H / 2 - 12);
    flat(t, 'f--sticker', 88, 88, -H / 2 - 12.6);
    var sheen = flat(t, 'f--sheen f--disc', 2 * rL, 2 * rL, -H / 2 - 12.8);
    return { walls: walls, sheen: sheen, sheenY: -H / 2 - 12.8 };
  }

  /* ---------------------------------------------------------------- TRAY */
  /* one scene: its straight walls barely cross its flat parts, so it is
     already cheap to sort */
  function buildTray(p) {
    var m = p.main;
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
    var food = { '--food': img('assets/textures/tray-food.webp') };
    flat(m, 'f--tfood', W - 12, Dp - 12, -H / 2 + 12, Object.assign({ 'border-radius': (r - 6) + 'px' }, food));
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
    var models = [].slice.call(el.querySelectorAll('.model')), parts = {};
    models.forEach(function (md) { parts[md.getAttribute('data-part')] = md; });
    var built = BUILD[el.getAttribute('data-build')](parts);
    return {
      el: el, models: models, walls: built.walls, sheen: built.sheen, sheenY: built.sheenY,
      name: el.getAttribute('data-name'), sub: el.getAttribute('data-sub'), tab: el.getAttribute('data-tab'),
      ry: IDLE[i].y, rx: IDLE[i].x, ty: IDLE[i].y, tx: IDLE[i].x, vy: 0, vx: 0,
      idleY: IDLE[i].y, idleX: IDLE[i].x, lastShade: 999
    };
  });
  var active = 0, dragging = false, px0 = 0, py0 = 0, lastT = 0, raf = null, visible = true;

  ['dragstart', 'selectstart'].forEach(function (t) { stage.addEventListener(t, function (e) { e.preventDefault(); }); });

  /* shade the round walls from the angle each strip now faces */
  function shade(it) {
    /* each re-shade repaints the wall strips, so only do it every 4° of turn */
    if (Math.abs(it.ry - it.lastShade) < 4) return;
    it.lastShade = it.ry;
    for (var i = 0; i < it.walls.length; i++) {
      var w = it.walls[i], th = (w.a + it.ry) * RAD, c = Math.cos(th), d;
      if (c < 0) d = 0.5;                                      /* inner side, seen over the rim */
      else d = 0.46 - 0.42 * Math.max(0, Math.cos(th - LIGHT)) + (1 - c) * 0.12;
      w.el.style.setProperty('--d', d.toFixed(3));
    }
  }
  function paint(it) {
    /* every scene of the object turns together */
    var tf = 'rotateX(' + it.rx.toFixed(2) + 'deg) rotateY(' + it.ry.toFixed(2) + 'deg)';
    for (var m = 0; m < it.models.length; m++) it.models[m].style.transform = tf;
    if (it.sheen) {
      /* the highlight stays put while the lid turns under it */
      it.sheen.style.transform = 'translate3d(0,' + it.sheenY + 'px,0) rotateX(90deg) rotateZ(' + (-it.ry).toFixed(2) + 'deg)';
    }
    shade(it);
  }
  items.forEach(function (it) { paint(it); });

  function clamp(it) {
    if (it.tx < -58) { it.tx = -58; it.vx = 0; }
    /* always look from above the rim (the top scene paints over the wall) */
    if (it.tx > -16) { it.tx = -16; it.vx = 0; }
  }

  /* After the visitor turns a box it stays exactly where they left it; it only
     eases back to its rest pose once nobody has touched it for HOLD ms. */
  var HOLD = 5000, lastTouch = -1e9, holdT = 0;
  function touch() { lastTouch = performance.now(); clearTimeout(holdT); }
  function holding() { return performance.now() - lastTouch < HOLD; }

  function loop() {
    var it = items[active];
    if (!dragging) {
      if (Math.abs(it.vy) > 0.02 || Math.abs(it.vx) > 0.02) {
        it.ty += it.vy; it.tx += it.vx; it.vy *= 0.94; it.vx *= 0.94;
      } else {
        it.vy = it.vx = 0;
        if (!holding()) {
          /* take the short way home: drop whole turns first (no visual jump,
             360° later looks identical), so it never unwinds a full spin */
          var turns = Math.round((it.ty - it.idleY) / 360);
          if (turns) { it.ty -= turns * 360; it.ry -= turns * 360; it.lastShade -= turns * 360; }
          it.ty += (it.idleY - it.ty) * 0.02;
          it.tx += (it.idleX - it.tx) * 0.02;
        }
      }
    }
    clamp(it);
    it.ry += (it.ty - it.ry) * 0.12;
    it.rx += (it.tx - it.rx) * 0.12;
    paint(it);
    var still = !dragging && Math.abs(it.vy) < 0.02 && Math.abs(it.vx) < 0.02;
    /* settled at rest: park the loop (the CSS float keeps it alive) */
    if (still && Math.abs(it.ry - it.idleY) < 0.05 && Math.abs(it.rx - it.idleX) < 0.05) {
      it.ry = it.ty = it.idleY; it.rx = it.tx = it.idleX;
      paint(it); raf = null; return;
    }
    /* settled where the visitor left it: park, and wake when the hold ends */
    if (still && holding() && Math.abs(it.ry - it.ty) < 0.05 && Math.abs(it.rx - it.tx) < 0.05) {
      it.ry = it.ty; it.rx = it.tx;
      paint(it); raf = null;
      clearTimeout(holdT);
      holdT = setTimeout(play, HOLD - (performance.now() - lastTouch) + 30);
      return;
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
    touch();
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
    touch();
    if (e.cancelable && e.pointerType !== 'touch') e.preventDefault();
  }
  function up(e) {
    if (!dragging) return;
    dragging = false; view.classList.remove('dragging');
    var it = items[active];
    it.vy = Math.max(-9, Math.min(9, it.vy));
    it.vx = Math.max(-5, Math.min(5, it.vx));
    touch();                     /* the 5 s hold starts when the finger lifts */
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
    e.preventDefault(); stage.classList.add('touched'); clamp(it); touch(); wake();
  });

  /* gentle cursor-follow while resting (mouse only, until the first drag) */
  /* only while the mouse is actually over the stage (it used to listen on the
     whole window, which kept the 3D turning — and working — non-stop) */
  if (finePointer) {
    var touched = false;
    stage.addEventListener('pointerdown', function () { touched = true; });
    view.addEventListener('pointermove', function (e) {
      if (dragging || touched || e.pointerType !== 'mouse') return;
      var r = view.getBoundingClientRect();
      var it = items[active];
      it.ty = it.idleY + ((e.clientX - (r.left + r.width / 2)) / r.width) * 18;
      it.tx = it.idleX - ((e.clientY - (r.top + r.height / 2)) / r.height) * 8;
      clamp(it);
      play();
    }, { passive: true });
    /* leaving (hover mode only): ease back to rest. After a real drag the box
       keeps the pose it was left in until the 5 s hold runs out. */
    view.addEventListener('pointerleave', function (e) {
      if (dragging || touched || e.pointerType !== 'mouse') return;
      var it = items[active];
      it.ty = it.idleY; it.tx = it.idleX;
      play();
    });
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
