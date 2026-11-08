(function () {
  function el(id) { return document.getElementById(id); }
  var BASE_PRIORS = {
    Brown: { BB: 0.60, BG: 0.15, Bb: 0.25 },
    Green: { GG: 0.60, Gb: 0.40 },
    Hazel: { BG: 0.60, Gb: 0.40 },
    Blue: { bb: 1.00 },
    Gray: { bb: 1.00 }
  };
  var ADJUSTED_PRIORS = {
    Brown: { BB: 0.40, BG: 0.10, Bb: 0.50 },
    Green: { GG: 0.40, Gb: 0.60 },
    Hazel: { BG: 0.40, Gb: 0.60 },
    Blue: { bb: 1.00 },
    Gray: { bb: 1.00 }
  };
  var ALLELES = {
    BB: { B: 1 },
    BG: { B: 0.5, G: 0.5 },
    Bb: { B: 0.5, b: 0.5 },
    GG: { G: 1 },
    Gb: { G: 0.5, b: 0.5 },
    bb: { b: 1 }
  };
  function alleleDist(prior) {
    var dist = { B: 0, G: 0, b: 0 };
    Object.keys(prior).forEach(function (g) {
      var a = ALLELES[g];
      Object.keys(a).forEach(function (allele) {
        dist[allele] += prior[g] * a[allele];
      });
    });
    return dist;
  }
  function phenotype(genotype) {
    if (genotype === 'BB' || genotype === 'Bb') return 'Brown';
    if (genotype === 'BG') return 'Hazel';
    if (genotype === 'GG' || genotype === 'Gb') return 'Green';
    return 'Blue';
  }
  function calc() {
    var p1 = el('be-parent1').value;
    var p2 = el('be-parent2').value;
    var mm = el('be-mm').value, mf = el('be-mf').value;
    var fm = el('be-fm').value, ff = el('be-ff').value;
    var p1BlueGrand = (mm === 'Blue' || mm === 'Gray' || mf === 'Blue' || mf === 'Gray');
    var p2BlueGrand = (fm === 'Blue' || fm === 'Gray' || ff === 'Blue' || ff === 'Gray');
    var prior1 = p1BlueGrand ? ADJUSTED_PRIORS[p1] : BASE_PRIORS[p1];
    var prior2 = p2BlueGrand ? ADJUSTED_PRIORS[p2] : BASE_PRIORS[p2];
    var d1 = alleleDist(prior1), d2 = alleleDist(prior2);
    var out = { Brown: 0, Green: 0, Hazel: 0, Blue: 0 };
    ['B', 'G', 'b'].forEach(function (a1) {
      ['B', 'G', 'b'].forEach(function (a2) {
        var pair = [a1, a2].sort(function (x, y) {
          return 'BGb'.indexOf(x) - 'BGb'.indexOf(y);
        }).join('');
        var g = pair === 'bB' ? 'Bb' : pair;
        out[phenotype(g)] += d1[a1] * d2[a2];
      });
    });
    var pct = {};
    Object.keys(out).forEach(function (c) {
      pct[c] = Math.round(out[c] * 1000) / 10;
    });
    var top = 'Brown', topVal = -1;
    ['Brown', 'Green', 'Hazel', 'Blue'].forEach(function (c) {
      if (pct[c] > topVal) { topVal = pct[c]; top = c; }
    });
    el('be-top').textContent = top + ' (' + topVal.toFixed(1) + '%)';
    el('be-brown').textContent = pct.Brown.toFixed(1) + '%';
    el('be-green').textContent = pct.Green.toFixed(1) + '%';
    el('be-hazel').textContent = pct.Hazel.toFixed(1) + '%';
    el('be-blue').textContent = pct.Blue.toFixed(1) + '%';
    el('be-note').textContent = 'These chances are estimates, not a certainty. Blue includes gray. Very rarely, other genes can produce a different color.';
    var res = el('be-result');
    if (res) res.classList.add('show');
  }
  var btn = el('be-btn');
  if (btn) btn.addEventListener('click', calc);
  ['be-parent1', 'be-parent2', 'be-mm', 'be-mf', 'be-fm', 'be-ff'].forEach(function (id) {
    var input = el(id);
    if (input) {
      input.addEventListener('input', calc);
      input.addEventListener('change', calc);
    }
  });
  calc();
})();
