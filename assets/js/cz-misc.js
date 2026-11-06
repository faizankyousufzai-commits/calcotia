'use strict';
/* cz-misc.js — shared engine for CZ misc tools (Calcilo implant, 2026-11-06).
   Pure functions + DOM binding + module.exports guard. */
function fmt(n, d) {
  if (d === undefined) d = 2;
  if (n === null || n === undefined || isNaN(n)) return '–';
  return n.toLocaleString('cs-CZ', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmt0(n) { return fmt(n, 0); }
function parseDate(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }

function calcBARF(vahaKg, procento) {
  var denni = vahaKg * 1000 * procento / 100;
  return { denni: denni, maso: denni * 0.7, kosti: denni * 0.1, zelenina: denni * 0.2 };
}
function calcIQ(mentalniVek, chronologickyVek) { return mentalniVek / chronologickyVek * 100; }
function calcNagazovani(objemL, co2Objemy) {
  var cukr = objemL * co2Objemy * 4; // cca 4 g cukru na litr a objem CO2
  return { cukr: cukr };
}
function calcPizza(pocetPizz, prumerCm) {
  var mouka = pocetPizz * 250;
  var voda = pocetPizz * 160;
  var drozdi = pocetPizz * 3;
  var sul = pocetPizz * 5;
  return { mouka: mouka, voda: voda, drozdi: drozdi, sul: sul };
}
function calcElektrina(prikonW, hodinyDenne, dny, cenaKwh) {
  var kwh = prikonW * hodinyDenne * dny / 1000;
  return { kwh: kwh, cena: kwh * cenaKwh };
}
function calcVekPsa(vekPsa, velikost) {
  var prirustek = velikost === 'maly' ? 4 : velikost === 'velky' ? 6 : 5;
  if (vekPsa <= 1) return 15;
  if (vekPsa <= 2) return 24;
  return 24 + (vekPsa - 2) * prirustek;
}
function calcZnameni(datumStr) {
  var d = parseDate(datumStr);
  var m = d.getMonth() + 1, den = d.getDate();
  // Počáteční data znamení (měsíc, den, znamení), seřazeno od 1. ledna.
  var starty = [[1, 20, 'Vodnář'], [2, 19, 'Ryby'], [3, 21, 'Beran'], [4, 20, 'Býk'], [5, 21, 'Blíženci'], [6, 22, 'Rak'], [7, 23, 'Lev'], [8, 23, 'Panna'], [9, 23, 'Váhy'], [10, 24, 'Štír'], [11, 23, 'Střelec'], [12, 22, 'Kozoroh']];
  var vysledek = 'Kozoroh';
  for (var i = 0; i < starty.length; i++) {
    if (m > starty[i][0] || (m === starty[i][0] && den >= starty[i][1])) vysledek = starty[i][2];
  }
  return vysledek;
}
function calcKaloriePiva(objemMl, procento) {
  var alkoholG = objemMl * (procento / 100) * 0.789;
  var sacharidyG = objemMl * 0.035;
  var kcal = alkoholG * 7 + sacharidyG * 4;
  return { kcal: kcal, alkoholG: alkoholG };
}
function calcNumerologie(datumStr) {
  var cislice = String(datumStr).replace(/-/g, '').split('').map(function (x) { return +x; });
  var soucet = cislice.reduce(function (s, x) { return s + x; }, 0);
  while (soucet > 9 && soucet !== 11 && soucet !== 22) {
    soucet = String(soucet).split('').map(function (x) { return +x; }).reduce(function (s, x) { return s + x; }, 0);
  }
  return soucet;
}

var MODES = {
  'barf': function (v) { var r = calcBARF(v.a, v.b); return { big: fmt0(r.denni) + ' g denně', rows: [['Denní dávka BARF', fmt0(r.denni) + ' g'], ['Maso a vnitřnosti (70 %)', fmt0(r.maso) + ' g'], ['Kosti (10 %)', fmt0(r.kosti) + ' g'], ['Zelenina a ovoce (20 %)', fmt0(r.zelenina) + ' g']], note: 'BARF je syrová strava pro psy; dávku upravte podle aktivity a kondice psa a proberte ji s veterinářem.' }; },
  'iq': function (v) { var r = calcIQ(v.a, v.b); return { big: 'IQ ' + fmt0(r), rows: [['Orientační IQ', fmt0(r)], ['Mentální věk', fmt0(v.a) + ' let'], ['Chronologický věk', fmt0(v.b) + ' let']], note: 'Poměrové IQ je historický výpočet; moderní IQ testy používají standardizované škály a normování.' }; },
  'nagazovani-piva': function (v) { var r = calcNagazovani(v.a, v.b); return { big: fmt0(r.cukr) + ' g cukru', rows: [['Cukr na dosycení', fmt0(r.cukr) + ' g'], ['Objem piva', fmt(v.a, 1) + ' l'], ['Cílové sycení', fmt(v.b, 1) + ' obj. CO2']], note: 'Orientační dávka: 4 g cukru na litr a objem CO2. Přesné sycení závisí na teplotě a zbytkovém CO2.' }; },
  'pizza': function (v) { var r = calcPizza(v.a, v.b); return { big: fmt0(r.mouka) + ' g mouky', rows: [['Mouka', fmt0(r.mouka) + ' g'], ['Voda', fmt0(r.voda) + ' ml'], ['Sušené droždí', fmt0(r.drozdi) + ' g'], ['Sůl', fmt0(r.sul) + ' g']], note: 'Na jednu pizzu o průměru asi 30 cm stačí 250 g mouky a 160 ml vody.' }; },
  'spotreba-elektriny': function (v) { var r = calcElektrina(v.a, v.b, v.c, v.d); return { big: fmt(r.kwh, 1) + ' kWh (' + fmt(r.cena, 0) + ' Kč)', rows: [['Spotřeba', fmt(r.kwh, 1) + ' kWh'], ['Cena', fmt(r.cena, 0) + ' Kč']], note: 'Cenu za kWh zadejte podle své sazby; výsledek je orientační.' }; },
  'vek-psa': function (v) { var r = calcVekPsa(v.a, v.s1); return { big: fmt0(r) + ' lidských let', rows: [['Věk psa v lidských letech', fmt0(r) + ' let'], ['Věk psa', fmt0(v.a) + ' let']], note: 'Převod je orientační: první rok je 15 lidských let, druhý rok 9 let, pak 4–6 let ročně podle velikosti.' }; },
  'znameni': function (v) { var r = calcZnameni(v.a); return { big: r, rows: [['Znamení zvěrokruhu', r]], note: 'Znamení se určuje podle data narození; hranice znamení se mohou o den lišit podle roku.' }; },
  'kalorie-piva': function (v) { var r = calcKaloriePiva(v.a, v.b); return { big: fmt0(r.kcal) + ' kcal', rows: [['Kalorie v pivu', fmt0(r.kcal) + ' kcal'], ['Alkohol', fmt(r.alkoholG, 1) + ' g']], note: 'Kalorie z alkoholu (7 kcal/g) a ze sacharidů (4 kcal/g); světlé pivo má asi 40 kcal na 100 ml.' }; },
  'numerologie': function (v) { var r = calcNumerologie(v.a); return { big: 'životní číslo ' + r, rows: [['Životní číslo', fmt0(r)]], note: 'Numerologie je zábavná metoda bez vědeckého základu; berte ji jako hru.' }; }
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
  if (mode === 'znameni' || mode === 'numerologie') { v.a = raw.a; }
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
  module.exports = { calcBARF: calcBARF, calcIQ: calcIQ, calcNagazovani: calcNagazovani, calcPizza: calcPizza, calcElektrina: calcElektrina, calcVekPsa: calcVekPsa, calcZnameni: calcZnameni, calcKaloriePiva: calcKaloriePiva, calcNumerologie: calcNumerologie, MODES: MODES };
}
