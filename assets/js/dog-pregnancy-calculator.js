(function () {
  "use strict";

  var MILESTONES = [
    { week: 1, startDay: 1, endDay: 7, text: "Fertilization." },
    { week: 2, startDay: 8, endDay: 14, text: "Embryos travel to the uterus and implant." },
    { week: 3, startDay: 15, endDay: 21, text: "Organs begin to form; morning sickness can appear." },
    { week: 4, startDay: 22, endDay: 28, text: "Ultrasound can confirm pregnancy (around day 25-28)." },
    { week: 5, startDay: 29, endDay: 35, text: "Puppies grow quickly; the mother's belly starts to show." },
    { week: 6, startDay: 36, endDay: 42, text: "Puppies' bones harden; the mother needs more food and rest." },
    { week: 7, startDay: 43, endDay: 49, text: "Set up the whelping box in a warm, quiet spot." },
    { week: 8, startDay: 50, endDay: 56, text: "From day 55, take her temperature twice daily." },
    { week: 9, startDay: 57, endDay: 63, text: "Whelping window; a temperature drop below 99°F often means labor within 12-24 hours." }
  ];

  function parseDate(value) {
    if (!value) return null;
    var parts = String(value).split("-");
    if (parts.length !== 3) return null;
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    var date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return null;
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
  }

  function addDays(date, days) {
    var out = new Date(date.getTime());
    out.setDate(out.getDate() + days);
    return out;
  }

  function iso(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  function calc(matingValue) {
    var mating = parseDate(matingValue);
    if (!mating) return null;
    var expected = addDays(mating, 63);
    var earliest = addDays(mating, 58);
    var latest = addDays(mating, 68);
    var weeks = MILESTONES.map(function (w) {
      return {
        week: w.week,
        start: iso(addDays(mating, w.startDay - 1)),
        end: iso(addDays(mating, w.endDay - 1)),
        startLabel: formatDate(addDays(mating, w.startDay - 1)),
        endLabel: formatDate(addDays(mating, w.endDay - 1)),
        text: w.text
      };
    });
    return {
      mating: iso(mating),
      expected: iso(expected),
      expectedLabel: formatDate(expected),
      earliest: iso(earliest),
      earliestLabel: formatDate(earliest),
      latest: iso(latest),
      latestLabel: formatDate(latest),
      weeks: weeks
    };
  }

  function calculate() {
    var input = document.getElementById("dog-mating");
    var resultEl = document.getElementById("dog-result");
    if (!input || !resultEl) return;
    var out = calc(input.value);
    if (!out) {
      resultEl.classList.remove("show");
      return;
    }
    var dueEl = document.getElementById("dog-due");
    var earlyEl = document.getElementById("dog-earliest");
    var lateEl = document.getElementById("dog-latest");
    var rowsEl = document.getElementById("dog-weeks");
    if (dueEl) dueEl.textContent = out.expectedLabel;
    if (earlyEl) earlyEl.textContent = out.earliestLabel;
    if (lateEl) lateEl.textContent = out.latestLabel;
    if (rowsEl) {
      rowsEl.innerHTML = out.weeks.map(function (w) {
        return "<tr><td>Week " + w.week + "</td><td>" + w.startLabel + " - " + w.endLabel + "</td><td>" + w.text + "</td></tr>";
      }).join("");
    }
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("dog-btn");
    if (btn) btn.addEventListener("click", calculate);
    var inputEl = document.getElementById("dog-mating");
    if (inputEl) {
      inputEl.addEventListener("input", calculate);
      inputEl.addEventListener("change", calculate);
    }
    calculate();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc, parseDate: parseDate, milestones: MILESTONES };
  }
})();
