/* Calcotia - Υπολογισμός αποζημίωσης απόλυσης (Ελλάδα)
   Κλίμακα ν. 2112/1920 όπως ισχύει μετά τον ν. 4093/2012: μήνες ανά
   συμπληρωμένα έτη υπηρεσίας· με έγκαιρη προειδοποίηση το ποσό μειώνεται
   στο μισό. Εργατοτεχνίτες: μηνιαία βάση = 22 ημερομίσθια (ν. 4808/2021).
   Φόρος: αφορολόγητο έως 60.000 €, κλιμακωτά 10% / 20% / 30% στο υπερβάλλον. */
(function () {
  "use strict";
  var fmt = new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" });
  var fmtNum = new Intl.NumberFormat("el-GR", { maximumFractionDigits: 2 });
  var elType = document.getElementById("grType");
  var elYears = document.getElementById("grYears");
  var elSalary = document.getElementById("grSalary");
  var elWage = document.getElementById("grWage");
  var elNotice = document.getElementById("grNotice");
  var elUplift = document.getElementById("grUplift");
  var elBtn = document.getElementById("grBtn");
  var elResult = document.getElementById("grResult");
  var elSalaryField = document.getElementById("grSalaryField");
  var elWageField = document.getElementById("grWageField");
  if (!elType || !elYears || !elBtn || !elResult) return;

  function monthsFor(y) {
    if (y < 1) return 0;
    if (y < 4) return 2;
    if (y < 6) return 3;
    if (y < 8) return 4;
    if (y < 10) return 5;
    if (y < 11) return 6;
    if (y < 12) return 7;
    if (y < 13) return 8;
    if (y < 14) return 9;
    if (y < 15) return 10;
    if (y < 16) return 11;
    return 12;
  }

  function noticeMonths(y) {
    if (y < 1) return 0;
    if (y < 2) return 1;
    if (y < 5) return 2;
    if (y < 10) return 3;
    return 4;
  }

  function taxOn(amount) {
    var t = 0, rest = amount - 60000;
    if (rest <= 0) return 0;
    t += Math.min(rest, 40000) * 0.10; rest -= 40000;
    if (rest > 0) { t += Math.min(rest, 50000) * 0.20; rest -= 50000; }
    if (rest > 0) { t += rest * 0.30; }
    return t;
  }

  function syncFields() {
    var worker = elType.value === "worker";
    elSalaryField.style.display = worker ? "none" : "";
    elWageField.style.display = worker ? "" : "none";
  }

  function calcola() {
    syncFields();
    var years = parseFloat(elYears.value);
    if (isNaN(years) || years < 0) { elResult.classList.remove("show"); return; }
    years = Math.floor(years);
    var base;
    if (elType.value === "worker") {
      var wage = parseFloat(elWage.value);
      if (isNaN(wage) || wage <= 0) { elResult.classList.remove("show"); return; }
      base = wage * 22;
    } else {
      var sal = parseFloat(elSalary.value);
      if (isNaN(sal) || sal <= 0) { elResult.classList.remove("show"); return; }
      base = sal;
    }
    if (elUplift.value === "yes") base = base * 7 / 6;
    var months = monthsFor(years);
    if (elNotice.value === "yes") months = months / 2;
    var gross = months * base;
    var tax = taxOn(gross);
    var net = gross - tax;
    var np = noticeMonths(years);

    document.getElementById("grGross").textContent = "Μικτή αποζημίωση: " + fmt.format(gross);
    document.getElementById("grMonths").textContent = fmtNum.format(months);
    document.getElementById("grBase").textContent = fmt.format(base);
    document.getElementById("grNoticePeriod").textContent =
      np === 0 ? "Δεν προβλέπεται" : (np === 1 ? "1 μήνας" : np + " μήνες");
    document.getElementById("grTax").textContent = fmt.format(tax);
    document.getElementById("grNet").textContent = fmt.format(net);
    document.getElementById("grNote").textContent = years < 1
      ? "Με λιγότερο από 1 συμπληρωμένο έτος υπηρεσίας ο νόμος δεν προβλέπει αποζημίωση απόλυσης, εκτός αν η ατομική σας σύμβαση ορίζει κάτι ευνοϊκότερο."
      : "";
    elResult.classList.add("show");
  }

  elBtn.addEventListener("click", calcola);
  [elType, elYears, elSalary, elWage, elNotice, elUplift].forEach(function (el) {
    if (!el) return;
    el.addEventListener("input", calcola);
    el.addEventListener("change", calcola);
  });
  calcola();
})();
