/* Leeftijd, Datum, Keukenmaten, Bandenmaat, Energieverbruik, Hondenleeftijd,
   Kattenleeftijd, Snowboard, Zonnepanelen, Ohm Wet, Liefde, Weeknummer,
   BH Maat, Subnet, Tijd (NL).
   - calcLeeftijd({ geboorte (YYYY-MM-DD) }, vandaag): exacte jaren/maanden/dagen.
   - calcDatum({ van, tot }): dagen, weken, maanden (ca.), werkdagen (ma-vr).
   - calcKeuken({ ingredient, hoeveelheid, eenheid }): gram/ml via dichtheid
     per cup (240 ml): bloem 120 g, suiker 200 g, boter 227 g, rijst 185 g,
     honing 340 g; 1 cup = 16 eetlepels = 48 theelepels; 1 el = 15 ml, 1 tl = 5 ml.
   - calcBandenmaat({ breedte1, profiel1, velg1, breedte2, profiel2, velg2 }):
     diameter = velg x 25,4 + 2 x breedte x profiel/100; omtrek; afwijking %.
   - calcEnergie({ watt, urenPerDag, prijsPerKwh }): kWh en kosten per dag/maand/jaar.
   - calcHondenleeftijd({ jaren }): mensenjaren = 16 x ln(jaren) + 31 (AAHA).
   - calcKattenleeftijd({ jaren }): 1 jr = 15; 2 jr = 24; daarna +4 per jaar.
   - calcSnowboard({ lengteCm, gewichtKg, niveau }): lengte ca. 88% van
     lichaamslengte, beginner -5 cm, gevorderd +5 cm; bereik +-5 cm.
   - calcZonnepanelen({ panelen, wp, kosten, stroomprijs }): opbrengst =
     panelen x Wp x 0,85 kWh/Wp/jaar; besparing; terugverdientijd; CO2 (0,4 kg/kWh).
   - calcOhm({ spanning, stroom, weerstand, vermogen }): vul 2 van de 4 in;
     U = I x R; P = U x I.
   - calcLiefde({ naam1, naam2 }): deterministische score 0-100 uit de namen;
     VOOR DE LOL, geen echte voorspelling.
   - calcWeeknummer({ datum }): ISO-week (maandag = weekstart).
   - calcBhMaat({ onderborstCm, borstomtrekCm }): band = afgerond op veelvoud
     van 5; cup uit verschil (12-14 A, 14-16 B, 16-18 C, 18-20 D, 20-22 E, 22-24 F).
   - calcSubnet({ ip, cidr }): netwerk, broadcast, masker, wildcard, hosts.
   - calcTijd({ tijd1 (HH:MM:SS), tijd2, bewerking }): optellen/aftrekken + decimaal.
   Voorbeelden: hond 5 jr -> 57 mensenjaren. Kat 5 jr -> 36 mensenjaren.
   Energie: 100 W, 5 u/dag, EUR 0,30 -> 0,5 kWh/dag, EUR 54,75/jaar.
   Banden 205/55 R16 vs 225/45 R17: diameter 632 vs 634 mm, afwijking +0,3%.
   Subnet 192.168.1.10/24 -> netwerk 192.168.1.0, broadcast 192.168.1.255, 254 hosts. */
function r2(n) { return Math.round(n * 100) / 100; }
function parseD(s) { var p = String(s || '').split('-'); return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1); }
function calcLeeftijd(i, vandaag) {
  var g = parseD(i.geboorte);
  var now = vandaag ? parseD(vandaag) : new Date();
  var jaren = now.getFullYear() - g.getFullYear();
  var maanden = now.getMonth() - g.getMonth();
  var dagen = now.getDate() - g.getDate();
  if (dagen < 0) { maanden -= 1; var prev = new Date(now.getFullYear(), now.getMonth(), 0); dagen += prev.getDate(); }
  if (maanden < 0) { jaren -= 1; maanden += 12; }
  var totaalDagen = Math.floor((now - g) / 86400000);
  return { jaren: jaren, maanden: maanden, dagen: dagen, totaalDagen: totaalDagen };
}
function calcDatum(i) {
  var van = parseD(i.van), tot = parseD(i.tot);
  var dagen = Math.round((tot - van) / 86400000);
  var werkdagen = 0;
  var d = new Date(van);
  var stap = dagen >= 0 ? 1 : -1;
  for (var k = 0; k < Math.abs(dagen); k++) { var dw = d.getDay(); if (dw !== 0 && dw !== 6) { werkdagen += 1; } d.setDate(d.getDate() + stap); }
  return { dagen: dagen, weken: r2(dagen / 7), maanden: r2(dagen / 30.44), werkdagen: werkdagen };
}
var KEUKEN_DICHTHEID = { bloem: 120, suiker: 200, boter: 227, rijst: 185, honing: 340, water: 240, melk: 245, olie: 216, havermout: 90, cacaopoeder: 100 };
function calcKeuken(i) {
  var gramPerCup = KEUKEN_DICHTHEID[i.ingredient] || 240;
  var mlPerEenheid = { cup: 240, eetlepel: 15, theelepel: 5, ml: 1, gram: 0 }[i.eenheid] || 0;
  var ml = i.eenheid === 'gram' ? (parseFloat(i.hoeveelheid) || 0) / gramPerCup * 240 : (parseFloat(i.hoeveelheid) || 0) * mlPerEenheid;
  var gram = ml / 240 * gramPerCup;
  return { gram: r2(gram), ml: r2(ml), cups: r2(ml / 240) };
}
function bandDiameter(breedte, profiel, velg) {
  return velg * 25.4 + 2 * breedte * profiel / 100;
}
function calcBandenmaat(i) {
  var d1 = bandDiameter(parseFloat(i.breedte1) || 0, parseFloat(i.profiel1) || 0, parseFloat(i.velg1) || 0);
  var d2 = bandDiameter(parseFloat(i.breedte2) || 0, parseFloat(i.profiel2) || 0, parseFloat(i.velg2) || 0);
  var afwijking = d1 > 0 ? (d2 - d1) / d1 * 100 : 0;
  return { diameter1: r2(d1), diameter2: r2(d2), omtrek1: r2(d1 * Math.PI), omtrek2: r2(d2 * Math.PI), afwijkingPct: r2(afwijking), snelheidBij100: r2(100 * (1 + afwijking / 100)) };
}
function calcEnergie(i) {
  var kwhDag = (parseFloat(i.watt) || 0) / 1000 * (parseFloat(i.urenPerDag) || 0);
  var prijs = parseFloat(i.prijsPerKwh) || 0;
  return { kwhDag: r2(kwhDag), kostenDag: r2(kwhDag * prijs), kostenMaand: r2(kwhDag * prijs * 30), kostenJaar: r2(kwhDag * prijs * 365) };
}
function calcHondenleeftijd(i) {
  var jr = Math.max(0.1, parseFloat(i.jaren) || 0);
  return { mensenjaren: Math.round(16 * Math.log(jr) + 31) };
}
function calcKattenleeftijd(i) {
  var jr = Math.max(0, parseFloat(i.jaren) || 0);
  var mj = jr <= 0 ? 0 : jr === 1 ? 15 : jr === 2 ? 24 : 24 + (jr - 2) * 4;
  return { mensenjaren: Math.round(mj) };
}
function calcSnowboard(i) {
  var lengte = parseFloat(i.lengteCm) || 0;
  var basis = lengte * 0.88;
  var aanpassing = i.niveau === 'beginner' ? -5 : i.niveau === 'gevorderd' ? 5 : 0;
  var advies = Math.round(basis + aanpassing);
  return { adviesCm: advies, min: advies - 5, max: advies + 5 };
}
function calcZonnepanelen(i) {
  var opbrengst = (parseFloat(i.panelen) || 0) * (parseFloat(i.wp) || 0) * 0.85;
  var besparing = opbrengst * (parseFloat(i.stroomprijs) || 0);
  var kosten = parseFloat(i.kosten) || 0;
  return { opbrengstKwh: Math.round(opbrengst), besparingJaar: r2(besparing), terugverdientijd: besparing > 0 ? r2(kosten / besparing) : 0, co2Kg: Math.round(opbrengst * 0.4) };
}
function calcOhm(i) {
  var U = parseFloat(i.spanning), I = parseFloat(i.stroom), R = parseFloat(i.weerstand), P = parseFloat(i.vermogen);
  function n(x) { return !isNaN(x) && x !== 0; }
  if (n(U) && n(I)) { R = U / I; P = U * I; }
  else if (n(U) && n(R)) { I = U / R; P = U * I; }
  else if (n(U) && n(P)) { I = P / U; R = U / I; }
  else if (n(I) && n(R)) { U = I * R; P = U * I; }
  else if (n(I) && n(P)) { U = P / I; R = U / I; }
  else if (n(R) && n(P)) { I = Math.sqrt(P / R); U = I * R; }
  return { spanning: r2(U || 0), stroom: r2(I || 0), weerstand: r2(R || 0), vermogen: r2(P || 0) };
}
function calcLiefde(i) {
  var s = (String(i.naam1 || '') + String(i.naam2 || '')).toLowerCase().replace(/[^a-z]/g, '');
  var h = 0;
  for (var k = 0; k < s.length; k++) { h = (h * 31 + s.charCodeAt(k)) % 100000; }
  var score = 40 + (h % 61);
  var boodschap = score >= 90 ? 'Een perfecte match!' : score >= 75 ? 'Jullie passen heel goed bij elkaar.' : score >= 60 ? 'Er is zeker chemie tussen jullie.' : 'Een leuke combinatie, met ruimte om te groeien.';
  return { score: score, boodschap: boodschap };
}
function calcWeeknummer(i) {
  var d = parseD(i.datum);
  var donderdag = new Date(d);
  donderdag.setDate(d.getDate() + (4 - ((d.getDay() + 6) % 7)));
  var jaarStart = new Date(donderdag.getFullYear(), 0, 1);
  var week = Math.ceil((((donderdag - jaarStart) / 86400000) + 1) / 7);
  var dagen = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  return { week: week, jaar: donderdag.getFullYear(), weekdag: dagen[d.getDay()] };
}
function calcBhMaat(i) {
  var onder = parseFloat(i.onderborstCm) || 0;
  var boven = parseFloat(i.borstomtrekCm) || 0;
  var band = Math.round(onder / 5) * 5;
  var verschil = boven - onder;
  var cup = verschil < 12 ? 'AA' : verschil < 14 ? 'A' : verschil < 16 ? 'B' : verschil < 18 ? 'C' : verschil < 20 ? 'D' : verschil < 22 ? 'E' : verschil < 24 ? 'F' : 'G';
  return { maat: band + cup, band: band, cup: cup, verschil: r2(verschil) };
}
function calcSubnet(i) {
  var delen = String(i.ip || '').split('.').map(function (x) { return parseInt(x, 10) || 0; });
  var cidr = Math.max(0, Math.min(32, parseInt(i.cidr, 10) || 24));
  var ipNum = ((delen[0] << 24) | (delen[1] << 16) | (delen[2] << 8) | delen[3]) >>> 0;
  var maskNum = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
  var net = (ipNum & maskNum) >>> 0;
  var bc = (net | (~maskNum >>> 0)) >>> 0;
  function fmt(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.'); }
  var hosts = cidr >= 31 ? 0 : Math.pow(2, 32 - cidr) - 2;
  return { netwerk: fmt(net), broadcast: fmt(bc), masker: fmt(maskNum), wildcard: fmt(~maskNum >>> 0), hosts: hosts, eersteHost: hosts > 0 ? fmt(net + 1) : '–', laatsteHost: hosts > 0 ? fmt(bc - 1) : '–' };
}
function calcTijd(i) {
  function toSec(s) { var p = String(s || '00:00').split(':'); return (+p[0] || 0) * 3600 + (+p[1] || 0) * 60 + (+p[2] || 0); }
  function toHMS(s) { s = Math.round(s); var neg = s < 0; s = Math.abs(s); var h = Math.floor(s / 3600); var m = Math.floor((s % 3600) / 60); var ss = s % 60; return (neg ? '-' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss; }
  var a = toSec(i.tijd1), b = toSec(i.tijd2);
  var res = i.bewerking === 'aftrekken' ? a - b : a + b;
  return { resultaat: toHMS(res), decimaalUren: r2(res / 3600) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function f2(n) { return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    function eur(n) { return '€ ' + f2(n); }
    function wire(prefix, ids, render) {
      var btn = el(prefix + '-btn'); if (!btn) { return; }
      btn.addEventListener('click', render);
      ids.forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); } });
      render();
    }
    wire('nllee', ['nllee-geboorte'], function () {
      var r = calcLeeftijd({ geboorte: el('nllee-geboorte').value });
      el('nllee-big').textContent = r.jaren + ' jaar';
      el('nllee-rows').innerHTML = '<tr><td>Leeftijd</td><td>' + r.jaren + ' jaar, ' + r.maanden + ' maanden en ' + r.dagen + ' dagen</td></tr><tr><td>Totaal aantal dagen</td><td>' + new Intl.NumberFormat('nl-NL').format(r.totaalDagen) + ' dagen</td></tr>';
    });
    wire('nldat', ['nldat-van', 'nldat-tot'], function () {
      var r = calcDatum({ van: el('nldat-van').value, tot: el('nldat-tot').value });
      el('nldat-big').textContent = r.dagen + ' dagen';
      el('nldat-rows').innerHTML = '<tr><td>Dagen</td><td>' + r.dagen + '</td></tr><tr><td>Weken</td><td>' + f2(r.weken) + '</td></tr><tr><td>Maanden (ca.)</td><td>' + f2(r.maanden) + '</td></tr><tr><td>Werkdagen (ma–vr)</td><td>' + r.werkdagen + '</td></tr>';
    });
    wire('nlkeu', ['nlkeu-ingredient', 'nlkeu-hoeveelheid', 'nlkeu-eenheid'], function () {
      var r = calcKeuken({ ingredient: el('nlkeu-ingredient').value, hoeveelheid: el('nlkeu-hoeveelheid').value, eenheid: el('nlkeu-eenheid').value });
      el('nlkeu-big').textContent = f2(r.gram) + ' gram';
      el('nlkeu-rows').innerHTML = '<tr><td>Gewicht</td><td>' + f2(r.gram) + ' gram</td></tr><tr><td>Volume</td><td>' + f2(r.ml) + ' ml</td></tr><tr><td>Cups</td><td>' + f2(r.cups) + '</td></tr>';
    });
    wire('nlban', ['nlban-b1', 'nlban-p1', 'nlban-v1', 'nlban-b2', 'nlban-p2', 'nlban-v2'], function () {
      var r = calcBandenmaat({ breedte1: el('nlban-b1').value, profiel1: el('nlban-p1').value, velg1: el('nlban-v1').value, breedte2: el('nlban-b2').value, profiel2: el('nlban-p2').value, velg2: el('nlban-v2').value });
      el('nlban-big').textContent = f2(r.afwijkingPct) + ' % afwijking';
      el('nlban-rows').innerHTML = '<tr><td>Diameter band 1</td><td>' + f2(r.diameter1) + ' mm</td></tr><tr><td>Diameter band 2</td><td>' + f2(r.diameter2) + ' mm</td></tr><tr><td>Omtrek band 1 / band 2</td><td>' + f2(r.omtrek1) + ' / ' + f2(r.omtrek2) + ' mm</td></tr><tr><td>Snelheidsmeter bij 100 km/u</td><td>' + f2(r.snelheidBij100) + ' km/u</td></tr>';
    });
    wire('nlene', ['nlene-watt', 'nlene-uren', 'nlene-prijs'], function () {
      var r = calcEnergie({ watt: el('nlene-watt').value, urenPerDag: el('nlene-uren').value, prijsPerKwh: el('nlene-prijs').value });
      el('nlene-big').textContent = eur(r.kostenJaar) + ' per jaar';
      el('nlene-rows').innerHTML = '<tr><td>Verbruik per dag</td><td>' + f2(r.kwhDag) + ' kWh</td></tr><tr><td>Kosten per dag</td><td>' + eur(r.kostenDag) + '</td></tr><tr><td>Kosten per maand</td><td>' + eur(r.kostenMaand) + '</td></tr><tr><td>Kosten per jaar</td><td>' + eur(r.kostenJaar) + '</td></tr>';
    });
    wire('nlhon', ['nlhon-jaren'], function () {
      var r = calcHondenleeftijd({ jaren: el('nlhon-jaren').value });
      el('nlhon-big').textContent = r.mensenjaren + ' mensenjaren';
      el('nlhon-rows').innerHTML = '<tr><td>Leeftijd in mensenjaren</td><td>' + r.mensenjaren + ' jaar</td></tr>';
    });
    wire('nlkat', ['nlkat-jaren'], function () {
      var r = calcKattenleeftijd({ jaren: el('nlkat-jaren').value });
      el('nlkat-big').textContent = r.mensenjaren + ' mensenjaren';
      el('nlkat-rows').innerHTML = '<tr><td>Leeftijd in mensenjaren</td><td>' + r.mensenjaren + ' jaar</td></tr>';
    });
    wire('nlsno', ['nlsno-lengte', 'nlsno-niveau'], function () {
      var r = calcSnowboard({ lengteCm: el('nlsno-lengte').value, niveau: el('nlsno-niveau').value });
      el('nlsno-big').textContent = r.adviesCm + ' cm';
      el('nlsno-rows').innerHTML = '<tr><td>Ideale snowboardlengte</td><td>' + r.adviesCm + ' cm</td></tr><tr><td>Bereik</td><td>' + r.min + ' – ' + r.max + ' cm</td></tr>';
    });
    wire('nlzon', ['nlzon-panelen', 'nlzon-wp', 'nlzon-kosten', 'nlzon-prijs'], function () {
      var r = calcZonnepanelen({ panelen: el('nlzon-panelen').value, wp: el('nlzon-wp').value, kosten: el('nlzon-kosten').value, stroomprijs: el('nlzon-prijs').value });
      el('nlzon-big').textContent = new Intl.NumberFormat('nl-NL').format(r.opbrengstKwh) + ' kWh per jaar';
      el('nlzon-rows').innerHTML = '<tr><td>Jaaropbrengst</td><td>' + new Intl.NumberFormat('nl-NL').format(r.opbrengstKwh) + ' kWh</td></tr><tr><td>Besparing per jaar</td><td>' + eur(r.besparingJaar) + '</td></tr><tr><td>Terugverdientijd</td><td>' + f2(r.terugverdientijd) + ' jaar</td></tr><tr><td>CO2-besparing</td><td>' + new Intl.NumberFormat('nl-NL').format(r.co2Kg) + ' kg per jaar</td></tr>';
    });
    wire('nlohm', ['nlohm-u', 'nlohm-i', 'nlohm-r', 'nlohm-p'], function () {
      var r = calcOhm({ spanning: el('nlohm-u').value, stroom: el('nlohm-i').value, weerstand: el('nlohm-r').value, vermogen: el('nlohm-p').value });
      el('nlohm-big').textContent = f2(r.vermogen) + ' W';
      el('nlohm-rows').innerHTML = '<tr><td>Spanning (U)</td><td>' + f2(r.spanning) + ' V</td></tr><tr><td>Stroom (I)</td><td>' + f2(r.stroom) + ' A</td></tr><tr><td>Weerstand (R)</td><td>' + f2(r.weerstand) + ' Ω</td></tr><tr><td>Vermogen (P)</td><td>' + f2(r.vermogen) + ' W</td></tr>';
    });
    wire('nllie', ['nllie-naam1', 'nllie-naam2'], function () {
      var r = calcLiefde({ naam1: el('nllie-naam1').value, naam2: el('nllie-naam2').value });
      el('nllie-big').textContent = r.score + ' %';
      el('nllie-rows').innerHTML = '<tr><td>Liefdespercentage</td><td>' + r.score + ' %</td></tr><tr><td>Boodschap</td><td>' + r.boodschap + '</td></tr>';
    });
    wire('nlwee', ['nlwee-datum'], function () {
      var r = calcWeeknummer({ datum: el('nlwee-datum').value });
      el('nlwee-big').textContent = 'Week ' + r.week;
      el('nlwee-rows').innerHTML = '<tr><td>ISO-weeknummer</td><td>Week ' + r.week + ' van ' + r.jaar + '</td></tr><tr><td>Weekdag</td><td>' + r.weekdag + '</td></tr>';
    });
    wire('nlbh', ['nlbh-onder', 'nlbh-boven'], function () {
      var r = calcBhMaat({ onderborstCm: el('nlbh-onder').value, borstomtrekCm: el('nlbh-boven').value });
      el('nlbh-big').textContent = r.maat;
      el('nlbh-rows').innerHTML = '<tr><td>BH-maat</td><td>' + r.maat + '</td></tr><tr><td>Bandmaat</td><td>' + r.band + '</td></tr><tr><td>Cupmaat</td><td>' + r.cup + ' (verschil ' + f2(r.verschil) + ' cm)</td></tr>';
    });
    wire('nlsub', ['nlsub-ip', 'nlsub-cidr'], function () {
      var r = calcSubnet({ ip: el('nlsub-ip').value, cidr: el('nlsub-cidr').value });
      el('nlsub-big').textContent = r.netwerk + ' / ' + (el('nlsub-cidr').value || 24);
      el('nlsub-rows').innerHTML = '<tr><td>Netwerkadres</td><td>' + r.netwerk + '</td></tr><tr><td>Broadcastadres</td><td>' + r.broadcast + '</td></tr><tr><td>Subnetmasker</td><td>' + r.masker + '</td></tr><tr><td>Wildcard masker</td><td>' + r.wildcard + '</td></tr><tr><td>Bruikbare hosts</td><td>' + r.hosts + '</td></tr><tr><td>Eerste / laatste host</td><td>' + r.eersteHost + ' / ' + r.laatsteHost + '</td></tr>';
    });
    wire('nltij', ['nltij-1', 'nltij-2', 'nltij-bewerking'], function () {
      var r = calcTijd({ tijd1: el('nltij-1').value, tijd2: el('nltij-2').value, bewerking: el('nltij-bewerking').value });
      el('nltij-big').textContent = r.resultaat;
      el('nltij-rows').innerHTML = '<tr><td>Resultaat</td><td>' + r.resultaat + '</td></tr><tr><td>In decimale uren</td><td>' + f2(r.decimaalUren) + ' uur</td></tr>';
    });
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcLeeftijd: calcLeeftijd, calcDatum: calcDatum, calcKeuken: calcKeuken, calcBandenmaat: calcBandenmaat, calcEnergie: calcEnergie, calcHondenleeftijd: calcHondenleeftijd, calcKattenleeftijd: calcKattenleeftijd, calcSnowboard: calcSnowboard, calcZonnepanelen: calcZonnepanelen, calcOhm: calcOhm, calcLiefde: calcLiefde, calcWeeknummer: calcWeeknummer, calcBhMaat: calcBhMaat, calcSubnet: calcSubnet, calcTijd: calcTijd }; }
