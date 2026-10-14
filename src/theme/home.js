/* Home screen: navigation, KPI cards, the world map with every site, featured modules,
   and the quick tour. Every number comes from the demo data files. */
(function(){
  var H = JSON.parse(document.getElementById('mgi-home').textContent);
  var B = H.brief;   // priced / records / former counts
  var $ = function(s){ return document.querySelector(s); };
  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var fmt = function(n){ return Math.round(n).toLocaleString('en-US'); };
  var famName = function(t){ return t.charAt(0) + t.slice(1).toLowerCase(); };
  var CN = { CA:'Canada', US:'United States', MX:'Mexico' }, REG = { CA:'canada', US:'usa', MX:'latam' };
  var calm = false; try { calm = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e) {}
  var open = function(id){ if (window.openMod) openMod(id); };

  /* ---- navigation ---- */
  var NAV = [['top','Home'],['grp-data','Market data'],['grp-jobs','Jobs and careers'],['grp-inc','LTI'],['grp-ana','Analytics'],['/roadmap/','Roadmap']];
  var nav = document.createElement('nav'); nav.className = 'mgiNav'; nav.setAttribute('aria-label', 'Sections');
  nav.innerHTML = NAV.map(function(n, i){ return '<a href="' + (n[0][0] === '/' ? n[0] : '#' + n[0]) + '" data-t="' + n[0] + '"' + (i === 0 ? ' class="on" aria-current="true"' : '') + '>' + n[1] + '</a>'; }).join('');
  var logo = $('header .logo'); if (logo) logo.insertAdjacentElement('afterend', nav);
  function jump(id){
    if (document.body.classList.contains('modOpen') && window.goHome) goHome();
    var y = id === 'top' ? 0 : document.getElementById(id).getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: calm ? 'auto' : 'smooth' });
  }
  nav.addEventListener('click', function(e){ var a = e.target.closest('a'); if (!a || a.dataset.t[0] === '/') return; e.preventDefault(); jump(a.dataset.t); });
  $('#exploreBtn').addEventListener('click', function(e){ e.preventDefault(); jump('featured'); });
  function spy(){
    var cur = 'top';
    ['grp-data','grp-jobs','grp-inc','grp-ana'].forEach(function(id){ var el = document.getElementById(id); if (el && el.getBoundingClientRect().top < 160) cur = id; });
    nav.querySelectorAll('a').forEach(function(a){ var on = a.dataset.t === cur; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  window.addEventListener('scroll', spy, { passive:true });

  /* ---- KPI cards ---- */
  function bars(vals){
    var w = 120, h = 38, n = vals.length, bw = w / n, mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals), r = mx - mn || 1;
    return '<svg class="spk" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' + vals.map(function(v, i){ var bh = 8 + (h - 8) * (v - mn) / r; return '<rect x="' + (i*bw + 1.2).toFixed(1) + '" y="' + (h - bh).toFixed(1) + '" width="' + (bw - 2.6).toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="2" opacity="' + (.3 + .7*(i+1)/n).toFixed(2) + '"/>'; }).join('') + '</svg>';
  }
  var byC = {}; H.sites.forEach(function(s){ var c = byC[s.c] = byC[s.c] || { sites:0, hc:0 }; c.sites++; c.hc += s.hc; });
  var people = H.sites.reduce(function(a, s){ return a + s.hc; }, 0), hc = H.hc.ALL;
  var d12 = 100 * (hc[hc.length-1] - hc[0]) / hc[0];
  var ICON = {
    one:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4.2"/><path d="M4 20.5c.7-4.6 4-7 8-7s7.3 2.4 8 7z"/></svg>',
    glb:'<svg viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zm6.9 8.5h-3.1a15 15 0 0 0-1.4-6 7.6 7.6 0 0 1 4.5 6zM12 4.6c.9 1.2 1.7 3.3 1.9 6.4h-3.8c.2-3.1 1-5.2 1.9-6.4zM9.6 5a15 15 0 0 0-1.4 6H5.1a7.6 7.6 0 0 1 4.5-6zM5.1 13h3.1c.1 2.3.6 4.4 1.4 6a7.6 7.6 0 0 1-4.5-6zm6.9 6.4c-.9-1.2-1.7-3.3-1.9-6.4h3.8c-.2 3.1-1 5.2-1.9 6.4zm2.4-.4c.8-1.6 1.3-3.7 1.4-6h3.1a7.6 7.6 0 0 1-4.5 6z"/></svg>',
    two:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.6"/><path d="M2.5 19.5c.6-4 3.3-6 6.5-6s5.9 2 6.5 6z"/><circle cx="17" cy="9" r="2.8"/><path d="M16.6 13.6c2.7.2 4.4 2 4.9 5.9h-4.4c-.2-2.4-.5-4.3-.5-5.9z"/></svg>',
    bld:'<svg viewBox="0 0 24 24"><path fill-rule="evenodd" d="M4 21V5.5L12 3v18h-2v-3H7v3zm3-13h1.6v1.8H7zm2.4 0H11v1.8H9.4zM7 11.3h1.6v1.8H7zm2.4 0H11v1.8H9.4zM7 14.6h1.6v1.8H7zm2.4 0H11v1.8H9.4zM13 21V9l7 2.2V21zm2-7.6h1.5v1.6H15zm2.5 0H19v1.6h-1.5zM15 16.6h1.5v1.6H15zm2.5 0H19v1.6h-1.5z"/></svg>'
  };
  var K = [
    ['one', B.priced, 'Employees priced', '<span class="dl">' + (d12 >= 0 ? '▲' : '▼') + ' ' + Math.abs(d12).toFixed(1) + '%</span> vs 12 months ago', bars(hc)],
    ['glb', 3, 'Countries', 'Canada, United States, Mexico', bars(['MX','CA','US'].map(function(c){ return byC[c].hc; }))],
    ['two', B.records, 'People in HR data', fmt(people) + ' current · ' + fmt(B.former) + ' former', bars(H.seen)],
    ['bld', H.sites.length, 'Sites', 'greenhouses, packing, distribution, offices', bars(H.sites.slice(0, 12).map(function(s){ return s.hc; }).reverse())]
  ];

  /* ---- map: the supplied world map, with each site placed by city (lon/lat projection of the art) ---- */
  var SITE_LL = {'Kingsville Greenhouse':[42.04,-82.74],'Leamington Greenhouse':[42.05,-82.6],'Coldwater Greenhouse':[41.94,-85.0],'Sinaloa Greenhouse One':[24.8,-107.4],'Sinaloa Greenhouse Two':[25.79,-108.99],'Oneida Greenhouse':[43.09,-75.65],'Richmond Greenhouse':[37.75,-84.29],'Leamington Strawberry Greenhouse':[42.1,-82.5],'Morehead Greenhouse':[38.18,-83.43],'Jalisco Greenhouse':[20.4,-103.0],'Surrey Greenhouse':[49.19,-122.85],'Jonestown Packing Centre':[40.41,-76.48],'Laredo Distribution Center':[27.53,-99.48],'Kingsville Distribution Centre':[42.0,-82.8],'Coldwater Pepper Greenhouse':[41.9,-85.1],'Culiacan Packing Centre':[24.75,-107.3],'Coldwater Distribution Center':[42.0,-84.9],'Kingsville Head Office':[42.06,-82.72],'Berea Greenhouse':[37.57,-84.3],'Utah Greenhouse':[39.3,-111.7],'Exeter Greenhouse':[36.3,-119.14],'Surrey Distribution Centre':[49.1,-122.7],'Wapakoneta Greenhouse':[40.57,-84.19],'US Sales and Support Office':[42.37,-83.35],'Guadalajara Office':[20.67,-103.35]};
  var px = function(lon){ return (lon + 180) * 1600 / 360; }, py = function(lat){ return 351.7 - lat * 4.138; };
  var maxHc = H.sites[0].hc;
  var sites = H.sites.map(function(s){ var ll = SITE_LL[s.name]; if (!ll) return ''; var x = px(ll[1]).toFixed(1), y = py(ll[0]).toFixed(1), r = 2.4 + 3.6 * Math.sqrt(s.hc / maxHc);
    return '<g class="site"><circle class="halo" cx="' + x + '" cy="' + y + '" r="' + (r * 4.5).toFixed(1) + '"/><circle cx="' + x + '" cy="' + y + '" r="' + r.toFixed(1) + '"><title>' + esc(s.name) + ': ' + fmt(s.hc) + ' people</title></circle></g>'; }).join('');
  var mapSvg = '<svg viewBox="120 40 1360 520" preserveAspectRatio="xMidYMid slice" role="img" aria-label="World map with ' + H.sites.length + ' sites in Canada, the United States and Mexico"><defs><radialGradient id="mgiGlow"><stop offset="0" stop-color="#9DF9B0" stop-opacity=".75"/><stop offset="1" stop-color="#9DF9B0" stop-opacity="0"/></radialGradient></defs><image href="img/mgi/world-map.svg" x="0" y="0" width="1600" height="600"/>' + sites + '</svg>';
  var rows = ['CA','US','MX'].map(function(c){ return '<button type="button" class="crow" data-r="' + REG[c] + '"><span class="flag f-' + c + '" aria-hidden="true"></span><span class="cn"><b>' + CN[c] + '</b><small>' + byC[c].sites + ' sites · ' + fmt(byC[c].hc) + ' people</small></span><span class="chev" aria-hidden="true">›</span></button>'; }).join('')
    + '<button type="button" class="crow" data-r="all"><span class="flag f-ALL" aria-hidden="true">ALL</span><span class="cn"><b>All regions</b><small>the whole company</small></span><span class="chev" aria-hidden="true">›</span></button>';

  /* ---- featured modules (artwork from the approved design kit) ---- */
  var FEAT = [['jdmatch','Job Matcher','Benchmark every job against the market.','job_matcher'],['archbuild','Job Architecture','Build a connected career framework.','job_architecture'],['jdlib','JD Creator','Write job descriptions from one template.','jd_creator'],['career','Career Pathing','Show what is possible for every employee.','career_pathing'],['lti','Long-Term Incentive','Design an executive LTI plan.','lti'],['ghr','Analytics','Workforce and pay KPIs in one view.','analytics']];

  var ov = document.getElementById('mgiOverview');
  ov.innerHTML = '<div class="kcards">' + K.map(function(k){ return '<div class="kc"><div class="kt"><span class="ki" aria-hidden="true">' + ICON[k[0]] + '</span><div><b data-n="' + k[1] + '">' + fmt(k[1]) + '</b><span>' + k[2] + '</span></div></div><div class="kb"><small>' + k[3] + '</small>' + k[4] + '</div></div>'; }).join('') + '</div>'
    + '<div class="mappanel"><div class="mp-l"><h2>A global workforce with a shared purpose.</h2><div class="mp-n"><div><b>3</b><span>Countries</span></div><div><b>' + H.sites.length + '</b><span>Sites</span></div><div><b>' + fmt(people) + '</b><span>People</span></div></div><p>Pick a country to focus the dashboards on it.</p></div>'
    + '<div class="mapbox">' + mapSvg + '</div><div class="mp-r">' + rows + '</div></div>'
    + '<section class="fsec" id="featured" aria-label="Featured modules"><div class="fgrid">' + FEAT.map(function(f){ return '<button type="button" class="fcard" data-m="' + f[0] + '"><h3>' + f[1] + '</h3><p>' + f[2] + '</p><span class="fb"><span class="achip" aria-hidden="true">&rarr;</span><img src="img/mgi/' + f[3] + '.svg" alt="" width="118" height="83" loading="lazy"></span></button>'; }).join('') + '</div></section>';
  ov.querySelectorAll('[data-m]').forEach(function(el){ el.addEventListener('click', function(){ open(el.dataset.m); }); });
  var main = $('.main'); if (main) { var h = document.createElement('h2'); h.className = 'alltools'; h.textContent = 'All tools'; var c = document.getElementById('cards'); main.insertBefore(h, c); }

  function markReg(){ var cur = ($('#regSel') || {}).value || 'all'; ov.querySelectorAll('.crow').forEach(function(b){ b.classList.toggle('on', b.dataset.r === cur); b.setAttribute('aria-pressed', b.dataset.r === cur); }); }
  ov.querySelectorAll('.crow').forEach(function(b){ b.onclick = function(){ if (window.setReg) setReg(b.dataset.r); markReg(); }; });
  var rs = $('#regSel'); if (rs) rs.addEventListener('change', function(){ setTimeout(markReg); });
  markReg();

  /* count the KPI figures up once, on first view */
  if (!calm) {
    var nums = ov.querySelectorAll('.kt b[data-n]');
    nums.forEach(function(el){ el.textContent = '0'; });
    var t0 = null;
    var step = function(t){ if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - p, 3); nums.forEach(function(el){ el.textContent = fmt(+el.dataset.n * e); }); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* ---- the tool overlay behaves as a dialog: focus moves to Back, Escape closes it ---- */
  if (window.openMod) {
    var om = window.openMod;
    window.openMod = function(id){
      var r = om.apply(this, arguments);
      setTimeout(function(){ var f = document.getElementById('modFrame'), t = document.getElementById('modTitle'), b = document.querySelector('#modBar .back'); if (f && t) f.title = t.textContent || 'Tool'; if (b) b.focus({ preventScroll:true }); }, 60);
      return r;
    };
  }
  var escHome = function(){ if (document.body.classList.contains('modOpen') && window.goHome) goHome(); };
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && tour.hidden) escHome(); });
  window.addEventListener('message', function(e){ if (e.data && e.data.mgi_escape) escHome(); });

  /* ---- direct links: /#archbuild opens that tool, so every tool can be shared on its own ---- */
  var IDS = (typeof MODS !== 'undefined' ? MODS : []).filter(function(m){ return !m.soon || /[?&]preview=1/.test(location.search); }).map(function(m){ return m.id; });
  function fromHash(){ var id = (location.hash || '').slice(1).toLowerCase(); if (IDS.indexOf(id) >= 0 && window.openMod) openMod(id); }
  window.addEventListener('hashchange', fromHash);
  if (document.readyState === 'complete') setTimeout(fromHash, 300); else window.addEventListener('load', function(){ setTimeout(fromHash, 300); });

  /* ---- quick tour ---- */
  var TOUR = [
    ['Step 1 · Market data', 'Start with the market', 'Every job is matched to the salary survey with a confidence score and a market pay range, so pay decisions start from evidence.', 'job_matcher', 'jdmatch', 'Open Job Matcher'],
    ['Step 2 · Job architecture', 'One framework for every job', 'Families, levels and ranges across the US, Canada and Mexico, so offers and promotions follow the same rules everywhere.', 'job_architecture', 'archbuild', 'Open Job Architecture'],
    ['Step 2 · Job descriptions', 'Every job, described the same way', 'Job descriptions from one approved template, with the training, certifications and next-step criteria for each grade.', 'jd_creator', 'jdlib', 'Open JD Creator'],
    ['Step 2 · Careers', 'Show people where they can go', 'Every role\u2019s next steps, what each move is worth, the skills to build and who is ready now.', 'career_pathing', 'career', 'Open Career Pathing'],
    ['Step 3 · Long-term incentive', 'Keep the leaders who build the future', 'Stock options, phantom shares or deferred cash for a private company, with grants, cost and retention modeled.', 'lti', 'lti', 'Open the LTI designer'],
    ['Step 4 · Analytics', 'See it all in one view', 'Workforce and pay KPIs, pay analysis and market position, live on one company dataset.', 'analytics', 'ghr', 'Open Analytics']
  ];
  var tour = document.createElement('div'); tour.className = 'tour'; tour.hidden = true; tour.setAttribute('role', 'dialog'); tour.setAttribute('aria-modal', 'true'); tour.setAttribute('aria-label', 'Quick tour');
  document.body.appendChild(tour);
  var ti = 0, timer = 0, last = null;
  function show(i){
    ti = (i + TOUR.length) % TOUR.length; var t = TOUR[ti];
    tour.innerHTML = '<div class="tbox" style="position:relative"><div class="tart"><img src="img/mgi/' + t[3] + '.svg" alt=""></div><div class="ttxt"><span class="tk">' + t[0] + '</span><h3>' + t[1] + '</h3><p>' + t[2] + '</p>'
      + '<div class="tbar">' + TOUR.map(function(_, k){ return '<i class="' + (k < ti ? 'done' : k === ti ? 'cur' : '') + '"><b></b></i>'; }).join('') + '</div>'
      + '<div class="tnav"><button type="button" data-a="prev" aria-label="Previous">&larr;</button><button type="button" data-a="next" aria-label="Next">&rarr;</button><button type="button" class="tgo" data-a="go">' + t[5] + '</button></div></div><button type="button" class="tclose" data-a="close" aria-label="Close tour">&times;</button></div>';
    clearTimeout(timer); if (!calm && !tour.classList.contains('paused')) timer = setTimeout(function(){ show(ti + 1); }, 6000);
    if (!tour.contains(document.activeElement) || document.activeElement === tour) tour.querySelector('[data-a="go"]').focus({ preventScroll:true });
  }
  function close(){ clearTimeout(timer); tour.hidden = true; document.body.style.overflow = ''; if (last) last.focus(); }
  tour.addEventListener('click', function(e){
    var a = e.target.closest('[data-a]'); if (!a) { if (e.target === tour) close(); return; }
    var k = a.dataset.a;
    if (k === 'prev') show(ti - 1); else if (k === 'next') show(ti + 1); else if (k === 'close') close(); else if (k === 'go') { var m = TOUR[ti][4]; close(); open(m); }
  });
  tour.addEventListener('mouseenter', function(){ tour.classList.add('paused'); clearTimeout(timer); });
  tour.addEventListener('mouseleave', function(){ tour.classList.remove('paused'); clearTimeout(timer); if (!tour.hidden && !calm) timer = setTimeout(function(){ show(ti + 1); }, 4000); });
  document.addEventListener('keydown', function(e){
    if (tour.hidden) return;
    if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') show(ti + 1); if (e.key === 'ArrowLeft') show(ti - 1);
    if (e.key === 'Tab') {   // keep focus inside the dialog
      var f = tour.querySelectorAll('button'), a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  $('#tourBtn').addEventListener('click', function(){ last = this; tour.hidden = false; document.body.style.overflow = 'hidden'; show(0); });
})();
