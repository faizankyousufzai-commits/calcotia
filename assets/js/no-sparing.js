// Calcotia NO — Sparing/energi cluster engine (Calcilo implant, 2026-11-06)
// Norgespris 50 øre/kWh inkl. mva (40 øre i Nord-Norge), strømstøtte 90 %
// over 77 øre/kWh eks. mva (96,25 øre inkl.), tak 5 000 kWh/mnd (NVE/RME).
// Fondsskatt på gevinst 37,84 % (aksjefond). Valuta- og gullpriser er
// BRUKERINNTATT: standardkursene er eksempler, ikke ferske kurser.
'use strict';
function round2(x){ return Math.round(x*100)/100; }
function fmt(n, d){ d = (d===undefined?2:d); return Number(n).toLocaleString('nb-NO',{minimumFractionDigits:d, maximumFractionDigits:d}); }

function calcAvkastningFond(o){
  var mnd = Number(o.mnd), engangs = Number(o.engangs)||0, ar = Number(o.ar);
  var r = (Number(o.avkastningPct) - (Number(o.honorarPct)||0))/100/12;
  var fv = engangs*Math.pow(1+r, ar*12) + mnd*(Math.pow(1+r, ar*12)-1)/r;
  var innbetalt = engangs + mnd*ar*12;
  var gevinst = fv - innbetalt;
  var skatt = Math.max(0, gevinst*0.3784);
  return { sluttverdi: Math.round(fv), innbetalt: Math.round(innbetalt), gevinst: Math.round(gevinst), skatt: Math.round(skatt), etterSkatt: Math.round(fv-skatt) };
}
function calcSparePensjon(o){
  var mal = Number(o.mal), ar = Number(o.ar), r = Number(o.rentePct)/100/12, n = ar*12;
  var mnd = mal * r / (Math.pow(1+r, n)-1);
  return { mndSparing: round2(mnd), totalInnskudd: Math.round(mnd*n), avkastning: Math.round(mal - mnd*n) };
}
function calcValuta(o){
  var belop = Number(o.belop), kurs = Number(o.kurs);
  return { nok: round2(belop*kurs), kurs: kurs };
}
function calcGullpris(o){
  var gram = Number(o.vekt), k = Number(o.karat), pris = Number(o.prisPerGram);
  var renhet = k > 100 ? k/1000 : k/24; // 585 = finhet 585/1000; 24 = karat 24
  var verdi = gram*renhet*pris;
  return { smelteverdi: round2(verdi), rentGull: round2(gram*renhet), prisPerGram: pris };
}
function calcKpi(o){
  var belop = Number(o.belop), fra = Number(o.kpiFra), til = Number(o.kpiTil);
  var verdi = belop*til/fra;
  return { verdiNaa: round2(verdi), prisvekstPct: round2((til/fra-1)*100) };
}
function calcGjengsLeie(o){
  var leie = Number(o.leie), fra = Number(o.kpiFra), til = Number(o.kpiTil);
  var ny = leie*til/fra;
  return { nyLeie: round2(ny), okning: round2(ny-leie), okningPct: round2((til/fra-1)*100) };
}
function calcStudiepoeng(o){
  var tatt = Number(o.poengTatt), forventet = Number(o.poengForventet);
  var forsinkelse = forventet - tatt;
  var status = tatt >= 60 ? 'Du er i rute (60 poeng per år)' : tatt >= 30 ? 'Du er forsinket, men kan fortsatt få støtte' : 'Du er mer enn et halvt år forsinket';
  return { forsinkelse: forsinkelse, status: status, omgjoring: Math.round(Math.max(0, tatt)*0.40) };
}
function calcNorgespris(o){
  var kwh = Math.min(Number(o.kwh), 5000), spot = Number(o.spotOre);
  var norgesprisOre = o.nord === 'ja' ? 40 : 50;
  var kostNorgespris = kwh*norgesprisOre/100;
  var over = Math.max(0, spot-77);
  var betaltOreInkl = (spot - over*0.90)*1.25;
  var kostStotte = kwh*betaltOreInkl/100;
  return { kostNorgespris: round2(kostNorgespris), kostStotte: round2(kostStotte), besparelse: round2(kostStotte-kostNorgespris), prisPerKwhStotte: round2(betaltOreInkl) };
}
function calcStromstotte(o){
  var kwh = Math.min(Number(o.kwh), 5000), spot = Number(o.spotOre);
  var over = Math.max(0, spot-77);
  var stotteOre = over*0.90*1.25;
  var stotte = kwh*stotteOre/100;
  var betaler = kwh*spot*1.25/100 - stotte;
  return { stotte: round2(stotte), betaler: round2(betaler), stotteOre: round2(stotteOre) };
}
function calcEgenkapital(o){
  var kjop = Number(o.kjopesum);
  var egen = kjop*0.10;
  var dok = kjop*0.025;
  var ting = 1170; // tinglysing skjøte + pantedokument (585 kr per dokument, 2026)
  return { egenkapital: Math.round(egen), dokumentavgift: Math.round(dok), tinglysing: ting, totalt: Math.round(egen+dok+ting) };
}

var DEFAULTS = {
  avkastningFond: { engangs: 100000, mnd: 3000, ar: 10, avkastningPct: 7, honorarPct: 0.5 },
  sparePensjon: { mal: 1000000, ar: 25, rentePct: 5 },
  valuta: { belop: 100, kurs: 11.50 },
  gullpris: { vekt: 10, karat: 585, prisPerGram: 950 },
  kpi: { belop: 1000, kpiFra: 100, kpiTil: 125 },
  gjengsLeie: { leie: 12000, kpiFra: 100, kpiTil: 108.5 },
  studiepoeng: { poengTatt: 45, poengForventet: 60 },
  norgespris: { kwh: 2000, spotOre: 120, nord: 'nei' },
  stromstotte: { kwh: 2000, spotOre: 150 },
  egenkapital: { kjopesum: 4000000 }
};

if (typeof document !== 'undefined') {
  function val(id){ var el = document.getElementById(id); return el ? el.value : ''; }
  function setText(id, t){ var el = document.getElementById(id); if (el) el.textContent = t; }
  function setRows(id, rows){ var el = document.getElementById(id); if (el) el.innerHTML = rows.map(function(r){ return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join(''); }
  function bind(btnId, fn){ var b = document.getElementById(btnId); if (b) b.addEventListener('click', fn); }
  document.addEventListener('DOMContentLoaded', function(){
    bind('no-avkastning-btn', function(){ var r = calcAvkastningFond({engangs: val('no-avkastning-engangs'), mnd: val('no-avkastning-mnd'), ar: val('no-avkastning-ar'), avkastningPct: val('no-avkastning-avkastning'), honorarPct: val('no-avkastning-honorar')}); setText('no-avkastning-big', fmt(r.sluttverdi,0) + ' kr'); setRows('no-avkastning-rows', [['Innbetalt totalt', fmt(r.innbetalt,0) + ' kr'], ['Gevinst før skatt', fmt(r.gevinst,0) + ' kr'], ['Skatt på gevinst (37,84 %)', fmt(r.skatt,0) + ' kr'], ['Verdi etter skatt', fmt(r.etterSkatt,0) + ' kr']]); });
    bind('no-spare-pensjon-btn', function(){ var r = calcSparePensjon({mal: val('no-spare-pensjon-mal'), ar: val('no-spare-pensjon-ar'), rentePct: val('no-spare-pensjon-rente')}); setText('no-spare-pensjon-big', fmt(r.mndSparing,0) + ' kr/mnd'); setRows('no-spare-pensjon-rows', [['Totalt innskudd', fmt(r.totalInnskudd,0) + ' kr'], ['Avkastning i perioden', fmt(r.avkastning,0) + ' kr'], ['Mål ved pensjon', fmt(Number(val('no-spare-pensjon-mal')),0) + ' kr']]); });
    bind('no-valuta-btn', function(){ var r = calcValuta({belop: val('no-valuta-belop'), kurs: val('no-valuta-kurs')}); setText('no-valuta-big', fmt(r.nok,0) + ' kr'); setRows('no-valuta-rows', [['Beløp i utenlandsk valuta', fmt(Number(val('no-valuta-belop')),0)], ['Kurs brukt (kr per enhet)', fmt(r.kurs)], ['Verdi i norske kroner', fmt(r.nok,0) + ' kr']]); });
    bind('no-gullpris-btn', function(){ var r = calcGullpris({vekt: val('no-gullpris-vekt'), karat: val('no-gullpris-karat'), prisPerGram: val('no-gullpris-pris')}); setText('no-gullpris-big', fmt(r.smelteverdi,0) + ' kr'); setRows('no-gullpris-rows', [['Rent gull', fmt(r.rentGull,1) + ' gram'], ['Pris per gram rent gull', fmt(r.prisPerGram,0) + ' kr'], ['Smelteverdi', fmt(r.smelteverdi,0) + ' kr']]); });
    bind('no-kpi-btn', function(){ var r = calcKpi({belop: val('no-kpi-belop'), kpiFra: val('no-kpi-fra'), kpiTil: val('no-kpi-til')}); setText('no-kpi-big', fmt(r.verdiNaa,0) + ' kr'); setRows('no-kpi-rows', [['Beløp i det gamle året', fmt(Number(val('no-kpi-belop')),0) + ' kr'], ['Prisvekst i perioden', fmt(r.prisvekstPct) + ' %'], ['Verdi i dag', fmt(r.verdiNaa,0) + ' kr']]); });
    bind('no-gjengs-leie-btn', function(){ var r = calcGjengsLeie({leie: val('no-gjengs-leie-leie'), kpiFra: val('no-gjengs-leie-fra'), kpiTil: val('no-gjengs-leie-til')}); setText('no-gjengs-leie-big', fmt(r.nyLeie,0) + ' kr/mnd'); setRows('no-gjengs-leie-rows', [['Økning i kroner', fmt(r.okning,0) + ' kr/mnd'], ['Økning i prosent', fmt(r.okningPct) + ' %'], ['Gammel leie', fmt(Number(val('no-gjengs-leie-leie')),0) + ' kr/mnd']]); });
    bind('no-studiepoeng-btn', function(){ var r = calcStudiepoeng({poengTatt: val('no-studiepoeng-tatt'), poengForventet: val('no-studiepoeng-forventet')}); setText('no-studiepoeng-big', fmt(r.forsinkelse,0) + ' poeng forsinket'); setRows('no-studiepoeng-rows', [['Status hos Lånekassen', r.status], ['Poeng som kan bli stipend (ca. 40 %)', fmt(r.omgjoring,0) + ' poeng'], ['Poeng tatt', fmt(Number(val('no-studiepoeng-tatt')),0)]]); });
    bind('no-norgespris-btn', function(){ var r = calcNorgespris({kwh: val('no-norgespris-kwh'), spotOre: val('no-norgespris-spot'), nord: val('no-norgespris-nord')}); setText('no-norgespris-big', fmt(r.kostNorgespris,0) + ' kr med Norgespris'); setRows('no-norgespris-rows', [['Kostnad med strømstøtte', fmt(r.kostStotte,0) + ' kr'], ['Besparelse med Norgespris', fmt(r.besparelse,0) + ' kr'], ['Pris per kWh med strømstøtte', fmt(r.prisPerKwhStotte,1) + ' øre']]); });
    bind('no-stromstotte-btn', function(){ var r = calcStromstotte({kwh: val('no-stromstotte-kwh'), spotOre: val('no-stromstotte-spot')}); setText('no-stromstotte-big', fmt(r.stotte,0) + ' kr i støtte'); setRows('no-stromstotte-rows', [['Støtte per kWh', fmt(r.stotteOre,1) + ' øre'], ['Du betaler for strømmen', fmt(r.betaler,0) + ' kr'], ['Forbruk regnet med', fmt(Math.min(Number(val('no-stromstotte-kwh')),5000),0) + ' kWh']]); });
    bind('no-egenkapital-btn', function(){ var r = calcEgenkapital({kjopesum: val('no-egenkapital-kjopesum')}); setText('no-egenkapital-big', fmt(r.totalt,0) + ' kr'); setRows('no-egenkapital-rows', [['Egenkapital (10 %)', fmt(r.egenkapital,0) + ' kr'], ['Dokumentavgift (2,5 %)', fmt(r.dokumentavgift,0) + ' kr'], ['Tinglysing', fmt(r.tinglysing,0) + ' kr'], ['Totalt å ha klart', fmt(r.totalt,0) + ' kr']]); });
  });
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcAvkastningFond: calcAvkastningFond, calcSparePensjon: calcSparePensjon, calcValuta: calcValuta, calcGullpris: calcGullpris, calcKpi: calcKpi, calcGjengsLeie: calcGjengsLeie, calcStudiepoeng: calcStudiepoeng, calcNorgespris: calcNorgespris, calcStromstotte: calcStromstotte, calcEgenkapital: calcEgenkapital, DEFAULTS: DEFAULTS, fmt: fmt };
}
