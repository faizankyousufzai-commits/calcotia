/* Calculadora de percentiles infantiles OMS (0-19 anos).
   API: calcPercentilesOMS({ sexo:'nino'|'nina', edadMeses, pesoKg, tallaCm })
   Devuelve: { imc, peso: { mediana, diferenciaKg, cercaMediana }, talla: {...}|null,
               percentil: null, aviso }.
   METODO: puntuacion z por LMS, z = ((valor/M)^L - 1) / (L*S) (L=0: z = ln(valor/M)/S),
   percentil = Phi(z)*100. La tabla LMS COMPLETA de la OMS (L, M, S por mes, sexo y
   medida) NO esta incrustada: no se pudo verificar una fuente fiable con valores
   L/M/S completos. BLOQUEADOR: antes de publicar, importar la tabla LMS oficial
   (WHO Child Growth Standards, 0-5 anos; WHO Growth Reference 5-19 anos) en
   percentiles-oms-datos.js y activar calcPercentilLMS().
   FALLBACK aplicado: comparacion con la mediana OMS P50 de peso para la edad
   (tabla verificada, valores publicados por la OMS; ver implant-engines.md) +
   IMC determinista. El percentil NO se inventa: se devuelve null con aviso.
   Fuente: WHO Child Growth Standards, https://www.who.int/tools/child-growth-standards
   La mediana NO es un objetivo ideal: cada nino sigue su propia curva; ante
   cualquier duda, consultar al pediatra. */
var OMS_P50_PESO = {
  nino: [[0, 3.3], [3, 6.4], [6, 7.9], [9, 8.9], [12, 9.6], [18, 10.9], [24, 12.2], [36, 14.3], [48, 16.3], [60, 18.3]],
  nina: [[0, 3.2], [3, 5.8], [6, 7.3], [9, 8.2], [12, 8.9], [18, 10.2], [24, 11.5], [36, 13.9], [48, 15.9], [60, 18.2]]
};
function interpolar(tabla, edad) {
  if (edad <= tabla[0][0]) { return tabla[0][1]; }
  for (var i = 1; i < tabla.length; i++) {
    if (edad <= tabla[i][0]) {
      var a = tabla[i - 1], b = tabla[i];
      return a[1] + (b[1] - a[1]) * (edad - a[0]) / (b[0] - a[0]);
    }
  }
  return tabla[tabla.length - 1][1];
}
function phi(z) {
  var t = 1 / (1 + 0.2316419 * Math.abs(z));
  var d = 0.3989423 * Math.exp(-z * z / 2);
  var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}
function zToPercentil(z) { return Math.round(phi(z) * 1000) / 10; }
function lmsZ(valor, L, M, S) {
  if (!(valor > 0) || !(M > 0) || !(S > 0)) { return null; }
  if (L === 0) { return Math.log(valor / M) / S; }
  return (Math.pow(valor / M, L) - 1) / (L * S);
}
function calcPercentilesOMS(input) {
  var sexo = input.sexo === 'nina' ? 'nina' : 'nino';
  var edad = Math.max(0, Math.min(228, parseFloat(input.edadMeses) || 0));
  var peso = Math.max(0, parseFloat(input.pesoKg) || 0);
  var talla = Math.max(0, parseFloat(input.tallaCm) || 0);
  function r2(n) { return Math.round(n * 100) / 100; }
  var out = { sexo: sexo, edadMeses: edad, imc: null, peso: null, percentil: null,
    aviso: 'Percentil exacto no disponible: falta la tabla LMS completa de la OMS (ver nota en la pagina). Se muestra la comparacion con la mediana OMS (P50).' };
  if (talla > 0 && peso > 0) { out.imc = r2(peso / Math.pow(talla / 100, 2)); }
  if (peso > 0 && edad <= 60) {
    var mediana = interpolar(OMS_P50_PESO[sexo], edad);
    out.peso = { mediana: r2(mediana), diferenciaKg: r2(peso - mediana),
      cercaMediana: Math.abs(peso - mediana) <= 0.1 * mediana };
  }
  return out;
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function num(n) { return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    function render() {
      var r = calcPercentilesOMS({ sexo: el('esperc-sexo') ? el('esperc-sexo').value : 'nino',
        edadMeses: el('esperc-edad') ? el('esperc-edad').value : 0,
        pesoKg: el('esperc-peso') ? el('esperc-peso').value : 0,
        tallaCm: el('esperc-talla') ? el('esperc-talla').value : 0 });
      var big = el('esperc-big'); if (!big) { return; }
      if (r.peso) {
        big.textContent = (r.peso.diferenciaKg >= 0 ? '+' : '') + num(r.peso.diferenciaKg) + ' kg respecto a la mediana OMS';
      } else if (r.imc) { big.textContent = 'IMC ' + num(r.imc); }
      else { big.textContent = 'Introduce el peso y la edad'; }
      var rows = el('esperc-rows'); if (!rows) { return; }
      var html = '';
      if (r.peso) { html += '<tr><td>Mediana OMS de peso para la edad (P50)</td><td>' + num(r.peso.mediana) + ' kg</td></tr>' +
        '<tr><td>Diferencia con la mediana</td><td>' + num(r.peso.diferenciaKg) + ' kg</td></tr>'; }
      if (r.imc) { html += '<tr><td>IMC (peso / talla²)</td><td>' + num(r.imc) + '</td></tr>'; }
      html += '<tr><td>Percentil exacto (LMS OMS)</td><td>Pendiente de la tabla LMS completa</td></tr>';
      rows.innerHTML = html;
      var note = el('esperc-note'); if (note) { note.textContent = r.aviso; }
    }
    var btn = el('esperc-btn'); if (btn) { btn.addEventListener('click', render); }
    ['esperc-sexo', 'esperc-edad', 'esperc-peso', 'esperc-talla'].forEach(function (id) {
      var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); }
    });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcPercentilesOMS: calcPercentilesOMS, zToPercentil: zToPercentil, lmsZ: lmsZ, interpolar: interpolar };
}
