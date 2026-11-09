(function () {
  "use strict";

  var ACTIVITY_ADD = { sedentary: 0, light: 12, moderate: 24, active: 36 };
  var HOT_ADD = 12; // extra ounces in hot and humid weather
  var OZ_TO_L = 0.0295735;

  function calc(weightValue, unit, activity, climate) {
    var weight = parseFloat(weightValue);
    if (isNaN(weight) || weight <= 0) return null;
    var pounds = unit === "kg" ? weight * 2.20462 : weight;
    if (pounds <= 0 || pounds > 1500) return null;
    var add = ACTIVITY_ADD[activity];
    if (add === undefined) return null;
    var oz = pounds / 2 + add + (climate === "hot" ? HOT_ADD : 0);
    return {
      oz: Math.round(oz),
      liters: oz * OZ_TO_L,
      cups: oz / 8
    };
  }

  function calculate() {
    var weightInput = document.getElementById("water-weight");
    var unitInput = document.getElementById("water-unit");
    var activityInput = document.getElementById("water-activity");
    var climateInput = document.getElementById("water-climate");
    var resultEl = document.getElementById("water-result");
    if (!weightInput || !unitInput || !activityInput || !climateInput || !resultEl) return;
    var out = calc(weightInput.value, unitInput.value, activityInput.value, climateInput.value);
    if (!out) {
      resultEl.classList.remove("show");
      return;
    }
    var ozEl = document.getElementById("water-oz");
    var litersEl = document.getElementById("water-liters");
    var cupsEl = document.getElementById("water-cups");
    if (ozEl) ozEl.textContent = out.oz + " fl oz per day";
    if (litersEl) litersEl.textContent = out.liters.toFixed(2) + " litres";
    if (cupsEl) cupsEl.textContent = out.cups.toFixed(1) + " cups";
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("water-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["water-weight", "water-unit", "water-activity", "water-climate"].forEach(function (id) {
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
