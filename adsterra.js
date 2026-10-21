/*!
 * Ads loader — ALL ad code lives in THIS file. Pages only contain empty slots: <div data-ad="top"></div>
 * Banners + native only: no pop-under, no social bar / push notifications.
 * Ads load directly in the page (no iframe file / no isolation).
 * To disable: set ENABLED=false below, or delete the <script src="adsterra.js"> tag from the page.
 * Slots: top, topx, mid, end, seo, sideR, sideL, railL, railR
 * Optional body attribute: data-no-support  -> hides the floating sponsor chip + footer sponsor link.
 */
(function () {
  'use strict';
  var ENABLED = true;

  // ---- Settings ----------------------------------------------------------
  var SUPPORT_CHIP = true;
  var SUPPORT_COOLDOWN = 60000;
  var SUPPORT_LINK = 'https://araplhn.org/4/3f093ddf57a8ee45454ef2e9b69b320a';
  var HOST = 'https://bauval.org';

  // ---- Units -------------------------------------------------------------
  var U = {
    b728:  { k: 'b438ca159fef3619cd01dd89663463be', w: 728, h: 90  },
    m300:  { k: '729c9fd7aa7322cef370e2d2f67a5788', w: 300, h: 250 },
    b468:  { k: '1e423ba61e8df2d60437276587320065', w: 468, h: 60  },
    m320:  { k: '7ba3e4b2562ec32fe469244d1c937d74', w: 320, h: 50  },
    s160a: { k: 'fabddc7a40461c7b942294ab544c4344', w: 160, h: 300 },
    s160b: { k: 'd6d837601ee8eae05c4e2f5180e6638d', w: 160, h: 600 },
    native:{ k: '7d74d287d7c8907ca009698fb7e174e7', native: true, h: 280 }
  };

  // slot name -> [unit, minimum screen width] (first match wins)
  var P = {
    top:   [['b728', 800], ['m320', 340]],
    topx:  [['b728', 800], ['b468', 500], ['m320', 0]],
    mid:   [['m300', 330]],
    end:   [['native', 0]],
    seo:   [['b468', 520]],
    sideR: [['s160b', 1241]],
    sideL: [['s160a', 1241]],
    railL: [['s160b', 1340]],
    railR: [['s160a', 1340]]
  };

  if (!ENABLED) return;
  var used = {}, ar = function () { return document.documentElement.lang === 'ar'; };

  function css() {
    var s = document.createElement('style');
    s.textContent =
      '.adx{margin:6px auto;text-align:center;max-width:100%}' +
      '.adl{display:block;font:11px system-ui,sans-serif;opacity:.65;margin-bottom:3px}' +
      '.adx iframe{border:0;display:block;margin:0 auto;background:transparent;max-width:100%}' +
      '#adsSupport{position:fixed;bottom:calc(14px + env(safe-area-inset-bottom,0px));inset-inline-start:14px;z-index:30;background:#0a7a65;color:#fff;padding:8px 14px;border-radius:99px;font:600 .85rem system-ui,sans-serif;text-decoration:none;box-shadow:0 3px 12px #0004}' +
      '@media print{#adsSupport,.adx{display:none}}';
    document.head.appendChild(s);
  }

  // Units load one at a time: atOptions is a global read by each unit script when it runs.
  var queue = [], busy = false;
  function next() {
    if (busy || !queue.length) return;
    busy = true;
    var job = queue.shift(), done = false;
    var fin = function () { if (done) return; done = true; busy = false; setTimeout(next, 150); };
    job(fin);
    setTimeout(fin, 5000);
  }
  function enqueue(job) { queue.push(job); next(); }

  // Move HTML written by an ad script into the holder; <script> tags are re-created so they run.
  function put(holder, html) {
    var t = document.createElement('div');
    t.innerHTML = html;
    while (t.firstChild) {
      var n = t.firstChild;
      if (n.nodeName === 'SCRIPT') {
        var s = document.createElement('script');
        for (var i = 0; i < n.attributes.length; i++) s.setAttribute(n.attributes[i].name, n.attributes[i].value);
        s.text = n.text;
        t.removeChild(n);
        holder.appendChild(s);
      } else holder.appendChild(n);
    }
  }

  function frame(holder, u, fin) {
    var s = document.createElement('script');
    s.setAttribute('data-cfasync', 'false');
    if (u.native) {
      // native: container div + script (official Adsterra native code)
      var c = document.createElement('div');
      c.id = 'container-' + u.k;
      holder.appendChild(c);
      s.async = true;
      s.onload = s.onerror = fin;
      s.src = HOST + '/21/' + u.k;
      holder.appendChild(s);
      return;
    }
    // banner: official atOptions + invoke script; document.write is redirected into this holder
    window.atOptions = { key: u.k, format: 'iframe', height: u.h, width: u.w, params: {} };
    var ow = document.write, ol = document.writeln;
    document.write = document.writeln = function () { put(holder, [].join.call(arguments, '')); };
    var restore = function () { document.write = ow; document.writeln = ol; fin(); };
    s.onload = s.onerror = restore;
    s.src = HOST + '/22/' + u.k;
    holder.appendChild(s);
  }

  function mount(slot) {
    var rules = P[slot.getAttribute('data-ad')] || [], w = window.innerWidth, pick = null;
    for (var i = 0; i < rules.length; i++) {
      if (w >= rules[i][1] && !used[rules[i][0]]) { pick = rules[i][0]; break; }
    }
    if (!pick) return;
    used[pick] = 1;
    var u = U[pick], box = document.createElement('div'),
        lab = document.createElement('small'), holder = document.createElement('div'), out = null;
    box.className = 'adx'; lab.className = 'adl'; lab.setAttribute('data-l','1');
    lab.textContent = ar() ? 'إعلان' : 'Advertisement';
    box.appendChild(lab);
    if (u.native) {
      holder.style.cssText = 'width:100%;max-width:728px;min-height:' + u.h + 'px;margin:0 auto';
      box.appendChild(holder);
    } else {
      // fixed-size banner: shrink (never crop) when the container is narrower than the banner
      out = document.createElement('div');
      out.style.cssText = 'direction:ltr;margin:0 auto;width:' + u.w + 'px;height:' + u.h + 'px';
      holder.style.cssText = 'direction:ltr;width:' + u.w + 'px;height:' + u.h + 'px;transform-origin:0 0';
      out.appendChild(holder); box.appendChild(out);
    }
    slot.appendChild(box);
    var fit = function () {
      if (!out) return;
      var p = slot.parentNode, cs = getComputedStyle(p),
          av = p.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
      if (!(av > 0)) return;
      var k = Math.min(1, av / u.w);
      out.style.width = Math.round(u.w * k) + 'px';
      out.style.height = Math.round(u.h * k) + 'px';
      holder.style.transform = k < 1 ? 'scale(' + k + ')' : '';
    };
    fit();
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fit, 150); });
    if (/^rail/.test(slot.getAttribute('data-ad'))) {
      slot.style.cssText = 'position:fixed;top:84px;z-index:3;' +
        (slot.getAttribute('data-ad') === 'railL' ? 'left:10px' : 'right:10px');
    }
    var go = function () { enqueue(function (fin) { frame(holder, u, fin); }); };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { io.disconnect(); fit(); go(); }
      }, { rootMargin: '300px' });
      io.observe(holder);
    } else go();
  }

  function support() {
    if (!SUPPORT_CHIP || document.body.hasAttribute('data-no-support')) return;
    var txtChip = function () { return ar() ? '☕ ادعم الأداة · رابط راعٍ (إعلان)' : '☕ Support us · Sponsor link (ad)'; };
    var mk = function (id) {
      var a = document.createElement('a');
      if (id) a.id = id;
      a.href = SUPPORT_LINK; a.target = '_blank'; a.rel = 'sponsored noopener noreferrer';
      return a;
    };
    var chip = mk('adsSupport'); chip.textContent = txtChip();
    chip.addEventListener('click', function () {
      chip.style.display = 'none';
      setTimeout(function () { chip.style.display = ''; }, SUPPORT_COOLDOWN);
    });
    document.body.appendChild(chip);
    var foot = document.querySelector('footer'), fl = null;
    if (foot) {
      var d = document.createElement('div'); d.style.marginTop = '6px';
      fl = mk(); fl.style.cssText = 'color:inherit;text-decoration:underline';
      fl.textContent = ar() ? 'ادعم الصفحة بزيارة رابط الراعي (إعلان)' : 'Support this page by visiting a sponsor link (ad)';
      d.appendChild(fl); foot.appendChild(d);
    }
    new MutationObserver(function () {
      chip.textContent = txtChip();
      if (fl) fl.textContent = ar() ? 'ادعم الصفحة بزيارة رابط الراعي (إعلان)' : 'Support this page by visiting a sponsor link (ad)';
      [].forEach.call(document.querySelectorAll('.adl'), function (l) {
        l.textContent = ar() ? 'إعلان' : 'Advertisement';
      });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  function init() {
    css();
    [].forEach.call(document.querySelectorAll('[data-ad]'), mount);
    support();
  }
  function start() { (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(init); }
  if (document.readyState === 'complete') start(); else addEventListener('load', start);
})();
