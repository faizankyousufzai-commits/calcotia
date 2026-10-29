(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function isWeekday(d) { var day = d.getDay(); return day !== 0 && day !== 6; }
  function fmt(d) {
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return day + '.' + m + '.' + y;
  }
  function fmtRange(a, b) { return a ? fmt(a) + ' – ' + fmt(b) : '–'; }
  function nextWeekday(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    while (!isWeekday(x)) x.setDate(x.getDate() + 1);
    return x;
  }
  function prevWeekday(d) {
    var x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    while (!isWeekday(x)) x.setDate(x.getDate() - 1);
    return x;
  }
  /* Count benefit days backwards from the day before the birth date. */
  function preBirth(date) {
    var end = prevWeekday(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1));
    var d = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    var count = 0;
    while (count < 14) {
      d.setDate(d.getDate() - 1);
      if (isWeekday(d)) count++;
    }
    return { start: d, end: end, days: 15 };
  }
  /* Walk forward from start, consuming gradedFraction of a benefit day
     per weekday, until days benefit days are used. Returns last weekday. */
  function addBenefitDays(start, days, graded) {
    var d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    var used = 0;
    var last = null;
    while (used < days - 0.0001) {
      if (isWeekday(d)) { used += graded; last = new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
      if (used < days - 0.0001) d.setDate(d.getDate() + 1);
    }
    return last;
  }
  function blockFrom(start, days, graded) {
    if (!days || !start) return null;
    var s = nextWeekday(start);
    var e = addBenefitDays(s, days, graded);
    return { start: s, end: e, days: days };
  }
  function after(block) {
    if (!block) return null;
    var d = new Date(block.end.getFullYear(), block.end.getMonth(), block.end.getDate() + 1);
    return nextWeekday(d);
  }
  function calc() {
    var raw = $('pk-dato').value;
    if (!raw) { $('pk-result').querySelector('.big').textContent = 'Velg en dato først'; return; }
    var parts = raw.split('-');
    var birth = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    var coverage = $('pk-grad').value;
    var total = coverage === '80' ? 306 : 245;
    var quota = coverage === '80' ? 95 : 75;
    var shared = coverage === '80' ? 101 : 80;
    var who = $('pk-hvem').value;
    var sharedMorPct = Math.min(100, Math.max(0, parseFloat($('pk-felles-mor').value) || 0));
    var gradedPct = Math.min(100, Math.max(10, parseFloat($('pk-gradert').value) || 100));
    var graded = gradedPct / 100;
    var postStart = nextWeekday(birth);
    var pre = null, morKv, fellesMor, fellesFar, farKv;
    var morDays = 0, farDays = 0;
    if (who === 'mother') {
      /* Aleneomsorg: mor får hele perioden, inkludert fedrekvoten som
         overføres til henne. Den vises som en egen blokk etter fellesperioden. */
      pre = preBirth(birth);
      morKv = blockFrom(postStart, quota, graded);
      fellesMor = blockFrom(after(morKv), shared, graded);
      fellesFar = null;
      farKv = blockFrom(after(fellesMor), quota, graded);
      morDays = 15 + quota + shared + quota;
    } else if (who === 'father') {
      var fatherTotal = total - 45;
      farKv = blockFrom(postStart, fatherTotal, graded);
      pre = null; morKv = null; fellesMor = null; fellesFar = null;
      farDays = fatherTotal;
    } else {
      pre = preBirth(birth);
      var cursor = postStart;
      morKv = blockFrom(cursor, quota, graded);
      cursor = after(morKv);
      var sharedMor = Math.round(shared * sharedMorPct / 100);
      var sharedFar = shared - sharedMor;
      fellesMor = blockFrom(cursor, sharedMor, graded);
      if (fellesMor) cursor = after(fellesMor);
      fellesFar = blockFrom(cursor, sharedFar, graded);
      if (fellesFar) cursor = after(fellesFar);
      farKv = blockFrom(cursor, quota, graded);
      morDays = 15 + quota + sharedMor;
      farDays = sharedFar + quota;
    }
    var lastBlock = farKv || fellesMor || morKv;
    var paidEnd = lastBlock ? lastBlock.end : null;
    var postBlocks = [morKv, fellesMor, fellesFar, farKv].filter(Boolean);
    var calStart = postBlocks.length ? postBlocks[0].start : null;
    var calWeeks = '';
    if (calStart && paidEnd) {
      var calDays = Math.round((paidEnd - calStart) / 86400000) + 1;
      calWeeks = Math.ceil(calDays / 7) + ' kalenderuker (' + fmt(calStart) + ' – ' + fmt(paidEnd) + ')';
      if (gradedPct === 100) calWeeks = Math.ceil(calDays / 7) + ' kalenderuker, lik stønadsukene ved fullt uttak';
    }
    var ulonnet = '';
    if ($('pk-ulonnet').value === '1' && paidEnd) {
      var u = new Date(paidEnd.getFullYear(), paidEnd.getMonth(), paidEnd.getDate());
      u.setMonth(u.getMonth() + 12);
      ulonnet = fmt(u) + ' (12 måneder etter siste stønadsdag)';
    } else {
      ulonnet = 'Ikke valgt';
    }
    $('pk-total').textContent = total + ' stønadsdager';
    $('pk-grad-res').textContent = coverage === '80' ? '80 % – 61 uker og 1 dag' : '100 % – 49 uker';
    $('pk-for').textContent = pre ? '15 dager: ' + fmtRange(pre.start, pre.end) : 'Ingen (bare far / medmor)';
    $('pk-mor-kvote').textContent = morKv ? morKv.days + ' dager: ' + fmtRange(morKv.start, morKv.end) : '–';
    $('pk-felles-mor-res').textContent = fellesMor ? fellesMor.days + ' dager: ' + fmtRange(fellesMor.start, fellesMor.end) : '–';
    $('pk-felles-far-res').textContent = fellesFar ? fellesFar.days + ' dager: ' + fmtRange(fellesFar.start, fellesFar.end) : '–';
    $('pk-far-kvote').textContent = farKv ? (who === 'mother' ? 'Overført til mor ved aleneomsorg: ' : '') + farKv.days + ' dager: ' + fmtRange(farKv.start, farKv.end) : '–';
    $('pk-mor-sum').textContent = morDays ? morDays + ' dager' : '0 dager';
    $('pk-far-sum').textContent = farDays ? farDays + ' dager' : '0 dager';
    $('pk-slutt').textContent = paidEnd ? fmt(paidEnd) : '–';
    $('pk-kalender').textContent = calWeeks;
    $('pk-ulonnet-res').textContent = ulonnet;
    var note = [];
    if (who === 'father') note.push('Far / medmor alene får hele perioden minus 9 uker forbeholdt mor (3 uker før og 6 uker etter fødselen).');
    if (gradedPct < 100) note.push('Gradert uttak på ' + gradedPct + ' prosent strekker kalenderperioden, men endrer ikke antall stønadsdager.');
    if (who === 'mother') note.push('Ved aleneomsorg kan mor også ta inntil 24 måneder ulønnet permisjon til sammen; kalkulatoren viser 12 måneder som standardvalg.');
    $('pk-arbeid').textContent = note.join(' ');
  }
  document.getElementById('pk-btn').addEventListener('click', calc);
  calc();
})();
