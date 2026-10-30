
// Calcotia - Werkstudent Rechner 2026 (Deutschland) - logic
// Simplified calculation, labelled as an estimate on the page.
// Social deduction = Rentenversicherung ONLY (Werkstudentenprivileg):
//   KV = 0, PV = 0, AV = 0 from payroll.
//   RV monthly: <= 603 EUR: 3.6% of gross (Minijob range, no Befreiung assumed)
//   603.01 to 2000 EUR: BE = (gross - 603) * 2000 / (2000 - 603), RV = 9.3% of BE
//   over 2000 EUR: 9.3% of gross, capped at BBG RV/AV 101400 EUR/year.
// Tax: section 32a EStG 2026 tariff on annual taxable income (same as
// Brutto Netto Rechner). Simplified Vorsorgepauschale = actual RV only.
//   taxable = annual gross - RV annual - 1230 - 36 (unless class 6)
//             - Entlastungsbetrag class II 4260 + 240 per further child (only with children) - ELStAM Freibetrag
// Kinder count is used ONLY for the Soli/Kirchensteuer base
// (Kinderfreibetrag 9756 per child), not for the Lohnsteuer itself.
// Classes: I, II, IV = Grundtarif; III = Splitting; V and VI = tariff
// without Grundfreibetrag (shift by 12348), labelled approximations.
// Class VI also gets no 1230/36 pauschalen.
// Scope: Werkstudenten only. Beamte, Soldat, Rentner, Selbständige,
// duales Studium and separate Minijob/Midijob modes are out of scope.
(function () {
  "use strict";

  var BBG_RVAV = 101400;
  var GRUNDFREIBETRAG = 12348, KINDERFREIBETRAG = 9756;

  function grundtarif(x) {
    x = Math.floor(x);
    if (x <= 12348) return 0;
    if (x <= 17799) {
      var y = (x - 12348) / 10000;
      return Math.floor((914.51 * y + 1400) * y);
    }
    if (x <= 69878) {
      var z = (x - 17799) / 10000;
      return Math.floor((173.10 * z + 2397) * z + 1034.87);
    }
    if (x <= 277825) return Math.floor(0.42 * x - 11135.70);
    return Math.floor(0.45 * x - 19470.45);
  }

  function lohnsteuer(zveBase, klasse) {
    if (klasse === "3") return 2 * grundtarif(zveBase / 2);
    if (klasse === "5" || klasse === "6") return grundtarif(zveBase + GRUNDFREIBETRAG);
    return grundtarif(zveBase);
  }

  function rvMonthly(m) {
    if (m <= 0) return 0;
    if (m <= 603) return m * 0.036;
    if (m <= 2000) {
      var be = (m - 603) * 2000 / (2000 - 603);
      return be * 0.093;
    }
    return Math.min(m, BBG_RVAV / 12) * 0.093;
  }

  function forward(monthlyGross, sonderAnnual, p) {
    var grossAnnual = monthlyGross * 12 + sonderAnnual;
    // Einmalzahlung: im Auszahlungsmonat wird sie mit dem Monatsbrutto
    // zusammengerechnet (11 Monate Monatsbrutto + 1 Monat Monatsbrutto
    // plus Sonderzahlung). Bei Sonderzahlung 0 ist das 12 x Monats-RV.
    var rvAnnual = 11 * rvMonthly(monthlyGross) + rvMonthly(monthlyGross + sonderAnnual);
    var zveBase = grossAnnual - rvAnnual;
    if (p.klasse !== "6") zveBase -= 1230 + 36;
    if (p.klasse === "2" && p.kinder > 0) zveBase -= 4260 + 240 * (p.kinder - 1);
    zveBase -= p.freibetrag;
    if (zveBase < 0) zveBase = 0;

    var steuer = lohnsteuer(zveBase, p.klasse);
    var zveSoli = Math.max(0, zveBase - KINDERFREIBETRAG * p.kinder);
    var steuerSoli = lohnsteuer(zveSoli, p.klasse);
    var freigrenze = p.klasse === "3" ? 40700 : 20350;
    var soli = 0;
    if (steuerSoli > freigrenze) {
      soli = Math.min(0.055 * steuerSoli, 0.119 * (steuerSoli - freigrenze));
    }
    var kirchenRate = p.kirche ? ((p.bundesland === "BY" || p.bundesland === "BW") ? 8 : 9) : 0;
    var kirche = kirchenRate / 100 * steuerSoli;

    var nettoAnnual = grossAnnual - steuer - soli - kirche - rvAnnual;
    var grenz = 0;
    if (zveBase > 0) {
      grenz = (lohnsteuer(zveBase + 100, p.klasse) - steuer) / 100 * 100;
    }
    return {
      grossAnnual: grossAnnual, grossMonthly: grossAnnual / 12,
      rv: rvAnnual, kv: 0, pv: 0, av: 0, sozial: rvAnnual,
      zve: zveBase, steuer: steuer, soli: soli, kirche: kirche,
      nettoAnnual: nettoAnnual, nettoMonthly: nettoAnnual / 12,
      durchschnittssteuersatz: zveBase > 0 ? steuer / zveBase * 100 : 0,
      grenzsteuersatz: grenz
    };
  }

  function reverse(netAnnualTarget, p) {
    function fwdAnnual(g) { return forward(g / 12, 0, p); }
    var lo = netAnnualTarget, hi = netAnnualTarget * 3 + 20000, guard = 0;
    while (fwdAnnual(hi).nettoAnnual < netAnnualTarget && guard < 10) {
      hi = hi * 1.5 + 10000; guard++;
    }
    for (var i = 0; i < 60; i++) {
      var mid = (lo + hi) / 2;
      var res = fwdAnnual(mid);
      if (Math.abs(res.nettoAnnual - netAnnualTarget) <= 1) return res;
      if (res.nettoAnnual < netAnnualTarget) lo = mid; else hi = mid;
    }
    return fwdAnnual((lo + hi) / 2);
  }

  function calc(p) {
    var targetAnnual, grossAnnual, result;
    if (p.typ === "stundenlohn") {
      var monatFaktor = p.stunden * 52 / 12;
      if (p.richtung === "netto") {
        targetAnnual = p.betrag * monatFaktor * 12;
        result = reverse(targetAnnual, p);
        result.bruttoStundenlohn = result.grossAnnual / 12 / monatFaktor;
        result.nettoStundenlohn = p.betrag;
      } else {
        result = forward(p.betrag * monatFaktor, 0, p);
        result.bruttoStundenlohn = p.betrag;
        result.nettoStundenlohn = result.nettoAnnual / 12 / monatFaktor;
      }
    } else if (p.typ === "jahr") {
      if (p.richtung === "netto") {
        result = reverse(p.betrag, p);
      } else {
        result = forward(p.betrag / 12, p.sonderzahlung, p);
      }
    } else {
      if (p.richtung === "netto") {
        // Sonderzahlung wird in der umgekehrten Richtung nicht berücksichtigt.
        result = reverse(p.betrag * 12, p);
        result.sonderzahlungHinweis = true;
      } else {
        result = forward(p.betrag, p.sonderzahlung, p);
      }
    }
    result.richtung = p.richtung;
    result.typ = p.typ;
    return result;
  }

  // Browser wiring
  if (typeof document !== "undefined") {
    var fmt = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
    var fmtNum = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

    function num(id) {
      var el = document.getElementById(id);
      if (!el) return 0;
      var v = parseFloat(String(el.value).replace(",", "."));
      if (isNaN(v) || v < 0) return 0;
      return v;
    }
    function set(id, wert) {
      var el = document.getElementById(id);
      if (el) el.textContent = fmt.format(wert);
    }
    function setTxt(id, txt) {
      var el = document.getElementById(id);
      if (el) el.textContent = txt;
    }

    function lesen() {
      var typEl = document.querySelector('input[name="ws-typ"]:checked');
      var richtEl = document.querySelector('input[name="ws-richtung"]:checked');
      var zeitEl = document.getElementById("ws-zeit");
      return {
        richtung: richtEl ? richtEl.value : "brutto",
        typ: typEl ? typEl.value : "monat",
        betrag: num("ws-betrag"),
        stunden: num("ws-stunden") || 20,
        zeit: zeitEl ? zeitEl.value : "vorlesung",
        klasse: document.getElementById("ws-klasse") ? document.getElementById("ws-klasse").value : "1",
        bundesland: document.getElementById("ws-bundesland") ? document.getElementById("ws-bundesland").value : "NW",
        kirche: document.getElementById("ws-kirche") ? document.getElementById("ws-kirche").value === "ja" : false,
        kinder: Math.min(5, Math.floor(num("ws-kinder"))),
        sonderzahlung: num("ws-sonder"),
        freibetrag: num("ws-freibetrag"),
        kvSelbst: num("ws-kv")
      };
    }

    function berechnen() {
      var p = lesen();
      if (!p.betrag) return;
      var r = calc(p);
      var stundenInputRow = document.getElementById("ws-stunden-row");
      if (stundenInputRow) stundenInputRow.style.display = p.typ === "stundenlohn" ? "" : "none";
      set("r-netto-monat", r.nettoMonthly);
      set("r-netto-jahr", r.nettoAnnual);
      set("r-brutto-monat", r.grossMonthly);
      set("r-brutto-jahr", r.grossAnnual);
      set("r-lohnsteuer", r.steuer / 12);
      set("r-soli", r.soli / 12);
      set("r-kirche", r.kirche / 12);
      set("r-rv", r.rv / 12);
      set("r-kv", 0);
      set("r-pv", 0);
      set("r-av", 0);
      set("r-sozial", r.sozial / 12);
      setTxt("r-durchschnitt", fmtNum.format(r.durchschnittssteuersatz) + " %");
      setTxt("r-grenz", fmtNum.format(r.grenzsteuersatz) + " %");
      setTxt("r-netto-quote", fmtNum.format(r.grossAnnual > 0 ? r.nettoAnnual / r.grossAnnual * 100 : 0) + " %");
      var stundenEl = document.getElementById("r-stunden-row");
      var stundenEl2 = document.getElementById("r-stunden-row2");
      if (stundenEl) {
        stundenEl.style.display = p.typ === "stundenlohn" ? "" : "none";
        if (stundenEl2) stundenEl2.style.display = p.typ === "stundenlohn" ? "" : "none";
        if (p.typ === "stundenlohn") {
          set("r-brutto-stunde", r.bruttoStundenlohn);
          set("r-netto-stunde", r.nettoStundenlohn);
        }
      }
      var kvRow = document.getElementById("r-kv-row");
      var kvRowJahr = document.getElementById("r-kv-row-jahr");
      if (kvRow) {
        var showKv = p.kvSelbst > 0;
        kvRow.style.display = showKv ? "" : "none";
        if (kvRowJahr) kvRowJahr.style.display = showKv ? "" : "none";
        if (showKv) {
          set("r-netto-nach-kv", r.nettoMonthly - p.kvSelbst);
          set("r-netto-nach-kv-jahr", r.nettoAnnual - p.kvSelbst * 12);
        }
      }
      var warn = document.getElementById("ws-warnung");
      if (warn) {
        if (p.zeit === "vorlesung" && p.typ === "stundenlohn" && p.stunden > 20) {
          warn.style.display = "";
          warn.textContent = "Achtung: In der Vorlesungszeit sind mehr als 20 Stunden pro Woche in der Regel zu viel für das Werkstudentenprivileg. Das Privileg kann dann verloren gehen, und es würden die vollen Sozialabgaben anfallen wie bei einem normalen Arbeitnehmer. Für diesen Fall rechnet der Brutto Netto Rechner. Die Rechnung oben nutzt trotzdem weiter die Werkstudentenregeln.";
        } else if (p.zeit === "frei") {
          warn.style.display = "";
          warn.textContent = "Vorlesungsfreie Zeit: Mehr als 20 Stunden pro Woche sind hier erlaubt, aber höchstens 26 Wochen (182 Tage) innerhalb von 12 Monaten. Wer länger über 20 Stunden arbeitet, verliert das Werkstudentenprivileg.";
        } else {
          warn.style.display = "none";
          warn.textContent = "";
        }
      }
      var hinweis = document.getElementById("r-hinweis");
      if (hinweis) {
        hinweis.textContent = p.richtung === "netto"
          ? "Umkehrung durch Iteration: Das Brutto wurde so lange angepasst, bis das Netto auf 1 Euro genau erreicht wurde. Eine Sonderzahlung wird in dieser Richtung nicht berücksichtigt."
          : "";
      }
    }

    document.addEventListener("DOMContentLoaded", function () {
      var form = document.getElementById("ws-form");
      if (!form) return;
      form.addEventListener("input", berechnen);
      form.addEventListener("change", berechnen);
      var btn = document.getElementById("ws-berechnen");
      if (btn) btn.addEventListener("click", berechnen);
      berechnen();
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc, forward: forward, reverse: reverse, grundtarif: grundtarif, rvMonthly: rvMonthly };
  }
})();

