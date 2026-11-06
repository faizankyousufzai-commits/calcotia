/* Calculadora TAE (prestamo, Espana).
   API: calcTAE({ importe, tinPct, meses, comisionApertura, otrosGastos })
   - Cuota mensual por amortizacion francesa con el TIN nominal:
     cuota = P x i / (1 - (1+i)^-n), i = TIN/12.
   - TAE: tipo anual equivalente que iguala el importe neto recibido
     (importe - comisiones - gastos) con el valor actual de las cuotas.
     Se resuelve por biseccion sobre el tipo mensual (TIR mensual);
     TAE = (1 + i_mensual)^12 - 1. Sin comisiones, TAE > TIN por la
     capitalizacion mensual; con comisiones, la TAE sube mas.
   - Coste total = cuota x n - importe neto recibido + comisiones ya
     descontadas (se muestra desglosado).
   Fuente: formula de la TAE de la Ley 16/2011 y Circular 5/2012 del
   Banco de Espana; el euribor es solo el indice de referencia habitual
   de los prestamos a tipo variable y no entra en este calculo.
   Ejemplo verificado: 10.000 EUR, TIN 5 %, 24 meses, comision 100 EUR ->
   cuota ~438,71 EUR, TAE ~6,15 %. */
function calcTAE(input) {
  var P = Math.max(0, parseFloat(input.importe) || 0);
  var tin = Math.max(0, parseFloat(input.tinPct) || 0) / 100;
  var n = Math.max(1, Math.round(parseFloat(input.meses) || 0));
  var comision = Math.max(0, parseFloat(input.comisionApertura) || 0);
  var otros = Math.max(0, parseFloat(input.otrosGastos) || 0);
  function r2(x) { return Math.round(x * 100) / 100; }
  var i = tin / 12;
  var cuota = i === 0 ? P / n : P * i / (1 - Math.pow(1 + i, -n));
  var neto = P - comision - otros;
  function van(tipoMensual) {
    var s = 0;
    for (var k = 1; k <= n; k++) { s += cuota / Math.pow(1 + tipoMensual, k); }
    return s - neto;
  }
  var lo = 0, hi = 0.2, mid = 0;
  for (var j = 0; j < 200; j++) {
    mid = (lo + hi) / 2;
    if (van(mid) > 0) { lo = mid; } else { hi = mid; }
  }
  var tae = (Math.pow(1 + mid, 12) - 1) * 100;
  var totalCuotas = cuota * n;
  return { cuota: r2(cuota), tae: r2(tae), tinPct: tin * 100, netoRecibido: r2(neto),
    totalPagado: r2(totalCuotas), interesesYCostes: r2(totalCuotas - neto),
    comision: r2(comision), otrosGastos: r2(otros) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function eur(x) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(x); }
    function render() {
      var r = calcTAE({ importe: el('estae-importe') ? el('estae-importe').value : 0,
        tinPct: el('estae-tin') ? el('estae-tin').value : 0,
        meses: el('estae-meses') ? el('estae-meses').value : 0,
        comisionApertura: el('estae-comision') ? el('estae-comision').value : 0,
        otrosGastos: el('estae-otros') ? el('estae-otros').value : 0 });
      var big = el('estae-big'); if (!big) { return; }
      big.textContent = r.tae + ' % TAE';
      var rows = el('estae-rows'); if (!rows) { return; }
      rows.innerHTML = '<tr><td>Cuota mensual</td><td>' + eur(r.cuota) + '</td></tr>' +
        '<tr><td>TIN</td><td>' + r.tinPct + ' %</td></tr>' +
        '<tr><td>Importe neto recibido</td><td>' + eur(r.netoRecibido) + '</td></tr>' +
        '<tr><td>Total pagado en cuotas</td><td>' + eur(r.totalPagado) + '</td></tr>' +
        '<tr><td>Intereses y costes</td><td>' + eur(r.interesesYCostes) + '</td></tr>';
    }
    var btn = el('estae-btn'); if (btn) { btn.addEventListener('click', render); }
    ['estae-importe', 'estae-tin', 'estae-meses', 'estae-comision', 'estae-otros'].forEach(function (id) {
      var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); }
    });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcTAE: calcTAE }; }
