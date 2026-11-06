/* Calcotia PL — Budownictwo (construction) cluster engine.
   Pure functions + DOM registration. Quantities use standard
   construction maths; unit prices come from the user (inputs), so no
   price is fabricated. Densities: stal 7850 kg/m3, beton 2400 kg/m3,
   piasek 1600 kg/m3, kruszywo 1700 kg/m3. Node-testable. */
(function () {
  var root = typeof window !== 'undefined' ? window : globalThis;
  root.PL_CALCS = root.PL_CALCS || {};
  var C = root.PL_CALCS;
  function r2(x) { return Math.round(x * 100) / 100; }

  C.concrete = function (i) {
    var d = i.dlugosc || 0, s = i.szerokosc || 0, g = i.grubosc || 0;
    var m3 = d * s * g / 100;
    return { m3: r2(m3), worki25: Math.ceil(m3 * 350 / 25), waga: Math.round(m3 * 2400) };
  };

  C.concrete_mix = function (i) {
    var m3 = i.m3 || 0;
    return { cement: Math.round(m3 * 350), piasek: r2(m3 * 0.6), kruszywo: r2(m3 * 1.1), woda: Math.round(m3 * 175) };
  };

  C.paint = function (i) {
    var pow = i.powierzchnia || 0, wyd = i.wydajnosc || 10, warstwy = i.warstwy || 2;
    var litry = pow / wyd * warstwy;
    return { litry: r2(litry), puszki5: Math.ceil(litry / 5), puszki10: Math.ceil(litry / 10) };
  };

  C.tiles = function (i) {
    var pow = i.powierzchnia || 0, a = i.a || 0, b = i.b || 0, zapas = i.zapas || 10;
    var szt = a > 0 && b > 0 ? pow / (a * b / 10000) : 0;
    var total = Math.ceil(szt * (1 + zapas / 100));
    return { sztuki: total, bez_zapasu: Math.ceil(szt), m2_z_zapasem: r2(pow * (1 + zapas / 100)) };
  };

  C.steel_weight = function (i, p) {
    var dl = i.dlugosc || 0, przekroj = i.przekroj || 0;
    var kg_m = przekroj * 7850 / 1000000;
    return { kg_m: r2(kg_m), waga: r2(kg_m * dl) };
  };

  C.wood = function (i) {
    var dl = i.dlugosc || 0, a = i.a || 0, b = i.b || 0, ilosc = i.ilosc || 1;
    var m3 = dl * a * b / 1000000 * ilosc;
    return { m3: r2(m3), sztuki: ilosc, waga: Math.round(m3 * 600) };
  };

  C.beams = function (i) {
    var dl = i.dlugosc || 0, rozstaw = i.rozstaw || 0.6;
    var n = rozstaw > 0 ? Math.ceil(dl / rozstaw) + 1 : 0;
    return { liczba: n, rozstaw_cm: Math.round(rozstaw * 100) };
  };

  C.roof = function (i) {
    var d = i.dlugosc || 0, s = i.szerokosc || 0, kat = (i.kat || 0) * Math.PI / 180;
    var pow = d * s / Math.cos(kat);
    return { powierzchnia: r2(pow), polaci: r2(pow / 2) };
  };

  C.aggregate = function (i) {
    var m3 = i.m3 || 0, gest = i.gestosc || 1700;
    return { tony: r2(m3 * gest / 1000), worki25: Math.ceil(m3 * gest / 25) };
  };

  C.fence = function (i) {
    var dl = i.dlugosc || 0, rozstaw = i.rozstaw || 2.5;
    var slupki = Math.ceil(dl / rozstaw) + 1;
    return { slupki: slupki, przela: slupki - 1, siatka_m: r2(dl) };
  };

  C.floor_heating = function (i) {
    var pow = i.powierzchnia || 0, rozstaw = i.rozstaw || 0.15;
    var rury = pow / rozstaw;
    return { rury_m: Math.round(rury), moc: Math.round(pow * 80), obiegow: Math.max(1, Math.ceil(rury / 100)) };
  };

  C.floor_panels = function (i) {
    var pow = i.powierzchnia || 0, opak = i.opakowanie || 2;
    var op = Math.ceil(pow * 1.07 / opak);
    return { opakowania: op, m2_z_zapasem: r2(pow * 1.07) };
  };

  C.ceiling = function (i) {
    var pow = i.powierzchnia || 0;
    return { plyty: Math.ceil(pow / 0.36), profile_m: Math.round(pow * 2.5), wieszaki: Math.ceil(pow * 1.5) };
  };

  C.wallpaper = function (i) {
    var pow = i.powierzchnia || 0, rolka = i.rolka || 5;
    return { rolki: Math.ceil(pow * 1.1 / rolka), m2_z_zapasem: r2(pow * 1.1) };
  };

  C.styrofoam = function (i) {
    var pow = i.powierzchnia || 0, plyta = i.plyta || 0.5;
    return { plyty: Math.ceil(pow * 1.05 / plyta), opakowania: Math.ceil(pow * 1.05 / plyta / 10) };
  };

  C.screed = function (i) {
    var pow = i.powierzchnia || 0, grub = i.grubosc || 0;
    var m3 = pow * grub / 100;
    return { m3: r2(m3), worki25: Math.ceil(m3 * 2000 / 25) };
  };

  C.epoxy = function (i) {
    var pow = i.powierzchnia || 0, grub = i.grubosc || 0;
    var kg = pow * grub * 1.1;
    return { kg: r2(kg), opakowania5: Math.ceil(kg / 5) };
  };

  C.coal = function (i) {
    var pow = i.powierzchnia || 0, zuzycie = i.zuzycie || 0;
    return { tony: r2(pow * zuzycie / 1000), kg_dziennie: r2(pow * zuzycie / 1000 / 180 * 1000) };
  };

  C.pv = function (i) {
    var kwp = i.kwp || 0, koszt = i.koszt || 0, cena = i.cena || 0;
    var prod = kwp * 1000;
    var oszcz = prod * cena;
    return { produkcja: Math.round(prod), oszczednosc: r2(oszcz), zwrot_lat: oszcz > 0 ? r2(koszt / oszcz) : 0 };
  };

  C.thermo = function (i) {
    var koszt = i.koszt || 0, oszcz = i.oszczednosc || 0;
    var ulga = Math.min(koszt * 0.19, 53000);
    return { ulga: r2(ulga), zwrot_lat: oszcz > 0 ? r2((koszt - ulga) / oszcz) : 0, koszt_po_uldze: r2(koszt - ulga) };
  };

  C.insulation = function (i) {
    var u = i.u || 0, lambda = i.lambda || 0.04;
    var grub = u > 0 ? lambda / u * 100 : 0;
    return { grubosc_cm: r2(grub), grubosc_m: r2(grub / 100) };
  };

  C.radiator = function (i) {
    var pow = i.powierzchnia || 0, wys = i.wysokosc || 2.6, wsp = i.wspolczynnik || 100;
    var moc = pow * wsp * (wys / 2.6);
    return { moc: Math.round(moc), liczba: Math.max(1, Math.ceil(moc / 1500)) };
  };

  C.pipes = function (i) {
    var sr = (i.srednica || 0) / 1000, dl = i.dlugosc || 0;
    var obj = Math.PI * sr * sr / 4 * dl;
    return { objetosc_l: r2(obj * 1000), waga: r2(obj * 7850) };
  };

  C.stairs = function (i) {
    var wys = i.wysokosc || 0, stop = i.stopien || 0;
    var n = stop > 0 ? Math.round(wys / stop) : 0;
    var dl = n * (i.glebokosc || 0.25);
    return { liczba_stopni: n, wysokosc_stopnia: n > 0 ? r2(wys / n * 100) : 0, dlugosc_biegu: r2(dl) };
  };

  C.dew_point = function (i) {
    var t = i.temperatura || 0, rh = i.wilgotnosc || 0;
    var a = 17.27, b = 237.7;
    var alfa = (a * t) / (b + t) + Math.log(rh / 100);
    var td = (b * alfa) / (a - alfa);
    return { punkt_rosy: r2(td) };
  };

  C.acoustic = function (i) {
    var obj = i.objetosc || 0, alfa = i.alfa || 0.1, pow = i.powierzchnia || 0;
    var rt = (alfa * pow) > 0 ? 0.161 * obj / (alfa * pow) : 0;
    return { czas_poglosu: r2(rt) };
  };

  C.sheet_metal = function (i) {
    var d = i.dlugosc || 0, s = i.szerokosc || 0, g = i.grubosc || 0;
    var waga = d * s * g * 7.85;
    return { waga: r2(waga), powierzchnia: r2(d * s) };
  };

  C.build_cost = function (i) {
    var pow = i.powierzchnia || 0, stawka = i.stawka || 0;
    return { koszt: r2(pow * stawka), za_m2: r2(stawka) };
  };

  C.grout = function (i) {
    var pow = i.powierzchnia || 0, szer = i.szerokosc || 0;
    var kg = pow * (1 + szer / 100);
    return { kg: r2(kg), opakowania5: Math.ceil(kg / 5) };
  };

  C.tolerance = function (i) {
    var wym = i.wymiar || 0, klasa = i.klasa || 7;
    var it = [25, 39, 62, 100, 160, 250, 400][(klasa - 7)] || 25;
    return { odchyka_um: it, gorna: r2(wym + it / 2000), dolna: r2(wym - it / 2000) };
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PL_CALCS: C };
  }
})();
