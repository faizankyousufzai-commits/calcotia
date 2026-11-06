/* Beton, Verf, Laminaat, Behang, Trap, Gordijnen, Egaline, Kabeldikte, Radiator, Graaddagen (NL).
   - calcBeton({ lengteM, breedteM, dikteCm }): volume = L x B x D; cement =
     300 kg per m3 (zakken van 25 kg); tel 10% extra aan als marge.
   - calcVerf({ oppervlakteM2, lagen, dekking }): liters = m2 x lagen / dekking
     (standaard 10 m2 per liter); blikken van 5 liter, afgerond omhoog.
   - calcLaminaat({ oppervlakteM2, pakM2, snijverliesPct }): dozen =
     ceil(m2 x (1+verlies) / pakinhoud).
   - calcBehang({ lengteM, hoogteM, muren, rolBreedteM, rolLengteM }):
     rollen = ceil(muur-m2 / rol-m2), met 10% patroonverlies.
   - calcTrap({ hoogteCm }): treden = ceil(hoogte/17,5); optrede = hoogte/treden;
     aantrede = 60 - 2 x optrede (Blondel: 2h + a = 60 cm); helling = atan(h/a).
   - calcGordijnen({ raamBreedteCm, raamHoogteCm, plooifactor, stofBreedteCm }):
     banen = ceil(breedte x factor / stofbreedte); meters = banen x (hoogte + 30 cm zoom).
   - calcEgaline({ oppervlakteM2, dikteMm }): kg = m2 x mm x 1,6; zakken van 25 kg.
   - calcKabeldikte({ vermogenW, spanningV, lengteM, verliesPct }): stroom = P/V;
     doorsnede = 2 x L x I x 0,0175 / dV (koper); advies = eerstvolgende
     standaardmaat (1,5 / 2,5 / 4 / 6 / 10 / 16 / 25 mm2).
   - calcRadiator({ volumeM3, isolatie }): vermogen = m3 x 70 / 85 / 100 W per m3.
   - calcGraaddagen({ tempGem, dagen, gasPerGraaddag }): graaddagen =
     max(0, 18 - temp) x dagen (18/18-methode); gas = graaddagen x factor
     (standaard 0,5 m3, schatting voor een gemiddelde woning).
   Voorbeelden: beton 5x4x0,1 m -> 2 m3, 24 zakken cement. Trap 280 cm ->
   16 treden, optrede 17,5, aantrede 25, helling 35 graden.
   Kabel: 2000 W, 230 V, 20 m, 3% -> 1,5 mm2. Egaline 20 m2, 5 mm -> 160 kg. */
function r2(n) { return Math.round(n * 100) / 100; }
function calcBeton(i) {
  var vol = (parseFloat(i.lengteM) || 0) * (parseFloat(i.breedteM) || 0) * ((parseFloat(i.dikteCm) || 0) / 100);
  return { volume: r2(vol), cementZakken: Math.ceil(vol * 300 / 25), volumeMetMarge: r2(vol * 1.1) };
}
function calcVerf(i) {
  var liters = (parseFloat(i.oppervlakteM2) || 0) * (parseFloat(i.lagen) || 1) / (parseFloat(i.dekking) || 10);
  return { liters: r2(liters), blikken5L: Math.ceil(liters / 5) };
}
function calcLaminaat(i) {
  var nodig = (parseFloat(i.oppervlakteM2) || 0) * (1 + (parseFloat(i.snijverliesPct) || 10) / 100);
  return { m2Nodig: r2(nodig), dozen: Math.ceil(nodig / (parseFloat(i.pakM2) || 2.22)) };
}
function calcBehang(i) {
  var muur = (parseFloat(i.lengteM) || 0) * (parseFloat(i.hoogteM) || 0) * (parseFloat(i.muren) || 1);
  var rol = (parseFloat(i.rolBreedteM) || 0.53) * (parseFloat(i.rolLengteM) || 10.05);
  return { muurM2: r2(muur), rollen: Math.ceil(muur * 1.1 / rol) };
}
function calcTrap(i) {
  var hoogte = Math.max(0, parseFloat(i.hoogteCm) || 0);
  var treden = Math.max(1, Math.ceil(hoogte / 17.5));
  var optrede = hoogte / treden;
  var aantrede = Math.max(20, 60 - 2 * optrede);
  var helling = Math.round(Math.atan(optrede / aantrede) * 180 / Math.PI * 10) / 10;
  return { treden: treden, optrede: r2(optrede), aantrede: r2(aantrede), hellingGraden: helling, traplengteCm: r2(treden * aantrede) };
}
function calcGordijnen(i) {
  var banen = Math.ceil((parseFloat(i.raamBreedteCm) || 0) * (parseFloat(i.plooifactor) || 2) / (parseFloat(i.stofBreedteCm) || 140));
  var meters = banen * (((parseFloat(i.raamHoogteCm) || 0) + 30) / 100);
  return { banen: banen, metersStof: r2(meters) };
}
function calcEgaline(i) {
  var kg = (parseFloat(i.oppervlakteM2) || 0) * (parseFloat(i.dikteMm) || 0) * 1.6;
  return { kg: r2(kg), zakken25kg: Math.ceil(kg / 25) };
}
function calcKabeldikte(i) {
  var P = Math.max(0, parseFloat(i.vermogenW) || 0);
  var V = parseFloat(i.spanningV) || 230;
  var L = Math.max(0, parseFloat(i.lengteM) || 0);
  var dV = V * (parseFloat(i.verliesPct) || 3) / 100;
  var stroom = P / V;
  var nodig = stroom > 0 && dV > 0 ? (2 * L * stroom * 0.0175) / dV : 0;
  var maten = [1.5, 2.5, 4, 6, 10, 16, 25, 35];
  var advies = maten[maten.length - 1];
  for (var k = 0; k < maten.length; k++) { if (maten[k] >= nodig) { advies = maten[k]; break; } }
  return { stroom: r2(stroom), doorsnedeNodig: r2(nodig), adviesMm2: advies };
}
function calcRadiator(i) {
  var factor = i.isolatie === 'goed' ? 70 : i.isolatie === 'slecht' ? 100 : 85;
  var vermogen = (parseFloat(i.volumeM3) || 0) * factor;
  return { vermogenW: Math.round(vermogen), factor: factor };
}
function calcGraaddagen(i) {
  var temp = parseFloat(i.tempGem);
  var dagen = Math.max(0, parseFloat(i.dagen) || 0);
  var gd = isNaN(temp) ? 0 : Math.max(0, 18 - temp) * dagen;
  var gas = gd * (parseFloat(i.gasPerGraaddag) || 0.5);
  return { graaddagen: r2(gd), gasM3: r2(gas) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function f2(n) { return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    function wire(prefix, ids, render) {
      var btn = el(prefix + '-btn'); if (!btn) { return; }
      btn.addEventListener('click', render);
      ids.forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); } });
      render();
    }
    wire('nlbet', ['nlbet-lengte', 'nlbet-breedte', 'nlbet-dikte'], function () {
      var r = calcBeton({ lengteM: el('nlbet-lengte').value, breedteM: el('nlbet-breedte').value, dikteCm: el('nlbet-dikte').value });
      el('nlbet-big').textContent = f2(r.volume) + ' m³';
      el('nlbet-rows').innerHTML = '<tr><td>Beton nodig</td><td>' + f2(r.volume) + ' m³</td></tr><tr><td>Met 10% marge</td><td>' + f2(r.volumeMetMarge) + ' m³</td></tr><tr><td>Zakken cement (25 kg)</td><td>' + r.cementZakken + ' zakken</td></tr>';
    });
    wire('nlverf', ['nlverf-m2', 'nlverf-lagen', 'nlverf-dekking'], function () {
      var r = calcVerf({ oppervlakteM2: el('nlverf-m2').value, lagen: el('nlverf-lagen').value, dekking: el('nlverf-dekking').value });
      el('nlverf-big').textContent = f2(r.liters) + ' liter';
      el('nlverf-rows').innerHTML = '<tr><td>Verf nodig</td><td>' + f2(r.liters) + ' liter</td></tr><tr><td>Blikken van 5 liter</td><td>' + r.blikken5L + '</td></tr>';
    });
    wire('nllam', ['nllam-m2', 'nllam-pak', 'nllam-verlies'], function () {
      var r = calcLaminaat({ oppervlakteM2: el('nllam-m2').value, pakM2: el('nllam-pak').value, snijverliesPct: el('nllam-verlies').value });
      el('nllam-big').textContent = r.dozen + ' dozen';
      el('nllam-rows').innerHTML = '<tr><td>Laminaat nodig (incl. snijverlies)</td><td>' + f2(r.m2Nodig) + ' m²</td></tr><tr><td>Dozen</td><td>' + r.dozen + '</td></tr>';
    });
    wire('nlbeh', ['nlbeh-lengte', 'nlbeh-hoogte', 'nlbeh-muren', 'nlbeh-breedte', 'nlbeh-rollengte'], function () {
      var r = calcBehang({ lengteM: el('nlbeh-lengte').value, hoogteM: el('nlbeh-hoogte').value, muren: el('nlbeh-muren').value, rolBreedteM: el('nlbeh-breedte').value, rolLengteM: el('nlbeh-rollengte').value });
      el('nlbeh-big').textContent = r.rollen + ' rollen';
      el('nlbeh-rows').innerHTML = '<tr><td>Muur-oppervlakte</td><td>' + f2(r.muurM2) + ' m²</td></tr><tr><td>Rollen behang (incl. patroonverlies)</td><td>' + r.rollen + '</td></tr>';
    });
    wire('nltrap', ['nltrap-hoogte'], function () {
      var r = calcTrap({ hoogteCm: el('nltrap-hoogte').value });
      el('nltrap-big').textContent = r.treden + ' treden';
      el('nltrap-rows').innerHTML = '<tr><td>Aantal treden</td><td>' + r.treden + '</td></tr><tr><td>Optrede</td><td>' + f2(r.optrede) + ' cm</td></tr><tr><td>Aantrede</td><td>' + f2(r.aantrede) + ' cm</td></tr><tr><td>Hellingshoek</td><td>' + f2(r.hellingGraden) + '°</td></tr><tr><td>Traplengte</td><td>' + f2(r.traplengteCm) + ' cm</td></tr>';
    });
    wire('nlgor', ['nlgor-breedte', 'nlgor-hoogte', 'nlgor-plooifactor', 'nlgor-stofbreedte'], function () {
      var r = calcGordijnen({ raamBreedteCm: el('nlgor-breedte').value, raamHoogteCm: el('nlgor-hoogte').value, plooifactor: el('nlgor-plooifactor').value, stofBreedteCm: el('nlgor-stofbreedte').value });
      el('nlgor-big').textContent = f2(r.metersStof) + ' meter stof';
      el('nlgor-rows').innerHTML = '<tr><td>Stof nodig</td><td>' + f2(r.metersStof) + ' meter</td></tr><tr><td>Aantal banen</td><td>' + r.banen + '</td></tr>';
    });
    wire('nlegal', ['nlegal-m2', 'nlegal-dikte'], function () {
      var r = calcEgaline({ oppervlakteM2: el('nlegal-m2').value, dikteMm: el('nlegal-dikte').value });
      el('nlegal-big').textContent = f2(r.kg) + ' kg';
      el('nlegal-rows').innerHTML = '<tr><td>Egaline nodig</td><td>' + f2(r.kg) + ' kg</td></tr><tr><td>Zakken (25 kg)</td><td>' + r.zakken25kg + '</td></tr>';
    });
    wire('nlkab', ['nlkab-vermogen', 'nlkab-spanning', 'nlkab-lengte', 'nlkab-verlies'], function () {
      var r = calcKabeldikte({ vermogenW: el('nlkab-vermogen').value, spanningV: el('nlkab-spanning').value, lengteM: el('nlkab-lengte').value, verliesPct: el('nlkab-verlies').value });
      el('nlkab-big').textContent = f2(r.adviesMm2) + ' mm²';
      el('nlkab-rows').innerHTML = '<tr><td>Stroom</td><td>' + f2(r.stroom) + ' A</td></tr><tr><td>Minimale doorsnede</td><td>' + f2(r.doorsnedeNodig) + ' mm²</td></tr><tr><td>Aanbevolen kabeldikte</td><td>' + f2(r.adviesMm2) + ' mm²</td></tr>';
    });
    wire('nlrad', ['nlrad-volume', 'nlrad-isolatie'], function () {
      var r = calcRadiator({ volumeM3: el('nlrad-volume').value, isolatie: el('nlrad-isolatie').value });
      el('nlrad-big').textContent = r.vermogenW + ' W';
      el('nlrad-rows').innerHTML = '<tr><td>Benodigd vermogen</td><td>' + r.vermogenW + ' W</td></tr><tr><td>Richtwaarde</td><td>' + r.factor + ' W per m³</td></tr>';
    });
    wire('nlgra', ['nlgra-temp', 'nlgra-dagen', 'nlgra-gas'], function () {
      var r = calcGraaddagen({ tempGem: el('nlgra-temp').value, dagen: el('nlgra-dagen').value, gasPerGraaddag: el('nlgra-gas').value });
      el('nlgra-big').textContent = f2(r.graaddagen) + ' graaddagen';
      el('nlgra-rows').innerHTML = '<tr><td>Graaddagen (18/18)</td><td>' + f2(r.graaddagen) + '</td></tr><tr><td>Geschat gasverbruik</td><td>' + f2(r.gasM3) + ' m³</td></tr>';
    });
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcBeton: calcBeton, calcVerf: calcVerf, calcLaminaat: calcLaminaat, calcBehang: calcBehang, calcTrap: calcTrap, calcGordijnen: calcGordijnen, calcEgaline: calcEgaline, calcKabeldikte: calcKabeldikte, calcRadiator: calcRadiator, calcGraaddagen: calcGraaddagen }; }
