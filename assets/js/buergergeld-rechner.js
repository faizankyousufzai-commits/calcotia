// Calcotia - Buergergeld Rechner (Deutschland)
// Regelbedarfe 2025/2026 (BMAS): alleinstehend 563 EUR, Partner je 506 EUR,
// 14-17 Jahre 471 EUR, 6-13 Jahre 390 EUR, 0-5 Jahre 357 EUR.
// Freibetraege nach Paragraf 11b SGB II werden aus dem Bruttoeinkommen
// berechnet: 100 EUR Grundfreibetrag, 20 % (100-520), 30 % (520-1.000),
// 10 % (1.000-1.200 bzw. 1.500 mit minderjaehrigem Kind). Angerechnet wird
// das Nettoeinkommen abzueglich dieses Freibetrags.
(function () {
  "use strict";

  var REGEL = { single: 563, partner: 506, k05: 357, k613: 390, k1417: 471 };
  var fmt = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

  function num(id) {
    var el = document.getElementById(id);
    if (!el) return 0;
    var v = parseFloat(String(el.value).replace(",", "."));
    if (isNaN(v) || v < 0) return 0;
    return v;
  }

  function count(id) {
    return Math.min(10, Math.floor(num(id)));
  }

  function freibetrag(bruttoeinkommen, hatMinderjaehrigesKind) {
    var fb = Math.min(bruttoeinkommen, 100);
    if (bruttoeinkommen > 100) fb += 0.20 * (Math.min(bruttoeinkommen, 520) - 100);
    if (bruttoeinkommen > 520) fb += 0.30 * (Math.min(bruttoeinkommen, 1000) - 520);
    var grenze = hatMinderjaehrigesKind ? 1500 : 1200;
    if (bruttoeinkommen > 1000) fb += 0.10 * (Math.min(bruttoeinkommen, grenze) - 1000);
    return fb;
  }

  function setzen(id, wert) {
    var el = document.getElementById(id);
    if (el) el.textContent = fmt.format(wert);
  }

  function berechnen() {
    var formEl = document.getElementById("haushalt");
    var aeEl = document.getElementById("alleinerziehend");
    if (!formEl || !aeEl) return;
    var form = formEl.value;
    var k05 = count("kinder05");
    var k613 = count("kinder613");
    var k1417 = count("kinder1417");
    var kinder = k05 + k613 + k1417;

    var alleinerziehend = aeEl.value === "ja" && form === "single";
    var hinweis = document.getElementById("ae-hinweis");
    if (hinweis) {
      hinweis.textContent = (aeEl.value === "ja" && form === "partner")
        ? "Hinweis: Der Mehrbedarf für Alleinerziehende wird nur ohne Partner in der Bedarfsgemeinschaft gewährt."
        : "";
    }

    var erwachsene = form === "partner" ? 2 * REGEL.partner : REGEL.single;
    var kinderBetrag = k05 * REGEL.k05 + k613 * REGEL.k613 + k1417 * REGEL.k1417;
    var mehrbedarf = (alleinerziehend && kinder > 0)
      ? Math.min(0.12 * kinder, 0.60) * REGEL.single
      : 0;
    var kdu = num("kaltmiete") + num("nebenkosten") + num("heizkosten");
    var bedarf = erwachsene + kinderBetrag + mehrbedarf + kdu;

    var bruttoeinkommen = num("bruttoeinkommen");
    var nettoeinkommen = num("nettoeinkommen");
    var fb = freibetrag(bruttoeinkommen, kinder > 0);
    var anrechenbar = Math.max(0, nettoeinkommen - fb);
    var leistung = Math.max(0, bedarf - anrechenbar);

    setzen("r-erwachsene", erwachsene);
    setzen("r-kinder", kinderBetrag);
    setzen("r-mehrbedarf", mehrbedarf);
    setzen("r-kdu", kdu);
    setzen("r-bedarf", bedarf);
    setzen("r-brutto", bruttoeinkommen);
    setzen("r-netto", nettoeinkommen);
    setzen("r-freibetrag", fb);
    setzen("r-anrechenbar", anrechenbar);
    setzen("r-total", leistung);

    var nullHinweis = document.getElementById("null-hinweis");
    if (nullHinweis) {
      nullHinweis.textContent = leistung <= 0
        ? "Nach dieser Schätzung besteht kein Anspruch. Prüfen Sie stattdessen Kinderzuschlag und Wohngeld."
        : "";
    }

    var box = document.getElementById("ergebnis");
    if (box) box.classList.add("show");
  }

  var ids = ["haushalt", "kinder05", "kinder613", "kinder1417", "alleinerziehend",
             "kaltmiete", "nebenkosten", "heizkosten", "bruttoeinkommen", "nettoeinkommen"];
  for (var i = 0; i < ids.length; i++) {
    var el = document.getElementById(ids[i]);
    if (el) {
      el.addEventListener("input", berechnen);
      el.addEventListener("change", berechnen);
    }
  }
  var btn = document.getElementById("btn-berechnen");
  if (btn) btn.addEventListener("click", berechnen);

  berechnen();
})();
