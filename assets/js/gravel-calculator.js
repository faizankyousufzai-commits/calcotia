(function () {
  "use strict";

  var DENSITIES = {
    pea: 1.35,
    crushed: 1.40
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
    var density = num(opts.density, DENSITIES.pea);
    if (isNaN(lengthFt) || isNaN(widthFt) || isNaN(depthIn)) return null;
    if (lengthFt <= 0 || widthFt <= 0 || depthIn <= 0) return null;
    if (wastePct < 0) wastePct = 0;
    var areaSqFt = lengthFt * widthFt;
    var cuFt = areaSqFt * (depthIn / 12);
    var cuYd = cuFt / 27;
    var orderYd = ceil2(cuYd * (1 + wastePct / 100));
    var orderCuFt = round2(orderYd * 27);
    var tons = round2(orderYd * density);
    var bags = Math.ceil(orderCuFt / 0.5);
    return {
      areaSqFt: round2(areaSqFt),
      cuFt: round2(cuFt),
      cuYd: round2(cuYd),
      orderYd: orderYd,
      orderCuFt: orderCuFt,
      tons: tons,
      bags: bags,
      wastePct: wastePct
    };
  }

  function calculate() {
    var lengthEl = document.getElementById("gravel-length");
    var widthEl = document.getElementById("gravel-width");
    var depthEl = document.getElementById("gravel-depth");
    var typeEl = document.getElementById("gravel-type");
    var wasteEl = document.getElementById("gravel-waste");
    var resultEl = document.getElementById("gravel-result");
    if (!lengthEl || !widthEl || !depthEl || !resultEl) return;
    var density = DENSITIES.pea;
    if (typeEl && typeEl.value === "crushed") density = DENSITIES.crushed;
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
    set("gravel-cuft", out.cuFt.toFixed(2) + " cu ft");
    set("gravel-cuyd", out.cuYd.toFixed(2) + " cubic yards");
    set("gravel-order", out.orderYd.toFixed(2) + " cubic yards");
    set("gravel-tons", out.tons.toFixed(2) + " tons");
    set("gravel-bags", String(out.bags) + " bags (50 lb)");
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("gravel-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["gravel-length", "gravel-width", "gravel-depth", "gravel-type", "gravel-waste"].forEach(function (id) {
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
