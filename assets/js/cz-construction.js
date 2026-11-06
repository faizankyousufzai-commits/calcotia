'use strict';
/* cz-construction.js — shared engine for CZ construction tools (Calcilo implant, 2026-11-06).
   Material quantities use common Czech practice values (stated on each page as
   orientační). Pure functions + DOM binding + module.exports guard. */
function fmt(n, d) {
  if (d === undefined) d = 2;
  if (n === null || n === undefined || isNaN(n)) return '–';
  return n.toLocaleString('cs-CZ', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmt0(n) { return fmt(n, 0); }

function calcAnhydrit(plochaM2, tloustkaMm) {
  var objem = plochaM2 * tloustkaMm / 1000;
  var kg = plochaM2 * tloustkaMm * 1.9; // cca 1,9 kg na m² a mm
  return { objem: objem, kg: kg, pytle25: Math.ceil(kg / 25) };
}
function calcBarva(plochaM2, pocetVstev, vydatnost) {
  var litry = plochaM2 * pocetVstev / vydatnost;
  return { litry: litry, baleni10l: Math.ceil(litry / 10) };
}
function calcBeton(delkaM, sirkaM, tloustkaM) {
  var objem = delkaM * sirkaM * tloustkaM;
  return { objem: objem, cementKg: objem * 300, pisekM3: objem * 0.6, sterkM3: objem * 0.8 };
}
function calcDlazba(plochaM2, dlazbaCm, sirkaCm) {
  var kusNaM2 = 10000 / (dlazbaCm * sirkaCm);
  var kusy = Math.ceil(plochaM2 * kusNaM2 * 1.1);
  return { kusy: kusy, bezRezervy: Math.ceil(plochaM2 * kusNaM2) };
}
function calcMalta(objemM3) {
  return { cementKg: objemM3 * 350, pisekKg: objemM3 * 1400, vodaL: objemM3 * 180 };
}
function calcPodlaha(plochaM2, baleniM2) {
  var baleni = Math.ceil(plochaM2 * 1.1 / baleniM2);
  return { baleni: baleni, plochaSRezervou: plochaM2 * 1.1 };
}
function calcSchodiste(vyskaCm, stupenCm) {
  var pocet = Math.round(vyskaCm / stupenCm);
  var skutecnaVyska = vyskaCm / pocet;
  var hloubka = 63 - 2 * skutecnaVyska; // Blondel: 2h + b = 63 cm
  return { pocet: pocet, vyskaStupne: skutecnaVyska, hloubka: hloubka };
}
function calcPalivo(vzdalenostKm, spotreba, cenaL) {
  var litry = vzdalenostKm * spotreba / 100;
  return { litry: litry, cena: litry * cenaL };
}
function calcStrecha(delkaM, sirkaM, sklonStupne) {
  var rad = sklonStupne * Math.PI / 180;
  var plocha = delkaM * (sirkaM / 2) / Math.cos(rad) * 2;
  return { plocha: plocha };
}
function calcTapety(plochaStenM2, pokrytiRole) {
  var role = Math.ceil(plochaStenM2 / pokrytiRole);
  return { role: role };
}
function calcTepelneZtraty(plochaM2, hodnotaU, rozdilTeplot) {
  return plochaM2 * hodnotaU * rozdilTeplot;
}

var MODES = {
  'anhydrit': function (v) { var r = calcAnhydrit(v.a, v.b); return { big: fmt(r.objem, 2) + ' m³ anhydritu', rows: [['Objem směsi', fmt(r.objem, 2) + ' m³'], ['Spotřeba materiálu', fmt0(r.kg) + ' kg'], ['Pytle 25 kg', fmt0(r.pytle25) + ' ks']], note: 'Orientační spotřeba 1,9 kg na m² a 1 mm tloušťky; přesnou spotřebu uvádí výrobce směsi.' }; },
  'barva': function (v) { var r = calcBarva(v.a, v.b, v.c); return { big: fmt(r.litry, 1) + ' l barvy', rows: [['Potřeba barvy', fmt(r.litry, 1) + ' l'], ['Balení 10 l', fmt0(r.baleni10l) + ' ks']], note: 'Vydatnost barvy se liší podle výrobku a savosti podkladu; vždy kupte o balení navíc.' }; },
  'beton': function (v) { var r = calcBeton(v.a, v.b, v.c); return { big: fmt(r.objem, 2) + ' m³ betonu', rows: [['Objem betonu', fmt(r.objem, 2) + ' m³'], ['Cement (cca 300 kg/m³)', fmt0(r.cementKg) + ' kg'], ['Písek', fmt(r.pisekM3, 2) + ' m³'], ['Štěrk', fmt(r.sterkM3, 2) + ' m³']], note: 'Orientační receptura pro běžný beton; pro nosné konstrukce použijte projekt a betonárku.' }; },
  'dlazba': function (v) { var r = calcDlazba(v.a, v.b, v.c); return { big: fmt0(r.kusy) + ' ks dlaždic', rows: [['Počet dlaždic s rezervou 10 %', fmt0(r.kusy) + ' ks'], ['Bez rezervy', fmt0(r.bezRezervy) + ' ks']], note: 'Rezerva 10 % pokrývá prořez a poškození; u vzorů počítejte 15 %.' }; },
  'malta': function (v) { var r = calcMalta(v.a); return { big: fmt0(r.cementKg) + ' kg cementu', rows: [['Cement', fmt0(r.cementKg) + ' kg'], ['Písek', fmt0(r.pisekKg) + ' kg'], ['Voda', fmt0(r.vodaL) + ' l']], note: 'Poměr pro zdicí maltu zhruba 1 díl cementu na 4 díly písku.' }; },
  'podlaha': function (v) { var r = calcPodlaha(v.a, v.b); return { big: fmt0(r.baleni) + ' balení', rows: [['Počet balení (rezerva 10 %)', fmt0(r.baleni) + ' ks'], ['Plocha s rezervou', fmt(r.plochaSRezervou, 1) + ' m²']], note: 'Rezerva 10 % pokrývá prořez; u diagonální pokládky počítejte 15 %.' }; },
  'schodiste': function (v) { var r = calcSchodiste(v.a, v.b); return { big: fmt0(r.pocet) + ' stupňů', rows: [['Počet stupňů', fmt0(r.pocet)], ['Výška stupně', fmt(r.vyskaStupne, 1) + ' cm'], ['Hloubka stupně (Blondel)', fmt(r.hloubka, 1) + ' cm']], note: 'Pohodlný stupeň je vysoký 15–18 cm; platí Blondelovo pravidlo 2× výška + hloubka = 63 cm.' }; },
  'palivo': function (v) { var r = calcPalivo(v.a, v.b, v.c); return { big: fmt(r.litry, 1) + ' l (' + fmt(r.cena, 0) + ' Kč)', rows: [['Spotřeba paliva', fmt(r.litry, 1) + ' l'], ['Cena jízdy', fmt(r.cena, 0) + ' Kč']], note: 'Skutečná spotřeba závisí na stylu jízdy, nákladu a počasí.' }; },
  'strecha': function (v) { var r = calcStrecha(v.a, v.b, v.c); return { big: fmt(r.plocha, 1) + ' m² střechy', rows: [['Plocha střechy', fmt(r.plocha, 1) + ' m²'], ['Sklon', fmt0(v.c) + '°']], note: 'Plocha je součet obou stran sedlové střechy bez přesahů; na krytinu připočtěte 10 % rezervu.' }; },
  'tapety': function (v) { var r = calcTapety(v.a, v.b); return { big: fmt0(r.role) + ' rolí tapet', rows: [['Počet rolí', fmt0(r.role) + ' ks'], ['Plocha stěn', fmt0(v.a) + ' m²']], note: 'U tapet se vzorem počítejte s větší rezervou kvůli sladění vzoru.' }; },
  'tepelne-ztraty': function (v) { var r = calcTepelneZtraty(v.a, v.b, v.c); return { big: fmt0(r) + ' W', rows: [['Tepelná ztráta', fmt0(r) + ' W'], ['Plocha', fmt0(v.a) + ' m²'], ['Součinitel U', fmt(v.b, 2) + ' W/m²K']], note: 'Zjednodušený výpočet prostupem tepla; přesný výpočet zohledňuje větrání a tepelné mosty.' }; }
};

function readInputs() {
  function g(id) { var el = document.getElementById(id); return el ? el.value : ''; }
  return { a: g('cz-a'), b: g('cz-b'), c: g('cz-c'), d: g('cz-d'), e: g('cz-e'), s1: g('cz-s1'), s2: g('cz-s2') };
}
function toNum(x, def) { var n = parseFloat(String(x).replace(',', '.')); return isNaN(n) ? def : n; }
function run() {
  var calc = document.querySelector('.calc[data-calc]');
  if (!calc) return;
  var mode = calc.getAttribute('data-calc');
  var fn = MODES[mode];
  if (!fn) return;
  var raw = readInputs();
  var v = { a: toNum(raw.a, 0), b: toNum(raw.b, 0), c: toNum(raw.c, 0), d: toNum(raw.d, 0), e: toNum(raw.e, 0), s1: raw.s1, s2: raw.s2 };
  var out;
  try { out = fn(v); } catch (e) { return; }
  var res = document.getElementById('cz-result');
  if (!res) return;
  var html = '<div class="big">' + out.big + '</div><table><tbody>';
  for (var i = 0; i < out.rows.length; i++) html += '<tr><td>' + out.rows[i][0] + '</td><td>' + out.rows[i][1] + '</td></tr>';
  html += '</tbody></table>';
  if (out.note) html += '<p>' + out.note + '</p>';
  res.innerHTML = html;
  res.classList.add('show');
}
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    run();
    var calc = document.querySelector('.calc[data-calc]');
    if (calc) {
      calc.addEventListener('input', run);
      calc.addEventListener('change', run);
      var btn = calc.querySelector('.calc-btn');
      if (btn) btn.addEventListener('click', run);
    }
  });
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcAnhydrit: calcAnhydrit, calcBarva: calcBarva, calcBeton: calcBeton, calcDlazba: calcDlazba, calcMalta: calcMalta, calcPodlaha: calcPodlaha, calcSchodiste: calcSchodiste, calcPalivo: calcPalivo, calcStrecha: calcStrecha, calcTapety: calcTapety, calcTepelneZtraty: calcTepelneZtraty, MODES: MODES };
}
