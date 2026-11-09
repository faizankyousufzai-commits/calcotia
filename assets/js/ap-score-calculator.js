(function () {
  "use strict";

  var BANDS = [
    { min: 70, score: 5, label: "Extremely well qualified" },
    { min: 60, score: 4, label: "Well qualified" },
    { min: 50, score: 3, label: "Qualified" },
    { min: 40, score: 2, label: "Possibly qualified" },
    { min: 0, score: 1, label: "No recommendation" }
  ];

  function num(value) {
    var n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  function calc(mcq, mcqTotal, frq, frqMax) {
    mcq = num(mcq); mcqTotal = num(mcqTotal); frq = num(frq); frqMax = num(frqMax);
    if (mcq === null || mcqTotal === null || frq === null || frqMax === null) return null;
    if (mcqTotal <= 0 || frqMax <= 0) return null;
    if (mcq < 0 || mcq > mcqTotal || frq < 0 || frq > frqMax) return null;
    var composite = (0.5 * (mcq / mcqTotal) + 0.5 * (frq / frqMax)) * 100;
    var band = BANDS[BANDS.length - 1];
    for (var i = 0; i < BANDS.length; i++) {
      if (composite >= BANDS[i].min) { band = BANDS[i]; break; }
    }
    var credit = band.score >= 3
      ? "A score of 3 or higher often earns college credit or placement at many colleges."
      : "A score below 3 usually does not earn college credit, but check your college's policy.";
    return {
      composite: composite,
      compositeLabel: composite.toFixed(1) + "%",
      score: band.score,
      label: band.label,
      credit: credit
    };
  }

  function calculate() {
    var resultEl = document.getElementById("ap-result");
    if (!resultEl) return;
    var out = calc(
      document.getElementById("ap-mcq").value,
      document.getElementById("ap-mcq-total").value,
      document.getElementById("ap-frq").value,
      document.getElementById("ap-frq-max").value
    );
    if (!out) { resultEl.classList.remove('show'); return; }
    var scoreEl = document.getElementById("ap-score");
    var compEl = document.getElementById("ap-composite");
    var labelEl = document.getElementById("ap-label");
    var creditEl = document.getElementById("ap-credit");
    if (scoreEl) scoreEl.textContent = String(out.score);
    if (compEl) compEl.textContent = out.compositeLabel;
    if (labelEl) labelEl.textContent = out.label;
    if (creditEl) creditEl.textContent = out.credit;
    resultEl.classList.add('show');
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("ap-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["ap-subject", "ap-mcq", "ap-mcq-total", "ap-frq", "ap-frq-max"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", calculate);
        el.addEventListener("change", calculate);
      }
    });
    calculate();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc };
  }
})();
