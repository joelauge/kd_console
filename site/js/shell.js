/* ===========================================================
   KnowDrive Enterprise Console — shared shell behaviors
   1. Role switcher (persists, filters sidebar nav)
   2. Org switcher dropdown (persists)
   3. Command palette (⌘K / Ctrl-K, type-ahead, categorized)
=========================================================== */

/* ---------- 0a. page-load progress bar ---------- */
(function () {
  var bar = document.createElement('div');
  bar.className = 'loadbar';
  document.body.appendChild(bar);

  // arrival: staggered fade-in of content blocks
  document.body.classList.add('arriving');
  setTimeout(function () { document.body.classList.remove('arriving'); }, 700);

  var timer = null;
  function start() {
    document.body.classList.add('loading');
    var w = 12;
    bar.style.opacity = '1';
    bar.style.width = w + '%';
    clearInterval(timer);
    timer = setInterval(function () {
      // ease toward 90%, never complete on its own
      w += (90 - w) * 0.18;
      bar.style.width = w + '%';
    }, 180);
  }

  // intercept same-site navigations (topbar, sidebar, palette, in-page links)
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || a.target === '_blank' || /^[a-z]+:/i.test(href)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    start();
  });
  window.addEventListener('beforeunload', start);

  // finish instantly if the page is restored from bfcache
  window.addEventListener('pageshow', function () {
    clearInterval(timer);
    bar.style.width = '100%';
    document.body.classList.remove('loading');
    setTimeout(function () { bar.style.opacity = '0'; bar.style.width = '0'; }, 250);
  });
})();

/* ---------- 0. mobile nav (hamburger + scrim) ---------- */
(function () {
  var topbar = document.querySelector('.topbar');
  var sidebar = document.querySelector('.sidebar');
  if (!topbar || !sidebar) return;

  var btn = document.createElement('button');
  btn.className = 'menubtn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Menu');
  btn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2A2A3C" stroke-width="2.4" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  topbar.insertBefore(btn, topbar.firstChild);

  var scrim = document.createElement('div');
  scrim.className = 'scrim';
  document.body.appendChild(scrim);

  function close() { document.body.classList.remove('navopen'); }
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    document.body.classList.toggle('navopen');
  });
  scrim.addEventListener('click', close);
  sidebar.addEventListener('click', function (e) {
    if (e.target.closest('a')) close();
  });

  // add meta viewport if a page is missing it
  if (!document.querySelector('meta[name="viewport"]')) {
    var m = document.createElement('meta');
    m.name = 'viewport';
    m.content = 'width=device-width, initial-scale=1';
    document.head.appendChild(m);
  }
})();

/* ---------- 1. role switcher ---------- */
(function () {
  var seg = document.querySelector('.roleseg');
  if (!seg) return;
  var role = localStorage.getItem('kdcRole') || 'platform';

  function apply() {
    seg.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.role === role);
    });
    document.querySelectorAll('.navitem[data-roles]').forEach(function (a) {
      a.style.display = a.dataset.roles.indexOf(role) >= 0 ? '' : 'none';
    });
    document.querySelectorAll('.navsec').forEach(function (sec) {
      var visible = Array.prototype.some.call(sec.querySelectorAll('.navitem'), function (a) {
        return a.style.display !== 'none';
      });
      sec.style.display = visible ? '' : 'none';
    });
  }
  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-role]');
    if (!b) return;
    role = b.dataset.role;
    localStorage.setItem('kdcRole', role);
    apply();
  });
  apply();
})();

/* ---------- 2. org switcher ---------- */
(function () {
  var wrap = document.querySelector('.orgwrap');
  if (!wrap) return;
  var btn = wrap.querySelector('.orgbtn');
  var menu = wrap.querySelector('.orgmenu');
  var orgs = {
    acme: { name: 'Acme Corp', ini: 'AC', grad: 'linear-gradient(135deg,#6C5CE7,#4B3FC4)' },
    northwind: { name: 'Northwind Labs', ini: 'NL', grad: 'linear-gradient(135deg,#12A07A,#0B7C63)' },
    recourse: { name: 'Recourse Software', ini: 'RS', grad: 'linear-gradient(135deg,#2A6FDB,#1B4FA8)' }
  };
  var cur = localStorage.getItem('kdcOrg') || 'acme';
  if (!orgs[cur]) cur = 'acme';

  function apply() {
    var o = orgs[cur];
    btn.querySelector('.oini').textContent = o.ini;
    btn.querySelector('.oini').style.background = o.grad;
    btn.querySelector('.oname').textContent = o.name;
    menu.querySelectorAll('.orgopt').forEach(function (opt) {
      var active = opt.dataset.org === cur;
      opt.classList.toggle('active', active);
      opt.querySelector('.check').style.visibility = active ? 'visible' : 'hidden';
    });
    document.querySelectorAll('[data-org-name]').forEach(function (el) {
      el.textContent = o.name;
    });
  }
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });
  menu.addEventListener('click', function (e) {
    var opt = e.target.closest('.orgopt');
    if (!opt) return;
    cur = opt.dataset.org;
    localStorage.setItem('kdcOrg', cur);
    menu.classList.add('hidden');
    apply();
  });
  document.addEventListener('click', function () { menu.classList.add('hidden'); });
  apply();
})();

/* ---------- 3. command palette ---------- */
(function () {
  var root = (document.body.dataset.root || '');   // '' for pages at site root

  var INDEX = [
    { group: 'Knowledge stores', ini: 'KS', bg: '#EFEEFC', fg: '#4B3FC4', items: [
      ['kd-eng-prod-codebase', 'Engineering', 'store-detail.html?id=kd-eng-prod-codebase'],
      ['kd-rsch-prod-papers', 'Research', 'store-detail.html?id=kd-rsch-prod-papers'],
      ['kd-fin-prod-invoices', 'Finance', 'store-detail.html?id=kd-fin-prod-invoices'],
      ['kd-legal-prod-contracts', 'Legal', 'store-detail.html?id=kd-legal-prod-contracts'],
      ['kd-sales-stg-calls', 'Sales', 'store-detail.html?id=kd-sales-stg-calls'],
      ['kd-hr-prod-policies', 'People Ops', 'store-detail.html?id=kd-hr-prod-policies']
    ]},
    { group: 'Actions', ini: 'AC', bg: '#E7F6F1', fg: '#0E7C5F', items: [
      ['Provision a knowledge store', 'wizard', 'provision.html'],
      ['Connect a storage bucket', 'connectors', 'connectors.html'],
      ['Test SSO connection', 'identity', 'sso.html'],
      ['Invite an admin', 'organization', 'organization.html'],
      ['Adjust department quotas', 'governance', 'governance.html'],
      ['Export audit log', 'audit', 'audit.html']
    ]},
    { group: 'Pages', ini: 'PG', bg: '#F3F3F7', fg: '#71718A', items: [
      ['Overview', 'page', 'index.html'],
      ['Knowledge stores', 'page', 'stores.html'],
      ['Provision a store', 'page', 'provision.html'],
      ['Organization', 'page', 'organization.html'],
      ['SSO & identity', 'page', 'sso.html'],
      ['Connectors', 'page', 'connectors.html'],
      ['Helm charts', 'page', 'helm.html'],
      ['Governance', 'page', 'governance.html'],
      ['Audit log', 'page', 'audit.html'],
      ['Naming policy', 'page', 'naming.html'],
      ['Billing & pricing', 'page', 'billing.html'],
      ['System status', 'page', 'status.html'],
      ['Profile & account', 'page', 'profile.html']
    ]}
  ];

  // build palette DOM once
  var ov = document.createElement('div');
  ov.className = 'overlay top hidden';
  ov.innerHTML =
    '<div class="palette">' +
      '<div class="pin">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8C8C9E" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>' +
        '<input type="text" placeholder="Search stores, actions, pages…">' +
        '<span style="font:600 10px \'JetBrains Mono\'; color:#B9B4D6; border:1px solid #ECE9F7; border-radius:5px; padding:2px 6px;">ESC</span>' +
      '</div>' +
      '<div class="presults"></div>' +
      '<div class="pfoot"><span>↵ Open first result</span><span>ESC Close</span><span style="margin-left:auto;">⌘K to toggle</span></div>' +
    '</div>';
  document.body.appendChild(ov);
  var input = ov.querySelector('input');
  var results = ov.querySelector('.presults');

  function render() {
    var q = input.value.trim().toLowerCase();
    var html = '', any = false;
    INDEX.forEach(function (g) {
      var items = q
        ? g.items.filter(function (it) { return it[0].toLowerCase().indexOf(q) >= 0 || it[1].toLowerCase().indexOf(q) >= 0; })
        : g.items.slice(0, 4);
      items = items.slice(0, 6);
      if (!items.length) return;
      any = true;
      html += '<div class="pgroup">' + g.group + '</div>';
      items.forEach(function (it) {
        html += '<a class="pitem" href="' + root + it[2] + '">' +
          '<span class="pico" style="background:' + g.bg + '; color:' + g.fg + ';">' + g.ini + '</span>' +
          '<span>' + it[0] + '</span><span class="phint">' + it[1] + '</span></a>';
      });
    });
    results.innerHTML = any ? html : '<div class="pempty">No results for \u201C' + input.value + '\u201D</div>';
  }

  function open() { ov.classList.remove('hidden'); input.value = ''; render(); input.focus(); }
  function close() { ov.classList.add('hidden'); }

  var sbtn = document.querySelector('.searchbtn');
  if (sbtn) sbtn.addEventListener('click', open);
  input.addEventListener('input', render);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var first = results.querySelector('a.pitem');
      if (first) window.location.href = first.getAttribute('href');
    }
  });
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      ov.classList.contains('hidden') ? open() : close();
    } else if (e.key === 'Escape' && !ov.classList.contains('hidden')) {
      close();
    }
  });
})();
