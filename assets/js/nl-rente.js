/* Samengestelde Rente, Rendement (CAGR), Inflatie, Pensioen (NL).
   - calcSamengesteld({ start, maandelijks, rentePct, jaren }): eind = start*(1+r)^n +
     maandelijks*((1+r)^n-1)/r, r = jaarrente/12, n = jaren*12.
   - calcCAGR({ begin, eind, jaren }): (eind/begin)^(1/jaren) - 1.
   - calcInflatie({ bedrag, inflatiePct, jaren }): toekomstige prijs =
     bedrag*(1+i)^jaren; koopkracht = bedrag/(1+i)^jaren.
   - calcPensioen: zelfde als samengesteld, met inleg en rendement.
   Voorbeelden: 10.000 + 100/maand, 5%, 10 jr -> 31.998,32 (inleg 22.000, rente 9.998,32).
   CAGR: 10.000 -> 16.289 in 10 jr = 5,0%. Inflatie: 100 euro, 2%, 10 jr ->
   prijs 121,90; koopkracht 82,03. */
function samengesteld(i) {
  var start = Math.max(0, parseFloat(i.start) || 0);
  var m = Math.max(0, parseFloat(i.maandelijks) || 0);
  var r = Math.max(0, parseFloat(i.rentePct) || 0) / 100 / 12;
  var n = Math.max(0, parseFloat(i.jaren) || 0) * 12;
  function r2(x) { return Math.round(x * 100) / 100; }
  var eind = r === 0 ? start + m * n : start * Math.pow(1 + r, n) + m * (Math.pow(1 + r, n) - 1) / r;
  var inleg = start + m * n;
  return { eind: r2(eind), inleg: r2(inleg), rente: r2(eind - inleg) };
}
function calcCAGR(i) {
  var begin = Math.max(0, parseFloat(i.begin) || 0);
  var eind = Math.max(0, parseFloat(i.eind) || 0);
  var jaren = Math.max(0, parseFloat(i.jaren) || 0);
  function r2(x) { return Math.round(x * 100) / 100; }
  if (begin <= 0 || jaren <= 0) { return { cagrPct: 0, totaalPct: 0 }; }
  var cagr = Math.pow(eind / begin, 1 / jaren) - 1;
  return { cagrPct: r2(cagr * 100), totaalPct: r2((eind / begin - 1) * 100) };
}
function calcInflatie(i) {
  var bedrag = Math.max(0, parseFloat(i.bedrag) || 0);
  var infl = Math.max(0, parseFloat(i.inflatiePct) || 0) / 100;
  var jaren = Math.max(0, parseFloat(i.jaren) || 0);
  function r2(x) { return Math.round(x * 100) / 100; }
  return { toekomstigePrijs: r2(bedrag * Math.pow(1 + infl, jaren)), koopkracht: r2(bedrag / Math.pow(1 + infl, jaren)) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function eur(n) { return '€ ' + new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    function f2(n) { return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    function wire(prefix, ids, render) {
      var btn = el(prefix + '-btn'); if (!btn) { return; }
      btn.addEventListener('click', render);
      ids.forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); } });
      render();
    }
    wire('nlsr', ['nlsr-start', 'nlsr-maand', 'nlsr-rente', 'nlsr-jaren'], function () {
      var r = samengesteld({ start: el('nlsr-start').value, maandelijks: el('nlsr-maand').value, rentePct: el('nlsr-rente').value, jaren: el('nlsr-jaren').value });
      el('nlsr-big').textContent = eur(r.eind);
      el('nlsr-rows').innerHTML = '<tr><td>Eindkapitaal</td><td>' + eur(r.eind) + '</td></tr><tr><td>Zelf ingelegd</td><td>' + eur(r.inleg) + '</td></tr><tr><td>Rente-op-rente</td><td>' + eur(r.rente) + '</td></tr>';
    });
    wire('nlren', ['nlren-begin', 'nlren-eind', 'nlren-jaren'], function () {
      var r = calcCAGR({ begin: el('nlren-begin').value, eind: el('nlren-eind').value, jaren: el('nlren-jaren').value });
      el('nlren-big').textContent = f2(r.cagrPct) + ' % per jaar';
      el('nlren-rows').innerHTML = '<tr><td>Jaarlijks rendement (CAGR)</td><td>' + f2(r.cagrPct) + ' %</td></tr><tr><td>Totaal rendement</td><td>' + f2(r.totaalPct) + ' %</td></tr>';
    });
    wire('nlinf', ['nlinf-bedrag', 'nlinf-pct', 'nlinf-jaren'], function () {
      var r = calcInflatie({ bedrag: el('nlinf-bedrag').value, inflatiePct: el('nlinf-pct').value, jaren: el('nlinf-jaren').value });
      el('nlinf-big').textContent = eur(r.toekomstigePrijs);
      el('nlinf-rows').innerHTML = '<tr><td>Prijs over ' + (el('nlinf-jaren').value || 0) + ' jaar</td><td>' + eur(r.toekomstigePrijs) + '</td></tr><tr><td>Koopkracht van € ' + (el('nlinf-bedrag').value || 0) + ' dan</td><td>' + eur(r.koopkracht) + '</td></tr>';
    });
    wire('nlpen', ['nlpen-start', 'nlpen-maand', 'nlpen-rente', 'nlpen-jaren'], function () {
      var r = samengesteld({ start: el('nlpen-start').value, maandelijks: el('nlpen-maand').value, rentePct: el('nlpen-rente').value, jaren: el('nlpen-jaren').value });
      el('nlpen-big').textContent = eur(r.eind);
      el('nlpen-rows').innerHTML = '<tr><td>Verwacht pensioenkapitaal</td><td>' + eur(r.eind) + '</td></tr><tr><td>Zelf ingelegd</td><td>' + eur(r.inleg) + '</td></tr><tr><td>Rendement</td><td>' + eur(r.rente) + '</td></tr>';
    });
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { samengesteld: samengesteld, calcCAGR: calcCAGR, calcInflatie: calcInflatie }; }
