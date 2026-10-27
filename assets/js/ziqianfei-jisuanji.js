// Taiwan severance pay calculator (資遣費計算機).
// Old system (勞退舊制): 1 month of average wage per full year; remaining
// months, or service under 1 year, pro-rata; under 1 month counts as 1 month.
// New system (勞退新制): 0.5 month per full year; under 1 year pro-rata by
// month/day (days counted as days/30 of a month); capped at 6 months.
(function () {
  function $(id) { return document.getElementById(id); }
  function fmt(n) {
    return new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 0 }).format(n) + ' 元';
  }
  function noticeDays(years, months) {
    var m = years * 12 + months;
    if (m < 3) return null;
    if (m < 12) return 10;
    if (m < 36) return 20;
    return 30;
  }
  function calc() {
    var system = $('tw-system').value;
    var years = parseFloat($('tw-years').value) || 0;
    var months = parseFloat($('tw-months').value) || 0;
    var days = parseFloat($('tw-days').value) || 0;
    var wage = parseFloat($('tw-wage').value) || 0;
    if (years < 0) years = 0;
    if (months < 0) months = 0;
    if (months > 11) months = 11;
    if (days < 0) days = 0;
    if (days > 30) days = 30;
    if (wage < 0) wage = 0;
    var sevMonths, capped = false, method;
    if (system === 'old') {
      var effMonths = months + (days > 0 ? 1 : 0);
      sevMonths = years + effMonths / 12;
      method = '舊制：每年 1 個月平均工資，未滿 1 個月以 1 個月計';
    } else {
      var raw = 0.5 * (years + (months + days / 30) / 12);
      if (raw > 6) { sevMonths = 6; capped = true; } else { sevMonths = raw; }
      method = '新制：每年 0.5 個月平均工資，最高以 6 個月為限';
    }
    var amount = Math.round(sevMonths * wage);
    var nd = noticeDays(years, months);
    $('tw-total').textContent = fmt(amount);
    $('tw-res-method').textContent = method;
    $('tw-res-months').textContent = sevMonths.toFixed(4) + ' 個月';
    $('tw-res-cap').textContent = capped ? '已達上限：以 6 個月計算（未設上限前為 ' + (0.5 * (years + (months + days / 30) / 12)).toFixed(4) + ' 個月）' : '未達上限';
    $('tw-res-notice').textContent = nd === null ? '未滿 3 個月：法無明文，由勞雇雙方協商' : nd + ' 天前預告';
    $('tw-res-wage').textContent = fmt(wage);
    $('tw-note').textContent = '此金額為稅前估算。平均工資請以離職事由發生日前 6 個月的工資總額計算，包含底薪、加班費、獎金與各類津貼，不只看底薪。';
  }
  var btn = $('tw-btn');
  if (btn) btn.addEventListener('click', calc);
  ['tw-system', 'tw-years', 'tw-months', 'tw-days', 'tw-wage'].forEach(function (id) {
    var el = $(id);
    if (el) el.addEventListener('input', calc);
    if (el) el.addEventListener('change', calc);
  });
  calc();
})();
