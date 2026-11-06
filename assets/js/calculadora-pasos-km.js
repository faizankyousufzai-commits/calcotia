/* Calculadora de pasos a km.
   API: calcPasosKm({ alturaCm, pasos, km, sexo, velocidadKmh })
   - Longitud de paso estimada: altura x 0,413 (mujer) o x 0,415 (hombre);
     por defecto 0,413. Es una estimacion media: la longitud real varia con
     la persona y el ritmo.
   - pasos -> km: km = pasos x longitudPaso / 1000.
   - km -> pasos: pasos = km x 1000 / longitudPaso.
   - Tiempo andando a una velocidad dada: minutos = km / velocidadKmh x 60.
   Devuelve { longitudPasoM, km, pasos, minutos, horasMin }.
   Ejemplo verificado: 170 cm, 10.000 pasos -> paso 0,70 m -> 7,02 km. */
function calcPasosKm(input) {
  var altura = Math.max(0, parseFloat(input.alturaCm) || 0);
  var factor = input.sexo === 'hombre' ? 0.415 : 0.413;
  var pasoM = altura / 100 * factor;
  var pasos = Math.max(0, parseFloat(input.pasos) || 0);
  var km = Math.max(0, parseFloat(input.km) || 0);
  var vel = Math.max(0, parseFloat(input.velocidadKmh) || 5);
  function r2(n) { return Math.round(n * 100) / 100; }
  if (pasos > 0 && !(km > 0)) { km = pasos * pasoM / 1000; }
  if (km > 0 && !(pasos > 0)) { pasos = km * 1000 / pasoM; }
  var minutos = km > 0 ? km / vel * 60 : 0;
  return { longitudPasoM: r2(pasoM), km: r2(km), pasos: Math.round(pasos),
    minutos: Math.round(minutos), horasMin: Math.floor(minutos / 60) + ' h ' + Math.round(minutos % 60) + ' min' };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function num(n) { return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    function render() {
      var r = calcPasosKm({ alturaCm: el('espas-altura') ? el('espas-altura').value : 0,
        pasos: el('espas-pasos') ? el('espas-pasos').value : 0,
        km: el('espas-km') ? el('espas-km').value : 0,
        sexo: el('espas-sexo') ? el('espas-sexo').value : 'mujer',
        velocidadKmh: el('espas-vel') ? el('espas-vel').value : 5 });
      var big = el('espas-big'); if (!big) { return; }
      big.textContent = num(r.km) + ' km';
      var rows = el('espas-rows'); if (!rows) { return; }
      rows.innerHTML = '<tr><td>Longitud de paso estimada</td><td>' + num(r.longitudPasoM) + ' m</td></tr>' +
        '<tr><td>Pasos</td><td>' + new Intl.NumberFormat('es-ES').format(r.pasos) + '</td></tr>' +
        '<tr><td>Distancia</td><td>' + num(r.km) + ' km</td></tr>' +
        '<tr><td>Tiempo andando</td><td>' + r.horasMin + '</td></tr>';
    }
    var btn = el('espas-btn'); if (btn) { btn.addEventListener('click', render); }
    ['espas-altura', 'espas-pasos', 'espas-km', 'espas-sexo', 'espas-vel'].forEach(function (id) {
      var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); }
    });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcPasosKm: calcPasosKm }; }
