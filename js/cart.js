/* ============================================================================
   HOME BITES — menu + cart
   Renders the menu from HB_MENU, runs the tabs, keeps the order in
   localStorage and hands it to WhatsApp as a tidy Arabic message.
   ========================================================================== */
(function () {
  'use strict';

  var MENU = window.HB_MENU || [];
  var CFG = window.HB_CONFIG || { whatsapp: '96171964330', deliveryFee: 1.11 };
  var HB = window.HB || {};
  var reduce = !!HB.reduce;
  var KEY = 'hb-cart-v1';
  var byId = {};
  MENU.forEach(function (d) { byId[d.id] = d; });

  function $(id) { return document.getElementById(id); }
  function money(n) { return '$' + n.toFixed(2); }
  function priceHTML(n) { return '<bdi dir="ltr"><small>$</small>' + n + '</bdi>'; }
  function icon(id) { return '<svg aria-hidden="true"><use href="#' + id + '"/></svg>'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- state ---------- */
  var cart = {};
  try { cart = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { cart = {}; }
  Object.keys(cart).forEach(function (id) { if (!byId[id] || !(cart[id] > 0)) delete cart[id]; });
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function count() { var n = 0; for (var k in cart) n += cart[k]; return n; }
  function subtotal() { var s = 0; for (var k in cart) s += cart[k] * byId[k].price; return s; }

  /* ==========================================================================
     MENU CARDS
     ========================================================================== */
  function mediaHTML(d, size) {
    if (!d.img) {
      return '<div class="dish__media seal"><img src="assets/logo/sticker-512.webp" width="200" height="200" alt="" loading="lazy"></div>';
    }
    return '<div class="dish__media' + (d.cut ? ' cut' : '') + '">' +
      '<img src="assets/menu/' + d.img + '-800.webp" srcset="assets/menu/' + d.img + '-480.webp 480w, assets/menu/' + d.img + '-800.webp 800w" ' +
      'sizes="(max-width: 620px) 92vw, (max-width: 1080px) 46vw, 380px" width="800" height="450" alt="' + esc(d.name + ' ' + d.serves) + '" loading="lazy" decoding="async">' +
      '</div>';
  }
  function controlHTML(d) {
    var q = cart[d.id] || 0;
    if (!q) return '<button class="add" type="button" data-add="' + d.id + '" aria-label="أضف ' + esc(d.name + ' ' + d.serves) + ' للطلب">' + icon('i-plus') + 'أضف</button>';
    return '<div class="stepper" role="group" aria-label="الكمية">' +
      '<button type="button" data-inc="' + d.id + '" aria-label="زيادة">' + icon('i-plus') + '</button>' +
      '<output aria-live="polite">' + q + '</output>' +
      '<button type="button" data-dec="' + d.id + '" aria-label="إنقاص">' + icon('i-minus') + '</button></div>';
  }
  function cardHTML(d, i) {
    return '<article class="dish" data-id="' + d.id + '" style="--d:' + (Math.min(i, 5) * 0.07).toFixed(2) + 's">' +
      mediaHTML(d) +
      (d.best ? '<span class="badge">' + icon('i-heart') + 'الأكثر طلباً</span>' : '') +
      '<div class="dish__body">' +
        '<div class="dish__top"><h3 class="dish__name">' + esc(d.name) + '</h3><span class="serves">' + esc(d.serves) + '</span></div>' +
        (d.note ? '<p class="dish__note">' + icon('i-heart') + esc(d.note) + '</p>' : '') +
        '<div class="dish__foot"><span class="price">' + priceHTML(d.price) + '</span><div class="ctl">' + controlHTML(d) + '</div></div>' +
      '</div></article>';
  }

  var grids = document.querySelectorAll('.grid[data-cat]');
  [].forEach.call(grids, function (g) {
    var cat = g.getAttribute('data-cat');
    g.innerHTML = MENU.filter(function (d) { return d.cat === cat; }).map(cardHTML).join('');
  });

  /* reveal the cards once the intro is done */
  function revealCards() {
    [].forEach.call(document.querySelectorAll('.dish'), function (c) {
      if (HB.observeReveal) HB.observeReveal(c); else c.classList.add('in');
    });
  }
  if (HB.whenReady) HB.whenReady(revealCards); else revealCards();

  /* ==========================================================================
     TABS — sliding indicator, panels slide in from the side you moved towards
     ========================================================================== */
  var tabs = [].slice.call(document.querySelectorAll('.tab'));
  var ind = document.querySelector('.tabs__ind');
  var current = 'mandi';
  function moveInd(tab, instant) {
    if (!ind || !tab) return;
    if (instant) ind.style.transition = 'none';
    ind.style.width = tab.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
    if (instant) { void ind.offsetWidth; ind.style.transition = ''; }
  }
  function setTab(name, focus) {
    var tab = tabs.filter(function (t) { return t.getAttribute('data-tab') === name; })[0];
    if (!tab) return;
    var from = tabs.map(function (t) { return t.getAttribute('data-tab'); }).indexOf(current);
    var to = tabs.indexOf(tab);
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var p = $(t.getAttribute('aria-controls'));
      p.hidden = !on;
      p.classList.toggle('on', on);
      if (on && name !== current) {
        p.style.setProperty('--dir', to > from ? 1 : -1);
        p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter');
        [].forEach.call(p.querySelectorAll('.dish'), function (c) { c.classList.add('in'); });
      }
    });
    current = name;
    moveInd(tab);
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { setTab(t.getAttribute('data-tab')); });
    t.addEventListener('keydown', function (e) {
      /* RTL: the visual "next" tab is to the left */
      var k = e.key, n = null;
      if (k === 'ArrowLeft') n = tabs[(i + 1) % tabs.length];
      if (k === 'ArrowRight') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (n) { e.preventDefault(); setTab(n.getAttribute('data-tab'), true); }
    });
  });
  moveInd(tabs[0], true);
  window.addEventListener('resize', function () { moveInd(tabs.filter(function (t) { return t.classList.contains('on'); })[0], true); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInd(tabs.filter(function (t) { return t.classList.contains('on'); })[0], true); });
  document.addEventListener('hb:tab', function (e) { setTab(e.detail); });

  /* ==========================================================================
     CART
     ========================================================================== */
  var barEl = $('cartBar'), barCount = $('barCount'), barTotal = $('barTotal');
  var navBtn = $('navCart'), navCount = $('navCount');
  var drawer = $('drawer'), lines = $('lines');
  var addr = $('orderAddress'), notes = $('orderNotes'), addrErr = $('addrErr');
  var drawerOpen = false;

  function setQty(id, q, from) {
    var before = cart[id] || 0;
    q = Math.max(0, Math.min(99, q));
    if (q) cart[id] = q; else delete cart[id];
    persist();
    /* card control */
    [].forEach.call(document.querySelectorAll('.dish[data-id="' + id + '"] .ctl'), function (c) {
      var hadStepper = !!c.querySelector('.stepper');
      if (hadStepper && q) c.querySelector('output').textContent = q;
      else c.innerHTML = controlHTML(byId[id]);
    });
    if (q > before) {
      fly(from, id);
      if (!drawerOpen && HB.toast) HB.toast('أضيف للطلب · ' + byId[id].name);
    }
    renderTotals(q > before);
    if (drawerOpen) renderLines();
  }

  function renderTotals(bump) {
    var n = count(), sub = subtotal();
    barCount.textContent = n;
    barTotal.textContent = money(sub);
    navCount.textContent = n;
    navCount.hidden = !n;
    barEl.hidden = !n || drawerOpen;
    $('sumSub').textContent = money(sub);
    $('sumFee').textContent = money(CFG.deliveryFee);
    $('sumTotal').textContent = money(sub + (n ? CFG.deliveryFee : 0));
    drawer.classList.toggle('is-empty', !n);
    if (bump && !reduce) {
      [barEl, navBtn].forEach(function (el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); });
    }
  }

  function lineThumb(d) {
    if (!d.img) return '<span class="line__img seal"><img src="assets/logo/sticker-512.webp" alt=""></span>';
    return '<span class="line__img' + (d.cut ? ' cut' : '') + '"><img src="assets/menu/' + d.img + '-480.webp" alt=""></span>';
  }
  function renderLines() {
    var ids = Object.keys(cart);
    lines.innerHTML = ids.map(function (id) {
      var d = byId[id], q = cart[id];
      return '<li class="line">' + lineThumb(d) +
        '<span class="line__name">' + esc(d.name) + '<small>' + esc(d.serves) + '</small></span>' +
        '<span class="line__right"><span class="line__sum" dir="ltr">' + money(q * d.price) + '</span>' +
        '<span class="stepper stepper--sm" role="group" aria-label="الكمية">' +
          '<button type="button" data-inc="' + id + '" aria-label="زيادة">' + icon('i-plus') + '</button>' +
          '<output>' + q + '</output>' +
          '<button type="button" data-dec="' + id + '" aria-label="إنقاص">' + icon('i-minus') + '</button>' +
        '</span></span></li>';
    }).join('');
  }

  /* one listener for every +, − and add button on the page */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add],[data-inc],[data-dec]');
    if (!b) return;
    var id = b.getAttribute('data-add') || b.getAttribute('data-inc') || b.getAttribute('data-dec');
    if (!byId[id]) return;
    var q = cart[id] || 0;
    if (b.hasAttribute('data-dec')) setQty(id, q - 1);
    else setQty(id, q + 1, b.closest('.dish'));
  });

  /* ---------- fly the dish photo into the cart ---------- */
  function fly(card, id) {
    if (!card || reduce || !card.animate) return;
    var src = card.querySelector('.dish__media img');
    var target = (!barEl.hidden ? barEl : navBtn);
    if (!src || !target) return;
    var a = src.getBoundingClientRect(), t = target.getBoundingClientRect();
    if (!a.width) return;
    var f = document.createElement('img');
    f.src = src.currentSrc || src.src; f.className = 'flyer'; f.alt = '';
    var w = Math.min(160, a.width * 0.5), h = w * 0.66;
    f.style.cssText = 'width:' + w + 'px;height:' + h + 'px;left:' + (a.left + a.width / 2 - w / 2) + 'px;top:' + (a.top + a.height / 2 - h / 2) + 'px';
    document.body.appendChild(f);
    var dx = (t.left + t.width / 2) - (a.left + a.width / 2), dy = (t.top + t.height / 2) - (a.top + a.height / 2);
    f.animate([
      { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
      { transform: 'translate(' + dx * 0.45 + 'px,' + (dy * 0.45 - 90) + 'px) scale(.7) rotate(-8deg)', opacity: 1, offset: 0.45 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.12) rotate(-14deg)', opacity: 0.2 }
    ], { duration: 820, easing: 'cubic-bezier(.45,0,.2,1)' }).onfinish = function () { f.remove(); };
  }

  /* ---------- drawer ---------- */
  var lastFocus = null;
  function openDrawer() {
    lastFocus = document.activeElement;
    renderLines();
    drawer.hidden = false;
    drawerOpen = true;
    requestAnimationFrame(function () { drawer.classList.add('open'); });
    document.documentElement.classList.add('lock');
    renderTotals();
    setTimeout(function () { drawer.querySelector('.drawer__head .icon-btn').focus(); }, 60);
  }
  function closeDrawer() {
    if (!drawerOpen) return;
    drawer.classList.remove('open');
    drawerOpen = false;
    document.documentElement.classList.remove('lock');
    renderTotals();
    setTimeout(function () { if (!drawerOpen) drawer.hidden = true; }, 550);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  barEl.addEventListener('click', openDrawer);
  navBtn.addEventListener('click', openDrawer);
  drawer.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeDrawer(); });
  document.addEventListener('keydown', function (e) {
    if (!drawerOpen) return;
    if (e.key === 'Escape') closeDrawer();
    if (e.key === 'Tab') {   /* keep focus inside the dialog */
      var f = [].filter.call(drawer.querySelectorAll('button,textarea,a[href]'), function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $('clearCart').addEventListener('click', function () {
    cart = {}; persist();
    [].forEach.call(document.querySelectorAll('.dish'), function (c) { c.querySelector('.ctl').innerHTML = controlHTML(byId[c.getAttribute('data-id')]); });
    renderLines(); renderTotals();
  });

  /* keep what the visitor typed if they close and reopen the drawer */
  try {
    addr.value = sessionStorage.getItem('hb-addr') || '';
    notes.value = sessionStorage.getItem('hb-notes') || '';
  } catch (e) {}
  addr.addEventListener('input', function () {
    addr.classList.remove('bad'); addrErr.hidden = true;
    try { sessionStorage.setItem('hb-addr', addr.value); } catch (e) {}
  });
  notes.addEventListener('input', function () { try { sessionStorage.setItem('hb-notes', notes.value); } catch (e) {} });

  /* ---------- WhatsApp ---------- */
  function orderMessage() {
    var sub = subtotal(), fee = CFG.deliveryFee;
    var out = ['مرحبا بيت سيرين 🤎', 'بدي أطلب:', ''];
    Object.keys(cart).forEach(function (id) {
      var d = byId[id], q = cart[id];
      out.push('• ' + q + ' × ' + d.name + ' (' + d.serves + ') — ' + money(q * d.price));
    });
    out.push('', 'المجموع: ' + money(sub), 'التوصيل: ' + money(fee), 'الإجمالي: ' + money(sub + fee), '');
    out.push('📍 العنوان: ' + addr.value.trim());
    if (notes.value.trim()) out.push('📝 ملاحظات: ' + notes.value.trim());
    return out.join('\n');
  }
  HB.orderLink = function () { return 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(orderMessage()); };
  $('sendOrder').addEventListener('click', function () {
    if (!count()) return;
    if (!addr.value.trim()) {
      addr.classList.remove('bad'); void addr.offsetWidth; addr.classList.add('bad');
      addrErr.hidden = false;
      addr.focus();
      return;
    }
    window.open(HB.orderLink(), '_blank', 'noopener');
  });

  renderTotals();
})();
