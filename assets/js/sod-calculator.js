(function () {
  "use strict";

  var SLAB_SQ_FT = 2.67;
  var ROLL_SQ_FT = 10;

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function num(value, fallback) {
    var n = parseFloat(value);
    return isNaN(n) ? fallback : n;
  }

  function calc(opts) {
    var lengthFt = num(opts.lengthFt, NaN);
    var widthFt = num(opts.widthFt, NaN);
    var wastePct = num(opts.wastePct, 10);
    var palletSqFt = num(opts.palletSqFt, 450);
    var pricePerPallet = num(opts.pricePerPallet, 0);
    if (isNaN(lengthFt) || isNaN(widthFt)) return null;
    if (lengthFt <= 0 || widthFt <= 0) return null;
    if (wastePct < 0) wastePct = 0;
    if (palletSqFt <= 0) palletSqFt = 450;
    var areaSqFt = lengthFt * widthFt;
    var orderSqFt = round2(areaSqFt * (1 + wastePct / 100));
    var pallets = Math.ceil(orderSqFt / palletSqFt);
    var rolls = Math.ceil(orderSqFt / ROLL_SQ_FT);
    var pieces = Math.ceil(orderSqFt / SLAB_SQ_FT);
    var cost = pricePerPallet > 0 ? round2(pallets * pricePerPallet) : null;
    return {
      areaSqFt: round2(areaSqFt),
      orderSqFt: orderSqFt,
      pallets: pallets,
      rolls: rolls,
      pieces: pieces,
      cost: cost,
      wastePct: wastePct,
      palletSqFt: palletSqFt
    };
  }

  function calculate() {
    var lengthEl = document.getElementById("sod-length");
    var widthEl = document.getElementById("sod-width");
    var wasteEl = document.getElementById("sod-waste");
    var palletEl = document.getElementById("sod-pallet");
    var priceEl = document.getElementById("sod-price");
    var resultEl = document.getElementById("sod-result");
    if (!lengthEl || !widthEl || !resultEl) return;
    var out = calc({
      lengthFt: lengthEl.value,
      widthFt: widthEl.value,
      wastePct: wasteEl ? wasteEl.value : 10,
      palletSqFt: palletEl ? palletEl.value : 450,
      pricePerPallet: priceEl ? priceEl.value : 0
    });
    if (!out) {
      resultEl.classList.remove("show");
      return;
    }
    var set = function (id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set("sod-area", out.areaSqFt.toFixed(2) + " sq ft");
    set("sod-order", out.orderSqFt.toFixed(2) + " sq ft");
    set("sod-pallets", String(out.pallets) + " pallets");
    set("sod-rolls", String(out.rolls) + " rolls");
    set("sod-pieces", String(out.pieces) + " pieces (16 x 24 in)");
    set("sod-cost", out.cost === null ? "Add a price per pallet to see the cost" : "$" + out.cost.toFixed(2));
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("sod-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["sod-length", "sod-width", "sod-waste", "sod-pallet", "sod-price"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", calculate);
        el.addEventListener("change", calculate);
      }
    });
    calculate();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc, slabSqFt: SLAB_SQ_FT, rollSqFt: ROLL_SQ_FT };
  }
})();
