// Calcotia: حاسبة نهاية الخدمة السعودية (المواد 84 و85 و87)
// مدة الخدمة تُحسب بالتقويم (سنوات + أشهر/12 + أيام/365.25) حتى تخرج
// أمثلة السنوات الكاملة بأرقام صحيحة تماماً. النسب وكسور الاستقالة كما في النظام.
function eosCalc(wage, serviceYears, reason) {
  var firstYears = Math.min(serviceYears, 5);
  var afterYears = Math.max(serviceYears - 5, 0);
  var firstAmt = wage * 0.5 * firstYears;
  var afterAmt = wage * 1 * afterYears;
  var full = firstAmt + afterAmt;
  var share = 1, shareLabel = 'المكافأة كاملة (100٪)';
  if (reason === 'resign') {
    if (serviceYears < 2) { share = 0; shareLabel = 'لا تستحق مكافأة عند الاستقالة قبل سنتين (0٪)'; }
    else if (serviceYears < 5) { share = 1 / 3; shareLabel = 'الثلث عند الاستقالة (المادة 85)'; }
    else if (serviceYears < 10) { share = 2 / 3; shareLabel = 'الثلثان عند الاستقالة (المادة 85)'; }
    else { share = 1; shareLabel = 'المكافأة كاملة، خدمة 10 سنوات فأكثر (المادة 85)'; }
  } else if (reason === 'force') {
    shareLabel = 'المكافأة كاملة: قوة قاهرة (المادة 87)';
  } else if (reason === 'woman') {
    shareLabel = 'المكافأة كاملة: حالة الزواج أو الولادة (المادة 87)';
  }
  return { firstAmt: firstAmt, afterAmt: afterAmt, full: full, share: share, shareLabel: shareLabel, total: full * share };
}

function fmt(n) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' ريال';
}

function compute(showErrors) {
  var wageEl = document.getElementById('wage');
  var startEl = document.getElementById('start');
  var endEl = document.getElementById('end');
  var reasonEl = document.getElementById('reason');
  var err = document.getElementById('err');
  var result = document.getElementById('result');
  if (!wageEl || !startEl || !endEl) return;
  if (err) err.hidden = true; result.classList.remove('show');
  var wage = parseFloat(wageEl.value);
  var startVal = startEl.value, endVal = endEl.value;
  if (!wage || wage <= 0) { if (showErrors && err) { err.textContent = 'فضلاً أدخل آخر راتب شهري بالريال.'; err.hidden = false; } return; }
  if (!startVal || !endVal) { if (showErrors && err) { err.textContent = 'فضلاً اختر تاريخ أول يوم عمل وتاريخ آخر يوم عمل.'; err.hidden = false; } return; }
  var start = new Date(startVal), end = new Date(endVal);
  if (end <= start) { if (showErrors && err) { err.textContent = 'يجب أن يكون آخر يوم عمل بعد أول يوم عمل.'; err.hidden = false; } return; }
  var y = end.getFullYear() - start.getFullYear();
  var m = end.getMonth() - start.getMonth();
  var d = end.getDate() - start.getDate();
  if (d < 0) { m -= 1; var prev = new Date(end.getFullYear(), end.getMonth(), 0); d += prev.getDate(); }
  if (m < 0) { y -= 1; m += 12; }
  var serviceYears = y + m / 12 + d / 365.25;
  var r = eosCalc(wage, serviceYears, reasonEl.value);
  document.getElementById('serviceOut').textContent = y + ' سنة، ' + m + ' شهر، ' + d + ' يوم';
  document.getElementById('firstOut').textContent = fmt(r.firstAmt);
  document.getElementById('afterOut').textContent = fmt(r.afterAmt);
  document.getElementById('fullOut').textContent = fmt(r.full);
  document.getElementById('shareOut').textContent = r.shareLabel;
  document.getElementById('totalOut').textContent = fmt(r.total);
  result.classList.add('show');
}

document.getElementById('calcBtn').addEventListener('click', function () { compute(true); });
['wage', 'start', 'end', 'reason'].forEach(function (id) {
  var el = document.getElementById(id);
  if (el) el.addEventListener('input', function () { compute(false); });
  if (el) el.addEventListener('change', function () { compute(false); });
});
