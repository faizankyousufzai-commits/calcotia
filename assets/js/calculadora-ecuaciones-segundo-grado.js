/* Calculadora de ecuaciones de segundo grado.
   API: resolverEcuacion2Grado({ a, b, c })
   - Ecuacion: a x^2 + b x + c = 0 (a != 0; si a = 0 es lineal: x = -c/b).
   - Discriminante D = b^2 - 4ac.
     D > 0: dos raices reales, x = (-b ± sqrt(D)) / 2a.
     D = 0: raiz doble, x = -b / 2a.
     D < 0: dos raices complejas conjugadas, parte real -b/2a,
     parte imaginaria ± sqrt(-D)/2a.
   - Vertice: x = -b/2a, y = c - b^2/4a ( = -D/4a ).
   - Ecuaciones incompletas (b = 0 o c = 0) se resuelven con la misma
     formula; el texto de la pagina debe explicarlo paso a paso.
   Devuelve { discriminante, tipo, raices: [{re, im}], vertice }.
   Ejemplo verificado: x^2 - 5x + 6 = 0 -> D = 1, raices 3 y 2;
   vertice (2,5; -0,25). */
function resolverEcuacion2Grado(input) {
  var a = parseFloat(input.a) || 0, b = parseFloat(input.b) || 0, c = parseFloat(input.c) || 0;
  function r4(n) { return Math.round(n * 10000) / 10000; }
  var vertice = a !== 0 ? { x: r4(-b / (2 * a)), y: r4(c - b * b / (4 * a)) } : null;
  if (a === 0) {
    if (b === 0) { return { discriminante: null, tipo: 'sin-solucion-o-identidad', raices: [], vertice: null }; }
    return { discriminante: null, tipo: 'lineal', raices: [{ re: r4(-c / b), im: 0 }], vertice: null };
  }
  var D = b * b - 4 * a * c;
  var raices, tipo;
  if (D > 0) {
    var s = Math.sqrt(D);
    raices = [{ re: r4((-b + s) / (2 * a)), im: 0 }, { re: r4((-b - s) / (2 * a)), im: 0 }];
    tipo = 'dos-reales';
  } else if (D === 0) {
    raices = [{ re: r4(-b / (2 * a)), im: 0 }];
    tipo = 'doble';
  } else {
    var s2 = Math.sqrt(-D);
    raices = [{ re: r4(-b / (2 * a)), im: r4(s2 / (2 * a)) }, { re: r4(-b / (2 * a)), im: r4(-s2 / (2 * a)) }];
    tipo = 'complejas';
  }
  return { discriminante: r4(D), tipo: tipo, raices: raices, vertice: vertice };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function fmtRaiz(r) {
      if (r.im === 0) { return String(r.re); }
      return r.re + (r.im > 0 ? ' + ' : ' − ') + Math.abs(r.im) + 'i';
    }
    function render() {
      var r = resolverEcuacion2Grado({ a: el('esec-a') ? el('esec-a').value : 0,
        b: el('esec-b') ? el('esec-b').value : 0, c: el('esec-c') ? el('esec-c').value : 0 });
      var big = el('esec-big'); if (!big) { return; }
      big.textContent = r.raices.length ? 'x = ' + r.raices.map(fmtRaiz).join('  ·  ') : 'Sin solución única';
      var rows = el('esec-rows'); if (!rows) { return; }
      rows.innerHTML = '<tr><td>Discriminante (b² − 4ac)</td><td>' + (r.discriminante === null ? '—' : r.discriminante) + '</td></tr>' +
        (r.vertice ? '<tr><td>Vértice</td><td>(' + r.vertice.x + ', ' + r.vertice.y + ')</td></tr>' : '');
    
    var res = el('esec-result'); if (res) { res.classList.add('show'); }
}
    var btn = el('esec-btn'); if (btn) { btn.addEventListener('click', render); }
    ['esec-a', 'esec-b', 'esec-c'].forEach(function (id) {
      var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); }
    });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { resolverEcuacion2Grado: resolverEcuacion2Grado }; }
