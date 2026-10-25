// Calcotia: Saudi End of Service calculator (Articles 84, 85, 87)
// Service period uses the calendar breakdown (years + months/12 + days/365.25)
// so whole-year examples come out exact. Rates and resignation fractions are
// unchanged from the Saudi Labour Law formula.
function eosCalc(wage, serviceYears, reason) {
  var firstYears = Math.min(serviceYears, 5);
  var afterYears = Math.max(serviceYears - 5, 0);
  var firstAmt = wage * 0.5 * firstYears;
  var afterAmt = wage * 1 * afterYears;
  var full = firstAmt + afterAmt;
  var share = 1, shareLabel = 'Full award (100%)';
  if (reason === 'resign') {
    if (serviceYears < 2) { share = 0; shareLabel = 'No award on resignation under 2 years (0%)'; }
    else if (serviceYears < 5) { share = 1 / 3; shareLabel = 'One third on resignation (Article 85)'; }
    else if (serviceYears < 10) { share = 2 / 3; shareLabel = 'Two thirds on resignation (Article 85)'; }
    else { share = 1; shareLabel = 'Full award, 10+ years (Article 85)'; }
  } else if (reason === 'force') {
    shareLabel = 'Full award: force majeure (Article 87)';
  } else if (reason === 'woman') {
    shareLabel = 'Full award: marriage / childbirth case (Article 87)';
  }
  return { firstAmt: firstAmt, afterAmt: afterAmt, full: full, share: share, shareLabel: shareLabel, total: full * share };
}

function fmt(n) {
  return 'SAR ' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
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
  if (!wage || wage <= 0) { if (showErrors && err) { err.textContent = 'Please enter your last monthly wage in SAR.'; err.hidden = false; } return; }
  if (!startVal || !endVal) { if (showErrors && err) { err.textContent = 'Please select both your first and last working days.'; err.hidden = false; } return; }
  var start = new Date(startVal), end = new Date(endVal);
  if (end <= start) { if (showErrors && err) { err.textContent = 'Your last working day must be after your first working day.'; err.hidden = false; } return; }
  var y = end.getFullYear() - start.getFullYear();
  var m = end.getMonth() - start.getMonth();
  var d = end.getDate() - start.getDate();
  if (d < 0) { m -= 1; var prev = new Date(end.getFullYear(), end.getMonth(), 0); d += prev.getDate(); }
  if (m < 0) { y -= 1; m += 12; }
  var serviceYears = y + m / 12 + d / 365.25;
  var r = eosCalc(wage, serviceYears, reasonEl.value);
  document.getElementById('serviceOut').textContent = y + ' years, ' + m + ' months, ' + d + ' days';
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
