/* Calculadora reduccion de jornada (Espana).
   API: calcReduccionJornada({ brutoMensual, horasCompletas, horasNuevas, retencionPct })
   - Nuevo sueldo bruto = bruto x horas nuevas / horas completas
     (reduccion proporcional del salario).
   - Reduccion por guarda legal o cuidado de familiar (ET art. 37.6):
     entre 1/8 y 1/2 de la jornada. La pagina debe avisar de ese rango
     legal y de que la concrecion horaria se pacta con la empresa.
   - Neto estimado: SS 6,50 % (2026, Orden PJC/297/2026) + retencion
     IRPF introducida por el usuario (ver nota en calculadora-sueldo-neto:
     el algoritmo completo de la AEAT no se replica; es una estimacion).
   Fuente: Estatuto de los Trabajadores, art. 37.6 (RD Legislativo 2/2015).
   Ejemplo verificado: bruto 2.000, 40 h -> 20 h, retencion 15 % ->
   bruto nuevo 1.000, SS 65, IRPF 150, neto 785. */
function calcReduccionJornada(input) {
  var bruto = Math.max(0, parseFloat(input.brutoMensual) || 0);
  var completas = Math.max(1, parseFloat(input.horasCompletas) || 40);
  var nuevas = Math.max(0, Math.min(completas, parseFloat(input.horasNuevas) || 0));
  var ret = Math.max(0, Math.min(100, parseFloat(input.retencionPct) || 0)) / 100;
  function r2(n) { return Math.round(n * 100) / 100; }
  var proporcion = nuevas / completas;
  var brutoNuevo = bruto * proporcion;
  var ss = brutoNuevo * 0.065;
  var irpf = brutoNuevo * ret;
  var reduccionPct = (1 - proporcion) * 100;
  return { brutoOriginal: r2(bruto), horasCompletas: completas, horasNuevas: nuevas,
    reduccionPct: r2(reduccionPct), dentroRangoLegal: reduccionPct >= 12.5 && reduccionPct <= 50,
    brutoNuevo: r2(brutoNuevo), ss: r2(ss), irpf: r2(irpf), netoNuevo: r2(brutoNuevo - ss - irpf) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function eur(n) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n); }
    function render() {
      var r = calcReduccionJornada({ brutoMensual: el('esred-bruto') ? el('esred-bruto').value : 0,
        horasCompletas: el('esred-completas') ? el('esred-completas').value : 40,
        horasNuevas: el('esred-nuevas') ? el('esred-nuevas').value : 0,
        retencionPct: el('esred-ret') ? el('esred-ret').value : 0 });
      var big = el('esred-big'); if (!big) { return; }
      big.textContent = eur(r.netoNuevo) + ' netos / mes';
      var rows = el('esred-rows'); if (!rows) { return; }
      rows.innerHTML = '<tr><td>Reducción de jornada</td><td>' + r.reduccionPct + ' %</td></tr>' +
        '<tr><td>Nuevo sueldo bruto</td><td>' + eur(r.brutoNuevo) + '</td></tr>' +
        '<tr><td>Seguridad Social (6,50 %)</td><td>− ' + eur(r.ss) + '</td></tr>' +
        '<tr><td>Retención IRPF</td><td>− ' + eur(r.irpf) + '</td></tr>' +
        '<tr><td>Nuevo sueldo neto estimado</td><td>' + eur(r.netoNuevo) + '</td></tr>';
    
    var res = el('esred-result'); if (res) { res.classList.add('show'); }
}
    var btn = el('esred-btn'); if (btn) { btn.addEventListener('click', render); }
    ['esred-bruto', 'esred-completas', 'esred-nuevas', 'esred-ret'].forEach(function (id) {
      var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); }
    });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcReduccionJornada: calcReduccionJornada }; }
