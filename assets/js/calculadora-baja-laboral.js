/* Calculadora baja laboral (incapacidad temporal, Espana 2026).
   API: calcBajaLaboral({ baseCotizacionMes, dias, causa })
   - Base reguladora diaria = base de cotizacion del mes anterior / 30
     (salario mensual). Desde el 1-12-2026, RD-ley 31/2026: se toma la base
     del mes anterior al mes previo a la baja. La pagina debe avisar de
     este cambio para bajas que empiecen desde diciembre de 2026.
   - Enfermedad comun / accidente no laboral (verificado, Seguridad Social):
     dias 1-3: 0 %; dias 4-20: 60 %; desde el dia 21: 75 %.
     Pago: dias 4-15 empresa; desde el dia 16 Seguridad Social/mutua.
   - Accidente de trabajo / enfermedad profesional: dia 1 salario integro
     (empresa); desde el dia siguiente: 75 %.
   - Requisito en enfermedad comun: 180 dias cotizados en los 5 anos
     anteriores. Muchos convenios mejoran estos minimos.
   Fuentes: LGSS arts. 171-173; RD 53/1980; Seguridad Social.
   Ejemplo verificado: base 2.000 (BR diaria 66,67), 30 dias, enfermedad
   comun -> dias 4-20: 680,00; dias 21-30: 500,00; total 1.180,00. */
function calcBajaLaboral(input) {
  var baseMes = Math.max(0, parseFloat(input.baseCotizacionMes) || 0);
  var dias = Math.max(0, Math.round(parseFloat(input.dias) || 0));
  var causa = input.causa === 'profesional' ? 'profesional' : 'comun';
  function r2(n) { return Math.round(n * 100) / 100; }
  var br = baseMes / 30;
  var tramos = [];
  if (causa === 'comun') {
    var d60 = Math.max(0, Math.min(dias, 20) - 3);
    var d75 = Math.max(0, dias - 20);
    tramos = [
      { nombre: 'Días 1-3 (sin prestación)', dias: Math.min(dias, 3), pct: 0, importe: 0 },
      { nombre: 'Días 4-20 (60 %)', dias: d60, pct: 60, importe: r2(d60 * br * 0.6) },
      { nombre: 'Desde el día 21 (75 %)', dias: d75, pct: 75, importe: r2(d75 * br * 0.75) }
    ];
  } else {
    var d75p = Math.max(0, dias - 1);
    tramos = [
      { nombre: 'Día 1 (salario íntegro, empresa)', dias: Math.min(dias, 1), pct: 100, importe: r2(Math.min(dias, 1) * br) },
      { nombre: 'Desde el día 2 (75 %)', dias: d75p, pct: 75, importe: r2(d75p * br * 0.75) }
    ];
  }
  var total = r2(tramos.reduce(function (s, t) { return s + t.importe; }, 0));
  return { baseReguladoraDiaria: r2(br), dias: dias, causa: causa, tramos: tramos, total: total };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function eur(n) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n); }
    function render() {
      var r = calcBajaLaboral({ baseCotizacionMes: el('esbaja-base') ? el('esbaja-base').value : 0,
        dias: el('esbaja-dias') ? el('esbaja-dias').value : 0,
        causa: el('esbaja-causa') ? el('esbaja-causa').value : 'comun' });
      var big = el('esbaja-big'); if (!big) { return; }
      big.textContent = eur(r.total);
      var rows = el('esbaja-rows'); if (!rows) { return; }
      var html = '<tr><td>Base reguladora diaria</td><td>' + eur(r.baseReguladoraDiaria) + '</td></tr>';
      r.tramos.forEach(function (t) {
        html += '<tr><td>' + t.nombre + '</td><td>' + eur(t.importe) + '</td></tr>';
      });
      html += '<tr><td>Total a cobrar</td><td>' + eur(r.total) + '</td></tr>';
      rows.innerHTML = html;
    
    var res = el('esbaja-result'); if (res) { res.classList.add('show'); }
}
    var btn = el('esbaja-btn'); if (btn) { btn.addEventListener('click', render); }
    ['esbaja-base', 'esbaja-dias', 'esbaja-causa'].forEach(function (id) {
      var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); }
    });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcBajaLaboral: calcBajaLaboral }; }
