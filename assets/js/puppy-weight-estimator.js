(function () {
  "use strict";

  var DOUBLING_AGE_WEEKS = {
    toy: 14,
    small: 14,
    medium: 16,
    large: 20,
    giant: 22
  };
  var WEEKS_PER_MONTH = 4.345;
  var LB_PER_KG = 2.20462;

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function calc(age, ageUnit, weight, weightUnit, sizeGroup) {
    var ageNum = parseFloat(age);
    var weightNum = parseFloat(weight);
    if (isNaN(ageNum) || isNaN(weightNum) || ageNum <= 0 || weightNum <= 0) return null;
    var group = DOUBLING_AGE_WEEKS.hasOwnProperty(sizeGroup) ? sizeGroup : "medium";
    var c = DOUBLING_AGE_WEEKS[group];
    var ageWeeks = ageUnit === "months" ? ageNum * WEEKS_PER_MONTH : ageNum;
    var weightLb = weightUnit === "kg" ? weightNum * LB_PER_KG : weightNum;
    var adultLb = weightLb * (ageWeeks + c) / ageWeeks;
    var lowLb = adultLb * 0.85;
    var highLb = adultLb * 1.15;
    var unit = weightUnit === "kg" ? "kg" : "lb";
    var adult = weightUnit === "kg" ? adultLb / LB_PER_KG : adultLb;
    var low = weightUnit === "kg" ? lowLb / LB_PER_KG : lowLb;
    var high = weightUnit === "kg" ? highLb / LB_PER_KG : highLb;
    return {
      sizeGroup: group,
      doublingAgeWeeks: c,
      ageWeeks: ageWeeks,
      adult: round1(adult),
      low: round1(low),
      high: round1(high),
      unit: unit
    };
  }

  function calculate() {
    var ageEl = document.getElementById("puppy-age");
    var ageUnitEl = document.getElementById("puppy-age-unit");
    var weightEl = document.getElementById("puppy-weight");
    var weightUnitEl = document.getElementById("puppy-weight-unit");
    var sizeEl = document.getElementById("puppy-size");
    var resultEl = document.getElementById("puppy-result");
    if (!ageEl || !weightEl || !sizeEl || !resultEl) return;
    var out = calc(
      ageEl.value,
      ageUnitEl ? ageUnitEl.value : "weeks",
      weightEl.value,
      weightUnitEl ? weightUnitEl.value : "lb",
      sizeEl.value
    );
    if (!out) {
      resultEl.classList.remove("show");
      return;
    }
    var rangeEl = document.getElementById("puppy-range");
    var adultEl = document.getElementById("puppy-adult");
    var lowEl = document.getElementById("puppy-low");
    var highEl = document.getElementById("puppy-high");
    var groupEl = document.getElementById("puppy-group");
    if (rangeEl) rangeEl.textContent = out.low.toFixed(1) + " - " + out.high.toFixed(1) + " " + out.unit;
    if (adultEl) adultEl.textContent = out.adult.toFixed(1) + " " + out.unit;
    if (lowEl) lowEl.textContent = out.low.toFixed(1) + " " + out.unit;
    if (highEl) highEl.textContent = out.high.toFixed(1) + " " + out.unit;
    if (groupEl) groupEl.textContent = out.sizeGroup.charAt(0).toUpperCase() + out.sizeGroup.slice(1);
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("puppy-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["puppy-age", "puppy-age-unit", "puppy-weight", "puppy-weight-unit", "puppy-size"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", calculate);
        el.addEventListener("change", calculate);
      }
    });
    calculate();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc, doublingAgeWeeks: DOUBLING_AGE_WEEKS };
  }
})();
