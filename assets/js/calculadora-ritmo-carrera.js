/* Calculadora de ritmo de carrera.
   API: calcRitmoCarrera({ distanciaKm, horas, minutos, segundos })
   - Ritmo: min/km = tiempoTotalMin / distanciaKm.
   - Velocidad: km/h = distanciaKm / tiempoTotalHoras.
   - Estimacion de tiempos por la formula de Riegel:
     T2 = T1 x (D2 / D1)^1,06, para 5K, 10K, media maraton (21,0975 km)
     y maraton (42,195 km). Es una estimacion: supone un estado de forma
     equivalente y no tiene en cuenta el desnivel ni el calor.
   Devuelve { ritmoMinKm, ritmoTexto, kmh, predicciones: { '5K': min, ... } }.
   Ejemplo verificado: 5 km en 25:00 -> ritmo 5:00 min/km, 12 km/h,
   maraton estimada ~3 h 59 min (Riegel). */
function calcRitmoCarrera(input) {
  var d = Math.max(0, parseFloat(input.distanciaKm) || 0);
  var tMin = (parseFloat(input.horas) || 0) * 60 + (parseFloat(input.minutos) || 0) + (parseFloat(input.segundos) || 0) / 60;
  function r2(n) { return Math.round(n * 100) / 100; }
  function fmt(min) {
    var m = Math.floor(min), s = Math.round((min - m) * 60);
    if (s === 60) { m += 1; s = 0; }
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  var out = { ritmoMinKm: null, ritmoTexto: null, kmh: null, predicciones: {} };
  if (d > 0 && tMin > 0) {
    var ritmo = tMin / d;
    out.ritmoMinKm = r2(ritmo);
    out.ritmoTexto = fmt(ritmo) + ' min/km';
    out.kmh = r2(d / (tMin / 60));
    [['5K', 5], ['10K', 10], ['Media maratón', 21.0975], ['Maratón', 42.195]].forEach(function (p) {
      var t2 = tMin * Math.pow(p[1] / d, 1.06);
      out.predicciones[p[0]] = { minutos: r2(t2), texto: fmt(t2) };
    });
  }
  return out;
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function render() {
      var r = calcRitmoCarrera({ distanciaKm: el('esrit-dist') ? el('esrit-dist').value : 0,
        horas: el('esrit-h') ? el('esrit-h').value : 0,
        minutos: el('esrit-m') ? el('esrit-m').value : 0,
        segundos: el('esrit-s') ? el('esrit-s').value : 0 });
      var big = el('esrit-big'); if (!big) { return; }
      big.textContent = r.ritmoTexto || 'Introduce distancia y tiempo';
      var rows = el('esrit-rows'); if (!rows) { return; }
      var html = r.kmh ? '<tr><td>Velocidad</td><td>' + r.kmh + ' km/h</td></tr>' : '';
      Object.keys(r.predicciones).forEach(function (k) {
        html += '<tr><td>' + k + ' (fórmula de Riegel)</td><td>' + r.predicciones[k].texto + '</td></tr>';
      });
      rows.innerHTML = html;
    }
    var btn = el('esrit-btn'); if (btn) { btn.addEventListener('click', render); }
    ['esrit-dist', 'esrit-h', 'esrit-m', 'esrit-s'].forEach(function (id) {
      var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); }
    });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcRitmoCarrera: calcRitmoCarrera }; }
