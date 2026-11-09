(function () {
  "use strict";

  var SPLITS = [
    { name: "Venue & rentals", pct: 29 },
    { name: "Catering, cake & drinks", pct: 24 },
    { name: "Photography & video", pct: 10 },
    { name: "Flowers & decor", pct: 9 },
    { name: "Music & entertainment", pct: 6 },
    { name: "Attire & beauty", pct: 6 },
    { name: "Wedding rings", pct: 5 },
    { name: "Wedding planner", pct: 5 },
    { name: "Guest entertainment", pct: 3 },
    { name: "Transportation", pct: 2 },
    { name: "Officiant & license", pct: 1 }
  ];

  function num(value) {
    var n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  function money(n) {
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function calc(budget, guests) {
    budget = num(budget);
    guests = num(guests);
    if (budget === null || guests === null) return null;
    if (budget < 0 || guests < 1) return null;
    var rows = SPLITS.map(function (s) {
      return { name: s.name, pct: s.pct, amount: budget * s.pct / 100 };
    });
    return {
      budget: budget,
      guests: guests,
      perGuest: budget / guests,
      cateringPerGuest: rows[1].amount / guests,
      rows: rows
    };
  }

  function calculate() {
    var resultEl = document.getElementById("wed-result");
    if (!resultEl) return;
    var out = calc(
      document.getElementById("wed-budget").value,
      document.getElementById("wed-guests").value
    );
    if (!out) {
      resultEl.classList.remove("show");
      return;
    }
    var perGuestEl = document.getElementById("wed-perguest");
    var totalEl = document.getElementById("wed-total");
    var guestsEl = document.getElementById("wed-guests-out");
    var cateringEl = document.getElementById("wed-catering-guest");
    var rowsEl = document.getElementById("wed-rows");
    if (perGuestEl) perGuestEl.textContent = money(out.perGuest);
    if (totalEl) totalEl.textContent = money(out.budget);
    if (guestsEl) guestsEl.textContent = String(out.guests);
    if (cateringEl) cateringEl.textContent = money(out.cateringPerGuest);
    if (rowsEl) {
      rowsEl.innerHTML = out.rows.map(function (r) {
        return "<tr><td>" + r.name + "</td><td>" + r.pct + "%</td><td>" + money(r.amount) + "</td></tr>";
      }).join("");
    }
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("wed-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["wed-budget", "wed-guests"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", calculate);
        el.addEventListener("change", calculate);
      }
    });
    calculate();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc, money: money, splits: SPLITS };
  }
})();
