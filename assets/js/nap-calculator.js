(function () {
  "use strict";

  function parseTime(value) {
    if (!value) return null;
    var parts = String(value).split(":");
    if (parts.length !== 2) return null;
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
    return h * 60 + m;
  }

  function formatTime(totalMinutes) {
    var mins = ((totalMinutes % 1440) + 1440) % 1440;
    var h = Math.floor(mins / 60);
    var m = mins % 60;
    var ampm = h >= 12 ? "PM" : "AM";
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return h12 + ":" + String(m).padStart(2, "0") + " " + ampm;
  }

  function stageNote(minutes) {
    if (minutes <= 20) return "Light sleep. You should wake up clear-headed, with no grogginess.";
    if (minutes <= 30) return "Light to deeper sleep. NASA research found a 26-minute nap boosts alertness and performance.";
    if (minutes <= 60) return "Warning: you may wake from deep sleep and feel groggy. This is sleep inertia, and it can last up to an hour.";
    if (minutes < 90) return "You may wake from deep sleep. A 90-minute nap is usually better, because it completes a full cycle.";
    if (minutes === 90) return "Full sleep cycle. You pass through light sleep, deep sleep, and REM, then wake as sleep turns light again.";
    return "More than one sleep cycle. You should wake near the end of a cycle, but a nap this long can steal sleep from the night ahead.";
  }

  function calc(startValue, minutesValue) {
    var start = parseTime(startValue);
    var minutes = parseInt(minutesValue, 10);
    if (start === null || isNaN(minutes) || minutes < 5 || minutes > 180) return null;
    var wake = start + minutes;
    return {
      start: startValue,
      minutes: minutes,
      wakeMinutes: ((wake % 1440) + 1440) % 1440,
      wakeLabel: formatTime(wake),
      note: stageNote(minutes)
    };
  }

  function calculate() {
    var startInput = document.getElementById("nap-start");
    var lengthInput = document.getElementById("nap-length");
    var customInput = document.getElementById("nap-custom");
    var resultEl = document.getElementById("nap-result");
    if (!startInput || !lengthInput || !resultEl) return;
    var minutes = lengthInput.value;
    if (minutes === "custom" && customInput) minutes = customInput.value;
    var out = calc(startInput.value, minutes);
    if (!out) {
      resultEl.classList.remove("show");
      return;
    }
    var wakeEl = document.getElementById("nap-wake");
    var lenEl = document.getElementById("nap-minutes");
    var noteEl = document.getElementById("nap-note");
    if (wakeEl) wakeEl.textContent = out.wakeLabel;
    if (lenEl) lenEl.textContent = out.minutes + " minutes";
    if (noteEl) noteEl.textContent = out.note;
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("nap-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["nap-start", "nap-length", "nap-custom"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", calculate);
        el.addEventListener("change", calculate);
      }
    });
    calculate();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc, parseTime: parseTime, formatTime: formatTime, stageNote: stageNote };
  }
})();
