/* Calcotia RO — cluster Finanțe (9 tools).
   Pure functions + DOM binding guarded by typeof document !== 'undefined'
   + module.exports guard so Node can test it. All labels in Romanian.
   Cote verificate 2026: TVA 21% standard / 11% redusă (Cod fiscal art. 291,
   Legea 141/2025); impozit dividende 16% + CASS pe plafoane 6/12/24 salarii
   minime (4.050 lei referință 2026: 24.300 / 48.600 / 97.200 lei);
   impozit chirie 10% după deducere forfetară 20%; impozit dobândă depozit
   10%; impozit auto 2026 art. 470 Cod fiscal (OUG 78/2025), electrice 40 lei;
   comision rambursare anticipată maximum 1% (OUG 50/2010). */
function _r2(n) { return Math.round(n * 100) / 100; }

function calcTVA(input) {
  var suma = Math.max(0, parseFloat(input.suma) || 0);
  var cota = Math.max(0, parseFloat(input.cotaPct) || 0);
  var tva, total, net;
  if (input.mod === 'scoate') { net = suma / (1 + cota / 100); tva = suma - net; total = suma; }
  else { net = suma; tva = suma * cota / 100; total = suma + tva; }
  return { net: _r2(net), tva: _r2(tva), total: _r2(total) };
}

function _rataLunara(suma, dobandaPct, luni) {
  var r = dobandaPct / 100 / 12;
  if (r <= 0) { return suma / luni; }
  return suma * r / (1 - Math.pow(1 + r, -luni));
}
function _dae(principalNet, rata, luni) {
  // IRR lunar prin bisecție: valoarea actuală a ratelor = suma netă primită.
  var lo = 0, hi = 0.2, mid = 0, pv = 0;
  for (var i = 0; i < 100; i++) {
    mid = (lo + hi) / 2; pv = 0;
    for (var k = 1; k <= luni; k++) { pv += rata / Math.pow(1 + mid, k); }
    if (pv > principalNet) { lo = mid; } else { hi = mid; }
  }
  return (Math.pow(1 + mid, 12) - 1) * 100;
}
function calcCredit(input) {
  var suma = Math.max(0, parseFloat(input.suma) || 0);
  var dob = Math.max(0, parseFloat(input.dobandaPct) || 0);
  var luni = Math.max(1, parseInt(input.luni, 10) || 1);
  var com = Math.max(0, parseFloat(input.comision) || 0);
  if (input.tipRata === 'descrescatoare') {
    var principal = suma / luni; var dobTotala = 0;
    for (var k = 0; k < luni; k++) { dobTotala += (suma - principal * k) * dob / 100 / 12; }
    var prima = principal + suma * dob / 100 / 12;
    var ultima = principal + principal * dob / 100 / 12;
    return { rata: _r2(prima), rataUltima: _r2(ultima), totalPlata: _r2(suma + dobTotala), dobandaTotala: _r2(dobTotala), dae: null };
  }
  var rata = _rataLunara(suma, dob, luni);
  var total = rata * luni;
  return { rata: _r2(rata), rataUltima: _r2(rata), totalPlata: _r2(total), dobandaTotala: _r2(total - suma), dae: _r2(_dae(suma - com, rata, luni)) };
}

function calcDobandaCompusa(input) {
  var init = Math.max(0, parseFloat(input.initial) || 0);
  var lunar = Math.max(0, parseFloat(input.lunar) || 0);
  var dob = Math.max(0, parseFloat(input.dobandaPct) || 0);
  var ani = Math.max(0, parseFloat(input.ani) || 0);
  var r = dob / 100 / 12; var n = Math.round(ani * 12);
  var fvInit = init * Math.pow(1 + r, n);
  var fvLunar = r > 0 ? lunar * (Math.pow(1 + r, n) - 1) / r : lunar * n;
  var depuneri = init + lunar * n;
  var fv = fvInit + fvLunar;
  return { valoareFinala: _r2(fv), depuneri: _r2(depuneri), dobanda: _r2(fv - depuneri) };
}

var IMPOZIT_AUTO_2026 = {
  // lei / 200 cmc, art. 470 alin. (2) Cod fiscal, OUG 78/2025
  'pana1600': { 'noneuro': 19.5, 'euro4': 18.8, 'euro5': 17.6, 'euro6': 16.5, 'hibrid': 16.2 },
  '1601-2000': { 'noneuro': 29.7, 'euro4': 28.5, 'euro5': 26.7, 'euro6': 25.1, 'hibrid': 24.6 },
  '2001-2600': { 'noneuro': 92.2, 'euro4': 88.6, 'euro5': 82.8, 'euro6': 77.8, 'hibrid': 76.3 },
  '2601-3000': { 'noneuro': 182.9, 'euro4': 172.8, 'euro5': 154.1, 'euro6': 151.2, 'hibrid': 149.8 },
  'peste3000': { 'noneuro': 319.0, 'euro4': 297.3, 'euro5': 294.4, 'euro6': 290.0, 'hibrid': 275.5 }
};
function calcImpozitAuto(input) {
  var cap = Math.max(0, parseFloat(input.capacitate) || 0);
  if (input.tip === 'electric') { return { grupe: 0, tarifGrupa: 0, impozit: 40 }; }
  var transa = cap <= 1600 ? 'pana1600' : cap <= 2000 ? '1601-2000' : cap <= 2600 ? '2001-2600' : cap <= 3000 ? '2601-3000' : 'peste3000';
  var norma = input.tip === 'hibrid' ? 'hibrid' : (input.norma || 'euro6');
  var tarif = IMPOZIT_AUTO_2026[transa][norma];
  var grupe = Math.ceil(cap / 200);
  return { grupe: grupe, tarifGrupa: tarif, impozit: Math.round(grupe * tarif) };
}

function calcLeasing(input) {
  var pret = Math.max(0, parseFloat(input.pret) || 0);
  var avans = pret * (Math.max(0, parseFloat(input.avansPct) || 0) / 100);
  var rezidual = pret * (Math.max(0, parseFloat(input.rezidualPct) || 0) / 100);
  var luni = Math.max(1, parseInt(input.luni, 10) || 1);
  var dob = Math.max(0, parseFloat(input.dobandaPct) || 0);
  var r = dob / 100 / 12;
  var finantat = pret - avans;
  var pvRezidual = rezidual / Math.pow(1 + r, luni);
  var rata = r > 0 ? (finantat - pvRezidual) * r / (1 - Math.pow(1 + r, -luni)) : (finantat - rezidual) / luni;
  var totalRate = rata * luni;
  return { avans: _r2(avans), finantat: _r2(finantat), rata: _r2(rata), totalPlata: _r2(totalRate + rezidual), costTotal: _r2(totalRate + rezidual + avans - pret) };
}

function calcRambursare(input) {
  var sold = Math.max(0, parseFloat(input.sold) || 0);
  var dob = Math.max(0, parseFloat(input.dobandaPct) || 0);
  var luni = Math.max(1, parseInt(input.luniRamase, 10) || 1);
  var suma = Math.min(sold, Math.max(0, parseFloat(input.sumaRambursata) || 0));
  var rataVeche = _rataLunara(sold, dob, luni);
  var dobVeche = rataVeche * luni - sold;
  var soldNou = sold - suma;
  var comision = _r2(suma * 0.01);
  if (input.mod === 'perioada') {
    var rata = rataVeche;
    var luniNoi = 0; var rest = soldNou; var r = dob / 100 / 12; var dobNoua = 0;
    while (rest > 0.01 && luniNoi < 600) { var d = rest * r; var p = Math.min(rata - d, rest); dobNoua += d; rest -= p; luniNoi++; }
    return { rataNoua: _r2(rata), luniNoi: luniNoi, economieDobanda: _r2(dobVeche - dobNoua), comision: comision };
  }
  var rataNoua = _rataLunara(soldNou, dob, luni);
  var dobNoua2 = rataNoua * luni - soldNou;
  return { rataNoua: _r2(rataNoua), luniNoi: luni, economieDobanda: _r2(dobVeche - dobNoua2), comision: comision };
}

function _cassPlafon(venitNet) {
  // Plafoane 2026 la salariul minim de referință 4.050 lei (6/12/24 salarii).
  if (venitNet < 24300) { return 0; }
  if (venitNet < 48600) { return 2430; }
  if (venitNet < 97200) { return 4860; }
  return 9720;
}
function calcDividende(input) {
  var brute = Math.max(0, parseFloat(input.dividendeBrute) || 0);
  var impozit = brute * 0.16;
  var net = brute - impozit;
  var cass = _cassPlafon(net);
  return { impozit: _r2(impozit), net: _r2(net), cass: cass, totalNet: _r2(net - cass) };
}

function calcImpozitChirie(input) {
  var lunara = Math.max(0, parseFloat(input.chirieLunara) || 0);
  var luni = Math.max(0, parseFloat(input.luni) || 0);
  var brut = lunara * luni;
  var venitNet = brut * 0.8;
  var impozit = venitNet * 0.10;
  var cass = _cassPlafon(venitNet);
  return { venitBrut: _r2(brut), venitNet: _r2(venitNet), impozit: _r2(impozit), cass: cass, net: _r2(brut - impozit - cass) };
}

function calcDobandaDepozit(input) {
  var suma = Math.max(0, parseFloat(input.suma) || 0);
  var dob = Math.max(0, parseFloat(input.dobandaPct) || 0);
  var luni = Math.max(0, parseFloat(input.luni) || 0);
  var bruta = suma * dob / 100 * luni / 12;
  var impozit = bruta * 0.10;
  return { bruta: _r2(bruta), impozit: _r2(impozit), neta: _r2(bruta - impozit) };
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
    (function () { // TVA
      if (!el('rotva-btn')) { return; }
      function render() {
        var r = calcTVA({ suma: el('rotva-suma').value, cotaPct: el('rotva-cota').value, mod: el('rotva-mod').value });
        var big = el('rotva-big'); if (big) { big.textContent = lei(r.total); }
        setRows('rotva-rows', [['Preț fără TVA', lei(r.net)], ['TVA', lei(r.tva)], ['Total cu TVA', lei(r.total)]]);
      }
      bind('rotva-btn', ['rotva-suma', 'rotva-cota', 'rotva-mod'], render); render();
    })();
    (function () { // Credit
      if (!el('rocre-btn')) { return; }
      function render() {
        var r = calcCredit({ suma: el('rocre-suma').value, dobandaPct: el('rocre-dobanda').value, luni: el('rocre-luni').value, comision: el('rocre-comision').value, tipRata: el('rocre-tip').value });
        var big = el('rocre-big'); if (big) { big.textContent = lei(r.rata) + '/lună'; }
        var rows = [['Rata lunară', lei(r.rata)], ['Dobânda totală', lei(r.dobandaTotala)], ['Total de plată', lei(r.totalPlata)]];
        if (r.dae !== null) { rows.push(['DAE estimată', num(r.dae) + ' %']); } else { rows.push(['Ultima rată', lei(r.rataUltima)]); }
        setRows('rocre-rows', rows);
      }
      bind('rocre-btn', ['rocre-suma', 'rocre-dobanda', 'rocre-luni', 'rocre-comision', 'rocre-tip'], render); render();
    })();
    (function () { // Dobândă compusă
      if (!el('rodc-btn')) { return; }
      function render() {
        var r = calcDobandaCompusa({ initial: el('rodc-initial').value, lunar: el('rodc-lunar').value, dobandaPct: el('rodc-dobanda').value, ani: el('rodc-ani').value });
        var big = el('rodc-big'); if (big) { big.textContent = lei(r.valoareFinala); }
        setRows('rodc-rows', [['Valoare finală', lei(r.valoareFinala)], ['Total depus', lei(r.depuneri)], ['Dobânda câștigată', lei(r.dobanda)]]);
      }
      bind('rodc-btn', ['rodc-initial', 'rodc-lunar', 'rodc-dobanda', 'rodc-ani'], render); render();
    })();
    (function () { // Impozit auto
      if (!el('roia-btn')) { return; }
      function render() {
        var r = calcImpozitAuto({ capacitate: el('roia-capacitate').value, norma: el('roia-norma').value, tip: el('roia-tip').value });
        var big = el('roia-big'); if (big) { big.textContent = lei(r.impozit) + '/an'; }
        setRows('roia-rows', [['Grupe de 200 cm³', String(r.grupe)], ['Tarif pe grupă', r.tarifGrupa ? num(r.tarifGrupa) + ' lei' : '—'], ['Impozit anual (fără cota locală)', lei(r.impozit)]]);
      }
      bind('roia-btn', ['roia-capacitate', 'roia-norma', 'roia-tip', 'roia-cota'], render); render();
    })();
    (function () { // Leasing
      if (!el('rolea-btn')) { return; }
      function render() {
        var r = calcLeasing({ pret: el('rolea-pret').value, avansPct: el('rolea-avans').value, luni: el('rolea-luni').value, dobandaPct: el('rolea-dobanda').value, rezidualPct: el('rolea-rezidual').value });
        var big = el('rolea-big'); if (big) { big.textContent = lei(r.rata) + '/lună'; }
        setRows('rolea-rows', [['Avans', lei(r.avans)], ['Sumă finanțată', lei(r.finantat)], ['Rata lunară', lei(r.rata)], ['Cost total peste preț', lei(r.costTotal)]]);
      }
      bind('rolea-btn', ['rolea-pret', 'rolea-avans', 'rolea-luni', 'rolea-dobanda', 'rolea-rezidual'], render); render();
    })();
    (function () { // Rambursare anticipată
      if (!el('roram-btn')) { return; }
      function render() {
        var r = calcRambursare({ sold: el('roram-sold').value, dobandaPct: el('roram-dobanda').value, luniRamase: el('roram-luni').value, sumaRambursata: el('roram-suma').value, mod: el('roram-mod').value });
        var big = el('roram-big'); if (big) { big.textContent = 'Economisești ' + lei(r.economieDobanda); }
        setRows('roram-rows', [['Rata nouă', lei(r.rataNoua)], ['Perioada rămasă', String(r.luniNoi) + ' luni'], ['Economie la dobândă', lei(r.economieDobanda)], ['Comision (max. 1%)', lei(r.comision)]]);
      }
      bind('roram-btn', ['roram-sold', 'roram-dobanda', 'roram-luni', 'roram-suma', 'roram-mod'], render); render();
    })();
    (function () { // Dividende
      if (!el('rodiv-btn')) { return; }
      function render() {
        var r = calcDividende({ dividendeBrute: el('rodiv-brute').value });
        var big = el('rodiv-big'); if (big) { big.textContent = lei(r.totalNet); }
        setRows('rodiv-rows', [['Impozit 16% (reținut la sursă)', lei(r.impozit)], ['Dividende nete', lei(r.net)], ['CASS datorată', lei(r.cass)], ['Rămâne net', lei(r.totalNet)]]);
      }
      bind('rodiv-btn', ['rodiv-brute'], render); render();
    })();
    (function () { // Impozit chirie
      if (!el('roich-btn')) { return; }
      function render() {
        var r = calcImpozitChirie({ chirieLunara: el('roich-lunara').value, luni: el('roich-luni').value });
        var big = el('roich-big'); if (big) { big.textContent = lei(r.net); }
        setRows('roich-rows', [['Venit brut din chirie', lei(r.venitBrut)], ['Venit net (după deducerea 20%)', lei(r.venitNet)], ['Impozit 10%', lei(r.impozit)], ['CASS', lei(r.cass)], ['Rămâne net', lei(r.net)]]);
      }
      bind('roich-btn', ['roich-lunara', 'roich-luni'], render); render();
    })();
    (function () { // Dobândă depozit
      if (!el('rodd-btn')) { return; }
      function render() {
        var r = calcDobandaDepozit({ suma: el('rodd-suma').value, dobandaPct: el('rodd-dobanda').value, luni: el('rodd-luni').value });
        var big = el('rodd-big'); if (big) { big.textContent = lei(r.neta); }
        setRows('rodd-rows', [['Dobânda brută', lei(r.bruta)], ['Impozit 10%', lei(r.impozit)], ['Dobânda netă', lei(r.neta)]]);
      }
      bind('rodd-btn', ['rodd-suma', 'rodd-dobanda', 'rodd-luni'], render); render();
    })();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcTVA: calcTVA, calcCredit: calcCredit, calcDobandaCompusa: calcDobandaCompusa, calcImpozitAuto: calcImpozitAuto, calcLeasing: calcLeasing, calcRambursare: calcRambursare, calcDividende: calcDividende, calcImpozitChirie: calcImpozitChirie, calcDobandaDepozit: calcDobandaDepozit }; }
