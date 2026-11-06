/* Calculadora sueldo neto 2026 (Espana).
   API: calcSueldoNeto({ brutoAnual, pagas, retencionPct, temporal })
   - Seguridad Social a cargo del trabajador, verificada 2026
     (Orden PJC/297/2026): contingencias comunes 4,70 % + desempleo
     1,55 % (1,60 % temporal) + formacion profesional 0,10 % +
     MEI 0,15 % = 6,50 % (6,55 % temporal). Se aplica sobre la base de
     cotizacion (bruto mensual prorrateado), con tope: base maxima
     5.101,20 EUR/mes en 2026.
   - IRPF: la retencion la introduce el usuario (o se estima con el
     porcentaje que indica su nomina). EL ALGORITMO COMPLETO DE RETENCION
     DE LA AEAT (situacion familiar, hijos, discapacidad, minimo personal)
     NO se replica: es un procedimiento oficial con muchas variables.
     La pagina debe decir que el resultado es una ESTIMACION y que la
     retencion exacta es la de la nomina. BLOQUEADOR documentado en
     implant-engines.md.
   - Neto mensual en 12 pagas = neto anual / 12; en 14 pagas = neto / 14.
   Fuentes: AEAT (procedimiento de retenciones); TGSS (bases y tipos).
   Ejemplo verificado: bruto 30.000, 14 pagas, retencion 15 % ->
   SS 1.950, IRPF 4.500, neto 23.550; mensual 14 pagas 1.682,14. */
var SS_CC = 0.047, SS_FP = 0.001, SS_MEI = 0.0015, BASE_MAX_MES = 5101.20;
function calcSueldoNeto(input) {
  var bruto = Math.max(0, parseFloat(input.brutoAnual) || 0);
  var pagas = [12, 14].indexOf(parseInt(input.pagas, 10)) > -1 ? parseInt(input.pagas, 10) : 14;
  var ret = Math.max(0, Math.min(100, parseFloat(input.retencionPct) || 0)) / 100;
  var desempleo = input.temporal ? 0.016 : 0.0155;
  function r2(n) { return Math.round(n * 100) / 100; }
  var baseMes = Math.min(bruto / 12, BASE_MAX_MES);
  var ssPct = SS_CC + desempleo + SS_FP + SS_MEI;
  var ss = r2(baseMes * ssPct * 12);
  var irpf = r2(bruto * ret);
  var neto = r2(bruto - ss - irpf);
  return { brutoAnual: r2(bruto), ssPct: r2(ssPct * 100), ss: ss, irpf: irpf,
    netoAnual: neto, netoMensual: r2(neto / pagas), pagas: pagas,
    baseMaxAplicada: baseMes < bruto / 12 };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function eur(n) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n); }
    function render() {
      var r = calcSueldoNeto({ brutoAnual: el('essueldo-bruto') ? el('essueldo-bruto').value : 0,
        pagas: el('essueldo-pagas') ? el('essueldo-pagas').value : 14,
        retencionPct: el('essueldo-ret') ? el('essueldo-ret').value : 0,
        temporal: el('essueldo-temporal') ? el('essueldo-temporal').checked : false });
      var big = el('essueldo-big'); if (!big) { return; }
      big.textContent = eur(r.netoMensual) + ' / mes (' + r.pagas + ' pagas)';
      var rows = el('essueldo-rows'); if (!rows) { return; }
      rows.innerHTML = '<tr><td>Salario bruto anual</td><td>' + eur(r.brutoAnual) + '</td></tr>' +
        '<tr><td>Seguridad Social (' + r.ssPct + ' %)</td><td>− ' + eur(r.ss) + '</td></tr>' +
        '<tr><td>Retención IRPF</td><td>− ' + eur(r.irpf) + '</td></tr>' +
        '<tr><td>Sueldo neto anual</td><td>' + eur(r.netoAnual) + '</td></tr>' +
        '<tr><td>Sueldo neto mensual (' + r.pagas + ' pagas)</td><td>' + eur(r.netoMensual) + '</td></tr>';
    }
    var btn = el('essueldo-btn'); if (btn) { btn.addEventListener('click', render); }
    ['essueldo-bruto', 'essueldo-pagas', 'essueldo-ret', 'essueldo-temporal'].forEach(function (id) {
      var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); }
    });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcSueldoNeto: calcSueldoNeto }; }
