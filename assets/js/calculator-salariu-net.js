(function () {
  'use strict';

  // Romania net salary 2026 (Codul fiscal, Legea 227/2015; HG 146/2026; OUG 89/2025).
  // Salariu minim brut: S1 (ian-iun 2026) 4.050 lei, S2 (iul-dec 2026) 4.325 lei.
  // Suma neimpozabila: 300 lei S1 / 200 lei S2, applied ONLY when brut <= minim.
  // OUG 89/2025 exempts that sum from income tax AND from the CAS/CASS base, so
  // CAS 25%, CASS 10% and CAM 2,25% are computed on (brut - suma), not on full brut.
  // This is the only reading that reproduces the anchor case S2 brut 4.325 ->
  // CAS 1.031, CASS 413, net 2.699 (all sources agree on 2.699 at minim wage).
  // Deducere personala (only at functia de baza): base % of minim wage, 20% for
  // 0 persons, +5 points per dependent (25/30/35/45% for 1/2/3/4+), +15 points if
  // under 26. Phase-out: minus 0,5 points per 50 lei of brut above minim, floor 0,
  // zero above minim + 2.000 lei.
  // Baza impozabila = brut - CAS - CASS - deducere - suma.
  // Impozit = 10% x max(baza, 0). Net = brut - CAS - CASS - impozit.
  // CAM 2,25% is employer-only: salariu complet = brut + CAM, never deducted.
  // All amounts are whole lei (rounded per component, then summed), like a payslip.
  function calc(input) {
    var brut = Math.max(0, input.brut || 0);
    var period = input.period === 'S1' ? 'S1' : 'S2';
    var minim = period === 'S1' ? 4050 : 4325;
    var pers = Math.min(4, Math.max(0, parseInt(input.pers, 10) || 0));
    var functieBaza = !!input.functieBaza;
    var sub26 = !!input.sub26;

    var suma = brut <= minim ? (period === 'S1' ? 300 : 200) : 0;
    var baseContrib = brut - suma;
    var cas = Math.round(0.25 * baseContrib);
    var cass = Math.round(0.10 * baseContrib);
    var cam = Math.round(0.0225 * baseContrib);

    var pct = 0;
    if (functieBaza) {
      pct = [20, 25, 30, 35, 45][pers];
      if (sub26) pct += 15;
      var over = Math.max(0, brut - minim);
      pct = pct - 0.5 * (over / 50);
      if (brut > minim + 2000) pct = 0;
      if (pct < 0) pct = 0;
    }
    var deducere = Math.round(pct / 100 * minim);
    var baza = brut - cas - cass - deducere - suma;
    var impozit = Math.round(0.10 * Math.max(baza, 0));
    var net = brut - cas - cass - impozit;
    var cost = brut + cam;

    return {
      brut: brut,
      period: period,
      minim: minim,
      pers: pers,
      functieBaza: functieBaza,
      sub26: sub26,
      suma: suma,
      baseContrib: baseContrib,
      cas: cas,
      cass: cass,
      cam: cam,
      deducerePct: pct,
      deducere: deducere,
      baza: baza,
      impozit: impozit,
      net: net,
      cost: cost,
      pctNet: brut > 0 ? net / brut * 100 : 0
    };
  }

  // Reverse mode: find the brut that produces the wanted net, within 1 leu,
  // by binary search (same approach as the DE Brutto Netto tool).
  function reverse(targetNet, opts) {
    var target = Math.max(0, targetNet || 0);
    var lo = 0;
    var hi = Math.max(target * 2, 20000);
    var best = null;
    var bestDiff = Infinity;
    for (var i = 0; i < 80; i++) {
      var mid = (lo + hi) / 2;
      var r = calc({
        brut: mid,
        period: opts.period,
        pers: opts.pers,
        functieBaza: opts.functieBaza,
        sub26: opts.sub26
      });
      var diff = Math.abs(r.net - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = r;
        if (diff <= 1) break;
      }
      if (r.net < target) lo = mid; else hi = mid;
    }
    // Refine around the best whole-leu brut, so the displayed brut is a whole sum.
    var b0 = Math.max(0, Math.floor(best.brut) - 2);
    var b1 = Math.ceil(best.brut) + 2;
    for (var b = b0; b <= b1; b++) {
      var rb = calc({
        brut: b,
        period: opts.period,
        pers: opts.pers,
        functieBaza: opts.functieBaza,
        sub26: opts.sub26
      });
      var d = Math.abs(rb.net - target);
      if (d < bestDiff) {
        bestDiff = d;
        best = rb;
      }
    }
    best.reverseDiff = bestDiff;
    best.targetNet = target;
    return best;
  }

  function round0(x) { return Math.round(x); }

  if (typeof document !== 'undefined') {
    var fmt = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 0 });
    var fmt1 = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 1 });

    function val(id) {
      var el = document.getElementById(id);
      if (!el) return 0;
      var v = parseFloat(String(el.value).replace(',', '.'));
      return isNaN(v) || v < 0 ? 0 : v;
    }
    function set(id, v) {
      var el = document.getElementById(id);
      if (el) el.textContent = fmt.format(v) + ' lei';
    }
    function setText(id, v) {
      var el = document.getElementById(id);
      if (el) el.textContent = v;
    }
    function radioVal(name, fallback) {
      var els = document.querySelectorAll('input[name="' + name + '"]:checked');
      return els.length ? els[0].value : fallback;
    }

    function run() {
      var direction = radioVal('sal-direction', 'brut-net');
      var amount = val('sal-amount');
      var opts = {
        period: radioVal('sal-period', 'S2'),
        pers: parseInt((document.getElementById('sal-pers') || {}).value || '0', 10) || 0,
        functieBaza: !!(document.getElementById('sal-fb') || {}).checked,
        sub26: !!(document.getElementById('sal-sub26') || {}).checked
      };
      var r;
      var note = document.getElementById('sal-note');
      if (direction === 'net-brut') {
        r = reverse(amount, opts);
        set('sal-big', r.brut);
        setText('sal-big-label', 'Salariu brut necesar');
        if (note) {
          note.textContent = 'Pentru un net dorit de ' + fmt.format(amount) + ' lei, brutul necesar este ' + fmt.format(r.brut) + ' lei, care produce un net de ' + fmt.format(r.net) + ' lei (diferență de cel mult 1 leu, prin căutare iterativă).';
        }
      } else {
        r = calc({
          brut: amount,
          period: opts.period,
          pers: opts.pers,
          functieBaza: opts.functieBaza,
          sub26: opts.sub26
        });
        set('sal-big', r.net);
        setText('sal-big-label', 'Salariu net în mână');
        if (note) {
          note.textContent = 'Rezultatul este o estimare simplificată, nu fluturașul de salariu: tichetele de masă, sporurile și reținerile speciale nu intră în acest calcul.';
        }
      }
      set('sal-brut', r.brut);
      set('sal-cas', r.cas);
      set('sal-cass', r.cass);
      set('sal-deducere', r.deducere);
      set('sal-suma', r.suma);
      set('sal-baza', Math.max(r.baza, 0));
      set('sal-impozit', r.impozit);
      set('sal-net', r.net);
      set('sal-cam', r.cam);
      set('sal-cost', r.cost);
      setText('sal-pct', fmt1.format(r.pctNet) + ' % din brut');

      var warn = document.getElementById('sal-warning');
      if (warn) {
        var msgs = [];
        if (!opts.functieBaza && r.deducere === 0) msgs.push('Notă: fără funcția de bază, deducerea personală nu se acordă, deci impozitul se calculează pe baza întreagă (brut − CAS − CASS − suma neimpozabilă, dacă se aplică).');
        if (r.brut > r.minim && r.suma === 0) msgs.push('Notă: suma neimpozabilă de ' + (r.period === 'S1' ? '300' : '200') + ' lei se aplică numai la salariul de bază la nivelul minimului; la acest brut ea este zero.');
        if (r.brut > r.minim + 2000 && opts.functieBaza) msgs.push('Notă: peste salariul minim + 2.000 de lei, deducerea personală dispare complet, indiferent de persoanele în întreținere.');
        warn.style.display = msgs.length ? '' : 'none';
        warn.innerHTML = msgs.map(function (m) { return '<p>' + m + '</p>'; }).join('');
      }
    }

    document.addEventListener('DOMContentLoaded', function () {
      var form = document.getElementById('sal-form');
      if (form) {
        form.addEventListener('input', run);
        form.addEventListener('change', run);
      }
      var btn = document.getElementById('sal-btn');
      if (btn) btn.addEventListener('click', run);
      run();
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calc: calc, reverse: reverse, round0: round0 };
  }
})();
