/* Calcotia RO — cluster Construcții și altele (9 tools).
   Pure functions + DOM binding guarded by typeof document !== 'undefined'
   + module.exports guard so Node can test it. All labels in Romanian.
   Ipoteze declarate pe pagini: rețetele de beton sunt orientative (nu
   înlocuiesc proiectul de rezistență); secțiunea de cablu se alege din
   tabelul orientativ de curent admisibil și se verifică scăderea de
   tensiune ≤3%; formula greutății porcului (perimetru² × lungime / 10.800)
   este o estimare, randamentul la tăiere folosit 72%; darul de nuntă
   folosește multiplicatori orientativi, nu o regulă legală; cifra
   destinului este numerologie, un joc, nu o știință. Gestația scroafei:
   114 zile (standard). */
function _r2(n) { return Math.round(n * 100) / 100; }
function _parseDate(s) { if (!s) { return null; } var d = new Date(s + 'T00:00:00'); return isNaN(d.getTime()) ? null : d; }
function _addDays(d, n) { var c = new Date(d.getTime()); c.setDate(c.getDate() + n); return c; }
function _fmtDate(d) { var p = function (x) { return (x < 10 ? '0' : '') + x; }; return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear(); }

var AMPACITATE_CUPRU = [[1.5, 16], [2.5, 20], [4, 25], [6, 32], [10, 40], [16, 63], [25, 80], [35, 100]];
var AMPACITATE_ALUMINIU = [[2.5, 16], [4, 20], [6, 25], [10, 32], [16, 40], [25, 50], [35, 63], [50, 80]];
function calcSectiuneCablu(input) {
  var p = Math.max(0, parseFloat(input.putereW) || 0);
  var u = Math.max(0, parseFloat(input.tensiuneV) || 230);
  var l = Math.max(0, parseFloat(input.lungimeM) || 0);
  var tabel = input.material === 'aluminiu' ? AMPACITATE_ALUMINIU : AMPACITATE_CUPRU;
  var rho = input.material === 'aluminiu' ? 0.0282 : 0.0175;
  var curent = u > 0 ? p / u : 0;
  var sectiune = null;
  for (var i = 0; i < tabel.length; i++) {
    if (curent <= tabel[i][1]) {
      var cadere = 2 * l * curent * rho / tabel[i][0];
      if (cadere / u * 100 <= 3) { sectiune = tabel[i][0]; break; }
    }
  }
  if (sectiune === null) { sectiune = tabel[tabel.length - 1][0]; }
  var cadereV = 2 * l * curent * rho / sectiune;
  return { curent: _r2(curent), sectiune: sectiune, caderePct: _r2(cadereV / u * 100) };
}

var RETETE_BETON = {
  'C16/20': { ciment: 300, nisip: 0.6, pietris: 0.9, apa: 150 },
  'C20/25': { ciment: 350, nisip: 0.55, pietris: 0.85, apa: 160 },
  'C25/30': { ciment: 400, nisip: 0.5, pietris: 0.8, apa: 170 }
};
function calcBeton(input) {
  var volum = Math.max(0, parseFloat(input.volumM3) || 0);
  var reteta = RETETE_BETON[input.clasa] || RETETE_BETON['C16/20'];
  var cimentKg = reteta.ciment * volum;
  return { cimentKg: Math.round(cimentKg), saci: _r2(cimentKg / 50), nisip: _r2(reteta.nisip * volum), pietris: _r2(reteta.pietris * volum), apa: Math.round(reteta.apa * volum) };
}

function calcAcoperis(input) {
  var lung = Math.max(0, parseFloat(input.lungime) || 0);
  var lat = Math.max(0, parseFloat(input.latime) || 0);
  var panta = Math.max(0, parseFloat(input.pantaGrade) || 0);
  var streasina = Math.max(0, parseFloat(input.streasinaM) || 0);
  var tiglaM2 = Math.max(0, parseFloat(input.tiglaPerM2) || 10);
  var latimePanta = (lat / 2 + streasina) / Math.cos(panta * Math.PI / 180);
  var suprafata = 2 * latimePanta * (lung + 2 * streasina);
  var tigle = Math.ceil(suprafata * tiglaM2 * 1.1);
  return { latimePanta: _r2(latimePanta), suprafata: _r2(suprafata), tigle: tigle };
}

function calcCherestea(input) {
  var total = 0;
  (input.piese || []).forEach(function (p) {
    var g = (parseFloat(p.grosimeMm) || 0) / 1000;
    var l = (parseFloat(p.latimeMm) || 0) / 1000;
    var lung = parseFloat(p.lungimeM) || 0;
    var buc = parseFloat(p.bucati) || 0;
    total += g * l * lung * buc;
  });
  return { volum: _r2(total) };
}

function calcFatare(input) {
  var data = _parseDate(input.dataMonta); if (!data) { return { dataFatare: '-', fereastraStart: '-', fereastraEnd: '-' }; }
  var gestatie = parseInt(input.gestatieZile, 10) || 114;
  return { dataFatare: _fmtDate(_addDays(data, gestatie)), fereastraStart: _fmtDate(_addDays(data, gestatie - 3)), fereastraEnd: _fmtDate(_addDays(data, gestatie + 3)) };
}

function calcGreutatePorc(input) {
  var per = Math.max(0, parseFloat(input.perimetruCm) || 0);
  var lung = Math.max(0, parseFloat(input.lungimeCm) || 0);
  var viu = per * per * lung / 10800;
  return { greutateVie: _r2(viu), carne: _r2(viu * 0.72) };
}

function calcCifraDestinului(input) {
  var data = _parseDate(input.dataNastere); if (!data) { return { cifra: 0, maestru: false }; }
  var s = '' + data.getDate() + (data.getMonth() + 1) + data.getFullYear();
  function reduce(str) {
    var sum = 0;
    for (var i = 0; i < str.length; i++) { sum += parseInt(str[i], 10); }
    return sum;
  }
  var v = reduce(s);
  while (v > 9 && v !== 11 && v !== 22 && v !== 33) { v = reduce(String(v)); }
  return { cifra: v, maestru: v === 11 || v === 22 || v === 33 };
}

function calcDarNunta(input) {
  var meniu = Math.max(0, parseFloat(input.meniuPersoana) || 0);
  var persoane = Math.max(0, parseFloat(input.persoane) || 0);
  var mult = { familie: 2, ruda: 1.5, prietenApropiat: 1.5, prieten: 1, coleg: 1 }[input.relatie] || 1;
  return { dar: Math.round(meniu * persoane * mult), multiplicator: mult };
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
    (function () { // Secțiune cablu
      if (!el('rosc-btn')) { return; }
      function render() {
        var r = calcSectiuneCablu({ putereW: el('rosc-putere').value, tensiuneV: el('rosc-tensiune').value, lungimeM: el('rosc-lungime').value, material: el('rosc-material').value });
        var big = el('rosc-big'); if (big) { big.textContent = num(r.sectiune, 1) + ' mm²'; }
        setRows('rosc-rows', [['Curent', num(r.curent) + ' A'], ['Secțiune recomandată', num(r.sectiune, 1) + ' mm²'], ['Cădere de tensiune', num(r.caderePct) + ' %']]);
      }
      bind('rosc-btn', ['rosc-putere', 'rosc-tensiune', 'rosc-lungime', 'rosc-material'], render); render();
    })();
    (function () { // Beton
      if (!el('robet-btn')) { return; }
      function render() {
        var r = calcBeton({ volumM3: el('robet-volum').value, clasa: el('robet-clasa').value });
        var big = el('robet-big'); if (big) { big.textContent = num(r.saci, 0) + ' saci de ciment'; }
        setRows('robet-rows', [['Ciment', num(r.cimentKg, 0) + ' kg (' + num(r.saci, 1) + ' saci × 50 kg)'], ['Nisip', num(r.nisip) + ' m³'], ['Pietriș', num(r.pietris) + ' m³'], ['Apă', num(r.apa, 0) + ' litri']]);
      }
      bind('robet-btn', ['robet-volum', 'robet-clasa'], render); render();
    })();
    (function () { // Acoperiș
      if (!el('roaco-btn')) { return; }
      function render() {
        var r = calcAcoperis({ lungime: el('roaco-lungime').value, latime: el('roaco-latime').value, pantaGrade: el('roaco-panta').value, streasinaM: el('roaco-streasina').value, tiglaPerM2: el('roaco-tigla').value });
        var big = el('roaco-big'); if (big) { big.textContent = num(r.suprafata) + ' m²'; }
        setRows('roaco-rows', [['Lățimea unei ape', num(r.latimePanta) + ' m'], ['Suprafața acoperișului', num(r.suprafata) + ' m²'], ['Țiglă necesară (cu 10% rezervă)', num(r.tigle, 0) + ' bucăți']]);
      }
      bind('roaco-btn', ['roaco-lungime', 'roaco-latime', 'roaco-panta', 'roaco-streasina', 'roaco-tigla'], render); render();
    })();
    (function () { // Cherestea
      if (!el('roche-btn')) { return; }
      function render() {
        var piese = [];
        for (var i = 1; i <= 3; i++) { piese.push({ grosimeMm: el('roche-g' + i).value, latimeMm: el('roche-l' + i).value, lungimeM: el('roche-lung' + i).value, bucati: el('roche-buc' + i).value }); }
        var r = calcCherestea({ piese: piese });
        var big = el('roche-big'); if (big) { big.textContent = num(r.volum) + ' m³'; }
        setRows('roche-rows', [['Volum total', num(r.volum) + ' m³']]);
      }
      bind('roche-btn', ['roche-g1', 'roche-l1', 'roche-lung1', 'roche-buc1', 'roche-g2', 'roche-l2', 'roche-lung2', 'roche-buc2', 'roche-g3', 'roche-l3', 'roche-lung3', 'roche-buc3'], render); render();
    })();
    (function () { // Fătare scroafe
      if (!el('rofat-btn')) { return; }
      function render() {
        var r = calcFatare({ dataMonta: el('rofat-data').value, gestatieZile: 114 });
        var big = el('rofat-big'); if (big) { big.textContent = r.dataFatare; }
        setRows('rofat-rows', [['Data probabilă a fătării', r.dataFatare], ['Fereastra probabilă', r.fereastraStart + ' – ' + r.fereastraEnd], ['Gestație', '114 zile']]);
      }
      bind('rofat-btn', ['rofat-data'], render); render();
    })();
    (function () { // Greutate porc
      if (!el('rogp-btn')) { return; }
      function render() {
        var r = calcGreutatePorc({ perimetruCm: el('rogp-perimetru').value, lungimeCm: el('rogp-lungime').value });
        var big = el('rogp-big'); if (big) { big.textContent = num(r.greutateVie, 1) + ' kg'; }
        setRows('rogp-rows', [['Greutate vie estimată', num(r.greutateVie, 1) + ' kg'], ['Carne (randament 72%)', num(r.carne, 1) + ' kg']]);
      }
      bind('rogp-btn', ['rogp-perimetru', 'rogp-lungime'], render); render();
    })();
    (function () { // Cifra destinului
      if (!el('rocd-btn')) { return; }
      function render() {
        var r = calcCifraDestinului({ dataNastere: el('rocd-data').value });
        var big = el('rocd-big'); if (big) { big.textContent = r.maestru ? 'Număr maestru ' + r.cifra : 'Cifra destinului ' + r.cifra; }
        setRows('rocd-rows', [['Cifra destinului', String(r.cifra)], ['Număr maestru', r.maestru ? 'Da (11, 22 sau 33 nu se mai reduc)' : 'Nu']]);
      }
      bind('rocd-btn', ['rocd-data'], render); render();
    })();
    (function () { // Dar nuntă
      if (!el('rodar-btn')) { return; }
      function render() {
        var r = calcDarNunta({ meniuPersoana: el('rodar-meniu').value, persoane: el('rodar-persoane').value, relatie: el('rodar-relatie').value });
        var big = el('rodar-big'); if (big) { big.textContent = lei(r.dar); }
        setRows('rodar-rows', [['Costul meniurilor', lei((parseFloat(el('rodar-meniu').value) || 0) * (parseFloat(el('rodar-persoane').value) || 0))], ['Multiplicator relație', '×' + String(r.multiplicator).replace('.', ',')], ['Dar orientativ', lei(r.dar)]]);
      }
      bind('rodar-btn', ['rodar-meniu', 'rodar-persoane', 'rodar-relatie'], render); render();
    })();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcSectiuneCablu: calcSectiuneCablu, calcBeton: calcBeton, calcAcoperis: calcAcoperis, calcCherestea: calcCherestea, calcFatare: calcFatare, calcGreutatePorc: calcGreutatePorc, calcCifraDestinului: calcCifraDestinului, calcDarNunta: calcDarNunta }; }
