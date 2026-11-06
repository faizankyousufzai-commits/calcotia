'use strict';
/* cz-work.js — shared engine for CZ work/payroll tools (Calcilo implant, 2026-11-06).
   Czech 2026 figures: min. wage 22 400 Kč/mo; employee social 7.1%, health 4.5%;
   tax 15% up to 146 901 Kč/mo, 23% above; basic credit 2 570 Kč/mo;
   stravné 155/236/370 Kč (business sector minima); car 5.90 Kč/km;
   sick pay from day 15: 60% (days 15-30), 66% (31-60), 72% (61+);
   severance multiples 1x/2x/3x (Labour Code §67); holiday 4 weeks.
   Pension + alimony are labelled estimates with stated assumptions.
   Pure functions + DOM binding + module.exports guard. */
function fmt(n, d) {
  if (d === undefined) d = 2;
  if (n === null || n === undefined || isNaN(n)) return '–';
  return n.toLocaleString('cs-CZ', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmt0(n) { return fmt(n, 0); }
function fmtKc(n) { return fmt0(n) + ' Kč'; }

function calcCistaMzda(hrubaMesicni) {
  var socialni = hrubaMesicni * 0.071;
  var zdravotni = hrubaMesicni * 0.045;
  var dan = hrubaMesicni <= 146901 ? hrubaMesicni * 0.15 : 146901 * 0.15 + (hrubaMesicni - 146901) * 0.23;
  dan = Math.max(0, dan - 2570);
  return { socialni: socialni, zdravotni: zdravotni, dan: dan, cista: hrubaMesicni - socialni - zdravotni - dan };
}
function calcDuchod(vekOdchodu, rokyPojisteni, prumernaMzda) {
  // ORIENTAČNÍ odhad s uvedeným předpokladem: základní výměra 4 120 Kč
  // + 1,5 % výpočtového základu za každý rok pojištění; výpočtový základ
  // se tu zjednodušeně počítá jako 78 % průměrné mzdy (bez redukčních hranic).
  var vypoctovyZaklad = prumernaMzda * 0.78;
  var procentni = 0.015 * rokyPojisteni * vypoctovyZaklad;
  return { zakladni: 4120, procentni: procentni, duchod: 4120 + procentni, vypoctovyZaklad: vypoctovyZaklad };
}
function calcCestovniNahrady(hodiny, km) {
  var stravne = hodiny <= 12 ? 155 : hodiny <= 18 ? 236 : 370;
  var auto = km * 5.90;
  return { stravne: stravne, auto: auto, celkem: stravne + auto };
}
function calcDovolena(hodinyTydne, mesicu, cerpanoHodin) {
  var rocni = hodinyTydne * 4; // 4 týdny dovolené
  var narok = rocni * mesicu / 12;
  return { rocni: rocni, narok: narok, zbytek: Math.max(0, narok - cerpanoHodin) };
}
function calcNemocenska(dvz, dny) {
  // Nemocenské od 15. dne: 60 % (15.-30. den), 66 % (31.-60.), 72 % (od 61.).
  var castka = 0;
  for (var d = 15; d <= dny; d++) {
    var sazba = d <= 30 ? 0.60 : d <= 60 ? 0.66 : 0.72;
    castka += dvz * sazba;
  }
  return { nemocenske: castka, dnyPlacene: Math.max(0, dny - 14) };
}
function calcOdstupne(mesicniVydelek, nasobek) {
  return mesicniVydelek * nasobek;
}
function calcStaz(datumOd, datumDo) {
  var od = new Date(datumOd + 'T00:00:00');
  var doD = new Date(datumDo + 'T00:00:00');
  var roky = doD.getFullYear() - od.getFullYear();
  var mesice = doD.getMonth() - od.getMonth();
  var dny = doD.getDate() - od.getDate();
  if (dny < 0) { mesice -= 1; var prev = new Date(doD.getFullYear(), doD.getMonth(), 0); dny += prev.getDate(); }
  if (mesice < 0) { roky -= 1; mesice += 12; }
  var celkemDni = Math.round((doD - od) / 86400000);
  return { roky: roky, mesice: mesice, dny: dny, celkemDni: celkemDni };
}
function calcPreduchodek(nasporeno, mesicniVyplata) {
  var mesicu = Math.floor(nasporeno / mesicniVyplata);
  return { mesicu: mesicu, roky: mesicu / 12 };
}
function calcNadcas(hodinovaMzda, hodiny, priplatekPct) {
  var zaklad = hodinovaMzda * hodiny;
  var priplatek = zaklad * priplatekPct / 100;
  return { zaklad: zaklad, priplatek: priplatek, celkem: zaklad + priplatek };
}
function calcPHV(hrubaCtvrtleti, odpracovaneHodiny) {
  return hrubaCtvrtleti / odpracovaneHodiny;
}
function calcAlimenty(prijem, pocetDeti) {
  // ORIENTAČNÍ vodítko podle běžné soudní praxe: 1 dítě 15 %, 2 děti 20 %,
  // 3 a více dětí 25 % čistého příjmu. Soud rozhoduje individuálně.
  var pct = pocetDeti <= 1 ? 15 : pocetDeti === 2 ? 20 : 25;
  return { pct: pct, alimenty: prijem * pct / 100 };
}

var MODES = {
  'duchod': function (v) { var r = calcDuchod(v.a, v.b, v.c); return { big: fmtKc(r.duchod) + ' měsíčně', rows: [['Odhad důchodu', fmtKc(r.duchod)], ['Základní výměra', fmtKc(r.zakladni)], ['Procentní výměra', fmtKc(r.procentni)], ['Roky pojištění', fmt0(v.b)]], note: 'ORIENTAČNÍ odhad: základní výměra 4 120 Kč + 1,5 % výpočtového základu za rok pojištění; výpočtový základ tu bereme jako 78 % průměrné mzdy, bez redukčních hranic. Přesný výpočet udělá ČSSZ.' }; },
  'cestovni-nahrady': function (v) { var r = calcCestovniNahrady(v.a, v.b); return { big: fmtKc(r.celkem), rows: [['Stravné', fmtKc(r.stravne)], ['Náhrada za auto (5,90 Kč/km)', fmtKc(r.auto)], ['Celkem', fmtKc(r.celkem)]], note: 'Stravné 2026: 155 Kč (5–12 h), 236 Kč (12–18 h), 370 Kč (nad 18 h); auto 5,90 Kč/km. Sazby vyhlašuje MPSV.' }; },
  'cista-mzda': function (v) { var r = calcCistaMzda(v.a); return { big: fmtKc(r.cista) + ' čistého', rows: [['Hrubá mzda', fmtKc(v.a)], ['Sociální pojištění 7,1 %', fmtKc(r.socialni)], ['Zdravotní pojištění 4,5 %', fmtKc(r.zdravotni)], ['Daň po slevě 2 570 Kč', fmtKc(r.dan)], ['Čistá mzda', fmtKc(r.cista)]], note: 'Daň 15 % do 146 901 Kč měsíčně, 23 % nad touto hranicí. Výsledek je orientační; přesnou mzdu spočítá mzdová účetní.' }; },
  'dovolena': function (v) { var r = calcDovolena(v.a, v.b, v.c); return { big: fmt(r.zbytek, 0) + ' hodin dovolené', rows: [['Roční nárok', fmt0(r.rocni) + ' hodin'], ['Nárok za ' + fmt0(v.b) + ' měsíců', fmt(r.narok, 0) + ' hodin'], ['Zbývá', fmt(r.zbytek, 0) + ' hodin']], note: 'Základní výměra dovolené je 4 týdny ročně; u 40 hodin týdně je to 160 hodin.' }; },
  'nemocenska': function (v) { var r = calcNemocenska(v.a, v.b); return { big: fmtKc(r.nemocenske), rows: [['Nemocenské od 15. dne', fmtKc(r.nemocenske)], ['Placené dny', fmt0(r.dnyPlacene) + ' dní'], ['Denní vyměřovací základ', fmtKc(v.a)]], note: 'Prvních 14 dní platí zaměstnavatel náhradu mzdy (60 % průměrného výdělku); od 15. dne platí ČSSZ nemocenské 60 % / 66 % / 72 %.' }; },
  'odstupne': function (v) { var r = calcOdstupne(v.a, parseFloat(v.s1)); return { big: fmtKc(r), rows: [['Odstupné', fmtKc(r)], ['Měsíční výdělek', fmtKc(v.a)], ['Násobek', fmt(parseFloat(v.s1), 0) + '× průměrného měsíčního výdělku']], note: 'Odstupné podle § 67 zákoníku práce: 1×, 2× nebo 3× průměrného měsíčního výdělku podle důvodu a délky pracovního poměru.' }; },
  'staz-prace': function (v) { var r = calcStaz(v.a, v.b); return { big: r.roky + ' let ' + r.mesice + ' měs.', rows: [['Délka praxe', r.roky + ' let, ' + r.mesice + ' měsíců, ' + r.dny + ' dní'], ['Celkem dní', fmt0(r.celkemDni) + ' dní']], note: 'Počítá se kalendářní doba mezi oběma daty.' }; },
  'preduchodek': function (v) { var r = calcPreduchodek(v.a, v.b); return { big: fmt0(r.mesicu) + ' měsíců předdůchodu', rows: [['Naspořeno', fmtKc(v.a)], ['Měsíční výplata', fmtKc(v.b)], ['Vystačí na', fmt0(r.mesicu) + ' měsíců (' + fmt(r.roky, 1) + ' let)']], note: 'Předdůchod lze čerpat nejdříve 5 let před důchodovým věkem, nejméně 2 roky, z doplňkového penzijního spoření.' }; },
  'nadcas': function (v) { var r = calcNadcas(v.a, v.b, parseFloat(v.s1)); return { big: fmtKc(r.celkem), rows: [['Základní mzda za přesčas', fmtKc(r.zaklad)], ['Příplatek ' + fmt(parseFloat(v.s1), 0) + ' %', fmtKc(r.priplatek)], ['Celkem za přesčas', fmtKc(r.celkem)]], note: 'Příplatek za práci přesčas je nejméně 25 % průměrného hodinového výdělku, pokud se zaměstnanec nedohodne na náhradním volnu.' }; },
  'svd': function (v) { var r = calcPHV(v.a, v.b); return { big: fmt(r) + ' Kč/hod', rows: [['Průměrný hodinový výdělek', fmt(r) + ' Kč/hod'], ['Hrubá mzda za čtvrtletí', fmtKc(v.a)], ['Odpracované hodiny', fmt0(v.b) + ' h']], note: 'PHV = hrubá mzda za předchozí čtvrtletí dělená odpracovanými hodinami. Používá se pro náhrady mzdy a příplatky.' }; },
  'alimenty': function (v) { var r = calcAlimenty(v.a, v.b); return { big: fmtKc(r.alimenty) + ' měsíčně', rows: [['Výživné', fmtKc(r.alimenty)], ['Sazba', fmt0(r.pct) + ' % příjmu'], ['Počet dětí', fmt0(v.b)]], note: 'ORIENTAČNÍ vodítko podle běžné soudní praxe. Výši výživného vždy určuje soud podle příjmů a potřeb dítěte.' }; }
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
  if (mode === 'staz-prace') { v.a = raw.a; v.b = raw.b; }
  var out;
  try { out = fn(v); } catch (e) { return; }
  var res = document.getElementById('cz-result');
  if (!res) return;
  var html = '<div class="big">' + out.big + '</div><table><tbody>';
  for (var i = 0; i < out.rows.length; i++) html += '<tr><td>' + out.rows[i][0] + '</td><td>' + out.rows[i][1] + '</td></tr>';
  html += '</tbody></table>';
  if (out.note) html += '<p>' + out.note + '</p>';
  res.innerHTML = html;
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
  module.exports = { calcCistaMzda: calcCistaMzda, calcDuchod: calcDuchod, calcCestovniNahrady: calcCestovniNahrady, calcDovolena: calcDovolena, calcNemocenska: calcNemocenska, calcOdstupne: calcOdstupne, calcStaz: calcStaz, calcPreduchodek: calcPreduchodek, calcNadcas: calcNadcas, calcPHV: calcPHV, calcAlimenty: calcAlimenty, MODES: MODES };
}
