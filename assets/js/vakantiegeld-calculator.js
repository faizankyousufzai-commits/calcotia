// Netherlands holiday allowance calculator (vakantiegeld berekenen).
// Article 15 of the Minimum Wage and Minimum Holiday Allowance Act (Wet
// minimumloon en minimumvakantiebijslag, WML): every employee is entitled to
// a holiday allowance of at least 8% of the wage. The statutory 8% is
// calculated on the wage up to three times the minimum wage; above that
// amount the statutory minimum does not apply, although contracts and
// collective agreements (cao) usually still pay 8% over the full salary.
// The allowance accrues over the year, is normally paid once a year in May or
// June, and any amount still owed is paid out when the employment ends.
// This calculator therefore shows both figures: 8% over the full salary
// (the usual contract practice) and the statutory minimum with the ceiling
// applied. The ceiling amount is an editable input because the minimum wage
// is adjusted in January and July; the default of 7,011 euros per month is
// the three-times-minimum-wage figure reported for 1 July 2026.
(function () {
  function $(id) { return document.getElementById(id); }
  function eur(n) {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
  }
  function num(n) {
    return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }
  function calc() {
    var salary = parseFloat($('nl-salary').value) || 0;
    var months = parseFloat($('nl-months').value) || 0;
    var rate = parseFloat($('nl-rate').value) || 0;
    var ceiling = parseFloat($('nl-ceiling').value) || 0;
    if (salary < 0) salary = 0;
    if (months < 0) months = 0;
    if (months > 12) months = 12;
    if (rate < 0) rate = 0;
    if (ceiling < 0) ceiling = 0;
    var full = salary * months * rate / 100;
    var cappedSalary = Math.min(salary, ceiling);
    var statutory = cappedSalary * months * 8 / 100;
    var monthly = full / 12;
    var note = 'Dit is het bruto vakantiegeld, vóór loonheffing. Over vakantiegeld betaal je loonheffing tegen het bijzonder tarief, dus het nettobedrag hangt af van je jaarinkomen en je heffingskortingen.';
    if (months < 1) {
      note = 'Met nul gewerkte maanden in het opbouwjaar is er nog geen vakantiegeld opgebouwd. Het vakantiegeld bouwt maand voor maand op gedurende het jaar.';
    }
    full = Math.round(full * 100) / 100;
    statutory = Math.round(statutory * 100) / 100;
    monthly = Math.round(monthly * 100) / 100;
    $('nl-total').textContent = eur(full);
    $('nl-res-statutory').textContent = eur(statutory);
    $('nl-res-monthly').textContent = eur(monthly);
    $('nl-res-base').textContent = eur(cappedSalary) + ' per maand (gemaximeerd op ' + eur(ceiling) + ')';
    $('nl-note').textContent = note;
  }
  var btn = $('nl-btn');
  if (btn) btn.addEventListener('click', calc);
  ['nl-salary', 'nl-months', 'nl-rate', 'nl-ceiling'].forEach(function (id) {
    var el = $(id);
    if (el) el.addEventListener('input', calc);
    if (el) el.addEventListener('change', calc);
  });
  calc();
})();
