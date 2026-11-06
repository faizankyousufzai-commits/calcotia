/* Calcotia PL — shared calculator binder + formatting (Calcilo implant).
   Cluster engines (pl-zdrowie.js, pl-finanse.js, pl-praca.js,
   pl-matematyka.js, pl-budownictwo.js, pl-inne.js) register pure
   functions in window.PL_CALCS keyed by data-kind. Each page's .calc
   block carries data-kind + data-field inputs; the binder gathers the
   inputs, calls the pure function, and writes results into [data-out]
   elements. No inline JS anywhere; GA4 gtag is the only inline script.
   Node-testable: require() this file + a cluster file, then call the
   pure functions directly (guarded by typeof document / module). */
(function () {
  var root = typeof window !== 'undefined' ? window : globalThis;
  root.PL_CALCS = root.PL_CALCS || {};

  function fmtPL(v, fmt) {    if (v === null || v === undefined || v === '') return '—';
    if (fmt === 'text' || fmt === 'date' || fmt === 'time') return String(v);
    var n = Number(v);
    if (!isFinite(n)) return String(v);
    var opts;
    if (fmt === 'num0' || fmt === 'int') opts = { maximumFractionDigits: 0 };
    else if (fmt === 'num1') opts = { minimumFractionDigits: 1, maximumFractionDigits: 1 };
    else if (fmt === 'pct1') opts = { minimumFractionDigits: 1, maximumFractionDigits: 1 };
    else opts = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    var s = n.toLocaleString('pl-PL', opts);
    if (fmt === 'pln') return s + ' zł';
    if (fmt === 'pct2' || fmt === 'pct1') return s + ' %';
    if (fmt === 'eur') return s + ' €';
    return s;
  }

  function readInputs(calc) {
    var vals = {};
    var els = calc.querySelectorAll('[data-field]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute('data-field');
      if (el.type === 'checkbox') { vals[key] = el.checked ? 1 : 0; }
      else if (el.type === 'date' || el.tagName === 'SELECT' || el.type === 'text') { vals[key] = el.value; }
      else { var v = parseFloat(el.value); vals[key] = isNaN(v) ? 0 : v; }
    }
    return vals;
  }

  function readParams(calc) {
    var p = {};
    var ds = calc.dataset || {};
    Object.keys(ds).forEach(function (k) {
      if (k === 'kind' || k === 'engine') return;
      var raw = ds[k];
      var num = parseFloat(raw);
      p[k] = (String(num) === String(raw).trim()) ? num : raw;
    });
    return p;
  }

  function recalc(calc) {
    var kind = calc.getAttribute('data-kind');
    var fn = root.PL_CALCS[kind];
    if (typeof fn !== 'function') return;
    var out;
    try { out = fn(readInputs(calc), readParams(calc)) || {}; }
    catch (e) { return; }
    var targets = calc.querySelectorAll('[data-out]');
    for (var i = 0; i < targets.length; i++) {
      var el = targets[i];
      var key = el.getAttribute('data-out');
      if (out[key] === undefined) continue;
      el.textContent = fmtPL(out[key], el.getAttribute('data-fmt') || 'num2');
    }
    var noteEl = calc.querySelector('[data-out-note]');
    if (noteEl && out.note) { noteEl.textContent = out.note; }
  }

  function bind() {
    if (typeof document === 'undefined') return;
    var calcs = document.querySelectorAll('.calc[data-kind]');
    for (var i = 0; i < calcs.length; i++) {
      (function (calc) {
        var btn = calc.querySelector('.calc-btn');
        if (btn) btn.addEventListener('click', function () { recalc(calc); });
        var inputs = calc.querySelectorAll('[data-field]');
        for (var j = 0; j < inputs.length; j++) {
          inputs[j].addEventListener('input', function () { recalc(calc); });
          inputs[j].addEventListener('change', function () { recalc(calc); });
        }
        recalc(calc);
      })(calcs[i]);
    }
  }

  /* Generic kinds available on every PL tool page. */
  function r2g(x) { return Math.round(x * 100) / 100; }
  root.PL_CALCS.percent = function (i) {
    var w = i.wartosc || 0, p = i.procent || 0;
    return { czesc: r2g(w * p / 100), po_dodaniu: r2g(w * (1 + p / 100)), po_odjeciu: r2g(w * (1 - p / 100)) };
  };
  root.PL_CALCS.ratio = function (i) {
    var a = i.a || 0, b = i.b || 0;
    return { stosunek: b > 0 ? r2g(a / b) : 0, procent_a: (a + b) > 0 ? r2g(a / (a + b) * 100) : 0, procent_b: (a + b) > 0 ? r2g(b / (a + b) * 100) : 0 };
  };
  root.PL_CALCS.per_unit = function (i) {
    var total = i.calkowita || 0, qty = i.ilosc || 0;
    return { za_jednostke: qty > 0 ? r2g(total / qty) : 0, razem: r2g(total) };
  };
  root.PL_CALCS.convert_factor = function (i, p) {
    var v = i.wartosc || 0, f = p.factor || 1;
    return { wynik: r2g(v * f), odwrotnie: f > 0 ? r2g(v / f) : 0 };
  };
  root.PL_CALCS.linear_cost = function (i, p) {
    var a = i.a || 0, b = i.b || 0;
    var koszt = a * (p.cena_a || 0) + b * (p.cena_b || 0) + (p.stala || 0);
    return { koszt: r2g(koszt) };
  };

  root.PL_BIND = { fmtPL: fmtPL, readInputs: readInputs, readParams: readParams, recalc: recalc, bind: bind };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fmtPL: fmtPL, PL_CALCS: root.PL_CALCS };
  }
})();
