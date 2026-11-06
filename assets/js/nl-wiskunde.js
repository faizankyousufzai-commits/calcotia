/* Cirkel, Cijfergemiddelde, Procent, Pythagoras, Driehoek, Breuken, Cilinder, Tangens, Verhoudingen (NL).
   - calcCirkel({ straal }): oppervlakte pi*r^2; omtrek 2*pi*r; diameter 2r.
   - calcCijfergemiddelde({ cijfers: [{cijfer, weging}] }): som(cijfer*weging)/som(weging).
     DOM-versie: tot 5 cijfer/weging-paren.
   - calcProcent({ modus, a, b }): van-getal (a% van b), verandering ((b-a)/a*100),
     verhogen/verlagen (a +/- a*b/100).
   - calcPythagoras({ a, b, c }): ontbrekende zijde via a^2+b^2=c^2.
   - calcDriehoek({ a, b, c }): Heron-oppervlakte; omtrek; hoeken via cosinusregel.
   - calcBreuken({ t1, n1, t2, n2, bewerking }): optellen/aftrekken/vermenigvuldigen/delen,
     vereenvoudigd via ggd; ook decimaal.
   - calcCilinder({ straal, hoogte }): inhoud pi*r^2*h; oppervlakte 2*pi*r*(r+h); omtrek 2*pi*r.
   - calcTangens({ overstaand, aanliggend, hoekGraden }): tan, hoek of schuine zijde.
   - calcVerhouding({ a, b, c }): lost a:b = c:x op (x = b*c/a); vereenvoudigt a:b via ggd.
   Voorbeelden: cirkel r=5 -> opp. 78,54; omtrek 31,42. Pythagoras 3-4 -> 5.
   Procent: 20% van 250 = 50. Breuk: 1/2 + 1/3 = 5/6. Verhouding 2:3 = 4:x -> x=6. */
function r2(n) { return Math.round(n * 100) / 100; }
function ggd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
function calcCirkel(i) {
  var r = Math.max(0, parseFloat(i.straal) || 0);
  return { oppervlakte: r2(Math.PI * r * r), omtrek: r2(2 * Math.PI * r), diameter: r2(2 * r) };
}
function calcCijfergemiddelde(cijfers) {
  var teller = 0, noemer = 0;
  cijfers.forEach(function (c) { var w = parseFloat(c.weging) || 0; var v = parseFloat(c.cijfer); if (!isNaN(v) && w > 0) { teller += v * w; noemer += w; } });
  return { gemiddelde: noemer > 0 ? r2(teller / noemer) : 0, aantal: cijfers.length };
}
function calcProcent(i) {
  var a = parseFloat(i.a) || 0, b = parseFloat(i.b) || 0;
  if (i.modus === 'verandering') { return { resultaat: a !== 0 ? r2((b - a) / a * 100) : 0, eenheid: '%' }; }
  if (i.modus === 'verhogen') { return { resultaat: r2(a * (1 + b / 100)), eenheid: '' }; }
  if (i.modus === 'verlagen') { return { resultaat: r2(a * (1 - b / 100)), eenheid: '' }; }
  return { resultaat: r2(a / 100 * b), eenheid: '' };
}
function calcPythagoras(i) {
  var a = parseFloat(i.a) || 0, b = parseFloat(i.b) || 0, c = parseFloat(i.c) || 0;
  if (c > 0 && a > 0 && b === 0) { return { zijde: 'b', waarde: r2(Math.sqrt(Math.max(0, c * c - a * a))) }; }
  if (c > 0 && b > 0 && a === 0) { return { zijde: 'a', waarde: r2(Math.sqrt(Math.max(0, c * c - b * b))) }; }
  return { zijde: 'c', waarde: r2(Math.sqrt(a * a + b * b)) };
}
function calcDriehoek(i) {
  var a = parseFloat(i.a) || 0, b = parseFloat(i.b) || 0, c = parseFloat(i.c) || 0;
  var s = (a + b + c) / 2;
  var opp = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
  function hoek(x, y, z) { return Math.round(Math.acos(Math.max(-1, Math.min(1, (y * y + z * z - x * x) / (2 * y * z)))) * 180 / Math.PI * 10) / 10; }
  return { oppervlakte: r2(opp), omtrek: r2(a + b + c), hoekA: hoek(a, b, c), hoekB: hoek(b, a, c), hoekC: hoek(c, a, b) };
}
function calcBreuken(i) {
  var t1 = parseInt(i.t1, 10) || 0, n1 = parseInt(i.n1, 10) || 1, t2 = parseInt(i.t2, 10) || 0, n2 = parseInt(i.n2, 10) || 1;
  var t, n;
  if (i.bewerking === 'aftrekken') { t = t1 * n2 - t2 * n1; n = n1 * n2; }
  else if (i.bewerking === 'vermenigvuldigen') { t = t1 * t2; n = n1 * n2; }
  else if (i.bewerking === 'delen') { t = t1 * n2; n = n1 * t2; }
  else { t = t1 * n2 + t2 * n1; n = n1 * n2; }
  if (n < 0) { t = -t; n = -n; }
  var g = ggd(t, n);
  return { teller: t / g, noemer: n / g, decimaal: r2(t / n) };
}
function calcCilinder(i) {
  var r = Math.max(0, parseFloat(i.straal) || 0), h = Math.max(0, parseFloat(i.hoogte) || 0);
  return { inhoud: r2(Math.PI * r * r * h), oppervlakte: r2(2 * Math.PI * r * (r + h)), omtrek: r2(2 * Math.PI * r) };
}
function calcTangens(i) {
  var over = parseFloat(i.overstaand) || 0, aan = parseFloat(i.aanliggend) || 0;
  var hoek = parseFloat(i.hoekGraden);
  if (!isNaN(hoek) && aan > 0 && over === 0) { return { tan: r2(Math.tan(hoek * Math.PI / 180)), hoekGraden: hoek, schuine: r2(aan / Math.cos(hoek * Math.PI / 180)) }; }
  if (aan > 0) { var h = Math.atan(over / aan) * 180 / Math.PI; return { tan: r2(over / aan), hoekGraden: r2(h), schuine: r2(Math.sqrt(over * over + aan * aan)) }; }
  return { tan: 0, hoekGraden: 0, schuine: 0 };
}
function calcVerhouding(i) {
  var a = parseFloat(i.a) || 0, b = parseFloat(i.b) || 0, c = parseFloat(i.c) || 0;
  var g = ggd(Math.round(a), Math.round(b));
  return { x: a !== 0 ? r2(b * c / a) : 0, simpelA: Math.round(a) / g, simpelB: Math.round(b) / g, decimaal: b !== 0 ? r2(a / b) : 0 };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function f2(n) { return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    function wire(prefix, ids, render) {
      var btn = el(prefix + '-btn'); if (!btn) { return; }
      function run() {
        render();
        var res = el(prefix + '-result');
        if (res) { res.classList.add('show'); }
      }
      btn.addEventListener('click', run);
      ids.forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', run); f.addEventListener('change', run); } });
      run();
    }
    wire('nlcir', ['nlcir-straal'], function () {
      var r = calcCirkel({ straal: el('nlcir-straal').value });
      el('nlcir-big').textContent = f2(r.oppervlakte) + ' cm²';
      el('nlcir-rows').innerHTML = '<tr><td>Oppervlakte</td><td>' + f2(r.oppervlakte) + ' cm²</td></tr><tr><td>Omtrek</td><td>' + f2(r.omtrek) + ' cm</td></tr><tr><td>Diameter</td><td>' + f2(r.diameter) + ' cm</td></tr>';
    });
    wire('nlcij', ['nlcij-1', 'nlcij-w1', 'nlcij-2', 'nlcij-w2', 'nlcij-3', 'nlcij-w3', 'nlcij-4', 'nlcij-w4', 'nlcij-5', 'nlcij-w5'], function () {
      var cijfers = [];
      for (var k = 1; k <= 5; k++) { cijfers.push({ cijfer: el('nlcij-' + k).value, weging: el('nlcij-w' + k).value }); }
      var r = calcCijfergemiddelde(cijfers);
      el('nlcij-big').textContent = f2(r.gemiddelde);
      el('nlcij-rows').innerHTML = '<tr><td>Gewogen gemiddelde</td><td>' + f2(r.gemiddelde) + '</td></tr>';
    });
    wire('nlpro', ['nlpro-modus', 'nlpro-a', 'nlpro-b'], function () {
      var r = calcProcent({ modus: el('nlpro-modus').value, a: el('nlpro-a').value, b: el('nlpro-b').value });
      el('nlpro-big').textContent = f2(r.resultaat) + (r.eenheid || '');
      el('nlpro-rows').innerHTML = '<tr><td>Resultaat</td><td>' + f2(r.resultaat) + (r.eenheid || '') + '</td></tr>';
    });
    wire('nlpyt', ['nlpyt-a', 'nlpyt-b', 'nlpyt-c'], function () {
      var r = calcPythagoras({ a: el('nlpyt-a').value, b: el('nlpyt-b').value, c: el('nlpyt-c').value });
      el('nlpyt-big').textContent = f2(r.waarde) + ' cm';
      el('nlpyt-rows').innerHTML = '<tr><td>Ontbrekende zijde (' + r.zijde + ')</td><td>' + f2(r.waarde) + ' cm</td></tr>';
    });
    wire('nldri', ['nldri-a', 'nldri-b', 'nldri-c'], function () {
      var r = calcDriehoek({ a: el('nldri-a').value, b: el('nldri-b').value, c: el('nldri-c').value });
      el('nldri-big').textContent = f2(r.oppervlakte) + ' cm²';
      el('nldri-rows').innerHTML = '<tr><td>Oppervlakte (Heron)</td><td>' + f2(r.oppervlakte) + ' cm²</td></tr><tr><td>Omtrek</td><td>' + f2(r.omtrek) + ' cm</td></tr><tr><td>Hoeken</td><td>' + f2(r.hoekA) + '° / ' + f2(r.hoekB) + '° / ' + f2(r.hoekC) + '°</td></tr>';
    });
    wire('nlbre', ['nlbre-t1', 'nlbre-n1', 'nlbre-t2', 'nlbre-n2', 'nlbre-bewerking'], function () {
      var r = calcBreuken({ t1: el('nlbre-t1').value, n1: el('nlbre-n1').value, t2: el('nlbre-t2').value, n2: el('nlbre-n2').value, bewerking: el('nlbre-bewerking').value });
      el('nlbre-big').textContent = r.teller + '/' + r.noemer;
      el('nlbre-rows').innerHTML = '<tr><td>Vereenvoudigde breuk</td><td>' + r.teller + '/' + r.noemer + '</td></tr><tr><td>Decimaal getal</td><td>' + f2(r.decimaal) + '</td></tr>';
    });
    wire('nlcil', ['nlcil-straal', 'nlcil-hoogte'], function () {
      var r = calcCilinder({ straal: el('nlcil-straal').value, hoogte: el('nlcil-hoogte').value });
      el('nlcil-big').textContent = f2(r.inhoud) + ' cm³';
      el('nlcil-rows').innerHTML = '<tr><td>Inhoud</td><td>' + f2(r.inhoud) + ' cm³</td></tr><tr><td>Totale oppervlakte</td><td>' + f2(r.oppervlakte) + ' cm²</td></tr><tr><td>Omtrek</td><td>' + f2(r.omtrek) + ' cm</td></tr>';
    });
    wire('nltan', ['nltan-over', 'nltan-aan', 'nltan-hoek'], function () {
      var r = calcTangens({ overstaand: el('nltan-over').value, aanliggend: el('nltan-aan').value, hoekGraden: el('nltan-hoek').value });
      el('nltan-big').textContent = f2(r.tan);
      el('nltan-rows').innerHTML = '<tr><td>Tangens</td><td>' + f2(r.tan) + '</td></tr><tr><td>Hoek</td><td>' + f2(r.hoekGraden) + '°</td></tr><tr><td>Schuine zijde</td><td>' + f2(r.schuine) + ' cm</td></tr>';
    });
    wire('nlverh', ['nlverh-a', 'nlverh-b', 'nlverh-c'], function () {
      var r = calcVerhouding({ a: el('nlverh-a').value, b: el('nlverh-b').value, c: el('nlverh-c').value });
      el('nlverh-big').textContent = 'x = ' + f2(r.x);
      el('nlverh-rows').innerHTML = '<tr><td>Onbekende x</td><td>' + f2(r.x) + '</td></tr><tr><td>Vereenvoudigde verhouding</td><td>' + r.simpelA + ' : ' + r.simpelB + '</td></tr><tr><td>Decimale waarde (a/b)</td><td>' + f2(r.decimaal) + '</td></tr>';
    });
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcCirkel: calcCirkel, calcCijfergemiddelde: calcCijfergemiddelde, calcProcent: calcProcent, calcPythagoras: calcPythagoras, calcDriehoek: calcDriehoek, calcBreuken: calcBreuken, calcCilinder: calcCilinder, calcTangens: calcTangens, calcVerhouding: calcVerhouding }; }
