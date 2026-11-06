/* Calcotia RO — cluster Muncă și salarii (5 tools).
   Pure functions + DOM binding guarded by typeof document !== 'undefined'
   + module.exports guard so Node can test it. All labels in Romanian.
   Reguli verificate 2026: șomaj Legea 76/2002 — 75% din ISR (660 lei) =
   495 lei + 3%/5%/7%/10% din media brută pe 12 luni după stagiu;
   durată 6/9/12 luni; CASS 10% reținută. PFA: CAS 25% pe plafon 12/24
   salarii minime (48.600/97.200 lei, referință 4.050 lei), CASS 10% pe
   venitul net efectiv (plafon 24.300–291.600 lei), impozit 10%.
   Indemnizație creștere copil OUG 111/2010: 85% din venitul net mediu,
   minim 1.651 lei, maxim 8.500 lei, +50% per copil la nașteri multiple,
   CASS 10% reținută. Concediu medical OUG 158/2005 + Legea 141/2025 +
   OUG 91/2025: 55% (≤7 zile), 65% (8–14 zile), 75% (de la 15 zile);
   prima zi a episodului neplătită (certificate 1 feb 2026–31 dec 2027);
   baza = media veniturilor brute din ultimele 6 luni, plafon 12 salarii
   minime/lună; angajatorul plătește primele 5 zile indemnizabile, FNUASS
   restul. */
function _r2(n) { return Math.round(n * 100) / 100; }
function _parseDate(s) { if (!s) { return null; } var d = new Date(s + 'T00:00:00'); return isNaN(d.getTime()) ? null : d; }
function _daysBetween(a, b) { return Math.round((b.getTime() - a.getTime()) / 86400000) + 1; }

function calcVechime(input) {
  var totalZile = 0;
  (input.perioade || []).forEach(function (p) {
    var a = _parseDate(p.start), b = _parseDate(p.end);
    if (a && b && b >= a) { totalZile += _daysBetween(a, b); }
  });
  var ani = Math.floor(totalZile / 365);
  var rest = totalZile - ani * 365;
  var luni = Math.floor(rest / 30);
  var zile = rest - luni * 30;
  return { totalZile: totalZile, ani: ani, luni: luni, zile: zile };
}

function calcPFA(input) {
  var venit = Math.max(0, parseFloat(input.venitNet) || 0);
  var cas = venit < 48600 ? 0 : venit < 97200 ? 12150 : 24300;
  var cass = venit < 24300 ? 0 : _r2(0.10 * Math.min(venit, 291600));
  var bazaImpozit = Math.max(0, venit - cas - cass);
  var impozit = _r2(bazaImpozit * 0.10);
  var total = _r2(cas + cass + impozit);
  return { cas: cas, cass: cass, impozit: impozit, totalTaxe: total, net: _r2(venit - total) };
}

function calcSomaj(input) {
  var stagiu = Math.max(0, parseFloat(input.stagiuAni) || 0);
  var brut = Math.max(0, parseFloat(input.mediaBruta12) || 0);
  var fixa = 495;
  var coef = stagiu < 3 ? 0 : stagiu < 5 ? 0.03 : stagiu < 10 ? 0.05 : stagiu < 15 ? 0.07 : 0.10;
  var variabila = _r2(brut * coef);
  var brutInd = _r2(fixa + variabila);
  var cass = _r2(brutInd * 0.10);
  var durata = stagiu < 5 ? 6 : stagiu <= 10 ? 9 : 12;
  return { fixa: fixa, variabila: variabila, brut: brutInd, cass: cass, net: _r2(brutInd - cass), durataLuni: durata, coefPct: coef * 100 };
}

function calcIndemnizatieCopil(input) {
  var venit = Math.max(0, parseFloat(input.venitNetMediu) || 0);
  var copii = Math.max(1, parseInt(input.copii, 10) || 1);
  var baza = venit * 0.85;
  var brut = Math.min(8500, Math.max(1651, baza));
  if (copii > 1) { brut = Math.min(8500, brut * (1 + 0.5 * (copii - 1))); }
  brut = _r2(brut);
  var cass = _r2(brut * 0.10);
  return { brut: brut, cass: cass, net: _r2(brut - cass), minim: 1651, maxim: 8500 };
}

function calcConcediuMedical(input) {
  var baza = Math.max(0, parseFloat(input.bazaLunara) || 0);
  var zile = Math.max(0, parseInt(input.zileEpisod, 10) || 0);
  var zileLuc = Math.max(1, parseInt(input.zileLucratoare6Luni, 10) || 132);
  var procent = zile <= 7 ? 55 : zile <= 14 ? 65 : 75;
  var mediaZilnica = _r2(baza * 6 / zileLuc);
  var zilePlatite = Math.max(0, zile - 1); // prima zi a episodului neplătită (OUG 91/2025)
  var indemnizatie = _r2(mediaZilnica * procent / 100 * zilePlatite);
  var zileAngajator = Math.min(5, zilePlatite);
  var platitAngajator = _r2(mediaZilnica * procent / 100 * zileAngajator);
  var platitFnuass = _r2(indemnizatie - platitAngajator);
  return { procent: procent, mediaZilnica: mediaZilnica, zilePlatite: zilePlatite, indemnizatie: indemnizatie, angajator: platitAngajator, fnuass: platitFnuass };
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
    function setRows(id, rows) { var t = el(id); if (t) { t.innerHTML = rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join(''); } }
    (function () { // Vechime
      if (!el('rovec-btn')) { return; }
      function render() {
        var per = [];
        for (var i = 1; i <= 3; i++) { per.push({ start: el('rovec-start' + i).value, end: el('rovec-end' + i).value }); }
        var r = calcVechime({ perioade: per });
        var big = el('rovec-big'); if (big) { big.textContent = r.ani + ' ani, ' + r.luni + ' luni, ' + r.zile + ' zile'; }
        setRows('rovec-rows', [['Vechime totală', r.ani + ' ani, ' + r.luni + ' luni, ' + r.zile + ' zile'], ['Total zile lucrate', num(r.totalZile, 0) + ' zile']]);
      }
      bind('rovec-btn', ['rovec-start1', 'rovec-end1', 'rovec-start2', 'rovec-end2', 'rovec-start3', 'rovec-end3'], render); render();
    })();
    (function () { // PFA
      if (!el('ropfa-btn')) { return; }
      function render() {
        var r = calcPFA({ venitNet: el('ropfa-venit').value });
        var big = el('ropfa-big'); if (big) { big.textContent = lei(r.net); }
        setRows('ropfa-rows', [['CAS 25%', lei(r.cas)], ['CASS 10%', lei(r.cass)], ['Impozit 10%', lei(r.impozit)], ['Total taxe și contribuții', lei(r.totalTaxe)], ['Rămâne net', lei(r.net)]]);
      }
      bind('ropfa-btn', ['ropfa-venit'], render); render();
    })();
    (function () { // Șomaj
      if (!el('rosom-btn')) { return; }
      function render() {
        var r = calcSomaj({ stagiuAni: el('rosom-stagiu').value, mediaBruta12: el('rosom-brut').value });
        var big = el('rosom-big'); if (big) { big.textContent = lei(r.net) + '/lună'; }
        setRows('rosom-rows', [['Partea fixă (75% din ISR)', lei(r.fixa)], ['Partea variabilă (' + num(r.coefPct, 0) + '%)', lei(r.variabila)], ['Indemnizație brută', lei(r.brut)], ['CASS 10% reținută', lei(r.cass)], ['Indemnizație netă', lei(r.net)], ['Durata', String(r.durataLuni) + ' luni']]);
      }
      bind('rosom-btn', ['rosom-stagiu', 'rosom-brut'], render); render();
    })();
    (function () { // Indemnizație creștere copil
      if (!el('roind-btn')) { return; }
      function render() {
        var r = calcIndemnizatieCopil({ venitNetMediu: el('roind-venit').value, copii: el('roind-copii').value });
        var big = el('roind-big'); if (big) { big.textContent = lei(r.net) + '/lună'; }
        setRows('roind-rows', [['Indemnizație brută (85%)', lei(r.brut)], ['CASS 10% reținută', lei(r.cass)], ['Indemnizație netă', lei(r.net)], ['Limite legale', lei(r.minim) + ' – ' + lei(r.maxim)]]);
      }
      bind('roind-btn', ['roind-venit', 'roind-copii'], render); render();
    })();
    (function () { // Concediu medical
      if (!el('rocm-btn')) { return; }
      function render() {
        var r = calcConcediuMedical({ bazaLunara: el('rocm-baza').value, zileEpisod: el('rocm-zile').value, zileLucratoare6Luni: el('rocm-zileluc').value });
        var big = el('rocm-big'); if (big) { big.textContent = lei(r.indemnizatie); }
        setRows('rocm-rows', [['Procent aplicat', String(r.procent) + '% din baza de calcul'], ['Media zilnică', lei(r.mediaZilnica)], ['Zile plătite (din ' + el('rocm-zile').value + ', minus prima zi)', String(r.zilePlatite)], ['Plătește angajatorul', lei(r.angajator)], ['Plătește FNUASS', lei(r.fnuass)], ['Indemnizație totală', lei(r.indemnizatie)]]);
      }
      bind('rocm-btn', ['rocm-baza', 'rocm-zile', 'rocm-zileluc'], render); render();
    })();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcVechime: calcVechime, calcPFA: calcPFA, calcSomaj: calcSomaj, calcIndemnizatieCopil: calcIndemnizatieCopil, calcConcediuMedical: calcConcediuMedical }; }
