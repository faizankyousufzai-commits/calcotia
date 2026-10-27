// UAE end-of-service gratuity calculator (gratuity calculator uae).
// Article 51 of Federal Decree-Law No. 33 of 2021: 21 days of basic wage for
// each of the first five years of service, 30 days of basic wage for each year
// after that, pro-rated for a partial year. Daily basic wage = monthly basic
// wage / 30. At least one full year of continuous service is required; unpaid
// absence days do not count towards the service period. Total gratuity is
// capped at two years' wage (24 monthly wages). Since the 2021 law took effect
// on 2 February 2022, resignation no longer reduces the entitlement.
// Service convention: a year counts 365 days and a month 30 days, so a
// remainder of months and days is converted to days before the split into
// full years and a partial year.
(function () {
  function $(id) { return document.getElementById(id); }
  function aed(n) {
    return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(n);
  }
  function num(n) {
    return new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }
  function calc() {
    var basic = parseFloat($('ae-basic').value) || 0;
    var years = parseFloat($('ae-years').value) || 0;
    var months = parseFloat($('ae-months').value) || 0;
    var daysIn = parseFloat($('ae-days').value) || 0;
    var unpaid = parseFloat($('ae-unpaid').value) || 0;
    var totalWage = parseFloat($('ae-total-wage').value) || 0;
    if (basic < 0) basic = 0;
    if (years < 0) years = 0;
    if (months < 0) months = 0;
    if (months > 11) months = 11;
    if (daysIn < 0) daysIn = 0;
    if (daysIn > 30) daysIn = 30;
    if (unpaid < 0) unpaid = 0;
    if (totalWage < 0) totalWage = 0;
    if (!totalWage) totalWage = basic;
    var totalDays = years * 365 + months * 30 + daysIn - unpaid;
    if (totalDays < 0) totalDays = 0;
    var fullYears = Math.floor(totalDays / 365);
    var remDays = totalDays - fullYears * 365;
    var serviceYears = totalDays / 365;
    var daily = basic / 30;
    var firstDays = Math.min(fullYears, 5) * 21;
    var afterDays = Math.max(fullYears - 5, 0) * 30;
    var partialRate = fullYears >= 5 ? 30 : 21;
    var partialDays = remDays / 365 * partialRate;
    var firstAmount = firstDays * daily;
    var afterAmount = afterDays * daily;
    var partialAmount = partialDays * daily;
    var raw = firstAmount + afterAmount + partialAmount;
    var cap = 24 * totalWage;
    var total = raw;
    var capNote = 'No cap applied: below two years\' wage (' + aed(cap) + ')';
    var note = 'Gratuity is calculated on the last basic wage only; housing, transport and other allowances are not included. The two-year cap is measured on total monthly wage.';
    if (serviceYears < 1) {
      total = 0;
      capNote = 'No gratuity is due below one full year of continuous service';
      note = 'Article 51 requires at least one full year of continuous service. Below one year no gratuity is due, even if the employment has lasted several months.';
    } else if (raw > cap) {
      total = cap;
      capNote = 'Cap applied: two years\' wage (' + aed(cap) + ')';
      note = 'The uncapped amount would be ' + aed(raw) + ', but Article 51 caps total gratuity at two years\' wage, so the result is capped at ' + aed(cap) + '.';
    }
    total = Math.round(total * 100) / 100;
    $('ae-total').textContent = aed(total);
    $('ae-res-daily').textContent = aed(daily);
    $('ae-res-first').textContent = num(firstDays) + ' days = ' + aed(firstAmount);
    $('ae-res-after').textContent = num(afterDays) + ' days = ' + aed(afterAmount);
    $('ae-res-partial').textContent = num(partialDays) + ' days = ' + aed(partialAmount);
    $('ae-res-cap').textContent = capNote;
    $('ae-res-service').textContent = num(fullYears) + ' years, ' + num(remDays) + ' days (' + num(serviceYears) + ' years in total)';
    $('ae-note').textContent = note;
  }
  var btn = $('ae-btn');
  if (btn) btn.addEventListener('click', calc);
  ['ae-basic', 'ae-years', 'ae-months', 'ae-days', 'ae-unpaid', 'ae-total-wage'].forEach(function (id) {
    var el = $(id);
    if (el) el.addEventListener('input', calc);
    if (el) el.addEventListener('change', calc);
  });
  calc();
})();
