(function () {
  "use strict";

  function num(value) {
    var n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  function calc(shape, unit, length, width, diameter, height) {
    length = num(length); width = num(width); diameter = num(diameter); height = num(height);
    if (height === null || height <= 0) return null;
    var cubicIn = null;
    var litres = null;
    if (unit === "cm") {
      if (shape === "cylinder") {
        if (diameter === null || diameter <= 0) return null;
        var rCm = diameter / 2;
        litres = Math.PI * rCm * rCm * height / 1000;
      } else {
        if (length === null || width === null || length <= 0 || width <= 0) return null;
        litres = length * width * height / 1000;
      }
      var gallons = litres / 3.785;
      var uk = litres / 4.546;
      return {
        gallons: gallons,
        gallonsLabel: gallons.toFixed(1) + " gal",
        litres: litres,
        litresLabel: litres.toFixed(1) + " L",
        uk: uk,
        ukLabel: uk.toFixed(1) + " gal",
        actual: gallons * 0.9,
        actualLabel: "About " + (gallons * 0.9).toFixed(1) + " gal"
      };
    }
    if (shape === "cylinder") {
      if (diameter === null || diameter <= 0) return null;
      var rIn = diameter / 2;
      cubicIn = Math.PI * rIn * rIn * height;
    } else {
      if (length === null || width === null || length <= 0 || width <= 0) return null;
      cubicIn = length * width * height;
    }
    var gal = cubicIn / 231;
    var lit = gal * 3.785;
    var ukGal = cubicIn / 277.4;
    return {
      gallons: gal,
      gallonsLabel: gal.toFixed(1) + " gal",
      litres: lit,
      litresLabel: lit.toFixed(1) + " L",
      uk: ukGal,
      ukLabel: ukGal.toFixed(1) + " gal",
      actual: gal * 0.9,
      actualLabel: "About " + (gal * 0.9).toFixed(1) + " gal"
    };
  }

  function calculate() {
    var resultEl = document.getElementById("aq-result");
    if (!resultEl) return;
    var shapeEl = document.getElementById("aq-shape");
    var unitEl = document.getElementById("aq-unit");
    var shape = shapeEl ? shapeEl.value : "rectangular";
    var unit = unitEl ? unitEl.value : "inches";
    var lenWrap = document.getElementById("aq-length-wrap");
    var widWrap = document.getElementById("aq-width-wrap");
    var diaWrap = document.getElementById("aq-diameter-wrap");
    var isCyl = shape === "cylinder";
    if (lenWrap) lenWrap.hidden = isCyl;
    if (widWrap) widWrap.hidden = isCyl;
    if (diaWrap) diaWrap.hidden = !isCyl;
    var out = calc(
      shape, unit,
      document.getElementById("aq-length").value,
      document.getElementById("aq-width").value,
      document.getElementById("aq-diameter").value,
      document.getElementById("aq-height").value
    );
    if (!out) { resultEl.classList.remove('show'); return; }
    var galEl = document.getElementById("aq-gallons");
    var litEl = document.getElementById("aq-litres");
    var ukEl = document.getElementById("aq-uk");
    var actEl = document.getElementById("aq-actual");
    if (galEl) galEl.textContent = out.gallonsLabel;
    if (litEl) litEl.textContent = out.litresLabel;
    if (ukEl) ukEl.textContent = out.ukLabel;
    if (actEl) actEl.textContent = out.actualLabel;
    resultEl.classList.add('show');
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("aq-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["aq-shape", "aq-unit", "aq-length", "aq-width", "aq-diameter", "aq-height"].forEach(function (id) {
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
