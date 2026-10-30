// Calcotia - Brutto Netto Rechner 2026 (Deutschland)
// Simplified calculation, labelled as an estimate on the page.
// Tax: section 32a EStG 2026 tariff on annual taxable income.
//   Zone 1: up to 12,348 EUR: 0
//   Zone 2: 12,349 to 17,799 EUR: (914.51*y + 1400)*y, y = (x - 12348)/10000
//   Zone 3: 17,800 to 69,878 EUR: (173.10*z + 2397)*z + 1034.87, z = (x - 17799)/10000
//   Zone 4: 69,879 to 277,825 EUR: 0.42*x - 11135.70 (continuity constant)
//   Zone 5: from 277,826 EUR: 0.45*x - 19470.45 (continuity constant)
// Taxable income (simplified Vorsorgepauschale, following the BMF
// Lohnsteuertabellen note that the Pflege childless surcharge and child
// discounts are NOT part of the Vorsorgepauschale):
//   taxable = annual gross - RV employee - KV employee - PV at 1.8%
//             - Arbeitnehmer-Pauschbetrag 1,230 - Sonderausgaben 36
//             - Entlastungsbetrag class II (4,260 + 240 per further child)
//             - registered ELStAM Freibetrag
// Social contributions actually deducted (for net) use the real rates:
//   RV 9.3%, AV 1.3%, KV 7.3% + half Zusatzbeitrag, PV base 1.8%
//   (2.4% childless over 23, minus 0.25 per child from the 2nd to 5th
//   child under 25), Sachsen +0.5 points employee share.
// Caps 2026: KV/PV 69,750 EUR/year, RV/AV 101,400 EUR/year.
// Soli: 5.5% of Lohnsteuer, Freigrenze 20,350 EUR (single table) or
// 40,700 EUR (class III), Milderungszone 11.9% of the excess.
// Kirchensteuer: 8% (Bayern, Baden-Wuerttemberg) or 9% (other states)
//   of the Lohnsteuer after Kinderfreibetrag, only if church-tax-liable.
// Kinderfreibetrag total 9,756 EUR per child is used ONLY for the
// Soli and Kirchensteuer base, not for the Lohnsteuer itself.
// Classes: I, II, IV = Grundtarif; III = Splitting (2 x tariff on half);
// V and VI = tariff without Grundfreibetrag (shift by 12,348), labelled
// as approximations on the page. Class VI also gets no 1,230/36 pauschalen.
// Scope: standard employees only. Beamte, Soldat, Grenzgänger, Rentner,
// Selbständige, Minijob, Midijob and Werkstudent calculations are out
// of scope and are not promised by this calculator.
(function () {
  "use strict";

  var BBG_KVPV = 69750, BBG_RVAV = 101400;
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

  function pvRate(kinder, ueber23Kinderlos, sachsen) {
    var base;
    if (sachsen) base = (kinder > 0 || !ueber23Kinderlos) ? 2.3 : 2.9;
    else base = (kinder > 0 || !ueber23Kinderlos) ? 1.8 : 2.4;
    if (kinder >= 2) base -= 0.25 * (Math.min(kinder, 5) - 1);
    return base;
  }

  function forward(grossAnnual, p) {
    var sachsen = p.bundesland === "SN";
    var kvBase = Math.min(grossAnnual, BBG_KVPV);
    var rvBase = Math.min(grossAnnual, BBG_RVAV);
    var rv = rvBase * 0.093;
    var av = rvBase * 0.013;
    var kv = kvBase * (0.073 + p.zusatzbeitrag / 200);
    var pv = kvBase * pvRate(p.kinder, p.ueber23Kinderlos, sachsen) / 100;
    var sozial = rv + av + kv + pv;

    var vsp = rvBase * 0.093 + kvBase * (0.073 + p.zusatzbeitrag / 200) + kvBase * 0.018;
    var zveBase = grossAnnual - vsp;
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

    var nettoAnnual = grossAnnual - steuer - soli - kirche - sozial;
    var grenz = 0;
    if (zveBase > 0) {
      grenz = (lohnsteuer(zveBase + 100, p.klasse) - steuer) / 100 * 100;
    }
    return {
      grossAnnual: grossAnnual, grossMonthly: grossAnnual / 12,
      rv: rv, av: av, kv: kv, pv: pv, sozial: sozial,
      zve: zveBase, steuer: steuer, soli: soli, kirche: kirche,
      nettoAnnual: nettoAnnual, nettoMonthly: nettoAnnual / 12,
      durchschnittssteuersatz: zveBase > 0 ? steuer / zveBase * 100 : 0,
      grenzsteuersatz: grenz
    };
  }

  function reverse(netAnnualTarget, p) {
    var lo = netAnnualTarget, hi = netAnnualTarget * 3 + 20000;
    var guard = 0;
    while (forward(hi, p).nettoAnnual < netAnnualTarget && guard < 10) {
      hi = hi * 1.5 + 10000; guard++;
    }
    for (var i = 0; i < 60; i++) {
      var mid = (lo + hi) / 2;
      var res = forward(mid, p);
      if (Math.abs(res.nettoAnnual - netAnnualTarget) <= 1) return res;
      if (res.nettoAnnual < netAnnualTarget) lo = mid; else hi = mid;
    }
    return forward((lo + hi) / 2, p);
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
        grossAnnual = p.betrag * monatFaktor * 12;
        result = forward(grossAnnual, p);
        result.bruttoStundenlohn = p.betrag;
        result.nettoStundenlohn = result.nettoAnnual / 12 / monatFaktor;
      }
    } else if (p.typ === "jahr") {
      if (p.richtung === "netto") {
        result = reverse(p.betrag, p);
      } else {
        result = forward(p.betrag, p);
      }
    } else {
      var annual = p.betrag * 12 + p.sonderzahlung;
      if (p.richtung === "netto") {
        // Desired net is monthly; Sonderzahlung is already part of the
        // annual gross, so the iteration target is annual net.
        result = reverse(p.betrag * 12, p);
        result.sonderzahlungHinweis = true;
      } else {
        result = forward(annual, p);
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
      var typEl = document.querySelector('input[name="bn-typ"]:checked');
      var richtEl = document.querySelector('input[name="bn-richtung"]:checked');
      return {
        richtung: richtEl ? richtEl.value : "brutto",
        typ: typEl ? typEl.value : "monat",
        betrag: num("bn-betrag"),
        stunden: num("bn-stunden") || 40,
        klasse: document.getElementById("bn-klasse") ? document.getElementById("bn-klasse").value : "1",
        bundesland: document.getElementById("bn-bundesland") ? document.getElementById("bn-bundesland").value : "NW",
        kirche: document.getElementById("bn-kirche") ? document.getElementById("bn-kirche").value === "ja" : false,
        kinder: Math.min(5, Math.floor(num("bn-kinder"))),
        ueber23Kinderlos: document.getElementById("bn-ueber23") ? document.getElementById("bn-ueber23").checked : true,
        zusatzbeitrag: num("bn-zusatz") || 0,
        sonderzahlung: num("bn-sonder"),
        freibetrag: num("bn-freibetrag")
      };
    }

    function berechnen() {
      var p = lesen();
      if (!p.betrag) return;
      var r = calc(p);
      var stundenHinweis = document.getElementById("bn-stunden-row");
      if (stundenHinweis) stundenHinweis.style.display = p.typ === "stundenlohn" ? "" : "none";
      set("r-netto-monat", r.nettoMonthly);
      set("r-netto-jahr", r.nettoAnnual);
      set("r-brutto-monat", r.grossMonthly);
      set("r-brutto-jahr", r.grossAnnual);
      set("r-lohnsteuer", r.steuer / 12);
      set("r-soli", r.soli / 12);
      set("r-kirche", r.kirche / 12);
      set("r-rv", r.rv / 12);
      set("r-kv", r.kv / 12);
      set("r-pv", r.pv / 12);
      set("r-av", r.av / 12);
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
      var hinweis = document.getElementById("r-hinweis");
      if (hinweis) {
        hinweis.textContent = p.richtung === "netto"
          ? "Umkehrung durch Iteration: Das Brutto wurde so lange angepasst, bis das Netto auf 1 Euro genau erreicht wurde. Eine Sonderzahlung wird in dieser Richtung nicht berücksichtigt."
          : "";
      }
    }

    document.addEventListener("DOMContentLoaded", function () {
      var form = document.getElementById("bn-form");
      if (!form) return;
      form.addEventListener("input", berechnen);
      form.addEventListener("change", berechnen);
      var btn = document.getElementById("bn-berechnen");
      if (btn) btn.addEventListener("click", berechnen);
      berechnen();
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calc: calc, forward: forward, reverse: reverse, grundtarif: grundtarif, pvRate: pvRate };
  }
})();
