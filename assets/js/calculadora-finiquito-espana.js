/* Calculadora finiquito España (Estatuto de los Trabajadores, RDL 2/2015).
   Finiquito ONLY: salario pendiente + vacaciones no disfrutadas +
   pagas extraordinarias proporcionales. No indemnizacion is computed here.
   Convention (stated on the page): salario diario = salario bruto mensual
   x 12 / 365. Each component is rounded to cents; the total is the sum of
   the rounded components, so the displayed rows always add up. */
function calcFiniquitoES(input) {
  var monthly = Math.max(0, parseFloat(input.monthly) || 0);
  var pagas = Math.min(12, Math.max(0, parseFloat(input.pagas) || 0));
  var prorrateadas = !!input.prorrateadas;
  var unpaidDays = Math.max(0, parseFloat(input.unpaidDays) || 0);
  var vacDays = Math.max(0, parseFloat(input.vacDays) || 0);
  var months = Math.min(12, Math.max(0, parseFloat(input.months) || 0));
  function r2(n) { return Math.round(n * 100) / 100; }
  var daily = monthly * 12 / 365;
  var unpaid = r2(unpaidDays * daily);
  var vac = r2(vacDays * daily);
  var pagasAmt = prorrateadas ? 0 : r2(pagas * monthly * months / 12);
  var total = r2(unpaid + vac + pagasAmt);
  return {
    daily: r2(daily), unpaid: unpaid, vac: vac, pagas: pagasAmt, total: total,
    unpaidDays: unpaidDays, vacDays: vacDays, pagasCount: pagas, months: months,
    prorrateadas: prorrateadas
  };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function eur(n) {
      return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
    }
    function num(n) {
      return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    }
    function render() {
      var r = calcFiniquitoES({
        monthly: el('esfin-monthly').value,
        pagas: el('esfin-pagas').value,
        prorrateadas: el('esfin-prorrateadas').checked,
        unpaidDays: el('esfin-unpaid').value,
        vacDays: el('esfin-vac').value,
        months: el('esfin-months').value
      });
      el('esfin-big').textContent = eur(r.total);
      var pagasLabel = r.prorrateadas
        ? 'Pagas extraordinarias proporcionales (prorrateadas: 0 €)'
        : 'Pagas extraordinarias proporcionales (' + num(r.pagasCount) + ' pagas × ' + num(r.months) + '/12)';
      el('esfin-rows').innerHTML =
        '<tr><td>Salario diario (mensual × 12 ÷ 365)</td><td>' + eur(r.daily) + '</td></tr>' +
        '<tr><td>Salario pendiente (' + num(r.unpaidDays) + ' días)</td><td>' + eur(r.unpaid) + '</td></tr>' +
        '<tr><td>Vacaciones no disfrutadas (' + num(r.vacDays) + ' días)</td><td>' + eur(r.vac) + '</td></tr>' +
        '<tr><td>' + pagasLabel + '</td><td>' + eur(r.pagas) + '</td></tr>' +
        '<tr><td>Total bruto del finiquito</td><td>' + eur(r.total) + '</td></tr>';
    
    var resEl = el('esfin-result'); if (resEl) { resEl.classList.add('show'); }
}
    var btn = el('esfin-btn');
    if (btn) { btn.addEventListener('click', render); }
    ['esfin-monthly', 'esfin-pagas', 'esfin-prorrateadas', 'esfin-unpaid', 'esfin-vac', 'esfin-months'].forEach(function (id) {
      var f = el(id);
      if (f) { f.addEventListener('input', render); f.addEventListener('change', render); }
    });
    render();
  })();
}
