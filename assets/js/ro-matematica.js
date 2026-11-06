/* Calcotia RO — cluster Matematică și altele (16 tools).
   Pure functions + DOM binding guarded by typeof document !== 'undefined'
   + module.exports guard so Node can test it. All labels in Romanian.
   Reguli verificate 2026: pensie Legea 360/2023 — VPR 81 lei, puncte de
   stabilitate 0,50/an (26–30 ani), 0,75/an (31–35 ani), 1 pct/an (peste
   35 ani); CASS 10% pe partea peste 3.000 lei, impozit 10% după CASS.
   Concediu de odihnă art. 150 Codul muncii: indemnizația = media zilnică
   a drepturilor salariale din ultimele 3 luni × zilele de concediu;
   minimum 20 de zile lucrătoare pe an (art. 145). Factura de energie:
   TVA 21% (Cod fiscal art. 291). */
function _r2(n) { return Math.round(n * 100) / 100; }
function _parseDate(s) { if (!s) { return null; } var d = new Date(s + 'T00:00:00'); return isNaN(d.getTime()) ? null : d; }
function _addDays(d, n) { var c = new Date(d.getTime()); c.setDate(c.getDate() + n); return c; }
function _fmtDate(d) { var p = function (x) { return (x < 10 ? '0' : '') + x; }; return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear(); }
var SARBATORI = ['2026-01-01', '2026-01-02', '2026-01-06', '2026-01-07', '2026-01-24', '2026-04-10', '2026-04-12', '2026-04-13', '2026-05-01', '2026-06-01', '2026-06-07', '2026-06-08', '2026-08-15', '2026-11-30', '2026-12-01', '2026-12-25', '2026-12-26', '2027-01-01', '2027-01-02', '2027-01-06', '2027-01-07', '2027-01-24', '2027-04-30', '2027-05-02', '2027-05-03', '2027-06-01', '2027-06-20', '2027-06-21', '2027-08-15', '2027-11-30', '2027-12-01', '2027-12-25', '2027-12-26'];
function _esteZiLucratoare(d) {
  var zi = d.getDay();
  if (zi === 0 || zi === 6) { return false; }
  var iso = d.getFullYear() + '-' + (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1) + '-' + (d.getDate() < 10 ? '0' : '') + d.getDate();
  return SARBATORI.indexOf(iso) < 0;
}

function calcProcente(input) {
  var a = parseFloat(input.a) || 0; var b = parseFloat(input.b) || 0;
  if (input.mod === 'procent-din') { return { rezultat: _r2(a / 100 * b), text: a + '% din ' + b }; }
  if (input.mod === 'crestere') { return { rezultat: a === 0 ? 0 : _r2((b - a) / a * 100), text: 'variație %' }; }
  if (input.mod === 'ce-procent') { return { rezultat: b === 0 ? 0 : _r2(a / b * 100), text: 'procent' }; }
  return { rezultat: 0, text: '' };
}

function calcMedie(input) {
  var note = input.note || [];
  var suma = 0, credite = 0, sumaSimpla = 0, n = 0;
  note.forEach(function (x) {
    var nota = parseFloat(x.nota); var cr = parseFloat(x.credite) || 0;
    if (!isNaN(nota)) { suma += nota * cr; credite += cr; sumaSimpla += nota; n++; }
  });
  return { ponderata: credite > 0 ? _r2(suma / credite) : 0, simpla: n > 0 ? _r2(sumaSimpla / n) : 0 };
}

function calcZile(input) {
  var a = _parseDate(input.dataStart), b = _parseDate(input.dataEnd);
  if (!a || !b) { return { calendaristice: 0, lucratoare: 0, saptamani: 0 }; }
  if (b < a) { var t = a; a = b; b = t; }
  var cal = Math.round((b.getTime() - a.getTime()) / 86400000);
  var lucr = 0; var d = new Date(a.getTime());
  for (var i = 0; i < cal; i++) { if (_esteZiLucratoare(d)) { lucr++; } d = _addDays(d, 1); }
  return { calendaristice: cal, lucratoare: lucr, saptamani: _r2(cal / 7) };
}

function calcConsum(input) {
  var litri = Math.max(0, parseFloat(input.litri) || 0);
  var km = Math.max(0, parseFloat(input.km) || 0);
  var pret = Math.max(0, parseFloat(input.pretLitru) || 0);
  var dist = Math.max(0, parseFloat(input.distanta) || 0);
  var consum = km > 0 ? litri / km * 100 : 0;
  var costDrum = dist / 100 * consum * pret;
  return { consum100: _r2(consum), costDrum: _r2(costDrum), costKm: _r2(consum / 100 * pret) };
}

function calcReducere(input) {
  var pret = Math.max(0, parseFloat(input.pret) || 0);
  var p1 = Math.max(0, parseFloat(input.procent1) || 0);
  var p2 = Math.max(0, parseFloat(input.procent2) || 0);
  var final = pret * (1 - p1 / 100) * (1 - p2 / 100);
  return { pretFinal: _r2(final), economie: _r2(pret - final), reducereTotala: _r2((1 - final / pret) * 100) };
}

function calcMetriPatrati(input) {
  var total = 0;
  (input.camere || []).forEach(function (c) {
    var l = parseFloat(c.lungime) || 0; var w = parseFloat(c.latime) || 0;
    total += l * w;
  });
  return { suprafata: _r2(total), cuRezerva: _r2(total * 1.1) };
}

function calcRegulaTrei(input) {
  var a = parseFloat(input.a) || 0; var b = parseFloat(input.b) || 0; var c = parseFloat(input.c) || 0;
  if (a === 0) { return { x: 0 }; }
  var x = input.tip === 'inversa' ? a * b / c : b * c / a;
  return { x: _r2(x) };
}

function _cmmdc(a, b) { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b !== 0) { var t = b; b = a % b; a = t; } return a; }
function calcCmmmc(input) {
  var a = parseInt(input.a, 10) || 0; var b = parseInt(input.b, 10) || 0;
  var d = _cmmdc(a, b);
  var m = d === 0 ? 0 : Math.abs(a * b) / d;
  return { cmmdc: d, cmmmc: m };
}

function calcOre(input) {
  var h1 = parseInt(input.h1, 10) || 0; var m1 = parseInt(input.m1, 10) || 0;
  var h2 = parseInt(input.h2, 10) || 0; var m2 = parseInt(input.m2, 10) || 0;
  function fmt(totalMin) {
    var s = totalMin < 0 ? '-' : '';
    totalMin = Math.abs(totalMin);
    var h = Math.floor(totalMin / 60); var m = totalMin % 60;
    return s + h + ' h ' + (m < 10 ? '0' : '') + m + ' min';
  }
  if (input.mod === 'aduna') {
    var total = h1 * 60 + m1 + h2 * 60 + m2;
    var hh = Math.floor(total / 60) % 24; var mm = total % 60;
    return { rezultat: (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm, durata: fmt(total) };
  }
  var start = h1 * 60 + m1; var end = h2 * 60 + m2;
  var dif = end - start; if (dif < 0) { dif += 24 * 60; }
  return { rezultat: fmt(dif), durata: fmt(dif) };
}

function calcKwCp(input) {
  var v = Math.max(0, parseFloat(input.valoare) || 0);
  if (input.directie === 'cp-kw') { return { rezultat: _r2(v * 0.73549875), unitate: 'kW' }; }
  return { rezultat: _r2(v * 1.35962), unitate: 'CP' };
}

function calcPensie(input) {
  var puncte = Math.max(0, parseFloat(input.puncte) || 0);
  var ani = Math.max(0, parseFloat(input.aniStagiu) || 0);
  var stab = 0;
  if (ani > 35) { stab = 5 * 0.5 + 5 * 0.75 + (ani - 35) * 1; }
  else if (ani > 30) { stab = 5 * 0.5 + (ani - 30) * 0.75; }
  else if (ani > 25) { stab = (ani - 25) * 0.5; }
  var total = puncte + stab;
  var brut = _r2(total * 81);
  var peste = Math.max(0, brut - 3000);
  var cass = _r2(peste * 0.10);
  var impozit = _r2(Math.max(0, brut - 3000 - cass) * 0.10);
  return { puncteStabilitate: _r2(stab), totalPuncte: _r2(total), brut: brut, cass: cass, impozit: impozit, net: _r2(brut - cass - impozit) };
}

function calcConcediuOdihna(input) {
  var salariu = Math.max(0, parseFloat(input.salariuMediu) || 0);
  var zile = Math.max(0, parseInt(input.zileConcediu, 10) || 0);
  var zileLuc = Math.max(1, parseInt(input.zileLucratoare3Luni, 10) || 65);
  var mediaZilnica = _r2(salariu * 3 / zileLuc);
  return { mediaZilnica: mediaZilnica, indemnizatie: _r2(mediaZilnica * zile) };
}

function calcFacturaEnergie(input) {
  var vechi = Math.max(0, parseFloat(input.indexVechi) || 0);
  var nou = Math.max(0, parseFloat(input.indexNou) || 0);
  var pret = Math.max(0, parseFloat(input.pretKwh) || 0);
  var abon = Math.max(0, parseFloat(input.abonament) || 0);
  var consum = Math.max(0, nou - vechi);
  var energie = _r2(consum * pret + abon);
  var tva = _r2(energie * 0.21);
  return { consum: _r2(consum), energie: energie, tva: tva, total: _r2(energie + tva) };
}

function evalExpr(expr, inGrade) {
  // Evaluator de expresii: + - * / ^ ( ) sqrt() sin() cos() tan() log() ln() pi e.
  var s = String(expr || '').replace(/,/g, '.').replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
  var i = 0;
  function peek() { return s[i]; }
  function parseE() { var v = parseT(); while (peek() === '+' || peek() === '-') { var op = s[i++]; var r = parseT(); v = op === '+' ? v + r : v - r; } return v; }
  function parseT() { var v = parseF(); while (peek() === '*' || peek() === '/') { var op = s[i++]; var r = parseF(); v = op === '*' ? v * r : v / r; } return v; }
  function parseF() {
    var v = parseP();
    if (peek() === '^') { i++; var e = parseF(); v = Math.pow(v, e); }
    return v;
  }
  function parseP() {
    if (peek() === '-') { i++; return -parseP(); }
    if (peek() === '+') { i++; return parseP(); }
    if (peek() === '(') { i++; var v = parseE(); if (peek() === ')') { i++; } return v; }
    var m = s.slice(i).match(/^(sqrt|sin|cos|tan|log|ln|pi|e)/);
    if (m) {
      var fn = m[1]; i += fn.length;
      if (fn === 'pi') { return Math.PI; }
      if (fn === 'e') { return Math.E; }
      if (peek() === '(') { i++; var arg = parseE(); if (peek() === ')') { i++; }
        if (fn === 'sqrt') { return Math.sqrt(arg); }
        if (fn === 'log') { return Math.log10(arg); }
        if (fn === 'ln') { return Math.log(arg); }
        var rad = inGrade ? arg * Math.PI / 180 : arg;
        if (fn === 'sin') { return Math.sin(rad); }
        if (fn === 'cos') { return Math.cos(rad); }
        if (fn === 'tan') { return Math.tan(rad); }
      }
      throw new Error('funcție');
    }
    var nm = s.slice(i).match(/^[0-9]*\.?[0-9]+/);
    if (!nm) { throw new Error('expresie'); }
    i += nm[0].length;
    return parseFloat(nm[0]);
  }
  var v = parseE();
  if (i < s.length) { throw new Error('expresie'); }
  return v;
}
function calcStiintific(input) {
  try {
    var v = evalExpr(input.expresie, input.grade !== false);
    return { rezultat: _r2(v), eroare: null };
  } catch (e) { return { rezultat: 0, eroare: 'Expresie nevalidă. Verifică parantezele și funcțiile.' }; }
}

function _factoriPrimi(n) {
  var out = []; var d = 2;
  while (d * d <= n) { while (n % d === 0) { out.push(d); n = n / d; } d++; }
  if (n > 1) { out.push(n); }
  return out;
}
function calcRadicali(input) {
  var n = Math.max(0, parseInt(input.n, 10) || 0);
  if (n === 0) { return { a: 0, b: 0, zecimal: 0, factori: '' }; }
  var factori = _factoriPrimi(n);
  var a = 1;
  var counts = {};
  factori.forEach(function (f) { counts[f] = (counts[f] || 0) + 1; });
  Object.keys(counts).forEach(function (f) {
    var c = counts[f]; var p = Math.floor(c / 2);
    a *= Math.pow(parseInt(f, 10), p);
  });
  var b = n / (a * a);
  return { a: a, b: b, zecimal: _r2(Math.sqrt(n)), factori: factori.join(' × ') };
}

function calcVarsta(input) {
  var nastere = _parseDate(input.dataNastere); if (!nastere) { return { ani: 0, luni: 0, zile: 0, totalZile: 0, urmatoareaAniversare: '-' }; }
  var ref = _parseDate(input.dataRef) || new Date();
  if (ref < nastere) { return { ani: 0, luni: 0, zile: 0, totalZile: 0, urmatoareaAniversare: '-' }; }
  var ani = ref.getFullYear() - nastere.getFullYear();
  var luni = ref.getMonth() - nastere.getMonth();
  var zile = ref.getDate() - nastere.getDate();
  if (zile < 0) { luni--; var prev = new Date(ref.getFullYear(), ref.getMonth(), 0); zile += prev.getDate(); }
  if (luni < 0) { ani--; luni += 12; }
  var totalZile = Math.round((ref.getTime() - nastere.getTime()) / 86400000);
  var urm = new Date(ref.getFullYear(), nastere.getMonth(), nastere.getDate());
  if (urm <= ref) { urm = new Date(ref.getFullYear() + 1, nastere.getMonth(), nastere.getDate()); }
  return { ani: ani, luni: luni, zile: zile, totalZile: totalZile, urmatoareaAniversare: _fmtDate(urm) };
}

if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function num(n, d) { return new Intl.NumberFormat('ro-RO', { minimumFractionDigits: (d === undefined ? 2 : d), maximumFractionDigits: (d === undefined ? 2 : d) }).format(n); }
    function lei(n) { return num(n) + ' lei'; }
    function bind(btnId, inputIds, render) {
      var btn = el(btnId); if (btn) { btn.addEventListener('click', render); }
      inputIds.forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); } });
    }
    function setRows(id, rows) { var t = el(id); if (t) { t.innerHTML = rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join(''); } var res = el(id.replace('-rows', '-big-wrap')); if (res) { res.classList.add('show'); } }
    (function () { // Procente
      if (!el('ropro-btn')) { return; }
      function render() {
        var r = calcProcente({ mod: el('ropro-mod').value, a: el('ropro-a').value, b: el('ropro-b').value });
        var big = el('ropro-big'); if (big) { big.textContent = num(r.rezultat) + (el('ropro-mod').value === 'crestere' || el('ropro-mod').value === 'ce-procent' ? ' %' : ''); }
        setRows('ropro-rows', [['Rezultat', num(r.rezultat) + (el('ropro-mod').value === 'procent-din' ? '' : ' %')]]);
      }
      bind('ropro-btn', ['ropro-mod', 'ropro-a', 'ropro-b'], render); render();
    })();
    (function () { // Medie
      if (!el('romed-btn')) { return; }
      function render() {
        var note = [];
        for (var i = 1; i <= 5; i++) { note.push({ nota: el('romed-nota' + i).value, credite: el('romed-credite' + i).value }); }
        var r = calcMedie({ note: note });
        var big = el('romed-big'); if (big) { big.textContent = 'Media ponderată ' + num(r.ponderata); }
        setRows('romed-rows', [['Media ponderată (cu credite)', num(r.ponderata)], ['Media aritmetică simplă', num(r.simpla)]]);
      }
      bind('romed-btn', ['romed-nota1', 'romed-credite1', 'romed-nota2', 'romed-credite2', 'romed-nota3', 'romed-credite3', 'romed-nota4', 'romed-credite4', 'romed-nota5', 'romed-credite5'], render); render();
    })();
    (function () { // Zile
      if (!el('rozil-btn')) { return; }
      function render() {
        var r = calcZile({ dataStart: el('rozil-start').value, dataEnd: el('rozil-end').value });
        var big = el('rozil-big'); if (big) { big.textContent = num(r.calendaristice, 0) + ' zile'; }
        setRows('rozil-rows', [['Zile calendaristice', num(r.calendaristice, 0)], ['Zile lucrătoare', num(r.lucratoare, 0)], ['Săptămâni', num(r.saptamani)]]);
      }
      bind('rozil-btn', ['rozil-start', 'rozil-end'], render); render();
    })();
    (function () { // Consum combustibil
      if (!el('rocon-btn')) { return; }
      function render() {
        var r = calcConsum({ litri: el('rocon-litri').value, km: el('rocon-km').value, pretLitru: el('rocon-pret').value, distanta: el('rocon-distanta').value });
        var big = el('rocon-big'); if (big) { big.textContent = num(r.consum100, 1) + ' l/100 km'; }
        setRows('rocon-rows', [['Consum', num(r.consum100, 1) + ' l/100 km'], ['Costul drumului (' + (el('rocon-distanta').value || 0) + ' km)', lei(r.costDrum)], ['Cost pe kilometru', lei(r.costKm)]]);
      }
      bind('rocon-btn', ['rocon-litri', 'rocon-km', 'rocon-pret', 'rocon-distanta'], render); render();
    })();
    (function () { // Reducere
      if (!el('rored-btn')) { return; }
      function render() {
        var r = calcReducere({ pret: el('rored-pret').value, procent1: el('rored-p1').value, procent2: el('rored-p2').value });
        var big = el('rored-big'); if (big) { big.textContent = lei(r.pretFinal); }
        setRows('rored-rows', [['Preț după reducere', lei(r.pretFinal)], ['Economie', lei(r.economie)], ['Reducere totală', num(r.reducereTotala) + ' %']]);
      }
      bind('rored-btn', ['rored-pret', 'rored-p1', 'rored-p2'], render); render();
    })();
    (function () { // Metri pătrați
      if (!el('romp-btn')) { return; }
      function render() {
        var camere = [];
        for (var i = 1; i <= 3; i++) { camere.push({ lungime: el('romp-l' + i).value, latime: el('romp-w' + i).value }); }
        var r = calcMetriPatrati({ camere: camere });
        var big = el('romp-big'); if (big) { big.textContent = num(r.suprafata) + ' m²'; }
        setRows('romp-rows', [['Suprafață totală', num(r.suprafata) + ' m²'], ['Cu rezervă de 10% (parchet)', num(r.cuRezerva) + ' m²']]);
      }
      bind('romp-btn', ['romp-l1', 'romp-w1', 'romp-l2', 'romp-w2', 'romp-l3', 'romp-w3'], render); render();
    })();
    (function () { // Regula de trei
      if (!el('roreg-btn')) { return; }
      function render() {
        var r = calcRegulaTrei({ a: el('roreg-a').value, b: el('roreg-b').value, c: el('roreg-c').value, tip: el('roreg-tip').value });
        var big = el('roreg-big'); if (big) { big.textContent = num(r.x); }
        setRows('roreg-rows', [['Valoarea necunoscută (x)', num(r.x)]]);
      }
      bind('roreg-btn', ['roreg-a', 'roreg-b', 'roreg-c', 'roreg-tip'], render); render();
    })();
    (function () { // CMMMC/CMMDC
      if (!el('rocmm-btn')) { return; }
      function render() {
        var r = calcCmmmc({ a: el('rocmm-a').value, b: el('rocmm-b').value });
        var big = el('rocmm-big'); if (big) { big.textContent = 'c.m.m.d.c. ' + r.cmmdc + ' · c.m.m.m.c. ' + r.cmmmc; }
        setRows('rocmm-rows', [['Cel mai mare divizor comun', String(r.cmmdc)], ['Cel mai mic multiplu comun', String(r.cmmmc)]]);
      }
      bind('rocmm-btn', ['rocmm-a', 'rocmm-b'], render); render();
    })();
    (function () { // Ore
      if (!el('roore-btn')) { return; }
      function render() {
        var r = calcOre({ mod: el('roore-mod').value, h1: el('roore-h1').value, m1: el('roore-m1').value, h2: el('roore-h2').value, m2: el('roore-m2').value });
        var big = el('roore-big'); if (big) { big.textContent = r.rezultat; }
        setRows('roore-rows', [['Rezultat', r.rezultat], ['Durată', r.durata]]);
      }
      bind('roore-btn', ['roore-mod', 'roore-h1', 'roore-m1', 'roore-h2', 'roore-m2'], render); render();
    })();
    (function () { // kW/CP
      if (!el('rokw-btn')) { return; }
      function render() {
        var r = calcKwCp({ valoare: el('rokw-valoare').value, directie: el('rokw-dir').value });
        var big = el('rokw-big'); if (big) { big.textContent = num(r.rezultat) + ' ' + r.unitate; }
        setRows('rokw-rows', [['Rezultat', num(r.rezultat) + ' ' + r.unitate]]);
      }
      bind('rokw-btn', ['rokw-valoare', 'rokw-dir'], render); render();
    })();
    (function () { // Pensie
      if (!el('ropen-btn')) { return; }
      function render() {
        var r = calcPensie({ puncte: el('ropen-puncte').value, aniStagiu: el('ropen-ani').value });
        var big = el('ropen-big'); if (big) { big.textContent = lei(r.net) + '/lună'; }
        setRows('ropen-rows', [['Puncte de stabilitate', num(r.puncteStabilitate)], ['Total puncte', num(r.totalPuncte)], ['Pensie brută', lei(r.brut)], ['CASS 10% (peste 3.000 lei)', lei(r.cass)], ['Impozit 10%', lei(r.impozit)], ['Pensie netă', lei(r.net)]]);
      }
      bind('ropen-btn', ['ropen-puncte', 'ropen-ani'], render); render();
    })();
    (function () { // Concediu de odihnă
      if (!el('roco-btn')) { return; }
      function render() {
        var r = calcConcediuOdihna({ salariuMediu: el('roco-salariu').value, zileConcediu: el('roco-zile').value, zileLucratoare3Luni: el('roco-zileluc').value });
        var big = el('roco-big'); if (big) { big.textContent = lei(r.indemnizatie); }
        setRows('roco-rows', [['Media zilnică', lei(r.mediaZilnica)], ['Indemnizația de concediu', lei(r.indemnizatie)]]);
      }
      bind('roco-btn', ['roco-salariu', 'roco-zile', 'roco-zileluc'], render); render();
    })();
    (function () { // Factură energie
      if (!el('rofe-btn')) { return; }
      function render() {
        var r = calcFacturaEnergie({ indexVechi: el('rofe-vechi').value, indexNou: el('rofe-nou').value, pretKwh: el('rofe-pret').value, abonament: el('rofe-abonament').value });
        var big = el('rofe-big'); if (big) { big.textContent = lei(r.total); }
        setRows('rofe-rows', [['Consum', num(r.consum, 0) + ' kWh'], ['Energie + abonament', lei(r.energie)], ['TVA 21%', lei(r.tva)], ['Total de plată', lei(r.total)]]);
      }
      bind('rofe-btn', ['rofe-vechi', 'rofe-nou', 'rofe-pret', 'rofe-abonament'], render); render();
    })();
    (function () { // Științific
      if (!el('rosti-btn')) { return; }
      function render() {
        var r = calcStiintific({ expresie: el('rosti-expr').value, grade: el('rosti-grade').value === 'grade' });
        var big = el('rosti-big'); if (big) { big.textContent = r.eroare ? r.eroare : num(r.rezultat, 6); }
        setRows('rosti-rows', [['Rezultat', r.eroare ? r.eroare : num(r.rezultat, 6)]]);
      }
      bind('rosti-btn', ['rosti-expr', 'rosti-grade'], render); render();
    })();
    (function () { // Radicali
      if (!el('rorad-btn')) { return; }
      function render() {
        var r = calcRadicali({ n: el('rorad-n').value });
        var big = el('rorad-big'); if (big) { big.textContent = r.b === 1 ? String(r.a) : r.a + '√' + r.b + ' ≈ ' + num(r.zecimal); }
        setRows('rorad-rows', [['Formă simplificată', r.b === 1 ? String(r.a) : r.a + '√' + r.b], ['Valoare zecimală', num(r.zecimal)], ['Factori primi', r.factori]]);
      }
      bind('rorad-btn', ['rorad-n'], render); render();
    })();
    (function () { // Vârstă
      if (!el('rovar-btn')) { return; }
      function render() {
        var r = calcVarsta({ dataNastere: el('rovar-nastere').value, dataRef: el('rovar-ref').value });
        var big = el('rovar-big'); if (big) { big.textContent = r.ani + ' ani, ' + r.luni + ' luni, ' + r.zile + ' zile'; }
        setRows('rovar-rows', [['Vârsta exactă', r.ani + ' ani, ' + r.luni + ' luni, ' + r.zile + ' zile'], ['Total zile trăite', num(r.totalZile, 0) + ' zile'], ['Următoarea aniversare', r.urmatoareaAniversare]]);
      }
      bind('rovar-btn', ['rovar-nastere', 'rovar-ref'], render); render();
    })();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcProcente: calcProcente, calcMedie: calcMedie, calcZile: calcZile, calcConsum: calcConsum, calcReducere: calcReducere, calcMetriPatrati: calcMetriPatrati, calcRegulaTrei: calcRegulaTrei, calcCmmmc: calcCmmmc, calcOre: calcOre, calcKwCp: calcKwCp, calcPensie: calcPensie, calcConcediuOdihna: calcConcediuOdihna, calcFacturaEnergie: calcFacturaEnergie, calcStiintific: calcStiintific, calcRadicali: calcRadicali, calcVarsta: calcVarsta, evalExpr: evalExpr }; }
