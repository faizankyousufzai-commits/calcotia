/* Valuta Calculator (NL).
   API: calcValuta({ bedrag, koers })
   - Omgerekend bedrag = bedrag x koers. De gebruiker voert de koers zelf in
     (bijvoorbeeld de actuele ECB-referentiekoers); de calculator haalt geen
     live koersen op. Voorbeeldkoers in het formulier: 1 EUR = 1,16 USD.
   Voorbeeld: EUR 100 x 1,16 = 116,00 USD. */
function calcValuta(i) {
  var bedrag = Math.max(0, parseFloat(i.bedrag) || 0);
  var koers = Math.max(0, parseFloat(i.koers) || 0);
  function r2(n) { return Math.round(n * 100) / 100; }
  return { omgerekend: r2(bedrag * koers), terug: koers > 0 ? r2(bedrag / koers) : 0 };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function f2(n) { return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    var btn = el('nlval-btn'); if (!btn) { return; }
    function render() {
      var r = calcValuta({ bedrag: el('nlval-bedrag').value, koers: el('nlval-koers').value });
      el('nlval-big').textContent = f2(r.omgerekend);
      el('nlval-rows').innerHTML = '<tr><td>Bedrag in euro</td><td>€ ' + f2(parseFloat(el('nlval-bedrag').value) || 0) + '</td></tr><tr><td>Koers</td><td>' + f2(parseFloat(el('nlval-koers').value) || 0) + '</td></tr><tr><td>Omgerekend bedrag</td><td>' + f2(r.omgerekend) + '</td></tr>';
    
    var res = el('nlval-result'); if (res) { res.classList.add('show'); }
}
    btn.addEventListener('click', render);
    ['nlval-bedrag', 'nlval-koers'].forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); } });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcValuta: calcValuta }; }
