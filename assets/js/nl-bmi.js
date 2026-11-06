/* BMI Calculator + BMI Kind Calculator (NL).
   API: calcBMI({ lengteCm, gewichtKg })
   - BMI = gewicht / lengte^2 (lengte in meter).
   - Categorieen (WHO, volwassenen): <18,5 ondergewicht; 18,5-24,9 gezond;
     25-29,9 overgewicht; >=30 obesitas.
   - Gezond gewichtsbereik bij 18,5 en 24,9.
   Voor kinderen geldt de BMI alleen samen met een groeidiagram (percentiel
   naar leeftijd en geslacht); de pagina zegt dit expliciet.
   Voorbeeld: 180 cm, 80 kg -> BMI 24,69 (gezond), bereik 59,9-80,7 kg. */
function calcBMI(input) {
  var lengteM = Math.max(0, parseFloat(input.lengteCm) || 0) / 100;
  var gewicht = Math.max(0, parseFloat(input.gewichtKg) || 0);
  function r2(n) { return Math.round(n * 100) / 100; }
  if (lengteM <= 0 || gewicht <= 0) {
    return { bmi: 0, categorie: '', gezondMin: 0, gezondMax: 0 };
  }
  var bmi = gewicht / (lengteM * lengteM);
  var cat = bmi < 18.5 ? 'Ondergewicht' : bmi < 25 ? 'Gezond gewicht' : bmi < 30 ? 'Overgewicht' : 'Obesitas';
  return { bmi: r2(bmi), categorie: cat, gezondMin: r2(18.5 * lengteM * lengteM), gezondMax: r2(24.9 * lengteM * lengteM) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function fmt(n) { return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    function fmt1(n) { return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n); }
    function bind(prefix) {
      var btn = el(prefix + '-btn'); if (!btn) { return; }
      function render() {
        var r = calcBMI({ lengteCm: el(prefix + '-lengte') ? el(prefix + '-lengte').value : 0,
          gewichtKg: el(prefix + '-gewicht') ? el(prefix + '-gewicht').value : 0 });
        var big = el(prefix + '-big'); if (!big) { return; }
        big.textContent = r.bmi > 0 ? fmt(r.bmi) : '–';
        var rows = el(prefix + '-rows'); if (!rows) { return; }
        rows.innerHTML = '<tr><td>BMI</td><td>' + (r.bmi > 0 ? fmt(r.bmi) : '–') + '</td></tr>' +
          '<tr><td>Categorie</td><td>' + (r.categorie || '–') + '</td></tr>' +
          '<tr><td>Gezond gewicht (BMI 18,5–24,9)</td><td>' + fmt1(r.gezondMin) + ' – ' + fmt1(r.gezondMax) + ' kg</td></tr>';
      
      var res = el(prefix + '-result'); if (res) { res.classList.add('show'); }
}
      btn.addEventListener('click', render);
      [prefix + '-lengte', prefix + '-gewicht'].forEach(function (id) {
        var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); }
      });
      render();
    }
    bind('nlbmi'); bind('nlbmik');
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcBMI: calcBMI }; }
