'use strict';
/* cz-health.js — shared engine for CZ health tools (Calcilo implant, 2026-11-06).
   Pattern: pure functions + DOM binding guarded by typeof document !== 'undefined'
   + module.exports guard so Node can test it. All labels in Czech. */
function fmt(n, d) {
  if (d === undefined) d = 2;
  if (n === null || n === undefined || isNaN(n)) return '–';
  return n.toLocaleString('cs-CZ', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmt0(n) { return fmt(n, 0); }

function calcBMI(vahaKg, vyskaCm) {
  var m = vyskaCm / 100;
  var bmi = vahaKg / (m * m);
  var kat = bmi < 18.5 ? 'podváha' : bmi < 25 ? 'normální váha' : bmi < 30 ? 'nadváha' : 'obezita';
  return { bmi: bmi, kategorie: kat };
}
function calcBMIProDeti(vahaKg, vyskaCm) {
  // Percentil se bez plné WHO LMS tabulky neuvádí (stejné omezení jako ES percentiles):
  // vrací se jen BMI a upozornění. Percentil = null.
  var r = calcBMI(vahaKg, vyskaCm);
  return { bmi: r.bmi, percentil: null, upozorneni: 'Přesný percentil vyžaduje plnou WHO LMS tabulku podle věku a pohlaví; výsledek proto ukazuje jen BMI.' };
}
function calcBSA(vyskaCm, vahaKg) { // Mosteller
  return Math.sqrt(vyskaCm * vahaKg / 3600);
}
function calcBMR(vahaKg, vyskaCm, vek, pohlavi) { // Mifflin-St Jeor
  var b = 10 * vahaKg + 6.25 * vyskaCm - 5 * vek + (pohlavi === 'zena' ? -161 : 5);
  return b;
}
function calcTDEE(bmr, aktivita) { return bmr * aktivita; }
function calcVoda(vahaKg, hodinySportu) { return vahaKg * 0.035 + hodinySportu * 0.5; }
function calcHCG(hcg1, hcg2, dny) {
  var pomer = hcg2 / hcg1;
  var zdvojeniHodin = dny * 24 * Math.log(2) / Math.log(pomer);
  return { pomer: pomer, zdvojeniHodin: zdvojeniHodin };
}
function calcIdealniVaha(vyskaCm, pohlavi) { // Devine
  var palce = vyskaCm / 2.54;
  var zaklad = pohlavi === 'zena' ? 45.5 : 50;
  var ideal = zaklad + 2.3 * (palce - 60);
  return { ideal: ideal, min: ideal * 0.9, max: ideal * 1.1 };
}
function calcPas(vyskaPasCm, pohlavi) {
  var limit = pohlavi === 'zena' ? 88 : 102;
  var zvysene = pohlavi === 'zena' ? 80 : 94;
  var riziko = vyskaPasCm >= limit ? 'vysoké riziko' : vyskaPasCm >= zvysene ? 'zvýšené riziko' : 'normální';
  return { limit: limit, riziko: riziko };
}
function calcSHF(kreatininUmol, vek, pohlavi) { // CKD-EPI 2021, kreatinin v µmol/l -> mg/dl
  var scr = kreatininUmol / 88.4;
  var k = pohlavi === 'zena' ? 0.7 : 0.9;
  var a = pohlavi === 'zena' ? -0.241 : -0.302;
  var e = 142 * Math.pow(Math.min(scr / k, 1), a) * Math.pow(Math.max(scr / k, 1), -1.200) * Math.pow(0.9938, vek);
  if (pohlavi === 'zena') e *= 1.012;
  return e;
}
function calcSpaleneKalorie(met, vahaKg, minuty) { return met * vahaKg * (minuty / 60); }
function calcTuk(vyskaPasCm, krkCm, vyskaCm, bokyCm, pohlavi) { // US Navy
  var l10 = Math.log10;
  if (pohlavi === 'zena') return 163.205 * l10(vyskaPasCm + bokyCm - krkCm) - 97.684 * l10(vyskaCm) - 78.387;
  return 86.010 * l10(vyskaPasCm - krkCm) - 70.041 * l10(vyskaCm) + 36.76;
}
function calcTempo(vzdalenostKm, casMin) {
  var tempoMinKm = casMin / vzdalenostKm;
  var rychlost = vzdalenostKm / (casMin / 60);
  return { tempoMinKm: tempoMinKm, rychlost: rychlost };
}
function calcPodprsenka(podprsCm, presPrsCm) {
  var obvod = Math.round(podprsCm / 5) * 5;
  var rozdil = presPrsCm - podprsCm;
  var kosicky = ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
  var idx = Math.max(0, Math.min(7, Math.round((rozdil - 10) / 2.5)));
  return { obvod: obvod, kosicek: kosicky[idx], rozdil: rozdil };
}
function calcZonyTep(vek, klidovyTep) {
  var max = 220 - vek;
  var rezerva = max - klidovyTep;
  var zony = [];
  var hranice = [[0.5, 0.6], [0.6, 0.7], [0.7, 0.8], [0.8, 0.9], [0.9, 1.0]];
  for (var i = 0; i < hranice.length; i++) {
    zony.push([Math.round(klidovyTep + rezerva * hranice[i][0]), Math.round(klidovyTep + rezerva * hranice[i][1])]);
  }
  return { max: max, zony: zony };
}
function calcKalorie(bmr, aktivita) { return calcTDEE(bmr, aktivita); }
function calcWHR(pasCm, bokyCm, pohlavi) {
  var whr = pasCm / bokyCm;
  var limit = pohlavi === 'zena' ? 0.85 : 0.90;
  return { whr: whr, riziko: whr >= limit ? 'zvýšené riziko' : 'normální' };
}
function calcAlkohol(vahaKg, objemMl, procento, hodiny, pohlavi) { // Widmark, orientační
  var gramy = objemMl * (procento / 100) * 0.789;
  var r = pohlavi === 'zena' ? 0.55 : 0.68;
  var promile = gramy / (vahaKg * r) - 0.15 * hodiny;
  return { gramy: gramy, promile: Math.max(0, promile) };
}
function parseDate(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function fmtDate(d) { return d.getDate() + '. ' + (d.getMonth() + 1) + '. ' + d.getFullYear(); }
function calcOvulace(posledniMenstruace, cyklusDni) {
  var lmp = parseDate(posledniMenstruace);
  var dalsi = new Date(lmp.getTime() + cyklusDni * 86400000);
  var ovulace = new Date(dalsi.getTime() - 14 * 86400000);
  var plodneOd = new Date(ovulace.getTime() - 5 * 86400000);
  return { ovulace: ovulace, plodneOd: plodneOd, plodneDo: ovulace, dalsiMenstruace: dalsi };
}
function calcTehotenstvi(posledniMenstruace, dnesStr) {
  var lmp = parseDate(posledniMenstruace);
  var dnes = dnesStr ? parseDate(dnesStr) : new Date();
  var termin = new Date(lmp.getTime() + 280 * 86400000);
  var dny = Math.floor((dnes - lmp) / 86400000);
  var tydny = Math.floor(dny / 7);
  return { termin: termin, tydny: tydny, dnyZbytek: dny % 7 };
}
function calcOckovani(narozeniStr, dnesStr) {
  var nar = parseDate(narozeniStr);
  var dnes = dnesStr ? parseDate(dnesStr) : new Date();
  var mesice = (dnes.getFullYear() - nar.getFullYear()) * 12 + (dnes.getMonth() - nar.getMonth());
  if (dnes.getDate() < nar.getDate()) mesice -= 1;
  var milniky = [
    { m: 0, text: 'TBC — jen rizikové děti, po narození' },
    { m: 2, text: 'Hexavakcína 1. dávka (záškrt, tetanus, černý kašel, Hib, hepatitida B, polio)' },
    { m: 3, text: 'Hexavakcína 2. dávka' },
    { m: 4, text: 'Hexavakcína 3. dávka + pneumokok 1. dávka' },
    { m: 11, text: 'Hexavakcína 4. dávka + pneumokok 2. dávka' },
    { m: 13, text: 'MMR 1. dávka (spalničky, příušnice, zarděnky)' },
    { m: 60, text: 'MMR 2. dávka (5–6 let) + záškrt, tetanus, černý kašel, polio' },
    { m: 120, text: 'Přeočkování tetanus (10–11 let)' }
  ];
  var dalsi = null;
  for (var i = 0; i < milniky.length; i++) { if (milniky[i].m > mesice) { dalsi = milniky[i]; break; } }
  return { mesice: mesice, dalsi: dalsi };
}
function calcSpani(casProbuzeni, cykly) { // čas "07:00", cykly 90 min + 15 min usínání
  var p = casProbuzeni.split(':');
  var min = (+p[0]) * 60 + (+p[1]) - cykly * 90 - 15;
  while (min < 0) min += 1440;
  var h = Math.floor(min / 60), m = min % 60;
  return (h < 10 ? '0' + h : '' + h) + ':' + (m < 10 ? '0' + m : '' + m);
}

var MODES = {
  'bmi': function (v) { var r = calcBMI(v.a, v.b); return { big: fmt(r.bmi) + ' BMI', rows: [['BMI', fmt(r.bmi)], ['Hodnocení', r.kategorie], ['Normální BMI', '18,5–24,9']], note: 'BMI nerozlišuje svaly a tuk; u sportovců a dětí se hodnocení liší.' }; },
  'bmi-deti': function (v) { var r = calcBMIProDeti(v.a, v.b); return { big: fmt(r.bmi) + ' BMI', rows: [['BMI dítěte', fmt(r.bmi)], ['Percentil', 'neuveden — vyžaduje WHO LMS tabulku']], note: r.upozorneni }; },
  'bsa': function (v) { var r = calcBSA(v.a, v.b); return { big: fmt(r) + ' m²', rows: [['Povrch těla (Mosteller)', fmt(r) + ' m²'], ['Výška', fmt0(v.a) + ' cm'], ['Váha', fmt0(v.b) + ' kg']], note: 'BSA se používá hlavně pro dávkování léků a chemoterapii.' }; },
  'bmr': function (v) { var r = calcBMR(v.a, v.b, v.c, v.s1); return { big: fmt0(r) + ' kcal/den', rows: [['Bazální metabolismus', fmt0(r) + ' kcal/den'], ['Váha', fmt0(v.a) + ' kg'], ['Výška', fmt0(v.b) + ' cm']], note: 'BMR je energie, kterou tělo spálí v klidu. Celkový výdej je vyšší podle aktivity.' }; },
  'voda': function (v) { var r = calcVoda(v.a, v.b); return { big: fmt(r, 1) + ' l/den', rows: [['Doporučený příjem vody', fmt(r, 1) + ' l'], ['Váha', fmt0(v.a) + ' kg'], ['Sport', fmt0(v.b) + ' h']], note: 'Orientační hodnota: 35 ml na kilogram váhy plus 0,5 l na hodinu sportu.' }; },
  'hcg': function (v) { var r = calcHCG(v.a, v.b, v.c); return { big: 'zdvojení za ' + fmt(r.zdvojeniHodin, 0) + ' h', rows: [['První hodnota hCG', fmt0(v.a) + ' IU/l'], ['Druhá hodnota hCG', fmt0(v.b) + ' IU/l'], ['Nárůst', fmt(r.pomer, 1) + '× za ' + fmt0(v.c) + ' dny'], ['Doba zdvojení', fmt(r.zdvojeniHodin, 0) + ' hodin']], note: 'V raném těhotenství se hCG běžně zdvojí za 48–72 hodin. Výsledek nenahrazuje vyšetření u lékaře.' }; },
  'idealni-vaha': function (v) { var r = calcIdealniVaha(v.a, v.s1); return { big: fmt(r.ideal, 1) + ' kg', rows: [['Ideální váha (Devine)', fmt(r.ideal, 1) + ' kg'], ['Zdravé rozmezí', fmt(r.min, 1) + '–' + fmt(r.max, 1) + ' kg']], note: 'Devineův vzorec je orientační; nezohledňuje stavbu těla ani svalovou hmotu.' }; },
  'pas': function (v) { var r = calcPas(v.a, v.s1); return { big: fmt0(v.a) + ' cm — ' + r.riziko, rows: [['Obvod pasu', fmt0(v.a) + ' cm'], ['Riziková hranice', fmt0(r.limit) + ' cm'], ['Hodnocení', r.riziko]], note: 'Obvod pasu nad 102 cm u mužů a nad 88 cm u žen znamená vysoké zdravotní riziko.' }; },
  'shf': function (v) { var r = calcSHF(v.a, v.b, v.s1); return { big: fmt(r, 0) + ' ml/min/1,73 m²', rows: [['eGFR (CKD-EPI 2021)', fmt(r, 0) + ' ml/min/1,73 m²'], ['Kreatinin', fmt0(v.a) + ' µmol/l']], note: 'Orientační výpočet funkce ledvin. Přesné posouzení patří lékaři, hlavně při hodnotě pod 60.' }; },
  'spal-kalorii': function (v) { var r = calcSpaleneKalorie(v.s1, v.a, v.b); return { big: fmt0(r) + ' kcal', rows: [['Spálené kalorie', fmt0(r) + ' kcal'], ['Váha', fmt0(v.a) + ' kg'], ['Délka', fmt0(v.b) + ' min']], note: 'MET je průměrná hodnota aktivity; skutečná spotřeba závisí na intenzitě.' }; },
  'tuku': function (v) { var r = calcTuk(v.a, v.b, v.c, v.d || 0, v.s1); return { big: fmt(r, 1) + ' % tuku', rows: [['Tělesný tuk (US Navy)', fmt(r, 1) + ' %'], ['Obvod pasu', fmt0(v.a) + ' cm']], note: 'Metoda US Navy měří tuk z obvodů těla; přesnější je měření kaliperem nebo DEXA.' }; },
  'tempo-behu': function (v) { var r = calcTempo(v.a, v.b); var mm = Math.floor(r.tempoMinKm), ss = Math.round((r.tempoMinKm - mm) * 60); return { big: mm + ':' + (ss < 10 ? '0' + ss : ss) + ' min/km', rows: [['Tempo', mm + ':' + (ss < 10 ? '0' + ss : ss) + ' min/km'], ['Rychlost', fmt(r.rychlost, 1) + ' km/h'], ['Vzdálenost', fmt(v.a, 1) + ' km']], note: 'Tempo je průměrné; v kopcích a v horku je pomalejší.' }; },
  'podprsenky': function (v) { var r = calcPodprsenka(v.a, v.b); return { big: r.obvod + '' + r.kosicek, rows: [['Velikost podprsenky', r.obvod + '' + r.kosicek], ['Obvod pod prsy', fmt0(v.a) + ' cm'], ['Obvod přes prsa', fmt0(v.b) + ' cm']], note: 'Velikosti se mezi značkami liší; vždy si podprsenku vyzkoušejte.' }; },
  'zony-tep': function (v) { var r = calcZonyTep(v.a, v.b); var rows = [['Maximální tep', fmt0(r.max) + ' tepů/min']]; var nazvy = ['Z1 regenerace', 'Z2 vytrvalost', 'Z3 tempo', 'Z4 práh', 'Z5 maximum']; for (var i = 0; i < 5; i++) rows.push([nazvy[i], r.zony[i][0] + '–' + r.zony[i][1] + ' tepů/min']); return { big: 'max ' + fmt0(r.max) + ' tepů/min', rows: rows, note: 'Zóny počítá Karvonenova metoda z maximálního a klidového tepu.' }; },
  'kalorii': function (v) { var bmr = calcBMR(v.a, v.b, v.c, v.s1); var r = calcKalorie(bmr, parseFloat(v.s2)); return { big: fmt0(r) + ' kcal/den', rows: [['Denní příjem kalorií', fmt0(r) + ' kcal'], ['BMR', fmt0(bmr) + ' kcal/den']], note: 'Pro hubnutí odečtěte zhruba 300–500 kcal, pro nabírání přidejte 300–500 kcal.' }; },
  'ovulace': function (v) { var r = calcOvulace(v.a, v.b); return { big: 'ovulace ' + fmtDate(r.ovulace), rows: [['Ovulace', fmtDate(r.ovulace)], ['Plodné dny', fmtDate(r.plodneOd) + ' – ' + fmtDate(r.plodneDo)], ['Další menstruace', fmtDate(r.dalsiMenstruace)]], note: 'Výpočet předpokládá pravidelný cyklus; ovulace se může posunout.' }; },
  'spani': function (v) { var r = calcSpani(v.a, v.b); return { big: 'jít spát v ' + r, rows: [['Doporučený čas usnutí', r], ['Počet cyklů', fmt0(v.b) + ' × 90 min'], ['Probuzení', v.a]], note: 'Jeden spánkový cyklus trvá asi 90 minut; připočteno je 15 minut na usnutí.' }; },
  'tdee': function (v) { var bmr = calcBMR(v.a, v.b, v.c, v.s1); var r = calcTDEE(bmr, parseFloat(v.s2)); return { big: fmt0(r) + ' kcal/den', rows: [['Celkový denní výdej (TDEE)', fmt0(r) + ' kcal'], ['BMR', fmt0(bmr) + ' kcal/den']], note: 'TDEE je BMR násobený koeficientem aktivity; pro hubnutí odečtěte 300–500 kcal.' }; },
  'tehotenstvi': function (v) { var r = calcTehotenstvi(v.a); return { big: 'termín ' + fmtDate(r.termin), rows: [['Termín porodu', fmtDate(r.termin)], ['Týden těhotenství', r.tydny + '. týden (' + r.dnyZbytek + ' dní)']], note: 'Termín se počítá jako 280 dní od prvního dne poslední menstruace.' }; },
  'whr': function (v) { var r = calcWHR(v.a, v.b, v.s1); return { big: fmt(r.whr, 2) + ' WHR — ' + r.riziko, rows: [['Poměr pas/boky', fmt(r.whr, 2)], ['Hodnocení', r.riziko]], note: 'WHR nad 0,90 u mužů a nad 0,85 u žen znamená zvýšené riziko.' }; },
  'alkoholu': function (v) { var r = calcAlkohol(v.a, v.b, v.c, v.d, v.s1); return { big: fmt(r.promile, 2) + ' ‰', rows: [['Alkohol v krvi (Widmark)', fmt(r.promile, 2) + ' ‰'], ['Přijatý alkohol', fmt(r.gramy, 1) + ' g']], note: 'V Česku platí nulová tolerance alkoholu za volantem. Výsledek je orientační; odbourávání se liší podle člověka.' }; },
  'ockovani': function (v) { var r = calcOckovani(v.a); return { big: r.dalsi ? r.dalsi.text : 'očkovací kalendář je splněn', rows: [['Věk dítěte', fmt0(r.mesice) + ' měsíců'], ['Další očkování', r.dalsi ? r.dalsi.text : 'žádné další v kalendáři']], note: 'Termíny podle českého očkovacího kalendáře; přesný termín určí pediatr.' }; }
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
  var v = { a: raw.a, b: toNum(raw.b, 0), c: toNum(raw.c, 0), d: toNum(raw.d, 0), e: toNum(raw.e, 0), s1: raw.s1, s2: raw.s2 };
  if (mode === 'ovulace' || mode === 'tehotenstvi' || mode === 'ockovani') { v.a = raw.a; v.b = toNum(raw.b, 28); }
  else { v.a = toNum(raw.a, 0); }
  if (mode === 'spani') { v.a = raw.a; v.b = toNum(raw.b, 5); }
  if (mode === 'zony-tep') { v.a = toNum(raw.a, 30); v.b = toNum(raw.b, 60); }
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
  module.exports = { calcBMI: calcBMI, calcBMIProDeti: calcBMIProDeti, calcBSA: calcBSA, calcBMR: calcBMR, calcTDEE: calcTDEE, calcVoda: calcVoda, calcHCG: calcHCG, calcIdealniVaha: calcIdealniVaha, calcPas: calcPas, calcSHF: calcSHF, calcSpaleneKalorie: calcSpaleneKalorie, calcTuk: calcTuk, calcTempo: calcTempo, calcPodprsenka: calcPodprsenka, calcZonyTep: calcZonyTep, calcWHR: calcWHR, calcAlkohol: calcAlkohol, calcOvulace: calcOvulace, calcTehotenstvi: calcTehotenstvi, calcOckovani: calcOckovani, calcSpani: calcSpani, MODES: MODES };
}
