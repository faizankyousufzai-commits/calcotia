(function () {
  "use strict";

  function num(value) {
    var n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  function calc(widthFt, heightFt, rollWidthIn, rollLengthFt, repeatIn, wastePct) {
    widthFt = num(widthFt); heightFt = num(heightFt);
    rollWidthIn = num(rollWidthIn); rollLengthFt = num(rollLengthFt);
    repeatIn = num(repeatIn); wastePct = num(wastePct);
    if (widthFt === null || heightFt === null || rollWidthIn === null ||
        rollLengthFt === null || repeatIn === null || wastePct === null) return null;
    if (widthFt <= 0 || heightFt <= 0 || rollWidthIn <= 0 || rollLengthFt <= 0) return null;
    if (repeatIn < 0 || wastePct < 0) return null;
    var stripLen = heightFt * 12 + 4;
    if (repeatIn > 0) stripLen = Math.ceil(stripLen / repeatIn) * repeatIn;
    var stripsPerRoll = Math.max(1, Math.floor((rollLengthFt * 12) / stripLen));
    var stripsNeeded = Math.ceil((widthFt * 12) / rollWidthIn);
    var baseRolls = Math.ceil(stripsNeeded / stripsPerRoll);
    var rolls = Math.ceil(baseRolls * (1 + wastePct / 100));
    return {
      rolls: rolls,
      area: widthFt * heightFt,
      areaLabel: (widthFt * heightFt) + " sq ft",
      stripsNeeded: stripsNeeded,
      stripsPerRoll: stripsPerRoll,
      stripLen: stripLen,
      stripLenLabel: stripLen + " in",
      baseRolls: baseRolls
    };
  }

  function calculate() {
    var resultEl = document.getElementById("wall-result");
    if (!resultEl) return;
    var out = calc(
      document.getElementById("wall-width").value,
      document.getElementById("wall-height").value,
      document.getElementById("wall-roll-width").value,
      document.getElementById("wall-roll-length").value,
      document.getElementById("wall-repeat").value,
      document.getElementById("wall-waste").value
    );
    if (!out) { resultEl.classList.remove('show'); return; }
    var rollsEl = document.getElementById("wall-rolls");
    var areaEl = document.getElementById("wall-area");
    var stripsEl = document.getElementById("wall-strips");
    var perEl = document.getElementById("wall-per-roll");
    var lenEl = document.getElementById("wall-strip-len");
    if (rollsEl) rollsEl.textContent = out.rolls + (out.rolls === 1 ? " roll" : " rolls");
    if (areaEl) areaEl.textContent = out.areaLabel;
    if (stripsEl) stripsEl.textContent = String(out.stripsNeeded);
    if (perEl) perEl.textContent = String(out.stripsPerRoll);
    if (lenEl) lenEl.textContent = out.stripLenLabel;
    resultEl.classList.add('show');
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("wall-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["wall-width", "wall-height", "wall-roll-width", "wall-roll-length", "wall-repeat", "wall-waste"].forEach(function (id) {
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
