/* Calcotia PL — Praca i prawo (work & law) cluster engine.
   Polish 2026 figures are simplified models, labelled SZACUNEK on
   the pages: ZUS pracownika 13,71% (9,76 + 1,5 + 2,45), PIT 12% do
   120 000 zł i 32% powyżej, kwota wolna 30 000 zł, składka zdrowotna
   9%, płaca minimalna 4 806 zł, dieta krajowa 45 zł, zasiłek 80%.
   Node-testable via module.exports. */
(function () {
  var root = typeof window !== 'undefined' ? window : globalThis;
  root.PL_CALCS = root.PL_CALCS || {};
  var C = root.PL_CALCS;
  function r2(x) { return Math.round(x * 100) / 100; }
  function parseDate(s) { var d = new Date(String(s) + 'T00:00:00'); return isNaN(d) ? null : d; }
  function fmtDate(d) { return d.toISOString().slice(0, 10); }
  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

  C.salary_net = function (i) {
    var brutto = i.brutto || 0;
    var zus = brutto * 0.1371;
    var zdrow = (brutto - zus) * 0.09;
    var koszty = i.koszty || 250;
    var podstRoczna = Math.max(0, (brutto - zus - koszty) * 12);
    var pitRoczny = podstRoczna <= 120000 ? Math.max(0, podstRoczna * 0.12 - 3600) : 120000 * 0.12 - 3600 + (podstRoczna - 120000) * 0.32;
    var pit = pitRoczny / 12;
    var netto = brutto - zus - zdrow - pit;
    return { zus: r2(zus), zdrowotna: r2(zdrow), pit: r2(pit), netto: r2(netto), rocznie: r2(netto * 12) };
  };

  C.salary_de = function (i) {
    var brutto = i.brutto || 0;
    var skladki = brutto * (i.skladki || 20) / 100;
    var podatek = brutto * (i.podatek || 15) / 100;
    return { skladki: r2(skladki), podatek: r2(podatek), netto: r2(brutto - skladki - podatek) };
  };

  C.overtime = function (i) {
    var stawka = i.stawka || 0, godz = i.godziny || 0, dod = i.dodatek || 50;
    var dod_kw = stawka * godz * dod / 100;
    return { dodatek: r2(dod_kw), podstawa: r2(stawka * godz), razem: r2(stawka * godz + dod_kw) };
  };

  C.holiday_equiv = function (i) {
    var pensja = i.pensja || 0, dni = i.dni || 0, wsp = i.wspolczynnik || 21;
    var dzienna = pensja / wsp;
    return { dzienna: r2(dzienna), ekwiwalent: r2(dzienna * dni) };
  };

  C.severance_pl = function (i) {
    var pensja = i.pensja || 0, staz = i.staz || 0;
    var mies = staz < 2 ? 1 : staz <= 8 ? 2 : 3;
    var odp = Math.min(pensja * mies, 72090);
    return { miesiace: mies, odprawa: r2(odp), limit: 72090 };
  };

  C.sick_pay = function (i) {
    var podst = i.podstawa || 0, dni = i.dni || 0, proc = i.procent || 80;
    var dzienna = podst / 30;
    return { dzienna: r2(dzienna), zasilek: r2(dzienna * dni * proc / 100) };
  };

  C.employer_cost = function (i) {
    var brutto = i.brutto || 0;
    var zus_p = brutto * 0.2048;
    return { zus_pracodawca: r2(zus_p), koszt: r2(brutto + zus_p), procent: 20.48 };
  };

  C.worktime = function (i) {
    var dziennie = i.dziennie || 8, dni = i.dni || 0;
    var mies = dziennie * dni;
    return { miesiecznie: r2(mies), tygodniowo: r2(dziennie * 5), rocznie: r2(mies * 12) };
  };

  C.per_diem = function (i) {
    var dni = i.dni || 0, dieta = i.dieta || 45, nocleg = i.nocleg || 0;
    return { diety: r2(dni * dieta), noclegi: r2(dni * nocleg), razem: r2(dni * (dieta + nocleg)) };
  };

  C.mileage = function (i) {
    var km = i.km || 0, stawka = i.stawka || 1.15;
    return { zwrot: r2(km * stawka) };
  };

  C.notice = function (i) {
    var staz = i.staz || 0;
    var okres = staz < 0.5 ? '2 tygodnie' : staz < 3 ? '1 miesiąc' : '3 miesiące';
    return { okres: okres };
  };

  C.benefit_period = function (i) {
    var s = parseDate(i.start); if (!s) return { koniec: '—' };
    var dni = i.dni || 182;
    return { koniec: fmtDate(new Date(s.getTime() + dni * 86400000)), dni: dni };
  };

  C.pensum = function (i) {
    var etat = i.etat || 1, godziny = i.godziny || 18;
    return { pensum: r2(etat * godziny), godziny_tyg: r2(etat * 40) };
  };

  C.pfron = function (i) {
    var etaty = i.etaty || 0, niep = i.niepelnosprawni || 0, przec = i.przecietne || 8000;
    var wymagane = etaty * 0.06;
    var brak = Math.max(0, wymagane - niep);
    return { wymagane: r2(wymagane), brakujace: r2(brak), wplata: r2(brak * przec * 0.405) };
  };

  C.seniority = function (i) {
    var s = parseDate(i.start); if (!s) return { lata: 0, miesiace: 0, dni: 0 };
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var dni = daysBetween(s, now);
    return { lata: Math.floor(dni / 365), miesiace: Math.floor(dni / 30.44), dni: dni };
  };

  C.offer_binding = function (i) {
    var s = parseDate(i.data); if (!s) return { termin: '—' };
    return { termin: fmtDate(new Date(s.getTime() + (i.dni || 30) * 86400000)) };
  };

  C.maternity = function (i) {
    var s = parseDate(i.porod); if (!s) return { koniec_macierzynskiego: '—', koniec_rodzicielskiego: '—' };
    return { koniec_macierzynskiego: fmtDate(new Date(s.getTime() + 140 * 86400000)), koniec_rodzicielskiego: fmtDate(new Date(s.getTime() + (140 + 224) * 86400000)) };
  };

  C.parental = function (i) {
    var mies = i.miesiace || 0;
    return { max_miesiace: 36, wykorzystane: mies, pozostalo: Math.max(0, 36 - mies) };
  };

  C.productivity = function (i) {
    var j = i.jednostki || 0, g = i.godziny || 0;
    return { na_godzine: g > 0 ? r2(j / g) : 0, na_dzien: g > 0 ? r2(j / g * 8) : 0 };
  };

  C.thirteenth = function (i) {
    var pensja = i.pensja || 0, mies = i.miesiace || 12;
    return { trzynasta: r2(pensja * mies / 12) };
  };

  C.alimony = function (i) {
    var doch = i.dochod || 0, dzieci = i.dzieci || 1;
    var proc = dzieci === 1 ? 20 : dzieci === 2 ? 30 : 40;
    return { procent: proc, kwota: r2(doch * proc / 100), na_dziecko: r2(doch * proc / 100 / dzieci) };
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PL_CALCS: C, parseDate: parseDate, daysBetween: daysBetween };
  }
})();
