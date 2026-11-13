/* site.js - By Any Other Name redesign pitch. No dependencies. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, w = window;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var main = d.getElementById('main');

  function focusMain() {
    if (!main) return;
    main.setAttribute('tabindex', '-1');
    main.focus({ preventScroll: true });
    main.addEventListener('blur', function once() { main.removeAttribute('tabindex'); main.removeEventListener('blur', once); });
  }

  /* ---------- age gate ---------- */
  var gate = d.querySelector('[data-gate]');
  if (gate) {
    var yes = gate.querySelector('[data-gate-yes]'), no = gate.querySelector('[data-gate-no]'), msg = gate.querySelector('[data-gate-msg]');
    if (root.classList.contains('gate-on') && yes) setTimeout(function () { yes.focus({ preventScroll: true }); }, 60);
    yes && yes.addEventListener('click', function () {
      try { localStorage.setItem('baon-21', '1'); } catch (e) {}
      root.classList.remove('gate-on');
      focusMain();
      kick();
    });
    no && no.addEventListener('click', function () { if (msg) msg.hidden = false; });
  }

  /* ---------- header ---------- */
  var hdr = d.querySelector('[data-hdr]');
  function onScrollHdr() { if (hdr) hdr.classList.toggle('is-scrolled', w.scrollY > 12); }
  onScrollHdr();

  /* ---------- mega menus ---------- */
  var megas = [].slice.call(d.querySelectorAll('[data-mega]'));
  function closeMega(li, keepFocusClosed) {
    var b = li.querySelector('button');
    li.classList.remove('is-open');
    if (keepFocusClosed) li.classList.add('is-closed');
    if (b) b.setAttribute('aria-expanded', 'false');
    if (hdr && !d.querySelector('[data-mega].is-open')) hdr.classList.remove('is-menu');
  }
  megas.forEach(function (li) {
    var b = li.querySelector('button');
    li.addEventListener('mouseenter', function () {
      li.classList.remove('is-closed');
      megas.forEach(function (o) { if (o !== li) closeMega(o, true); });
      if (b) b.setAttribute('aria-expanded', 'true');
      if (hdr) hdr.classList.add('is-menu');
    });
    li.addEventListener('mouseleave', function () { closeMega(li, li.contains(d.activeElement)); });
    b && b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') === 'true' && (li.classList.contains('is-open') || li.matches(':hover'));
      if (open) { closeMega(li, true); return; }
      megas.forEach(function (o) { if (o !== li) closeMega(o, true); });
      li.classList.remove('is-closed'); li.classList.add('is-open'); b.setAttribute('aria-expanded', 'true');
      if (hdr) hdr.classList.add('is-menu');
    });
    li.addEventListener('focusin', function () { if (!li.classList.contains('is-closed') && hdr) hdr.classList.add('is-menu'); });
  });
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    megas.forEach(function (li) {
      if (li.classList.contains('is-open') || li.contains(d.activeElement)) { closeMega(li, true); var b = li.querySelector('button'); if (b) b.focus(); }
    });
    closeDrawer();
  });
  d.addEventListener('click', function (e) { megas.forEach(function (li) { if (!li.contains(e.target)) closeMega(li, li.contains(d.activeElement)); }); });

  /* ---------- drawer ---------- */
  var drawer = d.querySelector('[data-drawer]'), scrim = d.querySelector('[data-scrim]'), opener = d.querySelector('[data-drawer-open]');
  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('is-open'); root.classList.add('drawer-on');
    if (scrim) { scrim.hidden = false; requestAnimationFrame(function () { scrim.classList.add('is-on'); }); }
    if (opener) opener.setAttribute('aria-expanded', 'true');
    var f = drawer.querySelector('a, button'); if (f) setTimeout(function () { f.focus(); }, 80);
  }
  function closeDrawer() {
    if (!drawer || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open'); root.classList.remove('drawer-on');
    if (scrim) { scrim.classList.remove('is-on'); setTimeout(function () { scrim.hidden = true; }, 400); }
    if (opener) { opener.setAttribute('aria-expanded', 'false'); opener.focus(); }
  }
  opener && opener.addEventListener('click', openDrawer);
  scrim && scrim.addEventListener('click', closeDrawer);
  var closer = d.querySelector('[data-drawer-close]'); closer && closer.addEventListener('click', closeDrawer);
  w.matchMedia('(min-width: 1024px)').addEventListener('change', function (m) { if (m.matches) closeDrawer(); });

  /* ---------- reveals ---------- */
  var revealEls = [].slice.call(d.querySelectorAll('[data-reveal], [data-split]'));
  function show(el) {
    if (el.classList.contains('is-in')) return;
    el.classList.add('is-in');
    if (el.getAttribute('data-reveal') === 'mask') {
      var done = function () { el.classList.add('is-done'); };
      el.addEventListener('transitionend', function te(ev) { if (ev.propertyName === 'clip-path') { done(); el.removeEventListener('transitionend', te); } });
      setTimeout(done, 2200);
    }
  }
  var io = null;
  function kick() {
    if (reduce || !('IntersectionObserver' in w)) { revealEls.forEach(show); return; }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -7% 0px', threshold: 0 });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }
  if (!root.classList.contains('gate-on')) kick();
  else revealEls.forEach(function (el) { if (el.closest('.ftr')) show(el); });
  // fail-safe: anything already on screen is shown after 2.5 s even if an observer never fired
  setTimeout(function () {
    if (root.classList.contains('gate-on')) return;
    revealEls.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < w.innerHeight && r.bottom > 0) show(el); });
  }, 2500);
  if (/[?&]reveal=all/.test(location.search)) revealEls.forEach(show);

  /* ---------- scrubbed statements, parallax ---------- */
  var scrubs = [].slice.call(d.querySelectorAll('[data-scrub]'));
  scrubs.forEach(function (el) { el.style.setProperty('--n', el.querySelectorAll('.w__i').length || 10); });
  var px = [].slice.call(d.querySelectorAll('[data-parallax]'));
  var wide = w.matchMedia('(min-width: 768px)');
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = w.innerHeight;
    onScrollHdr();
    scrubs.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var p = (vh * .95 - r.top) / (vh * .5);
      el.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3));
    });
    if (reduce || !wide.matches) return;
    px.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var k = parseFloat(el.getAttribute('data-parallax')) || 0;
      var c = r.top + r.height / 2 - vh / 2;
      el.style.setProperty('--py', Math.max(-70, Math.min(70, -c * k)).toFixed(1) + 'px');
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  w.addEventListener('scroll', onScroll, { passive: true });
  w.addEventListener('resize', onScroll);
  frame();
  if (/[?&]reveal=all/.test(location.search)) scrubs.forEach(function (el) { el.style.setProperty('--p', 1); });

  /* ---------- hero film: loads after the page, never under reduced motion ---------- */
  var vid = d.querySelector('.hero__video');
  if (vid && !reduce) {
    var startVid = function () {
      var phone = w.matchMedia('(max-width: 767.98px)').matches;
      var src = vid.getAttribute(phone ? 'data-src-phone' : 'data-src');
      if (!src) return;
      vid.src = src;
      vid.addEventListener('playing', function () { vid.classList.add('is-playing'); }, { once: true });
      var p = vid.play(); if (p && p.catch) p.catch(function () {});
      if ('IntersectionObserver' in w) new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) { var q = vid.play(); if (q && q.catch) q.catch(function () {}); } else vid.pause(); });
      }).observe(vid);
    };
    if (d.readyState === 'complete') setTimeout(startVid, 300); else w.addEventListener('load', function () { setTimeout(startVid, 300); });
  }

  /* ---------- open now, computed in New York time from the published hours ---------- */
  var HOURS = {
    pickup: [[10, 22], [10, 22], [10, 22], [10, 22], [10, 22], [10, 24], [10, 24]],
    delivery: [[10, 21], [10, 21], [10, 21], [10, 21], [10, 21], [10, 23], [10, 23]]
  };
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function fmt(h) { if (h === 24 || h === 0) return '12 AM'; if (h === 12) return '12 PM'; return h > 12 ? (h - 12) + ' PM' : h + ' AM'; }
  function nyNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var h = parseInt(o.hour, 10) % 24, m = parseInt(o.minute, 10);
      return { day: DAYS.indexOf(o.weekday), mins: h * 60 + m };
    } catch (e) { var n = new Date(); return { day: n.getDay(), mins: n.getHours() * 60 + n.getMinutes() }; }
  }
  function status(kind) {
    var now = nyNow(), t = HOURS[kind][now.day];
    if (now.mins >= t[0] * 60 && now.mins < t[1] * 60) return { open: true, text: 'Open now, until ' + fmt(t[1]) };
    if (now.mins < t[0] * 60) return { open: false, text: 'Opens today at ' + fmt(t[0]) };
    var nx = HOURS[kind][(now.day + 1) % 7];
    return { open: false, text: 'Closed now, opens ' + fmt(nx[0]) + ' tomorrow' };
  }
  function paintStatus() {
    var now = nyNow();
    [].forEach.call(d.querySelectorAll('[data-open]'), function (el) {
      var kind = el.getAttribute('data-open'), s = status(kind);
      var label = el.classList.contains('pane__status') ? (s.open ? 'Open now' : 'Closed now') : (kind === 'pickup' ? 'Store pickup: ' : 'Delivery: ') + s.text.charAt(0).toLowerCase() + s.text.slice(1);
      el.textContent = label;
      el.classList.toggle('is-open', s.open);
    });
    [].forEach.call(d.querySelectorAll('.hours tr[data-day], .ftr .hours tr'), function (tr) {
      var th = tr.querySelector('th');
      tr.classList.toggle('is-today', !!th && th.textContent.trim() === DAYS[now.day]);
    });
  }
  paintStatus(); setInterval(paintStatus, 60000);

  /* ---------- forms are unwired in the preview: never claim a send ---------- */
  [].forEach.call(d.querySelectorAll('form[data-sr-unwired]'), function (f) {
    var b = f.querySelector('[type="submit"]'); if (b) b.disabled = false;
    f.addEventListener('submit', function (e) { e.preventDefault(); toast('Design preview: this form connects when the new site launches. Nothing was sent.'); });
  });
  var toastEl = d.querySelector('[data-toast]'), tt;
  function toast(t) { if (!toastEl) return; toastEl.textContent = t; toastEl.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('is-on'); }, 4200); }

  /* ---------- pointer light on glass, ink bloom origin on buttons ---------- */
  if (w.matchMedia('(hover: hover)').matches) {
    d.addEventListener('pointermove', function (e) {
      var s = e.target.closest && e.target.closest('[data-spot]');
      if (s) { var r = s.getBoundingClientRect(); s.style.setProperty('--sx', (e.clientX - r.left) + 'px'); s.style.setProperty('--sy', (e.clientY - r.top) + 'px'); }
    }, { passive: true });
    d.addEventListener('pointerover', function (e) {
      var b = e.target.closest && e.target.closest('.btn');
      if (b) { var r = b.getBoundingClientRect(); b.style.setProperty('--mx', (e.clientX - r.left) + 'px'); b.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
    }, { passive: true });
  }

  /* ---------- pause loops off screen ---------- */
  if ('IntersectionObserver' in w) {
    var loopIO = new IntersectionObserver(function (en) { en.forEach(function (x) { x.target.classList.toggle('is-paused', !x.isIntersecting); }); });
    [].forEach.call(d.querySelectorAll('[data-shine], .ftr__marquee, .talks__marquee'), function (el) { loopIO.observe(el); });
  }

  /* ---------- shop chips mark the active category ---------- */
  var m = /dtche%5Bcategory%5D=([^&]+)|dtche\[category\]=([^&]+)/.exec(location.search);
  var cat = m ? decodeURIComponent(m[1] || m[2]) : '';
  [].forEach.call(d.querySelectorAll('.chip[data-cat]'), function (c) { c.classList.toggle('is-on', c.getAttribute('data-cat') === cat); });
})();
