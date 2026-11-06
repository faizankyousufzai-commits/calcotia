/* Calorieen Calculator + Macro Calculator (NL).
   API: calcCalorieen({ geslacht, leeftijd, lengteCm, gewichtKg, activiteit })
   - BMR Mifflin-St Jeor: man 10*kg + 6,25*cm - 5*leeftijd + 5;
     vrouw 10*kg + 6,25*cm - 5*leeftijd - 161.
   - TDEE = BMR x activiteitsfactor (1,2 / 1,375 / 1,55 / 1,725 / 1,9).
   API: calcMacro({ gewichtKg, kcal, doel })
   - Eiwit: afvallen 2,0 g/kg, onderhouden 1,6 g/kg, spieropbouw 2,2 g/kg.
   - Vet: 25% van de kcal / 9. Koolhydraten: rest / 4.
   Voorbeeld calorieen: man, 30 jr, 180 cm, 80 kg, matig actief (1,55):
   BMR 1780, TDEE 2759 kcal. Voorbeeld macro: 80 kg, 2500 kcal, onderhouden:
   eiwit 128 g, vet 69 g, koolhydraten 341 g. */
function calcCalorieen(input) {
  var kg = Math.max(0, parseFloat(input.gewichtKg) || 0);
  var cm = Math.max(0, parseFloat(input.lengteCm) || 0);
  var jr = Math.max(0, parseFloat(input.leeftijd) || 0);
  var man = input.geslacht === 'man';
  var bmr = 10 * kg + 6.25 * cm - 5 * jr + (man ? 5 : -161);
  var f = parseFloat(input.activiteit) || 1.55;
  return { bmr: Math.round(bmr), tdee: Math.round(bmr * f), afvallen: Math.round(bmr * f - 500), aankomen: Math.round(bmr * f + 300) };
}
function calcMacro(input) {
  var kg = Math.max(0, parseFloat(input.gewichtKg) || 0);
  var kcal = Math.max(0, parseFloat(input.kcal) || 0);
  var perKg = input.doel === 'afvallen' ? 2.0 : input.doel === 'spieropbouw' ? 2.2 : 1.6;
  var eiwit = kg * perKg;
  var vet = kcal * 0.25 / 9;
  var kh = (kcal - eiwit * 4 - vet * 9) / 4;
  return { eiwitG: Math.round(eiwit), vetG: Math.round(vet), khG: Math.round(Math.max(0, kh)),
    eiwitKcal: Math.round(eiwit * 4), vetKcal: Math.round(vet * 9), khKcal: Math.round(Math.max(0, kh) * 4) };
}
if (typeof document !== 'undefined') {
  (function () {
    function el(id) { return document.getElementById(id); }
    function fmt(n) { return new Intl.NumberFormat('nl-NL').format(n); }
    function renderCal() {
      var r = calcCalorieen({ geslacht: el('nlcal-geslacht') ? el('nlcal-geslacht').value : 'man',
        leeftijd: el('nlcal-leeftijd') ? el('nlcal-leeftijd').value : 0,
        lengteCm: el('nlcal-lengte') ? el('nlcal-lengte').value : 0,
        gewichtKg: el('nlcal-gewicht') ? el('nlcal-gewicht').value : 0,
        activiteit: el('nlcal-activiteit') ? el('nlcal-activiteit').value : 1.55 });
      var big = el('nlcal-big'); if (!big) { return; }
      big.textContent = fmt(r.tdee) + ' kcal';
      var rows = el('nlcal-rows'); if (!rows) { return; }
      rows.innerHTML = '<tr><td>Basaalmetabolisme (BMR)</td><td>' + fmt(r.bmr) + ' kcal/dag</td></tr>' +
        '<tr><td>Dagelijkse behoefte (TDEE)</td><td>' + fmt(r.tdee) + ' kcal/dag</td></tr>' +
        '<tr><td>Afvallen (TDEE \u2212 500)</td><td>' + fmt(r.afvallen) + ' kcal/dag</td></tr>' +
        '<tr><td>Aankomen (TDEE + 300)</td><td>' + fmt(r.aankomen) + ' kcal/dag</td></tr>';
    
    var res = el('nlcal-result'); if (res) { res.classList.add('show'); }
}
    function renderMac() {
      var r = calcMacro({ gewichtKg: el('nlmac-gewicht') ? el('nlmac-gewicht').value : 0,
        kcal: el('nlmac-kcal') ? el('nlmac-kcal').value : 0,
        doel: el('nlmac-doel') ? el('nlmac-doel').value : 'onderhouden' });
      var big = el('nlmac-big'); if (!big) { return; }
      big.textContent = r.eiwitG + ' g eiwit / ' + r.khG + ' g koolhydraten / ' + r.vetG + ' g vet';
      var rows = el('nlmac-rows'); if (!rows) { return; }
      rows.innerHTML = '<tr><td>Eiwitten</td><td>' + r.eiwitG + ' g (' + r.eiwitKcal + ' kcal)</td></tr>' +
        '<tr><td>Koolhydraten</td><td>' + r.khG + ' g (' + r.khKcal + ' kcal)</td></tr>' +
        '<tr><td>Vetten</td><td>' + r.vetG + ' g (' + r.vetKcal + ' kcal)</td></tr>';
    
    var res = el('nlmac-result'); if (res) { res.classList.add('show'); }
}
    var btn = el('nlcal-btn');
    if (btn) {
      btn.addEventListener('click', renderCal);
      ['nlcal-geslacht', 'nlcal-leeftijd', 'nlcal-lengte', 'nlcal-gewicht', 'nlcal-activiteit'].forEach(function (id) {
        var f = el(id); if (f) { f.addEventListener('input', renderCal); f.addEventListener('change', renderCal); }
      });
      renderCal();
    }
    var mbtn = el('nlmac-btn');
    if (mbtn) {
      mbtn.addEventListener('click', renderMac);
      ['nlmac-gewicht', 'nlmac-kcal', 'nlmac-doel'].forEach(function (id) {
        var f = el(id); if (f) { f.addEventListener('input', renderMac); f.addEventListener('change', renderMac); }
      });
      renderMac();
    }
  })();
}
if (typeof module !== 'undefined' && module.exports) { module.exports = { calcCalorieen: calcCalorieen, calcMacro: calcMacro }; }
