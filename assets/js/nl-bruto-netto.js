/* Bruto Netto Calculator Nederland 2026 (NL) — SCHATTING.
   API: calcBrutoNetto({ brutoMaand, vakantiegeldPct })
   - Jaarloon = bruto maand x 12 x (1 + vakantiegeld%).
   - Box 1 schijven 2026 (onder AOW-leeftijd, Belastingdienst):
     35,75% tot EUR 38.883; 37,56% tot EUR 78.426; 49,50% daarboven.
   - Algemene heffingskorting: max EUR 3.115, afbouw 6,398% boven EUR 29.736,
     nihil vanaf EUR 78.427.
   - Arbeidskorting 2026: 8,324% tot EUR 11.965 (max 996); +31,009% tot
     EUR 25.845 (max 5.300); +1,950% tot EUR 45.592 (max 5.685);
     afbouw 6,51% daarboven, nihil vanaf EUR 132.921.
   SCHATTING: de werkgever past de loonheffingstabel toe; vakantiegeld wordt
   in de praktijk met het bijzondere tarief belast en pensioenpremie,
   WGA/WIA en andere inhoudingen zitten hier NIET in.
   Voorbeeld: EUR 3.500/maand + 8% vakantiegeld -> jaarloon 45.360;
   schijvenbelasting 16.333,43; algemene korting 2.115,38; arbeidskorting
   5.680,54; te betalen 8.537,51; netto jaar 36.822,49; netto maand 3.068,54. */
function schijvenBelasting(inkomen) {
  var b = 0;
  b += Math.min(inkomen, 38883) * 0.3575;
  if (inkomen > 38883) { b += (Math.min(inkomen, 78426) - 38883) * 0.3756; }
  if (inkomen > 78426) { b += (inkomen - 78426) * 0.495; }
  return b;
}
function algemeneHeffingskorting(inkomen) {
  if (inkomen <= 29736) { return 3115; }
  return Math.max(0, 3115 - (inkomen - 29736) * 0.06398);
}
function arbeidskorting(inkomen) {
  var k = 0;
  k += Math.min(inkomen, 11965) * 0.08324;
  if (inkomen > 11965) { k += (Math.min(inkomen, 25845) - 11965) * 0.31009; }
  k = Math.min(k, 5300);
  if (inkomen > 25845) { k += (Math.min(inkomen, 45592) - 25845) * 0.0195; }
  k = Math.min(k, 5685);
  if (inkomen > 45592) { k -= (inkomen - 45592) * 0.0651; }
  return Math.max(0, k);
}
function calcBrutoNetto(i) {
  var maand = Math.max(0, parseFloat(i.brutoMaand) || 0);
  var vg = Math.max(0, parseFloat(i.vakantiegeldPct) || 0) / 100;
  var jaar = maand * 12 * (1 + vg);
  var belasting = schijvenBelasting(jaar);
  var ahk = algemeneHeffingskorting(jaar);
  var ak = arbeidskorting(jaar);
  var teBetalen = Math.max(0, belasting - ahk - ak);
  function r(n) { return Math.round(n * 100) / 100; }
  return { jaarloon: r(jaar), belasting: r(belasting), algemeneKorting: r(ahk),
    arbeidskorting: r(ak), teBetalen: r(teBetalen), nettoJaar: r(jaar - teBetalen),
    nettoMaand: r((jaar - teBetalen) / 12), brutoMaand: r(maand) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function eur(n) { return '€ ' + new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    var btn = el('nlbn-btn'); if (!btn) { return; }
    function render() {
      var r = calcBrutoNetto({ brutoMaand: el('nlbn-maand').value, vakantiegeldPct: el('nlbn-vg').value });
      el('nlbn-big').textContent = eur(r.nettoMaand) + ' per maand';
      el('nlbn-rows').innerHTML = '<tr><td>Bruto jaarloon (incl. vakantiegeld)</td><td>' + eur(r.jaarloon) + '</td></tr>' +
        '<tr><td>Loonbelasting box 1 (schijven)</td><td>' + eur(r.belasting) + '</td></tr>' +
        '<tr><td>Algemene heffingskorting</td><td>− ' + eur(r.algemeneKorting) + '</td></tr>' +
        '<tr><td>Arbeidskorting</td><td>− ' + eur(r.arbeidskorting) + '</td></tr>' +
        '<tr><td>Te betalen belasting</td><td>' + eur(r.teBetalen) + '</td></tr>' +
        '<tr><td>Netto jaarloon</td><td>' + eur(r.nettoJaar) + '</td></tr>';
    }
    btn.addEventListener('click', render);
    ['nlbn-maand', 'nlbn-vg'].forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); } });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcBrutoNetto: calcBrutoNetto, schijvenBelasting: schijvenBelasting, algemeneHeffingskorting: algemeneHeffingskorting, arbeidskorting: arbeidskorting }; }
