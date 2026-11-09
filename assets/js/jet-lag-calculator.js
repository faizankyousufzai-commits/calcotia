(function () {
  "use strict";

  function num(value) {
    var n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  function parseTime(value) {
    if (!value) return null;
    var parts = String(value).split(":");
    if (parts.length < 2) return null;
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
    return { h: h, m: m };
  }

  function formatTime(t) {
    var h24 = ((t.h % 24) + 24) % 24;
    var suffix = h24 >= 12 ? "PM" : "AM";
    var h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    var mm = String(t.m).padStart(2, "0");
    return h12 + ":" + mm + " " + suffix;
  }

  function shiftTime(t, hours, direction) {
    var delta = direction === "east" ? -hours : hours;
    return { h: t.h + delta, m: t.m };
  }

  function calc(zones, direction, bedtimeValue, arrivalValue) {
    zones = num(zones);
    if (zones === null || zones < 1 || zones > 12 || Math.floor(zones) !== zones) return null;
    if (direction !== "east" && direction !== "west") return null;
    var bedtime = parseTime(bedtimeValue);
    var arrival = parseTime(arrivalValue);
    if (!bedtime || !arrival) return null;
    var rate = direction === "east" ? 1 : 0.5;
    var days = zones * rate;
    var daysLabel = (days % 1 === 0 ? String(days) : days.toFixed(1)) + (days === 1 ? " day" : " days");
    var shiftDays = Math.min(zones, 3);
    var plan = [];
    for (var i = shiftDays; i >= 1; i--) {
      var shiftAmount = shiftDays - i + 1;
      plan.push({
        label: i + (i === 1 ? " night before" : " nights before"),
        bedtime: formatTime(shiftTime(bedtime, shiftAmount, direction))
      });
    }
    var napTip = arrival.h < 12
      ? "A short nap of 20-30 minutes is fine."
      : "Skip naps; stay up until local bedtime.";
    return {
      zones: zones,
      direction: direction,
      days: days,
      daysLabel: daysLabel,
      plan: plan,
      napTip: napTip
    };
  }

  function calculate() {
    var resultEl = document.getElementById("jetlag-result");
    if (!resultEl) return;
    var dirEl = document.getElementById("jetlag-direction");
    var direction = dirEl ? dirEl.value : "east";
    var out = calc(
      document.getElementById("jetlag-zones").value,
      direction,
      document.getElementById("jetlag-bedtime").value,
      document.getElementById("jetlag-arrival").value
    );
    if (!out) {
      resultEl.classList.remove("show");
      return;
    }
    var daysEl = document.getElementById("jetlag-days");
    var zonesEl = document.getElementById("jetlag-zones-out");
    var dirOutEl = document.getElementById("jetlag-dir");
    var napEl = document.getElementById("jetlag-nap");
    var rowsEl = document.getElementById("jetlag-rows");
    if (daysEl) daysEl.textContent = out.daysLabel;
    if (zonesEl) zonesEl.textContent = String(out.zones);
    if (dirOutEl) dirOutEl.textContent = out.direction === "east" ? "Eastbound" : "Westbound";
    if (napEl) napEl.textContent = out.napTip;
    if (rowsEl) {
      rowsEl.innerHTML = out.plan.map(function (p) {
        return "<tr><td>" + p.label + "</td><td>" + p.bedtime + "</td></tr>";
      }).join("");
    }
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("jetlag-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["jetlag-zones", "jetlag-direction", "jetlag-bedtime", "jetlag-arrival"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", calculate);
        el.addEventListener("change", calculate);
      }
    });
    calculate();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc, parseTime: parseTime, formatTime: formatTime };
  }
})();
