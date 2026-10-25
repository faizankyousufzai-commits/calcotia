/* Calcotia – Holiday Pay Calculator Ireland
   Rules: Organisation of Working Time Act 1997, section 19 (annual leave)
   and sections 21-22 (public holidays).
   Annual leave, greatest of: (a) 4 working weeks if >= 1,365 hours in the
   leave year (not if employment changed during that year); (b) 1/3 working
   week per month with >= 117 hours; (c) 8% of hours worked in the leave
   year, capped at 4 working weeks. Working week = days usually worked.
   Holiday pay = normal weekly rate; variable pay = 13-week average
   (weekly pay is an input here, so no averaging is done in code).
   Public holidays: 10 per year. Full-time employees qualify immediately;
   part-time employees qualify if they worked >= 40 hours in the 5 weeks
   ending the day before the holiday. Benefit (employer's choice): paid day
   off on the day, paid day off within a month, extra day's annual leave,
   or extra day's pay. If the holiday falls on a day not normally worked,
   the value is 1/5 of the normal weekly wage. */
(function () {
  "use strict";
  var fmtEUR = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  var fmtNum = new Intl.NumberFormat("en-IE", { maximumFractionDigits: 2 });

  function eur(n) { return fmtEUR.format(Math.round(n)); }
  function num(n) { return fmtNum.format(Math.round(n * 100) / 100); }
  function les(id) {
    var el = document.getElementById(id);
    if (!el) return 0;
    var v = parseFloat(String(el.value).replace(/,/g, "").replace("€", ""));
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
    var boks = document.getElementById("ie-result");
    if (!boks) return;
    var modusEl = document.getElementById("ie-modus");
    var modus = modusEl ? modusEl.value : "annual";

    vis("ie-annual-falt", modus === "annual");
    vis("ie-public-falt", modus === "public");
    vis("ie-res-annual", modus === "annual");
    vis("ie-res-public", modus === "public");
    vis("ie-note-annual", modus === "annual");
    vis("ie-note-public", modus === "public");

    if (modus === "annual") {
      var timmar = les("ie-timmar");
      var manader = les("ie-manader");
      var dagarVecka = les("ie-dagar");
      var timmarDag = les("ie-timmar-dag");
      var lon = les("ie-lon");
      var byteEl = document.getElementById("ie-byte");
      var bytt = byteEl ? byteEl.checked : false;
      if (timmar <= 0 || dagarVecka <= 0 || timmarDag <= 0 || lon <= 0) { boks.classList.remove("show"); return; }
      var veckoTimmar = dagarVecka * timmarDag;
      var a = (!bytt && timmar >= 1365) ? 4 : null;
      var b = Math.min(manader / 3, 4);
      var c = Math.min(0.08 * timmar / veckoTimmar, 4);
      var kandidater = [b, c];
      if (a !== null) kandidater.push(a);
      var best = Math.max.apply(null, kandidater);
      sett("ie-total", eur(best * lon));
      sett("ie-res-a", a === null ? "Not available" : num(a) + " weeks (" + num(a * dagarVecka) + " days)");
      sett("ie-res-b", num(b) + " weeks (" + num(b * dagarVecka) + " days)");
      sett("ie-res-c", num(c) + " weeks (" + num(c * dagarVecka) + " days)");
      sett("ie-res-best", num(best) + " weeks (" + num(best * dagarVecka) + " days)");
      sett("ie-res-pay", eur(best * lon));
      sett("ie-res-note-a", a === null ? "Method A needs 1,365 hours and does not apply if you changed employment during the leave year." : "Method A applies: 1,365 hours or more in the leave year.");
    } else {
      var typEl = document.getElementById("ie-typ");
      var typ = typEl ? typEl.value : "full";
      var timmar5 = les("ie-timmar5");
      var dagar2 = les("ie-dagar2");
      var lon2 = les("ie-lon2");
      var arbEl = document.getElementById("ie-arbetade");
      var arbetade = arbEl ? arbEl.value : "no";
      if (dagar2 <= 0 || lon2 <= 0) { boks.classList.remove("show"); return; }
      var kval = (typ === "full") || (timmar5 >= 40);
      vis("ie-res-ph-yes", kval);
      vis("ie-res-ph-no", !kval);
      if (!kval) {
        sett("ie-total", "No entitlement");
      } else {
        var daglon = lon2 / dagar2;
        var femtedel = lon2 / 5;
        sett("ie-total", eur(daglon));
        sett("ie-res-daglon", eur(daglon));
        sett("ie-res-femtedel", eur(femtedel));
        sett("ie-res-options", arbetade === "yes"
          ? "Paid day off within a month, an extra day of annual leave, or an extra day's pay (your employer chooses). Your normal pay for the hours worked is separate."
          : "Paid day off on the day, paid day off within a month, an extra day of annual leave, or an extra day's pay (your employer chooses).");
      }
    }
    boks.classList.add("show");
  }

  ["ie-modus", "ie-timmar", "ie-manader", "ie-dagar", "ie-timmar-dag", "ie-lon", "ie-byte", "ie-typ", "ie-timmar5", "ie-dagar2", "ie-lon2", "ie-arbetade"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", beregn);
      el.addEventListener("change", beregn);
    }
  });
  var knapp = document.getElementById("ie-btn");
  if (knapp) knapp.addEventListener("click", beregn);
  beregn();
})();
