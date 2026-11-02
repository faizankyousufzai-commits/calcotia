(function () {
  'use strict';

  // Korea severance pay (toejikgeum) — Guarantee of Workers' Retirement
  // Benefits Act, Arts. 4, 8, 9; Labor Standards Act Art. 2(2) floor.
  // Formula: severance = applicable daily wage x 30 x (service days / 365).
  // Average daily wage = (last-3-month wages + 3/12 x (annual bonus +
  // unused annual-leave pay)) / calendar days in the 3-month window (89-92).
  // Ordinary daily wage = monthly ordinary wage / 209 x 8.
  // Applicable daily wage = max(average daily wage, ordinary daily wage).
  // Eligibility: at least 1 year (365 days) with the same employer AND an
  // average of at least 15 hours per week over 4 weeks. Reason for leaving
  // does not matter (resignation, dismissal and contract end all qualify).
  // DC plans: payout = contributions + returns, NEVER this formula. When DC
  // is selected the calculator returns no number, only the explanation.
  function calc(input) {
    var join = input.join ? new Date(input.join + 'T00:00:00') : null;
    var leave = input.leave ? new Date(input.leave + 'T00:00:00') : null;
    var serviceDays = 0;
    var windowDays = 0;
    if (join && leave && !isNaN(join) && !isNaN(leave) && leave >= join) {
      serviceDays = Math.round((leave - join) / 86400000);
      // 3-month window: the 3 calendar months ending on the leaving date.
      // Leaving date = day after the last working day (MOEL convention).
      var start = new Date(leave.getFullYear(), leave.getMonth() - 3, leave.getDate());
      windowDays = Math.round((leave - start) / 86400000);
    } else {
      serviceDays = Math.max(0, parseInt(input.serviceDays, 10) || 0);
      windowDays = Math.max(0, parseInt(input.windowDays, 10) || 0);
    }
    var wages = Math.max(0, input.wages || 0);
    var bonus = Math.max(0, input.bonus || 0);
    var leavePay = Math.max(0, input.leavePay || 0);
    var ordinaryMonthly = Math.max(0, input.ordinaryMonthly || 0);
    var hours = input.hours === undefined ? 40 : Math.max(0, input.hours || 0);
    var plan = input.plan || 'lump';

    var total3 = wages + 3 / 12 * (bonus + leavePay);
    // Daily wages are rounded to 2 decimals before the x30 step, so the
    // displayed daily wage reproduces the displayed result by hand.
    var avgDaily = windowDays > 0 ? Math.round(total3 / windowDays * 100) / 100 : 0;
    var ordDaily = Math.round(ordinaryMonthly / 209 * 8 * 100) / 100;
    var applicable = Math.max(avgDaily, ordDaily);
    var floorApplies = ordDaily > avgDaily;
    var thirty = applicable * 30;
    var ratio = serviceDays / 365;
    var severance = thirty * ratio;

    var eligible = serviceDays >= 365 && hours >= 15;
    var noReason = '';
    if (serviceDays < 365) noReason = 'service';
    else if (hours < 15) noReason = 'hours';

    return {
      serviceDays: serviceDays,
      windowDays: windowDays,
      wages: wages,
      bonus: bonus,
      leavePay: leavePay,
      total3: total3,
      avgDaily: avgDaily,
      ordDaily: ordDaily,
      applicable: applicable,
      floorApplies: floorApplies,
      thirty: thirty,
      ratio: ratio,
      severance: severance,
      eligible: eligible,
      noReason: noReason,
      plan: plan
    };
  }

  function round0(x) { return Math.round(x); }

  if (typeof document !== 'undefined') {
    var fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
    var fmt2 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

    function val(id) {
      var el = document.getElementById(id);
      if (!el) return 0;
      var v = parseFloat(String(el.value).replace(',', '.'));
      return isNaN(v) || v < 0 ? 0 : v;
    }
    function set(id, v) {
      var el = document.getElementById(id);
      if (el) el.textContent = fmt.format(v) + ' KRW';
    }
    function set2(id, v) {
      var el = document.getElementById(id);
      if (el) el.textContent = fmt2.format(v) + ' KRW';
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
      var plan = radioVal('kr-plan', 'lump');
      var r = calc({
        join: (document.getElementById('kr-join') || {}).value || '',
        leave: (document.getElementById('kr-leave') || {}).value || '',
        wages: val('kr-m1') + val('kr-m2') + val('kr-m3'),
        bonus: val('kr-bonus'),
        leavePay: val('kr-leavepay'),
        ordinaryMonthly: val('kr-ordinary'),
        hours: val('kr-hours'),
        plan: plan
      });
      var result = document.getElementById('kr-result');
      var dcPanel = document.getElementById('kr-dc-panel');
      if (plan === 'dc') {
        if (result) result.style.display = 'none';
        if (dcPanel) dcPanel.style.display = '';
        return;
      }
      if (result) result.style.display = '';
      if (dcPanel) dcPanel.style.display = 'none';

      if (!r.eligible) {
        set('kr-big', 0);
        setText('kr-big-label', 'No statutory severance');
      } else {
        set('kr-big', r.severance);
        setText('kr-big-label', 'Severance pay (pre-tax)');
      }
      setText('kr-service', fmt.format(r.serviceDays) + ' days (' + fmt2.format(r.ratio) + ' years)');
      setText('kr-window', fmt.format(r.windowDays) + ' days');
      set('kr-total3', r.total3);
      set2('kr-avg', r.avgDaily);
      set2('kr-ord', r.ordDaily);
      set2('kr-applicable', r.applicable);
      set2('kr-thirty', r.thirty);
      set('kr-severance', r.eligible ? r.severance : 0);

      var note = document.getElementById('kr-note');
      if (note) {
        if (!r.eligible && r.noReason === 'service') {
          note.textContent = 'No statutory severance: you need at least 1 year (365 days) with the same employer. 364 days gives nothing; 365 days gives a full year\u2019s worth.';
        } else if (!r.eligible && r.noReason === 'hours') {
          note.textContent = 'No statutory severance: you need an average of at least 15 hours per week over 4 weeks.';
        } else if (r.floorApplies) {
          note.textContent = 'The ordinary-wage floor applies here: your ordinary daily wage is higher than your average daily wage, so the ordinary wage is used (Labor Standards Act, Art. 2(2)).';
        } else {
          note.textContent = 'Result is pre-tax. Severance is taxed as retirement income, with service-year deductions. It must be paid within 14 days of leaving, or 20% annual delay interest applies.';
        }
      }
    }

    document.addEventListener('DOMContentLoaded', function () {
      var form = document.getElementById('kr-form');
      if (form) {
        form.addEventListener('input', run);
        form.addEventListener('change', run);
      }
      var btn = document.getElementById('kr-btn');
      if (btn) btn.addEventListener('click', run);
      run();
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calc: calc, round0: round0 };
  }
})();
