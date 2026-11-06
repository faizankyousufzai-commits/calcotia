/* Calcotia RO — cluster Juridic (4 tools).
   Pure functions + DOM binding guarded by typeof document !== 'undefined'
   + module.exports guard so Node can test it. All labels in Romanian.
   Reguli verificate: taxa de timbru OUG 80/2013 art. 3 (cereri evaluabile
   în bani); apelul/recursul = 50% din taxa de fond (art. 24–25 OUG 80/2013);
   dobânda legală OG 13/2011 art. 3: remuneratorie = rata de referință BNR
   + 4 puncte procentuale, penalizatoare = rata de referință BNR + 8 puncte;
   rata BNR este introdusă de utilizator (implicit 6,50%, valoare de lucru —
   verifică rata în vigoare pe site-ul BNR). Termene CPC art. 181: termenul
   pe zile nu include ziua actului; dacă ultima zi este nelucrătoare,
   termenul expiră în următoarea zi lucrătoare. Pensie alimentară art. 529
   Cod civil: 1/4 (un copil), 1/3 (doi copii), 1/2 (trei sau mai mulți copii)
   din venitul net lunar. */
function _r2(n) { return Math.round(n * 100) / 100; }
function _parseDate(s) { if (!s) { return null; } var d = new Date(s + 'T00:00:00'); return isNaN(d.getTime()) ? null : d; }
function _addDays(d, n) { var c = new Date(d.getTime()); c.setDate(c.getDate() + n); return c; }
function _fmtDate(d) { var p = function (x) { return (x < 10 ? '0' : '') + x; }; return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear(); }

var SARBATORI_2026 = ['2026-01-01', '2026-01-02', '2026-01-06', '2026-01-07', '2026-01-24', '2026-04-10', '2026-04-12', '2026-04-13', '2026-05-01', '2026-06-01', '2026-06-07', '2026-06-08', '2026-08-15', '2026-11-30', '2026-12-01', '2026-12-25', '2026-12-26'];
var SARBATORI_2027 = ['2027-01-01', '2027-01-02', '2027-01-06', '2027-01-07', '2027-01-24', '2027-04-30', '2027-05-02', '2027-05-03', '2027-06-01', '2027-06-20', '2027-06-21', '2027-08-15', '2027-11-30', '2027-12-01', '2027-12-25', '2027-12-26'];
function _esteZiLucratoare(d) {
  var zi = d.getDay();
  if (zi === 0 || zi === 6) { return false; }
  var iso = d.getFullYear() + '-' + (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1) + '-' + (d.getDate() < 10 ? '0' : '') + d.getDate();
  return SARBATORI_2026.indexOf(iso) < 0 && SARBATORI_2027.indexOf(iso) < 0;
}

function calcTaxaTimbru(input) {
  var v = Math.max(0, parseFloat(input.valoare) || 0);
  var taxa;
  if (v <= 500) { taxa = Math.max(20, v * 0.08); }
  else if (v <= 5000) { taxa = 40 + (v - 500) * 0.07; }
  else if (v <= 25000) { taxa = 355 + (v - 5000) * 0.05; }
  else if (v <= 50000) { taxa = 1355 + (v - 25000) * 0.03; }
  else if (v <= 250000) { taxa = 2105 + (v - 50000) * 0.02; }
  else { taxa = 6105 + (v - 250000) * 0.01; }
  if (input.tip === 'apel' || input.tip === 'recurs') { taxa = taxa * 0.5; }
  return { taxa: _r2(taxa) };
}

function calcDobandaLegala(input) {
  var capital = Math.max(0, parseFloat(input.capital) || 0);
  var zile = Math.max(0, parseFloat(input.zile) || 0);
  var bnr = parseFloat(input.rataBNR); if (isNaN(bnr)) { bnr = 6.5; }
  var rata = input.tip === 'penalizatoare' ? bnr + 8 : bnr + 4;
  var dobanda = capital * rata / 100 * zile / 365;
  return { rata: _r2(rata), dobanda: _r2(dobanda), total: _r2(capital + dobanda) };
}

function calcTermene(input) {
  var data = _parseDate(input.dataAct); if (!data) { return { expirare: '-', ziSaptamana: '-' }; }
  var zile = Math.max(0, parseInt(input.zile, 10) || 0);
  var expirare = _addDays(data, zile); // ziua actului nu se ia în calcul (art. 181 CPC)
  var guard = 0;
  while (!_esteZiLucratoare(expirare) && guard < 10) { expirare = _addDays(expirare, 1); guard++; }
  var numeZile = ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă'];
  return { expirare: _fmtDate(expirare), ziSaptamana: numeZile[expirare.getDay()] };
}

function calcPensieAlimentara(input) {
  var venit = Math.max(0, parseFloat(input.venitNet) || 0);
  var copii = Math.max(1, parseInt(input.copii, 10) || 1);
  var fractie = copii === 1 ? 0.25 : copii === 2 ? 1 / 3 : 0.5;
  return { pensie: _r2(venit * fractie), procent: _r2(fractie * 100) };
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
    (function () { // Taxa timbru
      if (!el('rott-btn')) { return; }
      function render() {
        var r = calcTaxaTimbru({ valoare: el('rott-valoare').value, tip: el('rott-tip').value });
        var big = el('rott-big'); if (big) { big.textContent = lei(r.taxa); }
        setRows('rott-rows', [['Valoarea cererii', lei(parseFloat(el('rott-valoare').value) || 0)], ['Taxa judiciară de timbru', lei(r.taxa)]]);
      }
      bind('rott-btn', ['rott-valoare', 'rott-tip'], render); render();
    })();
    (function () { // Dobânda legală
      if (!el('rodl-btn')) { return; }
      function render() {
        var r = calcDobandaLegala({ capital: el('rodl-capital').value, zile: el('rodl-zile').value, tip: el('rodl-tip').value, rataBNR: el('rodl-bnr').value });
        var big = el('rodl-big'); if (big) { big.textContent = lei(r.dobanda); }
        setRows('rodl-rows', [['Rata dobânzii legale', num(r.rata) + ' % pe an'], ['Dobânda', lei(r.dobanda)], ['Total (capital + dobândă)', lei(r.total)]]);
      }
      bind('rodl-btn', ['rodl-capital', 'rodl-zile', 'rodl-tip', 'rodl-bnr'], render); render();
    })();
    (function () { // Termene judiciare
      if (!el('roter-btn')) { return; }
      function render() {
        var r = calcTermene({ dataAct: el('roter-data').value, zile: el('roter-zile').value });
        var big = el('roter-big'); if (big) { big.textContent = r.expirare; }
        setRows('roter-rows', [['Termenul expiră la', r.expirare + ' (' + r.ziSaptamana + ')'], ['Temei', 'Art. 181 CPC']]);
      }
      bind('roter-btn', ['roter-data', 'roter-zile'], render); render();
    })();
    (function () { // Pensie alimentară
      if (!el('ropa-btn')) { return; }
      function render() {
        var r = calcPensieAlimentara({ venitNet: el('ropa-venit').value, copii: el('ropa-copii').value });
        var big = el('ropa-big'); if (big) { big.textContent = lei(r.pensie) + '/lună'; }
        setRows('ropa-rows', [['Cota legală (art. 529 Cod civil)', num(r.procent, 0) + '% din venitul net'], ['Pensie alimentară lunară', lei(r.pensie)]]);
      }
      bind('ropa-btn', ['ropa-venit', 'ropa-copii'], render); render();
    })();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcTaxaTimbru: calcTaxaTimbru, calcDobandaLegala: calcDobandaLegala, calcTermene: calcTermene, calcPensieAlimentara: calcPensieAlimentara }; }
