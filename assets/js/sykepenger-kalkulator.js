/* Calcotia – Sykepenger kalkulator (Norge)
   Regler: folketrygdloven kapittel 8. Grunnbelopet (G) fra 1. mai 2026 = 136 549 kr.
   Sykepengegrunnlag = manedsinntekt x 12, maks 6 G. Dagsats = grunnlag / 260.
   Arbeidsgiver betaler de forste 16 kalenderdagene, NAV resten (maks 248 virkedager).
   NAV betaler feriepenger med 10,2 % av sykepengene for de forste 48 sykepengedagene. */
(function () {
  "use strict";
  var G = 136549;
  var TAK = 6 * G; // 819 294 kr
  var fmt = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 });

  function kr(n) { return fmt.format(Math.round(n)) + " kr"; }
  function les(id) {
    var el = document.getElementById(id);
    if (!el) return 0;
    var v = parseFloat(String(el.value).replace(/\s/g, "").replace(",", "."));
    return isNaN(v) || v < 0 ? 0 : v;
  }
  function sett(id, tekst) {
    var el = document.getElementById(id);
    if (el) el.textContent = tekst;
  }

  function beregn() {
    var boks = document.getElementById("sp-result");
    if (!boks) return;
    var mnd = les("sp-lonn");
    var dager = Math.floor(les("sp-dager"));
    if (mnd <= 0 || dager <= 0) { boks.classList.remove("show"); return; }

    var arsinntekt = mnd * 12;
    var grunnlag = Math.min(arsinntekt, TAK);
    var dagsats = grunnlag / 260;

    var agKalender = Math.min(dager, 16);
    var agVirke = Math.round(agKalender * 5 / 7);
    var navKalender = Math.max(dager - 16, 0);
    var navVirke = Math.min(Math.round(navKalender * 5 / 7), 248);

    var agBelop = agVirke * dagsats;
    var navBelop = navVirke * dagsats;
    var totalt = agBelop + navBelop;
    var ferieBelop = Math.min(navVirke, 48) * dagsats * 0.102;

    sett("sp-total", kr(totalt));
    sett("sp-grunnlag", kr(grunnlag));
    sett("sp-dagsats", kr(dagsats));
    sett("sp-ag", kr(agBelop) + " (" + agVirke + " virkedager)");
    sett("sp-nav", kr(navBelop) + " (" + navVirke + " virkedager)");
    sett("sp-ferie", kr(ferieBelop));

    var notat = document.getElementById("sp-notat");
    if (notat) {
      var tekst = "";
      if (arsinntekt > TAK) {
        tekst = "Merk: Inntekt over 6 G (" + kr(TAK) + ") tas ikke med i grunnlaget, så dagsatsen er regnet av taket.";
      } else if (navVirke >= 248) {
        tekst = "Merk: Du har nådd grensen på 248 sykepengedager fra NAV i løpet av tre år.";
      }
      notat.textContent = tekst;
      notat.hidden = tekst === "";
    }
    boks.classList.add("show");
  }

  ["sp-lonn", "sp-dager"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", beregn);
      el.addEventListener("change", beregn);
    }
  });
  var knapp = document.getElementById("sp-btn");
  if (knapp) knapp.addEventListener("click", beregn);
  beregn();
})();
