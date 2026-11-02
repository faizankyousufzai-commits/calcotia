/* Mexico finiquito calculator (Ley Federal del Trabajo).
   Pure calculation functions first; DOM wiring at the bottom runs only in a browser.
   Rules (2026 figures): daily salary = monthly / 30; aguinaldo prorated by calendar-year
   days / 365; vacation prorated by days since the last period end / 365 using the
   entitlement of the cycle in progress; prima vacacional 25% of vacation pay;
   SDI factor = (365 + aguinaldo days + vacation days x 0.25) / 365 using the
   vacation entitlement of the last completed year of service (the standard SDI
   integration table by seniority); prima de antiguedad = 12 days x completed years,
   daily rate capped at twice the minimum wage of the zone; 90-day indemnity and
   20-day payment use uncapped SDI; seniority premium and 20-day payment use
   completed years of service only. ISR figures are an exempt/taxable split only:
   the total shown is GROSS. */
var MX_UMA = 117.31;
var MX_MINWAGE = { general: 315.04, zlfn: 440.87 };

function mxVacationDays(cycle) {
  if (cycle <= 5) return 10 + 2 * cycle;
  if (cycle <= 10) return 22;
  return 22 + 2 * Math.floor((cycle - 6) / 5);
}

function mxAddYears(date, years) {
  var d = new Date(date.getTime());
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function mxDaysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/* Completed 12-month periods: largest n with addYears(hire, n) <= term + 1 day.
   A period that ends on the last day of a month counts as complete (e.g. hired
   1 Mar 2022, terminated 28 Feb 2026 = 4 completed years). */
function mxCompletedYears(hire, term) {
  var n = term.getFullYear() - hire.getFullYear();
  var termPlus = new Date(term.getTime());
  termPlus.setDate(termPlus.getDate() + 1);
  while (n > 0 && mxAddYears(hire, n) > termPlus) n--;
  return n < 0 ? 0 : n;
}

function mxRound2(x) {
  return Math.round(x * 100) / 100;
}

function mxCalc(inp) {
  var daily = inp.monthly / 30;
  var cy = mxCompletedYears(inp.hire, inp.term);
  var cycle = cy + 1;
  var vacEnt = mxVacationDays(cycle);
  var sdiVacDays = cy === 0 ? 12 : mxVacationDays(cy);
  var cycleStart = mxAddYears(inp.hire, cy);
  /* Days elapsed in the current cycle, counting both the cycle-start day and
     the termination day (the period model: a period ending on the last day of
     a month is complete, and the next cycle's first day counts). */
  var daysIntoCycle = Math.max(0, mxDaysBetween(cycleStart, inp.term) + 1);
  var propVacDays = Math.max(0, vacEnt * daysIntoCycle / 365 - inp.takenVacDays);
  var propVacPay = mxRound2(propVacDays * daily);
  var pendingVacPay = mxRound2(inp.pendingVacDays * daily);
  var primaVac = mxRound2((propVacPay + pendingVacPay) * 0.25);
  var yearStart = new Date(inp.term.getFullYear(), 0, 1);
  var calStart = inp.hire > yearStart ? inp.hire : yearStart;
  var calDays = mxDaysBetween(calStart, inp.term) + 1;
  var aguinaldoPay = mxRound2(inp.aguinaldoDays * calDays / 365 * daily);
  var unpaidPay = mxRound2(inp.unpaidDays * daily);
  var sdiFactor = (365 + inp.aguinaldoDays + sdiVacDays * 0.25) / 365;
  var sdi = daily * sdiFactor;
  var cap = 2 * MX_MINWAGE[inp.zone];
  var prima = 0;
  var primaEligible = inp.mode !== 'resignation' || cy >= 15;
  if (primaEligible) prima = mxRound2(12 * cy * Math.min(daily, cap));
  var indem90 = 0;
  var indem20 = 0;
  if (inp.mode === 'unjustified') {
    indem90 = mxRound2(90 * sdi);
    if (inp.twentyOn) indem20 = mxRound2(20 * cy * sdi);
  }
  var finiquito, liquidacion;
  if (inp.mode === 'unjustified') {
    finiquito = mxRound2(unpaidPay + propVacPay + pendingVacPay + primaVac + aguinaldoPay + inp.ptu);
    liquidacion = mxRound2(indem90 + indem20 + prima);
  } else {
    finiquito = mxRound2(unpaidPay + propVacPay + pendingVacPay + primaVac + aguinaldoPay + inp.ptu + prima);
    liquidacion = 0;
  }
  var grand = mxRound2(finiquito + liquidacion);
  var agExempt = Math.min(aguinaldoPay, mxRound2(30 * MX_UMA));
  var pvExempt = Math.min(primaVac, mxRound2(15 * MX_UMA));
  var indExempt = Math.min(mxRound2(indem90 + indem20 + prima), mxRound2(90 * MX_UMA * cy));
  return {
    daily: mxRound2(daily),
    completedYears: cy,
    cycle: cycle,
    vacEnt: vacEnt,
    sdiVacDays: sdiVacDays,
    daysIntoCycle: daysIntoCycle,
    propVacDays: mxRound2(propVacDays),
    propVacPay: propVacPay,
    pendingVacPay: pendingVacPay,
    primaVac: primaVac,
    calDays: calDays,
    aguinaldoPay: aguinaldoPay,
    unpaidPay: unpaidPay,
    sdi: mxRound2(sdi),
    sdiFactor: Math.round(sdiFactor * 10000) / 10000,
    primaCap: cap,
    prima: prima,
    indem90: indem90,
    indem20: indem20,
    finiquito: finiquito,
    liquidacion: liquidacion,
    grand: grand,
    agExempt: mxRound2(agExempt),
    agTaxable: mxRound2(aguinaldoPay - agExempt),
    pvExempt: mxRound2(pvExempt),
    pvTaxable: mxRound2(primaVac - pvExempt),
    indExempt: mxRound2(indExempt),
    indTaxable: mxRound2(mxRound2(indem90 + indem20 + prima) - indExempt)
  };
}

function mxFmt(n) {
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    var $ = function (id) { return document.getElementById(id); };
    function mode() {
      var els = document.getElementsByName('mx-mode');
      for (var i = 0; i < els.length; i++) if (els[i].checked) return els[i].value;
      return 'resignation';
    }
    function zone() {
      var els = document.getElementsByName('mx-zone');
      for (var i = 0; i < els.length; i++) if (els[i].checked) return els[i].value;
      return 'general';
    }
    function run() {
      var m = mode();
      var twentyRow = $('mx-twenty-row');
      if (twentyRow) twentyRow.hidden = (m !== 'unjustified');
      var hire = new Date($('mx-hire').value + 'T00:00:00');
      var term = new Date($('mx-term').value + 'T00:00:00');
      if (isNaN(hire) || isNaN(term) || term < hire) {
        $('mx-note').textContent = 'Check the dates: the termination date must be on or after the hire date.';
        return;
      }
      var r = mxCalc({
        mode: m,
        hire: hire,
        term: term,
        monthly: parseFloat($('mx-monthly').value) || 0,
        unpaidDays: parseFloat($('mx-unpaid').value) || 0,
        pendingVacDays: parseFloat($('mx-pending').value) || 0,
        takenVacDays: parseFloat($('mx-taken').value) || 0,
        aguinaldoDays: parseFloat($('mx-aguinaldo').value) || 15,
        zone: zone(),
        twentyOn: m === 'unjustified' && $('mx-twenty').checked,
        ptu: parseFloat($('mx-ptu').value) || 0
      });
      $('mx-note').textContent = '';
      $('mx-big').textContent = mxFmt(r.grand);
      $('mx-big-label').textContent = m === 'unjustified' ? 'Gross grand total (finiquito + liquidación)' : 'Gross finiquito total';
      var rows = [
        ['Daily salary (monthly / 30)', mxFmt(r.daily)],
        ['Years of service completed', String(r.completedYears)],
        ['Unpaid salary', mxFmt(r.unpaidPay)],
        ['Proportional vacation (' + r.propVacDays.toFixed(2) + ' days)', mxFmt(r.propVacPay)],
        ['Pending prior-years vacation', mxFmt(r.pendingVacPay)],
        ['Prima vacacional (25%)', mxFmt(r.primaVac)],
        ['Prorated aguinaldo (' + r.calDays + ' days in ' + term.getFullYear() + ')', mxFmt(r.aguinaldoPay)],
        ['PTU share (entered by you)', mxFmt(parseFloat($('mx-ptu').value) || 0)]
      ];
      if (m !== 'unjustified') rows.push(['Prima de antigüedad (12 days x ' + r.completedYears + ' years, capped at ' + mxFmt(r.primaCap) + '/day)', mxFmt(r.prima)]);
      rows.push(['Finiquito subtotal', mxFmt(r.finiquito)]);
      if (m === 'unjustified') {
        rows.push(['SDI (factor ' + r.sdiFactor + ')', mxFmt(r.sdi)]);
        rows.push(['90-day indemnity (90 x SDI)', mxFmt(r.indem90)]);
        rows.push(['20 days per year x ' + r.completedYears + ' years (if enabled)', mxFmt(r.indem20)]);
        rows.push(['Prima de antigüedad (12 days x ' + r.completedYears + ' years, capped at ' + mxFmt(r.primaCap) + '/day)', mxFmt(r.prima)]);
        rows.push(['Liquidación subtotal', mxFmt(r.liquidacion)]);
      }
      rows.push(['Gross grand total', mxFmt(r.grand)]);
      rows.push(['ISR: aguinaldo exempt / taxable', mxFmt(r.agExempt) + ' / ' + mxFmt(r.agTaxable)]);
      rows.push(['ISR: prima vacacional exempt / taxable', mxFmt(r.pvExempt) + ' / ' + mxFmt(r.pvTaxable)]);
      rows.push(['ISR: indemnity + prima exempt / taxable (90 UMA x years)', mxFmt(r.indExempt) + ' / ' + mxFmt(r.indTaxable)]);
      var tbody = $('mx-rows');
      tbody.innerHTML = '';
      rows.forEach(function (row) {
        var tr = document.createElement('tr');
        var a = document.createElement('td'); a.textContent = row[0];
        var b = document.createElement('td'); b.textContent = row[1];
        tr.appendChild(a); tr.appendChild(b); tbody.appendChild(tr);
      });
    }
    ['mx-hire', 'mx-term', 'mx-monthly', 'mx-unpaid', 'mx-pending', 'mx-taken', 'mx-aguinaldo', 'mx-ptu'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', run);
      if (el) el.addEventListener('change', run);
    });
    var radios = document.querySelectorAll('input[name="mx-mode"], input[name="mx-zone"]');
    radios.forEach(function (el) { el.addEventListener('change', run); });
    var tw = $('mx-twenty');
    if (tw) tw.addEventListener('change', run);
    var btn = $('mx-btn');
    if (btn) btn.addEventListener('click', run);
    run();
  });
}
