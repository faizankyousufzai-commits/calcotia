// Calcotia NO — NAV cluster engine (Calcilo implant, 2026-11-06)
// Grunnbeløpet G = 136 549 kr fra 1. mai 2026, 6G = 819 294 kr (nav.no).
// Dagpenger 62,4 % av grunnlaget, dagsats = årsbeløp/260. AAP/uføretrygd
// 66 % opp til 6G. Minstesatser: AAP 2,041G (25 år+), uføretrygd enslig
// 2,529G. Barnetillegg 38 kr per stønadsdag (AAP). Kontantstøtte full sats
// 7 500 kr/mnd. Permittering: lønnsplikt 15 arbeidsdager.
'use strict';
function round2(x){ return Math.round(x*100)/100; }
function fmt(n, d){ d = (d===undefined?2:d); return Number(n).toLocaleString('nb-NO',{minimumFractionDigits:d, maximumFractionDigits:d}); }
var G = 136549, SEKS_G = 819294;

function calcDagpenger(o){
  var grunnlag = Math.min(Math.max(Number(o.inntekt12), Number(o.inntekt36)/3), SEKS_G);
  var ar = grunnlag*0.624;
  var dagsats = ar/260;
  var barn = Number(o.barn)||0;
  var barnetillegg = barn*38;
  return { grunnlag: Math.round(grunnlag), dagsats: round2(dagsats), barnetillegg: barnetillegg, mndBeloep: round2(dagsats*260/12 + barnetillegg*260/12), arsbeloep: Math.round(ar) };
}
function calcUforetrygd(o){
  var snitt = Math.min(Number(o.inntekt), SEKS_G);
  var ar = snitt*0.66*Number(o.uforegrad)/100;
  var minst = (o.enslig === 'ja' ? 2.529 : 2.329)*G;
  var ar2 = Math.max(ar, minst*Number(o.uforegrad)/100);
  return { arsbeloep: Math.round(ar2), mndBeloep: round2(ar2/12), minstesats: Math.round(minst) };
}
function calcBarnebidrag(o){
  // FORENKLET ESTIMAT etter NAVs sjablongmodell (1. juli 2026): underholds-
  // kostnad etter alder, minus barnetrygd, fordelt etter inntekt.
  var alder = Number(o.alder);
  var underhold = alder < 6 ? 4800 : alder < 11 ? 5900 : alder < 15 ? 6900 : 7900;
  var barnetrygd = alder < 6 ? 1760 : 1510;
  var netto = underhold - barnetrygd;
  var andel = Number(o.inntektBidrag) / Math.max(1, Number(o.inntektBidrag) + Number(o.inntektMottaker));
  var samvaer = Number(o.samvaer)||0;
  var fradrag = samvaer >= 15 ? netto*0.5 : samvaer >= 8 ? netto*0.25 : samvaer >= 4 ? netto*0.15 : 0;
  var bidrag = Math.max(0, netto*andel - fradrag);
  return { underholdskostnad: underhold, barnetrygd: barnetrygd, bidrag: Math.round(bidrag), inntektsandelPct: round2(andel*100) };
}
function calcTimelonn(o){
  var time = Number(o.timelonn), timer = Number(o.timerUke), pct = Number(o.stillingPct)/100;
  var ar = time*timer*52*pct;
  var overtid = time*1.5;
  return { arslonn: Math.round(ar), mndLonn: round2(ar/12), timelonnOvertid: round2(overtid) };
}
function calcAap(o){
  var ar = Math.min(Number(o.inntekt), SEKS_G)*0.66;
  var minst = 2.041*G;
  var ar2 = Math.max(ar, minst);
  var barn = Number(o.barn)||0;
  var tilleggMnd = barn*38*260/12;
  return { arsbeloep: Math.round(ar2), mndBeloep: round2(ar2/12 + tilleggMnd), barnetilleggMnd: round2(tilleggMnd), minstesats: Math.round(minst) };
}
function calcPermittering(o){
  var arslonn = Number(o.arslonn), mnd = arslonn/12;
  var lonn15 = mnd*15/21.67;
  var dagsats = Math.min(arslonn, SEKS_G)*0.624/260;
  var grad = Number(o.grad)/100;
  return { lonnArbeidsgiverperiode: round2(lonn15*grad), dagsatsNav: round2(dagsats*grad), mndNav: round2(dagsats*grad*260/12) };
}
function calcKontantstotte(o){
  var timer = Number(o.timer);
  var sats = timer === 0 ? 7500 : timer <= 8 ? 6000 : timer <= 16 ? 4500 : timer <= 24 ? 3000 : timer <= 32 ? 1500 : 0;
  var barn = Number(o.barn)||1;
  return { satsPerBarn: sats, totalt: sats*barn };
}

var DEFAULTS = {
  dagpenger: { inntekt12: 600000, inntekt36: 1500000, barn: 1 },
  uforetrygd: { inntekt: 600000, uforegrad: 100, enslig: 'ja' },
  barnebidrag: { alder: 8, inntektBidrag: 600000, inntektMottaker: 450000, samvaer: 8 },
  timelonn: { timelonn: 250, timerUke: 37.5, stillingPct: 100 },
  aap: { inntekt: 500000, barn: 1 },
  permittering: { arslonn: 600000, grad: 100 },
  kontantstotte: { timer: 0, barn: 1 }
};

if (typeof document !== 'undefined') {
  function val(id){ var el = document.getElementById(id); return el ? el.value : ''; }
  function setText(id, t){ var el = document.getElementById(id); if (el) el.textContent = t; }
  function setRows(id, rows){ var el = document.getElementById(id); if (el) el.innerHTML = rows.map(function(r){ return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join(''); }
  function bind(btnId, fn){ var b = document.getElementById(btnId); if (b) b.addEventListener('click', fn); }
  document.addEventListener('DOMContentLoaded', function(){
    bind('no-dagpenger-btn', function(){ var r = calcDagpenger({inntekt12: val('no-dagpenger-inntekt12'), inntekt36: val('no-dagpenger-inntekt36'), barn: val('no-dagpenger-barn')}); setText('no-dagpenger-big', fmt(r.dagsats,0) + ' kr/dag'); setRows('no-dagpenger-rows', [['Dagpengegrunnlag', fmt(r.grunnlag,0) + ' kr'], ['Barnetillegg per dag', fmt(r.barnetillegg,0) + ' kr'], ['Utbetaling per måned (ca.)', fmt(r.mndBeloep,0) + ' kr'], ['Årsbeløp (62,4 %)', fmt(r.arsbeloep,0) + ' kr']]); });
    bind('no-uforetrygd-btn', function(){ var r = calcUforetrygd({inntekt: val('no-uforetrygd-inntekt'), uforegrad: val('no-uforetrygd-grad'), enslig: val('no-uforetrygd-enslig')}); setText('no-uforetrygd-big', fmt(r.mndBeloep,0) + ' kr/mnd'); setRows('no-uforetrygd-rows', [['Årsbeløp', fmt(r.arsbeloep,0) + ' kr'], ['Minstesats (100 % ufør)', fmt(r.minstesats,0) + ' kr/år'], ['Uføregrad', fmt(Number(val('no-uforetrygd-grad')),0) + ' %']]); });
    bind('no-barnebidrag-btn', function(){ var r = calcBarnebidrag({alder: val('no-barnebidrag-alder'), inntektBidrag: val('no-barnebidrag-inntekt-bidrag'), inntektMottaker: val('no-barnebidrag-inntekt-mottaker'), samvaer: val('no-barnebidrag-samvaer')}); setText('no-barnebidrag-big', fmt(r.bidrag,0) + ' kr/mnd'); setRows('no-barnebidrag-rows', [['Underholdskostnad (sjablong)', fmt(r.underholdskostnad,0) + ' kr/mnd'], ['Barnetrygd', fmt(r.barnetrygd,0) + ' kr/mnd'], ['Inntektsandel', fmt(r.inntektsandelPct) + ' %']]); });
    bind('no-timelonn-btn', function(){ var r = calcTimelonn({timelonn: val('no-timelonn-time'), timerUke: val('no-timelonn-timer'), stillingPct: val('no-timelonn-stilling')}); setText('no-timelonn-big', fmt(r.arslonn,0) + ' kr/år'); setRows('no-timelonn-rows', [['Månedslønn', fmt(r.mndLonn,0) + ' kr'], ['Timelønn med 50 % overtidstillegg', fmt(r.timelonnOvertid,0) + ' kr'], ['Timer per uke', fmt(Number(val('no-timelonn-timer')),1) + ' timer']]); });
    bind('no-aap-btn', function(){ var r = calcAap({inntekt: val('no-aap-inntekt'), barn: val('no-aap-barn')}); setText('no-aap-big', fmt(r.mndBeloep,0) + ' kr/mnd'); setRows('no-aap-rows', [['Årsbeløp', fmt(r.arsbeloep,0) + ' kr'], ['Barnetillegg per måned', fmt(r.barnetilleggMnd,0) + ' kr'], ['Minstesats (25 år+)', fmt(r.minstesats,0) + ' kr/år']]); });
    bind('no-permittering-btn', function(){ var r = calcPermittering({arslonn: val('no-permittering-arslonn'), grad: val('no-permittering-grad')}); setText('no-permittering-big', fmt(r.lonnArbeidsgiverperiode,0) + ' kr fra arbeidsgiver'); setRows('no-permittering-rows', [['Lønn i arbeidsgiverperioden (15 dager)', fmt(r.lonnArbeidsgiverperiode,0) + ' kr'], ['Dagsats fra NAV etterpå', fmt(r.dagsatsNav,0) + ' kr/dag'], ['Dagpenger per måned (ca.)', fmt(r.mndNav,0) + ' kr']]); });
    bind('no-kontantstotte-btn', function(){ var r = calcKontantstotte({timer: val('no-kontantstotte-timer'), barn: val('no-kontantstotte-barn')}); setText('no-kontantstotte-big', fmt(r.totalt,0) + ' kr/mnd'); setRows('no-kontantstotte-rows', [['Sats per barn', fmt(r.satsPerBarn,0) + ' kr/mnd'], ['Antall barn', fmt(Number(val('no-kontantstotte-barn')),0)], ['Utbetaling per måned', fmt(r.totalt,0) + ' kr']]); });
  });
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcDagpenger: calcDagpenger, calcUforetrygd: calcUforetrygd, calcBarnebidrag: calcBarnebidrag, calcTimelonn: calcTimelonn, calcAap: calcAap, calcPermittering: calcPermittering, calcKontantstotte: calcKontantstotte, DEFAULTS: DEFAULTS, fmt: fmt, G: G };
}
