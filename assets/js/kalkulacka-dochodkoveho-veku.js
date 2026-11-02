(function () {
  'use strict';

  // Slovakia retirement AGE (zákon č. 461/2003 Z. z., § 65, as amended by 352/2022).
  // This tool answers WHEN, not HOW MUCH (amount = POMB x ODP x ADH tool).
  // Fixed general ages in months (men / childless): 1960 = 63y, 1961 = 63y2m,
  // 1962 = 63y4m, 1963 = 63y6m, 1964 = 63y8m, 1965 = 63y10m, 1966 = 64y,
  // 1967 = 64y1m (vyhláška 148/2025), 1968 = 64y2m (vyhláška 72/2026).
  // Women 1960-1966: official MPSVR cohort table (archived MPSVR "Dôchodkový
  // vek" table), NOT the flat -6m rule. Columns are children 0/1/2/3/4/5+;
  // 3 and 4 share the "3 alebo 4" column.
  // Women/men 1967+: statutory -6 months per child raised, max -18 months
  // (MPSVR 2023 changes page; zákon 352/2022). One parent per child only:
  // a man counts only where the period cannot be counted for the woman, and
  // only to the same extent, so for men the reduced date is CONDITIONAL.
  // Cohorts 1969+: FORECAST from vyhláška 392/2024 annex 4, table 1. These are
  // ESTIMATES (ODHAD), not law; the final age is set by decree per cohort.
  // Men 1960-1966 with children: no reduced date is computed here, because the
  // historical men's annex table differs from the women's table and the
  // fallback computation for those cohorts is not verified; the page directs
  // those users to the Sociálna poisťovňa table.
  var FIXED = { 1960: 756, 1961: 758, 1962: 760, 1963: 762, 1964: 764, 1965: 766, 1966: 768, 1967: 769, 1968: 770 };
  var WOMEN_OLD = {
    1960: [756, 754, 753, 742, 742, 726],
    1961: [758, 756, 756, 746, 746, 735],
    1962: [760, 758, 756, 750, 750, 739],
    1963: [762, 760, 756, 750, 750, 743],
    1964: [764, 762, 756, 750, 750, 747],
    1965: [766, 762, 756, 750, 750, 750],
    1966: [768, 762, 756, 750, 750, 750]
  };
  var FORECAST = { 1969: 771, 1970: 772, 1971: 774, 1972: 776, 1973: 778, 1974: 780, 1975: 781, 1976: 783, 1977: 785, 1978: 786, 1979: 788, 1980: 790, 1981: 792, 1982: 793, 1983: 795, 1984: 797, 1985: 798, 1986: 800, 1987: 802, 1988: 803, 1989: 805, 1990: 806, 1991: 808, 1992: 810, 1993: 811, 1994: 813, 1995: 814, 1996: 816, 1997: 817, 1998: 819, 1999: 820, 2000: 822, 2001: 823, 2002: 825, 2003: 826, 2004: 827, 2005: 829, 2006: 830, 2007: 832, 2008: 833, 2009: 834, 2010: 836 };
  var MONTHS_GEN = ['januára', 'februára', 'marca', 'apríla', 'mája', 'júna', 'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'];

  function parseBirth(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    var y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    var dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return { y: y, m: mo, d: d };
  }

  function addMonths(b, months) {
    var total = (b.y * 12 + (b.m - 1)) + months;
    var y = Math.floor(total / 12);
    var mo = total - y * 12; // 0-based
    var lastDay = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
    var d = Math.min(b.d, lastDay);
    return { y: y, m: mo + 1, d: d };
  }

  function fmtDate(dt) {
    return dt.d + '. ' + MONTHS_GEN[dt.m - 1] + ' ' + dt.y;
  }

  function fmtAge(months) {
    var y = Math.floor(months / 12);
    var mo = months % 12;
    var yWord = 'rokov';
    var mWord = mo === 1 ? 'mesiac' : (mo >= 2 && mo <= 4 ? 'mesiace' : 'mesiacov');
    if (mo === 0) return y + ' ' + yWord;
    return y + ' ' + yWord + ' a ' + mo + ' ' + mWord;
  }

  function calc(input) {
    var b = parseBirth(input.birth);
    if (!b) return { error: 'bad-date' };
    var year = b.y;
    if (year < 1960 || year > 2010) return { error: 'out-of-range', year: year };
    var sex = input.sex === 'muz' ? 'muz' : 'zena';
    var childIdx = Math.min(5, Math.max(0, parseInt(input.children, 10) || 0));
    var reduction = 6 * Math.min(childIdx, 3);

    var general, own, estimate, conditional, conditionalNote;
    if (year <= 1968) {
      general = FIXED[year];
      estimate = false;
      if (sex === 'zena') {
        own = year <= 1966 ? WOMEN_OLD[year][childIdx] : general - reduction;
        conditional = null;
      } else {
        own = general;
        if (childIdx > 0 && year >= 1967) {
          conditional = general - reduction;
          conditionalNote = 'podmienené';
        } else if (childIdx > 0) {
          conditional = null;
          conditionalNote = 'overiť';
        } else {
          conditional = null;
        }
      }
    } else {
      general = FORECAST[year];
      estimate = true;
      if (sex === 'zena') {
        own = general - reduction;
        conditional = null;
      } else {
        own = general;
        conditional = childIdx > 0 ? general - reduction : null;
        conditionalNote = childIdx > 0 ? 'podmienené' : null;
      }
    }

    return {
      year: year,
      sex: sex,
      children: childIdx,
      general: general,
      generalText: fmtAge(general),
      own: own,
      ownText: fmtAge(own),
      date: fmtDate(addMonths(b, own)),
      estimate: estimate,
      conditional: conditional,
      conditionalText: conditional ? fmtAge(conditional) : null,
      conditionalDate: conditional ? fmtDate(addMonths(b, conditional)) : null,
      conditionalNote: conditionalNote || null
    };
  }

  // ---- DOM binding ----
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('vek-btn');
    if (!btn) return;

    function run() {
      var birth = document.getElementById('vek-birth').value;
      var sexEl = document.querySelector('input[name="vek-sex"]:checked');
      var sex = sexEl ? sexEl.value : 'zena';
      var children = parseInt(document.getElementById('vek-children').value, 10) || 0;
      var r = calc({ birth: birth, sex: sex, children: children });

      var big = document.getElementById('vek-big');
      var bigLabel = document.getElementById('vek-big-label');
      var err = document.getElementById('vek-error');
      var breakdown = document.getElementById('vek-breakdown');
      if (r.error) {
        if (err) {
          err.style.display = '';
          err.textContent = r.error === 'bad-date' ? 'Zadajte platný dátum narodenia.' : 'Kalkulačka pokrýva ročníky 1960 až 2010. Pre staršie ročníky si overte tabuľku Sociálnej poisťovne; pre ročníky po roku 2010 prognóza ešte neexistuje.';
        }
        if (breakdown) breakdown.style.display = 'none';
        if (big) big.textContent = '—';
        if (bigLabel) bigLabel.textContent = 'Dátum odchodu do dôchodku';
        return;
      }
      if (err) err.style.display = 'none';
      if (breakdown) breakdown.style.display = '';
      if (big) big.textContent = r.date + (r.estimate ? ' (ODHAD)' : '');
      if (bigLabel) bigLabel.textContent = 'Dátum odchodu do dôchodku';

      var set = function (id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
      };
      set('vek-general', r.generalText);
      set('vek-own', r.ownText);
      set('vek-status', r.estimate ? 'ODHAD — definitívny vek ešte nebol stanovený vyhláškou (prognóza 392/2024)' : 'Pevne stanovený vek');
      var condRow = document.getElementById('vek-cond-row');
      var condNote = document.getElementById('vek-condnote');
      if (r.conditional) {
        if (condRow) condRow.style.display = '';
        set('vek-cond', r.conditionalText + ' → ' + r.conditionalDate);
        if (condNote) condNote.textContent = 'Podmienený dátum: platí len vtedy, ak sa výchova dieťaťa nemôže zohľadniť žene. Jednému dieťaťu sa zníženie započíta len jednému rodičovi.';
      } else {
        if (condRow) condRow.style.display = 'none';
        if (r.conditionalNote === 'overiť' && condNote) {
          condNote.style.display = '';
          condNote.textContent = 'Pre mužov z ročníkov do 1966 sa zníženie za deti riadi historickou tabuľkou Sociálnej poisťovne a táto kalkulačka ho pre tieto ročníky nepočíta. Všeobecný dátum vyššie platí bez zníženia.';
        } else if (condNote) {
          condNote.textContent = '';
        }
      }
    }

    btn.addEventListener('click', run);
    run();
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calc: calc, fmtAge: fmtAge, fmtDate: fmtDate };
  }
})();
