/* Alcohol Calculator (NL) — Widmark.
   API: calcAlcohol({ geslacht, gewichtKg, glazen, uren, alcoholGramPerGlas })
   - Standaardglas = 10 g pure alcohol (Nederlandse definitie).
   - Lichaamswater: man 0,68 x kg; vrouw 0,55 x kg.
   - Promillage = alcohol(g) / (lichaamswater in kg) - 0,15 x uren (afbraak).
     Nooit onder 0. Dit is een SCHATTING: eten, tempo en lever spelen mee.
   Voorbeeld: man 80 kg, 4 glazen (40 g), 2 uur -> 40/(0,68*80)=0,74 - 0,30 = 0,44 promille.
   Let op: in Nederland is de limiet 0,5 promille (0,2 voor beginnende bestuurders). */
function calcAlcohol(i) {
  var kg = Math.max(0, parseFloat(i.gewichtKg) || 0);
  var glazen = Math.max(0, parseFloat(i.glazen) || 0);
  var uren = Math.max(0, parseFloat(i.uren) || 0);
  var perGlas = parseFloat(i.alcoholGramPerGlas) || 10;
  var factor = i.geslacht === 'vrouw' ? 0.55 : 0.68;
  var gram = glazen * perGlas;
  var promille = kg > 0 ? gram / (factor * kg) - 0.15 * uren : 0;
  promille = Math.max(0, promille);
  function r2(n) { return Math.round(n * 100) / 100; }
  var nuchterUren = promille > 0 ? Math.ceil((gram / (factor * kg)) / 0.15) : 0;
  return { promille: r2(promille), gramAlcohol: Math.round(gram), nuchterNaUren: nuchterUren, bovenLimiet: promille > 0.5 };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function f2(n) { return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    var btn = el('nlal-btn'); if (!btn) { return; }
    function render() {
      var r = calcAlcohol({ geslacht: el('nlal-geslacht').value, gewichtKg: el('nlal-gewicht').value, glazen: el('nlal-glazen').value, uren: el('nlal-uren').value });
      el('nlal-big').textContent = f2(r.promille) + ' ‰';
      el('nlal-rows').innerHTML = '<tr><td>Geschat promillage</td><td>' + f2(r.promille) + ' promille</td></tr><tr><td>Alcohol gedronken</td><td>' + r.gramAlcohol + ' gram</td></tr><tr><td>Nuchter na ongeveer</td><td>' + r.nuchterNaUren + ' uur</td></tr><tr><td>Rijlimiet (0,5 promille)</td><td>' + (r.bovenLimiet ? 'Overschreden – niet rijden' : 'Onder de limiet – rijd nooit na drinken') + '</td></tr>';
    }
    btn.addEventListener('click', render);
    ['nlal-geslacht', 'nlal-gewicht', 'nlal-glazen', 'nlal-uren'].forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); } });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcAlcohol: calcAlcohol }; }
