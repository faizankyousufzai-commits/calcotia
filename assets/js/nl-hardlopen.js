/* Hardlooptempo Calculator (NL).
   API: calcHardlopen({ afstandKm, uren, minuten, seconden })
   - Tempo = tijd / afstand (min/km); snelheid = afstand / tijd (km/u).
   - Riegel-voorspelling: T2 = T1 x (D2/D1)^1,06 voor 5K, 10K, halve en hele marathon.
   Schattingen: geen rekening met hoogte, hitte of vermoeidheid.
   Voorbeeld: 5 km in 25:00 -> tempo 5:00 min/km, 12 km/u, marathon ca. 3 u 59 min. */
function calcHardlopen(i) {
  var afstand = Math.max(0, parseFloat(i.afstandKm) || 0);
  var sec = (parseFloat(i.uren) || 0) * 3600 + (parseFloat(i.minuten) || 0) * 60 + (parseFloat(i.seconden) || 0);
  function fmtTijd(s) { s = Math.round(s); var h = Math.floor(s / 3600); var m = Math.floor((s % 3600) / 60); var ss = s % 60; return (h > 0 ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (ss < 10 ? '0' : '') + ss; }
  function fmtTempo(s) { var m = Math.floor(s / 60); var ss = Math.round(s % 60); return m + ':' + (ss < 10 ? '0' : '') + ss + ' min/km'; }
  if (afstand <= 0 || sec <= 0) { return { tempo: '–', snelheid: 0, voorspellingen: [] }; }
  var tempoSec = sec / afstand;
  var snelheid = afstand / (sec / 3600);
  function riegel(d2) { return fmtTijd(sec * Math.pow(d2 / afstand, 1.06)); }
  return { tempo: fmtTempo(tempoSec), snelheid: Math.round(snelheid * 100) / 100,
    voorspellingen: [
      { afstand: '5 km', tijd: riegel(5) },
      { afstand: '10 km', tijd: riegel(10) },
      { afstand: 'Halve marathon (21,1 km)', tijd: riegel(21.0975) },
      { afstand: 'Marathon (42,2 km)', tijd: riegel(42.195) }
    ] };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function f2(n) { return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n); }
    var btn = el('nlhl-btn'); if (!btn) { return; }
    function render() {
      var r = calcHardlopen({ afstandKm: el('nlhl-afstand').value, uren: el('nlhl-uren').value, minuten: el('nlhl-minuten').value, seconden: el('nlhl-seconden').value });
      el('nlhl-big').textContent = r.tempo;
      var rows = '<tr><td>Tempo</td><td>' + r.tempo + '</td></tr><tr><td>Snelheid</td><td>' + f2(r.snelheid) + ' km/u</td></tr>';
      r.voorspellingen.forEach(function (v) { rows += '<tr><td>' + v.afstand + '</td><td>' + v.tijd + '</td></tr>'; });
      el('nlhl-rows').innerHTML = rows;
    
    var res = el('nlhl-result'); if (res) { res.classList.add('show'); }
}
    btn.addEventListener('click', render);
    ['nlhl-afstand', 'nlhl-uren', 'nlhl-minuten', 'nlhl-seconden'].forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); } });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcHardlopen: calcHardlopen }; }
