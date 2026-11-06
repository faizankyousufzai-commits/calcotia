/* Calculadora IVA e IRPF (factura de autonomo, Espana 2026).
   API: calcIvaIrpf({ base, ivaPct, retencionPct, desdeTotal })
   - Tipos de IVA verificados: general 21 %, reducido 10 %, superreducido 4 %.
   - Retencion IRPF verificada: 15 % general (actividades profesionales),
     7 % nuevos autonomos (ano de alta y dos siguientes), 0 % si se factura
     a particulares. La retencion se calcula sobre la base imponible.
   - Total a cobrar = base + IVA - retencion. Si se introduce el total,
     base = total / (1 + iva - retencion).
   - El IVA repercutido se declara en el modelo 303; la retencion es un pago
     a cuenta, no un impuesto extra.
   Fuentes: Agencia Tributaria; Ley 37/1992 del IVA; Reglamento de
   facturacion (RD 1619/2012).
   Ejemplo verificado: base 1.000, IVA 21 %, retencion 15 % ->
   IVA 210, retencion 150, total 1.060. */
function calcIvaIrpf(input) {
  var iva = Math.max(0, parseFloat(input.ivaPct) || 0) / 100;
  var ret = Math.max(0, parseFloat(input.retencionPct) || 0) / 100;
  function r2(n) { return Math.round(n * 100) / 100; }
  var base, total;
  if (input.desdeTotal) {
    total = Math.max(0, parseFloat(input.total) || 0);
    base = total / (1 + iva - ret);
  } else {
    base = Math.max(0, parseFloat(input.base) || 0);
    total = base * (1 + iva - ret);
  }
  return { base: r2(base), iva: r2(base * iva), retencion: r2(base * ret), total: r2(total),
    ivaPct: iva * 100, retencionPct: ret * 100 };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function eur(n) { return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n); }
    function render() {
      var r = calcIvaIrpf({ base: el('esiva-base') ? el('esiva-base').value : 0,
        ivaPct: el('esiva-iva') ? el('esiva-iva').value : 21,
        retencionPct: el('esiva-ret') ? el('esiva-ret').value : 15 });
      var big = el('esiva-big'); if (!big) { return; }
      big.textContent = eur(r.total);
      var rows = el('esiva-rows'); if (!rows) { return; }
      rows.innerHTML = '<tr><td>Base imponible</td><td>' + eur(r.base) + '</td></tr>' +
        '<tr><td>IVA (' + r.ivaPct + ' %)</td><td>' + eur(r.iva) + '</td></tr>' +
        '<tr><td>Retención IRPF (' + r.retencionPct + ' %)</td><td>− ' + eur(r.retencion) + '</td></tr>' +
        '<tr><td>Total a cobrar</td><td>' + eur(r.total) + '</td></tr>';
    }
    var btn = el('esiva-btn'); if (btn) { btn.addEventListener('click', render); }
    ['esiva-base', 'esiva-iva', 'esiva-ret'].forEach(function (id) {
      var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); }
    });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcIvaIrpf: calcIvaIrpf }; }
