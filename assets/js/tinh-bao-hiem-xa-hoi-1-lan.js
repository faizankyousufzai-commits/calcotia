/* Calcotia - Bao hiem xa hoi 1 lan calculator (Vietnam)
   Benefit formula per Article 70, Law on Social Insurance 2024:
   1.5 months of average insured salary per year before 2014,
   2.0 months per year from 2014 onward.
   Odd months: 1-6 count as half a year, 7-11 as a full year.
   Odd months of the pre-2014 period are transferred to the post-2014 period.
   Two input modes:
   - Simple: total years/months per period + a ready average salary (Mbqtl).
   - Per-period: each contribution period with its own salary; the official
     average is derived with the wage adjustment coefficients (he so truot gia)
     announced in Cong van 340/BHXH-CSXH dated 03/02/2026 by Vietnam Social
     Security (coefficients per point a, clause 1, Article 16 of Decree
     158/2025/ND-CP). */
(function () {
  var box = document.getElementById('vn-result');
  if (!box) return;

  /* Wage adjustment coefficients by contribution year (mandatory BHXH).
     "pre1995" applies to every year before 1995; years after 2026 use 1.00. */
  var COEF = {
    pre1995: 5.81, 1995: 4.91, 1996: 4.65, 1997: 4.50, 1998: 4.18, 1999: 4.01,
    2000: 4.07, 2001: 4.09, 2002: 3.94, 2003: 3.81, 2004: 3.54, 2005: 3.27,
    2006: 3.05, 2007: 2.81, 2008: 2.29, 2009: 2.14, 2010: 1.96, 2011: 1.65,
    2012: 1.51, 2013: 1.42, 2014: 1.36, 2015: 1.36, 2016: 1.32, 2017: 1.28,
    2018: 1.23, 2019: 1.20, 2020: 1.16, 2021: 1.14, 2022: 1.11, 2023: 1.07,
    2024: 1.03, 2025: 1.00, 2026: 1.00
  };
  function coef(year) {
    if (year < 1995) return COEF.pre1995;
    if (year > 2026) return 1;
    return COEF[year] || 1;
  }

  var money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
  function gv(id) {
    var e = document.getElementById(id);
    var v = e ? parseFloat(e.value) : 0;
    return isNaN(v) || v < 0 ? 0 : v;
  }
  function setText(id, txt) {
    var e = document.getElementById(id);
    if (e) e.textContent = txt;
  }
  function roundOdd(m) {
    if (m <= 0) return 0;
    if (m <= 6) return 0.5;
    return 1;
  }
  function fmtYears(n) {
    return String(n).replace('.', ',') + ' năm';
  }
  function num(el, fallback) {
    var v = el ? parseFloat(el.value) : NaN;
    return isNaN(v) ? fallback : v;
  }

  /* Shared benefit computation from split month counts and the average salary. */
  function benefit(preMonths, postMonths, avgSalary) {
    var totalMonths = preMonths + postMonths;
    if (totalMonths <= 0 || avgSalary <= 0) return null;
    var preCounted, postCounted;
    if (postMonths > 0) {
      /* Odd pre-2014 months move into the post-2014 pool before rounding. */
      preCounted = Math.floor(preMonths / 12);
      var pool = postMonths + (preMonths % 12);
      postCounted = Math.floor(pool / 12) + roundOdd(pool % 12);
    } else {
      preCounted = Math.floor(preMonths / 12) + roundOdd(preMonths % 12);
      postCounted = 0;
    }
    var mult = 1.5 * preCounted + 2 * postCounted;
    return {
      totalMonths: totalMonths,
      preCounted: preCounted,
      postCounted: postCounted,
      mult: mult,
      amount: Math.round(mult * avgSalary)
    };
  }

  function render(res, avgSalary) {
    if (!res) {
      box.classList.remove('show');
      return;
    }
    setText('vn-r-pre', fmtYears(res.preCounted));
    setText('vn-r-post', fmtYears(res.postCounted));
    setText('vn-r-mult', String(res.mult).replace('.', ',') + ' tháng lương');
    setText('vn-r-salary', money.format(avgSalary));
    setText('vn-amount', money.format(res.amount));
    var note = document.getElementById('vn-note');
    if (note) {
      note.textContent = res.totalMonths < 12
        ? 'Lưu ý: tổng thời gian đóng chưa đủ 01 năm thuộc trường hợp riêng — mức hưởng bằng 22% tổng số tiền lương tháng đã đóng BHXH, tối đa bằng 02 tháng mức bình quân tiền lương tháng đóng BHXH. Vui lòng đối chiếu trực tiếp với cơ quan BHXH.'
        : '';
    }
    box.classList.add('show');
  }

  function calcSimple() {
    var py = Math.floor(gv('vn-pre-years'));
    var pm = Math.min(Math.floor(gv('vn-pre-months')), 11);
    var oy = Math.floor(gv('vn-post-years'));
    var om = Math.min(Math.floor(gv('vn-post-months')), 11);
    var sal = gv('vn-salary');
    render(benefit(py * 12 + pm, oy * 12 + om, sal), sal);
  }

  /* Per-period mode: split every period by calendar year, weight each year's
     salary by that year's coefficient, derive the official average. */
  function readPeriods() {
    var rows = document.querySelectorAll('.vn-period-row');
    var pre = 0, post = 0, adjTotal = 0, months = 0;
    var split = new Date(2014, 0, 1).getTime();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var sm = Math.floor(num(r.querySelector('.p-sm'), 1));
      var sy = Math.floor(num(r.querySelector('.p-sy'), 0));
      var em = Math.floor(num(r.querySelector('.p-em'), 12));
      var ey = Math.floor(num(r.querySelector('.p-ey'), 0));
      var sal = num(r.querySelector('.p-sal'), 0);
      if (!sy || !ey || sal <= 0) continue;
      if (sm < 1 || sm > 12 || em < 1 || em > 12) continue;
      var start = sy * 12 + (sm - 1);
      var end = ey * 12 + (em - 1);
      if (end < start) continue;
      for (var ym = start; ym <= end; ym++) {
        var y = Math.floor(ym / 12);
        adjTotal += sal * coef(y);
        months++;
        if (new Date(y, ym - y * 12, 1).getTime() < split) pre++; else post++;
      }
    }
    return { pre: pre, post: post, adjTotal: adjTotal, months: months };
  }
  function calcPeriods() {
    var p = readPeriods();
    if (p.months <= 0) { render(null, 0); return; }
    var mbq = Math.round(p.adjTotal / p.months);
    render(benefit(p.pre, p.post, mbq), mbq);
  }

  var modeEl = document.getElementById('vn-mode');
  function currentMode() { return modeEl && modeEl.value === 'periods' ? 'periods' : 'simple'; }
  function calc() {
    if (currentMode() === 'periods') calcPeriods(); else calcSimple();
  }
  function syncMode() {
    var periods = currentMode() === 'periods';
    var sw = document.getElementById('vn-simple-wrap');
    var pw = document.getElementById('vn-periods-wrap');
    if (sw) sw.style.display = periods ? 'none' : '';
    if (pw) pw.style.display = periods ? '' : 'none';
    calc();
  }

  function addPeriodRow(sm, sy, em, ey, sal) {
    var wrap = document.getElementById('vn-periods');
    if (!wrap) return;
    var idx = wrap.querySelectorAll('.vn-period-row').length + 1;
    var row = document.createElement('div');
    row.className = 'vn-period-row';
    row.innerHTML =
      '<div class="grid2">' +
      '<div class="field"><label>Tháng bắt đầu <span class="hint">1 đến 12</span></label><input type="number" class="p-sm" min="1" max="12" step="1" value="' + sm + '"></div>' +
      '<div class="field"><label>Năm bắt đầu</label><input type="number" class="p-sy" min="1990" max="2030" step="1" value="' + sy + '"></div>' +
      '<div class="field"><label>Tháng kết thúc <span class="hint">1 đến 12, tính cả tháng này</span></label><input type="number" class="p-em" min="1" max="12" step="1" value="' + em + '"></div>' +
      '<div class="field"><label>Năm kết thúc</label><input type="number" class="p-ey" min="1990" max="2030" step="1" value="' + ey + '"></div>' +
      '</div>' +
      '<div class="field"><label>Tiền lương tháng đóng BHXH của giai đoạn ' + idx + ' (đồng)</label><input type="number" class="p-sal" min="0" step="100000" value="' + sal + '"></div>' +
      '<p><button type="button" class="p-del">Xóa giai đoạn này</button></p>';
    wrap.appendChild(row);
    row.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('input', calc);
      inp.addEventListener('change', calc);
    });
    var del = row.querySelector('.p-del');
    if (del) del.addEventListener('click', function () {
      row.parentNode.removeChild(row);
      calc();
    });
  }

  var addBtn = document.getElementById('vn-add-period');
  if (addBtn) addBtn.addEventListener('click', function () {
    addPeriodRow(1, 2020, 12, 2020, 8000000);
  });
  /* Default rows reproduce the worked example on the page. */
  addPeriodRow(5, 2009, 12, 2013, 4000000);
  addPeriodRow(1, 2014, 5, 2021, 7500000);

  ['vn-pre-years', 'vn-pre-months', 'vn-post-years', 'vn-post-months', 'vn-salary'].forEach(function (id) {
    var e = document.getElementById(id);
    if (e) {
      e.addEventListener('input', calc);
      e.addEventListener('change', calc);
    }
  });
  if (modeEl) modeEl.addEventListener('change', syncMode);
  var btn = document.getElementById('vn-calc-btn');
  if (btn) btn.addEventListener('click', calc);
  syncMode();
})();
