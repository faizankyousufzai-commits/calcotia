/* Calcotia PL — Finanse (finance) cluster engine.
   Pure functions + DOM registration. Polish 2026 figures used are
   stated as assumptions on the pages (SZACUNEK): VAT 23%/8%/5%/0%,
   PIT 12% do 120 000 zł i 32% powyżej, kwota wolna 30 000 zł,
   podatek Belki 19%, akcyza 3,1% / 18,6%, składka zdrowotna 9%.
   Node-testable via module.exports. */
(function () {
  var root = typeof window !== 'undefined' ? window : globalThis;
  root.PL_CALCS = root.PL_CALCS || {};
  var C = root.PL_CALCS;
  function r2(x) { return Math.round(x * 100) / 100; }

  C.loan = function (i) {
    var kw = i.kwota || 0, r = (i.oprocentowanie || 0) / 100 / 12, n = i.miesiace || 0;
    var rata = n > 0 && r > 0 ? kw * r / (1 - Math.pow(1 + r, -n)) : (n > 0 ? kw / n : 0);
    var calk = rata * n;
    return { rata: r2(rata), calkowity: r2(calk), odsetki: r2(calk - kw) };
  };

  C.leasing = function (i) {
    var wart = i.wartosc || 0, wpl = i.wplata || 0, n = i.miesiace || 0, wykup = i.wykup || 0, r = (i.oprocentowanie || 0) / 100 / 12;
    var fin = wart - wpl;
    var rata = n > 0 && r > 0 ? (fin - wykup / Math.pow(1 + r, n)) * r / (1 - Math.pow(1 + r, -n)) : (n > 0 ? (fin - wykup) / n : 0);
    return { rata: r2(rata), calkowity: r2(wpl + rata * n + wykup), odsetki: r2(wpl + rata * n + wykup - wart) };
  };

  C.vat = function (i) {
    var netto = i.netto || 0, stawka = i.stawka || 23;
    var vat = netto * stawka / 100;
    return { vat: r2(vat), brutto: r2(netto + vat) };
  };

  C.compound = function (i) {
    var k = i.kapital || 0, r = (i.stopa || 0) / 100, lata = i.lata || 0, cz = i.czestotliwosc || 1;
    var fv = k * Math.pow(1 + r / cz, cz * lata);
    return { przyszla: r2(fv), odsetki: r2(fv - k) };
  };

  C.simple_interest = function (i) {
    var k = i.kapital || 0, r = (i.stopa || 0) / 100, lata = i.lata || 0;
    var od = k * r * lata;
    return { odsetki: r2(od), razem: r2(k + od) };
  };

  C.discount = function (i) {
    var cena = i.cena || 0, rab = i.rabat || 0;
    var kwota = cena * rab / 100;
    return { rabat_kwota: r2(kwota), po_rabacie: r2(cena - kwota) };
  };

  C.percent = function (i) {
    var w = i.wartosc || 0, p = i.procent || 0;
    return { czesc: r2(w * p / 100), po_dodaniu: r2(w * (1 + p / 100)), po_odjeciu: r2(w * (1 - p / 100)) };
  };

  C.stock_return = function (i) {
    var kupno = i.kupno || 0, sprzedaz = i.sprzedaz || 0, ilosc = i.ilosc || 1, dyw = i.dywidenda || 0;
    var zysk = (sprzedaz - kupno) * ilosc + dyw;
    var podatek = zysk > 0 ? zysk * 0.19 : 0;
    var stopa = kupno > 0 ? (sprzedaz - kupno) / kupno * 100 : 0;
    return { zysk: r2(zysk), podatek: r2(podatek), na_reke: r2(zysk - podatek), stopa: r2(stopa) };
  };

  C.pension = function (i) {
    var brutto = i.brutto || 0;
    var zdrow = brutto * 0.09;
    var podstawa = Math.max(0, brutto - zdrow);
    var pit = Math.max(0, podstawa * 0.12 - 300);
    return { zdrowotna: r2(zdrow), pit: r2(pit), netto: r2(brutto - zdrow - pit) };
  };

  C.pit = function (i) {
    var doch = i.dochod || 0;
    var podstawa = Math.max(0, doch - 30000);
    var pit = podstawa <= 120000 ? podstawa * 0.12 : 120000 * 0.12 + (podstawa - 120000) * 0.32;
    var pit2 = Math.max(0, pit - 3600);
    return { podstawa: r2(podstawa), pit: r2(pit2), netto: r2(doch - pit2), efektywna: doch > 0 ? r2(pit2 / doch * 100) : 0 };
  };

  C.notary = function (i) {
    var w = i.wartosc || 0;
    var taksa;
    if (w <= 3000) taksa = 100;
    else if (w <= 10000) taksa = 100 + (w - 3000) * 0.03;
    else if (w <= 30000) taksa = 310 + (w - 10000) * 0.02;
    else if (w <= 60000) taksa = 710 + (w - 30000) * 0.01;
    else if (w <= 1000000) taksa = 1010 + (w - 60000) * 0.004;
    else if (w <= 2000000) taksa = 4770 + (w - 1000000) * 0.002;
    else taksa = 6770;
    taksa = Math.min(taksa, 10000);
    return { taksa: r2(taksa), vat: r2(taksa * 0.23), razem: r2(taksa * 1.23) };
  };

  C.excise = function (i) {
    var wart = i.wartosc || 0, poj = i.pojemnosc || 0;
    var stawka = poj > 2000 ? 18.6 : 3.1;
    return { stawka: stawka, akcyza: r2(wart * stawka / 100) };
  };

  C.depreciation = function (i) {
    var w = i.wartosc || 0, lata = i.lata || 0;
    var roczna = lata > 0 ? w / lata : 0;
    return { roczna: r2(roczna), miesieczna: r2(roczna / 12), stawka: lata > 0 ? r2(100 / lata) : 0 };
  };

  C.b2b_net = function (i) {
    var netto = i.netto || 0, vat = i.stawka_vat || 23, pit = i.pit || 12, zus = i.zus || 0;
    var vat_kw = netto * vat / 100;
    var podst = Math.max(0, netto - zus);
    var pit_kw = podst * pit / 100;
    return { vat: r2(vat_kw), brutto: r2(netto + vat_kw), pit: r2(pit_kw), na_reke: r2(netto - zus - pit_kw) };
  };

  C.donation = function (i) {
    var pod = i.podatek || 0;
    return { darowizna: r2(pod * 0.015), kwota: r2(pod * 0.015) };
  };

  C.subsidy = function (i) {
    var ha = i.hektary || 0, stawka = i.stawka || 0;
    return { doplata: r2(ha * stawka) };
  };

  C.flight_comp = function (i) {
    var d = i.dystans || 0;
    var kwota = d <= 1500 ? 250 : d <= 3500 ? 400 : 600;
    return { kwota: kwota, waluta: 'EUR (250, 400 lub 600 zależnie od dystansu)' };
  };

  C.allegro = function (i) {
    var cena = i.cena || 0, prow = i.prowizja || 10;
    var p = cena * prow / 100;
    return { prowizja: r2(p), na_reke: r2(cena - p) };
  };

  C.savings_goal = function (i) {
    var cel = i.cel || 0, mies = i.miesiecznie || 0;
    var m = mies > 0 ? cel / mies : 0;
    return { miesiace: Math.ceil(m), lata: r2(m / 12) };
  };

  C.property_tax = function (i) {
    var m2 = i.powierzchnia || 0, stawka = i.stawka || 0;
    return { podatek: r2(m2 * stawka), miesiecznie: r2(m2 * stawka / 12) };
  };

  C.property_sale_tax = function (i) {
    var sprzedaz = i.sprzedaz || 0, kupno = i.kupno || 0, lata = i.lata || 0;
    var zysk = Math.max(0, sprzedaz - kupno);
    var pit = lata >= 5 ? 0 : zysk * 0.19;
    return { zysk: r2(zysk), pit: r2(pit), na_reke: r2(sprzedaz - pit) };
  };

  C.fx_diff = function (i) {
    var kw = i.kwota || 0, k1 = i.kurs1 || 0, k2 = i.kurs2 || 0;
    return { roznica: r2(kw * (k2 - k1)), wartosc1: r2(kw * k1), wartosc2: r2(kw * k2) };
  };

  C.import_car = function (i) {
    var cena = i.cena || 0, transp = i.transport || 0, poj = i.pojemnosc || 0;
    var clo = cena * 0.10;
    var akcyza = (cena + clo) * (poj > 2000 ? 0.186 : 0.031);
    var vat = (cena + clo + akcyza) * 0.23;
    return { clo: r2(clo), akcyza: r2(akcyza), vat: r2(vat), razem: r2(cena + transp + clo + akcyza + vat) };
  };

  C.car_damage = function (i) {
    var napr = i.naprawa || 0, amort = i.amortyzacja || 0;
    var ods = napr * (1 - amort / 100);
    return { odszkodowanie: r2(ods), potracenie: r2(napr - ods) };
  };

  C.bond = function (i) {
    var nom = i.nominal || 0, oproc = i.oprocentowanie || 0, lata = i.lata || 0;
    var od = nom * oproc / 100 * lata;
    var pod = od * 0.19;
    return { odsetki: r2(od), podatek: r2(pod), na_reke: r2(od - pod) };
  };

  C.oc = function (i) {
    var baza = i.baza || 800, znizki = i.znizki || 0, podwyzka = i.podwyzka || 0;
    var skladka = baza * (1 - znizki / 100) * (1 + podwyzka / 100);
    return { skladka: r2(skladka), miesiecznie: r2(skladka / 12) };
  };

  C.gas_cost = function (i) {
    var m3 = i.m3 || 0, cena = i.cena || 0;
    return { koszt: r2(m3 * cena), kwh: r2(m3 * 11.1) };
  };

  C.electricity = function (i) {
    var kwh = i.kwh || 0, cena = i.cena || 0;
    return { koszt: r2(kwh * cena), dziennie: r2(kwh * cena / 30) };
  };

  C.water_heating = function (i) {
    var litry = i.litry || 0, t1 = i.t1 || 10, t2 = i.t2 || 55, cena = i.cena || 0;
    var kwh = litry * 4.186 * (t2 - t1) / 3600;
    return { kwh: r2(kwh), koszt: r2(kwh * cena) };
  };

  C.gold = function (i) {
    var waga = i.waga || 0, proba = i.proba || 585, cena = i.cena || 0;
    return { wartosc: r2(waga * proba / 1000 * cena), czyste_zloto: r2(waga * proba / 1000) };
  };

  C.rent = function (i) {
    var czynsz = i.czynsz || 0, oplaty = i.oplaty || 0;
    return { miesiecznie: r2(czynsz + oplaty), rocznie: r2((czynsz + oplaty) * 12), kaucja: r2(czynsz * (i.kaucja_mies || 1)) };
  };

  C.water_usage = function (i) {
    var m3 = i.m3 || 0, cena = i.cena || 0;
    return { koszt: r2(m3 * cena), litry: Math.round(m3 * 1000) };
  };

  C.currency = function (i) {
    var kw = i.kwota || 0, kurs = i.kurs || 0;
    return { wynik: r2(kw * kurs) };
  };

  C.bik = function (i) {
    var terminowosc = i.terminowosc || 80, zapytania = i.zapytania || 0, historia = i.historia || 5;
    var score = Math.round(300 + terminowosc * 4 + historia * 20 - zapytania * 15);
    score = Math.max(0, Math.min(1000, score));
    var ocena = score < 500 ? 'Niski' : score < 700 ? 'Średni' : 'Wysoki';
    return { score: score, ocena: ocena };
  };

  C.mortgage_cap = function (i) {
    var doch = i.dochod || 0, wydatki = i.wydatki || 0, r = (i.oprocentowanie || 0) / 100 / 12, n = i.miesiace || 0;
    var rata_max = Math.max(0, (doch - wydatki) * 0.4);
    var kwota = r > 0 && n > 0 ? rata_max * (1 - Math.pow(1 + r, -n)) / r : rata_max * n;
    return { rata_max: r2(rata_max), kwota_max: r2(kwota) };
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PL_CALCS: C };
  }
})();
