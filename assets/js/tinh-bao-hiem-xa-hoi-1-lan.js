/* Calcotia - Bao hiem xa hoi 1 lan calculator (Vietnam)
   Formula per Article 70, Law on Social Insurance 2024:
   1.5 months of average insured salary per year before 2014,
   2.0 months per year from 2014 onward.
   Odd months: 1-6 count as half a year, 7-11 as a full year.
   Odd months of the pre-2014 period are transferred to the post-2014 period. */
(function () {
  var box = document.getElementById('vn-result');
  if (!box) return;

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

  function calc() {
    var py = Math.floor(gv('vn-pre-years'));
    var pm = Math.min(Math.floor(gv('vn-pre-months')), 11);
    var oy = Math.floor(gv('vn-post-years'));
    var om = Math.min(Math.floor(gv('vn-post-months')), 11);
    var sal = gv('vn-salary');

    var postMonths = oy * 12 + om;
    var totalRawMonths = py * 12 + pm + postMonths;
    if (totalRawMonths <= 0 || sal <= 0) {
      box.classList.remove('show');
      return;
    }

    var preCounted, postCounted;
    if (postMonths > 0) {
      /* Odd pre-2014 months move into the post-2014 pool before rounding. */
      preCounted = py;
      var pool = postMonths + pm;
      postCounted = Math.floor(pool / 12) + roundOdd(pool % 12);
    } else {
      preCounted = py + roundOdd(pm);
      postCounted = 0;
    }

    var mult = 1.5 * preCounted + 2 * postCounted;
    var amount = Math.round(mult * sal);

    setText('vn-r-pre', fmtYears(preCounted));
    setText('vn-r-post', fmtYears(postCounted));
    setText('vn-r-mult', String(mult).replace('.', ',') + ' tháng lương');
    setText('vn-r-salary', money.format(sal));
    setText('vn-amount', money.format(amount));

    var note = document.getElementById('vn-note');
    if (note) {
      note.textContent = totalRawMonths < 12
        ? 'Lưu ý: tổng thời gian đóng chưa đủ 01 năm thuộc trường hợp riêng — mức hưởng bằng 22% tổng số tiền lương tháng đã đóng BHXH, tối đa bằng 02 tháng mức bình quân tiền lương tháng đóng BHXH. Vui lòng đối chiếu trực tiếp với cơ quan BHXH.'
        : '';
    }
    box.classList.add('show');
  }

  ['vn-pre-years', 'vn-pre-months', 'vn-post-years', 'vn-post-months', 'vn-salary'].forEach(function (id) {
    var e = document.getElementById(id);
    if (e) {
      e.addEventListener('input', calc);
      e.addEventListener('change', calc);
    }
  });
  var btn = document.getElementById('vn-calc-btn');
  if (btn) btn.addEventListener('click', calc);
  calc();
})();
