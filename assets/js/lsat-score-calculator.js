(function () {
  "use strict";

  // Published conversion approximation for the current LSAT format
  // (2 Logical Reasoning + 1 Reading Comprehension, ~75-78 scored questions).
  // Anchors from published post-2024 conversion tables: raw 75+ = 180,
  // 68-69 = 170, 53-55 = 160, 47 = 155. LSAC uses its own table per test,
  // so every result here is an estimate, not an official score.
  var CONVERSION = [
    [0, 120], [15, 120], [20, 130], [26, 140], [33, 145], [40, 150],
    [47, 155], [54, 160], [61, 165], [68, 170], [72, 175], [75, 180], [78, 180]
  ];

  function scaledFromRaw(raw) {
    if (raw <= CONVERSION[0][0]) return 120;
    for (var i = 1; i < CONVERSION.length; i++) {
      var r0 = CONVERSION[i - 1][0];
      var s0 = CONVERSION[i - 1][1];
      var r1 = CONVERSION[i][0];
      var s1 = CONVERSION[i][1];
      if (raw <= r1) {
        if (r1 === r0) return s1;
        return Math.round(s0 + ((raw - r0) / (r1 - r0)) * (s1 - s0));
      }
    }
    return 180;
  }

  function scoreNote(scaled) {
    if (scaled >= 170) return "Top tier. A score of 170 or above is competitive for the most selective law schools.";
    if (scaled >= 160) return "Strong. A score of 160 or above is competitive for many good law schools.";
    if (scaled >= 150) return "Around the median. The median LSAT score is about 152 to 154.";
    return "Below the median. The median LSAT score is about 152 to 154, so there is room to improve.";
  }

  function calc(lr1Value, lr2Value, rcValue) {
    var lr1 = parseInt(lr1Value, 10);
    var lr2 = parseInt(lr2Value, 10);
    var rc = parseInt(rcValue, 10);
    if (isNaN(lr1) || isNaN(lr2) || isNaN(rc)) return null;
    if (lr1 < 0 || lr1 > 26 || lr2 < 0 || lr2 > 26 || rc < 0 || rc > 28) return null;
    var raw = lr1 + lr2 + rc;
    var scaled = scaledFromRaw(raw);
    return { raw: raw, scaled: scaled, note: scoreNote(scaled) };
  }

  function calculate() {
    var lr1Input = document.getElementById("lsat-lr1");
    var lr2Input = document.getElementById("lsat-lr2");
    var rcInput = document.getElementById("lsat-rc");
    var resultEl = document.getElementById("lsat-result");
    if (!lr1Input || !lr2Input || !rcInput || !resultEl) return;
    var out = calc(lr1Input.value, lr2Input.value, rcInput.value);
    if (!out) {
      resultEl.classList.remove("show");
      return;
    }
    var scaledEl = document.getElementById("lsat-scaled");
    var rawEl = document.getElementById("lsat-raw");
    var noteEl = document.getElementById("lsat-note");
    if (scaledEl) scaledEl.textContent = out.scaled;
    if (rawEl) rawEl.textContent = out.raw + " correct out of about 77";
    if (noteEl) noteEl.textContent = out.note;
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("lsat-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["lsat-lr1", "lsat-lr2", "lsat-rc"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", calculate);
        el.addEventListener("change", calculate);
      }
    });
    calculate();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc, scaledFromRaw: scaledFromRaw };
  }
})();
