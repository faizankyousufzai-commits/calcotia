/* ZZP Belasting Calculator 2026 (NL) — SCHATTING.
   API: calcZZP({ winst, urencriterium })
   - Zelfstandigenaftrek 2026: EUR 1.200 (alleen bij urencriterium: 1.225 uur).
   - MKB-winstvrijstelling 2026: 12,7% van de winst na ondernemersaftrek.
   - Belastbaar box 1 = (winst - zelfstandigenaftrek) x (1 - 0,127).
   - Box 1 schijven 2026: 35,75% tot 38.883; 37,56% tot 78.426; 49,50% daarboven.
   - Algemene heffingskorting: max 3.115, afbouw 6,398% boven 29.736.
   - Zvw-bijdrage 2026: 4,85% over het belastbare inkomen tot max EUR 79.409
     (apart getoond; geen inkomstenbelasting).
   SCHATTING: startersaftrek, FOR/lijfrente, aftrekposten en toeslagen zitten
   hier niet in; de aangifte van de Belastingdienst is leidend.
   Voorbeeld: winst 60.000 -> belastbaar 51.332,40; belasting 18.576,67;
   korting 1.733,26; te betalen 16.843,40; Zvw 2.489,62. */
function calcZZP(i) {
  var winst = Math.max(0, parseFloat(i.winst) || 0);
  var aftrek = i.urencriterium === false ? 0 : 1200;
  var naAftrek = Math.max(0, winst - aftrek);
  var belastbaar = naAftrek * (1 - 0.127);
  var b = 0;
  b += Math.min(belastbaar, 38883) * 0.3575;
  if (belastbaar > 38883) { b += (Math.min(belastbaar, 78426) - 38883) * 0.3756; }
  if (belastbaar > 78426) { b += (belastbaar - 78426) * 0.495; }
  var ahk = belastbaar <= 29736 ? 3115 : Math.max(0, 3115 - (belastbaar - 29736) * 0.06398);
  var zvw = Math.min(belastbaar, 79409) * 0.0485;
  function r2(n) { return Math.round(n * 100) / 100; }
  return { winst: r2(winst), zelfstandigenaftrek: aftrek, belastbaar: r2(belastbaar),
    belasting: r2(b), korting: r2(ahk), teBetalen: r2(Math.max(0, b - ahk)),
    zvw: r2(zvw), netto: r2(winst - Math.max(0, b - ahk) - zvw) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function eur(n) { return '€ ' + new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    var btn = el('nlzzp-btn'); if (!btn) { return; }
    function render() {
      var r = calcZZP({ winst: el('nlzzp-winst').value, urencriterium: el('nlzzp-uren') ? el('nlzzp-uren').value === 'ja' : true });
      el('nlzzp-big').textContent = eur(r.teBetalen) + ' belasting';
      el('nlzzp-rows').innerHTML = '<tr><td>Winst</td><td>' + eur(r.winst) + '</td></tr>' +
        '<tr><td>Zelfstandigenaftrek</td><td>− ' + eur(r.zelfstandigenaftrek) + '</td></tr>' +
        '<tr><td>Belastbaar inkomen (na MKB-vrijstelling 12,7%)</td><td>' + eur(r.belastbaar) + '</td></tr>' +
        '<tr><td>Inkomstenbelasting box 1</td><td>' + eur(r.belasting) + '</td></tr>' +
        '<tr><td>Algemene heffingskorting</td><td>− ' + eur(r.korting) + '</td></tr>' +
        '<tr><td>Te betalen inkomstenbelasting</td><td>' + eur(r.teBetalen) + '</td></tr>' +
        '<tr><td>Zvw-bijdrage (4,85%, apart)</td><td>' + eur(r.zvw) + '</td></tr>';
    
    var res = el('nlzzp-result'); if (res) { res.classList.add('show'); }
}
    btn.addEventListener('click', render);
    ['nlzzp-winst', 'nlzzp-uren'].forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); } });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcZZP: calcZZP }; }
