/* Click-to-preview for cross-references inside a lesson body. Clicking a link to another
   lesson shows a small popover with that lesson's title and summary, with a real link to go
   there and a way to dismiss and keep reading. Does not touch external links, same-page
   anchors, or links outside .article-body. Self-contained, no-ops if LEARN_MANIFEST is missing. */
(function () {
  if (!window.LEARN_MANIFEST) return;

  var bySlug = {};
  LEARN_MANIFEST.modules.forEach(function (m) {
    m.lessons.forEach(function (l) { bySlug[l.slug] = l; });
  });

  var POP_ID = 'siau-link-preview';
  var styleInjected = false;
  function injectStyle() {
    if (styleInjected) return;
    styleInjected = true;
    var s = document.createElement('style');
    s.textContent =
      '#' + POP_ID + '{position:absolute;z-index:40;max-width:320px;background:var(--surface,#fff);' +
      'border:1px solid var(--border,#e4e4e7);border-radius:12px;box-shadow:var(--shadow,0 8px 24px rgba(0,0,0,.12));' +
      'padding:14px 16px;font-size:13.5px;line-height:1.5;display:none;}' +
      '#' + POP_ID + ' .lp-title{font-weight:700;margin:0 0 6px;color:var(--ink,#111);}' +
      '#' + POP_ID + ' .lp-summary{color:var(--ink-muted,#666);margin:0 0 10px;}' +
      '#' + POP_ID + ' .lp-actions{display:flex;gap:8px;align-items:center;}' +
      '#' + POP_ID + ' .lp-go{font-weight:600;text-decoration:none;color:var(--accent,#1a7f5a);padding:5px 10px;border:1px solid var(--border,#e4e4e7);border-radius:8px;}' +
      '#' + POP_ID + ' .lp-close{margin-left:auto;background:transparent;border:0;opacity:.6;cursor:pointer;font-size:16px;line-height:1;}' +
      '#' + POP_ID + ' .lp-close:hover{opacity:1;}';
    document.head.appendChild(s);
  }

  function getPopover() {
    var el = document.getElementById(POP_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = POP_ID;
    el.innerHTML = '<p class="lp-title"></p><p class="lp-summary"></p>' +
      '<div class="lp-actions"><a class="lp-go" href="#">Go to lesson &rarr;</a><button type="button" class="lp-close" aria-label="Close">&times;</button></div>';
    document.body.appendChild(el);
    el.querySelector('.lp-close').addEventListener('click', function () { el.style.display = 'none'; });
    return el;
  }

  function slugFromHref(href) {
    var m = href.match(/^\.\.\/([a-z0-9-]+)\/?$/i);
    return m ? m[1] : null;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var body = document.querySelector('.article-body');
    if (!body) return;
    var links = body.querySelectorAll('a[href]');
    links.forEach(function (a) {
      var slug = slugFromHref(a.getAttribute('href'));
      var lesson = slug && bySlug[slug];
      if (!lesson || !lesson.summary) return;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        injectStyle();
        var pop = getPopover();
        pop.querySelector('.lp-title').textContent = lesson.title;
        pop.querySelector('.lp-summary').textContent = lesson.summary;
        pop.querySelector('.lp-go').href = a.getAttribute('href');
        var rect = a.getBoundingClientRect();
        pop.style.left = (rect.left + window.scrollX) + 'px';
        pop.style.top = (rect.bottom + window.scrollY + 6) + 'px';
        pop.style.display = 'block';
      });
    });
    document.addEventListener('click', function (e) {
      var pop = document.getElementById(POP_ID);
      if (!pop || pop.style.display === 'none') return;
      if (e.target.closest && (e.target.closest('#' + POP_ID) || links.length && Array.prototype.indexOf.call(links, e.target) !== -1)) return;
      pop.style.display = 'none';
    });
  });
})();
