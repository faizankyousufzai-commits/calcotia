(function () {
  "use strict";

  var LIMITS = { self: 4400, family: 8750 };

  function num(value) {
    var n = parseFloat(value);
    return isNaN(n) ? null : n;
  }

  function money(n) {
    return "$" + Math.round(n).toLocaleString("en-US");
  }

  function calc(coverage, own, employer, ret, years, bracket) {
    own = num(own);
    employer = num(employer);
    ret = num(ret);
    years = num(years);
    bracket = num(bracket);
    if (own === null || employer === null || ret === null || years === null || bracket === null) return null;
    if (own < 0 || employer < 0 || ret < 0 || ret > 30 || years < 1 || years > 40 || bracket < 0 || bracket > 37) return null;
    var limit = LIMITS[coverage] || LIMITS.self;
    var totalAnnual = own + employer;
    var excess = Math.max(0, totalAnnual - limit);
    var annual = Math.min(totalAnnual, limit);
    var r = ret / 100;
    var balance;
    if (r === 0) {
      balance = annual * years;
    } else {
      balance = annual * ((Math.pow(1 + r, years) - 1) / r);
    }
    var totalContrib = annual * years;
    return {
      coverage: coverage === "family" ? "family" : "self",
      limit: limit,
      totalAnnual: totalAnnual,
      excess: excess,
      annual: annual,
      balance: balance,
      totalContrib: totalContrib,
      growth: balance - totalContrib,
      taxSavings: totalContrib * (bracket / 100)
    };
  }

  function calculate() {
    var resultEl = document.getElementById("hsa-result");
    if (!resultEl) return;
    var coverageEl = document.getElementById("hsa-coverage");
    var coverage = coverageEl ? coverageEl.value : "self";
    var out = calc(
      coverage,
      document.getElementById("hsa-own").value,
      document.getElementById("hsa-employer").value,
      document.getElementById("hsa-return").value,
      document.getElementById("hsa-years").value,
      document.getElementById("hsa-bracket").value
    );
    if (!out) {
      resultEl.classList.remove("show");
      return;
    }
    var balanceEl = document.getElementById("hsa-balance");
    var contribEl = document.getElementById("hsa-contrib");
    var growthEl = document.getElementById("hsa-growth");
    var taxEl = document.getElementById("hsa-tax");
    var limitEl = document.getElementById("hsa-limit");
    var noteEl = document.getElementById("hsa-note");
    if (balanceEl) balanceEl.textContent = money(out.balance);
    if (contribEl) contribEl.textContent = money(out.totalContrib);
    if (growthEl) growthEl.textContent = money(out.growth);
    if (taxEl) taxEl.textContent = money(out.taxSavings);
    if (limitEl) limitEl.textContent = money(out.limit) + " / year";
    if (noteEl) {
      if (out.excess > 0) {
        noteEl.textContent = "Your total annual contribution of " + money(out.totalAnnual) + " is " + money(out.excess) + " over the 2026 IRS limit of " + money(out.limit) + ". The projection uses the capped amount.";
      } else {
        noteEl.textContent = "Your total annual contribution is within the 2026 IRS limit.";
      }
    }
    resultEl.classList.add("show");
  }

  if (typeof document !== "undefined") {
    var btn = document.getElementById("hsa-btn");
    if (btn) btn.addEventListener("click", calculate);
    ["hsa-coverage", "hsa-own", "hsa-employer", "hsa-return", "hsa-years", "hsa-bracket"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", calculate);
        el.addEventListener("change", calculate);
      }
    });
    calculate();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc, money: money, limits: LIMITS };
  }
})();
