/* Bijtelling, Reiskosten, Studielening (DUO), Incassokosten (WIK), Uren, Vakantiedagen (NL).
   - calcBijtelling({ cataloguswaarde, type, tariefPct }): benzine/diesel 22%;
     elektrisch (eerste toelating 2026) 18% tot EUR 30.000, 22% daarboven;
     youngtimer (ouder dan 15 jaar) 35% van de dagwaarde (hier: cataloguswaarde
     als benadering, pagina legt uit dat het om de dagwaarde gaat).
     Netto kosten/maand = bijtelling x marginaal tarief / 12.
   - calcReiskosten({ kmEnkeleReis, dagenPerWeek, tariefPerKm }): per maand =
     km x 2 x dagen x 4,33 x tarief. Onbelast max EUR 0,23/km in 2026.
   - calcStudielening({ bedrag, rentePct, maanden }): annuiteit; DUO-rente voert
     de gebruiker zelf in (controleer duo.nl; standaard 2,57%).
   - calcIncassokosten({ hoofdsom }): WIK-staffel: 15% over eerste 2.500
     (min. 40); 10% over 2.500-5.000; 5% over 5.000-10.000; 1% over
     10.000-200.000; 0,5% daarboven; max. 6.775.
   - calcUren({ begin (HH:MM), eind (HH:MM), pauzeMin, uurloon, dagenPerWeek }):
     gewerkte uren en loon per dag/week/maand.
   - calcVakantiedagen({ urenPerWeek, opgenomenDagen }): wettelijk minimum =
     4 x wekelijkse uren; dag = urenPerWeek / 5.
   Voorbeelden: EV 40.000 -> bijtelling 7.600/jr; netto bij 37,56% = 237,88/mnd.
   Reiskosten 25 km, 4 dgn, 0,23 -> 199,33/mnd. WIK over 6.000 -> 675.
   Uren 09:00-17:30, pauze 30, EUR 15/u -> 8 uur, EUR 120/dag.
   Vakantiedagen 40 uur/week -> 160 uur = 20 dagen. */
function r2(n) { return Math.round(n * 100) / 100; }
function calcBijtelling(i) {
  var cat = Math.max(0, parseFloat(i.cataloguswaarde) || 0);
  var bijtelling;
  if (i.type === 'elektrisch') { bijtelling = Math.min(cat, 30000) * 0.18 + Math.max(0, cat - 30000) * 0.22; }
  else if (i.type === 'youngtimer') { bijtelling = cat * 0.35; }
  else { bijtelling = cat * 0.22; }
  var tarief = (parseFloat(i.tariefPct) || 37.56) / 100;
  return { bijtellingJaar: r2(bijtelling), nettoMaand: r2(bijtelling * tarief / 12), brutoMaand: r2(bijtelling / 12) };
}
function calcReiskosten(i) {
  var km = Math.max(0, parseFloat(i.kmEnkeleReis) || 0);
  var dagen = Math.max(0, parseFloat(i.dagenPerWeek) || 0);
  var tarief = parseFloat(i.tariefPerKm) || 0.23;
  var perMaand = km * 2 * dagen * (52 / 12) * tarief;
  return { perMaand: r2(perMaand), perJaar: r2(perMaand * 12), perDag: r2(km * 2 * tarief) };
}
function calcStudielening(i) {
  var P = Math.max(0, parseFloat(i.bedrag) || 0);
  var r = Math.max(0, parseFloat(i.rentePct) || 0) / 100 / 12;
  var n = Math.max(1, parseInt(i.maanden, 10) || 1);
  var maand = r === 0 ? P / n : P * r / (1 - Math.pow(1 + r, -n));
  return { maandlast: r2(maand), totaleRente: r2(maand * n - P), totaal: r2(maand * n) };
}
function calcIncassokosten(i) {
  var h = Math.max(0, parseFloat(i.hoofdsom) || 0);
  var kosten = 0;
  function deel(van, tot, pct) { kosten += Math.max(0, Math.min(h, tot) - van) * pct; }
  deel(0, 2500, 0.15); deel(2500, 5000, 0.10); deel(5000, 10000, 0.05);
  deel(10000, 200000, 0.01); deel(200000, Infinity, 0.005);
  kosten = Math.max(kosten, h > 0 ? 40 : 0);
  kosten = Math.min(kosten, 6775);
  return { kosten: r2(kosten), totaal: r2(h + kosten) };
}
function calcUren(i) {
  function toMin(s) { var p = String(s || '09:00').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); }
  var min = toMin(i.eind) - toMin(i.begin) - (parseFloat(i.pauzeMin) || 0);
  var uren = Math.max(0, min / 60);
  var loon = parseFloat(i.uurloon) || 0;
  var dagen = Math.max(1, parseFloat(i.dagenPerWeek) || 5);
  return { urenDag: r2(uren), loonDag: r2(uren * loon), loonWeek: r2(uren * loon * dagen), loonMaand: r2(uren * loon * dagen * (52 / 12)) };
}
function calcVakantiedagen(i) {
  var urenWeek = Math.max(0, parseFloat(i.urenPerWeek) || 0);
  var opbouwUren = urenWeek * 4;
  var dagUren = urenWeek / 5;
  var opgenomen = Math.max(0, parseFloat(i.opgenomenDagen) || 0);
  var totaalDagen = dagUren > 0 ? opbouwUren / dagUren : 0;
  return { opbouwUren: r2(opbouwUren), totaalDagen: r2(totaalDagen), overDagen: r2(Math.max(0, totaalDagen - opgenomen)) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function eur(n) { return '€ ' + new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    function f2(n) { return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    function wire(prefix, ids, render) {
      var btn = el(prefix + '-btn'); if (!btn) { return; }
      btn.addEventListener('click', render);
      ids.forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); } });
      render();
    }
    wire('nlbij', ['nlbij-catalogus', 'nlbij-type', 'nlbij-tarief'], function () {
      var r = calcBijtelling({ cataloguswaarde: el('nlbij-catalogus').value, type: el('nlbij-type').value, tariefPct: el('nlbij-tarief').value });
      el('nlbij-big').textContent = eur(r.nettoMaand) + ' netto per maand';
      el('nlbij-rows').innerHTML = '<tr><td>Bijtelling per jaar</td><td>' + eur(r.bijtellingJaar) + '</td></tr><tr><td>Bijtelling per maand (bruto)</td><td>' + eur(r.brutoMaand) + '</td></tr><tr><td>Netto kosten per maand</td><td>' + eur(r.nettoMaand) + '</td></tr>';
    });
    wire('nlrei', ['nlrei-km', 'nlrei-dagen', 'nlrei-tarief'], function () {
      var r = calcReiskosten({ kmEnkeleReis: el('nlrei-km').value, dagenPerWeek: el('nlrei-dagen').value, tariefPerKm: el('nlrei-tarief').value });
      el('nlrei-big').textContent = eur(r.perMaand) + ' per maand';
      el('nlrei-rows').innerHTML = '<tr><td>Vergoeding per maand</td><td>' + eur(r.perMaand) + '</td></tr><tr><td>Vergoeding per jaar</td><td>' + eur(r.perJaar) + '</td></tr><tr><td>Vergoeding per dag</td><td>' + eur(r.perDag) + '</td></tr>';
    });
    wire('nlstu', ['nlstu-bedrag', 'nlstu-rente', 'nlstu-maanden'], function () {
      var r = calcStudielening({ bedrag: el('nlstu-bedrag').value, rentePct: el('nlstu-rente').value, maanden: el('nlstu-maanden').value });
      el('nlstu-big').textContent = eur(r.maandlast) + ' per maand';
      el('nlstu-rows').innerHTML = '<tr><td>Maandelijkse aflossing</td><td>' + eur(r.maandlast) + '</td></tr><tr><td>Totale rente</td><td>' + eur(r.totaleRente) + '</td></tr><tr><td>Totaal terug te betalen</td><td>' + eur(r.totaal) + '</td></tr>';
    });
    wire('nlinc', ['nlinc-hoofdsom'], function () {
      var r = calcIncassokosten({ hoofdsom: el('nlinc-hoofdsom').value });
      el('nlinc-big').textContent = eur(r.kosten);
      el('nlinc-rows').innerHTML = '<tr><td>Wettelijke incassokosten (WIK)</td><td>' + eur(r.kosten) + '</td></tr><tr><td>Totaal inclusief hoofdsom</td><td>' + eur(r.totaal) + '</td></tr>';
    });
    wire('nluren', ['nluren-begin', 'nluren-eind', 'nluren-pauze', 'nluren-loon', 'nluren-dagen'], function () {
      var r = calcUren({ begin: el('nluren-begin').value, eind: el('nluren-eind').value, pauzeMin: el('nluren-pauze').value, uurloon: el('nluren-loon').value, dagenPerWeek: el('nluren-dagen').value });
      el('nluren-big').textContent = f2(r.urenDag) + ' uur per dag';
      el('nluren-rows').innerHTML = '<tr><td>Uren per dag</td><td>' + f2(r.urenDag) + ' uur</td></tr><tr><td>Loon per dag</td><td>' + eur(r.loonDag) + '</td></tr><tr><td>Loon per week</td><td>' + eur(r.loonWeek) + '</td></tr><tr><td>Loon per maand</td><td>' + eur(r.loonMaand) + '</td></tr>';
    });
    wire('nlvak', ['nlvak-uren', 'nlvak-opgenomen'], function () {
      var r = calcVakantiedagen({ urenPerWeek: el('nlvak-uren').value, opgenomenDagen: el('nlvak-opgenomen').value });
      el('nlvak-big').textContent = f2(r.totaalDagen) + ' dagen per jaar';
      el('nlvak-rows').innerHTML = '<tr><td>Wettelijke opbouw</td><td>' + f2(r.opbouwUren) + ' uur (' + f2(r.totaalDagen) + ' dagen)</td></tr><tr><td>Nog over na opname</td><td>' + f2(r.overDagen) + ' dagen</td></tr>';
    });
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcBijtelling: calcBijtelling, calcReiskosten: calcReiskosten, calcStudielening: calcStudielening, calcIncassokosten: calcIncassokosten, calcUren: calcUren, calcVakantiedagen: calcVakantiedagen }; }
