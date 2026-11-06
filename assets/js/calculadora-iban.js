/* Calculadora IBAN (cuenta espanola).
   API: calcularIBAN({ entidad, oficina, cuenta }) -> { ccc, digitosControl, iban, valido }
        validarIBAN(iban) -> { valido, iban }
   - CCC espanol: 20 digitos (entidad 4 + oficina 4 + control 2 + cuenta 10).
   - Digitos de control espanoles (norma del Banco de Espana): pesos
     1, 2, 4, 8, 5, 10, 9, 7, 3, 6; resto de dividir entre 11; digito =
     11 - resto (10 -> 1, 11 -> 0). Primer digito: entidad+oficina
     (con dos ceros a la izquierda); segundo: numero de cuenta.
   - IBAN ES: 'ES' + 2 digitos de control + CCC. Los digitos se calculan
     con mod-97: ES=1428, numero = CCC + '142800'; control = 98 - (numero mod 97).
   - Validacion: convertir letras (A=10...Z=35), mover los 4 primeros
     caracteres al final y comprobar que el resto mod 97 es 1 (ISO 13616).
   Ejemplo verificado: entidad 2100, oficina 0418, cuenta 0200051332 ->
   control 45, IBAN ES91 2100 0418 45 0200051332, mod-97 = 1. */
function digitoControlES(diezDigitos) {
  var pesos = [1, 2, 4, 8, 5, 10, 9, 7, 3, 6];
  var suma = 0;
  for (var i = 0; i < 10; i++) { suma += parseInt(diezDigitos.charAt(i), 10) * pesos[i]; }
  var resto = suma % 11;
  var d = 11 - resto;
  if (d === 11) { return 0; }
  if (d === 10) { return 1; }
  return d;
}
function mod97(cadenaNumerica) {
  var resto = 0;
  for (var i = 0; i < cadenaNumerica.length; i++) {
    resto = (resto * 10 + parseInt(cadenaNumerica.charAt(i), 10)) % 97;
  }
  return resto;
}
function calcularIBAN(input) {
  var entidad = String(input.entidad || '').replace(/\D/g, '').padStart(4, '0').slice(0, 4);
  var oficina = String(input.oficina || '').replace(/\D/g, '').padStart(4, '0').slice(0, 4);
  var cuenta = String(input.cuenta || '').replace(/\D/g, '').padStart(10, '0').slice(0, 10);
  var dc1 = digitoControlES('00' + entidad + oficina);
  var dc2 = digitoControlES(cuenta);
  var ccc = entidad + oficina + dc1 + dc2 + cuenta;
  var control = 98 - mod97(ccc + '142800');
  var iban = 'ES' + (control < 10 ? '0' : '') + control + ccc;
  return { ccc: ccc, digitosControl: '' + dc1 + dc2, iban: iban,
    ibanFormateado: iban.replace(/(.{4})/g, '$1 ').trim(), valido: validarIBAN(iban).valido };
}
function validarIBAN(iban) {
  var limpio = String(iban || '').replace(/[\s-]/g, '').toUpperCase();
  if (!/^ES\d{22}$/.test(limpio)) { return { valido: false, iban: limpio }; }
  var reordenado = limpio.slice(4) + limpio.slice(0, 4);
  var numerico = '';
  for (var i = 0; i < reordenado.length; i++) {
    var c = reordenado.charAt(i);
    numerico += /[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c;
  }
  return { valido: mod97(numerico) === 1, iban: limpio };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function render() {
      var r = calcularIBAN({ entidad: el('esiban-entidad') ? el('esiban-entidad').value : '',
        oficina: el('esiban-oficina') ? el('esiban-oficina').value : '',
        cuenta: el('esiban-cuenta') ? el('esiban-cuenta').value : '' });
      var big = el('esiban-big'); if (!big) { return; }
      big.textContent = r.ibanFormateado;
      var rows = el('esiban-rows'); if (!rows) { return; }
      rows.innerHTML = '<tr><td>CCC (20 dígitos)</td><td>' + r.ccc + '</td></tr>' +
        '<tr><td>Dígitos de control</td><td>' + r.digitosControl + '</td></tr>' +
        '<tr><td>IBAN válido (mod-97)</td><td>' + (r.valido ? 'Sí' : 'No') + '</td></tr>';
    
    var res = el('esiban-result'); if (res) { res.classList.add('show'); }
}
    var btn = el('esiban-btn'); if (btn) { btn.addEventListener('click', render); }
    ['esiban-entidad', 'esiban-oficina', 'esiban-cuenta'].forEach(function (id) {
      var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); }
    });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcularIBAN: calcularIBAN, validarIBAN: validarIBAN, digitoControlES: digitoControlES, mod97: mod97 };
}
