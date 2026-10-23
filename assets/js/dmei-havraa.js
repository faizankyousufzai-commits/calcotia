// Calcotia – מחשבון דמי הבראה (Israel recuperation pay calculator)
(function () {
  "use strict";

  var RATES = { private: 451.5, public: 511.6 };
  // [max seniority years, days] bands, verified against Kol Zchut / Takshir tables
  var DAYS_PRIVATE = [[1, 5], [3, 6], [10, 7], [15, 8], [19, 9], [Infinity, 10]];
  var DAYS_PUBLIC = [[3, 7], [10, 9], [15, 10], [19, 11], [24, 12], [Infinity, 13]];

  var fmtMoney = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" });
  var fmtNum = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 });

  var el = {
    sector: document.getElementById("f-sector"),
    years: document.getElementById("f-years"),
    scope: document.getElementById("f-scope"),
    hours: document.getElementById("f-hours"),
    rate: document.getElementById("f-rate"),
    btn: document.getElementById("calc-btn"),
    result: document.getElementById("result"),
    big: document.getElementById("r-big"),
    days: document.getElementById("r-days"),
    rRate: document.getElementById("r-rate"),
    rScope: document.getElementById("r-scope"),
    total: document.getElementById("r-total"),
    note: document.getElementById("r-note")
  };
  if (!el.sector || !el.years || !el.rate || !el.result) return;

  function daysFor(table, years) {
    for (var i = 0; i < table.length; i++) {
      if (years <= table[i][0]) return table[i][1];
    }
    return table[table.length - 1][1];
  }

  function calc() {
    var sector = el.sector.value === "public" ? "public" : "private";
    var years = parseFloat(el.years.value);
    var rate = parseFloat(el.rate.value);
    var hours = parseFloat(el.hours.value);
    var scopePct = parseFloat(el.scope.value);

    if (isNaN(years) || years < 0) years = 0;
    if (isNaN(rate) || rate < 0) rate = 0;

    var scope;
    if (!isNaN(hours) && hours > 0) {
      scope = Math.min(hours / 182, 1); // hourly worker: avg monthly hours / 182
    } else {
      if (isNaN(scopePct) || scopePct <= 0) scopePct = 100;
      scope = Math.min(scopePct, 100) / 100;
    }

    var days = daysFor(sector === "public" ? DAYS_PUBLIC : DAYS_PRIVATE, Math.floor(years));
    var total = days * rate * scope;

    el.result.classList.add("show");
    el.days.textContent = days + " ימים";
    el.rRate.textContent = fmtMoney.format(rate);
    el.rScope.textContent = fmtNum.format(scope * 100) + "%";
    el.total.textContent = fmtMoney.format(total);

    if (years < 1) {
      el.big.textContent = "אין זכאות עדיין";
      el.note.textContent = "הזכאות לדמי הבראה מתחילה רק לאחר השלמת שנת עבודה מלאה אחת אצל המעסיק. לאחר מכן התשלום ניתן רטרואקטיבית מהיום הראשון.";
    } else {
      el.big.textContent = "מגיעים לכם " + fmtMoney.format(total) + " ברוטו";
      el.note.textContent = "הסכום הוא ברוטו, לפני ניכוי מס הכנסה, ביטוח לאומי ומס בריאות.";
    }
  }

  el.sector.addEventListener("change", function () {
    el.rate.value = RATES[el.sector.value === "public" ? "public" : "private"];
    calc();
  });
  ["years", "scope", "hours", "rate"].forEach(function (k) {
    el[k].addEventListener("input", calc);
    el[k].addEventListener("change", calc);
  });
  el.btn.addEventListener("click", calc);
  calc();
})();
