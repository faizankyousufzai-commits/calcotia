(function () {
  "use strict";

  var RATIOS = { drip: 16, "pour-over": 16, "french-press": 15 };
  var ML_PER_CUP = 237;
  var OZ_PER_CUP = 8;
  var GRAMS_PER_TBSP = 7;

  function num(value) {
    var n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function calc(cups, method) {
    cups = num(cups);
    if (cups === null || cups < 1) return null;
    var ratio = RATIOS[method];
    if (!ratio) return null;
    var waterMl = cups * ML_PER_CUP;
    var waterOz = cups * OZ_PER_CUP;
    var grams = waterMl / ratio;
    return {
      cups: cups,
      method: method,
      ratio: ratio,
      waterMl: waterMl,
      waterOz: waterOz,
      grams: round1(grams),
      tbsp: Math.round(grams / GRAMS_PER_TBSP),
      low: round1(waterMl / 15),
      high: round1(waterMl / 18)
    };
  }

  function calculate() {
    var resultEl = document.getElementById("coffee-result");
    if (!resultEl) return;
    var methodEl = document.getElementById("coffee-method");
    var method = methodEl ? methodEl.value : "drip";
    var out = calc(document.getElementById("coffee-cups").value, method);
    if (!out) {
      resultEl.classList.remove("show");
      return;
    }
    var gramsEl = document.getElementById("coffee-grams");
    var waterEl = document.getElementById("coffee-water");
    var ratioEl = document.getElementById("coffee-ratio");
    var tbspEl = document.getElementById("coffee-tbsp");
    var rangeEl = document.getElementById("coffee-range");
    if (gramsEl) gramsEl.textContent = out.grams + " g";
    if (waterEl) waterEl.textContent = out.waterMl + " ml (" + out.waterOz + " fl oz)";
    if (ratioEl) ratioEl.textContent = "1:" + out.ratio;
    if (tbspEl) tbspEl.textContent = "about " + out.tbsp + " tbsp";
    if (rangeEl) rangeEl.textContent = out.low + " g - " + out.high + " g";
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("coffee-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["coffee-cups", "coffee-method"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", calculate);
        el.addEventListener("change", calculate);
      }
    });
    calculate();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc, ratios: RATIOS };
  }
})();
