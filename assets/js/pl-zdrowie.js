/* Calcotia PL — Zdrowie (health) cluster engine.
   Pure functions + DOM registration. Every function takes
   (inputs, params) and returns {key: value} + optional note.
   Money/law figures: none here are legal rates; lab norms are
   orientacyjne (typical laboratory reference ranges) and the pages
   say so. Node-testable via module.exports. */
(function () {
  var root = typeof window !== 'undefined' ? window : globalThis;
  root.PL_CALCS = root.PL_CALCS || {};
  var C = root.PL_CALCS;
  function r2(x) { return Math.round(x * 100) / 100; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  C.bmi = function (i) {
    var h = (i.wzrost || 0) / 100, w = i.waga || 0;
    var bmi = h > 0 ? w / (h * h) : 0;
    var kat = bmi < 18.5 ? 'Niedowaga' : bmi < 25 ? 'Waga prawidłowa' : bmi < 30 ? 'Nadwaga' : 'Otyłość';
    var lo = h > 0 ? 18.5 * h * h : 0, hi = h > 0 ? 24.9 * h * h : 0;
    return { bmi: r2(bmi), kat: kat, min: r2(lo), max: r2(hi) };
  };

  C.bmr = function (i) {
    var w = i.waga || 0, h = i.wzrost || 0, a = i.wiek || 0;
    var plec = i.plec === 'kobieta' ? -161 : 5;
    var bmr = 10 * w + 6.25 * h - 5 * a + plec;
    var akt = i.aktywnosc || 1.55;
    return { bmr: Math.round(bmr), tdee: Math.round(bmr * akt), strata: Math.round(bmr * akt - 500), przyrost: Math.round(bmr * akt + 300) };
  };

  C.bsa = function (i) {
    var w = i.waga || 0, h = i.wzrost || 0;
    var most = (w > 0 && h > 0) ? Math.sqrt(w * h / 3600) : 0;
    var dub = (w > 0 && h > 0) ? 0.007184 * Math.pow(w, 0.425) * Math.pow(h, 0.725) : 0;
    return { mosteller: r2(most), dubois: r2(dub) };
  };

  C.whr = function (i) {
    var w = i.talia || 0, h = i.biodra || 0;
    var whr = h > 0 ? w / h : 0;
    var limit = i.plec === 'kobieta' ? 0.85 : 0.9;
    return { whr: r2(whr), ryzyko: whr > limit ? 'Podwyższone ryzyko' : 'Ryzyko w normie' };
  };

  C.ffmi = function (i) {
    var w = i.waga || 0, h = (i.wzrost || 0) / 100, bf = i.tkanka || 15;
    var lean = w * (1 - bf / 100);
    var ffmi = h > 0 ? lean / (h * h) : 0;
    var norm = ffmi + 6.1 * (1.8 - h);
    return { ffmi: r2(ffmi), norm: r2(norm), beztluszczowa: r2(lean) };
  };

  C.bodyfat = function (i) {
    var h = i.wzrost || 0, w = i.talia || 0, n = i.szyja || 0, b = i.biodra || 0;
    var bf;
    if (i.plec === 'kobieta') bf = 495 / (1.29579 - 0.35004 * Math.log10(w + b - n) + 0.221 * Math.log10(h)) - 450;
    else bf = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
    bf = clamp(bf, 2, 60);
    var fat = (i.waga || 0) * bf / 100;
    return { procent: r2(bf), kg: r2(fat), beztluszczowa: r2((i.waga || 0) - fat) };
  };

  C.water = function (i) {
    var w = i.waga || 0;
    return { ml: Math.round(w * 35), litry: r2(w * 0.035), szklanki: Math.round(w * 35 / 250) };
  };

  C.protein = function (i) {
    var w = i.waga || 0, f = i.wspolczynnik || 1.6;
    return { dziennie: Math.round(w * f), min: Math.round(w * 0.8), posilek: Math.round(w * f / 4) };
  };

  C.keto = function (i) {
    var kcal = i.kalorie || 2000, pb = i.bialko || 20, cb = i.wegle || 5;
    var tb = 100 - pb - cb;
    return { bialko_g: Math.round(kcal * pb / 100 / 4), wegle_g: Math.round(kcal * cb / 100 / 4), tluszcz_g: Math.round(kcal * tb / 100 / 9), tluszcz_pct: tb };
  };

  C.hba1c = function (i) {
    var p = i.hba1c || 0;
    var mmol = 10.93 * p - 23.5;
    var eag = 28.7 * p - 46.7;
    return { mmol: r2(mmol), eag_mg: Math.round(eag), eag_mmol: r2(eag / 18) };
  };

  C.pace = function (i) {
    var d = i.dystans || 0, t = (i.godziny || 0) * 60 + (i.minuty || 0) + (i.sekundy || 0) / 60;
    var tempo = d > 0 ? t / d : 0, kmh = t > 0 ? d / (t / 60) : 0;
    var m = Math.floor(tempo), s = Math.round((tempo - m) * 60);
    if (s === 60) { m += 1; s = 0; }
    return { tempo: m + ':' + String(s).padStart(2, '0'), kmh: r2(kmh), min_km: r2(tempo) };
  };

  C.steps = function (i) {
    var h = i.wzrost || 0, steps = i.kroki || 0, w = i.waga || 0;
    var stride = h * (i.plec === 'kobieta' ? 0.413 : 0.415) / 100;
    var km = steps * stride / 1000;
    var kcal = Math.round(steps * 0.04 * (w / 70));
    var czas = km > 0 ? Math.round(km / 5 * 60) : 0;
    return { km: r2(km), kcal: kcal, minuty: czas, krok_m: r2(stride) };
  };

  C.run_kcal = function (i) {
    var w = i.waga || 0, d = i.dystans || 0;
    return { kcal: Math.round(w * d * 1.036), na_km: Math.round(w * 1.036) };
  };

  C.burn_kcal = function (i) {
    var met = i.met || 8, w = i.waga || 0, min = i.minuty || 0;
    return { kcal: Math.round(met * w * min / 60), na_godzine: Math.round(met * w) };
  };

  C.vo2max = function (i) {
    var d = i.dystans || 0;
    var v = (d - 504.9) / 44.73;
    var kat = v < 30 ? 'Słaba' : v < 40 ? 'Przeciętna' : v < 50 ? 'Dobra' : 'Bardzo dobra';
    return { vo2max: r2(v), kat: kat };
  };

  C.one_rm = function (i) {
    var w = i.ciezar || 0, r = i.powtorzenia || 1;
    var rm = w * (1 + r / 30);
    return { rm: r2(rm), pct80: r2(rm * 0.8), pct60: r2(rm * 0.6) };
  };

  C.wilks = function (i) {
    var x = i.waga || 0, total = i.wynik || 0;
    var co;
    if (i.plec === 'kobieta') co = 500 / (-125.4255398 + 13.71219419 * x - 0.03307250631 * x * x + 0.000433864 * Math.pow(x, 3) - 0.0000022364 * Math.pow(x, 4) + 0.0000000038996 * Math.pow(x, 5));
    else co = 500 / (47.46178854 + 8.472061379 * x + 0.07369410346 * x * x - 0.001395833811 * Math.pow(x, 3) + 0.00000707665973070743 * Math.pow(x, 4) - 0.0000000120804336482315 * Math.pow(x, 5));
    return { punkty: r2(total * co), wspolczynnik: r2(co) };
  };

  C.hr_zones = function (i) {
    var age = i.wiek || 30, rest = i.spoczynkowe || 60;
    var max = Math.round(206.9 - 0.67 * age);
    var hrr = max - rest;
    return { max: max, z2_od: Math.round(rest + 0.6 * hrr), z2_do: Math.round(rest + 0.7 * hrr), z4_od: Math.round(rest + 0.8 * hrr), z4_do: Math.round(rest + 0.9 * hrr) };
  };

  C.sleep = function (i) {
    function mins(t) { var p = String(t || '07:00').split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
    function fmt(m) { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
    var wake = mins(i.pobudka);
    return { c6: fmt(wake - 6 * 90 - 15), c5: fmt(wake - 5 * 90 - 15), c4: fmt(wake - 4 * 90 - 15) };
  };

  C.bp = function (i) {
    var s = i.skurczowe || 0, d = i.rozkurczowe || 0;
    var kat = (s < 120 && d < 80) ? 'Prawidłowe' : (s < 130 && d < 80) ? 'Podwyższone' : (s < 140 || d < 90) ? 'Nadciśnienie I stopnia' : 'Nadciśnienie II stopnia';
    return { kat: kat, puls: s - d };
  };

  C.cholesterol = function (i) {
    var tot = i.calkowity || 0, ldl = i.ldl || 0, hdl = i.hdl || 0;
    var ratio = hdl > 0 ? tot / hdl : 0;
    var kat = ldl < 100 ? 'Optymalny LDL' : ldl < 130 ? 'Bliski optymalnego' : ldl < 160 ? 'Podwyższony LDL' : 'Wysoki LDL';
    return { stosunek: r2(ratio), kat: kat, nie_hdl: Math.round(tot - hdl) };
  };

  C.liver = function (i) {
    var alt = i.alt || 0, ast = i.ast || 0;
    var ratio = alt > 0 ? ast / alt : 0;
    var ocena = ratio < 1 ? 'Wskaźnik de Ritisa poniżej 1 — typowy dla uszkodzenia wątroby' : 'Wskaźnik de Ritisa powyżej 1 — może wskazywać na inne przyczyny';
    return { deritis: r2(ratio), ocena: ocena, alt_norma: alt <= 40 ? 'ALT w normie orientacyjnej' : 'ALT powyżej normy orientacyjnej' };
  };

  C.thyroid = function (i) {
    var tsh = i.tsh || 0, ft4 = i.ft4 || 0;
    var ocena = (tsh >= 0.4 && tsh <= 4.0 && ft4 >= 0.8 && ft4 <= 1.8) ? 'TSH i FT4 w normach orientacyjnych' : (tsh > 4.0 ? 'TSH podwyższone — możliwa niedoczynność tarczycy' : 'Wynik poza normą orientacyjną — skonsultuj z lekarzem');
    return { ocena: ocena, tsh: tsh, ft4: ft4 };
  };

  var HCG = [[3, 5, 50], [4, 5, 426], [5, 18, 7340], [6, 1080, 56500], [8, 7650, 229000], [10, 25700, 288000], [13, 13300, 254000], [17, 4060, 165400], [25, 3640, 117000], [40, 3640, 117000]];
  C.hcg = function (i) {
    var w = i.tydzien || 4, row = HCG[HCG.length - 1];
    for (var k = 0; k < HCG.length; k++) { if (w <= HCG[k][0]) { row = HCG[k]; break; } }
    return { min: row[1], max: row[2], podwojenie: '48–72 godziny' };
  };

  C.child_dose = function (i) {
    var w = i.waga || 0;
    return { paracetamol: Math.min(15 * w, 1000), ibuprofen: Math.min(10 * w, 400), paracetamol_doba: Math.min(60 * w, 4000) };
  };

  C.dose = function (i) {
    var w = i.waga || 0, mgkg = i.dawka || 0, stez = i.stezenie || 0;
    var mg = w * mgkg;
    return { mg: Math.round(mg), ml: stez > 0 ? r2(mg / stez) : 0 };
  };

  C.mg_ml = function (i) {
    var mg = i.mg || 0, ml = i.ml || 0;
    return { stezenie: ml > 0 ? r2(mg / ml) : 0, dawka_ml: mg > 0 ? r2(ml) : 0 };
  };

  C.peptide = function (i) {
    var mg = i.mg || 0, ml = i.ml || 0;
    var mcg_ml = ml > 0 ? mg * 1000 / ml : 0;
    return { mcg_ml: Math.round(mcg_ml), mcg_jednostka: r2(mcg_ml / 100), jednostki_dawka: mcg_ml > 0 ? r2((i.dawka || 250) / (mcg_ml / 100)) : 0 };
  };

  C.milk = function (i) {
    var w = i.waga || 0;
    var dzienne = Math.min(w * 150, 1000);
    return { dzienne: Math.round(dzienne), na_karmienie: Math.round(dzienne / (i.karmienia || 8)) };
  };

  C.baby_weight = function (i) {
    var birth = i.urodzeniowa || 0, m = i.miesiace || 0;
    var oczek = m <= 6 ? birth * (1 + m / 6) : birth * 2 + (m - 6) * 0.35 * birth / 6 * 2;
    if (m <= 6) oczek = birth + (birth * m) / 6;
    else oczek = birth * 2 + (m - 6) * 0.4;
    return { oczekiwana: r2(oczek), przyrost: r2(oczek - birth) };
  };

  C.preg_weight = function (i) {
    var bmi = C.bmi({ waga: i.waga_przed || 0, wzrost: i.wzrost || 0 }).bmi;
    var z = bmi < 18.5 ? [12.5, 18] : bmi < 25 ? [11.5, 16] : bmi < 30 ? [7, 11.5] : [5, 9];
    var tydz = i.tydzien || 20;
    var dotad = tydz <= 13 ? 2 : 2 + (tydz - 13) * (z[1] - 2) / 27;
    return { bmi: r2(bmi), min: z[0], max: z[1], dotad: r2(dotad) };
  };

  function parseDate(s) { var d = new Date(String(s) + 'T00:00:00'); return isNaN(d) ? null : d; }
  function fmtDate(d) { return d.toISOString().slice(0, 10); }
  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

  C.preg_weeks = function (i) {
    var lmp = parseDate(i.ostatnia); if (!lmp) return { tydzien: 0, termin: '—' };
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var days = daysBetween(lmp, now);
    var due = new Date(lmp.getTime() + 280 * 86400000);
    return { tydzien: Math.floor(days / 7), dzien: days % 7, termin: fmtDate(due) };
  };

  C.fertile = function (i) {
    var lmp = parseDate(i.ostatnia); if (!lmp) return { owulacja: '—', plodne_od: '—', plodne_do: '—' };
    var cykl = i.cykl || 28;
    var ow = new Date(lmp.getTime() + (cykl - 14) * 86400000);
    return { owulacja: fmtDate(ow), plodne_od: fmtDate(new Date(ow.getTime() - 5 * 86400000)), plodne_do: fmtDate(new Date(ow.getTime() + 86400000)) };
  };

  C.pregnancy_test = function (i) {
    var ow = parseDate(i.owulacja); if (!ow) return { najwczesniej: '—', pewny: '—' };
    return { najwczesniej: fmtDate(new Date(ow.getTime() + 12 * 86400000)), pewny: fmtDate(new Date(ow.getTime() + 14 * 86400000)) };
  };

  C.child_height = function (i) {
    var o = i.ojciec || 0, m = i.matka || 0;
    var s = i.plec === 'kobieta' ? (o + m - 13) / 2 : (o + m + 13) / 2;
    return { przewidywany: r2(s), min: r2(s - 8.5), max: r2(s + 8.5) };
  };

  var WHO_W = { m: [[0, 3.3], [3, 6.4], [6, 7.9], [9, 8.9], [12, 9.6], [18, 10.9], [24, 12.2], [36, 14.3], [48, 16.3], [60, 18.3]], k: [[0, 3.2], [3, 5.8], [6, 7.3], [9, 8.2], [12, 8.9], [18, 10.2], [24, 11.5], [36, 13.9], [48, 15.9], [60, 18.2]] };
  C.percentile_bmi = function (i) {
    var h = (i.wzrost || 0) / 100, w = i.waga || 0;
    var bmi = h > 0 ? w / (h * h) : 0;
    var tab = i.plec === 'kobieta' ? WHO_W.k : WHO_W.m;
    var mies = i.miesiace || 12, med = tab[tab.length - 1][1];
    for (var k = 0; k < tab.length; k++) { if (mies <= tab[k][0]) { med = tab[k][1]; break; } }
    return { bmi: r2(bmi), mediana: med, roznica: r2(w - med) };
  };

  C.promile = function (i) {
    var ml = i.ml || 0, pct = i.procent || 0, w = i.waga || 0, h = i.godziny || 0;
    var g = ml * pct / 100 * 0.789;
    var r = i.plec === 'kobieta' ? 0.6 : 0.7;
    var bac = w > 0 ? g / (w * r) : 0;
    var po = Math.max(0, bac - 0.12 * h);
    return { gramy: r2(g), promile: r2(bac), po_czasie: r2(po) };
  };

  C.alcohol_kcal = function (i) {
    var ml = i.ml || 0, pct = i.procent || 0;
    var g = ml * pct / 100 * 0.789;
    return { kcal: Math.round(g * 7), gramy: r2(g) };
  };

  C.nutrition = function (i) {
    var por = i.porcja || 100;
    var b = (i.bialko || 0) * por / 100, t = (i.tluszcz || 0) * por / 100, w = (i.wegle || 0) * por / 100;
    return { kcal: Math.round(4 * b + 9 * t + 4 * w), bialko: r2(b), tluszcz: r2(t), wegle: r2(w) };
  };

  C.vitamins = function (i) {
    var d = i.plec === 'kobieta' ? 15 : 15;
    return { wit_d: d, wit_c: i.plec === 'kobieta' ? 75 : 90, wapn: 1000, zelazo: i.plec === 'kobieta' ? 18 : 8 };
  };

  C.morp_hgb = function (i) {
    var hgb = i.hgb || 0;
    var lo = i.plec === 'kobieta' ? 12 : 14, hi = i.plec === 'kobieta' ? 16 : 18;
    var ocena = hgb < lo ? 'Poniżej normy orientacyjnej' : hgb > hi ? 'Powyżej normy orientacyjnej' : 'W normie orientacyjnej';
    return { ocena: ocena, norma_od: lo, norma_do: hi };
  };

  C.bloodgroup = function (i) {
    var m = i.matka || '0', o = i.ojciec || '0';
    var tab = { '0+0': '0', '0+A': '0 lub A', '0+B': '0 lub B', '0+AB': 'A lub B', 'A+A': 'A lub 0', 'A+B': 'A, B, AB lub 0', 'A+AB': 'A, B lub AB', 'B+B': 'B lub 0', 'B+AB': 'A, B lub AB', 'AB+AB': 'A, B lub AB' };
    var key = [m, o].sort().join('+');
    return { mozliwe: tab[key] || 'A, B, AB lub 0', rh: 'Rh zależy od rodziców — dziecko Rh- jest możliwe tylko, gdy oboje rodzice mają Rh-' };
  };

  C.gender_chinese = function (i) {
    var wiek = i.wiek || 25, mies = i.miesiac || 1;
    var s = (wiek * 31 + mies * 7) % 2;
    return { wynik: s === 0 ? 'Dziewczynka' : 'Chłopiec', uwaga: 'Zabawa, nie metoda medyczna' };
  };

  var WONDER = [5, 8, 12, 19, 26, 37, 46, 55, 64, 75];
  C.wonder_weeks = function (i) {
    var b = parseDate(i.urodzenie); if (!b) return { aktualny: '—', nastepny: '—' };
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var weeks = Math.floor(daysBetween(b, now) / 7);
    var cur = null, nxt = null;
    WONDER.forEach(function (w) { if (weeks >= w - 1 && weeks <= w + 1) cur = w; if (w > weeks && nxt === null) nxt = w; });
    return { tygodnie: weeks, aktualny: cur === null ? 'Brak skoku w tym tygodniu' : 'Skok w ' + cur + ' tygodniu', nastepny: nxt === null ? 'Wszystkie skoki za Tobą' : 'Skok w ' + nxt + ' tygodniu' };
  };

  C.blood_donation = function (i) {
    var last = parseDate(i.ostatnie); if (!last) return { nastepne: '—' };
    var dni = i.plec === 'kobieta' ? 84 : 56;
    return { nastepne: fmtDate(new Date(last.getTime() + dni * 86400000)), dni: dni };
  };

  C.bra = function (i) {
    var pod = i.pod_biustem || 0, w = i.w_biuscie || 0;
    var obwod = Math.round(pod / 5) * 5;
    var diff = w - pod;
    var miska = diff < 12 ? 'AA' : diff < 14 ? 'A' : diff < 16 ? 'B' : diff < 18 ? 'C' : diff < 20 ? 'D' : diff < 22 ? 'E' : diff < 24 ? 'F' : 'G';
    return { rozmiar: obwod + miska, obwod: obwod, miska: miska };
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PL_CALCS: C, parseDate: parseDate, daysBetween: daysBetween };
  }
})();
