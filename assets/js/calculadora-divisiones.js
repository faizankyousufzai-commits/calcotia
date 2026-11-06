/* Calculadora de divisiones paso a paso.
   API: dividir({ dividendo, divisor, decimales })
   - Division entera: cociente y resto (resto < divisor).
   - Con decimales: continua bajando ceros hasta el numero de decimales
     pedido (por defecto 2) y devuelve el cociente decimal redondeado.
   - Pasos de la division larga: por cada cifra bajada, el cociente
     parcial y el resto parcial, para dibujar la "caja" de la division.
   - Prueba de la division: dividendo = divisor x cociente + resto.
   Devuelve { cociente, resto, cocienteDecimal, pasos, prueba }.
   Ejemplo verificado: 100 / 7 -> cociente 14, resto 2;
   con decimales 14,29; prueba: 7 x 14 + 2 = 100. */
function dividir(input) {
  var dividendo = Math.max(0, Math.floor(parseFloat(input.dividendo) || 0));
  var divisor = Math.max(1, Math.floor(parseFloat(input.divisor) || 1));
  var decimales = Math.max(0, Math.min(10, parseInt(input.decimales, 10) || 2));
  function r2(n) { return Math.round(n * 100) / 100; }
  var cociente = Math.floor(dividendo / divisor);
  var resto = dividendo % divisor;
  var pasos = [];
  var cifras = String(dividendo).split('');
  var parcial = 0, cocienteParcial = '';
  cifras.forEach(function (cifra) {
    parcial = parcial * 10 + parseInt(cifra, 10);
    if (parcial >= divisor) {
      var q = Math.floor(parcial / divisor);
      cocienteParcial += q;
      pasos.push({ bajada: cifra, parcial: parcial, q: q, resto: parcial - q * divisor });
      parcial = parcial - q * divisor;
    } else {
      if (cocienteParcial.length > 0) { cocienteParcial += '0'; }
      pasos.push({ bajada: cifra, parcial: parcial, q: 0, resto: parcial });
    }
  });
  var cocienteDecimal = r2(dividendo / divisor);
  return { dividendo: dividendo, divisor: divisor, cociente: cociente, resto: resto,
    cocienteDecimal: cocienteDecimal, decimales: decimales, pasos: pasos,
    prueba: divisor * cociente + resto };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function render() {
      var r = dividir({ dividendo: el('esdiv-dividendo') ? el('esdiv-dividendo').value : 0,
        divisor: el('esdiv-divisor') ? el('esdiv-divisor').value : 1,
        decimales: el('esdiv-decimales') ? el('esdiv-decimales').value : 2 });
      var big = el('esdiv-big'); if (!big) { return; }
      big.textContent = r.cociente + '  (resto ' + r.resto + ')';
      var rows = el('esdiv-rows'); if (!rows) { return; }
      rows.innerHTML = '<tr><td>Cociente</td><td>' + r.cociente + '</td></tr>' +
        '<tr><td>Resto</td><td>' + r.resto + '</td></tr>' +
        '<tr><td>Con decimales</td><td>' + String(r.cocienteDecimal).replace('.', ',') + '</td></tr>' +
        '<tr><td>Prueba: ' + r.divisor + ' × ' + r.cociente + ' + ' + r.resto + '</td><td>' + r.prueba + '</td></tr>';
    
    var res = el('esdiv-result'); if (res) { res.classList.add('show'); }
}
    var btn = el('esdiv-btn'); if (btn) { btn.addEventListener('click', render); }
    ['esdiv-dividendo', 'esdiv-divisor', 'esdiv-decimales'].forEach(function (id) {
      var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); }
    });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { dividir: dividir }; }
