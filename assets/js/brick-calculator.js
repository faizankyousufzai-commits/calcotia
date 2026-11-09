(function () {
  "use strict";

  var BRICKS_PER_SQ_FT = {
    modular: 6.75,
    king: 4.5
  };
  var MORTAR_BAGS_PER_100_SQ_FT = 7;

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  function num(value, fallback) {
    var n = parseFloat(value);
    return isNaN(n) ? fallback : n;
  }

  function calc(opts) {
    var lengthFt = num(opts.lengthFt, NaN);
    var heightFt = num(opts.heightFt, NaN);
    var openingsSqFt = num(opts.openingsSqFt, 0);
    var bricksPerSqFt = num(opts.bricksPerSqFt, BRICKS_PER_SQ_FT.modular);
    var wythes = num(opts.wythes, 1);
    var wastePct = num(opts.wastePct, 10);
    var pricePerBrick = num(opts.pricePerBrick, 0);
    if (isNaN(lengthFt) || isNaN(heightFt)) return null;
    if (lengthFt <= 0 || heightFt <= 0) return null;
    if (openingsSqFt < 0) openingsSqFt = 0;
    if (wastePct < 0) wastePct = 0;
    if (wythes !== 1 && wythes !== 2) wythes = 1;
    var grossArea = lengthFt * heightFt;
    var netArea = Math.max(0, grossArea - openingsSqFt);
    var bricksBase = round2(netArea * bricksPerSqFt * wythes);
    var bricksOrder = Math.ceil(bricksBase * (1 + wastePct / 100));
    var mortarBags = Math.ceil((netArea / 100) * MORTAR_BAGS_PER_100_SQ_FT * wythes);
    var cost = pricePerBrick > 0 ? round2(bricksOrder * pricePerBrick) : null;
    return {
      grossArea: round2(grossArea),
      netArea: round2(netArea),
      bricksPerSqFt: bricksPerSqFt,
      bricksBase: bricksBase,
      bricksOrder: bricksOrder,
      mortarBags: mortarBags,
      cost: cost,
      wastePct: wastePct,
      wythes: wythes
    };
  }

  function calculate() {
    var lengthEl = document.getElementById("brick-length");
    var heightEl = document.getElementById("brick-height");
    var openingsEl = document.getElementById("brick-openings");
    var typeEl = document.getElementById("brick-type");
    var wytheEl = document.getElementById("brick-wythe");
    var wasteEl = document.getElementById("brick-waste");
    var priceEl = document.getElementById("brick-price");
    var resultEl = document.getElementById("brick-result");
    if (!lengthEl || !heightEl || !resultEl) return;
    var bricksPerSqFt = BRICKS_PER_SQ_FT.modular;
    if (typeEl && typeEl.value === "king") bricksPerSqFt = BRICKS_PER_SQ_FT.king;
    var out = calc({
      lengthFt: lengthEl.value,
      heightFt: heightEl.value,
      openingsSqFt: openingsEl ? openingsEl.value : 0,
      bricksPerSqFt: bricksPerSqFt,
      wythes: wytheEl ? wytheEl.value : 1,
      wastePct: wasteEl ? wasteEl.value : 10,
      pricePerBrick: priceEl ? priceEl.value : 0
    });
    if (!out) {
      resultEl.classList.remove("show");
      return;
    }
    var set = function (id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set("brick-gross", out.grossArea.toFixed(2) + " sq ft");
    set("brick-net", out.netArea.toFixed(2) + " sq ft");
    set("brick-per", out.bricksPerSqFt.toFixed(2) + " bricks per sq ft");
    set("brick-base", String(out.bricksBase) + " bricks");
    set("brick-order", String(out.bricksOrder) + " bricks");
    set("brick-mortar", String(out.mortarBags) + " bags (80 lb)");
    set("brick-cost", out.cost === null ? "Add a price per brick to see the cost" : "$" + out.cost.toFixed(2));
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("brick-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["brick-length", "brick-height", "brick-openings", "brick-type", "brick-wythe", "brick-waste", "brick-price"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", calculate);
        el.addEventListener("change", calculate);
      }
    });
    calculate();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc, bricksPerSqFt: BRICKS_PER_SQ_FT, mortarBagsPer100SqFt: MORTAR_BAGS_PER_100_SQ_FT };
  }
})();
