(function () {
  "use strict";

  function num(value) {
    var n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  function valid(n) {
    return n !== null && n >= 1 && n <= 36;
  }

  function calc(english, math, reading, science, format) {
    english = num(english); math = num(math); reading = num(reading); science = num(science);
    if (!valid(english) || !valid(math) || !valid(reading)) return null;
    var isClassic = format === "classic";
    if (isClassic && !valid(science)) return null;
    var average;
    if (isClassic) {
      average = (english + math + reading + science) / 4;
    } else {
      average = (english + math + reading) / 3;
    }
    var stem = null;
    if (valid(science)) stem = Math.round((math + science) / 2);
    return {
      composite: Math.round(average),
      average: average,
      averageLabel: average.toFixed(2),
      stem: stem,
      format: isClassic ? "classic" : "enhanced"
    };
  }

  function calculate() {
    var resultEl = document.getElementById("act-result");
    if (!resultEl) return;
    var formatEl = document.getElementById("act-format");
    var format = formatEl ? formatEl.value : "enhanced";
    var wrap = document.getElementById("act-science-wrap");
    if (wrap) wrap.hidden = false;
    var out = calc(
      document.getElementById("act-english").value,
      document.getElementById("act-math").value,
      document.getElementById("act-reading").value,
      document.getElementById("act-science").value,
      format
    );
    if (!out) { resultEl.classList.remove('show'); return; }
    var compEl = document.getElementById("act-composite");
    var avgEl = document.getElementById("act-average");
    var stemEl = document.getElementById("act-stem");
    if (compEl) compEl.textContent = String(out.composite);
    if (avgEl) avgEl.textContent = out.averageLabel;
    if (stemEl) stemEl.textContent = out.stem === null ? "Not taken" : String(out.stem);
    resultEl.classList.add('show');
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("act-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["act-format", "act-english", "act-math", "act-reading", "act-science"].forEach(function (id) {
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
