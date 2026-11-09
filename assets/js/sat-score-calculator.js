(function () {
  "use strict";

  var RW_TOTAL = 54;
  var MATH_TOTAL = 44;

  function num(value) {
    var n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  function scale(correct, total) {
    return 200 + Math.round((correct / total) * 600 / 10) * 10;
  }

  function calc(rw, math) {
    rw = num(rw); math = num(math);
    if (rw === null || math === null) return null;
    if (rw < 0 || rw > RW_TOTAL || math < 0 || math > MATH_TOTAL) return null;
    var rwScaled = scale(rw, RW_TOTAL);
    var mathScaled = scale(math, MATH_TOTAL);
    return {
      rwScaled: rwScaled,
      mathScaled: mathScaled,
      total: rwScaled + mathScaled
    };
  }

  function calculate() {
    var resultEl = document.getElementById("sat-result");
    if (!resultEl) return;
    var out = calc(
      document.getElementById("sat-rw").value,
      document.getElementById("sat-math").value
    );
    if (!out) { resultEl.classList.remove('show'); return; }
    var totalEl = document.getElementById("sat-total");
    var rwEl = document.getElementById("sat-rw-scaled");
    var mathEl = document.getElementById("sat-math-scaled");
    if (totalEl) totalEl.textContent = String(out.total);
    if (rwEl) rwEl.textContent = String(out.rwScaled);
    if (mathEl) mathEl.textContent = String(out.mathScaled);
    resultEl.classList.add('show');
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("sat-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["sat-rw", "sat-math"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", calculate);
        el.addEventListener("change", calculate);
      }
    });
    calculate();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc, scale: scale };
  }
})();
