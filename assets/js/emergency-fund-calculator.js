(function () {
  "use strict";

  var COVERS = [3, 6, 9, 12];

  function num(value) {
    var n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  function money(n) {
    return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function calc(expenses, months, saveMonths) {
    expenses = num(expenses);
    months = num(months);
    saveMonths = num(saveMonths);
    if (expenses === null || months === null || saveMonths === null) return null;
    if (expenses < 0 || saveMonths < 1) return null;
    if (COVERS.indexOf(months) === -1) return null;
    var target = expenses * months;
    var monthly = target / saveMonths;
    var rows = COVERS.map(function (m) {
      return { months: m, amount: expenses * m };
    });
    return {
      expenses: expenses,
      months: months,
      saveMonths: saveMonths,
      target: target,
      monthly: monthly,
      rows: rows
    };
  }

  function calculate() {
    var resultEl = document.getElementById("ef-result");
    if (!resultEl) return;
    var out = calc(
      document.getElementById("ef-expenses").value,
      document.getElementById("ef-months").value,
      document.getElementById("ef-save-months").value
    );
    if (!out) {
      resultEl.classList.remove("show");
      return;
    }
    var targetEl = document.getElementById("ef-target");
    var monthlyEl = document.getElementById("ef-monthly");
    var coverEl = document.getElementById("ef-cover");
    var timeEl = document.getElementById("ef-time");
    var rowsEl = document.getElementById("ef-rows");
    if (targetEl) targetEl.textContent = money(out.target);
    if (monthlyEl) monthlyEl.textContent = money(out.monthly);
    if (coverEl) coverEl.textContent = out.months + " months";
    if (timeEl) timeEl.textContent = out.saveMonths + (out.saveMonths === 1 ? " month" : " months");
    if (rowsEl) {
      rowsEl.innerHTML = out.rows.map(function (r) {
        return "<tr><td>" + r.months + " months</td><td>" + money(r.amount) + "</td></tr>";
      }).join("");
    }
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("ef-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["ef-expenses", "ef-months", "ef-save-months"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", calculate);
        el.addEventListener("change", calculate);
      }
    });
    calculate();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc, money: money };
  }
})();
