(function () {
  function el(id) { return document.getElementById(id); }
  function num(id) {
    var v = parseFloat(el(id).value);
    return isNaN(v) ? NaN : v;
  }
  function fmt(x) {
    var r = Math.round(x * 100) / 100;
    return (r % 1 === 0 ? String(r) : r.toFixed(2).replace(/0$/, '')) + '%';
  }
  function calc() {
    var filledPts = 0, filledWeight = 0, remainingWeight = 0, i, w, s;
    for (i = 1; i <= 4; i++) {
      w = num('wg-weight' + i);
      if (isNaN(w) || w < 0) w = 0;
      if (w > 100) w = 100;
      s = num('wg-score' + i);
      if (isNaN(s)) {
        remainingWeight += w;
      } else {
        if (s < 0) s = 0;
        if (s > 100) s = 100;
        filledPts += w * s;
        filledWeight += w;
      }
    }
    var target = num('wg-target');
    if (isNaN(target)) target = 0;
    if (target < 0) target = 0;
    if (target > 100) target = 100;
    var current = filledWeight > 0 ? filledPts / filledWeight : NaN;
    var needed = NaN, note = '';
    if (remainingWeight <= 0) {
      if (!isNaN(current) && current >= target) {
        note = 'Your target is already reached. There is no remaining work to score on.';
      } else {
        note = 'There is no remaining work left to score on, so the target cannot be reached from here.';
      }
    } else if (!isNaN(current) && current >= target) {
      needed = 0;
      note = 'Your target is already reached. You do not need any more points on the remaining work.';
    } else {
      needed = (target * 100 - filledPts) / remainingWeight;
      if (needed > 100) {
        note = 'Out of reach: you would need ' + fmt(needed) + ' on the remaining work, which is over 100%. That goal is not possible unless extra credit exists.';
      } else if (needed <= 0) {
        note = 'Your target is already reached. You do not need any more points on the remaining work.';
      } else {
        note = 'You need ' + fmt(needed) + ' on the remaining ' + fmt(remainingWeight) + ' of your grade to reach ' + fmt(target) + '.';
      }
    }
    el('wg-current').textContent = isNaN(current) ? 'Enter a score to see your current grade.' : fmt(current);
    el('wg-needed').textContent = isNaN(needed) ? '—' : fmt(needed);
    el('wg-note').textContent = note;
    var res = el('wg-result');
    if (res) res.classList.add('show');
  }
  var btn = el('wg-btn');
  if (btn) btn.addEventListener('click', calc);
  ['wg-weight1', 'wg-weight2', 'wg-weight3', 'wg-weight4',
   'wg-score1', 'wg-score2', 'wg-score3', 'wg-score4', 'wg-target'].forEach(function (id) {
    var input = el(id);
    if (input) {
      input.addEventListener('input', calc);
      input.addEventListener('change', calc);
    }
  });
  ['wg-name1', 'wg-name2', 'wg-name3', 'wg-name4'].forEach(function (id) {
    var input = el(id);
    if (input) input.addEventListener('input', calc);
  });
  calc();
})();
