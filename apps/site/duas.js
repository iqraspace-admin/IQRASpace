/* IqraSpace Duas page — renders the PUBLISHED Dua snapshot served by /api/duas
   (Learning admin -> publish -> get_dua_content). No Dua text lives in this file
   or in duas.html. All data is inserted with textContent, never innerHTML. */
(function () {
  'use strict';
  var app = document.getElementById('dua-app');
  if (!app) return;

  var API = app.getAttribute('data-duas-api') || '/api/duas';
  var CACHE_KEY = 'iqs.duas.snapshot.v1';
  var PREF_KEY = 'iqs.duas.prefs.v1';
  var COUNT_KEY = 'iqs.duas.tasbeeh.v1';

  var stage = document.getElementById('dua-stage');
  var status = document.getElementById('dua-status');
  var crumb = document.getElementById('dua-crumb');
  var viewToggle = document.getElementById('dua-view-toggle');
  var panel = document.getElementById('dua-panel');
  var overlay = document.getElementById('dua-overlay');
  var panelBody = document.getElementById('dua-panel-body');
  var panelCat = document.getElementById('dua-panel-cat');
  var panelPos = document.getElementById('dua-panel-pos');
  var btnPrev = document.getElementById('dua-prev');
  var btnNext = document.getElementById('dua-next');

  var data = null;            // { categories: [...] }
  var view = 'grid';
  var current = { cat: null, dua: null };
  var lastFocus = null;
  var prefs = { translit: 'latin', lang: 'en' };

  // ---------- storage (best effort) ----------
  function load(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  var saved = load(PREF_KEY);
  if (saved && typeof saved === 'object') {
    if (['off', 'latin', 'telugu', 'urdu'].indexOf(saved.translit) > -1) prefs.translit = saved.translit;
    if (['en', 'ur'].indexOf(saved.lang) > -1) prefs.lang = saved.lang;
  }

  // ---------- tasbeeh counter (per browser, localStorage) ----------
  // Mirrors the mobile TasbeehCounterBadge: a dua with a repeat count shows a
  // progress ring (n/target); once full, the next tap resets to 0. A dua without
  // one is a plain tally that counts up without limit. Long-press resets anytime.
  var counts = (function () { var c = load(COUNT_KEY); return c && typeof c === 'object' && !Array.isArray(c) ? c : {}; })();
  function countKey(cat, dua) { return cat.slug + '/' + dua.slug; }
  function setCount(key, n) {
    if (n > 0) counts[key] = n; else delete counts[key];
    save(COUNT_KEY, counts);
  }
  var SVGNS = 'http://www.w3.org/2000/svg';
  var RING_C = 2 * Math.PI * 26;

  function tasbeehCounter(cat, dua) {
    var key = countKey(cat, dua);
    var target = dua.repeat_count > 0 ? Math.floor(dua.repeat_count) : null;
    var n = Math.max(0, Math.floor(Number(counts[key]) || 0));
    if (target && n > target) n = target;

    var btn = el('button', { type: 'button', class: 'tasbeeh-btn' + (target ? '' : ' is-plain') });
    var label = el('span', { class: 'tasbeeh-num' });
    var ring = null;
    if (target) {
      var svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('viewBox', '0 0 60 60'); svg.setAttribute('aria-hidden', 'true');
      var track = document.createElementNS(SVGNS, 'circle');
      ['cx', 'cy'].forEach(function (a) { track.setAttribute(a, '30'); });
      track.setAttribute('r', '26'); track.setAttribute('class', 'tasbeeh-track');
      ring = document.createElementNS(SVGNS, 'circle');
      ['cx', 'cy'].forEach(function (a) { ring.setAttribute(a, '30'); });
      ring.setAttribute('r', '26'); ring.setAttribute('class', 'tasbeeh-arc');
      ring.setAttribute('stroke-dasharray', String(RING_C));
      svg.appendChild(track); svg.appendChild(ring);
      btn.appendChild(svg);
    }
    btn.appendChild(label);
    var tipText = target
      ? 'Tap to count each repeat. When the ring is full, tap again to start over. Press and hold to reset anytime.'
      : 'Tap to count — there is no limit. Press and hold to reset to zero.';
    var tip = el('span', { class: 'tasbeeh-tip', role: 'tooltip', id: 'tasbeeh-tip', text: tipText });
    var help = el('button', { type: 'button', class: 'tasbeeh-help', 'aria-label': 'How the counter works', 'aria-describedby': 'tasbeeh-tip', text: '?' });
    help.addEventListener('click', function () { help.parentNode.classList.toggle('show-tip'); });
    help.addEventListener('blur', function () { help.parentNode.classList.remove('show-tip'); });

    function paint() {
      var done = target && n >= target;
      btn.classList.toggle('is-done', !!done);
      label.textContent = done ? '↻' : (target ? n + '/' + target : String(n));
      btn.setAttribute('aria-label', target
        ? (done ? 'Completed ' + n + ' of ' + target + '. Tap to reset' : 'Count ' + n + ' of ' + target + '. Tap to add one')
        : 'Count ' + n + '. Tap to add one');
      if (ring) ring.setAttribute('stroke-dashoffset', String(RING_C * (1 - Math.min(1, n / target))));
    }
    function doReset() { n = 0; setCount(key, 0); paint(); }
    var pressTimer = null, longFired = false;
    function clearPress() { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } }
    btn.addEventListener('pointerdown', function () {
      longFired = false; clearPress();
      pressTimer = setTimeout(function () { longFired = true; doReset(); if (navigator.vibrate) { try { navigator.vibrate(30); } catch (e) { /* ignore */ } } }, 650);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { btn.addEventListener(ev, clearPress); });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    btn.addEventListener('click', function () {
      if (longFired) { longFired = false; return; }
      if (target && n >= target) { doReset(); return; }
      n += 1; setCount(key, n); paint();
    });
    paint();
    return el('div', { class: 'tasbeeh', role: 'group', 'aria-label': 'Tasbeeh counter' }, [btn, el('span', { class: 'tasbeeh-helpwrap' }, [help, tip])]);
  }

  // ---------- tiny DOM helper ----------
  function el(tag, props, children) {
    var n = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      if (k === 'text') n.textContent = props[k];
      else if (k === 'class') n.className = props[k];
      else if (k === 'on') Object.keys(props.on).forEach(function (e) { n.addEventListener(e, props.on[e]); });
      else n.setAttribute(k, props[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function plural(n) { return n + (n === 1 ? ' dua' : ' duas'); }

  // ---------- data ----------
  function sanitize(snap) {
    if (!snap || !Array.isArray(snap.categories)) return null;
    var cats = snap.categories.filter(function (c) { return c && c.slug && Array.isArray(c.duas) && c.duas.length; });
    return cats.length ? { categories: cats, version: snap.version } : null;
  }
  function findCat(slug) { return data && data.categories.filter(function (c) { return c.slug === slug; })[0] || null; }
  function findDua(cat, slug) { return cat && cat.duas.filter(function (d) { return d.slug === slug; })[0] || null; }
  function hasAny(field) {
    return data.categories.some(function (c) { return c.duas.some(function (d) { return d[field] && String(d[field]).trim(); }); });
  }

  function setStatus(msg, isError, retry) {
    status.textContent = msg || '';
    status.classList.toggle('is-error', !!isError);
    if (retry) status.appendChild(el('button', { type: 'button', class: 'btn btn-secondary btn-sm', text: 'Try again', on: { click: init } }));
  }

  function init() {
    setStatus('Loading duas…');
    fetch(API, { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(function (snap) {
        var ok = sanitize(snap);
        if (!ok) throw new Error('empty');
        save(CACHE_KEY, snap);
        start(ok, false);
      })
      .catch(function () {
        // Offline / feed down: fall back to the last published snapshot this browser saw.
        var cached = sanitize(load(CACHE_KEY));
        if (cached) { start(cached, true); return; }
        stage.textContent = '';
        setStatus('The duas could not be loaded right now.', true, true);
      });
  }

  function start(snap, stale) {
    data = snap;
    setStatus(stale ? 'Showing your last saved copy — couldn’t reach the latest duas.' : '');
    viewToggle.hidden = false;
    route();
  }

  // ---------- routing (#category/dua) ----------
  function parseHash() {
    var h = decodeURIComponent((location.hash || '').replace(/^#\/?/, ''));
    var p = h.split('/');
    return { cat: p[0] || null, dua: p[1] || null };
  }
  function go(cat, dua, replace) {
    var h = cat ? '#' + encodeURIComponent(cat) + (dua ? '/' + encodeURIComponent(dua) : '') : '#';
    if (replace) history.replaceState(null, '', location.pathname + location.search + (h === '#' ? '' : h));
    else if (location.hash !== h) history.pushState(null, '', location.pathname + location.search + (h === '#' ? '' : h));
    route();
  }
  function route() {
    if (!data) return;
    var r = parseHash();
    var cat = findCat(r.cat);
    var dua = cat && findDua(cat, r.dua);
    current = { cat: cat, dua: dua };
    if (cat) renderCategory(cat); else renderBrowse();
    if (cat && dua) openPanel(cat, dua); else closePanel(true);
  }
  window.addEventListener('popstate', route);
  window.addEventListener('hashchange', route);

  // ---------- browse (categories) ----------
  function renderBrowse() {
    crumb.hidden = true;
    viewToggle.hidden = false;
    var grid = view === 'grid';
    var wrap = el('div', { class: grid ? 'dua-tiles' : 'dua-rows' });
    data.categories.forEach(function (c) {
      var go1 = function () { go(c.slug); window.scrollTo(0, 0); };
      if (grid) {
        wrap.appendChild(el('button', { type: 'button', class: 'dua-tile', on: { click: go1 } }, [
          el('h3', { text: c.name }), el('span', { class: 'count', text: plural(c.duas.length) })]));
      } else {
        wrap.appendChild(el('button', { type: 'button', class: 'dua-row', on: { click: go1 } }, [
          el('span', { text: c.name }), el('span', { class: 'count', text: plural(c.duas.length) })]));
      }
    });
    stage.textContent = '';
    stage.appendChild(wrap);
  }

  // ---------- category (dua list) ----------
  function renderCategory(cat) {
    viewToggle.hidden = true;
    crumb.hidden = false;
    crumb.textContent = '';
    crumb.appendChild(el('button', { type: 'button', text: '← All categories', on: { click: function () { go(null); } } }));
    crumb.appendChild(el('h2', { text: cat.name }));
    stage.textContent = '';
    if (cat.description) stage.appendChild(el('p', { class: 'dua-cat-desc', text: cat.description }));
    var rows = el('div', { class: 'dua-rows' });
    cat.duas.forEach(function (d) {
      var active = current.dua && current.dua.slug === d.slug;
      rows.appendChild(el('button', {
        type: 'button', class: 'dua-row', 'aria-current': active ? 'true' : 'false',
        on: { click: function () { go(cat.slug, d.slug); } },
      }, [el('span', { text: d.title }), d.reference ? el('span', { class: 'src', text: d.reference }) : null]));
    });
    stage.appendChild(rows);
  }

  // ---------- reading panel ----------
  function segmented(label, options, value, onPick) {
    var seg = el('div', { class: 'dua-seg', role: 'group', 'aria-label': label });
    options.forEach(function (o) {
      seg.appendChild(el('button', { type: 'button', text: o[1], 'aria-pressed': String(o[0] === value), on: { click: function () { onPick(o[0]); } } }));
    });
    return seg;
  }
  function has(v) { return v && String(v).trim(); }

  function renderDua(cat, dua) {
    panelBody.textContent = '';
    panelBody.appendChild(el('h2', { id: 'dua-panel-title', text: dua.title }));

    var ref = el('p', { class: 'dua-ref' });
    if (has(dua.reference)) ref.appendChild(document.createTextNode(dua.reference));
    if (dua.repeat_count && dua.repeat_count > 1) ref.appendChild(el('span', { class: 'rep', text: '× ' + dua.repeat_count }));
    if (ref.childNodes.length) panelBody.appendChild(ref);

    if (has(dua.description)) panelBody.appendChild(el('p', { class: 'dua-desc', text: dua.description }));

    panelBody.appendChild(el('p', { class: 'dua-arabic', dir: 'rtl', lang: 'ar', text: dua.arabic }));

    var tField = { latin: 'transliteration_latin', telugu: 'transliteration_telugu', urdu: 'transliteration_urdu' }[prefs.translit];
    var tLang = { latin: 'en', telugu: 'te', urdu: 'ur' }[prefs.translit];
    if (tField && has(dua[tField])) {
      panelBody.appendChild(el('section', { class: 'dua-sec' }, [
        el('h3', { text: 'Transliteration' }),
        el('p', { class: 'dua-translit', lang: tLang, dir: tLang === 'ur' ? 'rtl' : 'ltr', text: dua[tField] })]));
    }

    var wantUr = prefs.lang === 'ur';
    var useUr = wantUr && has(dua.translation_ur);
    var tr = useUr ? dua.translation_ur : dua.translation_en;
    if (has(tr)) {
      var sec = el('section', { class: 'dua-sec' }, [
        el('h3', { text: 'Translation' }),
        el('p', { class: 'dua-trans', lang: useUr ? 'ur' : 'en', dir: useUr ? 'rtl' : 'ltr', text: tr })]);
      if (wantUr && !useUr) sec.appendChild(el('p', { class: 'dua-fallback', text: 'Urdu translation isn’t published for this dua yet — showing English.' }));
      panelBody.appendChild(sec);
    }

    // reading options (only offer what the published data actually contains)
    var opts = el('div', { class: 'dua-opts' });
    var tOpts = [['off', 'Off'], ['latin', 'Latin']];
    if (hasAny('transliteration_telugu')) tOpts.push(['telugu', 'Telugu']);
    if (hasAny('transliteration_urdu')) tOpts.push(['urdu', 'Urdu']);
    opts.appendChild(el('div', { class: 'dua-opt' }, [el('span', { text: 'Transliteration' }),
      segmented('Transliteration', tOpts, prefs.translit, function (v) { prefs.translit = v; save(PREF_KEY, prefs); renderDua(cat, dua); })]));
    if (hasAny('translation_ur')) {
      opts.appendChild(el('div', { class: 'dua-opt' }, [el('span', { text: 'Translation' }),
        segmented('Translation language', [['en', 'English'], ['ur', 'اردو']], prefs.lang, function (v) { prefs.lang = v; save(PREF_KEY, prefs); renderDua(cat, dua); })]));
    }
    panelBody.appendChild(opts);
    panelBody.appendChild(tasbeehCounter(cat, dua));
  }

  function openPanel(cat, dua) {
    var idx = cat.duas.indexOf(dua);
    panelCat.textContent = cat.name;
    panelPos.textContent = 'Dua ' + (idx + 1) + ' of ' + cat.duas.length;
    btnPrev.disabled = idx <= 0;
    btnNext.disabled = idx >= cat.duas.length - 1;
    renderDua(cat, dua);
    panelBody.scrollTop = 0;
    if (panel.hidden) {
      lastFocus = document.activeElement;
      panel.hidden = false; overlay.hidden = false;
      document.body.classList.add('dua-open', 'dua-lock');
      // next frame so the transition runs
      requestAnimationFrame(function () { panel.classList.add('is-open'); overlay.classList.add('is-open'); panel.focus(); });
    }
  }
  function closePanel(silent) {
    if (panel.hidden) return;
    panel.classList.remove('is-open'); overlay.classList.remove('is-open');
    document.body.classList.remove('dua-open', 'dua-lock');
    panel.hidden = true; overlay.hidden = true;
    if (!silent && lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function closeAndRoute() { if (current.cat) go(current.cat.slug); }
  function step(delta) {
    var cat = current.cat; if (!cat || !current.dua) return;
    var n = cat.duas[cat.duas.indexOf(current.dua) + delta];
    if (n) go(cat.slug, n.slug);
  }

  document.getElementById('dua-close').addEventListener('click', closeAndRoute);
  overlay.addEventListener('click', closeAndRoute);
  btnPrev.addEventListener('click', function () { step(-1); });
  btnNext.addEventListener('click', function () { step(1); });
  document.addEventListener('keydown', function (e) {
    if (panel.hidden) return;
    if (e.key === 'Escape') closeAndRoute();
    else if (e.key === 'ArrowLeft' && !e.target.closest('input,select,textarea')) step(1);   // RTL reading order: left = next
    else if (e.key === 'ArrowRight' && !e.target.closest('input,select,textarea')) step(-1);
    else if (e.key === 'Tab') {
      // keep focus inside the panel while it is open on narrow screens (overlay mode)
      if (window.innerWidth >= 1280) return;
      var f = panel.querySelectorAll('button:not([disabled])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // ---------- grid/list toggle ----------
  var vbtns = Array.prototype.slice.call(viewToggle.querySelectorAll('[data-view-btn]'));
  vbtns.forEach(function (b) {
    b.addEventListener('click', function () {
      view = b.getAttribute('data-view-btn');
      vbtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      if (data && !current.cat) renderBrowse();
    });
  });

  init();
})();
