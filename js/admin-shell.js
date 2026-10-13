/* 20FIT admin dashboard shell behaviours — vanilla, no framework.
   Covers: theme (light/dark), language (id/en), section + tab routing,
   table search/sort/pagination, toast. Wire real data from /api/admin/*. */

(function () {
  'use strict';

  /* ---------------- i18n ----------------
     Markup carries Indonesian text plus data-i18n="<english>".
     Placeholders use data-i18n-ph="<english placeholder>". */
  var LANG_KEY = 'adm.lang';
  var THEME_KEY = 'adm.theme';

  function getLang() { return localStorage.getItem(LANG_KEY) || 'id'; }
  function getTheme() { return localStorage.getItem(THEME_KEY) || 'light'; }

  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      if (!el.dataset.i18nId) el.dataset.i18nId = el.textContent.trim();
      el.textContent = lang === 'en' ? el.dataset.i18n : el.dataset.i18nId;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      if (!el.dataset.i18nPhId) el.dataset.i18nPhId = el.getAttribute('placeholder') || '';
      el.setAttribute('placeholder', lang === 'en' ? el.dataset.i18nPh : el.dataset.i18nPhId);
    });
    document.querySelectorAll('[data-lang-btn]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.langBtn === lang));
    });
    localStorage.setItem(LANG_KEY, lang);
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('[data-theme-btn]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.themeBtn === theme));
    });
    localStorage.setItem(THEME_KEY, theme);
  }

  /* ---------------- sidebar: accordion groups + mobile drawer ----------------
     Nav dikelompokkan per domain (.adm-navcat > button[data-navgroup] + .adm-navlist).
     Murni enhancement markup lama; no-op kalau grup tak ada (mis. template tanpa
     data-navgroup). State collapse persist di localStorage; grup berisi halaman
     aktif selalu di-expand. */
  var NAV_KEY = 'adm.nav.collapsed';
  function getCollapsed() { try { return JSON.parse(localStorage.getItem(NAV_KEY) || '[]') || []; } catch (e) { return []; } }
  function setCollapsed(arr) { try { localStorage.setItem(NAV_KEY, JSON.stringify(arr)); } catch (e) {} }

  function applyNavState() {
    var collapsed = getCollapsed();
    document.querySelectorAll('.adm-navcat').forEach(function (cat) {
      var btn = cat.querySelector('[data-navgroup]'); if (!btn) return;
      var isCol = collapsed.indexOf(btn.dataset.navgroup) >= 0;
      cat.classList.toggle('is-collapsed', isCol);
      btn.setAttribute('aria-expanded', String(!isCol));
    });
  }
  function toggleNavGroup(btn) {
    var cat = btn.closest('.adm-navcat'); if (!cat) return;
    var willCollapse = !cat.classList.contains('is-collapsed');
    cat.classList.toggle('is-collapsed', willCollapse);
    btn.setAttribute('aria-expanded', String(!willCollapse));
    var collapsed = getCollapsed(), id = btn.dataset.navgroup, i = collapsed.indexOf(id);
    if (willCollapse) { if (i < 0) collapsed.push(id); } else if (i >= 0) collapsed.splice(i, 1);
    setCollapsed(collapsed);
  }
  function expandActiveNav(sectionId) {
    var item = document.querySelector('.adm-side [data-nav="' + sectionId + '"]'); if (!item) return;
    var cat = item.closest('.adm-navcat'); if (!cat || !cat.classList.contains('is-collapsed')) return;
    var btn = cat.querySelector('[data-navgroup]');
    cat.classList.remove('is-collapsed');
    if (btn) {
      btn.setAttribute('aria-expanded', 'true');
      var collapsed = getCollapsed(), i = collapsed.indexOf(btn.dataset.navgroup);
      if (i >= 0) { collapsed.splice(i, 1); setCollapsed(collapsed); }
    }
  }
  function setMobileNav(open) {
    var side = document.querySelector('.adm-side'), scrim = document.querySelector('.adm-scrim'),
        btn = document.querySelector('[data-menu-toggle]');
    if (side) side.classList.toggle('is-open', open);
    if (scrim) scrim.hidden = !open;
    if (btn) btn.setAttribute('aria-expanded', String(open));
  }

  /* ---------------- routing: sections + tabs ----------------
     Section state lives in the URL (?section=voucher&tab=access) so admins
     can share a link, same as the period filter. */
  function params() { return new URLSearchParams(location.search); }

  function setParam(key, value) {
    var p = params();
    p.set(key, value);
    history.replaceState(null, '', location.pathname + '?' + p.toString());
  }

  function showSection(id) {
    document.querySelectorAll('[data-section]').forEach(function (s) {
      s.hidden = s.dataset.section !== id;
    });
    document.querySelectorAll('[data-nav]').forEach(function (b) {
      if (b.dataset.nav === id) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    var head = document.querySelector('[data-section="' + id + '"]');
    if (head) {
      var t = document.querySelector('[data-head-title]');
      var k = document.querySelector('[data-head-kicker]');
      var q = document.querySelector('[data-head-question]');
      if (t) { t.textContent = head.dataset.title || ''; t.dataset.i18n = head.dataset.titleEn || ''; }
      if (k) { k.textContent = head.dataset.kicker || ''; k.dataset.i18n = head.dataset.kickerEn || ''; }
      if (q) { q.textContent = head.dataset.question || ''; q.dataset.i18n = head.dataset.questionEn || ''; }
    }
    setParam('section', id);
    expandActiveNav(id);
    setMobileNav(false);
    applyLang(getLang());
  }

  function showTab(group, id) {
    // Param ?tab dibagi lintas tabgroup. Kalau id tak cocok panel mana pun di grup ini
    // (mis. ?tab milik grup lain), jatuh ke default grup supaya tak ada grup yang kosong.
    var panels = document.querySelectorAll('[data-tabpanel="' + group + '"]');
    var matched = Array.prototype.some.call(panels, function (p) { return p.dataset.tab === id; });
    if (!matched) {
      var g = document.querySelector('[data-tabgroup="' + group + '"]');
      id = (g && g.dataset.default) || (panels[0] && panels[0].dataset.tab) || id;
    }
    panels.forEach(function (p) { p.hidden = p.dataset.tab !== id; });
    document.querySelectorAll('[data-tab="' + group + '"]').forEach(function (b) {
      b.setAttribute('aria-selected', String(b.dataset.tabId === id));
    });
    // Jangan timpa ?tab saat fallback (biar grup yang benar-benar cocok tetap pegang param).
    if (matched) setParam('tab', id);
  }

  /* ---------------- tables: search, sort, paginate ----------------
     <table class="adm-table" data-table data-page-size="10">
       <thead><tr><th data-sort="num">Revenue</th>…
     Search input: <input data-table-search="#tableId">
     Filter chips: <button data-table-filter="#tableId" data-filter-key="status" data-filter-value="paid"> */
  function rows(table) { return Array.prototype.slice.call(table.tBodies[0].rows); }

  function renderTable(table) {
    var size = parseInt(table.dataset.pageSize || '10', 10);
    var page = parseInt(table.dataset.page || '0', 10);
    var q = (table.dataset.query || '').toLowerCase();
    var fk = table.dataset.filterKey, fv = table.dataset.filterValue;

    var visible = rows(table).filter(function (r) {
      var okQ = !q || r.textContent.toLowerCase().indexOf(q) >= 0;
      var okF = !fk || !fv || fv === 'all' || (r.dataset[fk] === fv);
      r.hidden = true;
      return okQ && okF;
    });
    var pages = Math.max(1, Math.ceil(visible.length / size));
    if (page > pages - 1) { page = pages - 1; table.dataset.page = page; }
    visible.slice(page * size, page * size + size).forEach(function (r) { r.hidden = false; });

    var info = document.querySelector('[data-table-info="#' + table.id + '"]');
    if (info) {
      info.textContent = visible.length
        ? (page * size + 1) + '\u2013' + Math.min(visible.length, page * size + size) + ' / ' + visible.length +
          ' (' + (page + 1) + '/' + pages + ')'
        : '0 / 0';
    }
    var empty = document.querySelector('[data-table-empty="#' + table.id + '"]');
    if (empty) empty.hidden = visible.length > 0;
  }

  function sortTable(table, th) {
    var idx = Array.prototype.indexOf.call(th.parentNode.cells, th);
    var kind = th.dataset.sort;
    var dir = th.getAttribute('aria-sort') === 'descending' ? 1 : -1;
    table.querySelectorAll('th[aria-sort]').forEach(function (h) { h.removeAttribute('aria-sort'); });
    th.setAttribute('aria-sort', dir === -1 ? 'descending' : 'ascending');

    var body = table.tBodies[0];
    rows(table).sort(function (a, b) {
      var x = a.cells[idx].dataset.value || a.cells[idx].textContent.trim();
      var y = b.cells[idx].dataset.value || b.cells[idx].textContent.trim();
      if (kind === 'num') return (parseFloat(String(y).replace(/[^0-9.-]/g, '')) - parseFloat(String(x).replace(/[^0-9.-]/g, ''))) * -dir;
      return String(x).localeCompare(String(y)) * -dir;
    }).forEach(function (r) { body.appendChild(r); });
    renderTable(table);
  }

  /* ---------------- toast ---------------- */
  var toastTimer;
  function toast(msg) {
    var el = document.querySelector('[data-toast]');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2800);
  }
  window.admToast = toast;
  /* Re-render a table after async data is injected into its tbody. */
  window.admRenderTable = function (elOrSel) {
    var t = typeof elOrSel === 'string' ? document.querySelector(elOrSel) : elOrSel;
    if (t) renderTable(t);
  };
  window.admShowSection = showSection;

  /* ---------------- delegated events ---------------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-lang-btn]');
    if (t) return applyLang(t.dataset.langBtn);

    t = e.target.closest('[data-theme-btn]');
    if (t) return applyTheme(t.dataset.themeBtn);

    t = e.target.closest('[data-menu-toggle]');
    if (t) { var side = document.querySelector('.adm-side'); return setMobileNav(!(side && side.classList.contains('is-open'))); }

    t = e.target.closest('[data-menu-close]');
    if (t) return setMobileNav(false);

    t = e.target.closest('[data-navgroup]');
    if (t) return toggleNavGroup(t);

    t = e.target.closest('[data-nav]');
    if (t) return showSection(t.dataset.nav);

    t = e.target.closest('[data-tab]');
    if (t) return showTab(t.dataset.tab, t.dataset.tabId);

    t = e.target.closest('th[data-sort]');
    if (t) return sortTable(t.closest('table'), t);

    t = e.target.closest('[data-table-filter]');
    if (t) {
      var table = document.querySelector(t.dataset.tableFilter);
      table.dataset.filterKey = t.dataset.filterKey;
      table.dataset.filterValue = t.dataset.filterValue;
      table.dataset.page = 0;
      document.querySelectorAll('[data-table-filter="' + t.dataset.tableFilter + '"]').forEach(function (c) {
        c.setAttribute('aria-pressed', String(c === t));
      });
      return renderTable(table);
    }

    t = e.target.closest('[data-page-step]');
    if (t) {
      var tb = document.querySelector(t.dataset.pageStep);
      tb.dataset.page = Math.max(0, parseInt(tb.dataset.page || '0', 10) + parseInt(t.dataset.step, 10));
      return renderTable(tb);
    }

    /* Two-step confirm for destructive actions:
       <button data-confirm="Yakin hapus?" data-action="delete-menu" data-id="12"> */
    t = e.target.closest('[data-confirm]');
    if (t) {
      if (t.dataset.armed !== '1') {
        t.dataset.armed = '1';
        t.dataset.labelBefore = t.textContent;
        t.textContent = t.dataset.confirm;
        setTimeout(function () {
          if (t.dataset.armed === '1') { t.dataset.armed = '0'; t.textContent = t.dataset.labelBefore; }
        }, 4000);
        e.preventDefault();
        return;
      }
      t.dataset.armed = '0';
      t.textContent = t.dataset.labelBefore;
      /* fall through to the page's own handler / form submit */
    }
  });

  document.addEventListener('input', function (e) {
    var s = e.target.closest('[data-table-search]');
    if (!s) return;
    var table = document.querySelector(s.dataset.tableSearch);
    table.dataset.query = s.value;
    table.dataset.page = 0;
    renderTable(table);
  });

  /* ---------------- boot ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getTheme());
    applyLang(getLang());
    applyNavState();
    var p = params();
    showSection(p.get('section') || 'overview');
    document.querySelectorAll('[data-tabgroup]').forEach(function (g) {
      showTab(g.dataset.tabgroup, p.get('tab') || g.dataset.default);
    });
    document.querySelectorAll('table[data-table]').forEach(renderTable);
  });
})();
