(function () {
  'use strict';

  // Romania overtime pay (Codul muncii, Legea 53/2003).
  // tarif orar = salariu brut lunar / ore normale in luna.
  // Weekday overtime hour = tarif x (1 + spor 75%); weekend/holiday
  // overtime hour = tarif x (1 + spor 100%, editable contractual default);
  // night hours add +25% of tarif per night hour (cumulates, art. 126).
  // All results are gross (brut), before tax and contributions.
  function calc(input) {
    var salary = Math.max(0, input.salary || 0);
    var normalHours = input.normalHours > 0 ? input.normalHours : 168;
    var otWeekday = Math.max(0, input.otWeekday || 0);
    var otWeekend = Math.max(0, input.otWeekend || 0);
    var nightRaw = Math.max(0, input.nightHours || 0);
    var premiumWeekday = (input.premiumWeekday || 0) / 100;
    var premiumWeekend = (input.premiumWeekend || 0) / 100;
    var premiumNight = (input.premiumNight || 0) / 100;

    var hourly = salary / normalHours;
    var totalOt = otWeekday + otWeekend;
    var nightHours = Math.min(nightRaw, totalOt);
    var nightCapped = nightRaw > totalOt;

    var baseWeekday = hourly * otWeekday;
    var baseWeekend = hourly * otWeekend;
    var basePay = baseWeekday + baseWeekend;
    var premiumWeekdayAmount = hourly * otWeekday * premiumWeekday;
    var premiumWeekendAmount = hourly * otWeekend * premiumWeekend;
    var nightAmount = hourly * nightHours * premiumNight;
    var totalOtPay = basePay + premiumWeekdayAmount + premiumWeekendAmount + nightAmount;
    var totalGross = salary + totalOtPay;

    // Implied average weekly hours: normal hours correspond to 40h/week,
    // so weekly average = 40 x (normal + overtime) / normal.
    var weeklyHours = normalHours > 0 ? 40 * (normalHours + totalOt) / normalHours : 0;

    return {
      hourly: hourly,
      baseWeekday: baseWeekday,
      baseWeekend: baseWeekend,
      basePay: basePay,
      premiumWeekday: premiumWeekdayAmount,
      premiumWeekend: premiumWeekendAmount,
      nightPremium: nightAmount,
      nightHoursUsed: nightHours,
      nightCapped: nightCapped,
      totalOtPay: totalOtPay,
      totalGross: totalGross,
      totalOtHours: totalOt,
      weeklyHours: weeklyHours,
      over48: weeklyHours > 48
    };
  }

  function round2(x) { return Math.round(x * 100) / 100; }

  if (typeof document !== 'undefined') {
    var fmt = new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' });
    var fmtNum = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 });

    function val(id) {
      var el = document.getElementById(id);
      if (!el) return 0;
      var v = parseFloat(String(el.value).replace(',', '.'));
      return isNaN(v) || v < 0 ? 0 : v;
    }
    function set(id, v) {
      var el = document.getElementById(id);
      if (el) el.textContent = fmt.format(v);
    }
    function setText(id, v) {
      var el = document.getElementById(id);
      if (el) el.textContent = v;
    }

    function run() {
      var r = calc({
        salary: val('ro-salary'),
        normalHours: val('ro-hours') || 168,
        otWeekday: val('ro-ot-weekday'),
        otWeekend: val('ro-ot-weekend'),
        nightHours: val('ro-night'),
        premiumWeekday: val('ro-premium-weekday'),
        premiumWeekend: val('ro-premium-weekend'),
        premiumNight: val('ro-premium-night')
      });
      set('ro-hourly', r.hourly);
      set('ro-base', r.basePay);
      set('ro-premium-weekday', r.premiumWeekday);
      set('ro-premium-weekend', r.premiumWeekend);
      set('ro-night-premium', r.nightPremium);
      set('ro-total-ot', r.totalOtPay);
      set('ro-total-ot-row', r.totalOtPay);
      set('ro-total-gross', r.totalGross);
      setText('ro-weekly', fmtNum.format(r.weeklyHours) + ' ore/săptămână');

      var warn = document.getElementById('ro-warning');
      if (warn) {
        var msgs = [];
        if (r.over48) msgs.push('Atenție: media săptămânală estimată (' + fmtNum.format(r.weeklyHours) + ' ore) depășește limita legală de 48 de ore pe săptămână ca medie pe 4 luni (art. 114). Orele suplimentare peste această medie nu sunt permise, cu excepția cazurilor de forță majoră sau lucrări urgente.');
        if (r.nightCapped) msgs.push('Atenție: orele de noapte nu pot depăși totalul orelor suplimentare. Calculul a folosit ' + fmtNum.format(r.nightHoursUsed) + ' ore de noapte.');
        var part = document.getElementById('ro-parttime');
        var minor = document.getElementById('ro-minor');
        if (part && part.checked) msgs.push('Notă: salariații cu timp parțial nu pot presta muncă suplimentară (art. 105). Rezultatul de mai sus este doar o estimare aritmetică, nu un drept la plată.');
        if (minor && minor.checked) msgs.push('Notă: tinerii sub 18 ani nu pot presta muncă suplimentară (art. 124). Rezultatul de mai sus este doar o estimare aritmetică, nu un drept la plată.');
        warn.style.display = msgs.length ? '' : 'none';
        warn.innerHTML = msgs.map(function (m) { return '<p>' + m + '</p>'; }).join('');
      }
    }

    document.addEventListener('DOMContentLoaded', function () {
      var form = document.getElementById('ro-form');
      if (form) {
        form.addEventListener('input', run);
        form.addEventListener('change', run);
      }
      var btn = document.getElementById('ro-btn');
      if (btn) btn.addEventListener('click', run);
      run();
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calc: calc, round2: round2 };
  }
})();
