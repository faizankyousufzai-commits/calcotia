// Calcotia – מחשבון דמי הבראה (Israel recuperation pay calculator)
// Two modes: quick single-year calculation at the current rate, and a multi-year
// check in which every recuperation year is priced at that year's own rate.
(function () {
  "use strict";

  var RATES = { private: 451.5, public: 511.6 };
  // Daily rate by recuperation year, per the Kol Zchut rate history and the 2026
  // extension orders. The private rate changes each July, the public rate each
  // June; in 2024-2025 both stayed frozen at the 2023 rates (418 / 471.4).
  var RATE_HISTORY = {
    private: { 2020: 378, 2021: 378, 2022: 378, 2023: 418, 2024: 418, 2025: 418, 2026: 451.5 },
    public: { 2020: 429, 2021: 432, 2022: 449, 2023: 471.4, 2024: 471.4, 2025: 471.4, 2026: 511.6 }
  };
  // [max seniority years, days] bands, verified against Kol Zchut / Takshir tables
  var DAYS_PRIVATE = [[1, 5], [3, 6], [10, 7], [15, 8], [19, 9], [Infinity, 10]];
  var DAYS_PUBLIC = [[3, 7], [10, 9], [15, 10], [19, 11], [24, 12], [Infinity, 13]];

  var fmtMoney = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" });
  var fmtNum = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 });

  var el = {
    mode: document.getElementById("f-mode"),
    sector: document.getElementById("f-sector"),
    years: document.getElementById("f-years"),
    scope: document.getElementById("f-scope"),
    hours: document.getElementById("f-hours"),
    rate: document.getElementById("f-rate"),
    from: document.getElementById("f-from"),
    to: document.getElementById("f-to"),
    startSen: document.getElementById("f-start-sen"),
    fldYears: document.getElementById("fld-years"),
    fldRate: document.getElementById("fld-rate"),
    fldMulti: document.getElementById("fld-multi"),
    btn: document.getElementById("calc-btn"),
    result: document.getElementById("result"),
    big: document.getElementById("r-big"),
    tableQuick: document.getElementById("r-table-quick"),
    tableMulti: document.getElementById("r-table-multi"),
    yearsBody: document.getElementById("r-years"),
    mTotal: document.getElementById("r-mtotal"),
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

  function scopeFactor() {
    var hours = parseFloat(el.hours.value);
    var scopePct = parseFloat(el.scope.value);
    if (!isNaN(hours) && hours > 0) {
      return Math.min(hours / 182, 1); // hourly worker: avg monthly hours / 182
    }
    if (isNaN(scopePct) || scopePct <= 0) scopePct = 100;
    return Math.min(scopePct, 100) / 100;
  }

  function calcQuick() {
    var sector = el.sector.value === "public" ? "public" : "private";
    var years = parseFloat(el.years.value);
    var rate = parseFloat(el.rate.value);

    if (isNaN(years) || years < 0) years = 0;
    if (isNaN(rate) || rate < 0) rate = 0;

    var scope = scopeFactor();
    var days = daysFor(sector === "public" ? DAYS_PUBLIC : DAYS_PRIVATE, Math.floor(years));
    var total = days * rate * scope;

    el.tableQuick.hidden = false;
    el.tableMulti.hidden = true;
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

  function calcMulti() {
    var sector = el.sector.value === "public" ? "public" : "private";
    var table = sector === "public" ? DAYS_PUBLIC : DAYS_PRIVATE;
    var history = RATE_HISTORY[sector];
    var from = parseInt(el.from.value, 10);
    var to = parseInt(el.to.value, 10);
    var startSen = parseInt(el.startSen.value, 10);

    if (isNaN(from)) from = 2024;
    if (isNaN(to)) to = 2026;
    if (to < from) { var t = from; from = to; to = t; }
    if (isNaN(startSen) || startSen < 0) startSen = 0;

    var scope = scopeFactor();
    var total = 0;
    var rows = "";
    var hasFrozenYears = false;

    for (var y = from; y <= to; y++) {
      var sen = startSen + (y - from);
      var days = daysFor(table, sen);
      var rate = history[y];
      if (rate === undefined) rate = RATES[sector];
      var amount = days * rate * scope;
      total += amount;
      if (y === 2024 || y === 2025) hasFrozenYears = true;
      rows += "<tr><td>" + y + "</td><td>" + sen + "</td><td>" + days + "</td><td>" +
        fmtMoney.format(rate) + "</td><td>" + fmtMoney.format(amount) + "</td></tr>";
    }

    el.tableQuick.hidden = true;
    el.tableMulti.hidden = false;
    el.yearsBody.innerHTML = rows;
    el.mTotal.textContent = fmtMoney.format(total);
    el.big.textContent = "סך הכל ל-" + (to - from + 1) + " שנים: " + fmtMoney.format(total) + " ברוטו";
    el.note.textContent = "כל שנה חושבה לפי התעריף שהיה בתוקף בה ולפי הוותק באותה שנה, בהיקף משרה של " +
      fmtNum.format(scope * 100) + "%. הסכומים הם ברוטו." +
      (hasFrozenYears
        ? " שימו לב: מהתשלומים ששולמו בפועל בשנים 2024 ו-2025 נוכה לפי הוראת שעה סכום השווה ליום הבראה אחד, ולכן בתלוש מאותן שנים ייתכן סכום נמוך במעט מהזכאות המוצגת כאן."
        : "");
  }

  function calc() {
    var multi = el.mode && el.mode.value === "multi";
    if (el.fldYears) el.fldYears.hidden = !!multi;
    if (el.fldRate) el.fldRate.hidden = !!multi;
    if (el.fldMulti) el.fldMulti.hidden = !multi;
    el.result.classList.add("show");
    if (multi) calcMulti(); else calcQuick();
  }

  el.sector.addEventListener("change", function () {
    el.rate.value = RATES[el.sector.value === "public" ? "public" : "private"];
    calc();
  });
  if (el.mode) el.mode.addEventListener("change", calc);
  ["years", "scope", "hours", "rate", "from", "to", "startSen"].forEach(function (k) {
    if (!el[k]) return;
    el[k].addEventListener("input", calc);
    el[k].addEventListener("change", calc);
  });
  el.btn.addEventListener("click", calc);
  calc();
})();
