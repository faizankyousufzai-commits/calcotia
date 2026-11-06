/* Ovulatie, Zwangerschap, Slaap (NL).
   - calcOvulatie({ laatsteMenstruatie (YYYY-MM-DD), cyclusDagen }): ovulatie =
     LMP + (cyclus - 14) dagen; vruchtbaar venster = ovulatie - 5 tot ovulatie + 1.
   - calcZwangerschap({ laatsteMenstruatie }): uitgerekende datum = LMP + 280 dagen
     (Naegele); weken zwanger t.o.v. vandaag; trimester.
   - calcSlaap({ wektijd (HH:MM), cycli }): bedtijd = wektijd - cycli*90 min;
     ook omgekeerd: opstaan na 90-min cycli vanaf bedtijd.
   Voorbeeld ovulatie: LMP 2026-01-01, cyclus 28 -> ovulatie 2026-01-15,
   vruchtbaar 10-16 jan. Zwangerschap: LMP 2026-01-01 -> uitgerekend 2026-10-08.
   Slaap: wekken 07:00, 5 cycli (+ 15 min inslaaptijd) -> bedtijd 23:15. */
function parseD(s) { var p = String(s || '').split('-'); return new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1); }
function fmtD(d) { return d.toISOString().slice(0, 10); }
function addD(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
function calcOvulatie(i) {
  var lmp = parseD(i.laatsteMenstruatie);
  var cyclus = Math.max(21, Math.min(35, parseInt(i.cyclusDagen, 10) || 28));
  var ov = addD(lmp, cyclus - 14);
  return { ovulatie: fmtD(ov), vruchtbaarVan: fmtD(addD(ov, -5)), vruchtbaarTot: fmtD(addD(ov, 1)), volgendeMenstruatie: fmtD(addD(lmp, cyclus)) };
}
function calcZwangerschap(i, vandaag) {
  var lmp = parseD(i.laatsteMenstruatie);
  var now = vandaag ? parseD(vandaag) : new Date();
  var uitgerekend = addD(lmp, 280);
  var dagen = Math.floor((now - lmp) / 86400000);
  var weken = Math.max(0, Math.floor(dagen / 7));
  var trimester = weken < 14 ? 1 : weken < 28 ? 2 : 3;
  return { uitgerekend: fmtD(uitgerekend), weken: weken, dagenRest: dagen % 7, trimester: trimester };
}
function calcSlaap(i) {
  function toMin(s) { var p = String(s || '07:00').split(':'); return (+p[0] || 0) * 60 + (+p[1] || 0); }
  function toHHMM(m) { m = ((m % 1440) + 1440) % 1440; var h = Math.floor(m / 60); var mm = m % 60; return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm; }
  var cycli = Math.max(1, Math.min(6, parseInt(i.cycli, 10) || 5));
  var wek = toMin(i.wektijd);
  var bed = toHHMM(wek - cycli * 90 - 15);
  var uren = (cycli * 90) / 60;
  return { bedtijd: bed, cycli: cycli, slaapUren: uren, opstaan: toHHMM(toMin(i.bedtijd || bed) + cycli * 90 + 15) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
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
    wire('nlov', ['nlov-lmp', 'nlov-cyclus'], function () {
      var r = calcOvulatie({ laatsteMenstruatie: el('nlov-lmp').value, cyclusDagen: el('nlov-cyclus').value });
      el('nlov-big').textContent = r.ovulatie;
      el('nlov-rows').innerHTML = '<tr><td>Verwachte ovulatie</td><td>' + r.ovulatie + '</td></tr><tr><td>Vruchtbare dagen</td><td>' + r.vruchtbaarVan + ' t/m ' + r.vruchtbaarTot + '</td></tr><tr><td>Volgende menstruatie</td><td>' + r.volgendeMenstruatie + '</td></tr>';
    });
    wire('nlzw', ['nlzw-lmp'], function () {
      var r = calcZwangerschap({ laatsteMenstruatie: el('nlzw-lmp').value });
      el('nlzw-big').textContent = r.uitgerekend;
      el('nlzw-rows').innerHTML = '<tr><td>Uitgerekende datum</td><td>' + r.uitgerekend + '</td></tr><tr><td>Zwanger</td><td>' + r.weken + ' weken en ' + r.dagenRest + ' dagen</td></tr><tr><td>Trimester</td><td>' + r.trimester + 'e trimester</td></tr>';
    });
    wire('nlsl', ['nlsl-wektijd', 'nlsl-cycli'], function () {
      var r = calcSlaap({ wektijd: el('nlsl-wektijd').value, cycli: el('nlsl-cycli').value });
      el('nlsl-big').textContent = r.bedtijd;
      el('nlsl-rows').innerHTML = '<tr><td>Naar bed om (met 15 min inslaaptijd)</td><td>' + r.bedtijd + '</td></tr><tr><td>Slaapcycli</td><td>' + r.cycli + ' cycli van 90 minuten</td></tr><tr><td>Slaapduur</td><td>' + r.slaapUren + ' uur</td></tr>';
    });
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcOvulatie: calcOvulatie, calcZwangerschap: calcZwangerschap, calcSlaap: calcSlaap }; }
