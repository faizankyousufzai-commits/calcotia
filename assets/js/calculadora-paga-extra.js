/* Calculadora paga extra (Espana 2026).
   API: calcPagaExtra({ importePaga, diasDevengados, diasPeriodo, modo })
   - Parte proporcional: paga x dias devengados / dias del periodo de
     devengo. El periodo lo fija el convenio (habitual: 12 meses; ejemplo
     Navidad: devengo de julio a junio o de enero a diciembre segun convenio).
   - Prorrateo mensual: paga / 12 (o paga / meses del periodo) en cada nomina.
   - Para el finiquito, la parte proporcional de la paga es uno de los tres
     conceptos (ver calculadora-finiquito: ET art. 31, dos pagas al ano).
   Fuente: Estatuto de los Trabajadores, art. 31 (RD Legislativo 2/2015).
   Ejemplo verificado: paga 1.800, 6 meses devengados de 12 ->
   parte proporcional 900; prorrateo 150/mes. */
function calcPagaExtra(input) {
  var paga = Math.max(0, parseFloat(input.importePaga) || 0);
  var diasDev = Math.max(0, parseFloat(input.diasDevengados) || 0);
  var diasPer = Math.max(1, parseFloat(input.diasPeriodo) || 365);
  function r2(n) { return Math.round(n * 100) / 100; }
  var proporcional = paga * Math.min(diasDev, diasPer) / diasPer;
  return { importePaga: r2(paga), diasDevengados: diasDev, diasPeriodo: diasPer,
    parteProporcional: r2(proporcional), prorrateoMensual: r2(paga / 12),
    pendiente: r2(paga - proporcional) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function eur(n) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n); }
    function render() {
      var r = calcPagaExtra({ importePaga: el('espaga-importe') ? el('espaga-importe').value : 0,
        diasDevengados: el('espaga-dias') ? el('espaga-dias').value : 0,
        diasPeriodo: el('espaga-periodo') ? el('espaga-periodo').value : 365 });
      var big = el('espaga-big'); if (!big) { return; }
      big.textContent = eur(r.parteProporcional);
      var rows = el('espaga-rows'); if (!rows) { return; }
      rows.innerHTML = '<tr><td>Importe de la paga extra</td><td>' + eur(r.importePaga) + '</td></tr>' +
        '<tr><td>Parte proporcional devengada</td><td>' + eur(r.parteProporcional) + '</td></tr>' +
        '<tr><td>Prorrateo mensual (paga / 12)</td><td>' + eur(r.prorrateoMensual) + '</td></tr>' +
        '<tr><td>Queda por devengar</td><td>' + eur(r.pendiente) + '</td></tr>';
    
    var res = el('espaga-result'); if (res) { res.classList.add('show'); }
}
    var btn = el('espaga-btn'); if (btn) { btn.addEventListener('click', render); }
    ['espaga-importe', 'espaga-dias', 'espaga-periodo'].forEach(function (id) {
      var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); }
    });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcPagaExtra: calcPagaExtra }; }
