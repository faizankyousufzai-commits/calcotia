// Calcotia NO — Helse cluster engine (Calcilo implant, 2026-11-06)
// Pure functions + DOM binding (guarded) + module.exports for Node tests.
// Sources: WHO (BMI/iso-BMI), Helsedirektoratet, Widmark, IFCC/NGSP HbA1c,
// Mifflin-St Jeor, HUNT (NTNU)/Tanaka, US Navy, eSnurra (283 dager).
'use strict';
function round2(x){ return Math.round(x*100)/100; }
function fmt(n, d){ d = (d===undefined?2:d); return Number(n).toLocaleString('nb-NO',{minimumFractionDigits:d, maximumFractionDigits:d}); }

function calcBMI(o){
  var h = Number(o.hoydeCm)/100, w = Number(o.vektKg);
  var bmi = w/(h*h);
  var kat = bmi < 18.5 ? 'Undervekt' : bmi < 25 ? 'Normalvekt' : bmi < 30 ? 'Overvekt' : 'Fedme';
  var lo = 18.5*h*h, hi = 24.9*h*h;
  return { bmi: round2(bmi), kategori: kat, normalvektFra: round2(lo), normalvektTil: round2(hi) };
}
function calcPromille(o){
  var r = (o.kjonn === 'kvinne') ? 0.55 : 0.68;
  var gram = Number(o.enheter) * 12; // 1 enhet = 12 g ren alkohol
  var topp = gram / (Number(o.vektKg) * r); // promille ved toppen
  var naa = Math.max(0, topp - 0.15 * Number(o.timer));
  var til02 = naa > 0.2 ? (naa - 0.2) / 0.15 : 0;
  var til00 = naa / 0.15;
  return { promilleTopp: round2(topp), promilleNaa: round2(naa), timerTil02: round2(til02), timerTil00: round2(til00) };
}
function calcHbA1c(o){
  var mmol = Number(o.mmol), pct;
  if (o.mmol !== undefined && o.mmol !== null && o.mmol !== '' && (o.prosent === undefined || o.prosent === '')) {
    pct = 0.09148 * mmol + 2.152;
  } else {
    pct = Number(o.prosent); mmol = (pct - 2.152) / 0.09148;
  }
  var eag = 1.59 * pct - 2.59;
  var vurdering = mmol < 42 ? 'Normal (under 42 mmol/mol)' : mmol < 48 ? 'Prediabetes (42–47 mmol/mol)' : 'Diabetes (48 mmol/mol eller over)';
  return { mmol: round2(mmol), prosent: round2(pct), eag: round2(eag), vurdering: vurdering };
}
function calcKalori(o){
  var w = Number(o.vektKg), h = Number(o.hoydeCm), a = Number(o.alder);
  var bmr = o.kjonn === 'kvinne' ? 10*w + 6.25*h - 5*a - 161 : 10*w + 6.25*h - 5*a + 5;
  var f = { '1.2': 1.2, '1.375': 1.375, '1.55': 1.55, '1.725': 1.725, '1.9': 1.9 }[String(o.aktivitet)] || 1.55;
  return { bmr: Math.round(bmr), tdee: Math.round(bmr * f), faktor: f };
}
function calcGraviditet(o, idag){
  var siste = new Date(o.sisteMens + 'T00:00:00');
  var termin = new Date(siste); termin.setDate(termin.getDate() + 283);
  var now = idag ? new Date(idag + 'T00:00:00') : new Date();
  var dager = Math.floor((now - siste) / 86400000);
  var uke = Math.max(0, Math.floor(dager / 7));
  var dag = Math.max(0, dager % 7);
  var trimester = uke < 13 ? 1 : uke < 28 ? 2 : 3;
  var igjen = Math.max(0, Math.ceil((termin - now) / 86400000));
  function iso(d){ return d.toISOString().slice(0,10); }
  return { termindato: iso(termin), uke: uke, dag: dag, trimester: trimester, dagerIgjen: igjen };
}
function calcMakspuls(o){
  var a = Number(o.alder);
  var hunt = 211 - 0.64 * a, tanaka = 208 - 0.7 * a, klassisk = 220 - a;
  var hvile = Number(o.hvilepuls) || 60;
  function sone(p1, p2){ return Math.round(hunt*p1) + '–' + Math.round(hunt*p2) + ' slag/min'; }
  return { hunt: round2(hunt), tanaka: round2(tanaka), klassisk: klassisk,
    i1: sone(0.55,0.72), i2: sone(0.72,0.82), i3: sone(0.82,0.87), i4: sone(0.87,0.92), i5: sone(0.92,0.97),
    karvonen: Math.round(((hunt - hvile) * 0.7) + hvile) };
}
function calcFettprosent(o){
  var h = Number(o.hoydeCm), midje = Number(o.midje), hals = Number(o.hals);
  var v;
  if (o.kjonn === 'kvinne') {
    var hofte = Number(o.hofte);
    v = 495 / (1.29579 - 0.35004 * Math.log10(midje + hofte - hals) + 0.22100 * Math.log10(h)) - 450;
  } else {
    v = 495 / (1.0324 - 0.19077 * Math.log10(midje - hals) + 0.15456 * Math.log10(h)) - 450;
  }
  var fettKg = Number(o.vektKg) * v / 100;
  return { fettprosent: round2(v), fettKg: round2(fettKg), muskelKg: round2(Number(o.vektKg) - fettKg) };
}
function calcMensen(o, idag){
  var siste = new Date(o.sisteMens + 'T00:00:00');
  var len = Number(o.sykluslengde) || 28;
  function add(d, n){ var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function iso(d){ return d.toISOString().slice(0,10); }
  var neste = add(siste, len);
  var egglosning = add(neste, -14);
  var now = idag ? new Date(idag + 'T00:00:00') : new Date();
  var syklusdag = Math.max(1, Math.floor((now - siste) / 86400000) % len + 1);
  return { nesteMensen: iso(neste), egglosning: iso(egglosning),
    fruktbartFra: iso(add(egglosning, -5)), fruktbartTil: iso(add(egglosning, 1)),
    syklusdag: syklusdag, neste2: iso(add(neste, len)), neste3: iso(add(neste, 2*len)) };
}

var DEFAULTS = {
  bmi: { hoydeCm: 175, vektKg: 78, alder: 35, kjonn: 'mann' },
  promille: { kjonn: 'mann', vektKg: 80, enheter: 4, timer: 2 },
  hba1c: { mmol: 48 },
  kalori: { kjonn: 'kvinne', alder: 35, hoydeCm: 168, vektKg: 65, aktivitet: '1.55' },
  graviditet: { sisteMens: '2026-01-01' },
  makspuls: { alder: 40, hvilepuls: 60 },
  fettprosent: { kjonn: 'mann', midje: 90, hals: 40, hoydeCm: 180, vektKg: 85 },
  mensen: { sisteMens: '2026-10-20', sykluslengde: 28 }
};

if (typeof document !== 'undefined') {
  function val(id){ var el = document.getElementById(id); return el ? el.value : ''; }
  function setText(id, t){ var el = document.getElementById(id); if (el) el.textContent = t; }
  function setRows(id, rows){ var el = document.getElementById(id); if (el) el.innerHTML = rows.map(function(r){ return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join(''); }
  function bind(btnId, fn){ var b = document.getElementById(btnId); if (b) b.addEventListener('click', fn); ['input','change'].forEach(function(ev){ document.querySelectorAll('#' + btnId.replace('-btn','-form') + ' input, #' + btnId.replace('-btn','-form') + ' select').forEach(function(el){ el.addEventListener(ev, fn); }); }); }
  document.addEventListener('DOMContentLoaded', function(){
    bind('no-bmi-btn', function(){ var r = calcBMI({hoydeCm: val('no-bmi-hoyde'), vektKg: val('no-bmi-vekt'), alder: val('no-bmi-alder'), kjonn: val('no-bmi-kjonn')}); setText('no-bmi-big', fmt(r.bmi) + ' BMI'); setRows('no-bmi-rows', [['Kategori', r.kategori], ['Normalvekt for din høyde', fmt(r.normalvektFra,1) + '–' + fmt(r.normalvektTil,1) + ' kg'], ['Din vekt', fmt(Number(val('no-bmi-vekt')),1) + ' kg']]); });
    bind('no-promille-btn', function(){ var r = calcPromille({kjonn: val('no-promille-kjonn'), vektKg: val('no-promille-vekt'), enheter: val('no-promille-enheter'), timer: val('no-promille-timer')}); setText('no-promille-big', fmt(r.promilleNaa) + ' ‰'); setRows('no-promille-rows', [['Promille på det høyeste', fmt(r.promilleTopp) + ' ‰'], ['Timer til under 0,2 ‰', fmt(r.timerTil02,1) + ' timer'], ['Timer til 0,0 ‰', fmt(r.timerTil00,1) + ' timer']]); });
    bind('no-hba1c-btn', function(){ var r = calcHbA1c({mmol: val('no-hba1c-mmol')}); setText('no-hba1c-big', fmt(r.prosent) + ' %'); setRows('no-hba1c-rows', [['HbA1c i mmol/mol', fmt(r.mmol,0) + ' mmol/mol'], ['Estimert gjennomsnittlig blodsukker', fmt(r.eag,1) + ' mmol/l'], ['Vurdering', r.vurdering]]); });
    bind('no-kalori-btn', function(){ var r = calcKalori({kjonn: val('no-kalori-kjonn'), alder: val('no-kalori-alder'), hoydeCm: val('no-kalori-hoyde'), vektKg: val('no-kalori-vekt'), aktivitet: val('no-kalori-aktivitet')}); setText('no-kalori-big', fmt(r.tdee,0) + ' kcal/dag'); setRows('no-kalori-rows', [['Hvileforbrenning (BMR)', fmt(r.bmr,0) + ' kcal/dag'], ['Totalt energibehov (TDEE)', fmt(r.tdee,0) + ' kcal/dag'], ['Aktivitetsfaktor', String(r.faktor).replace('.', ',')]]); });
    bind('no-graviditet-btn', function(){ var r = calcGraviditet({sisteMens: val('no-graviditet-siste')}); setText('no-graviditet-big', r.termindato); setRows('no-graviditet-rows', [['Svangerskapsuke', 'Uke ' + r.uke + ' + ' + r.dag], ['Trimester', String(r.trimester) + '. trimester'], ['Dager igjen til termin', fmt(r.dagerIgjen,0) + ' dager']]); });
    bind('no-makspuls-btn', function(){ var r = calcMakspuls({alder: val('no-makspuls-alder'), hvilepuls: val('no-makspuls-hvile')}); setText('no-makspuls-big', fmt(r.hunt,1) + ' slag/min'); setRows('no-makspuls-rows', [['HUNT-formelen (NTNU)', fmt(r.hunt,1) + ' slag/min'], ['Tanaka', fmt(r.tanaka,1) + ' slag/min'], ['220 minus alder', fmt(r.klassisk,0) + ' slag/min'], ['Sone I1 (rolig)', r.i1], ['Sone I3 (terskel)', r.i3], ['Sone I5 (maksimal)', r.i5]]); });
    bind('no-fettprosent-btn', function(){ var r = calcFettprosent({kjonn: val('no-fettprosent-kjonn'), midje: val('no-fettprosent-midje'), hals: val('no-fettprosent-hals'), hofte: val('no-fettprosent-hofte'), hoydeCm: val('no-fettprosent-hoyde'), vektKg: val('no-fettprosent-vekt')}); setText('no-fettprosent-big', fmt(r.fettprosent) + ' %'); setRows('no-fettprosent-rows', [['Fettmasse', fmt(r.fettKg,1) + ' kg'], ['Fettfri masse', fmt(r.muskelKg,1) + ' kg'], ['Metode', 'US Navy-metoden']]); });
    bind('no-mensen-btn', function(){ var r = calcMensen({sisteMens: val('no-mensen-siste'), sykluslengde: val('no-mensen-syklus')}); setText('no-mensen-big', r.nesteMensen); setRows('no-mensen-rows', [['Eggløsning', r.egglosning], ['Fruktbart vindu', r.fruktbartFra + ' til ' + r.fruktbartTil], ['Syklusdag i dag', String(r.syklusdag)], ['Mensen etter det', r.neste2]]); });
  });
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcBMI: calcBMI, calcPromille: calcPromille, calcHbA1c: calcHbA1c, calcKalori: calcKalori, calcGraviditet: calcGraviditet, calcMakspuls: calcMakspuls, calcFettprosent: calcFettprosent, calcMensen: calcMensen, DEFAULTS: DEFAULTS, fmt: fmt };
}
