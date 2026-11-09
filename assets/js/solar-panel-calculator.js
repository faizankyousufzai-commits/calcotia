(function () {
  "use strict";

  var DERATE = 0.86; // PVWatts default: 14% system losses

  function calc(monthlyKwh, sunHours, panelWatts, costPerWatt) {
    var monthly = parseFloat(monthlyKwh);
    var sun = parseFloat(sunHours);
    var watts = parseFloat(panelWatts);
    var cost = parseFloat(costPerWatt);
    if (isNaN(monthly) || isNaN(sun) || isNaN(watts) || isNaN(cost)) return null;
    if (monthly <= 0 || sun <= 0 || sun > 12 || watts < 100 || watts > 1000 || cost < 0) return null;
    var dailyKwh = monthly / 30.4;
    var systemKw = dailyKwh / (sun * DERATE);
    var panels = Math.ceil((systemKw * 1000) / watts);
    var actualKw = (panels * watts) / 1000;
    var estCost = actualKw * 1000 * cost;
    return {
      dailyKwh: dailyKwh,
      systemKw: systemKw,
      panels: panels,
      actualKw: actualKw,
      estCost: estCost
    };
  }

  function calculate() {
    var monthlyInput = document.getElementById("solar-kwh");
    var sunInput = document.getElementById("solar-sun");
    var wattsInput = document.getElementById("solar-watts");
    var costInput = document.getElementById("solar-cost");
    var resultEl = document.getElementById("solar-result");
    if (!monthlyInput || !sunInput || !wattsInput || !costInput || !resultEl) return;
    var out = calc(monthlyInput.value, sunInput.value, wattsInput.value, costInput.value);
    if (!out) {
      resultEl.classList.remove("show");
      return;
    }
    var panelsEl = document.getElementById("solar-panels");
    var dailyEl = document.getElementById("solar-daily");
    var sizeEl = document.getElementById("solar-size");
    var costEl = document.getElementById("solar-total");
    if (panelsEl) panelsEl.textContent = out.panels + " panels";
    if (dailyEl) dailyEl.textContent = out.dailyKwh.toFixed(1) + " kWh per day";
    if (sizeEl) sizeEl.textContent = out.actualKw.toFixed(1) + " kW";
    if (costEl) costEl.textContent = "$" + Math.round(out.estCost).toLocaleString("en-US");
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("solar-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["solar-kwh", "solar-sun", "solar-watts", "solar-cost"].forEach(function (id) {
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
