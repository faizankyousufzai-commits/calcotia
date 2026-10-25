/* Calcotia – Orlofsreiknivél (Iceland)
   Rules: Holiday Allowance Act No. 30/1987 (lög um orlof nr. 30/1987).
   Minimum 24 weekdays of paid holiday per year, accrual 2 days per month
   worked during the holiday year 1 May – 30 April. Holiday pay (orlofslaun
   / orlofsfé) is a percentage of all wages in the holiday year:
   24 days = 10.17%, 25 days = 10.64% (5 years in the same line of work),
   27 days = 11.59% (5 years with the same employer),
   30 days = 13.04% (10 years with the same employer).
   Overtime and bonuses count in the wage base. Payment: withheld and paid
   when leave is taken in the following leave year, or from the
   orlofsreikningur account (accessible after 15 May for the past holiday
   year), or monthly on top of wages. Orlofsuppbót (summer bonus, paid in
   June) and desemberuppbót (December bonus, paid in December) are paid
   when the worker was employed at the end of April / beginning of May
   (summer) or in the first week of December (December), or worked 12
   consecutive weeks during the holiday year. Bonus amounts are set by
   collective agreement, so this calculator checks eligibility only. */
(function () {
  "use strict";
  var fmtISK = new Intl.NumberFormat("is-IS", { style: "currency", currency: "ISK", maximumFractionDigits: 0 });
  var fmtNum = new Intl.NumberFormat("is-IS", { maximumFractionDigits: 2 });

  function isk(n) { return fmtISK.format(Math.round(n)); }
  function num(n) { return fmtNum.format(Math.round(n * 100) / 100); }
  function les(id) {
    var el = document.getElementById(id);
    if (!el) return 0;
    var v = parseFloat(String(el.value).replace(/\./g, "").replace(/,/g, ".").replace("kr", ""));
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

  var PROSENT = { "24": 10.17, "25": 10.64, "27": 11.59, "30": 13.04 };

  function beregn() {
    var boks = document.getElementById("is-result");
    if (!boks) return;
    var modusEl = document.getElementById("is-modus");
    var modus = modusEl ? modusEl.value : "laun";

    vis("is-laun-falt", modus === "laun");
    vis("is-uppbot-falt", modus === "uppbot");
    vis("is-res-laun", modus === "laun");
    vis("is-res-uppbot", modus === "uppbot");
    vis("is-note-laun", modus === "laun");
    vis("is-note-uppbot", modus === "uppbot");

    if (modus === "laun") {
      var laun = les("is-laun");
      var tierEl = document.getElementById("is-tier");
      var tier = tierEl ? tierEl.value : "24";
      var manudir = les("is-manudir");
      if (laun <= 0) { boks.classList.remove("show"); return; }
      var pr = PROSENT[tier] || 10.17;
      var total = laun * pr / 100;
      var dagar = parseInt(tier, 10);
      var avinnir = Math.min(manudir * 2, 24);
      sett("is-total", isk(total));
      sett("is-res-prosent", num(pr) + " %");
      sett("is-res-total", isk(total));
      sett("is-res-per-dag", isk(total / dagar));
      sett("is-res-avinnir", num(avinnir) + " dagar");
      sett("is-res-tier", num(dagar) + " dagar");
    } else {
      var vorEl = document.getElementById("is-vor");
      var vor = vorEl ? vorEl.checked : false;
      var desEl = document.getElementById("is-des");
      var des = desEl ? desEl.checked : false;
      var vikur = les("is-vikur");
      var sumar = vor || vikur >= 12;
      var desember = des || vikur >= 12;
      sett("is-total", sumar && desember ? "Já, bæði" : (sumar || desember ? "Já, annað" : "Nei"));
      sett("is-res-sumar", sumar ? "Já, þú átt rétt á orlofsuppbót" : "Nei, þú uppfyllir ekki skilyrðin");
      sett("is-res-desember", desember ? "Já, þú átt rétt á desemberuppbót" : "Nei, þú uppfyllir ekki skilyrðin");
      sett("is-res-astada", (vor ? "Starfandi í lok apríl / byrjun maí. " : "") + (des ? "Starfandi fyrstu vikuna í desember. " : "") + num(vikur) + " samfelldar vikur.");
    }
    boks.classList.add("show");
  }

  ["is-modus", "is-laun", "is-tier", "is-manudir", "is-vor", "is-des", "is-vikur"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", beregn);
      el.addEventListener("change", beregn);
    }
  });
  var knapp = document.getElementById("is-btn");
  if (knapp) knapp.addEventListener("click", beregn);
  beregn();
})();
