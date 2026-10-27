// Philippines 13th month pay calculator (13th month pay calculator).
// Presidential Decree No. 851: 13th month pay = total basic salary earned in
// the calendar year / 12. Rank-and-file employees who worked at least one
// month in the year are entitled; the amount is pro-rated for partial years.
// Basic salary excludes overtime, holiday pay, night shift differential,
// cost-of-living allowance and bonuses, unless the contract, CBA or company
// policy treats them as part of basic pay. Payment is due on or before
// December 24. 13th month pay and other bonuses together are tax-exempt up to
// PHP 90,000 per calendar year (Republic Act No. 10963, TRAIN Law); any excess
// is added to taxable compensation income.
(function () {
  function $(id) { return document.getElementById(id); }
  function php(n) {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n);
  }
  function num(n) {
    return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }
  function calc() {
    var salary = parseFloat($('ph-salary').value) || 0;
    var months = parseFloat($('ph-months').value) || 0;
    var bonus = parseFloat($('ph-bonus').value) || 0;
    if (salary < 0) salary = 0;
    if (months < 0) months = 0;
    if (months > 12) months = 12;
    if (bonus < 0) bonus = 0;
    var totalBasic = salary * months;
    var gross = totalBasic / 12;
    var note = 'This is the gross 13th month pay, before any tax on the part above the exemption ceiling. Overtime, holiday pay, night differential and allowances are not included in basic salary.';
    if (months < 1) {
      gross = 0;
      note = 'At least one month of work in the calendar year is required. Below one month no 13th month pay is due under Presidential Decree No. 851.';
    }
    var totalBenefits = gross + bonus;
    var exempt = Math.min(totalBenefits, 90000);
    var taxable = Math.max(totalBenefits - 90000, 0);
    gross = Math.round(gross * 100) / 100;
    var half = Math.round(gross / 2 * 100) / 100;
    $('ph-total').textContent = php(gross);
    $('ph-res-basic').textContent = php(totalBasic);
    $('ph-res-half').textContent = php(half);
    $('ph-res-exempt').textContent = php(exempt);
    $('ph-res-taxable').textContent = php(taxable);
    $('ph-note').textContent = note;
  }
  var btn = $('ph-btn');
  if (btn) btn.addEventListener('click', calc);
  ['ph-salary', 'ph-months', 'ph-bonus'].forEach(function (id) {
    var el = $(id);
    if (el) el.addEventListener('input', calc);
    if (el) el.addEventListener('change', calc);
  });
  calc();
})();
