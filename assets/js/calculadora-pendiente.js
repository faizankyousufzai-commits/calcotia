/* Calculadora de pendiente.
   API: calcPendiente({ desnivel, longitud }) y pendienteRecta({ x1, y1, x2, y2 })
   - Rampa: pendiente % = desnivel / longitud horizontal x 100;
     angulo = atan(desnivel / longitud) en grados.
   - Limites CTE (Documento Basico SUA, accesibilidad) para rampas:
     tramos de menos de 3 m: 10 % max.; de 3 a 6 m: 8 % max.;
     de mas de 6 m: 6 % max.; pendiente transversal max. 2 %.
     VERIFICAR contra el texto del CTE DB-SUA antes de publicar
     (valores de uso comun, pendientes de cotejo con el documento).
   - Recta por dos puntos: m = (y2 - y1) / (x2 - x1); angulo = atan(m).
   Ejemplo verificado: desnivel 1 m, longitud 10 m -> 10 %, 5,71 deg;
   tramo de 10 m: limite CTE 6 % -> NO cumple. */
var CTE_LIMITES = [
  { maxLongitud: 3, maxPct: 10 },
  { maxLongitud: 6, maxPct: 8 },
  { maxLongitud: Infinity, maxPct: 6 }
];
function limiteCTE(longitud) {
  for (var i = 0; i < CTE_LIMITES.length; i++) {
    if (longitud < CTE_LIMITES[i].maxLongitud || (CTE_LIMITES[i].maxLongitud === Infinity)) {
      return CTE_LIMITES[i].maxPct;
    }
  }
  return 6;
}
function calcPendiente(input) {
  var desnivel = Math.max(0, parseFloat(input.desnivel) || 0);
  var longitud = Math.max(0, parseFloat(input.longitud) || 0);
  function r2(n) { return Math.round(n * 100) / 100; }
  if (longitud === 0) { return { pct: null, grados: null, limiteCTE: null, cumpleCTE: null }; }
  var pct = desnivel / longitud * 100;
  var grados = Math.atan(desnivel / longitud) * 180 / Math.PI;
  var limite = limiteCTE(longitud);
  return { pct: r2(pct), grados: r2(grados), limiteCTE: limite, cumpleCTE: pct <= limite };
}
function pendienteRecta(input) {
  var dx = (parseFloat(input.x2) || 0) - (parseFloat(input.x1) || 0);
  var dy = (parseFloat(input.y2) || 0) - (parseFloat(input.y1) || 0);
  function r4(n) { return Math.round(n * 10000) / 10000; }
  if (dx === 0) { return { m: null, grados: 90, vertical: true }; }
  var m = dy / dx;
  return { m: r4(m), grados: r4(Math.atan(m) * 180 / Math.PI), vertical: false };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function render() {
      var r = calcPendiente({ desnivel: el('espen-desnivel') ? el('espen-desnivel').value : 0,
        longitud: el('espen-longitud') ? el('espen-longitud').value : 0 });
      var big = el('espen-big'); if (!big) { return; }
      big.textContent = r.pct === null ? 'Introduce desnivel y longitud' : r.pct + ' %  (' + r.grados + '°)';
      var rows = el('espen-rows'); if (!rows) { return; }
      rows.innerHTML = r.pct === null ? '' :
        '<tr><td>Pendiente</td><td>' + r.pct + ' %</td></tr>' +
        '<tr><td>Ángulo</td><td>' + r.grados + '°</td></tr>' +
        '<tr><td>Límite CTE para este tramo</td><td>' + r.limiteCTE + ' %</td></tr>' +
        '<tr><td>¿Cumple el CTE?</td><td>' + (r.cumpleCTE ? 'Sí' : 'No') + '</td></tr>';
    
    var res = el('espen-result'); if (res) { res.classList.add('show'); }
}
    var btn = el('espen-btn'); if (btn) { btn.addEventListener('click', render); }
    ['espen-desnivel', 'espen-longitud'].forEach(function (id) {
      var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); }
    });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcPendiente: calcPendiente, pendienteRecta: pendienteRecta, limiteCTE: limiteCTE };
}
