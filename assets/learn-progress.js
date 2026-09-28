/*
  Course progress tracking.

  Storage sits behind a single adapter on purpose. Today it's localStorage, no account, nothing
  leaves the browser, which is what the privacy page promises. If accounts are added later, replace
  ONLY the `store` object with a server-backed one (same four methods) and every call site below
  keeps working unchanged.

  localStorage throws outright in some privacy modes, so every access is wrapped.

  DRAFT ADDITION (short-course bridge): completing every lesson of the /learn-basics/ short course
  sets a `shortCourseComplete` flag. Full-course lessons that have a short-course equivalent then
  offer an optional, dismissible skip. Nothing is ever skipped automatically.
*/
(function () {
  'use strict';

  var KEY = 'siau.learn.completed.v1';
  var FLAG = 'shortCourseComplete';
  var DISMISS_KEY = 'siau.learn.skipbanner.dismissed.v1';

  /* --------------------------------------------------------------- bridge map
     Short-course slug -> full-course slug. The short course's own orientation and recap
     lessons have no full-course equivalent and are deliberately absent.
  */
  var BRIDGE = {
    'the-cost-of-not-knowing':            'the-cost-of-financial-illiteracy',
    'finance-is-simpler-than-it-looks':   'finance-is-simpler-than-they-want-you-to-think',
    'what-retirement-actually-means':     'what-retirement-actually-means',
    'every-purchase-is-traded-time':      'every-purchase-is-traded-time',
    'lifestyle-inflation':                'lifestyle-inflation-and-the-always-saving-default',
    'compounding':                        'compounding-why-your-brain-cant-feel-it',
    'etfs-why-boring-beats-clever':       'etfs-why-boring-beats-clever',
    'diversification':                    'diversification-without-gambling',
    'time-in-the-market':                 'time-in-the-market-not-timing-it',
    'savings-rate-vs-return-rate':        'savings-rate-vs-return-rate',
    'the-emergency-fund':                 'the-emergency-fund',
    'your-fire-number':                   'your-fire-number-for-real-this-time'
  };

  // Full-course slugs that have a short-course equivalent, as a lookup.
  var FULL_WITH_EQUIVALENT = {};
  Object.keys(BRIDGE).forEach(function (k) { FULL_WITH_EQUIVALENT[BRIDGE[k]] = k; });

  var store = {
    read: function () {
      try {
        var raw = window.localStorage.getItem(KEY);
        if (!raw) return {};
        var parsed = JSON.parse(raw);
        return (parsed && typeof parsed === 'object') ? parsed : {};
      } catch (e) { return {}; }
    },
    write: function (obj) {
      try { window.localStorage.setItem(KEY, JSON.stringify(obj)); return true; }
      catch (e) { return false; }
    },
    clear: function () {
      try { window.localStorage.removeItem(KEY); return true; }
      catch (e) { return false; }
    },
    available: function () {
      try {
        var k = '__siau_probe__';
        window.localStorage.setItem(k, '1');
        window.localStorage.removeItem(k);
        return true;
      } catch (e) { return false; }
    }
  };

  var completed = store.read();

  /* Five slugs exist in BOTH courses (the-emergency-fund, etfs-why-boring-beats-clever,
     savings-rate-vs-return-rate, what-retirement-actually-means, every-purchase-is-traded-time).
     Without a namespace, completing the short-course version would silently mark the full-course
     lesson done, corrupting both progress bars and suppressing the skip banner on exactly the
     lessons it is meant to appear on. Short-course keys are therefore prefixed. Full-course keys
     keep their bare slug so existing progress is untouched. */
  var NS = 'basics:';
  function key(slug) { return onShortCourse() ? NS + slug : slug; }

  function isDone(slug) { return completed[key(slug)] === true; }
  function setDone(slug, done) {
    if (done) completed[key(slug)] = true; else delete completed[key(slug)];
    store.write(completed);
  }

  /* --------------------------------------------------- which manifest are we on
     The short course ships assets/basics-manifest.js as window.BASICS_MANIFEST.
     The full course ships assets/learn-manifest.js as window.LEARN_MANIFEST.
     A page carries exactly one of them, so the active manifest identifies the course.
  */
  function activeManifest() { return window.BASICS_MANIFEST || window.LEARN_MANIFEST || null; }
  function onShortCourse() { return !!window.BASICS_MANIFEST; }

  function lessonsOf(manifest) {
    if (!manifest || !manifest.modules) return [];
    var out = [];
    manifest.modules.forEach(function (mod) {
      if (mod.planned) return;
      mod.lessons.forEach(function (l) { if (l.access === 'free') out.push(l.slug); });
    });
    return out;
  }

  // Only free lessons count toward progress; planned/paid lessons aren't reachable content.
  function trackableLessons() { return lessonsOf(activeManifest()); }

  function overallPercent() {
    var all = trackableLessons();
    if (!all.length) return 0;
    var done = all.filter(isDone).length;
    return Math.round((done / all.length) * 100);
  }

  /* ------------------------------------------------------- short-course flag */

  // Recomputed from the short course's own manifest whenever we are on a short-course page.
  // Written into the same store so the full course can read it without loading that manifest.
  function refreshShortCourseFlag() {
    if (!onShortCourse()) return;
    var all = lessonsOf(window.BASICS_MANIFEST);
    if (!all.length) return;
    var allDone = all.every(isDone);
    if (allDone && completed[FLAG] !== true) {
      completed[FLAG] = true;
      store.write(completed);
    } else if (!allDone && completed[FLAG] === true) {
      delete completed[FLAG];
      store.write(completed);
    }
  }

  function shortCourseComplete() { return completed[FLAG] === true; }

  /* ------------------------------------------------------- overview page UI */

  function paintOverview() {
    var manifest = activeManifest();
    if (!manifest) return;

    document.querySelectorAll('.lesson-row[data-lesson]').forEach(function (row) {
      row.classList.toggle('is-done', isDone(row.getAttribute('data-lesson')));
    });

    manifest.modules.forEach(function (mod) {
      var wrap = document.querySelector('[data-module-progress="' + mod.id + '"]');
      if (!wrap || mod.planned) return;
      var slugs = mod.lessons.filter(function (l) { return l.access === 'free'; }).map(function (l) { return l.slug; });
      var done = slugs.filter(isDone).length;
      var pct = slugs.length ? Math.round((done / slugs.length) * 100) : 0;
      var bar = wrap.querySelector('.module-progress-bar span');
      var label = wrap.querySelector('.module-progress-label');
      if (bar) bar.style.width = pct + '%';
      if (label) label.textContent = done + ' of ' + slugs.length;
      wrap.classList.toggle('is-complete', slugs.length > 0 && done === slugs.length);
    });

    var overall = document.querySelector('[data-overall-percent]');
    if (overall) overall.textContent = overallPercent() + '%';
  }

  /* --------------------------------------------------------- lesson page UI */

  function paintLesson() {
    var pct = overallPercent();
    var bar = document.querySelector('[data-course-progress-bar]');
    var text = document.querySelector('[data-course-progress-text]');
    if (bar) bar.style.width = pct + '%';
    if (text) text.textContent = pct + '% complete';

    var btn = document.getElementById('markComplete');
    if (!btn) return;
    var slug = btn.getAttribute('data-lesson');
    var done = isDone(slug);
    btn.textContent = done ? '✓ Completed' : 'Mark as complete';
    btn.classList.toggle('is-done', done);
    btn.setAttribute('aria-pressed', String(done));
  }

  function wireLesson() {
    var btn = document.getElementById('markComplete');
    if (!btn) return;
    if (!store.available()) {
      btn.disabled = true;
      btn.title = 'Progress needs browser storage, which is unavailable here.';
      return;
    }
    btn.addEventListener('click', function () {
      var slug = btn.getAttribute('data-lesson');
      setDone(slug, !isDone(slug));
      refreshShortCourseFlag();
      paintLesson();
    });
  }

  function wireReset() {
    var reset = document.getElementById('resetProgress');
    if (!reset) return;
    reset.addEventListener('click', function () {
      completed = {};
      store.clear();
      paintOverview();
    });
  }

  /* ------------------------------------------------- the short-course bridge */

  function currentLessonSlug() {
    var btn = document.getElementById('markComplete');
    return btn ? btn.getAttribute('data-lesson') : null;
  }

  function nextLessonHref() {
    var a = document.querySelector('a.lesson-nav-link.next');
    return a ? a.getAttribute('href') : null;
  }

  function bannerDismissed(slug) {
    try {
      var raw = window.localStorage.getItem(DISMISS_KEY);
      if (!raw) return false;
      var o = JSON.parse(raw);
      return !!(o && o[slug]);
    } catch (e) { return false; }
  }

  function dismissBanner(slug) {
    try {
      var raw = window.localStorage.getItem(DISMISS_KEY);
      var o = raw ? JSON.parse(raw) : {};
      if (!o || typeof o !== 'object') o = {};
      o[slug] = true;
      window.localStorage.setItem(DISMISS_KEY, JSON.stringify(o));
    } catch (e) { /* dismissal is a convenience, not state worth failing over */ }
  }

  var STYLE_ID = 'siau-skip-banner-style';
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent =
      '.skip-banner{display:flex;align-items:flex-start;gap:12px;background:var(--surface-2,#f4f4f5);' +
      'border:1px solid var(--border,#e4e4e7);border-radius:12px;padding:14px 16px;margin:0 0 20px;font-size:14.5px;line-height:1.5;}' +
      '.skip-banner-text{flex:1;margin:0;}' +
      '.skip-banner-actions{display:flex;align-items:center;gap:8px;flex-shrink:0;}' +
      '.skip-banner button{font:inherit;cursor:pointer;border-radius:8px;}' +
      '.skip-banner .skip-go{padding:6px 12px;border:1px solid var(--border,#e4e4e7);background:var(--surface,#fff);font-weight:600;}' +
      '.skip-banner .skip-go:hover{background:var(--surface-2,#f4f4f5);}' +
      '.skip-banner .skip-dismiss{padding:6px 8px;border:0;background:transparent;opacity:.6;line-height:1;font-size:18px;}' +
      '.skip-banner .skip-dismiss:hover{opacity:1;}' +
      '@media (max-width:560px){.skip-banner{flex-direction:column;}.skip-banner-actions{align-self:stretch;justify-content:space-between;}}';
    document.head.appendChild(s);
  }

  function renderSkipBanner() {
    if (onShortCourse()) return;              // only on the full course
    if (!shortCourseComplete()) return;       // only for readers who finished the short course
    var slug = currentLessonSlug();
    if (!slug) return;                        // not a lesson page
    if (!FULL_WITH_EQUIVALENT[slug]) return;  // no short-course equivalent
    if (isDone(slug)) return;                 // already done, nothing to skip
    if (bannerDismissed(slug)) return;        // reader said no on this lesson

    var host = document.querySelector('article.lesson-article');
    if (!host) return;
    if (host.querySelector('.skip-banner')) return;

    injectStyle();

    var wrap = document.createElement('div');
    wrap.className = 'skip-banner';
    wrap.setAttribute('role', 'note');

    var text = document.createElement('p');
    text.className = 'skip-banner-text';
    text.textContent = 'You covered the basics of this in the short course. Skip ahead, or keep reading for the full version.';

    var actions = document.createElement('div');
    actions.className = 'skip-banner-actions';

    var go = document.createElement('button');
    go.type = 'button';
    go.className = 'skip-go';
    go.textContent = 'Skip ahead';

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'skip-dismiss';
    close.setAttribute('aria-label', 'Dismiss');
    close.textContent = '×';

    go.addEventListener('click', function () {
      setDone(slug, true);          // same completion path as the Mark as complete button
      var href = nextLessonHref();
      if (href) window.location.href = href;
      else paintLesson();
    });

    close.addEventListener('click', function () {
      dismissBanner(slug);
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    });

    actions.appendChild(go);
    actions.appendChild(close);
    wrap.appendChild(text);
    wrap.appendChild(actions);
    host.insertBefore(wrap, host.firstChild);
    return wrap;
  }

  function init() {
    refreshShortCourseFlag();
    paintOverview();
    paintLesson();
    wireLesson();
    wireReset();
    renderSkipBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exposed so a future account-backed version can rehydrate after sign-in.
  window.LearnProgress = {
    isDone: isDone,
    setDone: function (slug, done) { setDone(slug, done); refreshShortCourseFlag(); paintOverview(); paintLesson(); },
    overallPercent: overallPercent,
    reload: function () { completed = store.read(); paintOverview(); paintLesson(); },
    shortCourseComplete: shortCourseComplete,
    bridgeMap: BRIDGE,
    _renderSkipBanner: renderSkipBanner
  };
})();
