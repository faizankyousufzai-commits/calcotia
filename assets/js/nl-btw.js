/* BTW Calculator (NL).
   API: calcBTW({ bedrag, tariefPct, inclusief })
   - Exclusief -> inclusief: btw = bedrag x tarief; totaal = bedrag + btw.
   - Inclusief -> exclusief: exclusief = bedrag / (1 + tarief); btw = bedrag - exclusief.
   Tarieven NL 2026: algemeen 21%, verlaagd 9% (o.a. eten, boeken, kappers),
   0% (o.a. export, internationale diensten).
   Voorbeeld: EUR 100 exclusief, 21% -> btw 21, totaal 121. EUR 121 inclusief, 21% -> exclusief 100. */
function calcBTW(i) {
  var bedrag = Math.max(0, parseFloat(i.bedrag) || 0);
  var tarief = Math.max(0, parseFloat(i.tariefPct) || 0) / 100;
  function r(n) { return Math.round(n * 100) / 100; }
  if (i.inclusief) {
    var excl = bedrag / (1 + tarief);
    return { exclusief: r(excl), btw: r(bedrag - excl), inclusief: r(bedrag) };
  }
  return { exclusief: r(bedrag), btw: r(bedrag * tarief), inclusief: r(bedrag * (1 + tarief)) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function eur(n) { return '€ ' + new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    var btn = el('nlbtw-btn'); if (!btn) { return; }
    function render() {
      var r = calcBTW({ bedrag: el('nlbtw-bedrag').value, tariefPct: el('nlbtw-tarief').value, inclusief: el('nlbtw-modus').value === 'inclusief' });
      el('nlbtw-big').textContent = eur(r.inclusief);
      el('nlbtw-rows').innerHTML = '<tr><td>Bedrag exclusief btw</td><td>' + eur(r.exclusief) + '</td></tr><tr><td>Btw</td><td>' + eur(r.btw) + '</td></tr><tr><td>Bedrag inclusief btw</td><td>' + eur(r.inclusief) + '</td></tr>';
    }
    btn.addEventListener('click', render);
    ['nlbtw-bedrag', 'nlbtw-tarief', 'nlbtw-modus'].forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); } });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcBTW: calcBTW }; }
