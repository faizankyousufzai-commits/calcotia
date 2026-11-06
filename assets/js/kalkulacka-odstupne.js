(function () {
  'use strict';

  var THRESHOLD = 146901; // 2026 monthly advance threshold, CZK

  function $(id) { return document.getElementById(id); }

  function num(id) {
    var v = parseFloat($(id).value);
    return isNaN(v) ? 0 : v;
  }

  // Czech money format: space thousands, comma decimals; 0 decimals when whole.
  function fmt(v) {
    var dec = Math.abs(v - Math.round(v)) < 0.005 ? 0 : 2;
    var s = Math.abs(v).toFixed(dec);
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (v < 0 ? '-' : '') + parts.join(',') + ' Kč';
  }

  function tenureMultiple(years, months) {
    var total = years * 12 + months;
    if (total < 12) { return 1; }
    if (total < 24) { return 2; }
    return 3;
  }

  function calc() {
    var reason = $('odst-reason').value;
    var years = Math.max(0, Math.floor(num('odst-years')));
    var months = Math.max(0, Math.min(11, Math.floor(num('odst-months'))));
    var konto = $('odst-konto').checked;
    var mode = $('odst-mode').value;
    var other = Math.max(0, num('odst-other'));

    var avg;
    if (mode === 'derive') {
      var quarter = Math.max(0, num('odst-quarter'));
      var hours = Math.max(0, num('odst-hours'));
      var weekly = Math.max(0, num('odst-weekly'));
      avg = hours > 0 ? Math.round((quarter / hours) * weekly * 4.348) : 0;
    } else {
      avg = Math.round(Math.max(0, num('odst-avg')));
    }

    var mult, reasonLabel, isInjury = false, kontoIgnored = false;
    if (reason === 'inj') {
      mult = 12;
      reasonLabel = 'Pracovní úraz / nemoc z povolání (§ 52 d) — náhrada podle § 271ca';
      isInjury = true;
      if (konto) { kontoIgnored = true; }
    } else if (reason === 'exp') {
      mult = 12;
      reasonLabel = 'Nejvyšší přípustná expozice (§ 52 e)';
      if (konto) { kontoIgnored = true; }
    } else {
      var t = tenureMultiple(years, months);
      if (konto) {
        mult = 3 + t;
        reasonLabel = 'Organizační důvody + konto pracovní doby (§ 67 odst. 1 písm. d))';
      } else {
        mult = t;
        reasonLabel = 'Organizační důvody (§ 52 a–c)';
      }
    }

    var gross = avg * mult;

    $('odst-r-reason').textContent = reasonLabel;
    $('odst-r-mult').textContent = mult + '×';
    $('odst-r-avg').textContent = fmt(avg);
    $('odst-r-gross').textContent = fmt(gross);

    if (isInjury) {
      $('odst-big-label').textContent = 'Jednorázová náhrada (hrubá)';
      $('odst-big').textContent = fmt(gross);
      $('odst-r-tax15').textContent = '—';
      $('odst-r-tax23').textContent = '—';
      $('odst-r-tax').textContent = '—';
      $('odst-r-net').textContent = '—';
      $('odst-note').textContent = 'Toto není odstupné od zaměstnavatele, ale jednorázová náhrada '
        + 'hrazená ze zákonného pojištění odpovědnosti zaměstnavatele. Daňové posouzení se může '
        + 'lišit, ověřte je u zaměstnavatele či pojišťovny; kalkulačka proto nepočítá zálohu ani čistou částku.';
    } else {
      var band15 = Math.max(0, THRESHOLD - other);
      var tax15 = 0.15 * Math.min(gross, band15);
      var tax23 = 0.23 * Math.max(0, gross - band15);
      var tax = tax15 + tax23;
      var net = gross - tax;
      $('odst-big-label').textContent = 'Čisté odstupné před slevou na poplatníka';
      $('odst-big').textContent = fmt(net);
      $('odst-r-tax15').textContent = fmt(tax15);
      $('odst-r-tax23').textContent = fmt(tax23);
      $('odst-r-tax').textContent = fmt(tax);
      $('odst-r-net').textContent = fmt(net);
      $('odst-note').textContent = 'Záloha je počítána z odstupného s přihlédnutím k ostatním '
        + 'příjmům v měsíci výplaty. Základní sleva na poplatníka (2 570 Kč měsíčně, je-li '
        + 'podepsáno prohlášení a dosud nevyčerpána) a roční zúčtování mohou konečnou daň změnit.';
    }

    $('odst-note2').textContent = kontoIgnored
      ? 'Konto pracovní doby se uplatní jen u organizačních důvodů; u této volby se nezapočítává.'
      : '';
  
  var resEl = $('odst-result'); if (resEl) { resEl.classList.add('show'); }
}

  $('odst-btn').addEventListener('click', calc);
})();
