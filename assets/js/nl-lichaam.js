/* Lichaamsvet, 1RM, VO2max, Hartslagzones, Lengte Kind (NL).
   - calcLichaamsvet US Navy: man 86,010*log10(taille-nek) - 70,041*log10(lengte) + 36,76;
     vrouw 163,205*log10(taille+heup-nek) - 97,684*log10(lengte) - 78,387 (cm).
   - calc1RM Epley: gewicht*(1+reps/30); Brzycki: gewicht*36/(37-reps).
   - calcVO2max Uth-Sorensen: 15,3 * (HRmax/HRrust), HRmax = 208 - 0,7*leeftijd.
   - calcHartslagzones Karvonen: HRmax = 220 - leeftijd; zones op % van HRmax.
   - calcLengteKind mid-parental: jongen (vader+moeder+13)/2; meisje (vader+moeder-13)/2; marge +-8,5 cm.
   Voorbeelden: US Navy man taille 90, nek 40, lengte 180, gewicht 80 -> 24,9% vet.
   1RM: 100 kg x 5 reps -> Epley 116,7 kg. VO2max: 30 jr, rust 60 -> HRmax 187 -> 47,7.
   Lengte kind: vader 185, moeder 170 -> jongen 184 cm (175,5-192,5). */
function calcLichaamsvet(i) {
  var l10 = function (n) { return Math.log(n) / Math.LN10; };
  var lengte = Math.max(0, parseFloat(i.lengteCm) || 0);
  var taille = Math.max(0, parseFloat(i.tailleCm) || 0);
  var nek = Math.max(0, parseFloat(i.nekCm) || 0);
  var heup = Math.max(0, parseFloat(i.heupCm) || 0);
  var pct = 0;
  if (i.geslacht === 'vrouw') {
    if (taille + heup - nek > 0 && lengte > 0) { pct = 163.205 * l10(taille + heup - nek) - 97.684 * l10(lengte) - 78.387; }
  } else if (taille - nek > 0 && lengte > 0) {
    pct = 86.010 * l10(taille - nek) - 70.041 * l10(lengte) + 36.76;
  }
  function r1(n) { return Math.round(n * 10) / 10; }
  var vetKg = r1((parseFloat(i.gewichtKg) || 0) * pct / 100);
  return { pct: r1(pct), vetKg: vetKg, vetvrijKg: r1((parseFloat(i.gewichtKg) || 0) - vetKg) };
}
function calc1RM(i) {
  var kg = Math.max(0, parseFloat(i.gewichtKg) || 0);
  var reps = Math.max(1, parseInt(i.herhalingen, 10) || 1);
  function r1(n) { return Math.round(n * 10) / 10; }
  var epley = kg * (1 + reps / 30);
  var brzycki = reps >= 37 ? kg : kg * 36 / (37 - reps);
  return { epley: r1(epley), brzycki: r1(brzycki), pct85: r1(epley * 0.85), pct70: r1(epley * 0.7) };
}
function calcVO2max(i) {
  var jr = Math.max(0, parseFloat(i.leeftijd) || 0);
  var rust = Math.max(1, parseFloat(i.hartslagRust) || 1);
  var hrmax = 208 - 0.7 * jr;
  function r1(n) { return Math.round(n * 10) / 10; }
  return { hrmax: Math.round(hrmax), vo2max: r1(15.3 * (hrmax / rust)) };
}
function calcHartslagzones(i) {
  var jr = Math.max(0, parseFloat(i.leeftijd) || 0);
  var rust = Math.max(0, parseFloat(i.hartslagRust) || 0);
  var hrmax = 220 - jr;
  var reserve = hrmax - rust;
  function z(p) { return Math.round(rust + reserve * p); }
  return { hrmax: Math.round(hrmax),
    zones: [
      { naam: 'Zone 1 – Herstel (50–60%)', van: z(0.5), tot: z(0.6) },
      { naam: 'Zone 2 – Vetverbranding (60–70%)', van: z(0.6), tot: z(0.7) },
      { naam: 'Zone 3 – Duurtraining (70–80%)', van: z(0.7), tot: z(0.8) },
      { naam: 'Zone 4 – Drempel (80–90%)', van: z(0.8), tot: z(0.9) },
      { naam: 'Zone 5 – Maximaal (90–100%)', van: z(0.9), tot: Math.round(hrmax) }
    ] };
}
function calcLengteKind(i) {
  var vader = Math.max(0, parseFloat(i.vaderCm) || 0);
  var moeder = Math.max(0, parseFloat(i.moederCm) || 0);
  function r1(n) { return Math.round(n * 10) / 10; }
  var midden = i.geslacht === 'meisje' ? (vader + moeder - 13) / 2 : (vader + moeder + 13) / 2;
  return { voorspeld: r1(midden), min: r1(midden - 8.5), max: r1(midden + 8.5) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function f1(n) { return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n); }
    function wire(prefix, ids, render) {
      var btn = el(prefix + '-btn'); if (!btn) { return; }
      btn.addEventListener('click', render);
      ids.forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); } });
      render();
    }
    wire('nllv', ['nllv-geslacht', 'nllv-lengte', 'nllv-gewicht', 'nllv-taille', 'nllv-nek', 'nllv-heup'], function () {
      var r = calcLichaamsvet({ geslacht: el('nllv-geslacht').value, lengteCm: el('nllv-lengte').value, gewichtKg: el('nllv-gewicht').value, tailleCm: el('nllv-taille').value, nekCm: el('nllv-nek').value, heupCm: el('nllv-heup').value });
      el('nllv-big').textContent = f1(r.pct) + ' %';
      el('nllv-rows').innerHTML = '<tr><td>Vetpercentage</td><td>' + f1(r.pct) + ' %</td></tr><tr><td>Vetmassa</td><td>' + f1(r.vetKg) + ' kg</td></tr><tr><td>Vetvrije massa</td><td>' + f1(r.vetvrijKg) + ' kg</td></tr>';
    });
    wire('nlrm', ['nlrm-gewicht', 'nlrm-herhalingen'], function () {
      var r = calc1RM({ gewichtKg: el('nlrm-gewicht').value, herhalingen: el('nlrm-herhalingen').value });
      el('nlrm-big').textContent = f1(r.epley) + ' kg';
      el('nlrm-rows').innerHTML = '<tr><td>1RM (Epley)</td><td>' + f1(r.epley) + ' kg</td></tr><tr><td>1RM (Brzycki)</td><td>' + f1(r.brzycki) + ' kg</td></tr><tr><td>85% van 1RM (kracht)</td><td>' + f1(r.pct85) + ' kg</td></tr><tr><td>70% van 1RM (spieropbouw)</td><td>' + f1(r.pct70) + ' kg</td></tr>';
    });
    wire('nlvo', ['nlvo-leeftijd', 'nlvo-hartslag'], function () {
      var r = calcVO2max({ leeftijd: el('nlvo-leeftijd').value, hartslagRust: el('nlvo-hartslag').value });
      el('nlvo-big').textContent = f1(r.vo2max) + ' ml/kg/min';
      el('nlvo-rows').innerHTML = '<tr><td>VO2max (geschat)</td><td>' + f1(r.vo2max) + ' ml/kg/min</td></tr><tr><td>Maximale hartslag (geschat)</td><td>' + r.hrmax + ' slagen/min</td></tr>';
    });
    wire('nlhz', ['nlhz-leeftijd', 'nlhz-hartslag'], function () {
      var r = calcHartslagzones({ leeftijd: el('nlhz-leeftijd').value, hartslagRust: el('nlhz-hartslag').value });
      el('nlhz-big').textContent = r.hrmax + ' slagen/min (max)';
      el('nlhz-rows').innerHTML = r.zones.map(function (z) { return '<tr><td>' + z.naam + '</td><td>' + z.van + ' – ' + z.tot + ' slagen/min</td></tr>'; }).join('');
    });
    wire('nllk', ['nllk-vader', 'nllk-moeder', 'nllk-geslacht'], function () {
      var r = calcLengteKind({ vaderCm: el('nllk-vader').value, moederCm: el('nllk-moeder').value, geslacht: el('nllk-geslacht').value });
      el('nllk-big').textContent = f1(r.voorspeld) + ' cm';
      el('nllk-rows').innerHTML = '<tr><td>Verwachte volwassen lengte</td><td>' + f1(r.voorspeld) + ' cm</td></tr><tr><td>Waarschijnlijk bereik</td><td>' + f1(r.min) + ' – ' + f1(r.max) + ' cm</td></tr>';
    });
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcLichaamsvet: calcLichaamsvet, calc1RM: calc1RM, calcVO2max: calcVO2max, calcHartslagzones: calcHartslagzones, calcLengteKind: calcLengteKind }; }
