/* Calcotia RO — cluster Sănătate (7 tools).
   Pure functions + DOM binding guarded by typeof document !== 'undefined'
   + module.exports guard so Node can test it. All labels in Romanian.
   Formule: IMC (OMS); calorii Mifflin-St Jeor; sarcină regula lui Naegele
   (DPN = ultima menstruație + 280 zile); ovulație = LMP + ciclu − 14 zile;
   alcoolemie formula Widmark (r = 0,68 bărbați / 0,55 femei, eliminare
   0,15 g/l/oră, 1 g/l sânge ≈ 0,5 mg/l aer expirat); tensiune după
   ghidul ESH 2023. */
function _r2(n) { return Math.round(n * 100) / 100; }
function _parseDate(s) { if (!s) { return null; } var d = new Date(s + 'T00:00:00'); return isNaN(d.getTime()) ? null : d; }
function _addDays(d, n) { var c = new Date(d.getTime()); c.setDate(c.getDate() + n); return c; }
function _fmtDate(d) { var p = function (x) { return (x < 10 ? '0' : '') + x; }; return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear(); }
function _daysBetween(a, b) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

function calcIMC(input) {
  var g = Math.max(0, parseFloat(input.greutateKg) || 0);
  var h = Math.max(0, parseFloat(input.inaltimeCm) || 0) / 100;
  if (h <= 0 || g <= 0) { return { imc: 0, categorie: '-', greutateMin: 0, greutateMax: 0 }; }
  var imc = g / (h * h);
  var cat = imc < 18.5 ? 'Subponderal' : imc < 25 ? 'Greutate normală' : imc < 30 ? 'Supraponderal' : imc < 35 ? 'Obezitate gradul I' : imc < 40 ? 'Obezitate gradul II' : 'Obezitate gradul III';
  return { imc: _r2(imc), categorie: cat, greutateMin: _r2(18.5 * h * h), greutateMax: _r2(24.9 * h * h) };
}

function calcCalorii(input) {
  var g = Math.max(0, parseFloat(input.greutateKg) || 0);
  var h = Math.max(0, parseFloat(input.inaltimeCm) || 0);
  var v = Math.max(0, parseFloat(input.varsta) || 0);
  var bmr = input.sex === 'barbat' ? 10 * g + 6.25 * h - 5 * v + 5 : 10 * g + 6.25 * h - 5 * v - 161;
  var f = { sedentar: 1.2, usoara: 1.375, moderata: 1.55, activa: 1.725, foarteActiva: 1.9 }[input.activitate] || 1.55;
  return { bmr: Math.round(bmr), tdee: Math.round(bmr * f), factor: f };
}

function calcSarcina(input) {
  var lmp = _parseDate(input.ultimaMenstruatie); if (!lmp) { return { dpn: '-', saptamana: 0, zi: 0, trimestru: 0 }; }
  var azi = _parseDate(input.azi) || new Date();
  var dpn = _addDays(lmp, 280);
  var zile = _daysBetween(lmp, azi);
  var sapt = Math.max(0, Math.floor(zile / 7));
  var zi = Math.max(0, zile % 7);
  var trim = sapt < 14 ? 1 : sapt < 28 ? 2 : 3;
  return { dpn: _fmtDate(dpn), saptamana: sapt, zi: zi, trimestru: trim };
}

function calcOvulatie(input) {
  var lmp = _parseDate(input.ultimaMenstruatie); if (!lmp) { return { ovulatie: '-', fertilStart: '-', fertilEnd: '-', test: '-' }; }
  var ciclu = parseInt(input.durataCiclu, 10) || 28;
  var ov = _addDays(lmp, ciclu - 14);
  return { ovulatie: _fmtDate(ov), fertilStart: _fmtDate(_addDays(ov, -5)), fertilEnd: _fmtDate(_addDays(ov, 1)), test: _fmtDate(_addDays(ov, 14)) };
}

function calcMenstruatie(input) {
  var lmp = _parseDate(input.ultimaMenstruatie); if (!lmp) { return { urmatoarele: [] }; }
  var ciclu = parseInt(input.durataCiclu, 10) || 28;
  var out = []; var d = new Date(lmp.getTime());
  for (var i = 0; i < 6; i++) { d = _addDays(d, ciclu); out.push(_fmtDate(d)); }
  return { urmatoarele: out };
}

function calcAlcoolemie(input) {
  var g = Math.max(0, parseFloat(input.greutateKg) || 0);
  var ml = Math.max(0, parseFloat(input.volumMl) || 0) * Math.max(0, parseFloat(input.numarBauturi) || 0);
  var proc = Math.max(0, parseFloat(input.concentratiePct) || 0);
  var ore = Math.max(0, parseFloat(input.oreDeLaConsum) || 0);
  var grame = ml * proc / 100 * 0.789;
  var r = input.sex === 'barbat' ? 0.68 : 0.55;
  var bac = g > 0 ? Math.max(0, grame / (g * r) - 0.15 * ore) : 0;
  return { grame: _r2(grame), bac: _r2(bac), mgL: _r2(bac / 2), oreEliminare: _r2(bac / 0.15) };
}

function calcTensiune(input) {
  var s = parseFloat(input.sistolica) || 0; var d = parseFloat(input.diastolica) || 0;
  var cat;
  if (s >= 180 || d >= 110) { cat = 'Hipertensiune gradul 3'; }
  else if (s >= 160 || d >= 100) { cat = 'Hipertensiune gradul 2'; }
  else if (s >= 140 || d >= 90) { cat = 'Hipertensiune gradul 1'; }
  else if (s >= 130 || d >= 85) { cat = 'Normal-înaltă'; }
  else if (s >= 120 || d >= 80) { cat = 'Normală'; }
  else { cat = 'Optimă'; }
  return { categorie: cat };
}

if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function num(n, d) { return new Intl.NumberFormat('ro-RO', { minimumFractionDigits: (d === undefined ? 2 : d), maximumFractionDigits: (d === undefined ? 2 : d) }).format(n); }
    function int(n) { return new Intl.NumberFormat('ro-RO').format(n); }
    function bind(btnId, inputIds, render) {
      var btn = el(btnId); if (btn) { btn.addEventListener('click', render); }
      inputIds.forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); } });
    }
    function setRows(id, rows) { var t = el(id); if (t) { t.innerHTML = rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join(''); } }
    // IMC
    (function () {
      if (!el('roimc-btn')) { return; }
      function render() {
        var r = calcIMC({ greutateKg: el('roimc-greutate').value, inaltimeCm: el('roimc-inaltime').value });
        var big = el('roimc-big'); if (big) { big.textContent = num(r.imc) + ' — ' + r.categorie; }
        setRows('roimc-rows', [['IMC', num(r.imc)], ['Categorie (OMS)', r.categorie], ['Greutate normală pentru înălțimea ta', num(r.greutateMin, 1) + ' – ' + num(r.greutateMax, 1) + ' kg']]);
      }
      bind('roimc-btn', ['roimc-greutate', 'roimc-inaltime'], render); render();
    })();
    // Calorii
    (function () {
      if (!el('rocal-btn')) { return; }
      function render() {
        var r = calcCalorii({ sex: el('rocal-sex').value, varsta: el('rocal-varsta').value, greutateKg: el('rocal-greutate').value, inaltimeCm: el('rocal-inaltime').value, activitate: el('rocal-activitate').value });
        var big = el('rocal-big'); if (big) { big.textContent = int(r.tdee) + ' kcal/zi'; }
        setRows('rocal-rows', [['Metabolism bazal (BMR)', int(r.bmr) + ' kcal/zi'], ['Necesar caloric zilnic (TDEE)', int(r.tdee) + ' kcal/zi'], ['Factor de activitate', String(r.factor).replace('.', ',')]]);
      }
      bind('rocal-btn', ['rocal-sex', 'rocal-varsta', 'rocal-greutate', 'rocal-inaltime', 'rocal-activitate'], render); render();
    })();
    // Sarcină
    (function () {
      if (!el('rosar-btn')) { return; }
      function render() {
        var r = calcSarcina({ ultimaMenstruatie: el('rosar-lmp').value, durataCiclu: el('rosar-ciclu').value });
        var big = el('rosar-big'); if (big) { big.textContent = r.dpn; }
        setRows('rosar-rows', [['Data probabilă a nașterii (DPN)', r.dpn], ['Săptămâna de sarcină', 'Săptămâna ' + r.saptamana + ', ziua ' + (r.zi + 1)], ['Trimestrul', 'Trimestrul ' + r.trimestru]]);
      }
      bind('rosar-btn', ['rosar-lmp', 'rosar-ciclu'], render); render();
    })();
    // Alcoolemie
    (function () {
      if (!el('roalc-btn')) { return; }
      function render() {
        var r = calcAlcoolemie({ sex: el('roalc-sex').value, greutateKg: el('roalc-greutate').value, volumMl: el('roalc-ml').value, concentratiePct: el('roalc-proc').value, numarBauturi: el('roalc-nr').value, oreDeLaConsum: el('roalc-ore').value });
        var big = el('roalc-big'); if (big) { big.textContent = num(r.bac) + ' g/l'; }
        setRows('roalc-rows', [['Alcool pur consumat', num(r.grame, 1) + ' g'], ['Alcoolemie estimată', num(r.bac) + ' g/l'], ['În aerul expirat', num(r.mgL) + ' mg/l'], ['Timp estimat de eliminare', num(r.oreEliminare, 1) + ' ore']]);
      }
      bind('roalc-btn', ['roalc-sex', 'roalc-greutate', 'roalc-ml', 'roalc-proc', 'roalc-nr', 'roalc-ore'], render); render();
    })();
    // Ovulație
    (function () {
      if (!el('roovu-btn')) { return; }
      function render() {
        var r = calcOvulatie({ ultimaMenstruatie: el('roovu-lmp').value, durataCiclu: el('roovu-ciclu').value });
        var big = el('roovu-big'); if (big) { big.textContent = r.ovulatie; }
        setRows('roovu-rows', [['Data ovulației', r.ovulatie], ['Fereastra fertilă', r.fertilStart + ' – ' + r.fertilEnd], ['Test de sarcină (orientativ)', r.test]]);
      }
      bind('roovu-btn', ['roovu-lmp', 'roovu-ciclu'], render); render();
    })();
    // Menstruație
    (function () {
      if (!el('romen-btn')) { return; }
      function render() {
        var r = calcMenstruatie({ ultimaMenstruatie: el('romen-lmp').value, durataCiclu: el('romen-ciclu').value });
        var big = el('romen-big'); if (big) { big.textContent = r.urmatoarele[0] || '-'; }
        setRows('romen-rows', r.urmatoarele.map(function (d, i) { return ['Menstruația ' + (i + 1), d]; }));
      }
      bind('romen-btn', ['romen-lmp', 'romen-ciclu'], render); render();
    })();
    // Tensiune
    (function () {
      if (!el('roten-btn')) { return; }
      function render() {
        var r = calcTensiune({ sistolica: el('roten-sis').value, diastolica: el('roten-dia').value });
        var big = el('roten-big'); if (big) { big.textContent = r.categorie; }
        setRows('roten-rows', [['Sistolică / diastolică', el('roten-sis').value + ' / ' + el('roten-dia').value + ' mmHg'], ['Categorie (ghid ESH 2023)', r.categorie]]);
      }
      bind('roten-btn', ['roten-sis', 'roten-dia'], render); render();
    })();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcIMC: calcIMC, calcCalorii: calcCalorii, calcSarcina: calcSarcina, calcOvulatie: calcOvulatie, calcMenstruatie: calcMenstruatie, calcAlcoolemie: calcAlcoolemie, calcTensiune: calcTensiune }; }
