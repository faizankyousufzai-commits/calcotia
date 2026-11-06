// Calcotia NO — Lån cluster engine (Calcilo implant, 2026-11-06)
// Annuitetslån (fransk amortisering) + effektiv rente via IRR/bisection.
// Utlånsforskriften: maks lån 5x årsinntekt, 10 % egenkapital.
// Lånekassen flytende rente 4,707 % fra 1. november 2026 (lanekassen.no).
'use strict';
function round2(x){ return Math.round(x*100)/100; }
function fmt(n, d){ d = (d===undefined?2:d); return Number(n).toLocaleString('nb-NO',{minimumFractionDigits:d, maximumFractionDigits:d}); }

function annuitet(lan, rentePct, ar){
  var i = rentePct/100/12, n = ar*12;
  if (i === 0) return lan/n;
  return lan * i / (1 - Math.pow(1+i, -n));
}
function effektivRente(lan, rentePct, ar, gebyr){
  // IRR: net received = lan - gebyr; monthly payment from TIN.
  var bet = annuitet(lan, rentePct, ar), netto = lan - (gebyr||0), n = ar*12;
  function npv(im){ var s = 0; for (var k=1;k<=n;k++) s += bet/Math.pow(1+im,k); return s - netto; }
  var lo = 0, hi = 0.05, flo = npv(lo);
  for (var it=0; it<200; it++){ var mid=(lo+hi)/2; var f=npv(mid); if (f>0) lo=mid; else hi=mid; }
  return (Math.pow(1+(lo+hi)/2,12)-1)*100;
}
function calcBoliglan(o){
  var inntekt = Number(o.inntekt), egen = Number(o.egenkapital);
  var maksLan = inntekt * 5;
  var kjopesum = maksLan + egen;
  var mnd = annuitet(maksLan, Number(o.rentePct), Number(o.ar));
  return { maksLan: Math.round(maksLan), maksKjopesum: Math.round(kjopesum), mndBeloep: round2(mnd), egenkapitalKrav: Math.round(kjopesum*0.10) };
}
function calcForbrukslan(o){
  var lan = Number(o.lan), rente = Number(o.rentePct), ar = Number(o.ar), gebyr = Number(o.gebyr)||0;
  var mnd = annuitet(lan, rente, ar);
  var total = mnd*ar*12 + gebyr;
  return { mndBeloep: round2(mnd), effektivRente: round2(effektivRente(lan, rente, ar, gebyr)), totalKostnad: round2(total), renterOgGebyr: round2(total-lan) };
}
function calcBillan(o){
  var lan = Number(o.pris) - Number(o.egenkapital);
  var mnd = annuitet(lan, Number(o.rentePct), Number(o.ar));
  var total = mnd*Number(o.ar)*12;
  return { lanebeloep: Math.round(lan), mndBeloep: round2(mnd), effektivRente: round2(effektivRente(lan, Number(o.rentePct), Number(o.ar), Number(o.gebyr)||0)), totalKostnad: round2(total), renter: round2(total-lan) };
}
function calcRefinansiering(o){
  var bolig = Number(o.boliglan), forbruk = Number(o.forbrukslan)||0;
  var mndGammel = annuitet(bolig, Number(o.renteGammel), Number(o.ar)) + (forbruk? annuitet(forbruk, Number(o.renteForbruk), 5) : 0);
  var nyttLan = bolig + forbruk;
  var mndNy = annuitet(nyttLan, Number(o.renteNy), Number(o.ar));
  return { mndGammel: round2(mndGammel), mndNy: round2(mndNy), besparelseMnd: round2(mndGammel-mndNy), besparelseAr: round2((mndGammel-mndNy)*12), nyttLan: Math.round(nyttLan) };
}
function calcKredittkort(o){
  var gjeld = Number(o.gjeld), rente = Number(o.rentePct)/100/12, bet = Number(o.betaling);
  var saldo = gjeld, mnd = 0, renter = 0;
  while (saldo > 0 && mnd < 600){ var r = saldo*rente; renter += r; saldo = saldo + r - bet; mnd++; if (bet <= r) { mnd = -1; break; } }
  return { mnd: mnd, totalRenter: round2(renter), totalBetalt: mnd>0 ? round2(gjeld+renter) : null };
}
function calcStudielan(o){
  var lan = Number(o.lan), rente = Number(o.rentePct), ar = Number(o.ar);
  var mnd = annuitet(lan, rente, ar);
  var total = mnd*ar*12;
  return { mndBeloep: round2(mnd), terminbeloep: round2(mnd), totalRenter: round2(total-lan), totalKostnad: round2(total), rentefradragAr: round2((total-lan)/ar*0.22) };
}

var DEFAULTS = {
  boliglan: { inntekt: 700000, egenkapital: 400000, rentePct: 5.5, ar: 25 },
  forbrukslan: { lan: 150000, rentePct: 12, ar: 5, gebyr: 950 },
  billan: { pris: 400000, egenkapital: 80000, rentePct: 6.5, ar: 7, gebyr: 0 },
  refinansiering: { boliglan: 2500000, renteGammel: 6, renteNy: 5, forbrukslan: 150000, renteForbruk: 15, ar: 25 },
  kredittkort: { gjeld: 50000, rentePct: 25, betaling: 2000 },
  studielan: { lan: 300000, rentePct: 4.707, ar: 20 }
};

if (typeof document !== 'undefined') {
  function val(id){ var el = document.getElementById(id); return el ? el.value : ''; }
  function setText(id, t){ var el = document.getElementById(id); if (el) el.textContent = t; }
  function setRows(id, rows){ var el = document.getElementById(id); if (el) el.innerHTML = rows.map(function(r){ return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join(''); }
  function bind(btnId, fn){
    var b = document.getElementById(btnId); if (!b) return;
    function run(){
      fn();
      var res = document.getElementById(btnId.replace('-btn', '-result'));
      if (res) { res.classList.add('show'); }
    }
    b.addEventListener('click', run);
    ['input','change'].forEach(function(ev){ document.querySelectorAll('#' + btnId.replace('-btn','-form') + ' input, #' + btnId.replace('-btn','-form') + ' select').forEach(function(el){ el.addEventListener(ev, run); }); });
    run();
  }
  document.addEventListener('DOMContentLoaded', function(){
    bind('no-boliglan-btn', function(){ var r = calcBoliglan({inntekt: val('no-boliglan-inntekt'), egenkapital: val('no-boliglan-egenkapital'), rentePct: val('no-boliglan-rente'), ar: val('no-boliglan-ar')}); setText('no-boliglan-big', fmt(r.maksLan,0) + ' kr'); setRows('no-boliglan-rows', [['Maks kjøpesum', fmt(r.maksKjopesum,0) + ' kr'], ['Månedsbeløp på maks lån', fmt(r.mndBeloep,0) + ' kr'], ['Egenkapitalkrav (10 %)', fmt(r.egenkapitalKrav,0) + ' kr']]); });
    bind('no-forbrukslan-btn', function(){ var r = calcForbrukslan({lan: val('no-forbrukslan-lan'), rentePct: val('no-forbrukslan-rente'), ar: val('no-forbrukslan-ar'), gebyr: val('no-forbrukslan-gebyr')}); setText('no-forbrukslan-big', fmt(r.mndBeloep,0) + ' kr/mnd'); setRows('no-forbrukslan-rows', [['Effektiv rente', fmt(r.effektivRente) + ' %'], ['Total kostnad', fmt(r.totalKostnad,0) + ' kr'], ['Renter og gebyrer', fmt(r.renterOgGebyr,0) + ' kr']]); });
    bind('no-billan-btn', function(){ var r = calcBillan({pris: val('no-billan-pris'), egenkapital: val('no-billan-egenkapital'), rentePct: val('no-billan-rente'), ar: val('no-billan-ar'), gebyr: 0}); setText('no-billan-big', fmt(r.mndBeloep,0) + ' kr/mnd'); setRows('no-billan-rows', [['Lånebeløp', fmt(r.lanebeloep,0) + ' kr'], ['Effektiv rente', fmt(r.effektivRente) + ' %'], ['Total kostnad', fmt(r.totalKostnad,0) + ' kr'], ['Renter totalt', fmt(r.renter,0) + ' kr']]); });
    bind('no-refinansiering-btn', function(){ var r = calcRefinansiering({boliglan: val('no-refinansiering-boliglan'), renteGammel: val('no-refinansiering-rente-gammel'), renteNy: val('no-refinansiering-rente-ny'), forbrukslan: val('no-refinansiering-forbrukslan'), renteForbruk: val('no-refinansiering-rente-forbruk'), ar: val('no-refinansiering-ar')}); setText('no-refinansiering-big', fmt(r.besparelseMnd,0) + ' kr/mnd'); setRows('no-refinansiering-rows', [['Månedsbeløp i dag', fmt(r.mndGammel,0) + ' kr'], ['Månedsbeløp etter refinansiering', fmt(r.mndNy,0) + ' kr'], ['Besparelse per år', fmt(r.besparelseAr,0) + ' kr'], ['Nytt samlet lån', fmt(r.nyttLan,0) + ' kr']]); });
    bind('no-kredittkort-btn', function(){ var r = calcKredittkort({gjeld: val('no-kredittkort-gjeld'), rentePct: val('no-kredittkort-rente'), betaling: val('no-kredittkort-betaling')}); setText('no-kredittkort-big', r.mnd < 0 ? 'Betaler aldri ned' : fmt(r.mnd,0) + ' måneder'); setRows('no-kredittkort-rows', [['Renter totalt', fmt(r.totalRenter,0) + ' kr'], ['Totalt å betale', r.totalBetalt === null ? '—' : fmt(r.totalBetalt,0) + ' kr'], ['Minstebeløp å huske', 'Betal mer enn rentene hver måned']]); });
    bind('no-studielan-btn', function(){ var r = calcStudielan({lan: val('no-studielan-lan'), rentePct: val('no-studielan-rente'), ar: val('no-studielan-ar')}); setText('no-studielan-big', fmt(r.mndBeloep,0) + ' kr/mnd'); setRows('no-studielan-rows', [['Terminbeløp', fmt(r.terminbeloep,0) + ' kr'], ['Renter totalt', fmt(r.totalRenter,0) + ' kr'], ['Rentefradrag per år (ca.)', fmt(r.rentefradragAr,0) + ' kr']]); });
  });
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { annuitet: annuitet, effektivRente: effektivRente, calcBoliglan: calcBoliglan, calcForbrukslan: calcForbrukslan, calcBillan: calcBillan, calcRefinansiering: calcRefinansiering, calcKredittkort: calcKredittkort, calcStudielan: calcStudielan, DEFAULTS: DEFAULTS, fmt: fmt };
}
