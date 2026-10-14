/* Home screen: navigation, KPI cards with trends, the North America map and illustrated tool cards. */
(function(){
  var H = JSON.parse(document.getElementById('mgi-home').textContent);
  var MAP = JSON.parse(document.getElementById('mgi-map').textContent);
  var $ = function(s){ return document.querySelector(s); };
  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var fmt = function(n){ return Math.round(n).toLocaleString('en-US'); };
  var money = function(v){ return '$' + (v >= 1e9 ? (v/1e9).toFixed(2) + 'B' : (v/1e6).toFixed(1) + 'M'); };
  var CN = { CA:'Canada', US:'United States', MX:'Mexico' }, REG = { CA:'canada', US:'usa', MX:'latam' };

  /* ---- navigation ---- */
  var NAV = [['top','Home'],['grp-data','Market data'],['grp-jobs','Jobs and careers'],['grp-inc','Incentives'],['grp-ana','Analytics'],['/roadmap/','Roadmap']];
  var nav = document.createElement('nav'); nav.className = 'mgiNav'; nav.setAttribute('aria-label', 'Sections');
  nav.innerHTML = NAV.map(function(n, i){ return '<a href="' + (n[0][0] === '/' ? n[0] : '#' + n[0]) + '" data-t="' + n[0] + '"' + (i === 0 ? ' class="on"' : '') + '>' + n[1] + '</a>'; }).join('');
  var logo = $('header .logo'); if (logo) logo.insertAdjacentElement('afterend', nav);
  nav.addEventListener('click', function(e){
    var a = e.target.closest('a'); if (!a || a.dataset.t[0] === '/') return;
    e.preventDefault();
    if (document.body.classList.contains('modOpen') && window.goHome) goHome();
    var el = a.dataset.t === 'top' ? document.body : document.getElementById(a.dataset.t);
    var y = a.dataset.t === 'top' ? 0 : el.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top: y, behavior: 'smooth' });
  });
  function spy(){
    var cur = 'top';
    ['grp-data','grp-jobs','grp-inc','grp-ana'].forEach(function(id){ var el = document.getElementById(id); if (el && el.getBoundingClientRect().top < 140) cur = id; });
    nav.querySelectorAll('a').forEach(function(a){ a.classList.toggle('on', a.dataset.t === cur); });
  }
  window.addEventListener('scroll', spy, { passive:true });

  /* ---- sparklines ---- */
  function spark(vals, kind){
    var w = 96, h = 34, mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), r = mx - mn || 1;
    if (kind === 'bars') {
      var bw = w / vals.length;
      return '<svg class="spk" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' + vals.map(function(v, i){ var bh = 6 + (h - 6) * (v - mn) / r; return '<rect x="' + (i*bw + 1).toFixed(1) + '" y="' + (h - bh).toFixed(1) + '" width="' + (bw - 2.5).toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="1.5" opacity="' + (.35 + .65 * (i+1) / vals.length).toFixed(2) + '"/>'; }).join('') + '</svg>';
    }
    var pts = vals.map(function(v, i){ return [(i * w / (vals.length - 1)).toFixed(1), (h - 3 - (h - 6) * (v - mn) / r).toFixed(1)]; });
    return '<svg class="spk line" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path class="ar" d="M' + pts.join(' L') + ' L' + w + ',' + h + ' L0,' + h + 'Z"/><path class="ln" d="M' + pts.join(' L') + '"/><circle cx="' + pts[pts.length-1][0] + '" cy="' + pts[pts.length-1][1] + '" r="2.6"/></svg>';
  }
  var hc = H.hc.ALL, now = hc[hc.length - 1], then = hc[0];
  var people = H.sites.reduce(function(a, s){ return a + s.hc; }, 0);
  var byC = {}; H.sites.forEach(function(s){ var c = byC[s.c] = byC[s.c] || { sites:0, hc:0 }; c.sites++; c.hc += s.hc; });
  var delta = function(a, b){ var d = 100 * (a - b) / b; return '<span class="dl ' + (d >= 0 ? 'up' : 'dn') + '">' + (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d).toFixed(1) + '%</span> vs 12 months ago'; };
  var ICON = {
    ppl:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.4 3-5.2 6-5.2s5.4 1.8 6 5.2"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 13.9c2.6.2 4.6 1.8 5.1 4.6"/></svg>',
    pay:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v5M17.5 9.5v5"/></svg>',
    glb:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.6 2.6 14.4 0 17M12 3.5c-2.6 2.6-2.6 14.4 0 17"/></svg>',
    site:'<svg viewBox="0 0 24 24"><path d="M3 20V10l6-4v14M9 20V8l6 3v9M15 20v-7l6-2v9M2 20h20"/></svg>'
  };
  var cards = [
    ['ppl', fmt(people), 'Employees priced', delta(now, then), spark(hc, 'line')],
    ['pay', money(H.payc.CA + H.payc.US + H.payc.MX), 'Annual base payroll (USD)', 'Canada, United States, Mexico', spark(['CA','US','MX'].map(function(c){ return H.payc[c]; }), 'bars')],
    ['glb', '3', 'Countries', fmt(byC.CA.hc) + ' · ' + fmt(byC.US.hc) + ' · ' + fmt(byC.MX.hc) + ' people', spark(['CA','US','MX'].map(function(c){ return byC[c].hc; }), 'bars')],
    ['site', String(H.sites.length), 'Sites', 'greenhouses, packing, distribution, offices', spark(H.sites.slice(0, 12).map(function(s){ return s.hc; }).reverse(), 'bars')]
  ];

  /* ---- map ---- */
  var maxHc = H.sites[0].hc;
  var mapSvg = '<svg class="namap" viewBox="0 0 ' + MAP.w + ' ' + MAP.h + '" role="img" aria-label="Sites across Canada, the United States and Mexico">'
    + '<defs><pattern id="mgiDots" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.25"/></pattern></defs>'
    + '<g class="land">' + ['CA','US','MX'].map(function(c){ return '<path class="c-' + c + '" d="' + MAP.paths[c] + '"/>'; }).join('') + '</g>'
    + '<g class="sites">' + H.sites.map(function(s){ var p = MAP.sites[s.name]; if (!p) return ''; var r = 3 + 6 * Math.sqrt(s.hc / maxHc); return '<g class="st st-' + s.c + '"><circle class="halo" cx="' + p[0] + '" cy="' + p[1] + '" r="' + (r * 2.4).toFixed(1) + '"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + r.toFixed(1) + '"><title>' + esc(s.name) + ' · ' + fmt(s.hc) + ' people</title></circle></g>'; }).join('') + '</g></svg>';
  var rows = ['CA','US','MX'].map(function(c){ return '<button type="button" class="crow" data-r="' + REG[c] + '"><span class="flag f-' + c + '">' + c + '</span><span class="cn"><b>' + CN[c] + '</b><small>' + byC[c].sites + ' sites · ' + fmt(byC[c].hc) + ' people</small></span><span class="chev">›</span></button>'; }).join('');

  var ov = document.getElementById('mgiOverview');
  ov.innerHTML = '<div class="ovw">'
    + '<div class="kcards">' + cards.map(function(k){ return '<div class="kc"><div class="kt"><span class="ki">' + ICON[k[0]] + '</span><div><b>' + k[1] + '</b><span>' + k[2] + '</span></div></div><div class="kb"><small>' + k[3] + '</small>' + k[4] + '</div></div>'; }).join('') + '</div>'
    + '<div class="mappanel"><div class="mp-l"><div class="mp-k">Footprint</div><h2>One workforce across three countries.</h2><div class="mp-n"><div><b>3</b><span>Countries</span></div><div><b>' + H.sites.length + '</b><span>Sites</span></div><div><b>' + fmt(people) + '</b><span>People</span></div></div><p>Pick a country to filter every tool to it.</p></div>'
    + '<div class="mp-m">' + mapSvg + '</div><div class="mp-r">' + rows + '<button type="button" class="crow all" data-r="all"><span class="flag f-ALL">ALL</span><span class="cn"><b>All regions</b><small>the whole company</small></span><span class="chev">›</span></button></div></div></div>';
  function markReg(){ var cur = ($('#regSel') || {}).value || 'all'; ov.querySelectorAll('.crow').forEach(function(b){ b.classList.toggle('on', b.dataset.r === cur); }); }
  ov.querySelectorAll('.crow').forEach(function(b){ b.onclick = function(){ if (window.setReg) setReg(b.dataset.r); markReg(); }; });
  var rs = $('#regSel'); if (rs) rs.addEventListener('change', function(){ setTimeout(markReg); });
  markReg();
})();
