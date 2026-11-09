(function () {
  "use strict";

  var DENSITY_TONS_PER_YD = 1.05;

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
    var bagCuFt = num(opts.bagCuFt, 1);
    if (isNaN(lengthFt) || isNaN(widthFt) || isNaN(depthIn)) return null;
    if (lengthFt <= 0 || widthFt <= 0 || depthIn <= 0) return null;
    if (wastePct < 0) wastePct = 0;
    if (bagCuFt <= 0) bagCuFt = 1;
    var areaSqFt = lengthFt * widthFt;
    var cuFt = areaSqFt * (depthIn / 12);
    var cuYd = cuFt / 27;
    var orderYd = ceil2(cuYd * (1 + wastePct / 100));
    var orderCuFt = round2(orderYd * 27);
    var tons = round2(orderYd * DENSITY_TONS_PER_YD);
    var bags = Math.ceil(orderCuFt / bagCuFt);
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
    var lengthEl = document.getElementById("topsoil-length");
    var widthEl = document.getElementById("topsoil-width");
    var depthEl = document.getElementById("topsoil-depth");
    var bagEl = document.getElementById("topsoil-bag");
    var wasteEl = document.getElementById("topsoil-waste");
    var resultEl = document.getElementById("topsoil-result");
    if (!lengthEl || !widthEl || !depthEl || !resultEl) return;
    var out = calc({
      lengthFt: lengthEl.value,
      widthFt: widthEl.value,
      depthIn: depthEl.value,
      wastePct: wasteEl ? wasteEl.value : 10,
      bagCuFt: bagEl ? bagEl.value : 1
    });
    if (!out) {
      resultEl.classList.remove("show");
      return;
    }
    var set = function (id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set("topsoil-cuft", out.cuFt.toFixed(2) + " cu ft");
    set("topsoil-cuyd", out.cuYd.toFixed(2) + " cubic yards");
    set("topsoil-order", out.orderYd.toFixed(2) + " cubic yards");
    set("topsoil-tons", out.tons.toFixed(2) + " tons");
    set("topsoil-bags", String(out.bags) + " bags");
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("topsoil-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["topsoil-length", "topsoil-width", "topsoil-depth", "topsoil-bag", "topsoil-waste"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", calculate);
        el.addEventListener("change", calculate);
      }
    });
    calculate();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc, densityTonsPerYd: DENSITY_TONS_PER_YD };
  }
})();
