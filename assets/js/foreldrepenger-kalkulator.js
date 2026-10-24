/* Calcotia – Foreldrepenger kalkulator (Norge)
   Regler: folketrygdloven kapittel 14. Grunnbelopet (G) fra 1. mai 2026 = 136 549 kr.
   Beregningsgrunnlaget er arsinntekten, maks 6 G = 819 294 kr.
   Dagsats = grunnlag x dekningsgrad / 260. Fem stonadsdager = en uke.
   Full sats (100 %): 245 dager = 15 for fodsel (mor) + 75 modrekvote + 75 fedrekvote + 80 fellesperiode.
   Redusert sats (80 %): 306 dager = 15 for fodsel + 95 + 95 + 101 fellesperiode.
   Tvillinger/to barn samtidig: +85 dager (100 %) eller +106 dager (80 %), lagt til fellesperioden. */
(function () {
  "use strict";
  var G = 136549;
  var TAK = 6 * G; // 819 294 kr
  var MIN = G / 2; // 0,5 G = 68 274,50 kr
  var fmt = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 });

  function kr(n) { return fmt.format(Math.round(n)) + " kr"; }
  function les(id) {
    var el = document.getElementById(id);
    if (!el) return 0;
    var v = parseFloat(String(el.value).replace(/\s/g, "").replace(",", "."));
    return isNaN(v) || v < 0 ? 0 : v;
  }
  function lesValg(id) {
    var el = document.getElementById(id);
    return el ? String(el.value) : "";
  }
  function sett(id, tekst) {
    var el = document.getElementById(id);
    if (el) el.textContent = tekst;
  }
  function ukerTekst(dager) {
    var uker = Math.floor(dager / 5);
    var rest = dager % 5;
    if (rest === 0) return dager + " stønadsdager (" + uker + " uker)";
    return dager + " stønadsdager (" + uker + " uker + " + rest + (rest === 1 ? " dag" : " dager") + ")";
  }

  function regn(inntektMor, inntektFar, grad, tvillinger, fellesMorProsent) {
    var s = grad === 100
      ? { forFodsel: 15, kvote: 75, felles: 80, tillegg: 85 }
      : { forFodsel: 15, kvote: 95, felles: 101, tillegg: 106 };
    var felles = s.felles + (tvillinger ? s.tillegg : 0);
    var grunnlagMor = Math.min(inntektMor, TAK);
    var grunnlagFar = Math.min(inntektFar, TAK);
    var dagsatsMor = grunnlagMor * grad / 100 / 260;
    var dagsatsFar = grunnlagFar * grad / 100 / 260;
    var fellesMor = Math.round(felles * fellesMorProsent / 100);
    var fellesFar = felles - fellesMor;
    var mor = {
      forFodselKr: s.forFodsel * dagsatsMor,
      kvoteKr: s.kvote * dagsatsMor,
      fellesDager: fellesMor,
      fellesKr: fellesMor * dagsatsMor,
      dager: s.forFodsel + s.kvote + fellesMor,
      totalt: (s.forFodsel + s.kvote + fellesMor) * dagsatsMor
    };
    var far = {
      kvoteKr: s.kvote * dagsatsFar,
      fellesDager: fellesFar,
      fellesKr: fellesFar * dagsatsFar,
      dager: s.kvote + fellesFar,
      totalt: (s.kvote + fellesFar) * dagsatsFar
    };
    return {
      struktur: s, felles: felles,
      grunnlagMor: grunnlagMor, grunnlagFar: grunnlagFar,
      dagsatsMor: dagsatsMor, dagsatsFar: dagsatsFar,
      mor: mor, far: far,
      dagerTotalt: mor.dager + far.dager,
      totalt: mor.totalt + far.totalt
    };
  }

  function beregn() {
    var boks = document.getElementById("fp-result");
    if (!boks) return;
    var inntektMor = les("fp-mor-lonn");
    var inntektFar = les("fp-far-lonn");
    var grad = parseInt(lesValg("fp-grad"), 10) === 80 ? 80 : 100;
    var tvillinger = lesValg("fp-tvillinger") === "1";
    var fellesMorProsent = les("fp-felles-mor");
    if (fellesMorProsent > 100) fellesMorProsent = 100;
    if (inntektMor <= 0) { boks.classList.remove("show"); return; }

    var r = regn(inntektMor, inntektFar, grad, tvillinger, fellesMorProsent);
    var annenGrad = grad === 100 ? 80 : 100;
    var alt = regn(inntektMor, inntektFar, annenGrad, tvillinger, fellesMorProsent);

    sett("fp-total", kr(r.totalt));
    sett("fp-periode", ukerTekst(r.dagerTotalt));
    sett("fp-grad-res", grad + " % dekningsgrad" + (tvillinger ? ", tvillinger (flerbarnsdager er med)" : ""));
    sett("fp-mor-for", kr(r.mor.forFodselKr));
    sett("fp-mor-kvote", kr(r.mor.kvoteKr));
    sett("fp-mor-felles", kr(r.mor.fellesKr) + " (" + r.mor.fellesDager + " dager)");
    sett("fp-mor-sum", kr(r.mor.totalt) + " (" + r.mor.dager + " dager)");
    sett("fp-far-kvote", kr(r.far.kvoteKr));
    sett("fp-far-felles", kr(r.far.fellesKr) + " (" + r.far.fellesDager + " dager)");
    sett("fp-far-sum", kr(r.far.totalt) + " (" + r.far.dager + " dager)");
    sett("fp-dagsats-mor", kr(r.dagsatsMor));
    sett("fp-dagsats-far", kr(r.dagsatsFar));
    sett("fp-alt", "Til sammenligning: Med " + annenGrad + " % dekningsgrad får dere " +
      kr(alt.totalt) + " fordelt over " + ukerTekst(alt.dagerTotalt) +
      ". Totalbeløpet er nesten det samme, det er lengden på perioden som endrer seg.");

    var notat = document.getElementById("fp-notat");
    if (notat) {
      var merknader = [];
      if (inntektMor > TAK || inntektFar > TAK) {
        merknader.push("Inntekt over 6 G (" + kr(TAK) + ") tas ikke med i grunnlaget. Differansen kan være dekket av arbeidsgiver hvis det følger av avtale eller tariffavtale.");
      }
      if (inntektMor < MIN) {
        merknader.push("Mors inntekt er under minstekravet på 0,5 G (om lag " + kr(MIN) + " i året). Da kan det i stedet være aktuelt med engangsstønad på 92 648 kr.");
      }
      if (inntektFar > 0 && inntektFar < MIN) {
        merknader.push("Far/medmors inntekt er under minstekravet på 0,5 G (om lag " + kr(MIN) + " i året), så far/medmor har trolig ikke egen rett til foreldrepenger.");
      }
      if (inntektFar <= 0) {
        merknader.push("Far/medmor er lagt inn uten inntekt, så bare mors andel er regnet med. Har far/medmor egen inntekt, legg den inn for å se hele bildet.");
      }
      notat.textContent = merknader.join(" ");
      notat.hidden = merknader.length === 0;
    }
    boks.classList.add("show");
  }

  ["fp-mor-lonn", "fp-far-lonn", "fp-grad", "fp-tvillinger", "fp-felles-mor"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", beregn);
      el.addEventListener("change", beregn);
    }
  });
  var knapp = document.getElementById("fp-btn");
  if (knapp) knapp.addEventListener("click", beregn);
  beregn();
})();
