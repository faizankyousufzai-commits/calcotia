/* Calculadora de intereses legales (Espana).
   API: calcInteresesLegales({ capital, fechaInicio, fechaFin, tipo })
   Tipos verificados 2026 (prorroga de la Ley 31/2022 de Presupuestos 2023):
   - legal: 3,25 % anual (interes legal del dinero).
   - demora tributaria: 4,0625 % (= 3,25 % x 1,25; LGT art. 26.6).
   - procesal: 5,25 % (= legal + 2 puntos; LEC art. 576, desde la sentencia).
   - demora comercial Ley 3/2004: 1er semestre 2026 10,15 %; 2o semestre
     2026 10,40 % (BOE-A-2026-14327). La tabla incluye 2023-2026; para
     anos anteriores la pagina debe usar la tabla del Banco de Espana.
   Metodo: interes simple por tramos anuales, base 365 dias:
   interes = capital x tipo x dias / 365. Sin anatocismo salvo pacto
   o norma expresa (los intereses no generan intereses por si solos).
   Fuentes: Ley 31/2022 (PGE 2023, prorrogados); AEAT; Banco de Espana.
   Ejemplo verificado: 10.000 EUR, 1 ano completo 2026, legal 3,25 % -> 325,00.
   ADVERTENCIA: los tipos 2026 seguiran vigentes hasta que se apruebe una
   nueva Ley de Presupuestos; comprobar antes de usar en un pleito. */
var TIPOS_LEGALES = {
  2023: { legal: 3.25, demora: 4.0625, procesal: 5.25 },
  2024: { legal: 3.25, demora: 4.0625, procesal: 5.25 },
  2025: { legal: 3.25, demora: 4.0625, procesal: 5.25 },
  2026: { legal: 3.25, demora: 4.0625, procesal: 5.25 }
};
function diasEntre(a, b) {
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
}
function calcInteresesLegales(input) {
  var capital = Math.max(0, parseFloat(input.capital) || 0);
  var tipo = ['legal', 'demora', 'procesal'].indexOf(input.tipo) > -1 ? input.tipo : 'legal';
  var inicio = new Date(input.fechaInicio), fin = new Date(input.fechaFin);
  function r2(n) { return Math.round(n * 100) / 100; }
  if (isNaN(inicio) || isNaN(fin) || fin <= inicio) {
    return { capital: r2(capital), dias: 0, desglose: [], interes: 0, total: r2(capital) };
  }
  var desglose = [], interes = 0;
  var cursor = new Date(inicio);
  while (cursor < fin) {
    var ano = cursor.getFullYear();
    var finAno = new Date(ano + 1, 0, 1);
    var tramoFin = fin < finAno ? fin : finAno;
    var dias = Math.round((tramoFin - cursor) / 86400000);
    var tabla = TIPOS_LEGALES[ano];
    if (tabla && dias > 0) {
      var pct = tabla[tipo];
      var imp = capital * pct / 100 * dias / 365;
      desglose.push({ ano: ano, dias: dias, tipoPct: pct, interes: r2(imp) });
      interes += imp;
    } else if (dias > 0) {
      desglose.push({ ano: ano, dias: dias, tipoPct: null, interes: 0, sinTipo: true });
    }
    cursor = tramoFin;
  }
  return { capital: r2(capital), dias: diasEntre(inicio, fin), desglose: desglose,
    interes: r2(interes), total: r2(capital + interes) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function eur(n) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n); }
    function render() {
      var r = calcInteresesLegales({ capital: el('esint-capital') ? el('esint-capital').value : 0,
        fechaInicio: el('esint-inicio') ? el('esint-inicio').value : '',
        fechaFin: el('esint-fin') ? el('esint-fin').value : '',
        tipo: el('esint-tipo') ? el('esint-tipo').value : 'legal' });
      var big = el('esint-big'); if (!big) { return; }
      big.textContent = eur(r.interes);
      var rows = el('esint-rows'); if (!rows) { return; }
      var html = '<tr><td>Capital</td><td>' + eur(r.capital) + '</td></tr>';
      r.desglose.forEach(function (d) {
        html += '<tr><td>' + d.ano + ' (' + d.dias + ' días, ' + (d.tipoPct === null ? 'tipo no incluido' : d.tipoPct + ' %') + ')</td><td>' + eur(d.interes) + '</td></tr>';
      });
      html += '<tr><td>Total (capital + intereses)</td><td>' + eur(r.total) + '</td></tr>';
      rows.innerHTML = html;
    
    var res = el('esint-result'); if (res) { res.classList.add('show'); }
}
    var btn = el('esint-btn'); if (btn) { btn.addEventListener('click', render); }
    ['esint-capital', 'esint-inicio', 'esint-fin', 'esint-tipo'].forEach(function (id) {
      var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); }
    });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcInteresesLegales: calcInteresesLegales, TIPOS_LEGALES: TIPOS_LEGALES };
}
