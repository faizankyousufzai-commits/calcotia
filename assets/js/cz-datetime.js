'use strict';
/* cz-datetime.js — shared engine for CZ date/time tools (Calcilo implant, 2026-11-06).
   Pure functions + DOM binding + module.exports guard. */
function fmt(n, d) {
  if (d === undefined) d = 2;
  if (n === null || n === undefined || isNaN(n)) return '–';
  return n.toLocaleString('cs-CZ', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmt0(n) { return fmt(n, 0); }
function parseDate(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function fmtDate(d) { return d.getDate() + '. ' + (d.getMonth() + 1) + '. ' + d.getFullYear(); }
function pridejDny(datumStr, dny) {
  var d = parseDate(datumStr);
  return new Date(d.getTime() + dny * 86400000);
}
function rozdilDni(odStr, doStr) {
  return Math.round((parseDate(doStr) - parseDate(odStr)) / 86400000);
}
function rozdilMesicu(odStr, doStr) {
  var od = parseDate(odStr), doD = parseDate(doStr);
  var m = (doD.getFullYear() - od.getFullYear()) * 12 + (doD.getMonth() - od.getMonth());
  if (doD.getDate() < od.getDate()) m -= 1;
  return m;
}
function pracovniDny(odStr, doStr) {
  var od = parseDate(odStr), doD = parseDate(doStr);
  var pocet = 0;
  var d = new Date(od.getTime());
  while (d <= doD) { var den = d.getDay(); if (den !== 0 && den !== 6) pocet += 1; d = new Date(d.getTime() + 86400000); }
  return pocet;
}
function calcVek(narozeniStr, dnesStr) {
  var nar = parseDate(narozeniStr);
  var dnes = dnesStr ? parseDate(dnesStr) : new Date();
  var roky = dnes.getFullYear() - nar.getFullYear();
  var mesice = dnes.getMonth() - nar.getMonth();
  var dny = dnes.getDate() - nar.getDate();
  if (dny < 0) { mesice -= 1; var prev = new Date(dnes.getFullYear(), dnes.getMonth(), 0); dny += prev.getDate(); }
  if (mesice < 0) { roky -= 1; mesice += 12; }
  var celkemDni = Math.round((dnes - nar) / 86400000);
  return { roky: roky, mesice: mesice, dny: dny, celkemDni: celkemDni };
}
function parseCas(s) { var p = String(s).split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
function fmtCas(min) {
  var zaporne = min < 0; min = Math.abs(min);
  var h = Math.floor(min / 60), m = min % 60;
  return (zaporne ? '−' : '') + h + ':' + (m < 10 ? '0' + m : '' + m);
}
function sectiCas(cas1, cas2) { return parseCas(cas1) + parseCas(cas2); }
function rozdilCas(cas1, cas2) { return parseCas(cas1) - parseCas(cas2); }

var MODES = {
  'datum': function (v) { var r = pridejDny(v.a, v.b); return { big: fmtDate(r), rows: [['Výsledné datum', fmtDate(r)], ['Původní datum', fmtDate(parseDate(v.a))], ['Přičteno dní', fmt0(v.b)]], note: 'Datum se počítá včetně přestupných let.' }; },
  'cas': function (v) { var s = sectiCas(v.a, v.b); var r = rozdilCas(v.a, v.b); return { big: 'součet ' + fmtCas(s), rows: [['Součet časů', fmtCas(s)], ['Rozdíl časů', fmtCas(r)]], note: 'Časy se sčítají po minutách; 60 minut je 1 hodina.' }; },
  'dni': function (v) { var d = rozdilDni(v.a, v.b); return { big: fmt0(d) + ' dní', rows: [['Počet dní', fmt0(d) + ' dní'], ['Týdnů', fmt(d / 7, 1)], ['Měsíců (cca)', fmt(d / 30.44, 1)]], note: 'Počítá se rozdíl mezi oběma daty; svátky se nezohledňují.' }; },
  'mesicu': function (v) { var m = rozdilMesicu(v.a, v.b); var d = rozdilDni(v.a, v.b); return { big: fmt0(m) + ' měsíců', rows: [['Počet celých měsíců', fmt0(m)], ['Počet dní', fmt0(d) + ' dní']], note: 'Počítají se celé kalendářní měsíce mezi daty.' }; },
  'pracovni-dni': function (v) { var p = pracovniDny(v.a, v.b); var d = rozdilDni(v.a, v.b); return { big: fmt0(p) + ' pracovních dní', rows: [['Pracovní dny (po–pá)', fmt0(p)], ['Kalendářních dní', fmt0(d) + ' dní']], note: 'Počítají se dny pondělí až pátek; státní svátky se nezohledňují.' }; },
  'vek': function (v) { var r = calcVek(v.a); return { big: fmt0(r.roky) + ' let', rows: [['Věk', r.roky + ' let, ' + r.mesice + ' měsíců, ' + r.dny + ' dní'], ['Celkem dní', fmt0(r.celkemDni) + ' dní']], note: 'Věk se počítá k dnešnímu dni.' }; }
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
  if (mode === 'datum') { v.a = raw.a; v.b = toNum(raw.b, 30); }
  if (mode === 'dni' || mode === 'mesicu' || mode === 'pracovni-dni' || mode === 'vek') { v.a = raw.a; v.b = raw.b; }
  if (mode === 'cas') { v.a = raw.a; v.b = raw.b; }
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
  module.exports = { pridejDny: pridejDny, rozdilDni: rozdilDni, rozdilMesicu: rozdilMesicu, pracovniDny: pracovniDny, calcVek: calcVek, sectiCas: sectiCas, rozdilCas: rozdilCas, fmtDate: fmtDate, fmtCas: fmtCas, MODES: MODES };
}
