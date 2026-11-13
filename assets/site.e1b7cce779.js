/* site.js - By Any Other Name redesign pitch, revision 2 (effects per docs/EFFECTS-SPEC.md). No dependencies.
   One shared rAF loop drives every scroll-linked piece; progress is smoothed with v += (t - v) * (1 - exp(-dt / tau)).
   CSS defaults are finished states: start states only apply under classes this script sets (dive-run, is-live). */
(function () {
  'use strict';
  var d = document, root = d.documentElement, w = window;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = w.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var main = d.getElementById('main');
  root.classList.add('dive-run', 'letters-on'); root.classList.remove('no-site');
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  function focusMain() {
    if (!main) return;
    main.setAttribute('tabindex', '-1');
    main.focus({ preventScroll: true });
    main.addEventListener('blur', function once() { main.removeAttribute('tabindex'); main.removeEventListener('blur', once); });
  }

  /* ---------- age gate ---------- */
  var gate = d.querySelector('[data-gate]');
  var gateWaiters = [];
  function whenGateClosed(fn) { if (!root.classList.contains('gate-on')) fn(); else gateWaiters.push(fn); }
  if (gate) {
    var yes = gate.querySelector('[data-gate-yes]'), no = gate.querySelector('[data-gate-no]'), msg = gate.querySelector('[data-gate-msg]');
    if (root.classList.contains('gate-on') && yes) setTimeout(function () { yes.focus({ preventScroll: true }); }, 60);
    yes && yes.addEventListener('click', function () {
      store('baon-21', '1');
      gate.classList.add('is-leaving');
      setTimeout(function () { var fns = gateWaiters.splice(0); fns.forEach(function (f) { f(); }); }, reduce ? 0 : 250);
      setTimeout(function () { root.classList.remove('gate-on'); gate.classList.remove('is-leaving'); focusMain(); }, reduce ? 0 : 420);
    });
    no && no.addEventListener('click', function () { if (msg) msg.hidden = false; });
  }

  /* ---------- header, mega menus, drawer ---------- */
  var hdr = d.querySelector('[data-hdr]');
  var megas = [].slice.call(d.querySelectorAll('[data-mega]'));
  function closeMega(li, keep) {
    var b = li.querySelector('button');
    li.classList.remove('is-open');
    if (keep) li.classList.add('is-closed');
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
  d.addEventListener('click', function (e) { megas.forEach(function (li) { if (!li.contains(e.target)) closeMega(li, li.contains(d.activeElement)); }); });

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
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    megas.forEach(function (li) { if (li.classList.contains('is-open') || li.contains(d.activeElement)) { closeMega(li, true); var b = li.querySelector('button'); if (b) b.focus(); } });
    closeDrawer();
  });

  /* ---------- soft-focus letters for titles: split, random order, blur to sharp; the original markup returns ---------- */
  function rnd(i) { var x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }
  function lettersArm(h) {
    var st = h.getAttribute('data-letters');
    if (st === 'wait' || st === 'play' || st === 'done') return;
    var orig = h.innerHTML, text = h.textContent.replace(/\s+/g, ' ').trim();
    var byWord = text.length > 28, n = 0, maxD = 0;
    var vis = d.createElement('span'); vis.className = 'visually-hidden'; vis.textContent = text;
    var wrap = d.createElement('span'); wrap.className = 'fx-wrap'; wrap.setAttribute('aria-hidden', 'true'); wrap.innerHTML = orig;
    (function split(node) {
      [].slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = d.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(part)); return; }
            var wd = d.createElement('span'); wd.className = 'fx-w';
            (byWord ? [part] : part.split('')).forEach(function (u) {
              var s = d.createElement('span'); s.className = 'fx-u'; s.textContent = u; n++;
              var delay = Math.round(rnd(n) * (byWord ? 900 : 650)); if (delay > maxD) maxD = delay;
              s.style.setProperty('--sd', delay + 'ms');
              wd.appendChild(s);
            });
            frag.appendChild(wd);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) split(c);
      });
    })(wrap);
    h.__orig = orig; h.__maxD = maxD;
    h.innerHTML = ''; h.appendChild(vis); h.appendChild(wrap);
    h.setAttribute('data-letters', 'wait');
  }
  function lettersPlay(h) {
    if (h.getAttribute('data-letters') !== 'wait') return;
    h.setAttribute('data-letters', 'play');
    setTimeout(function () { if (h.__orig != null) { h.innerHTML = h.__orig; h.setAttribute('data-letters', 'done'); } }, (h.__maxD || 0) + 1650);
  }
  var titles = [].slice.call(d.querySelectorAll('[data-letters]'));
  if (!reduce) titles.forEach(lettersArm);

  /* ---------- reveals and count-ups share one observer; titles have their own (threshold .5) ---------- */
  var watched = [].slice.call(d.querySelectorAll('[data-reveal], [data-split], [data-count]'));
  // clip-path curtains: Chrome's IntersectionObserver reports a target that its own clip-path hides completely as not
  // intersecting, so curtains are revealed from geometry in the scroll loop instead (getBoundingClientRect ignores clip-path)
  var curtains = [].slice.call(d.querySelectorAll('[data-curtain]'));
  var live = false;
  function settle(el, prop) {
    // a finished reveal steps aside: its end state (transform none, filter none) would otherwise outrank hover transforms
    var done = function () {
      if (el.hasAttribute('data-reveal')) { el.removeAttribute('data-reveal'); el.classList.remove('is-in'); return; }
      el.classList.add('is-done');
    };
    el.addEventListener('transitionend', function te(ev) { if (!prop || ev.propertyName === prop) { done(); el.removeEventListener('transitionend', te); } });
    setTimeout(done, 2600);
  }
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count')) || 0;
    if (reduce || to < 2) { el.textContent = to; return; }
    var t0 = null;
    function step(now) { if (t0 === null) t0 = now; var t = clamp((now - t0) / 1600, 0, 1), e = 1 - Math.pow(1 - t, 3); el.textContent = Math.max(1, Math.round(1 + (to - 1) * e)); if (t < 1) requestAnimationFrame(step); }
    el.textContent = '1'; requestAnimationFrame(step);
  }
  function show(el) {
    if (el.hasAttribute('data-letters')) { lettersPlay(el); return; }
    if (el.hasAttribute('data-count')) { if (!el.__counted) { el.__counted = 1; countUp(el); } return; }
    if (el.classList.contains('is-in')) return;
    el.classList.add('is-in');
    if (el.hasAttribute('data-curtain')) settle(el, 'clip-path');
    else if (el.hasAttribute('data-reveal')) settle(el, 'transform');
  }
  function checkCurtains() {
    if (!live || !curtains.length) return;
    var vh = w.innerHeight, hits = [];
    curtains = curtains.filter(function (el) { var r = el.getBoundingClientRect(); if (r.top < vh * .9 && r.bottom > vh * .05) { hits.push(el); return false; } return true; });
    hits.forEach(show);
  }
  var io = null, tio = null;
  function kick() {
    if (live) return;
    live = true;
    if (reduce || !('IntersectionObserver' in w)) { watched.forEach(show); curtains.forEach(show); curtains = []; return; }
    checkCurtains();
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    watched.forEach(function (el) { io.observe(el); });
    tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { show(en.target); tio.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: .5 });
    titles.forEach(function (el) { tio.observe(el); });
    setTimeout(function () {   // fail-safe: whatever is on screen is shown even if an observer never fired
      var vh = w.innerHeight;
      watched.concat(titles).forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < vh && r.bottom > 0) show(el); });
      checkCurtains();
    }, 2800);
  }
  if (/[?&]reveal=all/.test(location.search)) whenGateClosed(function () { live = true; watched.concat(titles).forEach(show); curtains.forEach(show); curtains = []; });

  /* ---------- the hero: a wordmark dive once per session, then the film recedes as you leave ---------- */
  var hero = d.querySelector('[data-hero]');
  var dive = d.querySelector('[data-dive]');
  var diving = false, diveRaf = 0;
  function openHero() {
    if (hero) { hero.classList.add('is-open'); hero.style.setProperty('--dv-t', '0'); }
    root.classList.add('dive-done');
    if (dive) dive.style.display = 'none';
    kick();
  }
  if (hero && dive && root.classList.contains('dive-on') && !reduce) {
    var FX = .4847, FY = .56, AR = 170 / 1600, STEM = 15 / 1600;
    var setDive = function (s, k, o, z, tint) {
      var W = hero.clientWidth, H = w.innerHeight, w0 = Math.min(W * .84, 1500), ww = w0 * s, hh = ww * AR;
      var cx = W / 2, cy = H * .47;
      var nl = cx - ww / 2, nt = cy - hh / 2, pl = cx - FX * ww, pt = cy - FY * hh;
      dive.style.setProperty('--dw', ww.toFixed(1) + 'px');
      dive.style.setProperty('--dx', (nl + (pl - nl) * k).toFixed(1) + 'px');
      dive.style.setProperty('--dy', (nt + (pt - nt) * k).toFixed(1) + 'px');
      dive.style.setProperty('--do', o.toFixed(3));
      hero.style.setProperty('--dz', z.toFixed(3));
      hero.style.setProperty('--dv-t', tint.toFixed(3));
    };
    setDive(1, 0, 1, 0, 1);
    w.addEventListener('resize', function () { if (!root.classList.contains('dive-done') && !diving) setDive(1, 0, 1, 0, 1); });
    var runDive = function () {
      if (root.classList.contains('dive-done')) return;
      diving = true;
      var W = hero.clientWidth, w0 = Math.min(W * .84, 1500), smax = Math.min((W * 1.3) / (w0 * STEM), 160), T = 1750, t0 = null, opened = false;
      function frame(now) {
        if (root.classList.contains('dive-done')) { diving = false; return; }
        if (t0 === null) t0 = now;
        var t = clamp((now - t0) / T, 0, 1);
        var z = smooth(0, 1, t), S = Math.exp(Math.log(smax) * Math.pow(z, 1.15)), k = smooth(0, .55, z);
        setDive(S, k, 1 - smooth(.7, .96, t), z, 1 - smooth(.35, .8, t));
        if (!opened && t > .66) { opened = true; hero.classList.add('is-open'); }
        if (t < 1) diveRaf = requestAnimationFrame(frame);
        else { diving = false; openHero(); try { sessionStorage.setItem('baon-dive', '1'); } catch (e) {} }
      }
      diveRaf = requestAnimationFrame(frame);
    };
    whenGateClosed(function () { setTimeout(runDive, root.classList.contains('gate-on') ? 0 : 650); });
    hero.addEventListener('focusin', function () {   // keyboard: focus in the hero copy finishes the dive at once
      if (!root.classList.contains('dive-done')) { cancelAnimationFrame(diveRaf); diving = false; openHero(); }
    });
    setTimeout(function () { if (!root.classList.contains('dive-done') && !root.classList.contains('gate-on')) openHero(); }, 7000);
  } else {
    if (dive) dive.style.display = 'none';
    root.classList.add('dive-done');
    if (hero) hero.classList.add('is-open');
    whenGateClosed(kick);
  }

  /* ---------- scroll-linked chapters, one loop ---------- */
  var reel = d.querySelector('[data-reel]'), macro = d.querySelector('[data-macro]');
  var zooms = [].slice.call(d.querySelectorAll('[data-zoom]'));
  var px = [].slice.call(d.querySelectorAll('[data-parallax]'));
  var scrubs = [].slice.call(d.querySelectorAll('[data-scrub]'));
  scrubs.forEach(function (el) { el.style.setProperty('--n', el.querySelectorAll('.w__i').length || 10); });
  var dash = d.querySelector('[data-dash]');
  var pinQuery = w.matchMedia('(min-width: 1024px) and (min-height: 561px) and (prefers-reduced-motion: no-preference)');
  var midUp = w.matchMedia('(min-width: 768px)');
  var S = { hero: 0, reel: 0, macro: 0 }, T = { hero: 0, reel: 0, macro: 0 };
  var raf = 0, last = 0, reelIdx = 0, macroPlayed = false;
  var slides = reel ? [].slice.call(reel.querySelectorAll('[data-slide]')) : [];
  var rows = reel ? [].slice.call(reel.querySelectorAll('[data-go]')) : [];
  var reelHead = reel && reel.querySelector('[data-reel-head]');
  var macroText = macro && macro.querySelector('[data-letters-manual]');
  if (macroText && !reduce) lettersArm(macroText);
  function setLive() {
    var on = pinQuery.matches;
    if (reel) { reel.classList.toggle('is-live', on); reel.__geo = null; }
    if (macro) macro.classList.toggle('is-live', on);
    // not pinned: the macro line plays when it scrolls into view, like any other title
    if (macroText && !on && !macroPlayed) { if (tio) tio.observe(macroText); else titles.push(macroText); }
  }
  setLive();

  function reelGeo() {
    var st = reel.querySelector('.reel__stage'), cs = getComputedStyle(st), card = reel.querySelector('[data-reel-card]');
    var hw = reelHead.offsetWidth, hh = reelHead.offsetHeight;
    var padL = parseFloat(cs.paddingLeft), padT = parseFloat(cs.paddingTop);
    var colW = card ? card.getBoundingClientRect().left - st.getBoundingClientRect().left - padL - 24 : hw * .54;
    return { sx: (st.clientWidth - hw) / 2, sy: (st.clientHeight - hh) / 2, ex: padL, ey: padT, hs: Math.min(.54, Math.max(.3, colW / hw)) };
  }
  function progressOf(sec) {
    var r = sec.getBoundingClientRect(), range = sec.offsetHeight - w.innerHeight;
    return range > 0 ? clamp(-r.top / range, 0, 1) : 0;
  }
  // parallax: cache page offsets so the loop computes from scrollY and never reads layout per element per frame
  var pxCache = [];
  function cachePx() {
    var sy = w.scrollY;
    pxCache = px.map(function (el) { var cur = parseFloat(el.style.getPropertyValue('--py')) || 0, r = el.getBoundingClientRect(); return { el: el, top: r.top + sy - cur, h: r.height, k: parseFloat(el.getAttribute('data-parallax')) || 0 }; });
  }
  cachePx();
  w.addEventListener('load', cachePx);

  function measure() {
    var vh = w.innerHeight;
    if (hero) T.hero = clamp(w.scrollY / (hero.offsetHeight * .9), 0, 1);
    if (reel && reel.classList.contains('is-live')) T.reel = progressOf(reel);
    if (macro && macro.classList.contains('is-live')) T.macro = progressOf(macro);
    if (dash) dash.classList.toggle('is-on', w.scrollY > (hero ? hero.offsetHeight * .55 : 520) && (d.body.scrollHeight - w.scrollY - vh) > 120);
    if (hdr) {
      hdr.classList.toggle('is-scrolled', w.scrollY > 12);
      // the dark hero film is still under the header: it stays pearl (home only)
      if (hero) hdr.classList.toggle('on-film', w.scrollY + hdr.offsetHeight < hero.offsetTop + hero.offsetHeight);
    }
    checkCurtains();
    if (reel && slides.length && !reel.__decoded) {   // decode the packshots ahead so a slit never opens on a blank card
      var rr = reel.getBoundingClientRect();
      if (rr.top < vh + 600) { reel.__decoded = 1; slides.forEach(function (s) { var im = s.querySelector('img'); if (im) { im.loading = 'eager'; if (im.decode) im.decode().catch(function () {}); } }); }
    }
  }
  function setReel(i) {
    if (i === reelIdx) return;
    var prev = reelIdx; reelIdx = i;
    slides.forEach(function (s, k) {
      var on = k === i; s.classList.toggle('is-active', on); s.classList.toggle('is-out', k === prev && !on);
      if (on) s.removeAttribute('tabindex'); else s.setAttribute('tabindex', '-1');
    });
    rows.forEach(function (r, k) { r.classList.toggle('is-active', k === i); if (k === i) r.setAttribute('aria-current', 'true'); else r.removeAttribute('aria-current'); });
    var nEl = reel.querySelector('[data-reel-n]'); if (nEl) nEl.textContent = '0' + (i + 1);
  }
  var DOCK = .18;
  function render() {
    if (hero && !reduce) hero.style.setProperty('--hp', S.hero.toFixed(4));
    if (reel && reel.classList.contains('is-live')) {
      var p = S.reel, dock = smooth(0, DOCK, p);
      if (reelHead) {
        var g = reel.__geo || (reel.__geo = reelGeo());
        reelHead.style.setProperty('--rl-hs', (1 - (1 - g.hs) * dock).toFixed(4));
        reelHead.style.setProperty('--rl-hx', (g.sx + (g.ex - g.sx) * dock).toFixed(1) + 'px');
        reelHead.style.setProperty('--rl-hy', (g.sy + (g.ey - g.sy) * dock).toFixed(1) + 'px');
        reelHead.style.setProperty('--rl-hp', (1 - dock).toFixed(3));
      }
      reel.style.setProperty('--rl-co', smooth(DOCK * .45, DOCK * .95, p).toFixed(3));
      var local = clamp((p - DOCK) / (1 - DOCK - .02), 0, .9999), n = slides.length || 1, pos = local * n;
      var near = pos - Math.floor(pos);
      if (near > .04 && near < .96) setReel(Math.floor(pos));   // hysteresis: never flip on a boundary
      var act = slides[reelIdx]; if (act) act.style.setProperty('--rl-z', clamp(pos - reelIdx, 0, 1).toFixed(3));
      reel.style.setProperty('--rl-rp', local.toFixed(4));
    }
    if (macro && macro.classList.contains('is-live')) {
      var q = S.macro, mm = smooth(.02, .5, q);
      macro.style.setProperty('--mc-t', ((1 - mm) * 17).toFixed(2) + '%');
      macro.style.setProperty('--mc-l', ((1 - mm) * 25).toFixed(2) + '%');
      macro.style.setProperty('--mc-r', ((1 - mm) * 34).toFixed(1) + 'px');
      macro.style.setProperty('--mc-s', (1.18 - .18 * mm).toFixed(4));
      var tIn = smooth(.38, .54, q);
      macro.style.setProperty('--mc-v', tIn.toFixed(3));
      macro.style.setProperty('--mc-o', tIn.toFixed(3));
      macro.style.setProperty('--mc-y', ((1 - tIn) * 24).toFixed(1) + 'px');
      macro.style.setProperty('--mc-p', smooth(.84, 1, q).toFixed(3));
      if (!macroPlayed && q > .42 && macroText) { macroPlayed = true; lettersPlay(macroText); }
    }
  }
  function frameLoop(now) {
    raf = 0;
    var dt = Math.min(50, now - (last || now)); last = now;
    var moving = false;
    ['hero', 'reel', 'macro'].forEach(function (k) {
      var gap = T[k] - S[k];
      if (Math.abs(gap) < .0004) S[k] = T[k];
      else { S[k] += gap * (1 - Math.exp(-dt / 90)); moving = true; }
    });
    render();
    var vh = w.innerHeight, sy = w.scrollY;
    if (!reduce && midUp.matches) {
      pxCache.forEach(function (c) {   // reads come from the cache; writes only
        var top = c.top - sy; if (top + c.h < -200 || top > vh + 200) return;
        c.el.style.setProperty('--py', clamp(-(top + c.h / 2 - vh / 2) * c.k, -80, 80).toFixed(1) + 'px');
      });
      zooms.forEach(function (el) {
        var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
        el.style.setProperty('--zs', (1.1 - .1 * clamp(1 - (r.top + r.height) / (vh + r.height), 0, 1)).toFixed(4));
      });
    }
    scrubs.forEach(function (el) { var r = el.getBoundingClientRect(); el.style.setProperty('--p', clamp((vh * .95 - r.top) / (vh * .5), 0, 1).toFixed(3)); });
    if (moving) raf = requestAnimationFrame(frameLoop);
  }
  function onScroll() { measure(); if (!raf) { last = 0; raf = requestAnimationFrame(frameLoop); } }
  w.addEventListener('scroll', onScroll, { passive: true });
  w.addEventListener('resize', function () { if (reel) reel.__geo = null; cachePx(); onScroll(); });
  pinQuery.addEventListener('change', function () { setLive(); cachePx(); onScroll(); });
  onScroll();
  rows.forEach(function (r) {
    r.addEventListener('click', function () {
      var i = parseInt(r.getAttribute('data-go'), 10) || 0;
      if (!reel.classList.contains('is-live')) { setReel(i); return; }
      var range = reel.offsetHeight - w.innerHeight, n = slides.length;
      w.scrollTo({ top: reel.offsetTop + range * (DOCK + (1 - DOCK - .02) * ((i + .5) / n)), behavior: reduce ? 'auto' : 'smooth' });
    });
  });
  reel && reel.addEventListener('focusin', function (e) {   // keyboard: focus always lands on a visible, matching product
    if (!reel.classList.contains('is-live')) return;
    var row = e.target.closest && e.target.closest('[data-go]');
    var i = row ? (parseInt(row.getAttribute('data-go'), 10) || 0) : reelIdx;
    var range = reel.offsetHeight - w.innerHeight, n = slides.length;
    var target = reel.offsetTop + range * (DOCK + (1 - DOCK - .02) * ((i + .5) / n));
    if (row || S.reel < DOCK) { w.scrollTo({ top: target, behavior: 'instant' }); T.reel = S.reel = progressOf(reel); setReel(i); render(); }
  });

  /* ---------- pointer: reel depth and light (smoothed), card glints; fine pointers only ---------- */
  if (FINE && !reduce) {
    var ptr = { x: 0, y: 0, tx: 0, ty: 0, el: null, raf: 0, last: 0 };
    var card = reel && reel.querySelector('[data-reel-card]');
    var ptrLoop = function (now) {
      ptr.raf = 0;
      var dt = Math.min(50, now - (ptr.last || now)); ptr.last = now;
      var a = 1 - Math.exp(-dt / (ptr.el ? 90 : 300));
      ptr.x += (ptr.tx - ptr.x) * a; ptr.y += (ptr.ty - ptr.y) * a;
      var s = slides[reelIdx];
      if (s) { s.style.setProperty('--pt-x', ptr.x.toFixed(3)); s.style.setProperty('--pt-y', ptr.y.toFixed(3)); s.style.setProperty('--pt-gx', ((ptr.x + 1) * 50).toFixed(1) + '%'); s.style.setProperty('--pt-gy', ((ptr.y + 1) * 50).toFixed(1) + '%'); }
      if (Math.abs(ptr.tx - ptr.x) > .002 || Math.abs(ptr.ty - ptr.y) > .002) ptr.raf = requestAnimationFrame(ptrLoop);
    };
    card && card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      ptr.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1); ptr.ty = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1); ptr.el = card;
      if (!ptr.raf) { ptr.last = 0; ptr.raf = requestAnimationFrame(ptrLoop); }
    }, { passive: true });
    card && card.addEventListener('pointerleave', function () { ptr.tx = 0; ptr.ty = 0; ptr.el = null; if (!ptr.raf) { ptr.last = 0; ptr.raf = requestAnimationFrame(ptrLoop); } });
    d.addEventListener('pointermove', function (e) {
      var t = e.target.closest && e.target.closest('.cat');
      if (t) { var r = t.getBoundingClientRect(); t.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); t.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%'); }
      var sp = e.target.closest && e.target.closest('[data-spot]');
      if (sp) { var sr = sp.getBoundingClientRect(); sp.style.setProperty('--sx', (e.clientX - sr.left) + 'px'); sp.style.setProperty('--sy', (e.clientY - sr.top) + 'px'); }
    }, { passive: true });
  }

  /* ---------- hero film: loads after the page, plays only on screen; never under reduced motion or Save-Data ---------- */
  var vid = d.querySelector('.hero__video');
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  if (vid && !reduce && !saveData) {
    var startVid = function () {
      var phone = w.matchMedia('(max-width: 767.98px)').matches;
      var src = vid.getAttribute(phone ? 'data-src-phone' : 'data-src');
      if (!src) return;
      vid.src = src;
      vid.addEventListener('playing', function () { vid.classList.add('is-playing'); }, { once: true });
      var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {});
      if ('IntersectionObserver' in w) new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) { var q = vid.play(); if (q && q.catch) q.catch(function () {}); } else vid.pause(); });
      }).observe(vid);
    };
    if (d.readyState === 'complete') setTimeout(startVid, 150); else w.addEventListener('load', function () { setTimeout(startVid, 150); });
  }

  /* ---------- open now, in New York time, from the published hours ---------- */
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
      return { day: DAYS.indexOf(o.weekday), mins: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (e) { var n = new Date(); return { day: n.getDay(), mins: n.getHours() * 60 + n.getMinutes() }; }
  }
  function status(kind) {
    var now = nyNow(), t = HOURS[kind][now.day];
    if (now.mins >= t[0] * 60 && now.mins < t[1] * 60) return { open: true, text: 'Open now, until ' + fmt(t[1]) };
    if (now.mins < t[0] * 60) return { open: false, text: 'Opens today at ' + fmt(t[0]) };
    return { open: false, text: 'Closed now, opens ' + fmt(HOURS[kind][(now.day + 1) % 7][0]) + ' tomorrow' };
  }
  function paintStatus() {
    var now = nyNow();
    [].forEach.call(d.querySelectorAll('[data-open]'), function (el) {
      var kind = el.getAttribute('data-open'), s = status(kind);
      el.textContent = el.classList.contains('pane__status') ? (s.open ? 'Open now' : 'Closed now') : (kind === 'pickup' ? 'Store pickup: ' : 'Delivery: ') + s.text.charAt(0).toLowerCase() + s.text.slice(1);
      el.classList.toggle('is-open', s.open);
    });
    [].forEach.call(d.querySelectorAll('.hours tr'), function (tr) { var th = tr.querySelector('th'); tr.classList.toggle('is-today', !!th && th.textContent.trim() === DAYS[now.day]); });
  }
  paintStatus(); setInterval(paintStatus, 60000);

  /* ---------- forms are unwired in the preview: never claim a send ---------- */
  var toastEl = d.querySelector('[data-toast]'), tt;
  function toast(t) { if (!toastEl) return; toastEl.textContent = t; toastEl.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('is-on'); }, 4200); }
  [].forEach.call(d.querySelectorAll('form[data-sr-unwired]'), function (f) {
    var b = f.querySelector('[type="submit"]'); if (b) b.disabled = false;
    f.addEventListener('submit', function (e) { e.preventDefault(); toast('Design preview: this form connects when the new site launches. Nothing was sent.'); });
  });
  d.addEventListener('focusin', function (e) { if (e.target.matches && e.target.matches('input, textarea, select')) root.classList.add('typing'); });
  d.addEventListener('focusout', function (e) { if (e.target.matches && e.target.matches('input, textarea, select')) root.classList.remove('typing'); });

  /* ---------- marquees: a remembered pause, and loops pause off screen ---------- */
  [].forEach.call(d.querySelectorAll('[data-marquee-toggle]'), function (b) {
    var box = b.closest('.bmq');
    function set(paused) { box.classList.toggle('is-paused', paused); b.setAttribute('aria-pressed', paused ? 'true' : 'false'); }
    set(store('baon-marquee') === 'paused');
    b.addEventListener('click', function () { var p = !box.classList.contains('is-paused'); set(p); store('baon-marquee', p ? 'paused' : 'running'); });
  });
  if ('IntersectionObserver' in w) {
    var loopIO = new IntersectionObserver(function (en) { en.forEach(function (x) { x.target.classList.toggle('is-off', !x.isIntersecting); }); });
    [].forEach.call(d.querySelectorAll('[data-shine], .ftr__marquee, .talks__marquee, .bmq'), function (el) { loopIO.observe(el); });
  }

  /* ---------- shop chips mark the active category ---------- */
  var m = /dtche%5Bcategory%5D=([^&]+)|dtche\[category\]=([^&]+)/.exec(location.search);
  var cat = m ? decodeURIComponent(m[1] || m[2]) : '';
  [].forEach.call(d.querySelectorAll('.chip[data-cat]'), function (c) { c.classList.toggle('is-on', c.getAttribute('data-cat') === cat); });
})();
