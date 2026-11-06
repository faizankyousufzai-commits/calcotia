// Calcotia NO — Skatt cluster engine (Calcilo implant, 2026-11-06)
// Satser 2026 verifisert: MVA 25/15/12 % (skatteetaten.no); formuesskatt
// bunnfradrag 1 900 000 kr, 1,0 % (1,1 % over 21,5 mill.); BSU 10 % av
// inntil 27 500 kr, tak 300 000 kr; IPS 22 % av inntil 25 000 kr;
// reisefradrag 1,90 kr/km, egenandel 12 000 kr, tak 120 000 kr;
// kjøregodtgjørelse statens sats 5,30 kr/km, skattefritt 3,50 kr/km,
// passasjer-/hengertillegg 1,00 kr/km; firmabil 30 % opp til 370 300 kr,
// 20 % over; eiendomsskatt: 70 % av boligverdi, maks 4 promille.
'use strict';
function round2(x){ return Math.round(x*100)/100; }
function fmt(n, d){ d = (d===undefined?2:d); return Number(n).toLocaleString('nb-NO',{minimumFractionDigits:d, maximumFractionDigits:d}); }

function calcMva(o){
  var belop = Number(o.belop), sats = Number(o.sats)/100;
  if (o.modus === 'inkl') { var eks = belop/(1+sats); return { eksMva: round2(eks), mva: round2(belop-eks), inklMva: round2(belop) }; }
  var mva = belop*sats;
  return { eksMva: round2(belop), mva: round2(mva), inklMva: round2(belop+mva) };
}
function calcFormuesskatt(o){
  var netto = Number(o.nettoformue);
  var bunn = o.ektepar === 'ja' ? 3800000 : 1900000;
  var trinn2 = o.ektepar === 'ja' ? 43000000 : 21500000;
  var over = Math.max(0, netto - bunn);
  var skatt = Math.min(over, trinn2 - bunn) * 0.01 + Math.max(0, netto - trinn2) * 0.011;
  return { bunnfradrag: bunn, skattbarFormue: Math.max(0, round2(over)), formuesskatt: round2(skatt) };
}
function calcTabelltrekk(o){
  // Prosenttrekk fra skattekortet: trekk per måned, halvt trekk i juni.
  var arslonn = Number(o.arslonn), pct = Number(o.trekkPct)/100;
  var trekkMnd = arslonn * pct / 12;
  var trekkJuni = trekkMnd / 2;
  var trekkAr = trekkMnd * 11 + trekkJuni;
  var nettoMnd = arslonn/12 - trekkMnd;
  return { trekkMnd: round2(trekkMnd), trekkJuni: round2(trekkJuni), nettoMnd: round2(nettoMnd), nettoJuni: round2(arslonn/12 - trekkJuni), trekkAr: round2(trekkAr) };
}
function calcEiendomsskatt(o){
  var takst = Number(o.boligverdi) * 0.70;
  var grunnlag = Math.max(0, takst - (Number(o.bunnfradrag)||0));
  var skatt = grunnlag * Number(o.promille) / 1000;
  return { takstverdi: Math.round(takst), grunnlag: Math.round(grunnlag), eiendomsskatt: round2(skatt) };
}
function calcBsu(o){
  var innskudd = Math.min(Number(o.innskudd), 27500);
  var spart = Number(o.spartTidligere)||0;
  var rom = Math.max(0, 300000 - spart - innskudd);
  return { innskudd: innskudd, skattefradrag: round2(innskudd*0.10), romIgjen: Math.round(rom) };
}
function calcIps(o){
  var innskudd = Math.min(Number(o.innskudd), 25000);
  return { innskudd: innskudd, skattefradrag: round2(innskudd*0.22), romIgjen: 25000 - innskudd };
}
function calcReisefradrag(o){
  var km = Number(o.kmDag) * 2 * Number(o.dager);
  var brutto = km * 1.90 + (Number(o.bom)||0);
  var fradrag = Math.max(0, Math.min(brutto, 120000) - 12000);
  return { kmAr: Math.round(km), fradrag: round2(fradrag), spartSkatt: round2(fradrag*0.22) };
}
function calcFirmabil(o){
  var listepris = Number(o.listepris);
  var fordel = Math.min(listepris, 370300)*0.30 + Math.max(0, listepris-370300)*0.20;
  fordel = Math.max(0, fordel - (Number(o.egenbetaling)||0));
  var skattPct = Number(o.skattPct)||35;
  return { skattepliktigFordel: Math.round(fordel), skattAr: Math.round(fordel*skattPct/100), skattMnd: Math.round(fordel*skattPct/100/12) };
}
function calcKjoregodtgjorelse(o){
  var km = Number(o.km);
  var tillegg = ((Number(o.passasjerer)||0) + (o.henger === 'ja' ? 1 : 0)) * 1.00 * km;
  var total = km*5.30 + tillegg;
  var skattefri = km*3.50 + tillegg;
  var skattepliktig = km*1.80;
  return { total: round2(total), skattefri: round2(skattefri), skattepliktig: round2(skattepliktig), tillegg: round2(tillegg) };
}
function mod97(s){ var r = 0; for (var i=0;i<s.length;i++){ r = (r*10 + (s.charCodeAt(i)-48)) % 97; } return r; }
function calcIban(o){
  var konto = String(o.kontonummer||'').replace(/\D/g,'');
  if (konto.length !== 11) return { gyldig: false, iban: '', kontrollsiffer: '' };
  var vekter = [5,4,3,2,7,6,5,4,3,2], sum = 0;
  for (var i=0;i<10;i++) sum += Number(konto[i])*vekter[i];
  var rest = sum % 11, kontroll = rest === 0 ? 0 : rest === 1 ? -1 : 11 - rest;
  var gyldigKonto = kontroll === Number(konto[10]);
  var sjekk = 98 - mod97(konto + '232400'); // N=23, O=24 -> "NO00" = 232400
  var iban = 'NO' + String(sjekk).padStart(2,'0') + konto;
  return { gyldig: gyldigKonto, iban: iban, kontrollsiffer: String(sjekk).padStart(2,'0'), kontonummer: konto };
}
function validerIban(iban){
  var s = String(iban||'').replace(/\s/g,'').toUpperCase();
  if (!/^NO\d{2}\d{11}$/.test(s)) return false;
  var om = s.slice(4) + s.slice(0,4);
  var tall = '';
  for (var i=0;i<om.length;i++){ var c = om[i]; tall += /[A-Z]/.test(c) ? String(c.charCodeAt(0)-55) : c; }
  return mod97(tall) === 1;
}

var DEFAULTS = {
  mva: { belop: 1000, sats: 25, modus: 'eks' },
  formuesskatt: { nettoformue: 3000000, ektepar: 'nei' },
  tabelltrekk: { arslonn: 600000, trekkPct: 30 },
  eiendomsskatt: { boligverdi: 5000000, promille: 3, bunnfradrag: 500000 },
  bsu: { innskudd: 27500, spartTidligere: 100000 },
  ips: { innskudd: 25000 },
  reisefradrag: { kmDag: 30, dager: 230, bom: 0 },
  firmabil: { listepris: 500000, egenbetaling: 0, skattPct: 35 },
  kjoregodtgjorelse: { km: 1000, passasjerer: 1, henger: 'nei' },
  iban: { kontonummer: '12044567890' }
};

if (typeof document !== 'undefined') {
  function val(id){ var el = document.getElementById(id); return el ? el.value : ''; }
  function setText(id, t){ var el = document.getElementById(id); if (el) el.textContent = t; }
  function setRows(id, rows){ var el = document.getElementById(id); if (el) el.innerHTML = rows.map(function(r){ return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join(''); }
  function bind(btnId, fn){ var b = document.getElementById(btnId); if (b) b.addEventListener('click', fn); }
  document.addEventListener('DOMContentLoaded', function(){
    bind('no-mva-btn', function(){ var r = calcMva({belop: val('no-mva-belop'), sats: val('no-mva-sats'), modus: val('no-mva-modus')}); setText('no-mva-big', fmt(r.inklMva,0) + ' kr inkl. mva'); setRows('no-mva-rows', [['Beløp eks. mva', fmt(r.eksMva,0) + ' kr'], ['Mva-beløp', fmt(r.mva,0) + ' kr'], ['Beløp inkl. mva', fmt(r.inklMva,0) + ' kr']]); });
    bind('no-formuesskatt-btn', function(){ var r = calcFormuesskatt({nettoformue: val('no-formuesskatt-formue'), ektepar: val('no-formuesskatt-ektepar')}); setText('no-formuesskatt-big', fmt(r.formuesskatt,0) + ' kr'); setRows('no-formuesskatt-rows', [['Bunnfradrag', fmt(r.bunnfradrag,0) + ' kr'], ['Skattbar formue', fmt(r.skattbarFormue,0) + ' kr'], ['Formuesskatt per år', fmt(r.formuesskatt,0) + ' kr']]); });
    bind('no-tabelltrekk-btn', function(){ var r = calcTabelltrekk({arslonn: val('no-tabelltrekk-arslonn'), trekkPct: val('no-tabelltrekk-trekk')}); setText('no-tabelltrekk-big', fmt(r.nettoMnd,0) + ' kr/mnd'); setRows('no-tabelltrekk-rows', [['Skattetrekk per måned', fmt(r.trekkMnd,0) + ' kr'], ['Skattetrekk i juni (halvt)', fmt(r.trekkJuni,0) + ' kr'], ['Nettolønn i juni', fmt(r.nettoJuni,0) + ' kr'], ['Skattetrekk per år', fmt(r.trekkAr,0) + ' kr']]); });
    bind('no-eiendomsskatt-btn', function(){ var r = calcEiendomsskatt({boligverdi: val('no-eiendomsskatt-verdi'), promille: val('no-eiendomsskatt-promille'), bunnfradrag: val('no-eiendomsskatt-bunnfradrag')}); setText('no-eiendomsskatt-big', fmt(r.eiendomsskatt,0) + ' kr/år'); setRows('no-eiendomsskatt-rows', [['Takstverdi (70 % av boligverdi)', fmt(r.takstverdi,0) + ' kr'], ['Grunnlag etter bunnfradrag', fmt(r.grunnlag,0) + ' kr'], ['Eiendomsskatt per år', fmt(r.eiendomsskatt,0) + ' kr']]); });
    bind('no-bsu-btn', function(){ var r = calcBsu({innskudd: val('no-bsu-innskudd'), spartTidligere: val('no-bsu-spart')}); setText('no-bsu-big', fmt(r.skattefradrag,0) + ' kr i fradrag'); setRows('no-bsu-rows', [['Innskudd i år', fmt(r.innskudd,0) + ' kr'], ['Skattefradrag (10 %)', fmt(r.skattefradrag,0) + ' kr'], ['Innskuddsrom igjen (av 300 000 kr)', fmt(r.romIgjen,0) + ' kr']]); });
    bind('no-ips-btn', function(){ var r = calcIps({innskudd: val('no-ips-innskudd')}); setText('no-ips-big', fmt(r.skattefradrag,0) + ' kr i fradrag'); setRows('no-ips-rows', [['Innskudd i år', fmt(r.innskudd,0) + ' kr'], ['Skattefradrag (22 %)', fmt(r.skattefradrag,0) + ' kr'], ['Rom igjen i år (av 25 000 kr)', fmt(r.romIgjen,0) + ' kr']]); });
    bind('no-reisefradrag-btn', function(){ var r = calcReisefradrag({kmDag: val('no-reisefradrag-km'), dager: val('no-reisefradrag-dager'), bom: val('no-reisefradrag-bom')}); setText('no-reisefradrag-big', fmt(r.fradrag,0) + ' kr i fradrag'); setRows('no-reisefradrag-rows', [['Kilometer per år', fmt(r.kmAr,0) + ' km'], ['Fradrag i alminnelig inntekt', fmt(r.fradrag,0) + ' kr'], ['Spart skatt (22 %)', fmt(r.spartSkatt,0) + ' kr']]); });
    bind('no-firmabil-btn', function(){ var r = calcFirmabil({listepris: val('no-firmabil-listepris'), egenbetaling: val('no-firmabil-egenbetaling'), skattPct: val('no-firmabil-skatt')}); setText('no-firmabil-big', fmt(r.skattMnd,0) + ' kr/mnd i skatt'); setRows('no-firmabil-rows', [['Skattepliktig fordel per år', fmt(r.skattepliktigFordel,0) + ' kr'], ['Skatt per år', fmt(r.skattAr,0) + ' kr'], ['Skatt per måned', fmt(r.skattMnd,0) + ' kr']]); });
    bind('no-kjoregodtgjorelse-btn', function(){ var r = calcKjoregodtgjorelse({km: val('no-kjoregodtgjorelse-km'), passasjerer: val('no-kjoregodtgjorelse-passasjerer'), henger: val('no-kjoregodtgjorelse-henger')}); setText('no-kjoregodtgjorelse-big', fmt(r.total,0) + ' kr'); setRows('no-kjoregodtgjorelse-rows', [['Skattefritt beløp', fmt(r.skattefri,0) + ' kr'], ['Skattepliktig beløp', fmt(r.skattepliktig,0) + ' kr'], ['Tillegg (passasjer/henger)', fmt(r.tillegg,0) + ' kr']]); });
    bind('no-iban-btn', function(){ var r = calcIban({kontonummer: val('no-iban-konto')}); setText('no-iban-big', r.iban || 'Ugyldig kontonummer'); setRows('no-iban-rows', [['Kontonummer', r.kontonummer || '—'], ['Kontrollsiffer (IBAN)', r.kontrollsiffer || '—'], ['Kontonummer gyldig (MOD11)', r.gyldig ? 'Ja' : 'Nei — sjekk sifferet']]); });
  });
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcMva: calcMva, calcFormuesskatt: calcFormuesskatt, calcTabelltrekk: calcTabelltrekk, calcEiendomsskatt: calcEiendomsskatt, calcBsu: calcBsu, calcIps: calcIps, calcReisefradrag: calcReisefradrag, calcFirmabil: calcFirmabil, calcKjoregodtgjorelse: calcKjoregodtgjorelse, calcIban: calcIban, validerIban: validerIban, DEFAULTS: DEFAULTS, fmt: fmt };
}
