/* Benzine, Korting, Fooi, Vermogen, Goudprijs, Lease, Huur, Aandelen (NL).
   - calcBenzine({ afstandKm, verbruikPer100, prijsPerLiter }): liters =
     afstand x verbruik / 100; kosten = liters x prijs.
   - calcKorting({ prijs, kortingPct, korting2Pct }): nieuwe prijs na 1 of 2
     kortingen achter elkaar; besparing = prijs - nieuw.
   - calcFooi({ rekening, fooiPct, personen }): fooi = rekening x pct; totaal
     en bedrag per persoon.
   - calcVermogen({ bezittingen, schulden }): netto = bezittingen - schulden.
   - calcGoud({ gram, karaat, prijsPerGram }): waarde = gram x (karaat/24) x prijs.
   - calcLease({ aanschaf, aanbetaling, restwaarde, maanden, rentePct }):
     maand = (aanschaf - aanbetaling - restwaarde)/maanden + aanschaf x rente/12.
     SCHATTING: echte lease kent meer kosten (onderhoud, verzekering, BPM).
   - calcHuur({ nettoMaand }): max huur = 30% van netto maandinkomen (vuistregel).
   - calcAandelen({ aantal, aankoop, verkoop, kosten, dividend }): winst =
     (verkoop - aankoop) x aantal - kosten + dividend; rendement op inleg.
   Voorbeelden: benzine 100 km, 6 L/100, EUR 1,90 -> 6 L, EUR 11,40.
   Korting: 100, 20% + 10% -> 72, besparing 28. Goud: 10 g 18 kt a EUR 80/g -> 600.
   Lease: 30.000, 0, 12.000, 48 mnd, 5% -> 500/mnd. Aandelen: 100 x (12-10) - 10 = 190. */
function r2(n) { return Math.round(n * 100) / 100; }
function calcBenzine(i) {
  var liters = (parseFloat(i.afstandKm) || 0) * (parseFloat(i.verbruikPer100) || 0) / 100;
  var kosten = liters * (parseFloat(i.prijsPerLiter) || 0);
  return { liters: r2(liters), kosten: r2(kosten), perKm: r2(kosten / Math.max(1, parseFloat(i.afstandKm) || 1)) };
}
function calcKorting(i) {
  var prijs = Math.max(0, parseFloat(i.prijs) || 0);
  var nieuw = prijs * (1 - (parseFloat(i.kortingPct) || 0) / 100) * (1 - (parseFloat(i.korting2Pct) || 0) / 100);
  return { nieuwePrijs: r2(nieuw), besparing: r2(prijs - nieuw), kortingPctTotaal: r2((1 - nieuw / Math.max(1, prijs)) * 100) };
}
function calcFooi(i) {
  var rekening = Math.max(0, parseFloat(i.rekening) || 0);
  var fooi = rekening * (parseFloat(i.fooiPct) || 0) / 100;
  var personen = Math.max(1, parseInt(i.personen, 10) || 1);
  return { fooi: r2(fooi), totaal: r2(rekening + fooi), perPersoon: r2((rekening + fooi) / personen) };
}
function calcVermogen(i) {
  var bezit = parseFloat(i.bezittingen) || 0;
  var schuld = parseFloat(i.schulden) || 0;
  return { netto: r2(bezit - schuld), bezittingen: r2(bezit), schulden: r2(schuld) };
}
function calcGoud(i) {
  var waarde = (parseFloat(i.gram) || 0) * ((parseFloat(i.karaat) || 24) / 24) * (parseFloat(i.prijsPerGram) || 0);
  return { waarde: r2(waarde), puurGoudGram: r2((parseFloat(i.gram) || 0) * ((parseFloat(i.karaat) || 24) / 24)) };
}
function calcLease(i) {
  var aanschaf = Math.max(0, parseFloat(i.aanschaf) || 0);
  var afschrijving = (aanschaf - (parseFloat(i.aanbetaling) || 0) - (parseFloat(i.restwaarde) || 0)) / Math.max(1, parseInt(i.maanden, 10) || 1);
  var rente = aanschaf * (parseFloat(i.rentePct) || 0) / 100 / 12;
  return { maand: r2(afschrijving + rente), afschrijving: r2(afschrijving), rente: r2(rente) };
}
function calcHuur(i) {
  var netto = Math.max(0, parseFloat(i.nettoMaand) || 0);
  return { maxHuur: r2(netto * 0.3), comfortabel: r2(netto * 0.25) };
}
function calcAandelen(i) {
  var aantal = Math.max(0, parseFloat(i.aantal) || 0);
  var inleg = aantal * (parseFloat(i.aankoop) || 0);
  var opbrengst = aantal * (parseFloat(i.verkoop) || 0);
  var winst = opbrengst - inleg - (parseFloat(i.kosten) || 0) + (parseFloat(i.dividend) || 0);
  return { winst: r2(winst), rendementPct: inleg > 0 ? r2(winst / inleg * 100) : 0, opbrengst: r2(opbrengst), inleg: r2(inleg) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function eur(n) { return '€ ' + new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    function f2(n) { return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    function wire(prefix, ids, render) {
      var btn = el(prefix + '-btn'); if (!btn) { return; }
      function run() {
        render();
        var res = el(prefix + '-result');
        if (res) { res.classList.add('show'); }
      }
      btn.addEventListener('click', run);
      ids.forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', run); f.addEventListener('change', run); } });
      run();
    }
    wire('nlben', ['nlben-afstand', 'nlben-verbruik', 'nlben-prijs'], function () {
      var r = calcBenzine({ afstandKm: el('nlben-afstand').value, verbruikPer100: el('nlben-verbruik').value, prijsPerLiter: el('nlben-prijs').value });
      el('nlben-big').textContent = eur(r.kosten);
      el('nlben-rows').innerHTML = '<tr><td>Brandstof nodig</td><td>' + f2(r.liters) + ' liter</td></tr><tr><td>Kosten</td><td>' + eur(r.kosten) + '</td></tr><tr><td>Kosten per kilometer</td><td>' + eur(r.perKm) + '</td></tr>';
    });
    wire('nlkor', ['nlkor-prijs', 'nlkor-korting', 'nlkor-korting2'], function () {
      var r = calcKorting({ prijs: el('nlkor-prijs').value, kortingPct: el('nlkor-korting').value, korting2Pct: el('nlkor-korting2').value });
      el('nlkor-big').textContent = eur(r.nieuwePrijs);
      el('nlkor-rows').innerHTML = '<tr><td>Nieuwe prijs</td><td>' + eur(r.nieuwePrijs) + '</td></tr><tr><td>Besparing</td><td>' + eur(r.besparing) + '</td></tr><tr><td>Totale korting</td><td>' + f2(r.kortingPctTotaal) + ' %</td></tr>';
    });
    wire('nlfooi', ['nlfooi-rekening', 'nlfooi-pct', 'nlfooi-personen'], function () {
      var r = calcFooi({ rekening: el('nlfooi-rekening').value, fooiPct: el('nlfooi-pct').value, personen: el('nlfooi-personen').value });
      el('nlfooi-big').textContent = eur(r.totaal);
      el('nlfooi-rows').innerHTML = '<tr><td>Fooi</td><td>' + eur(r.fooi) + '</td></tr><tr><td>Totaalbedrag</td><td>' + eur(r.totaal) + '</td></tr><tr><td>Per persoon</td><td>' + eur(r.perPersoon) + '</td></tr>';
    });
    wire('nlver', ['nlver-bezit', 'nlver-schuld'], function () {
      var r = calcVermogen({ bezittingen: el('nlver-bezit').value, schulden: el('nlver-schuld').value });
      el('nlver-big').textContent = eur(r.netto);
      el('nlver-rows').innerHTML = '<tr><td>Bezittingen</td><td>' + eur(r.bezittingen) + '</td></tr><tr><td>Schulden</td><td>' + eur(r.schulden) + '</td></tr><tr><td>Netto vermogen</td><td>' + eur(r.netto) + '</td></tr>';
    });
    wire('nlgoud', ['nlgoud-gram', 'nlgoud-karaat', 'nlgoud-prijs'], function () {
      var r = calcGoud({ gram: el('nlgoud-gram').value, karaat: el('nlgoud-karaat').value, prijsPerGram: el('nlgoud-prijs').value });
      el('nlgoud-big').textContent = eur(r.waarde);
      el('nlgoud-rows').innerHTML = '<tr><td>Waarde van het goud</td><td>' + eur(r.waarde) + '</td></tr><tr><td>Puur goud</td><td>' + f2(r.puurGoudGram) + ' gram</td></tr>';
    });
    wire('nllease', ['nllease-aanschaf', 'nllease-aanbetaling', 'nllease-rest', 'nllease-maanden', 'nllease-rente'], function () {
      var r = calcLease({ aanschaf: el('nllease-aanschaf').value, aanbetaling: el('nllease-aanbetaling').value, restwaarde: el('nllease-rest').value, maanden: el('nllease-maanden').value, rentePct: el('nllease-rente').value });
      el('nllease-big').textContent = eur(r.maand) + ' per maand';
      el('nllease-rows').innerHTML = '<tr><td>Maandbedrag (schatting)</td><td>' + eur(r.maand) + '</td></tr><tr><td>Afschrijving per maand</td><td>' + eur(r.afschrijving) + '</td></tr><tr><td>Rente per maand</td><td>' + eur(r.rente) + '</td></tr>';
    });
    wire('nlhuur', ['nlhuur-netto'], function () {
      var r = calcHuur({ nettoMaand: el('nlhuur-netto').value });
      el('nlhuur-big').textContent = eur(r.maxHuur) + ' per maand';
      el('nlhuur-rows').innerHTML = '<tr><td>Maximale huur (30%-regel)</td><td>' + eur(r.maxHuur) + '</td></tr><tr><td>Comfortabel (25%-regel)</td><td>' + eur(r.comfortabel) + '</td></tr>';
    });
    wire('nlaan', ['nlaan-aantal', 'nlaan-aankoop', 'nlaan-verkoop', 'nlaan-kosten', 'nlaan-dividend'], function () {
      var r = calcAandelen({ aantal: el('nlaan-aantal').value, aankoop: el('nlaan-aankoop').value, verkoop: el('nlaan-verkoop').value, kosten: el('nlaan-kosten').value, dividend: el('nlaan-dividend').value });
      el('nlaan-big').textContent = eur(r.winst);
      el('nlaan-rows').innerHTML = '<tr><td>Winst / verlies</td><td>' + eur(r.winst) + '</td></tr><tr><td>Rendement</td><td>' + f2(r.rendementPct) + ' %</td></tr><tr><td>Opbrengst verkoop</td><td>' + eur(r.opbrengst) + '</td></tr><tr><td>Inleg</td><td>' + eur(r.inleg) + '</td></tr>';
    });
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcBenzine: calcBenzine, calcKorting: calcKorting, calcFooi: calcFooi, calcVermogen: calcVermogen, calcGoud: calcGoud, calcLease: calcLease, calcHuur: calcHuur, calcAandelen: calcAandelen }; }
