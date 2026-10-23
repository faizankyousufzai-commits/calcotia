/* Calcotia – Feriepenger kalkulator (Norge)
   Regler: ferieloven § 10. Feriepenger = feriepengegrunnlag x sats / 100.
   Estimat for juniutbetaling: feriepenger + manedslonn - ferietrekk,
   der ferietrekk = (manedslonn x 12 / 260) x antall feriedager (virkedager).
   Juniestimatet er veiledende og varierer fra arbeidsgiver til arbeidsgiver. */
(function () {
  "use strict";
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
  function vis(id, vises) {
    var el = document.getElementById(id);
    if (el) el.hidden = !vises;
  }

  function beregn() {
    var boks = document.getElementById("fp-result");
    if (!boks) return;
    var grunnlag = les("fp-grunnlag");
    var satsEl = document.getElementById("fp-sats");
    var sats = satsEl ? parseFloat(satsEl.value) : 10.2;
    var mnd = les("fp-lonn");
    var dager = les("fp-dager");
    if (grunnlag <= 0 || isNaN(sats)) { boks.classList.remove("show"); return; }

    var feriepenger = grunnlag * sats / 100;
    sett("fp-total", kr(feriepenger));
    sett("fp-res-grunnlag", kr(grunnlag));
    sett("fp-res-sats", String(sats).replace(".", ",") + " %");
    sett("fp-res-brutto", kr(feriepenger));

    var harJuni = mnd > 0 && dager > 0;
    vis("fp-juni-rader", harJuni);
    if (harJuni) {
      var trekk = (mnd * 12 / 260) * dager;
      var juni = feriepenger + mnd - trekk;
      sett("fp-res-trekk", kr(trekk));
      sett("fp-res-lonn", kr(mnd));
      sett("fp-res-juni", kr(juni));
    }
    boks.classList.add("show");
  }

  ["fp-grunnlag", "fp-lonn", "fp-dager", "fp-sats"].forEach(function (id) {
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
