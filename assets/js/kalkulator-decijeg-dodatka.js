// Calcotia – Kalkulator dečijeg dodatka (Serbia child allowance)
// Eligibility: average monthly income per household member <= cenzus
// Amount per child: base x (1 + 0.30 single parent + 0.50 disability), uplift capped at +80%
(function () {
  "use strict";

  var fmtMoney = new Intl.NumberFormat("sr-RS", { style: "currency", currency: "RSD" });

  var el = {
    income: document.getElementById("f-income"),
    members: document.getElementById("f-members"),
    children: document.getElementById("f-children"),
    census: document.getElementById("f-census"),
    amount: document.getElementById("f-amount"),
    single: document.getElementById("f-single"),
    disability: document.getElementById("f-disability"),
    btn: document.getElementById("calc-btn"),
    result: document.getElementById("result"),
    big: document.getElementById("r-big"),
    per: document.getElementById("r-per"),
    rCensus: document.getElementById("r-census"),
    perChild: document.getElementById("r-perchild"),
    total: document.getElementById("r-total"),
    note: document.getElementById("r-note")
  };
  if (!el.income || !el.members || !el.result) return;

  function num(v, fallback) {
    var n = parseFloat(v);
    return isNaN(n) || n < 0 ? fallback : n;
  }

  function calc() {
    var income = num(el.income.value, 0);
    var members = Math.max(1, Math.floor(num(el.members.value, 1)));
    var children = Math.floor(num(el.children.value, 0));
    var census = num(el.census.value, 0);
    var base = num(el.amount.value, 0);

    var uplift = 0;
    if (el.single.checked) uplift += 0.30;
    if (el.disability.checked) uplift += 0.50;
    if (uplift > 0.80) uplift = 0.80;

    var perMember = income / members;
    var perChild = base * (1 + uplift);
    var total = perChild * children;
    var eligible = perMember <= census && children > 0;

    el.result.classList.add("show");
    el.per.textContent = fmtMoney.format(perMember);
    el.rCensus.textContent = fmtMoney.format(census);
    el.perChild.textContent = fmtMoney.format(perChild);
    el.total.textContent = fmtMoney.format(total);

    if (children === 0) {
      el.big.textContent = "Unesite broj dece za obračun";
      el.note.textContent = "Kalkulator računa iznos samo kada je unet broj dece za koju se dodatak traži.";
    } else if (eligible) {
      el.big.textContent = "Ispunjavate prihodni uslov ✓";
      el.note.textContent = "Prosek po članu je ispod cenzusa. Konačno pravo utvrđuje služba dečije zaštite na osnovu dokumentacije, uključujući i imovinski (katastarski) cenzus.";
    } else {
      el.big.textContent = "Prihod po članu prelazi cenzus";
      el.note.textContent = "Razlika do cenzusa je " + fmtMoney.format(perMember - census) + " po članu. Proverite da li ste uneli sve prihode tačno i da li važite za kategoriju sa višim cenzusom (samohrani roditelji, dete sa smetnjama).";
    }
  }

  ["income", "members", "children", "census", "amount"].forEach(function (k) {
    el[k].addEventListener("input", calc);
    el[k].addEventListener("change", calc);
  });
  ["single", "disability"].forEach(function (k) {
    el[k].addEventListener("change", calc);
  });
  el.btn.addEventListener("click", calc);
  calc();
})();
