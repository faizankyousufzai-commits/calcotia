// Calcotia – Kalkulačka na výpočet dôchodku (Slovakia pension estimate)
// Formula: pension = POMB x ODP (years of insurance) x ADH (current pension value)
(function () {
  "use strict";

  var ADH = { "2026": 19.7633, "2025": 18.7434 };
  var AVG_WAGE_2024 = 1524; // average monthly wage in SK economy, 2024 (Statistical Office)

  var fmtMoney = new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR" });
  var fmtNum = new Intl.NumberFormat("sk-SK", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  var fmtEur = new Intl.NumberFormat("sk-SK", { minimumFractionDigits: 4, maximumFractionDigits: 4 });

  var el = {
    salary: document.getElementById("f-salary"),
    years: document.getElementById("f-years"),
    pomb: document.getElementById("f-pomb"),
    year: document.getElementById("f-year"),
    btn: document.getElementById("calc-btn"),
    result: document.getElementById("result"),
    big: document.getElementById("r-big"),
    rPomb: document.getElementById("r-pomb"),
    rYears: document.getElementById("r-years"),
    rAdh: document.getElementById("r-adh"),
    total: document.getElementById("r-total"),
    note: document.getElementById("r-note")
  };
  if (!el.salary || !el.years || !el.year || !el.result) return;

  function calc() {
    var salary = parseFloat(el.salary.value);
    var years = parseFloat(el.years.value);
    var pombDirect = parseFloat(el.pomb.value);
    var adh = ADH[el.year.value] || ADH["2026"];

    if (isNaN(years) || years < 0) years = 0;

    var pomb;
    if (!isNaN(pombDirect) && pombDirect > 0) {
      pomb = pombDirect;
    } else {
      if (isNaN(salary) || salary < 0) salary = 0;
      pomb = salary > 0 ? salary / AVG_WAGE_2024 : 0;
    }

    var raw = pomb * years * adh;
    // Social Insurance Agency rounds pension amounts up to 10 eurocents
    var pension = Math.ceil(raw * 10) / 10;

    el.result.classList.add("show");
    el.big.textContent = "Odhad dôchodku: " + fmtMoney.format(pension) + " mesačne";
    el.rPomb.textContent = fmtNum.format(pomb);
    el.rYears.textContent = years + (years === 1 ? " rok" : " rokov");
    el.rAdh.textContent = fmtEur.format(adh) + " €";
    el.total.textContent = fmtMoney.format(pension);

    if (years < 15) {
      el.note.textContent = "Pozor: na nárok na starobný dôchodok treba aspoň 15 rokov dôchodkového poistenia. Pri menšom počte rokov je suma len čisto teoretická.";
    } else if (pomb > 1.25) {
      el.note.textContent = "Ide o orientačný odhad. Sociálna poisťovňa osobný mzdový bod nad 1,25 v rámci solidarity započítava len čiastočne, skutočný dôchodok preto môže byť nižší.";
    } else {
      el.note.textContent = "Ide o orientačný odhad podľa priemernej mzdy 1 524 € (rok 2024). Presný výpočet urobí Sociálna poisťovňa z vašich skutočných vymeriavacích základov.";
    }
  }

  ["salary", "years", "pomb"].forEach(function (k) {
    el[k].addEventListener("input", calc);
    el[k].addEventListener("change", calc);
  });
  el.year.addEventListener("change", calc);
  el.btn.addEventListener("click", calc);
  calc();
})();
