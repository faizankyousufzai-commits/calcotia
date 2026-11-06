(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function num(id) {
    var v = parseFloat($(id).value);
    return isNaN(v) ? 0 : v;
  }

  // Hungarian money format: space thousands, comma decimals; 0 decimals when whole.
  function fmt(v) {
    var dec = Math.abs(v - Math.round(v)) < 0.005 ? 0 : 2;
    var s = Math.abs(v).toFixed(dec);
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (v < 0 ? '-' : '') + parts.join(',') + ' Ft';
  }

  function days(v) { return v + ' munkanap'; }
  function plus(v) { return '+' + v + ' munkanap'; }

  function ageSupplement(age) {
    var table = [[45, 10], [43, 9], [41, 8], [39, 7], [37, 6], [35, 5], [33, 4], [31, 3], [28, 2], [25, 1]];
    for (var i = 0; i < table.length; i++) {
      if (age >= table[i][0]) { return table[i][1]; }
    }
    return 0;
  }

  function childSupplement(n) {
    if (n <= 0) { return 0; }
    if (n === 1) { return 2; }
    if (n === 2) { return 4; }
    return 7;
  }

  function isLeap(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  function parseDate(str) {
    if (!str) { return null; }
    var parts = str.split('-');
    if (parts.length !== 3) { return null; }
    var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return isNaN(d.getTime()) ? null : d;
  }

  function calc() {
    var year = Math.floor(num('szab-year')) || 2026;
    var birth = Math.floor(num('szab-birth')) || 1996;
    var age = year - birth;
    var children = Math.max(0, Math.floor(num('szab-children')));
    var disabled = Math.max(0, Math.floor(num('szab-disabled')));
    var impair = $('szab-impair').checked;
    var under = $('szab-under').checked;
    var taken = Math.max(0, Math.floor(num('szab-taken')));
    var dailyHours = Math.max(1, num('szab-hours') || 8);

    var ageSupp = ageSupplement(age);
    var childSupp = childSupplement(children);
    var disSupp = disabled * 2;
    var otherSupp = 0;
    if (age <= 18) { otherSupp += 5; } // young worker, Mt. 119 (1)
    if (impair) { otherSupp += 5; }    // Mt. 120
    if (under) { otherSupp += 5; }     // Mt. 119 (2)

    var annual = 20 + ageSupp + childSupp + disSupp + otherSupp;

    // Pro-rata: calendar days employed in the year (inclusive) / 365 (366 leap).
    var start = parseDate($('szab-start').value);
    var end = parseDate($('szab-end').value);
    var jan1 = new Date(year, 0, 1);
    var dec31 = new Date(year, 11, 31);
    var prorata = annual;
    if (start || end) {
      var from = start && start > jan1 ? start : jan1;
      var to = end && end < dec31 ? end : dec31;
      var msPerDay = 24 * 60 * 60 * 1000;
      var employed = Math.floor((to - from) / msPerDay) + 1;
      if (employed < 0) { employed = 0; }
      var denom = isLeap(year) ? 366 : 365;
      prorata = Math.floor((annual * employed) / denom + 0.5); // fraction >= 0.5 rounds up
    }

    var left = Math.max(0, prorata - taken);

    // Money estimate: monthly base / working days of the termination month.
    // The superseded 174-hour divisor is NOT used.
    var base = Math.max(0, num('szab-base'));
    var monthDays = Math.max(1, Math.floor(num('szab-monthdays')) || 22);
    var supp = Math.max(0, num('szab-supp'));
    var suppHours = Math.max(0, num('szab-supphours'));
    var daily = base / monthDays;
    var suppDaily = (supp > 0 && suppHours > 0) ? (supp / suppHours) * dailyHours : 0;
    var dailyTotal = daily + suppDaily;
    var money = dailyTotal * left;

    $('szab-big').textContent = days(prorata);
    $('szab-r-base').textContent = days(20);
    $('szab-r-age').textContent = plus(ageSupp);
    $('szab-r-child').textContent = plus(childSupp);
    $('szab-r-disabled').textContent = plus(disSupp);
    $('szab-r-other').textContent = plus(otherSupp);
    $('szab-r-annual').textContent = days(annual);
    $('szab-r-prorata').textContent = days(prorata);
    $('szab-r-taken').textContent = days(taken);
    $('szab-r-left').textContent = days(left);
    $('szab-r-daily').textContent = fmt(dailyTotal);
    $('szab-r-money').textContent = fmt(money) + ' bruttó';
    $('szab-note').textContent = 'A pénzösszeg becslés: ' + fmt(base).replace(' Ft', '')
      + ' Ft ÷ ' + monthDays + ' munkanap = ' + fmt(dailyTotal)
      + ' naponta; ' + fmt(dailyTotal).replace(' Ft', '') + ' × ' + left
      + ' nap = ' + fmt(money)
      + ' bruttó, amelyből adó és járulék még levonódik. A hatályos Mt. 136. § (3) és 149. § '
      + 'szövegét a jelenlegi egységes szerkezetben nem ellenőriztük le, ezért a pénzösszeget nem '
      + 'állítjuk törvényben rögzített pontos összegként. A végső összeget a munkáltató állapítja meg '
      + 'a Munka törvénykönyve szerint.';
    $('szab-note2').textContent = taken > prorata
      ? 'Több napot vettél ki, mint amennyi időarányosan járt. Nincs általános, automatikus levonás '
        + 'a végső fizetésből; a jogalapot esetenként külön kell megvizsgálni.'
      : '';
  
  var resEl = $('szab-result'); if (resEl) { resEl.classList.add('show'); }
}

  $('szab-btn').addEventListener('click', calc);
})();
