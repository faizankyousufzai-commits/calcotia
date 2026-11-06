// Calcotia NO — Annet cluster engine (Calcilo implant, 2026-11-06)
// Fartsbøter: forskrift om forenklet forelegg i vegtrafikksaker § 1 nr. 1,
// satser fra 15. februar 2026 (Lovdata FOR-2026-02-06-147).
// Karaktersnitt: Samordna opptak — skolepoeng = karaktersnitt x 10.
// BH-størrelse: EU-bånd = underbyst avrundet til nærmeste 5 cm.
'use strict';
function round2(x){ return Math.round(x*100)/100; }
function fmt(n, d){ d = (d===undefined?2:d); return Number(n).toLocaleString('nb-NO',{minimumFractionDigits:d, maximumFractionDigits:d}); }

function calcDekk(o){
  function dia(b, p, f){ var side = b*p/100; return { diameter: round2((f*25.4 + 2*side)/10), omkrets: round2(Math.PI*(f*25.4 + 2*side)/10), sidevegg: round2(side/10) }; }
  var a = dia(Number(o.bredde1), Number(o.profil1), Number(o.felg1));
  var b = dia(Number(o.bredde2), Number(o.profil2), Number(o.felg2));
  var diff = round2((b.diameter - a.diameter)/a.diameter*100);
  return { dia1: a.diameter, dia2: b.diameter, omkrets1: a.omkrets, omkrets2: b.omkrets, diffPct: diff, fartVed100: round2(100*(1+diff/100)) };
}
var FARTS_LOW = [[5,1250,0],[10,3350,0],[15,5950,2],[20,8650,3],[25,13450,3]];
var FARTS_HIGH = [[5,1250,0],[10,3350,0],[15,5350,0],[20,7450,2],[25,10100,3],[30,13450,3],[35,16050,3],[40,16700,3]];
function calcFartsbot(o){
  var grense = Number(o.grense), fart = Number(o.fart), over = fart - grense;
  if (over <= 0) return { over: over, bot: 0, prikker: 0, type: 'Ingen overtredelse' };
  var tab = grense <= 60 ? FARTS_LOW : (grense >= 90 ? FARTS_HIGH : FARTS_HIGH.slice(0, 7)); // 16 700-kr tier (36–40 over) gjelder kun motorvei med grense 90+
  for (var i=0;i<tab.length;i++){
    if (over <= tab[i][0]) return { over: over, bot: tab[i][1], prikker: tab[i][2], type: 'Forenklet forelegg' };
  }
  return { over: over, bot: null, prikker: 3, type: 'Anmeldelse — ingen forenklet forelegg, risiko for tap av førerrett' };
}
function calcKaraktersnitt(o){
  var snitt = Number(o.snitt);
  var skolepoeng = round2(snitt*10);
  var konkurranse = round2(skolepoeng + (Number(o.realfag)||0) + (Number(o.tillegg)||0) + (Number(o.alder)||0));
  return { snitt: snitt, skolepoeng: skolepoeng, konkurransepoeng: konkurranse };
}
function calcBhStorrelse(o){
  var under = Number(o.underbyst), over = Number(o.overbyst);
  var band = Math.round(under/5)*5;
  var diff = over - under;
  var cups = ['AA','A','B','C','D','E','F','G','H'];
  var idx = diff < 12 ? 0 : Math.min(8, Math.floor((diff-12)/2)+1);
  var cup = cups[idx];
  var ukBand = Math.round((under/2.54)/2)*2;
  return { eu: band + cup, uk: ukBand + cup, band: band, cup: cup, soster1: (band-5) + cups[Math.min(8, idx+1)], soster2: (band+5) + cups[Math.max(0, idx-1)] };
}
function calcDrivstoff(o){
  var dist = Number(o.distanse) * (o.turRetur === 'ja' ? 2 : 1);
  var forbruk = Number(o.forbruk); // liter per mil
  var liter = dist/10*forbruk;
  var kostnad = liter*Number(o.pris);
  return { distanse: dist, liter: round2(liter), kostnad: round2(kostnad), perMil: round2(forbruk*Number(o.pris)) };
}

var DEFAULTS = {
  dekk: { bredde1: 205, profil1: 55, felg1: 16, bredde2: 225, profil2: 45, felg2: 17 },
  fartsbot: { grense: 50, fart: 64 },
  karaktersnitt: { snitt: 4.5, realfag: 2, tillegg: 0, alder: 2 },
  bhStorrelse: { underbyst: 78, overbyst: 93 },
  drivstoff: { distanse: 300, forbruk: 0.7, pris: 21, turRetur: 'nei' }
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
    bind('no-dekk-btn', function(){ var r = calcDekk({bredde1: val('no-dekk-b1'), profil1: val('no-dekk-p1'), felg1: val('no-dekk-f1'), bredde2: val('no-dekk-b2'), profil2: val('no-dekk-p2'), felg2: val('no-dekk-f2')}); setText('no-dekk-big', fmt(r.diffPct) + ' % diameterforskjell'); setRows('no-dekk-rows', [['Diameter gammelt dekk', fmt(r.dia1,1) + ' cm'], ['Diameter nytt dekk', fmt(r.dia2,1) + ' cm'], ['Rulleomkrets ny', fmt(r.omkrets2,1) + ' cm'], ['Fartsmåler viser 100, du kjører', fmt(r.fartVed100,1) + ' km/t']]); });
    bind('no-fartsbot-btn', function(){ var r = calcFartsbot({grense: val('no-fartsbot-grense'), fart: val('no-fartsbot-fart')}); setText('no-fartsbot-big', r.bot === null ? 'Anmeldelse' : fmt(r.bot,0) + ' kr'); setRows('no-fartsbot-rows', [['Km/t over grensen', fmt(r.over,0) + ' km/t'], ['Prikker', fmt(r.prikker,0)], ['Type reaksjon', r.type]]); });
    bind('no-karaktersnitt-btn', function(){ var r = calcKaraktersnitt({snitt: val('no-karaktersnitt-snitt'), realfag: val('no-karaktersnitt-realfag'), tillegg: val('no-karaktersnitt-tillegg'), alder: val('no-karaktersnitt-alder')}); setText('no-karaktersnitt-big', fmt(r.konkurransepoeng,1) + ' konkurransepoeng'); setRows('no-karaktersnitt-rows', [['Karaktersnitt', fmt(r.snitt,2)], ['Skolepoeng (snitt × 10)', fmt(r.skolepoeng,1)], ['Konkurransepoeng totalt', fmt(r.konkurransepoeng,1)]]); });
    bind('no-bh-btn', function(){ var r = calcBhStorrelse({underbyst: val('no-bh-under'), overbyst: val('no-bh-over')}); setText('no-bh-big', r.eu); setRows('no-bh-rows', [['Britisk størrelse', r.uk], ['Båndvidde', fmt(r.band,0) + ' cm'], ['Cupstørrelse', r.cup], ['Søsterstørrelser', r.soster1 + ' eller ' + r.soster2]]); });
    bind('no-drivstoff-btn', function(){ var r = calcDrivstoff({distanse: val('no-drivstoff-distanse'), forbruk: val('no-drivstoff-forbruk'), pris: val('no-drivstoff-pris'), turRetur: val('no-drivstoff-tur')}); setText('no-drivstoff-big', fmt(r.kostnad,0) + ' kr'); setRows('no-drivstoff-rows', [['Distanse', fmt(r.distanse,0) + ' km'], ['Drivstoff', fmt(r.liter,1) + ' liter'], ['Kostnad per mil', fmt(r.perMil,0) + ' kr']]); });
  });
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calcDekk: calcDekk, calcFartsbot: calcFartsbot, calcKaraktersnitt: calcKaraktersnitt, calcBhStorrelse: calcBhStorrelse, calcDrivstoff: calcDrivstoff, DEFAULTS: DEFAULTS, fmt: fmt };
}
