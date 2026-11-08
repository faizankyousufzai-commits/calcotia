(function () {
  function el(id) { return document.getElementById(id); }
  function money(x) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(x);
  }
  function calc() {
    var savings = parseFloat(el('pr-savings').value);
    if (isNaN(savings) || savings < 0) savings = 0;
    var rateSel = el('pr-rate').value;
    var customRow = el('pr-custom-row');
    var rate;
    if (rateSel === 'custom') {
      if (customRow) customRow.hidden = false;
      rate = parseFloat(el('pr-custom').value);
      if (isNaN(rate) || rate <= 0) rate = 4;
    } else {
      if (customRow) customRow.hidden = true;
      rate = parseFloat(rateSel);
      if (isNaN(rate) || rate <= 0) rate = 4;
    }
    var spending = parseFloat(el('pr-spending').value);
    if (isNaN(spending) || spending < 0) spending = 0;
    var yearly = savings * rate / 100;
    var monthly = yearly / 12;
    var nestEgg = spending > 0 ? spending / (rate / 100) : 0;
    el('pr-yearly').textContent = money(yearly);
    el('pr-monthly').textContent = money(monthly);
    el('pr-c3y').textContent = money(savings * 0.03);
    el('pr-c3m').textContent = money(savings * 0.03 / 12);
    el('pr-c35y').textContent = money(savings * 0.035);
    el('pr-c35m').textContent = money(savings * 0.035 / 12);
    el('pr-c4y').textContent = money(savings * 0.04);
    el('pr-c4m').textContent = money(savings * 0.04 / 12);
    el('pr-nestegg').textContent = spending > 0 ? money(nestEgg) : 'Enter a spending goal to see the nest egg you need.';
    el('pr-note').textContent = 'This is not financial advice. The 4 percent rule is a rule of thumb based on past U.S. market history; it does not guarantee your money will last, and taxes, fees and inflation are not included here.';
    var res = el('pr-result');
    if (res) res.classList.add('show');
  }
  var btn = el('pr-btn');
  if (btn) btn.addEventListener('click', calc);
  ['pr-savings', 'pr-rate', 'pr-custom', 'pr-spending'].forEach(function (id) {
    var input = el(id);
    if (input) {
      input.addEventListener('input', calc);
      input.addEventListener('change', calc);
    }
  });
  calc();
})();
