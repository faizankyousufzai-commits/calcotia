// Spain severance pay calculator (calculadora indemnización despido).
// Objective dismissal (despido objetivo): 20 days of salary per year of service,
// capped at 12 monthly payments (365 days). Unfair dismissal (despido
// improcedente): 33 days per year, capped at 24 monthly payments (720 days).
// Transitional regime (contract before 12 February 2012): 45 days per year for
// service before that date + 33 days per year after it; the total may not
// exceed 720 days unless the pre-2012 part alone is higher, in which case that
// part applies as the cap, up to 42 monthly payments (1260 days).
// End of fixed-term contract: 12 days per year. Fair disciplinary dismissal:
// no compensation. Daily salary = gross annual salary (including prorated
// extra payments) / 365. Service: full years + months/12 + days prorated
// within the month (days/30 of a month).
(function () {
  function $(id) { return document.getElementById(id); }
  function eur(n) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
  }
  function num(n) {
    return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }
  function calc() {
    var type = $('es-type').value;
    var years = parseFloat($('es-years').value) || 0;
    var months = parseFloat($('es-months').value) || 0;
    var daysIn = parseFloat($('es-days').value) || 0;
    var pre = parseFloat($('es-pre').value) || 0;
    var salary = parseFloat($('es-salary').value) || 0;
    if (years < 0) years = 0;
    if (months < 0) months = 0;
    if (months > 11) months = 11;
    if (daysIn < 0) daysIn = 0;
    if (daysIn > 30) daysIn = 30;
    if (pre < 0) pre = 0;
    if (salary < 0) salary = 0;
    var service = years + (months + daysIn / 30) / 12;
    if (pre > service) pre = service;
    var daily = salary / 365;
    var days = 0, method = '', cap = 'Sin tope aplicado', notice = 'Sin preaviso legal específico en esta modalidad';
    if (type === 'objetivo') {
      var rawObj = 20 * service;
      days = Math.min(rawObj, 365);
      method = 'Despido objetivo: 20 días por año, con un tope de 12 mensualidades (365 días)';
      if (rawObj > 365) cap = 'Tope aplicado: 12 mensualidades (365 días)';
      notice = '15 días de preaviso';
    } else if (type === 'improcedente') {
      if (pre > 0) {
        var preDays = 45 * pre;
        var post = Math.max(service - pre, 0);
        var rawTr = preDays + 33 * post;
        var capTr = preDays > 720 ? Math.min(preDays, 1260) : 720;
        days = Math.min(rawTr, capTr);
        method = 'Despido improcedente, régimen transitorio: 45 días por año antes del 12/02/2012 y 33 días por año después';
        cap = 'Régimen transitorio aplicado: ' + num(preDays) + ' días anteriores a 2012 + ' + num(33 * post) + ' días posteriores; tope de ' + num(capTr) + ' días';
      } else {
        var rawImp = 33 * service;
        days = Math.min(rawImp, 720);
        method = 'Despido improcedente: 33 días por año, con un tope de 24 mensualidades (720 días)';
        if (rawImp > 720) cap = 'Tope aplicado: 24 mensualidades (720 días)';
      }
    } else if (type === 'temporal') {
      days = 12 * service;
      method = 'Fin de contrato temporal: 12 días por año de servicio';
    } else {
      days = 0;
      method = 'Despido disciplinario procedente: no genera derecho a indemnización';
    }
    var amount = Math.round(days * daily * 100) / 100;
    $('es-total').textContent = eur(amount);
    $('es-res-type').textContent = method;
    $('es-res-days').textContent = num(days) + ' días';
    $('es-res-daily').textContent = eur(daily);
    $('es-res-cap').textContent = cap;
    $('es-res-notice').textContent = notice;
    $('es-res-salary').textContent = eur(salary);
    $('es-note').textContent = 'Esta cantidad es una estimación bruta, antes de impuestos. El salario diario se calcula con el salario bruto anual, incluyendo la prorrata de las pagas extraordinarias, dividido entre 365 días.';
  }
  var btn = $('es-btn');
  if (btn) btn.addEventListener('click', calc);
  ['es-type', 'es-years', 'es-months', 'es-days', 'es-pre', 'es-salary'].forEach(function (id) {
    var el = $(id);
    if (el) el.addEventListener('input', calc);
    if (el) el.addEventListener('change', calc);
  });
  calc();
})();
