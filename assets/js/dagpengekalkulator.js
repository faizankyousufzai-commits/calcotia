(function () {
  'use strict';

  // Norway dagpenger 2026 (folketrygdloven kapittel 4; NAV dagpenger guide).
  // G fra 1. mai 2026 = 136 549 kr. Avledet: 1,5 G = 204 824 kr; 3 G = 409 647 kr;
  // 2 G = 273 098 kr; 6 G = 819 294 kr.
  // Basis (§ 4-11): best av (a) arbeidsinntekt siste 12 mnd, eller (b) snittet av
  // siste 36 mnd. Inntekt over 6 G per 12-mnd periode tas ikke med, så
  // 36-mnd totalen takkes ved 3 x 6 G for den mangler per-ars fordeling.
  // Dagsats (§ 4-12): 2,4 promille (0,0024) x basis, 5 dager/uke.
  // Barnetillegg: 38 kr/barn/dag for barn under 18 ar som forsorges.
  // 90 %-taket (§ 4-12): dagpenger + barnetillegg (utenom ferietillegg) <= 90 %
  // av basis. Taket binder bare nar basis < 35 797 kr per barn.
  // Egenandel (§ 4-9): 3 x dagsats INKLUDERT barnetillegg, trekkes fra forste
  // utbetaling(er). Dette er ikke ventedager.
  // Varighet (§ 4-15): 104 uker nar basis >= 2 G, ellers 52 uker.
  // Permittering (§ 4-7): 26 uker i lopet av 18 mnd hos samme arbeidsgiver.
  // Arbeidsgiver betaler de forste 15 virkedagene.
  // Alle belop er FOR SKATT. NAVs vedtak gjelder; kalkulatoren viser heltids-
  // anslag, ikke graderte belop, netto etter skatt eller samordning.
  var G = 136549;
  var CAP_6G = 6 * G; // 819 294
  var MIN_12 = 204824; // 1,5 G
  var MIN_36 = 409647; // 3 G
  var DUR_2G = 273098; // 2 G
  var PROMILLE = 0.0024;
  var CHILD_PER_DAY = 38;
  var FERIE_RATE = 0.095;

  function calc(input) {
    var income12 = Math.max(0, input.income12 || 0);
    var income36 = Math.max(0, input.income36 || 0);
    var has36 = income36 > 0;
    var children = Math.min(20, Math.max(0, parseInt(input.children, 10) || 0));
    var permittering = !!input.permittering;
    var used = permittering ? Math.min(26, Math.max(0, parseInt(input.used, 10) || 0)) : 0;

    var basis12 = Math.min(income12, CAP_6G);
    var basis36avg = has36 ? Math.min(income36, 3 * CAP_6G) / 3 : 0;
    var basis = Math.max(basis12, basis36avg);
    var basisSource = basis36avg > basis12 ? '36' : '12';

    var minstePass = income12 >= MIN_12 || (has36 && income36 >= MIN_36);

    var weeks = permittering ? 26 : (basis >= DUR_2G ? 104 : 52);
    var weeksLeft = permittering ? 26 - used : weeks;

    var dagsatsBase = PROMILLE * basis;
    var supplementPerDay = CHILD_PER_DAY * children;
    var annualBase = dagsatsBase * 260;
    var annualSupp = supplementPerDay * 260;
    var capAnnual = 0.90 * basis;
    var capCut = Math.max(0, annualBase + annualSupp - capAnnual);
    var annualSuppAdj = Math.max(0, annualSupp - capCut);
    var annualTotal = annualBase + annualSuppAdj;
    var dagsatsTotal = annualTotal / 260;

    return {
      income12: income12,
      income36: has36 ? income36 : 0,
      has36: has36,
      children: children,
      basis12: basis12,
      basis36avg: basis36avg,
      basis: basis,
      basisSource: basisSource,
      minstePass: minstePass,
      permittering: permittering,
      used: used,
      weeks: weeks,
      weeksLeft: weeksLeft,
      dagsatsBase: dagsatsBase,
      supplementPerDay: supplementPerDay,
      dagsatsTotal: dagsatsTotal,
      weekly: dagsatsTotal * 5,
      meldeperiode: dagsatsTotal * 10,
      annualBase: annualBase,
      annualSupp: annualSuppAdj,
      annualTotal: annualTotal,
      monthly: annualTotal / 12,
      egenandel: 3 * dagsatsTotal,
      capBinds: capCut > 0,
      capCut: capCut,
      capAnnual: capAnnual,
      totalOverPeriod: annualTotal * weeks / 52,
      paidOverPeriod: annualTotal * weeks / 52 - 3 * dagsatsTotal,
      ferietillegg: FERIE_RATE * annualTotal
    };
  }

  function fmtKr(n) {
    var r = Math.round(n);
    return String(r).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + ' kr';
  }

  function fmtKr2(n) {
    var fixed = n.toFixed(2);
    var parts = fixed.split('.');
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + ',' + parts[1] + ' kr';
  }

  // ---- DOM binding ----
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('dag-btn');
    if (!btn) return;
    var usedField = document.getElementById('dag-used-field');

    function run() {
      var income12 = parseFloat(document.getElementById('dag-income12').value) || 0;
      var income36Raw = document.getElementById('dag-income36').value;
      var income36 = income36Raw === '' ? 0 : (parseFloat(income36Raw) || 0);
      var children = parseInt(document.getElementById('dag-children').value, 10) || 0;
      var permittering = document.getElementById('dag-perm').checked;
      var used = permittering ? (parseInt(document.getElementById('dag-used').value, 10) || 0) : 0;
      if (usedField) usedField.style.display = permittering ? '' : 'none';

      var r = calc({ income12: income12, income36: income36, children: children, permittering: permittering, used: used });
      var fail = document.getElementById('dag-fail');
      var breakdown = document.getElementById('dag-breakdown');
      var big = document.getElementById('dag-big');
      var bigLabel = document.getElementById('dag-big-label');

      if (!r.minstePass) {
        if (fail) fail.style.display = '';
        if (breakdown) breakdown.style.display = 'none';
        if (big) big.textContent = '—';
        if (bigLabel) bigLabel.textContent = 'Ingen rett etter minsteinntektskravet';
        var failText = document.getElementById('dag-fail-text');
        if (failText) {
          failText.textContent = 'Minsteinntekten er 204 824 kr siste 12 måneder eller 409 647 kr totalt siste 36 måneder. Du oppga ' + fmtKr(r.income12) + ' siste 12 måneder' + (r.has36 ? ' og ' + fmtKr(r.income36) + ' siste 36 måneder' : ' og ingen 36-måneders inntekt') + ', så kravet er ikke oppfylt. NAV avgjør på grunnlag av innrapportert inntekt.';
        }
        return;
      }
      if (fail) fail.style.display = 'none';
      if (breakdown) breakdown.style.display = '';

      if (bigLabel) bigLabel.textContent = 'Dagsats (før skatt)';
      if (big) big.textContent = fmtKr(r.dagsatsTotal);

      var set = function (id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
      };
      set('dag-basis', fmtKr(r.basis) + (r.basisSource === '36' ? ' (snitt av 36 måneder)' : ' (siste 12 måneder)'));
      set('dag-dagsats-base', fmtKr(r.dagsatsBase));
      set('dag-supplement', fmtKr(r.supplementPerDay) + ' per dag' + (r.children > 0 ? ' (' + r.children + ' barn x 38 kr)' : ''));
      set('dag-weekly', fmtKr(r.weekly));
      set('dag-melde', fmtKr(r.meldeperiode));
      set('dag-annual', fmtKr(r.annualTotal));
      set('dag-monthly', fmtKr2(r.monthly));
      set('dag-weeks', r.permittering ? '26 uker i løpet av 18 måneder' + (r.used > 0 ? ' (' + r.weeksLeft + ' uker igjen)' : '') : r.weeks + ' uker');
      set('dag-egenandel', fmtKr(r.egenandel));
      set('dag-total', fmtKr(r.totalOverPeriod));
      set('dag-paid', fmtKr(r.paidOverPeriod));
      set('dag-ferie', fmtKr2(r.ferietillegg));

      var capNote = document.getElementById('dag-capnote');
      if (capNote) {
        capNote.style.display = r.capBinds ? '' : 'none';
        if (r.capBinds) capNote.textContent = 'Merk: 90 %-taket binder her. Barnetillegget er kuttet med ' + fmtKr(r.capCut) + ' per år, slik at dagpenger + barnetillegg ikke overstiger 90 % av grunnlaget (' + fmtKr(r.capAnnual) + ' per år).';
      }
      var permNote = document.getElementById('dag-permnote');
      if (permNote) {
        permNote.style.display = r.permittering ? '' : 'none';
        if (r.permittering) permNote.textContent = 'Permittering: arbeidsgiver betaler de første 15 virkedagene. NAVs 26 uker løper deretter, og en ny permittering hos samme arbeidsgiver innen 18 måneder fortsetter på de samme 26 ukene.';
      }
    
    var resEl = document.getElementById('dag-result'); if (resEl) { resEl.classList.add('show'); }
}

    btn.addEventListener('click', run);
    run();
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calc: calc, fmtKr: fmtKr, fmtKr2: fmtKr2 };
  }
})();
