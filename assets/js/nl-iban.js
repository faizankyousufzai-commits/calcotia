/* IBAN Calculator (NL).
   API: ibanVanRekening({ bankcode, rekeningnummer }) -> NL IBAN;
         valideerIBAN(iban) -> true/false (mod-97, ISO 13616).
   - Nederlands rekeningnummer: 9 of 10 cijfers; 9 cijfers krijgen een
     voorloopnul. IBAN = NL + controlegetal (98 - (rekening + bankcode +
     'NL00' als getal mod 97)) + bankcode + rekeningnummer.
   - Bankcodes: bekende Nederlandse banken (ABNA, RABO, INGB, SNSB, TRIO, KNAB, BUNQ, REVO, ASNB, RBRB).
   Voorbeeld: INGB 0001234567 -> NL20 INGB 0001 2345 67 (controle via mod-97).
   Let op: de calculator controleert alleen de structuur, niet of de rekening bestaat. */
var NL_BANKEN = { ABNA: 'ABN AMRO', RABO: 'Rabobank', INGB: 'ING', SNSB: 'SNS Bank', TRIO: 'Triodos', KNAB: 'Knab', BUNQ: 'bunq', REVO: 'Revolut', ASNB: 'ASN Bank', RBRB: 'RegioBank' };
function mod97(str) {
  var rest = 0;
  for (var i = 0; i < str.length; i++) { rest = (rest * 10 + parseInt(str[i], 10)) % 97; }
  return rest;
}
function ibanVanRekening(i) {
  var bank = String(i.bankcode || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  var rek = String(i.rekeningnummer || '').replace(/\D/g, '');
  if (rek.length === 9) { rek = '0' + rek; }
  if (bank.length !== 4 || rek.length !== 10) { return { iban: '', geldig: false, banknaam: '' }; }
  var bankCijfers = bank.split('').map(function (ch) { return ch.charCodeAt(0) - 55; }).join('');
  var controle = 98 - mod97(bankCijfers + rek + '232100');
  var cc = controle < 10 ? '0' + controle : String(controle);
  var iban = 'NL' + cc + bank + rek;
  return { iban: iban, geldig: true, banknaam: NL_BANKEN[bank] || '' };
}
function valideerIBAN(iban) {
  var s = String(iban || '').toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(s)) { return false; }
  var omgezet = s.slice(4) + s.slice(0, 4);
  var num = omgezet.split('').map(function (ch) { return /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch; }).join('');
  return mod97(num) === 1;
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    var btn = el('nliban-btn'); if (!btn) { return; }
    function render() {
      var modus = el('nliban-modus').value;
      var big = el('nliban-big'), rows = el('nliban-rows');
      if (modus === 'controleren') {
        var iban = el('nliban-iban').value;
        var ok = valideerIBAN(iban);
        big.textContent = ok ? 'Geldig IBAN' : 'Ongeldig IBAN';
        rows.innerHTML = '<tr><td>IBAN</td><td>' + (iban || '–') + '</td></tr><tr><td>Controle (mod-97)</td><td>' + (ok ? 'Geldig' : 'Ongeldig') + '</td></tr>';
      } else {
        var r = ibanVanRekening({ bankcode: el('nliban-bank').value, rekeningnummer: el('nliban-rekening').value });
        big.textContent = r.iban || '–';
        rows.innerHTML = '<tr><td>IBAN</td><td>' + (r.iban || '–') + '</td></tr><tr><td>Bank</td><td>' + (r.banknaam || '–') + '</td></tr><tr><td>Geldig</td><td>' + (r.geldig ? 'Ja (mod-97)' : 'Nee – controleer bankcode en rekeningnummer') + '</td></tr>';
      }
    
    var res = el('nliban-result'); if (res) { res.classList.add('show'); }
}
    btn.addEventListener('click', render);
    ['nliban-modus', 'nliban-bank', 'nliban-rekening', 'nliban-iban'].forEach(function (id) { var f = el(id); if (f) { f.addEventListener('input', render); f.addEventListener('change', render); } });
    render();
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { ibanVanRekening: ibanVanRekening, valideerIBAN: valideerIBAN }; }
