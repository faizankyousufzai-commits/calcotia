'use strict';
/* cz-math.js — shared engine for CZ maths tools (Calcilo implant, 2026-11-06).
   Pure functions + DOM binding + module.exports guard so Node can test it. */
function fmt(n, d) {
  if (d === undefined) d = 2;
  if (n === null || n === undefined || isNaN(n)) return '–';
  return n.toLocaleString('cs-CZ', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmt0(n) { return fmt(n, 0); }
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; }
function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }
function fce(nazev, x) {
  if (nazev === 'x2') return x * x;
  if (nazev === 'x3') return x * x * x;
  if (nazev === 'sin') return Math.sin(x);
  if (nazev === 'exp') return Math.exp(x);
  return x * x;
}
function calcDerivace(nazev, x) { var h = 0.0001; return (fce(nazev, x + h) - fce(nazev, x - h)) / (2 * h); }
function calcIntegral(nazev, a, b) {
  var n = 1000; var h = (b - a) / n; var s = fce(nazev, a) + fce(nazev, b);
  for (var i = 1; i < n; i++) s += (i % 2 === 0 ? 2 : 4) * fce(nazev, a + i * h);
  return s * h / 3;
}
function calcLogaritmus(hodnota, zaklad) { return Math.log(hodnota) / Math.log(zaklad); }
function calcMeritko(skutecnostCm, meritko) { return skutecnostCm / meritko; }
function calcMocnina(zaklad, exponent) { return Math.pow(zaklad, exponent); }
function calcOdmocnina(hodnota, n) { return Math.pow(hodnota, 1 / n); }
function calcObjem(tvar, a, b, c) {
  if (tvar === 'krychle') return a * a * a;
  if (tvar === 'kvadr') return a * b * c;
  if (tvar === 'valec') return Math.PI * a * a * b;
  if (tvar === 'koule') return 4 / 3 * Math.PI * Math.pow(a, 3);
  if (tvar === 'kuzel') return Math.PI * a * a * b / 3;
  return 0;
}
function calcObvodKruhu(polomer) { return { obvod: 2 * Math.PI * polomer, obsah: Math.PI * polomer * polomer }; }
function calcPlocha(tvar, a, b) {
  if (tvar === 'ctverec') return a * a;
  if (tvar === 'obdelnik') return a * b;
  if (tvar === 'kruh') return Math.PI * a * a;
  if (tvar === 'trojuhelnik') return a * b / 2;
  if (tvar === 'lichobeznik') return (a + b) / 2 * 0 + (a + b) * 0; // nepoužívá se; viz MODES
  return 0;
}
function calcPrevodJednotek(hodnota, z, na) {
  var m = { mm: 0.001, cm: 0.01, m: 1, km: 1000, mile: 1609.34 };
  return hodnota * m[z] / m[na];
}
function parseSeznam(s) { return String(s).split(/[;,\s]+/).filter(function (x) { return x !== ''; }).map(function (x) { return parseFloat(x.replace(',', '.')); }).filter(function (x) { return !isNaN(x); }); }
function calcPrumer(seznam) {
  var arr = seznam.slice().sort(function (x, y) { return x - y; });
  var soucet = arr.reduce(function (s, x) { return s + x; }, 0);
  var prum = soucet / arr.length;
  var med = arr.length % 2 ? arr[(arr.length - 1) / 2] : (arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2;
  var cet = {}; var modus = arr[0]; var max = 0;
  arr.forEach(function (x) { cet[x] = (cet[x] || 0) + 1; if (cet[x] > max) { max = cet[x]; modus = x; } });
  return { prumer: prum, median: med, modus: modus, soucet: soucet, pocet: arr.length };
}
function calcRovnice(a, b, c) {
  if (a === 0) return { typ: 'linearni', koren: -c / b };
  var d = b * b - 4 * a * c;
  if (d > 0) return { typ: 'dva', d: d, x1: (-b + Math.sqrt(d)) / (2 * a), x2: (-b - Math.sqrt(d)) / (2 * a) };
  if (d === 0) return { typ: 'dvojnasobny', d: d, x1: -b / (2 * a), x2: -b / (2 * a) };
  return { typ: 'komplexni', d: d, real: -b / (2 * a), imag: Math.sqrt(-d) / (2 * a) };
}
function calcRychlost(vzdalenostKm, casHod, rychlostKmh) {
  if (vzdalenostKm && casHod) return { rychlost: vzdalenostKm / casHod };
  if (vzdalenostKm && rychlostKmh) return { cas: vzdalenostKm / rychlostKmh };
  if (casHod && rychlostKmh) return { vzdalenost: rychlostKmh * casHod };
  return {};
}
function calcSoustava(a1, b1, c1, a2, b2, c2) {
  var det = a1 * b2 - a2 * b1;
  if (det === 0) return { resitelna: false };
  return { resitelna: true, x: (c1 * b2 - c2 * b1) / det, y: (a1 * c2 - a2 * c1) / det };
}
function calcTrojclenka(a, b, c, neprima) {
  return neprima ? a * b / c : b * c / a;
}
function calcTrojuhelnik(a, b, c) {
  var s = (a + b + c) / 2;
  var obsah = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
  return { obvod: a + b + c, obsah: obsah };
}
function calcVazenyPrumer(hodnoty, vahy) {
  var sv = 0, s = 0;
  for (var i = 0; i < hodnoty.length; i++) { sv += hodnoty[i] * (vahy[i] || 1); s += (vahy[i] || 1); }
  return sv / s;
}
function calcZlomek(a, b, c, d, op) {
  var cit, jmen;
  if (op === '+') { cit = a * d + c * b; jmen = b * d; }
  else if (op === '-') { cit = a * d - c * b; jmen = b * d; }
  else if (op === '*') { cit = a * c; jmen = b * d; }
  else { cit = a * d; jmen = b * c; }
  var g = gcd(cit, jmen);
  return { cit: cit / g, jmen: jmen / g, desetinne: cit / jmen };
}
function calcMatice2x2(a, b, c, d) {
  var det = a * d - b * c;
  if (det === 0) return { invertovatelna: false, det: 0 };
  return { invertovatelna: true, det: det, inv: [[d / det, -b / det], [-c / det, a / det]] };
}
function calcPythagoras(a, b) { return Math.sqrt(a * a + b * b); }

var MODES = {
  'derivace': function (v) { var r = calcDerivace(v.s1, v.a); return { big: "f'(" + fmt(v.a) + ') = ' + fmt(r, 4), rows: [['Numerická derivace', fmt(r, 4)], ['Funkce', v.s1], ['Bod x', fmt(v.a)]], note: 'Numerická derivace centrální diferencí; přesná derivace se počítá analyticky.' }; },
  'integral': function (v) { var r = calcIntegral(v.s1, v.a, v.b); return { big: '∫ = ' + fmt(r, 4), rows: [['Určitý integrál', fmt(r, 4)], ['Od', fmt(v.a)], ['Do', fmt(v.b)]], note: 'Simpsonova metoda s 1000 díly; přesná hodnota se počítá primitivní funkcí.' }; },
  'logaritmus': function (v) { var r = calcLogaritmus(v.a, v.b); return { big: 'log = ' + fmt(r, 4), rows: [['Logaritmus', fmt(r, 4)], ['Hodnota', fmt0(v.a)], ['Základ', fmt0(v.b)]], note: 'Logaritmus o základu b z čísla x je exponent, na který musíme umocnit b, abychom dostali x.' }; },
  'meritko': function (v) { var r = calcMeritko(v.a, v.b); return { big: fmt(r, 1) + ' cm na plánu', rows: [['Rozměr na plánu', fmt(r, 1) + ' cm'], ['Skutečnost', fmt0(v.a) + ' cm'], ['Měřítko', '1 : ' + fmt0(v.b)]], note: 'Rozměr na plánu = skutečný rozměr dělený měřítkem.' }; },
  'mocniny': function (v) { var r = calcMocnina(v.a, v.b); return { big: fmt(v.a) + '^' + fmt(v.b) + ' = ' + fmt(r), rows: [['Mocnina', fmt(r)], ['Základ', fmt(v.a)], ['Exponent', fmt(v.b)]], note: 'Mocnina je opakované násobení základu sama sebou.' }; },
  'nsd': function (v) { var g = gcd(v.a, v.b); var l = lcm(v.a, v.b); return { big: 'NSD = ' + fmt0(g), rows: [['Největší společný dělitel', fmt0(g)], ['Nejmenší společný násobek', fmt0(l)]], note: 'NSD se počítá Euklidovým algoritmem.' }; },
  'nsn': function (v) { var l = lcm(v.a, v.b); var g = gcd(v.a, v.b); return { big: 'NSN = ' + fmt0(l), rows: [['Nejmenší společný násobek', fmt0(l)], ['Největší společný dělitel', fmt0(g)]], note: 'NSN = součin čísel dělený jejich NSD.' }; },
  'objem': function (v) { var r = calcObjem(v.s1, v.a, v.b, v.c); return { big: fmt(r, 2) + ' jednotek³', rows: [['Objem', fmt(r, 2)]], note: 'Objem se počítá podle vzorce pro zvolené těleso.' }; },
  'obvod-kruhu': function (v) { var r = calcObvodKruhu(v.a); return { big: 'obvod ' + fmt(r.obvod, 2), rows: [['Obvod kruhu', fmt(r.obvod, 2)], ['Obsah kruhu', fmt(r.obsah, 2)], ['Průměr', fmt(2 * v.a, 2)]], note: 'Obvod = 2πr, obsah = πr².' }; },
  'odmocnina': function (v) { var r = calcOdmocnina(v.a, v.b); return { big: fmt(r, 4), rows: [['Odmocnina', fmt(r, 4)], ['Hodnota', fmt0(v.a)], ['Stupeň', fmt0(v.b)]], note: 'N-tá odmocnina z x je číslo, které umocněné na n dává x.' }; },
  'plocha': function (v) { var r = v.s1 === 'lichobeznik' ? (v.a + v.b) / 2 * v.c : calcPlocha(v.s1, v.a, v.b); return { big: fmt(r, 2) + ' jednotek²', rows: [['Obsah', fmt(r, 2)]], note: 'Obsah se počítá podle vzorce pro zvolený útvar.' }; },
  'prevod-jednotek': function (v) { var r = calcPrevodJednotek(v.a, v.s1, v.s2); return { big: fmt(v.a) + ' ' + v.s1 + ' = ' + fmt(r, 4) + ' ' + v.s2, rows: [['Převod', fmt(r, 4) + ' ' + v.s2]], note: 'Převod jednotek délky přes metry.' }; },
  'prumer': function (v) { var arr = parseSeznam(v.a); var r = calcPrumer(arr); return { big: 'průměr ' + fmt(r.prumer, 2), rows: [['Aritmetický průměr', fmt(r.prumer, 2)], ['Medián', fmt(r.median, 2)], ['Modus', fmt(r.modus, 2)], ['Součet', fmt(r.soucet, 2)], ['Počet hodnot', fmt0(r.pocet)]], note: 'Čísla oddělte čárkou nebo mezerou.' }; },
  'rovnice': function (v) { var r = calcRovnice(v.a, v.b, v.c); var rows = [['Diskriminant', fmt(r.d, 2)]]; var big; if (r.typ === 'dva') { big = 'x₁ = ' + fmt(r.x1, 2) + ', x₂ = ' + fmt(r.x2, 2); rows.push(['Kořen x₁', fmt(r.x1, 2)], ['Kořen x₂', fmt(r.x2, 2)]); } else if (r.typ === 'dvojnasobny') { big = 'x = ' + fmt(r.x1, 2) + ' (dvojnásobný)'; rows.push(['Kořen', fmt(r.x1, 2)]); } else if (r.typ === 'linearni') { big = 'x = ' + fmt(r.koren, 2); rows.push(['Kořen', fmt(r.koren, 2)]); } else { big = 'x = ' + fmt(r.real, 2) + ' ± ' + fmt(r.imag, 2) + 'i'; rows.push(['Reálná část', fmt(r.real, 2)], ['Imaginární část', fmt(r.imag, 2)]); } return { big: big, rows: rows, note: 'Diskriminant D = b² − 4ac rozhoduje o počtu reálných kořenů.' }; },
  'rychlost': function (v) { var r = calcRychlost(v.a, v.b, v.c); if (r.rychlost) return { big: fmt(r.rychlost, 1) + ' km/h', rows: [['Rychlost', fmt(r.rychlost, 1) + ' km/h']], note: 'Rychlost = vzdálenost / čas.' }; if (r.cas) return { big: fmt(r.cas, 2) + ' h', rows: [['Čas', fmt(r.cas, 2) + ' h']], note: 'Čas = vzdálenost / rychlost.' }; return { big: fmt(r.vzdalenost, 2) + ' km', rows: [['Vzdálenost', fmt(r.vzdalenost, 2) + ' km']], note: 'Vzdálenost = rychlost × čas.' }; },
  'soustava-rovnic': function (v) { var r = calcSoustava(v.a, v.b, v.c, v.d, v.e, v.f); if (!r.resitelna) return { big: 'soustava nemá jediné řešení', rows: [['Determinant', '0']], note: 'Determinant je nula: rovnice jsou závislé nebo protichůdné.' }; return { big: 'x = ' + fmt(r.x, 2) + ', y = ' + fmt(r.y, 2), rows: [['x', fmt(r.x, 2)], ['y', fmt(r.y, 2)]], note: 'Řešení Cramerovým pravidlem.' }; },
  'trojclenka': function (v) { var nepr = v.s1 === 'neprima'; var r = calcTrojclenka(v.a, v.b, v.c, nepr); return { big: 'x = ' + fmt(r, 2), rows: [['Výsledek', fmt(r, 2)], ['Úměrnost', nepr ? 'nepřímá' : 'přímá']], note: nepr ? 'Nepřímá úměrnost: čím víc jednoho, tím míň druhého.' : 'Přímá úměrnost: kolikrát víc jednoho, tolikrát víc druhého.' }; },
  'trojuhelnik': function (v) { var r = calcTrojuhelnik(v.a, v.b, v.c); return { big: 'obsah ' + fmt(r.obsah, 2), rows: [['Obsah (Heron)', fmt(r.obsah, 2)], ['Obvod', fmt(r.obvod, 2)]], note: 'Obsah se počítá Heronovým vzorcem ze tří stran.' }; },
  'vazeny-prumer': function (v) { var h = parseSeznam(v.a); var w = parseSeznam(v.b); var r = calcVazenyPrumer(h, w); return { big: 'vážený průměr ' + fmt(r, 2), rows: [['Vážený průměr', fmt(r, 2)]], note: 'Vážený průměr = součet (hodnota × váha) dělený součtem vah.' }; },
  'zlomky': function (v) { var r = calcZlomek(v.a, v.b, v.c, v.d, v.s1); return { big: fmt0(r.cit) + '/' + fmt0(r.jmen) + ' = ' + fmt(r.desetinne, 4), rows: [['Výsledek (zkráceně)', fmt0(r.cit) + '/' + fmt0(r.jmen)], ['Desetinné číslo', fmt(r.desetinne, 4)]], note: 'Zlomek se po výpočtu zkrátí největším společným dělitelem.' }; },
  'matice': function (v) { var r = calcMatice2x2(v.a, v.b, v.c, v.d); if (!r.invertovatelna) return { big: 'matice není invertovatelná', rows: [['Determinant', '0']], note: 'Determinant je nula, takže inverzní matice neexistuje.' }; return { big: 'det = ' + fmt(r.det, 2), rows: [['Determinant', fmt(r.det, 2)], ['Inverzní matice', '[[' + fmt(r.inv[0][0], 2) + ', ' + fmt(r.inv[0][1], 2) + '], [' + fmt(r.inv[1][0], 2) + ', ' + fmt(r.inv[1][1], 2) + ']]']], note: 'Inverzní matice 2×2: [[d, −b], [−c, a]] / determinant.' }; },
  'pythagoras': function (v) { var r = calcPythagoras(v.a, v.b); return { big: 'c = ' + fmt(r, 2), rows: [['Přepona', fmt(r, 2)], ['Odvěsna a', fmt(v.a, 2)], ['Odvěsna b', fmt(v.b, 2)]], note: 'Pythagorova věta: a² + b² = c².' }; }
};

function readInputs() {
  function g(id) { var el = document.getElementById(id); return el ? el.value : ''; }
  return { a: g('cz-a'), b: g('cz-b'), c: g('cz-c'), d: g('cz-d'), e: g('cz-e'), f: g('cz-f'), s1: g('cz-s1'), s2: g('cz-s2') };
}
function toNum(x, def) { var n = parseFloat(String(x).replace(',', '.')); return isNaN(n) ? def : n; }
function run() {
  var calc = document.querySelector('.calc[data-calc]');
  if (!calc) return;
  var mode = calc.getAttribute('data-calc');
  var fn = MODES[mode];
  if (!fn) return;
  var raw = readInputs();
  var v = { a: raw.a, b: toNum(raw.b, 0), c: toNum(raw.c, 0), d: toNum(raw.d, 0), e: toNum(raw.e, 0), f: toNum(raw.f, 0), s1: raw.s1, s2: raw.s2 };
  if (mode === 'prumer' || mode === 'vazeny-prumer') { v.a = raw.a; v.b = raw.b; }
  if (mode === 'soustava-rovnic') { v.c = toNum(raw.c, 0); }
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
  module.exports = { gcd: gcd, lcm: lcm, calcDerivace: calcDerivace, calcIntegral: calcIntegral, calcLogaritmus: calcLogaritmus, calcMeritko: calcMeritko, calcMocnina: calcMocnina, calcOdmocnina: calcOdmocnina, calcObjem: calcObjem, calcObvodKruhu: calcObvodKruhu, calcPlocha: calcPlocha, calcPrevodJednotek: calcPrevodJednotek, calcPrumer: calcPrumer, calcRovnice: calcRovnice, calcRychlost: calcRychlost, calcSoustava: calcSoustava, calcTrojclenka: calcTrojclenka, calcTrojuhelnik: calcTrojuhelnik, calcVazenyPrumer: calcVazenyPrumer, calcZlomek: calcZlomek, calcMatice2x2: calcMatice2x2, calcPythagoras: calcPythagoras, parseSeznam: parseSeznam, MODES: MODES };
}
