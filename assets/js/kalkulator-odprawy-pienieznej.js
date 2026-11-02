(function () {
  'use strict';

  // Poland severance pay (odprawa pieniezna) — Act of 13 March 2003 on
  // special rules for terminations for reasons not attributable to the
  // employee (Dz.U. 2003 nr 90 poz. 844, as amended).
  // Scale (Art. 8): < 2 years = 1 month's pay; 2-8 years = 2 months' pay;
  // > 8 years = 3 months' pay. Cap: 15 x the minimum wage on the
  // termination day; 2026 minimum wage 4,806 zl -> cap 72,090 zl.
  // The Act applies only to employers with at least 20 employees (Art. 1),
  // and Art. 10 extends the Art. 8 scale to individual dismissals too, so
  // the < 2-year 1-month tier DOES apply to individual dismissals and the
  // 20-employee threshold DOES apply to individual dismissals as well.
  // Base: average monthly pay over the last 3 months (leave-equivalent
  // principles, 1996 regulation). Part-time: pro-rata on the
  // full-time-equivalent base (base x fraction).
  // Tax: PIT applies; NO ZUS social or health contributions.
  // Payable on the termination day; 3-year claim window.
  // Employer-reason only: resignation, disciplinary dismissal and
  // fixed-term expiry give NO statutory severance (not 0 as a number).
  var MINIMUM_2026 = 4806;
  var CAP_2026 = 15 * MINIMUM_2026; // 72,090 zl

  function tierMonths(serviceYears) {
    if (serviceYears < 2) return 1;
    if (serviceYears <= 8) return 2;
    return 3;
  }

  function calc(input) {
    var years = Math.max(0, parseInt(input.years, 10) || 0);
    var months = Math.max(0, parseInt(input.months, 10) || 0);
    var serviceYears = years + months / 12;
    var baseFte = Math.max(0, input.baseFte || 0);
    var fraction = input.fraction === undefined ? 1 : Math.min(1, Math.max(0, input.fraction || 0));
    var bigEmployer = !!input.bigEmployer;
    var employerReason = !!input.employerReason;

    var base = baseFte * fraction;
    var tier = tierMonths(serviceYears);
    var gross = tier * base;
    var capped = gross > CAP_2026;
    var result = Math.min(gross, CAP_2026);

    var noReason = '';
    if (!bigEmployer) noReason = 'size';
    else if (!employerReason) noReason = 'reason';

    return {
      serviceYears: serviceYears,
      years: years,
      months: months,
      baseFte: baseFte,
      fraction: fraction,
      base: base,
      tier: tier,
      gross: gross,
      cap: CAP_2026,
      capped: capped,
      result: result,
      noReason: noReason,
      bigEmployer: bigEmployer,
      employerReason: employerReason
    };
  }

  function round0(x) { return Math.round(x); }

  if (typeof document !== 'undefined') {
    var fmt = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
    var fmt2 = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 });

    function val(id) {
      var el = document.getElementById(id);
      if (!el) return 0;
      var v = parseFloat(String(el.value).replace(',', '.'));
      return isNaN(v) || v < 0 ? 0 : v;
    }
    function set(id, v) {
      var el = document.getElementById(id);
      if (el) el.textContent = fmt.format(v) + ' zł';
    }
    function setText(id, v) {
      var el = document.getElementById(id);
      if (el) el.textContent = v;
    }
    function radioVal(name, fallback) {
      var els = document.querySelectorAll('input[name="' + name + '"]:checked');
      return els.length ? els[0].value : fallback;
    }

    function run() {
      var r = calc({
        years: val('pl-years'),
        months: val('pl-months'),
        baseFte: val('pl-base'),
        fraction: parseFloat((document.getElementById('pl-fraction') || {}).value || '1') || 0,
        bigEmployer: radioVal('pl-size', 'yes') === 'yes',
        employerReason: radioVal('pl-reason', 'employer') === 'employer'
      });
      if (r.noReason) {
        set('pl-big', 0);
        setText('pl-big-label', 'Brak ustawowej odprawy');
      } else {
        set('pl-big', r.result);
        setText('pl-big-label', 'Odprawa (brutto)');
      }
      setText('pl-service', (r.years === 1 ? '1 rok ' : r.years + ' lat ') + r.months + ' mies. (' + fmt2.format(r.serviceYears) + ' roku)');
      setText('pl-tier', r.tier + (r.tier === 1 ? ' pensja' : ' pensje'));
      set('pl-base-eff', r.base);
      set('pl-gross', r.gross);
      set('pl-cap', r.cap);
      set('pl-result', r.noReason ? 0 : r.result);

      var note = document.getElementById('pl-note');
      if (note) {
        if (r.noReason === 'size') {
          note.textContent = 'Ustawa z 13 marca 2003 r. dotyczy tylko pracodawców zatrudniających co najmniej 20 pracowników. Przy mniejszym pracodawcy ustawowa odprawa nie przysługuje — tylko to, co obiecuje umowa, układ zbiorowy lub regulamin.';
        } else if (r.noReason === 'reason') {
          note.textContent = 'Odprawa z ustawy przysługuje tylko przy rozwiązaniu z przyczyn leżących wyłącznie po stronie pracodawcy. Rezygnacja, zwolnienie dyscyplinarne i upływ umowy na czas określony nie dają prawa do ustawowej odprawy.';
        } else if (r.capped) {
          note.textContent = 'Wynik został ograniczony limitem: 15-krotność płacy minimalnej w 2026 r. to 72 090 zł, nawet jeśli 3 pensje dałyby więcej.';
        } else {
          note.textContent = 'Od odprawy pobierany jest podatek PIT, ale nie nalicza się składek ZUS (ani społecznych, ani zdrowotnych). Pracodawca wypłaca odprawę z reguły w ostatnim dniu zatrudnienia.';
        }
      }
    }

    document.addEventListener('DOMContentLoaded', function () {
      var form = document.getElementById('pl-form');
      if (form) {
        form.addEventListener('input', run);
        form.addEventListener('change', run);
      }
      var btn = document.getElementById('pl-btn');
      if (btn) btn.addEventListener('click', run);
      run();
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calc: calc, tierMonths: tierMonths, round0: round0, CAP_2026: CAP_2026 };
  }
})();
