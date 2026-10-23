/* Calcotia - Taishokukin tax calculator (Japan)
   Retirement income tax per NTA rules: retirement income deduction,
   half taxation, special rule for service of 5 years or less,
   income tax brackets + 2.1% reconstruction surtax, 10% residence tax. */
(function () {
  var yearsEl = document.getElementById('jp-years');
  var amountEl = document.getElementById('jp-amount');
  var disEl = document.getElementById('jp-disability');
  var btn = document.getElementById('jp-calc-btn');
  var box = document.getElementById('jp-result');
  if (!yearsEl || !amountEl || !box) return;

  var fmt = new Intl.NumberFormat('ja-JP');
  function yen(n) { return fmt.format(n) + '円'; }
  function setText(id, txt) {
    var e = document.getElementById(id);
    if (e) e.textContent = txt;
  }
  function bracketTax(t) {
    if (t <= 0) return 0;
    if (t <= 1950000) return t * 0.05;
    if (t <= 3300000) return t * 0.10 - 97500;
    if (t <= 6950000) return t * 0.20 - 427500;
    if (t <= 9000000) return t * 0.23 - 636000;
    if (t <= 18000000) return t * 0.33 - 1536000;
    if (t <= 40000000) return t * 0.40 - 2796000;
    return t * 0.45 - 4796000;
  }

  function calc() {
    var yrs = parseFloat(yearsEl.value);
    var man = parseFloat(amountEl.value);
    if (isNaN(yrs) || isNaN(man) || yrs < 0 || man < 0) {
      box.classList.remove('show');
      return;
    }
    /* Service years: any fraction of a year is rounded up to a full year. */
    var years = Math.ceil(yrs);
    var amount = Math.round(man * 10000);

    var deduction;
    if (years <= 20) {
      deduction = Math.max(400000 * years, 800000);
    } else {
      deduction = 8000000 + 700000 * (years - 20);
    }
    if (disEl && disEl.checked) deduction += 1000000;

    var base = amount - deduction;
    var taxable = 0;
    var shortApplied = false;
    if (base > 0) {
      if (years <= 5 && base > 3000000) {
        /* Short-service rule: the part above 3,000,000 yen is not halved. */
        taxable = 1500000 + (base - 3000000);
        shortApplied = true;
      } else {
        taxable = base / 2;
      }
      taxable = Math.floor(taxable / 1000) * 1000;
    }

    var incomeTax = Math.floor(bracketTax(taxable) * 1.021 / 100) * 100;
    var residenceTax = Math.floor(taxable * 0.10 / 100) * 100;
    var totalTax = incomeTax + residenceTax;
    var takeHome = amount - totalTax;

    setText('jp-r-amount', yen(amount));
    setText('jp-r-deduction', yen(deduction));
    setText('jp-r-taxable', yen(taxable));
    setText('jp-r-incometax', yen(incomeTax));
    setText('jp-r-residence', yen(residenceTax));
    setText('jp-r-tax', yen(totalTax));
    setText('jp-takehome', yen(takeHome));

    var note = document.getElementById('jp-note');
    if (note) {
      note.textContent = shortApplied
        ? '※勤続年数が5年以下のため、控除後の金額のうち300万円を超える部分には2分の1課税が適用されていません（短期退職手当等の特例）。'
        : '';
    }
    box.classList.add('show');
  }

  [yearsEl, amountEl].forEach(function (el) {
    el.addEventListener('input', calc);
    el.addEventListener('change', calc);
  });
  if (disEl) disEl.addEventListener('change', calc);
  if (btn) btn.addEventListener('click', calc);
  calc();
})();
