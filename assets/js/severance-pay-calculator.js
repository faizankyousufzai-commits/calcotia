/* Spain severance pay calculator (Estatuto de los Trabajadores, RDL 2/2015).
   Pure calculation functions first; DOM wiring at the bottom runs only in a browser.
   Rules: daily salary = gross annual salary including prorated pagas extra / 365;
   objective dismissal 20 days/year, cap 12 months (365 days), 15 days' notice or
   pay in lieu; unfair dismissal 33 days/year, cap 24 months (720 days); pre-2012
   contracts split at 12 Feb 2012 (45 days/year before, 33 days/year after, combined
   cap 720 days, except that if the pre-2012 part alone exceeds 720 days that
   amount is the cap, with an absolute ceiling of 42 months = 1,260 days);
   fixed-term contract end 12 days/year, no cap; fair disciplinary dismissal EUR 0
   severance; null dismissal has no money amount (reinstatement). Partial years
   are prorated by months: full calendar months plus remaining days as a fraction
   of a 30-day month. The pre-2012 split counts service up to and including
   11 Feb 2012 at 45 days and from 12 Feb 2012 at 33 days. Amounts are GROSS. */
var ES_SPLIT = new Date(2012, 1, 12);

function esFracMonths(d1, d2) {
  if (d2 <= d1) return 0;
  var fm = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
  var cursor = new Date(d1.getTime());
  cursor.setMonth(d1.getMonth() + fm);
  var rem = Math.round((d2.getTime() - cursor.getTime()) / 86400000);
  if (rem < 0) {
    fm--;
    cursor = new Date(d1.getTime());
    cursor.setMonth(d1.getMonth() + fm);
    rem = Math.round((d2.getTime() - cursor.getTime()) / 86400000);
  }
  return fm + rem / 30;
}

function esRound2(x) {
  return Math.round(x * 100) / 100;
}

function esFmtDays(d) {
  if (Math.abs(d - Math.round(d)) < 0.005) return String(Math.round(d));
  return d.toFixed(2);
}

function esCalc(inp) {
  var annual = inp.monthly * inp.payments;
  var daily = annual / 365;
  var preMonths = 0;
  var postMonths = 0;
  if (inp.start < ES_SPLIT) preMonths = esFracMonths(inp.start, inp.term < ES_SPLIT ? inp.term : ES_SPLIT);
  if (inp.term > ES_SPLIT) postMonths = esFracMonths(inp.start > ES_SPLIT ? inp.start : ES_SPLIT, inp.term);
  var preYears = preMonths / 12;
  var postYears = postMonths / 12;
  var totalYears = preYears + postYears;
  var sevDays = 0;
  var capNote = 'No cap applied';
  var preDays = 0;
  var postDays = 0;
  if (inp.mode === 'objective') {
    sevDays = 20 * totalYears;
    if (sevDays > 365) { sevDays = 365; capNote = 'Capped at 12 months (365 days)'; }
  } else if (inp.mode === 'unfair') {
    preDays = 45 * preYears;
    postDays = 33 * postYears;
    var total = preDays + postDays;
    if (preDays > 720) {
      sevDays = Math.min(preDays, 1260);
      capNote = 'Pre-2012 part alone exceeds 720 days, so it becomes the cap (absolute ceiling 42 months / 1,260 days)';
    } else if (total > 720) {
      sevDays = 720;
      capNote = 'Capped at 24 months (720 days)';
    } else {
      sevDays = total;
    }
  } else if (inp.mode === 'fixedterm') {
    sevDays = 12 * totalYears;
  } else if (inp.mode === 'disciplinary') {
    sevDays = 0;
  }
  var severance = inp.mode === 'null' ? null : esRound2(sevDays * daily);
  var notice = 0;
  if (inp.mode === 'objective' && !inp.noticeGiven) notice = esRound2(15 * daily);
  var finiquito = esRound2(inp.unpaidDays * daily + inp.unusedVacDays * daily + inp.extraAccrued);
  var total = null;
  if (inp.mode !== 'null') total = esRound2(severance + notice + finiquito);
  var objectiveAlt = null;
  if (inp.mode === 'unfair') {
    var altDays = Math.min(20 * totalYears, 365);
    objectiveAlt = esRound2(altDays * daily);
  }
  return {
    annual: esRound2(annual),
    daily: esRound2(daily),
    dailyRaw: daily,
    preYears: Math.round(preYears * 100) / 100,
    postYears: Math.round(postYears * 100) / 100,
    totalYears: Math.round(totalYears * 100) / 100,
    preDays: esRound2(preDays),
    postDays: esRound2(postDays),
    sevDays: esRound2(sevDays),
    capNote: capNote,
    severance: severance,
    notice: notice,
    finiquito: finiquito,
    total: total,
    objectiveAlt: objectiveAlt,
    objectiveAltDays: esRound2(Math.min(20 * totalYears, 365))
  };
}

function esFmt(n) {
  return '€' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    var $ = function (id) { return document.getElementById(id); };
    function mode() {
      var els = document.getElementsByName('es-mode');
      for (var i = 0; i < els.length; i++) if (els[i].checked) return els[i].value;
      return 'objective';
    }
    function run() {
      var m = mode();
      var noticeRow = $('es-notice-row');
      if (noticeRow) noticeRow.hidden = (m !== 'objective');
      var start = new Date($('es-start').value + 'T00:00:00');
      var term = new Date($('es-term').value + 'T00:00:00');
      if (isNaN(start) || isNaN(term) || term < start) {
        $('es-note').textContent = 'Check the dates: the termination date must be on or after the start date.';
        return;
      }
      $('es-note').textContent = '';
      var r = esCalc({
        mode: m,
        start: start,
        term: term,
        monthly: parseFloat($('es-monthly').value) || 0,
        payments: parseFloat($('es-payments').value) || 12,
        noticeGiven: $('es-notice').checked,
        unpaidDays: parseFloat($('es-unpaid').value) || 0,
        unusedVacDays: parseFloat($('es-vac').value) || 0,
        extraAccrued: parseFloat($('es-extra').value) || 0
      });
      var tbody = $('es-rows');
      tbody.innerHTML = '';
      function row(a, b) {
        var tr = document.createElement('tr');
        var x = document.createElement('td'); x.textContent = a;
        var y = document.createElement('td'); y.textContent = b;
        tr.appendChild(x); tr.appendChild(y); tbody.appendChild(tr);
      }
      row('Gross annual salary (incl. prorated pagas extra)', esFmt(r.annual));
      row('Daily salary (annual / 365)', esFmt(r.daily));
      if (m === 'unfair' && r.preYears > 0) {
        row('Service before 12 Feb 2012', r.preYears + ' years x 45 days = ' + esFmtDays(r.preDays) + ' days');
        row('Service from 12 Feb 2012', r.postYears + ' years x 33 days = ' + esFmtDays(r.postDays) + ' days');
      } else if (m !== 'null') {
        row('Years of service counted', String(r.totalYears));
      }
      if (m === 'null') {
        $('es-big').textContent = 'No money amount';
        $('es-big-label').textContent = 'Null dismissal: reinstatement, not compensation';
        row('Severance', 'Not applicable: a null dismissal means reinstatement plus processing wages (salarios de tramitación). Get advice before accepting any money offer.');
      } else {
        row('Severance days', esFmtDays(r.sevDays) + ' days (' + r.capNote + ')');
        row('Severance amount', esFmt(r.severance));
        if (m === 'objective') row('Notice pay (15 days, if notice was not given)', esFmt(r.notice));
        if (m === 'unfair' && r.objectiveAlt !== null) row('For comparison: if it had been an objective dismissal (20 days, capped at 365)', esFmt(r.objectiveAlt) + ' (' + esFmtDays(r.objectiveAltDays) + ' days)');
        row('Finiquito (final settlement)', esFmt(r.finiquito));
        row('Total termination package (gross)', esFmt(r.total));
        $('es-big').textContent = esFmt(r.total);
        $('es-big-label').textContent = 'Total termination package (gross)';
      }
    
    var resEl = document.getElementById('es-result'); if (resEl) { resEl.classList.add('show'); }
}
    ['es-start', 'es-term', 'es-monthly', 'es-payments', 'es-unpaid', 'es-vac', 'es-extra'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', run);
      if (el) el.addEventListener('change', run);
    });
    document.querySelectorAll('input[name="es-mode"]').forEach(function (el) { el.addEventListener('change', run); });
    var nt = $('es-notice');
    if (nt) nt.addEventListener('change', run);
    var btn = $('es-btn');
    if (btn) btn.addEventListener('click', run);
    run();
  });
}
