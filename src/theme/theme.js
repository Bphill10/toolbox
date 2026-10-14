/* MGI theme: light or dark, remembered per browser and shared with every module frame. */
(function(){
  var KEY = 'mgi-theme', root = document.documentElement;
  function saved(){ try { return localStorage.getItem(KEY); } catch(e) { return null; } }
  function system(){ try { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch(e) { return 'light'; } }
  function apply(t){
    t = t === 'dark' || t === 'light' ? t : system();
    root.setAttribute('data-theme', t);
    var bs = document.querySelectorAll('.mgi-tt');
    for (var i = 0; i < bs.length; i++) { bs[i].setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); bs[i].innerHTML = t === 'dark' ? SUN : MOON; }
    if (typeof queueFix === 'function') queueFix();
    var fs = document.querySelectorAll('iframe');
    for (var j = 0; j < fs.length; j++) { try { fs[j].contentWindow.postMessage({ mgi_theme: t }, '*'); } catch(e) {} }
  }
  var SUN = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  /* Dark mode for module screens that paint some boxes white in their own CSS: anything left light
     gets a dark tint of its own hue, and dark text on it turns light. Printable documents keep paper colours. */
  var PAPER = '.jddoc,.paper,.doc,#jdDoc';
  function lum(c){ var m = c && c.match(/[\d.]+/g); if (!m) return null; var a = m.length > 3 ? +m[3] : 1; return { r:+m[0], g:+m[1], b:+m[2], a:a, l:(+m[0]*.3 + +m[1]*.59 + +m[2]*.11)/255 }; }
  function darkFix(){
    if (!root.classList.contains('mgi-mod')) return;
    var dark = root.getAttribute('data-theme') === 'dark', els = document.body ? document.body.getElementsByTagName('*') : [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.dataset.mgiFix) { el.style.backgroundColor = el.dataset.mgiBg || ''; el.style.color = el.dataset.mgiCol || ''; delete el.dataset.mgiFix; }
      if (!dark || el.closest(PAPER) || el.tagName === 'svg' || el.closest('svg')) continue;
      var cs = getComputedStyle(el), bg = lum(cs.backgroundColor), fg = lum(cs.color), fix = false, nb = null, nc = null;
      if (bg && bg.a > .5 && bg.l > .78) {
        var mx = Math.max(bg.r, bg.g, bg.b), mn = Math.min(bg.r, bg.g, bg.b);
        if (mx - mn < 14) nb = 'var(--card)';
        else { var k = 255 / Math.max(1, mx - mn); nb = 'rgba(' + Math.round((bg.r - mn) * k * .8) + ',' + Math.round((bg.g - mn) * k * .8) + ',' + Math.round((bg.b - mn) * k * .8) + ',.20)'; }
        fix = true;
      }
      if (fg && fg.l < .38 && (fix || !bg || bg.a < .5 || bg.l < .3)) { var fm = Math.max(fg.r, fg.g, fg.b), fn = Math.min(fg.r, fg.g, fg.b); nc = fm - fn > 60 ? 'rgb(' + Math.min(255, fg.r + 110) + ',' + Math.min(255, fg.g + 110) + ',' + Math.min(255, fg.b + 110) + ')' : 'var(--ink)'; fix = true; }
      if (fix) { el.dataset.mgiFix = 1; el.dataset.mgiBg = el.style.backgroundColor; el.dataset.mgiCol = el.style.color; if (nb) el.style.backgroundColor = nb; if (nc) el.style.color = nc; }
    }
  }
  var fixT = 0;
  function queueFix(){ clearTimeout(fixT); fixT = setTimeout(darkFix, 120); }
  if (root.classList.contains('mgi-mod')) {
    var start = function(){ queueFix(); try { new MutationObserver(queueFix).observe(document.body, { childList:true, subtree:true, characterData:false }); } catch(e) {} };
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  }
  var parentTheme = null;
  try { if (window.parent !== window && window.parent.document) parentTheme = window.parent.document.documentElement.getAttribute('data-theme'); } catch(e) {}
  apply(parentTheme || saved());
  window.addEventListener('message', function(e){
    var d = e && e.data; if (!d) return;
    if (d.mgi_theme) apply(d.mgi_theme);
    if (d.mgi_theme_req && e.source) { try { e.source.postMessage({ mgi_theme: root.getAttribute('data-theme') }, '*'); } catch(x) {} }
  });
  if (window.parent !== window) { try { window.parent.postMessage({ mgi_theme_req: 1 }, '*'); } catch(e) {} }
  var before = null;
  window.addEventListener('beforeprint', function(){ before = root.getAttribute('data-theme'); root.setAttribute('data-theme', 'light'); });
  window.addEventListener('afterprint', function(){ if (before) root.setAttribute('data-theme', before); });
  window.addEventListener('storage', function(e){ if (e.key === KEY) apply(e.newValue); });
  window.mgiTheme = {
    set: function(t){ try { localStorage.setItem(KEY, t); } catch(e) {} apply(t); },
    toggle: function(){ this.set(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); },
    button: function(){ var b = document.createElement('button'); b.type = 'button'; b.className = 'mgi-tt'; b.onclick = function(){ window.mgiTheme.toggle(); }; apply(root.getAttribute('data-theme')); setTimeout(function(){ apply(root.getAttribute('data-theme')); }); return b; }
  };
})();
