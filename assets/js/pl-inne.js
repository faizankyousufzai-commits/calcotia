/* Calcotia PL — Inne + Daty i czas (misc & dates) cluster engine.
   Pure functions + DOM registration. Fun tools (miłość, wielbłądy,
   ascendent, numerologia) are labelled as zabawa on their pages.
   Lottery odds use the published Totalizator Sportowy formats.
   Node-testable via module.exports. */
(function () {
  var root = typeof window !== 'undefined' ? window : globalThis;
  root.PL_CALCS = root.PL_CALCS || {};
  var C = root.PL_CALCS;
  function r2(x) { return Math.round(x * 100) / 100; }
  function parseDate(s) { var d = new Date(String(s) + 'T00:00:00'); return isNaN(d) ? null : d; }
  function fmtDate(d) { return d.toISOString().slice(0, 10); }
  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

  C.age = function (i) {
    var b = parseDate(i.urodzenie); if (!b) return { lata: 0, miesiace: 0, dni: 0, nastepne: '—' };
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var dni = daysBetween(b, now);
    var next = new Date(b); next.setFullYear(now.getFullYear());
    if (next < now) next.setFullYear(now.getFullYear() + 1);
    return { lata: Math.floor(dni / 365.25), miesiace: Math.floor(dni / 30.44), dni: dni, nastepne: fmtDate(next) };
  };

  C.months_diff = function (i) {
    var a = parseDate(i.od), b = parseDate(i.do); if (!a || !b) return { miesiace: 0, tygodnie: 0, dni: 0 };
    var dni = daysBetween(a, b);
    return { miesiace: r2(dni / 30.44), tygodnie: Math.floor(dni / 7), dni: dni };
  };

  var PL_HOLIDAYS_2026 = ['2026-01-01', '2026-01-06', '2026-04-06', '2026-05-01', '2026-06-04', '2026-06-11', '2026-08-15', '2026-11-01', '2026-11-11', '2026-12-25', '2026-12-26'];
  C.workdays = function (i) {
    var a = parseDate(i.od), b = parseDate(i.do); if (!a || !b) return { robocze: 0, dni: 0, weekendy: 0 };
    var rob = 0, we = 0, cur = new Date(a);
    while (cur <= b) {
      var dw = cur.getDay();
      var iso = fmtDate(cur);
      if (dw === 0 || dw === 6) we++;
      else if (PL_HOLIDAYS_2026.indexOf(iso) === -1) rob++;
      cur = new Date(cur.getTime() + 86400000);
    }
    return { robocze: rob, dni: daysBetween(a, b) + 1, weekendy: we };
  };

  C.download = function (i) {
    var mb = i.rozmiar || 0, mbps = i.predkosc || 0;
    var sek = mbps > 0 ? mb * 8 / mbps : 0;
    return { sekundy: Math.round(sek), minuty: r2(sek / 60), godziny: r2(sek / 3600) };
  };

  C.kw_hp = function (i) {
    var kw = i.kw || 0, km = i.km || 0;
    return { km_z_kw: r2(kw * 1.35962), kw_z_km: km > 0 ? r2(km / 1.35962) : r2(kw) };
  };

  C.pesel = function (i) {
    var p = String(i.pesel || '').replace(/\D/g, '');
    if (p.length !== 11) return { poprawny: 'PESEL musi mieć 11 cyfr', data: '—', plec: '—' };
    var w = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
    var sum = 0; for (var k = 0; k < 10; k++) sum += (+p[k]) * w[k];
    var kontrolna = (10 - (sum % 10)) % 10;
    var ok = kontrolna === (+p[10]);
    var m = +p.substr(2, 2), rok = 1900 + (+p.substr(0, 2));
    if (m > 20 && m < 33) { rok += 100; m -= 20; }
    else if (m > 40 && m < 53) { rok -= 100; m -= 40; }
    else if (m > 80) { rok -= 200; m -= 80; }
    var data = String(rok) + '-' + String(m).padStart(2, '0') + '-' + p.substr(4, 2);
    return { poprawny: ok ? 'Poprawny' : 'Niepoprawny (zła cyfra kontrolna)', data: data, plec: (+p[9]) % 2 === 0 ? 'Kobieta' : 'Mężczyzna' };
  };

  var ZODIAC = [[120, 'Wodnik'], [219, 'Ryby'], [321, 'Baran'], [420, 'Byk'], [521, 'Bliźnięta'], [621, 'Rak'], [723, 'Lew'], [823, 'Panna'], [923, 'Waga'], [1023, 'Skorpion'], [1122, 'Strzelec'], [1222, 'Koziorożec']];
  C.zodiac = function (i) {
    var d = parseDate(i.data); if (!d) return { znak: '—' };
    var key = (d.getMonth() + 1) * 100 + d.getDate();
    var znak = 'Koziorożec';
    ZODIAC.forEach(function (z) { if (key >= z[0]) znak = z[1]; });
    if (key < 120) znak = 'Koziorożec';
    return { znak: znak };
  };

  C.numerology = function (i) {
    var d = parseDate(i.data); if (!d) return { liczba: 0 };
    var s = String(d.getFullYear()) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    var n = 0; s.split('').forEach(function (c) { n += +c; });
    while (n > 9 && n !== 11 && n !== 22) { n = String(n).split('').reduce(function (a, c) { return a + (+c); }, 0); }
    return { liczba: n };
  };

  C.love = function (i) {
    var s = String(i.imie1 || '') + String(i.imie2 || '');
    var h = 0; for (var k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) % 1000;
    return { zgodnosc: (h % 71) + 30, uwaga: 'Zabawa, nie pomiar naukowy' };
  };

  C.iq = function (i) {
    var um = i.umyslowy || 0, chr = i.chronologiczny || 0;
    var iq = chr > 0 ? um / chr * 100 : 0;
    var kat = iq < 70 ? 'Poniżej przeciętnej' : iq < 85 ? 'Poniżej średniej' : iq <= 115 ? 'Przeciętna' : iq <= 130 ? 'Powyżej średniej' : 'Wysoka';
    return { iq: Math.round(iq), kat: kat };
  };

  C.dog_years = function (i) {
    var wiek = i.wiek || 0, waga = i.waga || 0;
    var ludzkie = wiek <= 0 ? 0 : wiek === 1 ? 15 : wiek === 2 ? 24 : 24 + (wiek - 2) * (waga > 25 ? 5.5 : 4.5);
    return { ludzkie: r2(ludzkie) };
  };

  C.seats = function (i) {
    var glosy = i.glosy || 0, razem = i.razem || 0, mandaty = i.mandaty || 0;
    var proc = razem > 0 ? glosy / razem * 100 : 0;
    return { procent: r2(proc), mandaty_szac: Math.round(mandaty * proc / 100), prog: proc >= 5 ? 'Powyżej progu 5%' : 'Poniżej progu 5%' };
  };

  C.aquarium = function (i) {
    var d = i.dlugosc || 0, s = i.szerokosc || 0, w = i.wysokosc || 0;
    var l = d * s * w / 1000;
    return { litry: r2(l), waga: Math.round(l), ryby: Math.floor(l / 5) };
  };

  C.ascendant = function (i) {
    var godz = i.godzina || 12;
    var znaki = ['Baran', 'Byk', 'Bliźnięta', 'Rak', 'Lew', 'Panna', 'Waga', 'Skorpion', 'Strzelec', 'Koziorożec', 'Wodnik', 'Ryby'];
    var idx = Math.floor(((godz + 2) % 24) / 2);
    return { znak: znaki[idx], uwaga: 'Szacunek — dokładny ascendent wymaga godziny i miejsca urodzenia' };
  };

  C.ballistic = function (i) {
    var m = (i.masa || 0) / 1000, v = i.predkosc || 0;
    var e = 0.5 * m * v * v;
    return { energia: r2(e), energia_kgm: r2(e / 9.81) };
  };

  C.barf = function (i) {
    var w = i.waga || 0, proc = i.procent || 2.5;
    var dzienne = w * proc / 100 * 1000;
    return { dziennie_g: Math.round(dzienne), miesnie: Math.round(dzienne * 0.8), kosci: Math.round(dzienne * 0.1) };
  };

  C.dog_food = function (i) {
    var w = i.waga || 0;
    var dzienne = 70 * Math.pow(w, 0.75) * 1.6 / 3.5;
    return { dziennie_g: Math.round(dzienne), na_posilek: Math.round(dzienne / 2) };
  };

  C.wedding_cake = function (i) {
    var g = i.goscie || 0;
    return { porcje: g, kg: r2(g * 0.15), pietra: Math.max(1, Math.ceil(g / 50)) };
  };

  C.expiry = function (i) {
    var s = parseDate(i.produkcja); if (!s) return { waznosc: '—' };
    return { waznosc: fmtDate(new Date(s.getTime() + (i.dni || 30) * 86400000)) };
  };

  C.ethanol = function (i) {
    var obj = i.objetosc || 0, z = i.z || 0, do_ = i.do || 0;
    var spir = obj * do_ / z;
    return { spirytus_ml: Math.round(spir), woda_ml: Math.round(obj - spir) };
  };

  C.fps = function (i) {
    var m = (i.masa || 0) / 1000, fps = i.fps || 0;
    var v = fps * 0.3048;
    return { energia: r2(0.5 * m * v * v), predkosc_ms: r2(v) };
  };

  C.keno = function (i) {
    var stawka = i.stawka || 0, traf = i.trafienia || 0;
    var mnoznik = [0, 0, 0, 1, 5, 20, 100, 500, 2000, 10000, 50000][traf] || 0;
    return { wygrana: r2(stawka * mnoznik), mnoznik: mnoznik };
  };

  C.lotto = function (i) {
    var stawka = i.stawka || 0;
    return { szansa: '1 do 13 983 816', wygrana_min: r2(stawka * 3), kumulacja: 'zależy od kumulacji' };
  };

  C.taxi = function (i) {
    var km = i.km || 0, start = i.start || 8, km_stawka = i.stawka || 3;
    return { koszt: r2(start + km * km_stawka), nocny: r2((start + km * km_stawka) * 1.5) };
  };

  C.liqueur = function (i) {
    var alk = i.alkohol || 0, cukier = i.cukier || 0;
    return { cukier_g: Math.round(alk * 0.3), woda_ml: Math.round(alk * 0.5), razem_ml: Math.round(alk * 1.5) };
  };

  C.eliquid = function (i) {
    var baza = i.baza || 0, nik = i.nikotyna || 0, docelowa = i.docelowa || 0;
    var ml_nik = docelowa > 0 ? baza * docelowa / nik : 0;
    return { baza_nikotynowa_ml: r2(ml_nik), baza_bez_ml: r2(baza - ml_nik) };
  };

  C.beer_carb = function (i) {
    var l = i.litry || 0, co2 = i.co2 || 2.2;
    return { cukier_g: Math.round(l * co2 * 4), drozdze: 'szczypta na butelkę' };
  };

  C.nalewka = function (i) {
    var ow = i.owoce || 0;
    return { cukier_g: Math.round(ow * 0.4), alkohol_ml: Math.round(ow * 1.2), czas_tygodnie: 6 };
  };

  C.party_drinks = function (i) {
    var g = i.goscie || 0, h = i.godziny || 0;
    var piwo = g * h * 0.5, wino = g * h * 0.2, bezalk = g * h * 0.5;
    return { piwo_l: r2(piwo), wino_l: r2(wino), bezalkoholowe_l: r2(bezalk) };
  };

  C.curing = function (i) {
    var mieso = i.mieso || 0;
    return { sol_g: Math.round(mieso * 0.02), sol_peklujaca_g: Math.round(mieso * 0.018), woda_ml: Math.round(mieso * 1) };
  };

  C.beer_wedding = function (i) {
    var g = i.goscie || 0, h = i.godziny || 0;
    var l = g * h * 0.4;
    return { litry: Math.round(l), skrzynki: Math.ceil(l / 10), beczki30: Math.ceil(l / 30) };
  };

  C.pizza = function (i) {
    var osoby = i.osoby || 0;
    return { maka_g: Math.round(osoby * 200), woda_ml: Math.round(osoby * 120), drozdze_g: Math.round(osoby * 2), ser_g: Math.round(osoby * 100) };
  };

  C.sugar_syrup = function (i) {
    var cukier = i.cukier || 0, woda = i.woda || 0;
    var total = cukier + woda;
    return { objetosc_ml: Math.round(total * 0.85), stezenie: total > 0 ? r2(cukier / total * 100) : 0 };
  };

  C.camels = function (i) {
    var wiek = i.wiek || 0, wzrost = i.wzrost || 0;
    var n = Math.round(10 + wiek * 0.8 + (wzrost - 160) * 0.2);
    return { wielblady: Math.max(1, n), uwaga: 'Zabawa, nie wycena' };
  };

  C.sowing = function (i) {
    var pow = i.powierzchnia || 0, norma = i.norma || 0;
    return { nasiona_kg: r2(pow * norma / 10000), na_m2: r2(norma / 10000) };
  };

  C.service_cost = function (i) {
    var baza = i.baza || 0, ilosc = i.ilosc || 1, dodatek = i.dodatek || 0;
    return { koszt: r2(baza * ilosc + dodatek), miesiecznie: r2(baza * ilosc + dodatek) };
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PL_CALCS: C, parseDate: parseDate, daysBetween: daysBetween };
  }
})();
