/* Calcotia PL — Matematyka + Fizyka (maths & physics) cluster engine.
   Pure functions + DOM registration. Standard maths/physics formulas
   only; no legal or money figures. Node-testable via module.exports. */
(function () {
  var root = typeof window !== 'undefined' ? window : globalThis;
  root.PL_CALCS = root.PL_CALCS || {};
  var C = root.PL_CALCS;
  function r2(x) { return Math.round(x * 100) / 100; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }

  C.length_convert = function (i, p) {
    var v = i.wartosc || 0, from = i.z || 'cm', to = i.do || 'm';
    var F = { mm: 0.001, cm: 0.01, m: 1, km: 1000, cal: 0.0254, stopa: 0.3048, jard: 0.9144, mila: 1609.34 };
    var m = v * (F[from] || 1);
    return { wynik: r2(m / (F[to] || 1)), w_metrach: r2(m) };
  };

  C.temp_convert = function (i) {
    var v = i.wartosc || 0, z = i.z || 'C';
    var c = z === 'F' ? (v - 32) * 5 / 9 : z === 'K' ? v - 273.15 : v;
    return { celsjusz: r2(c), fahrenheit: r2(c * 9 / 5 + 32), kelwin: r2(c + 273.15) };
  };

  C.area_rect = function (i) {
    var a = i.a || 0, b = i.b || 0;
    return { pole: r2(a * b), obwod: r2(2 * (a + b)) };
  };

  C.volume = function (i) {
    var a = i.a || 0, b = i.b || 0, c = i.c || 0;
    return { objetosc: r2(a * b * c), litry: r2(a * b * c * 1000) };
  };

  C.circle = function (i) {
    var r = i.promien || 0;
    return { obwod: r2(2 * Math.PI * r), pole: r2(Math.PI * r * r), srednica: r2(2 * r) };
  };

  C.triangle = function (i) {
    var a = i.podstawa || 0, h = i.wysokosc || 0, b = i.bok_b || 0, c = i.bok_c || 0;
    return { pole: r2(a * h / 2), obwod: r2(a + b + c) };
  };

  C.cylinder = function (i) {
    var r = i.promien || 0, h = i.wysokosc || 0;
    return { objetosc: r2(Math.PI * r * r * h), pole: r2(2 * Math.PI * r * (r + h)), litry: r2(Math.PI * r * r * h * 1000) };
  };

  C.quadratic = function (i) {
    var a = i.a || 0, b = i.b || 0, c = i.c || 0;
    if (a === 0) return { delta: 0, x1: b !== 0 ? r2(-c / b) : 0, x2: b !== 0 ? r2(-c / b) : 0, wierzcholek_x: 0 };
    var d = b * b - 4 * a * c;
    var vx = -b / (2 * a), vy = c - b * b / (4 * a);
    if (d < 0) return { delta: r2(d), x1: 'brak (zespolone)', x2: 'brak (zespolone)', wierzcholek_x: r2(vx), wierzcholek_y: r2(vy) };
    var s = Math.sqrt(d);
    return { delta: r2(d), x1: r2((-b + s) / (2 * a)), x2: r2((-b - s) / (2 * a)), wierzcholek_x: r2(vx), wierzcholek_y: r2(vy) };
  };

  C.trig = function (i) {
    var kat = (i.kat || 0) * Math.PI / 180;
    return { sinus: r2(Math.sin(kat)), cosinus: r2(Math.cos(kat)), tangens: r2(Math.tan(kat)) };
  };

  C.power_math = function (i) {
    var a = i.podstawa || 0, n = i.wykladnik || 0;
    return { wynik: r2(Math.pow(a, n)), odwrotnosc: a !== 0 ? r2(1 / a) : 0 };
  };

  C.roots = function (i) {
    var a = i.liczba || 0, n = i.stopien || 2;
    return { wynik: r2(Math.pow(a, 1 / n)), kwadratowy: r2(Math.sqrt(Math.max(0, a))) };
  };

  C.fractions = function (i) {
    var a = i.licznik1 || 0, b = i.mianownik1 || 1, c = i.licznik2 || 0, d = i.mianownik2 || 1, dz = i.dzialanie || '+';
    var n, m;
    if (dz === '+') { n = a * d + c * b; m = b * d; }
    else if (dz === '-') { n = a * d - c * b; m = b * d; }
    else if (dz === '*') { n = a * c; m = b * d; }
    else { n = a * d; m = b * c; }
    var g = gcd(n, m); n /= g; m /= g;
    if (m < 0) { n = -n; m = -m; }
    return { licznik: n, mianownik: m, dziesietnie: m !== 0 ? r2(n / m) : 0 };
  };

  C.proportion = function (i) {
    var a = i.a || 0, b = i.b || 0, c = i.c || 0;
    return { x: a !== 0 ? r2(b * c / a) : 0 };
  };

  function parseList(s) {
    return String(s || '').split(/[;,\s]+/).map(function (x) { return parseFloat(x); }).filter(function (x) { return !isNaN(x); });
  }
  C.average = function (i) {
    var xs = parseList(i.liczby);
    if (!xs.length) return { srednia: 0, mediana: 0, suma: 0, liczba: 0 };
    var s = xs.reduce(function (a, b) { return a + b; }, 0);
    var sorted = xs.slice().sort(function (a, b) { return a - b; });
    var med = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
    return { srednia: r2(s / xs.length), mediana: r2(med), suma: r2(s), liczba: xs.length };
  };

  C.stddev = function (i) {
    var xs = parseList(i.liczby);
    if (!xs.length) return { srednia: 0, odchylenie: 0 };
    var m = xs.reduce(function (a, b) { return a + b; }, 0) / xs.length;
    var v = xs.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / xs.length;
    return { srednia: r2(m), odchylenie: r2(Math.sqrt(v)), wariancja: r2(v) };
  };

  C.grade_avg = function (i) {
    var oceny = parseList(i.oceny), wagi = parseList(i.wagi);
    if (!oceny.length) return { srednia: 0 };
    var s = 0, sw = 0;
    oceny.forEach(function (o, k) { var w = wagi[k] || 1; s += o * w; sw += w; });
    return { srednia: r2(s / sw), suma_wag: sw };
  };

  C.lcm_gcd = function (i) {
    var a = Math.round(i.a || 0), b = Math.round(i.b || 0);
    var g = gcd(a, b);
    return { nwd: g, nww: g === 0 ? 0 : Math.abs(a * b) / g };
  };

  var ROMAN = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  C.roman = function (i) {
    var n = Math.round(i.liczba || 0);
    if (n < 1 || n > 3999) return { rzymskie: 'poza zakresem 1–3999', liczba: n };
    var out = '', x = n;
    ROMAN.forEach(function (p) { while (x >= p[0]) { out += p[1]; x -= p[0]; } });
    return { rzymskie: out, liczba: n };
  };

  C.matrix2 = function (i) {
    var a = i.a11 || 0, b = i.a12 || 0, c = i.a21 || 0, d = i.a22 || 0;
    var det = a * d - b * c;
    return { wyznacznik: r2(det), slad: r2(a + d), odwrotna: det !== 0 ? '1/' + det + ' × [[d, -b], [-c, a]]' : 'macierz nieodwracalna' };
  };

  C.pythagoras = function (i) {
    var a = i.a || 0, b = i.b || 0;
    return { przeciwprostokatna: r2(Math.sqrt(a * a + b * b)) };
  };

  C.diagonal = function (i) {
    var a = i.a || 0, b = i.b || 0, c = i.c || 0;
    var d2 = Math.sqrt(a * a + b * b);
    return { przekatna: r2(d2), przestrzenna: c > 0 ? r2(Math.sqrt(a * a + b * b + c * c)) : r2(d2) };
  };

  C.scale = function (i) {
    var real = i.rzeczywisty || 0, skala = i.skala || 100;
    return { na_rysunku: r2(real * 100 / skala), w_cm: r2(real * 100 / skala) };
  };

  C.speed = function (i) {
    var d = i.dystans || 0, t = i.czas || 0;
    return { predkosc: t > 0 ? r2(d / t) : 0, kmh: t > 0 ? r2(d / t) : 0, czas_min: d > 0 && (i.predkosc || 0) > 0 ? r2(d / (i.predkosc || 1) * 60) : 0 };
  };

  C.force = function (i) {
    var m = i.masa || 0, a = i.przyspieszenie || 0;
    return { sila: r2(m * a), ciezar: r2(m * 9.81) };
  };

  C.power_elec = function (i) {
    var u = i.napiecie || 0, pr = i.prad || 0;
    return { moc: r2(u * pr), opor: pr > 0 ? r2(u / pr) : 0 };
  };

  C.ohms = function (i) {
    var u = i.napiecie || 0, pr = i.prad || 0, r = i.opor || 0;
    return { napiecie: r2(pr * r), prad: r > 0 ? r2(u / r) : 0, opor: pr > 0 ? r2(u / pr) : 0, moc: r2(u * pr) };
  };

  C.resistor = function (i) {
    var r1 = i.r1 || 0, r2v = i.r2 || 0;
    return { szeregowo: r2(r1 + r2v), rownolegle: (r1 + r2v) > 0 ? r2(r1 * r2v / (r1 + r2v)) : 0 };
  };

  C.cable = function (i) {
    var prad = i.prad || 0, dl = i.dlugosc || 0;
    var przekroj = Math.ceil(prad / 6 * 10) / 10;
    var spadek = r2(2 * dl * prad * 0.0175 / Math.max(0.1, przekroj));
    return { przekroj: przekroj, spadek_napiecia: spadek };
  };

  C.voltage_drop = function (i) {
    var prad = i.prad || 0, dl = i.dlugosc || 0, przek = i.przekroj || 1.5;
    var spadek = 2 * dl * prad * 0.0175 / przek;
    return { spadek: r2(spadek), procent: r2(spadek / 230 * 100) };
  };

  C.subnet = function (i) {
    var mask = i.maska || 24;
    var hosty = Math.pow(2, 32 - mask) - 2;
    return { hosty: hosty, adresy: Math.pow(2, 32 - mask), maska: mask };
  };

  C.fuel = function (i) {
    var d = i.dystans || 0, spal = i.spalanie || 0, cena = i.cena || 0;
    var litry = d * spal / 100;
    return { litry: r2(litry), koszt: r2(litry * cena), na_100km: r2(spal) };
  };

  C.ev_charging = function (i) {
    var poj = i.pojemnosc || 0, moc = i.moc || 0, od = i.od || 20, do_ = i.do || 80;
    var kwh = poj * (do_ - od) / 100;
    return { kwh: r2(kwh), godziny: moc > 0 ? r2(kwh / moc) : 0, minuty: moc > 0 ? Math.round(kwh / moc * 60) : 0 };
  };

  C.battery = function (i) {
    var poj = i.pojemnosc || 0, pobor = i.pobor || 0;
    return { godziny: pobor > 0 ? r2(poj / pobor) : 0, minuty: pobor > 0 ? Math.round(poj / pobor * 60) : 0 };
  };

  C.psu = function (i) {
    var cpu = i.cpu || 0, gpu = i.gpu || 0, inne = i.inne || 100;
    var pobor = cpu + gpu + inne;
    return { pobor: Math.round(pobor), zalecany: Math.round(pobor * 1.3 / 50) * 50 };
  };

  C.matura = function (i) {
    var pkt = i.punkty || 0, max = i.max || 100;
    var proc = max > 0 ? pkt / max * 100 : 0;
    var ocena = proc >= 90 ? 'celujący' : proc >= 75 ? 'bardzo dobry' : proc >= 55 ? 'dobry' : proc >= 40 ? 'dostateczny' : proc >= 30 ? 'dopuszczający' : 'niedostateczny';
    return { procent: r2(proc), ocena: ocena, zdane: proc >= 30 ? 'Zdane' : 'Niezdane' };
  };

  C.liceum_points = function (i) {
    var egz = i.egzamin || 0, oceny = i.oceny || 0, dodatkowe = i.dodatkowe || 0;
    var suma = egz + oceny + dodatkowe;
    return { suma: Math.round(suma), max: 200 };
  };

  C.attendance = function (i) {
    var ob = i.obecnosci || 0, nie = i.nieobecnosci || 0;
    var total = ob + nie;
    return { frekwencja: total > 0 ? r2(ob / total * 100) : 0, razem: total };
  };

  C.interpolation = function (i) {
    var x1 = i.x1 || 0, y1 = i.y1 || 0, x2 = i.x2 || 0, y2 = i.y2 || 0, x = i.x || 0;
    var y = x2 !== x1 ? y1 + (x - x1) * (y2 - y1) / (x2 - x1) : y1;
    return { y: r2(y) };
  };

  C.ldm = function (i) {
    var dl = i.dlugosc || 0, sz = i.szerokosc || 0;
    return { ldm: r2(dl * sz / 2.4), m2: r2(dl * sz) };
  };

  C.tire_pressure = function (i) {
    var zal = i.zalecane || 0, akt = i.aktualne || 0;
    return { roznica: r2(akt - zal), psi: r2(akt * 14.5), ocena: akt < zal - 0.2 ? 'Za niskie — dopompuj' : akt > zal + 0.2 ? 'Za wysokie — spuść trochę' : 'Prawidłowe' };
  };

  C.time_convert = function (i) {
    var min = i.minuty || 0;
    return { godziny: r2(min / 60), sekundy: Math.round(min * 60), dni: r2(min / 1440) };
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PL_CALCS: C, parseList: parseList, gcd: gcd };
  }
})();
