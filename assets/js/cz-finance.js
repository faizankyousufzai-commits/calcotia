'use strict';
/* cz-finance.js — shared engine for CZ finance tools (Calcilo implant, 2026-11-06).
   Czech 2026 figures: income tax 15% up to 1 762 812 Kč/yr (146 901 Kč/mo),
   23% above; basic taxpayer credit 30 840 Kč/yr (2 570 Kč/mo); employee social
   7.1%, health 4.5%; DPH 21% / 12% / 0%. Pure functions + DOM binding +
   module.exports guard so Node can test it. */
function fmt(n, d) {
  if (d === undefined) d = 2;
  if (n === null || n === undefined || isNaN(n)) return '–';
  return n.toLocaleString('cs-CZ', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmt0(n) { return fmt(n, 0); }
function fmtKc(n) { return fmt0(n) + ' Kč'; }

function annuityPayment(jistina, rocniSazbaPct, mesicu) {
  var r = rocniSazbaPct / 100 / 12;
  if (r === 0) return jistina / mesicu;
  return jistina * r / (1 - Math.pow(1 + r, -mesicu));
}
function calcDanRocni(hrubyRocni) {
  var dan = 0;
  var hranice = 1762812;
  if (hrubyRocni <= hranice) dan = hrubyRocni * 0.15;
  else dan = hranice * 0.15 + (hrubyRocni - hranice) * 0.23;
  dan = Math.max(0, dan - 30840);
  var socialni = hrubyRocni * 0.071;
  var zdravotni = hrubyRocni * 0.045;
  return { dan: dan, socialni: socialni, zdravotni: zdravotni, cisty: hrubyRocni - dan - socialni - zdravotni };
}
function calcCistaMzda(hrubaMesicni) {
  var socialni = hrubaMesicni * 0.071;
  var zdravotni = hrubaMesicni * 0.045;
  var dan = hrubaMesicni <= 146901 ? hrubaMesicni * 0.15 : 146901 * 0.15 + (hrubaMesicni - 146901) * 0.23;
  dan = Math.max(0, dan - 2570);
  return { socialni: socialni, zdravotni: zdravotni, dan: dan, cista: hrubaMesicni - socialni - zdravotni - dan };
}
function calcDPH(cena, sazbaPct, sDPH) {
  var sazba = sazbaPct / 100;
  if (sDPH) return { bezDPH: cena / (1 + sazba), dph: cena - cena / (1 + sazba), sDPH: cena };
  return { bezDPH: cena, dph: cena * sazba, sDPH: cena * (1 + sazba) };
}
function calcSlozeneUroceni(jistina, sazbaPct, roky, frekvence) {
  var r = sazbaPct / 100;
  var fv = jistina * Math.pow(1 + r / frekvence, frekvence * roky);
  return { konecna: fv, vynos: fv - jistina };
}
function calcSporeni(mesicniVklad, sazbaPct, roky) {
  var r = sazbaPct / 100 / 12;
  var n = roky * 12;
  var fv = r === 0 ? mesicniVklad * n : mesicniVklad * (Math.pow(1 + r, n) - 1) / r;
  return { konecna: fv, vklady: mesicniVklad * n, vynos: fv - mesicniVklad * n };
}
function calcInvestice(pocatecni, mesicni, roky, vynosPct) {
  var r = vynosPct / 100 / 12;
  var n = roky * 12;
  var fv = pocatecni * Math.pow(1 + r, n) + (r === 0 ? mesicni * n : mesicni * (Math.pow(1 + r, n) - 1) / r);
  var vklady = pocatecni + mesicni * n;
  var zdvojeni = 72 / vynosPct;
  return { konecna: fv, vklady: vklady, vynos: fv - vklady, zdvojeniLet: zdvojeni };
}
function calcInflace(castka, roky, inflacePct) {
  var realna = castka / Math.pow(1 + inflacePct / 100, roky);
  return { realna: realna, ztrata: castka - realna };
}
function calcRPSN(jistina, tinPct, mesicu, poplatek) {
  var splatka = annuityPayment(jistina, tinPct, mesicu);
  var cista = jistina - poplatek;
  function npv(mesicni) {
    var s = 0;
    for (var i = 1; i <= mesicu; i++) s += splatka / Math.pow(1 + mesicni, i);
    return s - cista;
  }
  var lo = 0, hi = 0.05;
  while (npv(hi) > 0) hi *= 2;
  for (var k = 0; k < 100; k++) { var mid = (lo + hi) / 2; if (npv(mid) > 0) lo = mid; else hi = mid; }
  var rpsn = (Math.pow(1 + (lo + hi) / 2, 12) - 1) * 100;
  return { splatka: splatka, rpsn: rpsn, celkem: splatka * mesicu };
}
function calcDluhopis(nominal, kuponPct, roky, pozadovanyVynosPct) {
  var kupon = nominal * kuponPct / 100;
  var y = pozadovanyVynosPct / 100;
  var cena = 0;
  for (var i = 1; i <= roky; i++) cena += kupon / Math.pow(1 + y, i);
  cena += nominal / Math.pow(1 + y, roky);
  return { cena: cena, kupon: kupon, celkemKupony: kupon * roky };
}
function calcProcenta(procento, zaklad) { return zaklad * procento / 100; }
function calcZlato(vahaG, cenaZaGram) { return vahaG * cenaZaGram; }
function calcKurz(castka, kurz) { return castka * kurz; }
function calcInsolvence(dluh, mesicniSplatka) {
  var mesicu = Math.ceil(dluh / mesicniSplatka);
  var roky = mesicu / 12;
  return { mesicu: mesicu, roky: roky, oddluzeni: roky <= 3 ? 'oddlužení do 3 let je možné, pokud splníte podmínky insolvenčního zákona' : 'oddlužení obvykle trvá 5 let' };
}

var MODES = {
  'dan': function (v) { var r = calcDanRocni(v.a); return { big: fmtKc(r.cisty) + ' čistého ročně', rows: [['Hrubý roční příjem', fmtKc(v.a)], ['Daň z příjmů (po slevě)', fmtKc(r.dan)], ['Sociální pojištění 7,1 %', fmtKc(r.socialni)], ['Zdravotní pojištění 4,5 %', fmtKc(r.zdravotni)], ['Čistý roční příjem', fmtKc(r.cisty)]], note: 'Daň 15 % do 1 762 812 Kč ročně, 23 % nad touto hranicí; sleva na poplatníka 30 840 Kč ročně. Výsledek je orientační.' }; },
  'hypoteka': function (v) { var s = annuityPayment(v.a, v.b, v.c * 12); var celkem = s * v.c * 12; return { big: fmtKc(s) + ' měsíčně', rows: [['Měsíční splátka', fmtKc(s)], ['Výše hypotéky', fmtKc(v.a)], ['Úroková sazba', fmt(v.b) + ' % p.a.'], ['Doba splácení', fmt0(v.c) + ' let'], ['Celkem zaplatíte', fmtKc(celkem)], ['Z toho úroky', fmtKc(celkem - v.a)]], note: 'Anuitní splátka při pevné sazbě po celou dobu; banka může požadovat pojištění a poplatky.' }; },
  'uver': function (v) { var s = annuityPayment(v.a, v.b, v.c * 12); var celkem = s * v.c * 12; return { big: fmtKc(s) + ' měsíčně', rows: [['Měsíční splátka', fmtKc(s)], ['Výše úvěru', fmtKc(v.a)], ['Úroková sazba', fmt(v.b) + ' % p.a.'], ['Doba splácení', fmt0(v.c) + ' let'], ['Celkem zaplatíte', fmtKc(celkem)], ['Z toho úroky', fmtKc(celkem - v.a)]], note: 'Anuitní splátka při pevné sazbě; porovnejte i RPSN, ne jen úrok.' }; },
  'insolvence': function (v) { var r = calcInsolvence(v.a, v.b); return { big: fmt0(r.mesicu) + ' měsíců splácení', rows: [['Celkový dluh', fmtKc(v.a)], ['Měsíční splátka', fmtKc(v.b)], ['Doba splácení', fmt0(r.mesicu) + ' měsíců (' + fmt(r.roky, 1) + ' let)']], note: r.oddluzeni + '. Přesné podmínky oddlužení stanoví insolvenční zákon a soud.' }; },
  'investice': function (v) { var r = calcInvestice(v.a, v.b, v.c, v.d); return { big: fmtKc(r.konecna), rows: [['Hodnota investice po ' + fmt0(v.c) + ' letech', fmtKc(r.konecna)], ['Vaše vklady', fmtKc(r.vklady)], ['Výnos', fmtKc(r.vynos)], ['Doba zdvojení (pravidlo 72)', fmt(r.zdvojeniLet, 1) + ' let']], note: 'Výnos není zaručený; minulá výkonnost negarantuje budoucí. Počítejte s poplatky a daní.' }; },
  'dluhopis': function (v) { var r = calcDluhopis(v.a, v.b, v.c, v.d); return { big: fmtKc(r.cena), rows: [['Cena dluhopisu', fmtKc(r.cena)], ['Roční kupón', fmtKc(r.kupon)], ['Kupóny celkem', fmtKc(r.celkemKupony)], ['Nominální hodnota', fmtKc(v.a)]], note: 'Cena je současná hodnota budoucích kupónů a jistiny při požadovaném výnosu.' }; },
  'dph': function (v) { var r = calcDPH(v.a, v.s1 === 's' ? parseFloat(v.s2) : parseFloat(v.s2), v.s1 === 's'); return { big: fmtKc(r.sDPH) + ' s DPH', rows: [['Cena bez DPH', fmtKc(r.bezDPH)], ['DPH', fmtKc(r.dph)], ['Cena s DPH', fmtKc(r.sDPH)]], note: 'Sazby DPH v Česku: základní 21 %, snížená 12 %, vybrané zboží 0 %.' }; },
  'inflace': function (v) { var r = calcInflace(v.a, v.b, v.c); return { big: fmtKc(r.realna) + ' dnešní kupní síly', rows: [['Částka dnes', fmtKc(v.a)], ['Kupní síla za ' + fmt0(v.b) + ' let', fmtKc(r.realna)], ['Ztráta kupní síly', fmtKc(r.ztrata)]], note: 'Při stálé inflaci ' + fmt(v.c) + ' % ročně. Skutečná inflace se každý rok mění.' }; },
  'procent': function (v) { var r = calcProcenta(v.a, v.b); return { big: fmt(r) + '', rows: [[fmt(v.a) + ' % z ' + fmt0(v.b), fmt(r)], ['Základ', fmt0(v.b)], ['Procento', fmt(v.a) + ' %']], note: 'Procento ze základu se počítá jako základ × procento / 100.' }; },
  'rpsn': function (v) { var r = calcRPSN(v.a, v.b, v.c, v.d); return { big: fmt(r.rpsn) + ' % RPSN', rows: [['RPSN', fmt(r.rpsn) + ' %'], ['Měsíční splátka', fmtKc(r.splatka)], ['Celkem zaplatíte', fmtKc(r.celkem)]], note: 'RPSN zahrnuje úrok i poplatky; je to nejlepší číslo pro porovnání půjček.' }; },
  'slozene-uroceni': function (v) { var r = calcSlozeneUroceni(v.a, v.b, v.c, parseFloat(v.s1)); return { big: fmtKc(r.konecna), rows: [['Konečná částka', fmtKc(r.konecna)], ['Vklad', fmtKc(v.a)], ['Výnos', fmtKc(r.vynos)]], note: 'Složené úročení: úroky se připisují k jistině a samy se dále úročí.' }; },
  'sporeni': function (v) { var r = calcSporeni(v.a, v.b, v.c); return { big: fmtKc(r.konecna), rows: [['Naspoříte za ' + fmt0(v.c) + ' let', fmtKc(r.konecna)], ['Vaše vklady', fmtKc(r.vklady)], ['Výnos', fmtKc(r.vynos)]], note: 'Pravidelné spoření s měsíčním vkladem a ročním úrokem ' + fmt(v.b) + ' %.' }; },
  'zlato': function (v) { var r = calcZlato(v.a, v.b); return { big: fmtKc(r), rows: [['Cena zlata', fmtKc(r)], ['Váha', fmt(v.a, 1) + ' g'], ['Cena za gram', fmtKc(v.b)]], note: 'Cenu za gram zadejte podle aktuálního kurzu; zlato se obchoduje v dolarech za unci.' }; },
  'kurz': function (v) { var r = calcKurz(v.a, v.b); return { big: fmtKc(r), rows: [['Přepočtená částka', fmtKc(r)], ['Kurz', fmt(v.b, 2) + ' Kč'], ['Částka', fmt(v.a, 2)]], note: 'Kurz zadejte podle aktuálního kurzu ČNB; banky a směnárny používají vlastní kurz.' }; }
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
  module.exports = { annuityPayment: annuityPayment, calcDanRocni: calcDanRocni, calcCistaMzda: calcCistaMzda, calcDPH: calcDPH, calcSlozeneUroceni: calcSlozeneUroceni, calcSporeni: calcSporeni, calcInvestice: calcInvestice, calcInflace: calcInflace, calcRPSN: calcRPSN, calcDluhopis: calcDluhopis, calcProcenta: calcProcenta, calcZlato: calcZlato, calcKurz: calcKurz, calcInsolvence: calcInsolvence, MODES: MODES };
}
