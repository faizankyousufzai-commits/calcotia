(function () {
  "use strict";

  // GMAT Focus Edition estimate. GMAC does not publish the exact total-score
  // conversion, so this uses the widely used section-sum formula:
  // total = (Q + V + DI - 180) x 20/3 + 205, rounded to a score ending in 5.
  // Section scores each run 60-90; the total runs 205-805 in steps of 10.
  function calc(qValue, vValue, diValue) {
    var q = parseInt(qValue, 10);
    var v = parseInt(vValue, 10);
    var di = parseInt(diValue, 10);
    if (isNaN(q) || isNaN(v) || isNaN(di)) return null;
    if (q < 60 || q > 90 || v < 60 || v > 90 || di < 60 || di > 90) return null;
    var sum = q + v + di;
    var raw = ((sum - 180) * 20) / 3 + 205;
    var total = Math.round((raw - 5) / 10) * 10 + 5;
    if (total < 205) total = 205;
    if (total > 805) total = 805;
    return { sum: sum, total: total, note: scoreNote(total) };
  }

  function scoreNote(total) {
    if (total >= 705) return "Top tier. A total of 705 or above beats about 98% of test takers.";
    if (total >= 645) return "Strong. A total of 645 beats about 86% of test takers.";
    if (total >= 555) return "Around the average. The average GMAT Focus total is about 555.";
    return "Below the average. The average GMAT Focus total is about 555.";
  }

  function calculate() {
    var qInput = document.getElementById("gmat-q");
    var vInput = document.getElementById("gmat-v");
    var diInput = document.getElementById("gmat-di");
    var resultEl = document.getElementById("gmat-result");
    if (!qInput || !vInput || !diInput || !resultEl) return;
    var out = calc(qInput.value, vInput.value, diInput.value);
    if (!out) {
      resultEl.classList.remove("show");
      return;
    }
    var totalEl = document.getElementById("gmat-total");
    var sumEl = document.getElementById("gmat-sum");
    var noteEl = document.getElementById("gmat-note");
    if (totalEl) totalEl.textContent = out.total;
    if (sumEl) sumEl.textContent = out.sum + " out of 270";
    if (noteEl) noteEl.textContent = out.note;
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("gmat-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["gmat-q", "gmat-v", "gmat-di"].forEach(function (id) {
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
