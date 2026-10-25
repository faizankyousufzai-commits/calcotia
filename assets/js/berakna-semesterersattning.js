/* Calcotia – Beräkna semesterersättning (Sverige)
   Regler: semesterlagen (1977:480).
   Procentregeln (16 b §): semesterersättning = semesterlönegrundande lön x 12 %,
   plus 0,48 procentenheter per betald semesterdag över 25.
   Sammalöneregeln (16 a §): semestertillägg 0,43 % av månadslönen per betald dag
   (1,82 % av veckolönen). Vid slutlön används schablonen 4,6 % av månadslönen
   per outtagen dag + semestertillägget – den schablon många kollektivavtal
   använder; vissa avtal använder månadslön/21 i stället. Se sidans förbehåll. */
(function () {
  "use strict";
  var fmt = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });

  function kr(n) { return fmt.format(Math.round(n)) + " kr"; }
  function pct(n) { return String(Math.round(n * 100) / 100).replace(".", ",") + " %"; }
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
    var boks = document.getElementById("se-result");
    if (!boks) return;
    var modusEl = document.getElementById("se-modus");
    var modus = modusEl ? modusEl.value : "procent";

    vis("se-procent-falt", modus === "procent");
    vis("se-manad-falt", modus === "manad");
    vis("se-res-procent", modus === "procent");
    vis("se-res-manad", modus === "manad");
    vis("se-note-procent", modus === "procent");
    vis("se-note-manad", modus === "manad");

    if (modus === "procent") {
      var typEl = document.getElementById("se-inkomst-typ");
      var typ = typEl ? typEl.value : "total";
      vis("se-total-rad", typ === "total");
      vis("se-timlon-rader", typ === "timlon");
      var grund;
      if (typ === "timlon") {
        var timlon = les("se-timlon");
        var timmar = les("se-timmar");
        grund = timlon * timmar;
        sett("se-res-grund", kr(grund));
      } else {
        grund = les("se-total");
        sett("se-res-grund", kr(grund));
      }
      var dagar = les("se-dagar");
      if (grund <= 0 || dagar <= 0) { boks.classList.remove("show"); return; }
      var sats = 12 + Math.max(0, dagar - 25) * 0.48;
      var total = grund * sats / 100;
      sett("se-total", kr(total));
      sett("se-res-sats", pct(sats));
      sett("se-res-total", kr(total));
      sett("se-res-per-dag", kr(total / dagar));
    } else {
      var manad = les("se-manadslon");
      var outtagna = les("se-outtagna");
      if (manad <= 0 || outtagna <= 0) { boks.classList.remove("show"); return; }
      var dagvarde = manad * 0.046;
      var tillagg = manad * 0.0043;
      var perDag = dagvarde + tillagg;
      var totalM = perDag * outtagna;
      sett("se-total", kr(totalM));
      sett("se-res-manadslon", kr(manad));
      sett("se-res-dagvarde", kr(dagvarde));
      sett("se-res-tillagg", kr(tillagg));
      sett("se-res-per-dag-m", kr(perDag));
      sett("se-res-outtagna", String(outtagna));
      sett("se-res-total-m", kr(totalM));
    }
    boks.classList.add("show");
  }

  ["se-modus", "se-inkomst-typ", "se-total", "se-timlon", "se-timmar", "se-dagar", "se-manadslon", "se-outtagna"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", beregn);
      el.addEventListener("change", beregn);
    }
  });
  var knapp = document.getElementById("se-btn");
  if (knapp) knapp.addEventListener("click", beregn);
  beregn();
})();
