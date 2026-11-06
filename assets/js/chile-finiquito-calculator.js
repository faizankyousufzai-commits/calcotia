/* Chile finiquito calculator (Codigo del Trabajo, Arts. 159-163, 172, 177).
   Pure calculation functions first; DOM wiring at the bottom runs only in a browser.
   Rules: 1 month per countable year from 1 year of service; a fraction over 6 months
   counts as a full year; 11-year (330-day) cap except pre-14-Aug-1981 contracts;
   monthly pay for both indemnities capped at 90 UF; notice pay 1 month capped at
   90 UF when 30 days' notice was not given (Art. 161 only); feriado 15 business
   days/year (20 in Magallanes, Aysen, Palena) = 1.25 per full month plus 1.25/30
   per day of a partial month, minus days taken, converted to calendar days by
   counting actual Saturdays, Sundays and Chilean public holidays in the window,
   paid at monthly salary / 30 (uncapped: the 90 UF cap covers the Art. 162/163
   indemnities, and feriado compensation is not one of them); obra/faena 2.5 days
   per month, fraction over 15 days counts, no 11-year cap, 90 UF base cap still
   applies; AFC deduction Art. 161 only, employer contributions only, against the
   years-of-service indemnity only. Amounts are GROSS. */
var CL_UF_DEFAULT = 41252.94;

function clGoodFriday(year) {
  var a = year % 19;
  var b = Math.floor(year / 100);
  var c = year % 100;
  var d = Math.floor(b / 4);
  var e = b % 4;
  var f = Math.floor((b + 8) / 25);
  var g = Math.floor((b - f + 1) / 3);
  var h = (19 * a + b - d - g + 15) % 30;
  var i = Math.floor(c / 4);
  var k = c % 4;
  var l = (32 + 2 * e + 2 * i - h - k) % 7;
  var m = Math.floor((a + 11 * h + 22 * l) / 451);
  var month = Math.floor((h + l - 7 * m + 114) / 31);
  var day = ((h + l - 7 * m + 114) % 31) + 1;
  var easter = new Date(year, month - 1, day);
  easter.setDate(easter.getDate() - 2);
  return easter;
}

function clIsHoliday(d) {
  var md = (d.getMonth() + 1) + '-' + d.getDate();
  var fixed = ['1-1', '5-1', '5-21', '6-29', '7-16', '8-15', '9-18', '9-19', '10-12', '10-31', '11-1', '12-8', '12-25'];
  if (fixed.indexOf(md) >= 0) return true;
  var gf = clGoodFriday(d.getFullYear());
  return d.getMonth() === gf.getMonth() && d.getDate() === gf.getDate();
}

/* Day-by-day conversion: from the day after termination, each weekend day and
   public holiday counts as one calendar day; each business day consumes up to
   one business day, and a fractional final business day counts proportionally. */
function clFeriadoCalendarDays(termDate, businessDays) {
  var d = new Date(termDate.getTime());
  var cal = 0;
  var rem = businessDays;
  var guard = 0;
  while (rem > 0 && guard < 4000) {
    d.setDate(d.getDate() + 1);
    guard++;
    var dow = d.getDay();
    if (dow === 0 || dow === 6 || clIsHoliday(d)) {
      cal += 1;
    } else {
      var use = Math.min(1, rem);
      cal += use;
      rem -= use;
    }
  }
  return Math.round(cal * 100) / 100;
}

function clMonthsBetween(start, end) {
  var m = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  var cursor = new Date(start.getTime());
  cursor.setMonth(start.getMonth() + m);
  var rem = Math.round((end.getTime() - cursor.getTime()) / 86400000);
  if (rem < 0) {
    m--;
    cursor = new Date(start.getTime());
    cursor.setMonth(start.getMonth() + m);
    rem = Math.round((end.getTime() - cursor.getTime()) / 86400000);
  }
  return { months: m, remDays: rem };
}

function clRound0(x) {
  return Math.round(x);
}

function clCalc(inp) {
  var base = inp.variableOn ? (inp.var1 + inp.var2 + inp.var3) / 3 : inp.monthly;
  var uf = inp.uf > 0 ? inp.uf : CL_UF_DEFAULT;
  var cap = Math.round(90 * uf);
  var cappedBase = Math.min(base, cap);
  var svc = clMonthsBetween(inp.start, inp.term);
  var totalMonths = svc.months + svc.remDays / 30;
  var years = Math.floor(svc.months / 12);
  var remMonths = svc.months % 12;
  var frac = remMonths + svc.remDays / 30;
  var countable = 0;
  if (totalMonths >= 12) {
    countable = years + (frac > 6 ? 1 : 0);
    if (!inp.pre1981 && countable > 11) countable = 11;
  }
  var obraMonths = svc.months + (svc.remDays > 15 ? 1 : 0);
  var daily = base / 30;
  var pendingSalary = clRound0(inp.unpaidDays * daily);
  var indemnity = 0;
  var indemnityLabel = '';
  if (inp.cause === '161') {
    indemnity = clRound0(countable * cappedBase);
    indemnityLabel = countable + ' years x ' + clFmt(cappedBase);
  } else if (inp.cause === 'obra') {
    indemnity = clRound0(obraMonths * 2.5 * (cappedBase / 30));
    indemnityLabel = obraMonths + ' months x 2.5 days x ' + clFmt(Math.round(cappedBase / 30)) + '/day';
  }
  var notice = 0;
  if (inp.cause === '161' && !inp.noticeGiven) notice = clRound0(cappedBase);
  var accrual = inp.extreme ? 20 / 12 : 15 / 12;
  var businessDays = Math.max(0, accrual * inp.feriadoMonths + (accrual / 30) * inp.feriadoExtraDays - inp.takenDays);
  businessDays = Math.round(businessDays * 100) / 100;
  var calDays = clFeriadoCalendarDays(inp.term, businessDays);
  var feriado = clRound0(calDays * daily);
  var gratif = inp.gratif > 0 ? clRound0(inp.gratif) : 0;
  var afc = 0;
  if (inp.cause === '161' && inp.afc > 0) afc = clRound0(inp.afc);
  var indemnityAfterAfc = Math.max(0, indemnity - afc);
  var total = indemnityAfterAfc + notice + feriado + pendingSalary + gratif;
  return {
    base: clRound0(base),
    cap: cap,
    cappedBase: clRound0(cappedBase),
    capBites: base > cap,
    serviceMonths: svc.months,
    serviceRemDays: svc.remDays,
    countableYears: countable,
    obraMonths: obraMonths,
    daily: Math.round(daily * 100) / 100,
    pendingSalary: pendingSalary,
    indemnity: indemnity,
    indemnityLabel: indemnityLabel,
    notice: notice,
    feriadoBusinessDays: businessDays,
    feriadoCalDays: calDays,
    feriado: feriado,
    gratif: gratif,
    afc: afc,
    total: total
  };
}

function clFmt(n) {
  return 'CLP ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    var $ = function (id) { return document.getElementById(id); };
    function cause() {
      var els = document.getElementsByName('cl-cause');
      for (var i = 0; i < els.length; i++) if (els[i].checked) return els[i].value;
      return '161';
    }
    function run() {
      var c = cause();
      var noticeRow = $('cl-notice-row');
      if (noticeRow) noticeRow.hidden = (c !== '161');
      var afcRow = $('cl-afc-row');
      if (afcRow) afcRow.hidden = (c !== '161');
      var varRow = $('cl-var-row');
      var varOn = $('cl-variable').checked;
      if (varRow) varRow.hidden = !varOn;
      var start = new Date($('cl-start').value + 'T00:00:00');
      var term = new Date($('cl-term').value + 'T00:00:00');
      if (isNaN(start) || isNaN(term) || term < start) {
        $('cl-note').textContent = 'Check the dates: the termination date must be on or after the start date.';
        return;
      }
      $('cl-note').textContent = '';
      var r = clCalc({
        cause: c,
        start: start,
        term: term,
        monthly: parseFloat($('cl-monthly').value) || 0,
        variableOn: varOn,
        var1: parseFloat($('cl-var1').value) || 0,
        var2: parseFloat($('cl-var2').value) || 0,
        var3: parseFloat($('cl-var3').value) || 0,
        uf: parseFloat($('cl-uf').value) || CL_UF_DEFAULT,
        unpaidDays: parseFloat($('cl-unpaid').value) || 0,
        feriadoMonths: parseFloat($('cl-fmonths').value) || 0,
        feriadoExtraDays: parseFloat($('cl-fdays').value) || 0,
        takenDays: parseFloat($('cl-taken').value) || 0,
        extreme: $('cl-extreme').checked,
        noticeGiven: $('cl-notice').checked,
        gratif: parseFloat($('cl-gratif').value) || 0,
        afc: c === '161' ? (parseFloat($('cl-afc').value) || 0) : 0,
        pre1981: $('cl-pre1981').checked
      });
      $('cl-big').textContent = clFmt(r.total);
      var rows = [
        ['Last monthly remuneration used', clFmt(r.base)],
        ['90 UF cap on the indemnity base', clFmt(r.cap) + (r.capBites ? ' (cap applies: base used is ' + clFmt(r.cappedBase) + ')' : ' (no cap: salary is below 90 UF)')],
        ['Service counted', r.serviceMonths + ' months + ' + r.serviceRemDays + ' days']
      ];
      if (c === 'obra') {
        rows.push(['Obra/faena indemnity (' + r.indemnityLabel + ')', clFmt(r.indemnity)]);
      } else {
        rows.push(['Indemnización por años de servicio' + (r.indemnityLabel ? ' (' + r.indemnityLabel + ')' : ''), clFmt(r.indemnity)]);
      }
      if (c === '161') rows.push(['Indemnización sustitutiva del aviso previo', clFmt(r.notice)]);
      rows.push(['Feriado proporcional (' + r.feriadoBusinessDays + ' business days = ' + r.feriadoCalDays + ' calendar days)', clFmt(r.feriado)]);
      rows.push(['Pending salary (unpaid days in final month)', clFmt(r.pendingSalary)]);
      if (r.gratif > 0) rows.push(['Pending legal gratificación (entered by you)', clFmt(r.gratif)]);
      if (r.afc > 0) rows.push(['AFC employer-contribution deduction (Art. 161 only)', '−' + clFmt(r.afc)]);
      rows.push(['TOTAL finiquito (gross)', clFmt(r.total)]);
      var tbody = $('cl-rows');
      tbody.innerHTML = '';
      rows.forEach(function (row) {
        var tr = document.createElement('tr');
        var a = document.createElement('td'); a.textContent = row[0];
        var b = document.createElement('td'); b.textContent = row[1];
        tr.appendChild(a); tr.appendChild(b); tbody.appendChild(tr);
      });
    
    var resEl = document.getElementById('cl-result'); if (resEl) { resEl.classList.add('show'); }
}
    ['cl-start', 'cl-term', 'cl-monthly', 'cl-uf', 'cl-unpaid', 'cl-fmonths', 'cl-fdays', 'cl-taken', 'cl-gratif', 'cl-afc', 'cl-var1', 'cl-var2', 'cl-var3'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', run);
      if (el) el.addEventListener('change', run);
    });
    document.querySelectorAll('input[name="cl-cause"]').forEach(function (el) { el.addEventListener('change', run); });
    ['cl-variable', 'cl-extreme', 'cl-notice', 'cl-pre1981'].forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('change', run);
    });
    var btn = $('cl-btn');
    if (btn) btn.addEventListener('click', run);
    run();
  });
}
