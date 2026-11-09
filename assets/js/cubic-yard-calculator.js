(function () {
  "use strict";

  var DENSITIES = {
    topsoil: 1.05,
    gravel: 1.35
  };

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function ceil2(n) {
    return Math.ceil(n * 100) / 100;
  }

  function num(value, fallback) {
    var n = parseFloat(value);
    return isNaN(n) ? fallback : n;
  }

  function calc(opts) {
    var lengthFt = num(opts.lengthFt, NaN);
    var widthFt = num(opts.widthFt, NaN);
    var depthIn = num(opts.depthIn, NaN);
    var wastePct = num(opts.wastePct, 10);
    var density = num(opts.density, 0);
    if (isNaN(lengthFt) || isNaN(widthFt) || isNaN(depthIn)) return null;
    if (lengthFt <= 0 || widthFt <= 0 || depthIn <= 0) return null;
    if (wastePct < 0) wastePct = 0;
    var areaSqFt = lengthFt * widthFt;
    var cuFt = areaSqFt * (depthIn / 12);
    var cuYd = cuFt / 27;
    var orderYd = ceil2(cuYd * (1 + wastePct / 100));
    var tons = density > 0 ? round2(orderYd * density) : null;
    return {
      areaSqFt: round2(areaSqFt),
      cuFt: round2(cuFt),
      cuYd: round2(cuYd),
      orderYd: orderYd,
      tons: tons,
      wastePct: wastePct
    };
  }

  function calculate() {
    var lengthEl = document.getElementById("cy-length");
    var widthEl = document.getElementById("cy-width");
    var depthEl = document.getElementById("cy-depth");
    var materialEl = document.getElementById("cy-material");
    var wasteEl = document.getElementById("cy-waste");
    var resultEl = document.getElementById("cy-result");
    if (!lengthEl || !widthEl || !depthEl || !resultEl) return;
    var density = 0;
    if (materialEl) {
      if (materialEl.value === "topsoil") density = DENSITIES.topsoil;
      if (materialEl.value === "gravel") density = DENSITIES.gravel;
    }
    var out = calc({
      lengthFt: lengthEl.value,
      widthFt: widthEl.value,
      depthIn: depthEl.value,
      wastePct: wasteEl ? wasteEl.value : 10,
      density: density
    });
    if (!out) {
      resultEl.classList.remove("show");
      return;
    }
    var set = function (id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set("cy-cuft", out.cuFt.toFixed(2) + " cu ft");
    set("cy-cuyd", out.cuYd.toFixed(2) + " cubic yards");
    set("cy-order", out.orderYd.toFixed(2) + " cubic yards");
    set("cy-tons", out.tons === null ? "Pick a material to see tons" : out.tons.toFixed(2) + " tons");
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("cy-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["cy-length", "cy-width", "cy-depth", "cy-material", "cy-waste"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", calculate);
        el.addEventListener("change", calculate);
      }
    });
    calculate();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc, densities: DENSITIES };
  }
})();
