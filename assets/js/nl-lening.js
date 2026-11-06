/* Hypotheek Calculator + Lening Calculator (NL) — annuiteit.
   API: calcAnnuiteit({ bedrag, rentePct, maanden, type })
   - Maandlast annuiteit: P x r / (1 - (1+r)^-n), r = jaarrente/12.
   - Lineair: aflossing P/n + rente over restschuld; eerste maandlast getoond.
   - Totale rente = maandlast x n - P (annuiteit).
   Voorbeeld: EUR 300.000, 4%, 360 maanden -> maandlast 1.432,25; totale rente 215.609.
   Voorbeeld lening: EUR 10.000, 8%, 48 maanden -> maandlast 244,13. */
function calcAnnuiteit(i) {
  var P = Math.max(0, parseFloat(i.bedrag) || 0);
  var r = Math.max(0, parseFloat(i.rentePct) || 0) / 100 / 12;
  var n = Math.max(1, parseInt(i.maanden, 10) || 1);
  function r2(x) { return Math.round(x * 100) / 100; }
  var maandlast, totaleRente;
  if (i.type === 'lineair') {
    maandlast = P / n + P * r;
    totaleRente = r * P * (n + 1) / 2;
  } else {
    maandlast = r === 0 ? P / n : P * r / (1 - Math.pow(1 + r, -n));
    totaleRente = maandlast * n - P;
  }
  return { maandlast: r2(maandlast), totaleRente: r2(totaleRente), totaal: r2(maandlast * n), laatsteMaandlast: i.type === 'lineair' ? r2(P / n + (P / n) * r) : r2(maandlast) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function eur(n) { return '€ ' + new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    function wire(prefix) {
      var btn = el(prefix + '-btn'); if (!btn) { return; }
      function render() {
        var r = calcAnnuiteit({ bedrag: el(prefix + '-bedrag').value, rentePct: el(prefix + '-rente').value, maanden: el(prefix + '-maanden').value, type: el(prefix + '-type') ? el(prefix + '-type').value : 'annuiteit' });
        el(prefix + '-big').textContent = eur(r.maandlast) + ' per maand';
        el(prefix + '-rows').innerHTML = '<tr><td>Maandlast</td><td>' + eur(r.maandlast) + '</td></tr><tr><td>Totale rente</td><td>' + eur(r.totaleRente) + '</td></tr><tr><td>Totaal te betalen</td><td>' + eur(r.totaal) + '</td></tr>';
      }
      btn.addEventListener('click', render);
      [prefix + '-bedrag', prefix + '-rente', prefix + '-maanden', prefix + '-type'].forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); } });
      render();
    }
    wire('nlhyp'); wire('nllen');
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcAnnuiteit: calcAnnuiteit }; }
