// Calcotia - Aufstockung Rechner (Deutschland)
// Regelbedarfe 2025/2026 (BMAS): alleinstehend 563 EUR, Partner je 506 EUR,
// 14-17 Jahre 471 EUR, 6-13 Jahre 390 EUR, 0-5 Jahre 357 EUR.
// Kindergeld 2026: 259 EUR je Kind, wird als Einkommen des Kindes angerechnet.
// Freibetraege nach Paragraf 11b SGB II aus dem Bruttoeinkommen:
// 100 EUR Grundfreibetrag, 20 % (100-520), 30 % (520-1.000),
// 10 % (1.000-1.200 bzw. 1.500 mit minderjaehrigem Kind).
// Mehrbedarf Alleinerziehende: 12 % je Kind, mindestens 36 % bei einem Kind
// unter 7 Jahren oder zwei Kindern unter 16 Jahren, hoechstens 60 %.
// Anrechenbar = max(0, Netto - Freibetrag) + Kindergeld + sonstiges Einkommen.
// Aufstockung = max(0, Gesamtbedarf - anrechenbar).
(function () {
  "use strict";

  var REGEL = { single: 563, partner: 506, k05: 357, k613: 390, k1417: 471 };
  var KINDERGELD = 259;
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

  function freibetragStufen(bruttoeinkommen, hatMinderjaehrigesKind) {
    var teile = [];
    var grund = Math.min(bruttoeinkommen, 100);
    teile.push(fmt.format(grund) + " Grundfreibetrag");
    if (bruttoeinkommen > 100) {
      var s2 = 0.20 * (Math.min(bruttoeinkommen, 520) - 100);
      teile.push(fmt.format(s2) + " (20 % von " + fmt.format(Math.min(bruttoeinkommen, 520) - 100) + ")");
    }
    if (bruttoeinkommen > 520) {
      var s3 = 0.30 * (Math.min(bruttoeinkommen, 1000) - 520);
      teile.push(fmt.format(s3) + " (30 % von " + fmt.format(Math.min(bruttoeinkommen, 1000) - 520) + ")");
    }
    var grenze = hatMinderjaehrigesKind ? 1500 : 1200;
    if (bruttoeinkommen > 1000) {
      var s4 = 0.10 * (Math.min(bruttoeinkommen, grenze) - 1000);
      teile.push(fmt.format(s4) + " (10 % von " + fmt.format(Math.min(bruttoeinkommen, grenze) - 1000) + ")");
    }
    return teile.join(" + ");
  }

  function mehrbedarfProzent(k05, k613, k1417) {
    var kinder = k05 + k613 + k1417;
    if (kinder === 0) return 0;
    var pct = 0.12 * kinder;
    if (k05 >= 1 || (k05 + k613) >= 2) pct = Math.max(pct, 0.36);
    return Math.min(pct, 0.60);
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
    var mbPct = alleinerziehend ? mehrbedarfProzent(k05, k613, k1417) : 0;
    var mehrbedarf = mbPct * REGEL.single;
    var kdu = num("kaltmiete") + num("nebenkosten") + num("heizkosten");
    var bedarf = erwachsene + kinderBetrag + mehrbedarf + kdu;

    var bruttoeinkommen = num("bruttoeinkommen");
    var nettoeinkommen = num("nettoeinkommen");
    var sonstiges = num("sonstiges");
    var fb = freibetrag(bruttoeinkommen, kinder > 0);
    var kindergeld = kinder * KINDERGELD;
    var anrechenbarErwerb = Math.max(0, nettoeinkommen - fb);
    var anrechenbar = anrechenbarErwerb + kindergeld + sonstiges;
    var aufstockung = Math.max(0, bedarf - anrechenbar);

    setzen("r-erwachsene", erwachsene);
    setzen("r-kinder", kinderBetrag);
    setzen("r-mehrbedarf", mehrbedarf);
    setzen("r-kdu", kdu);
    setzen("r-bedarf", bedarf);
    setzen("r-brutto", bruttoeinkommen);
    setzen("r-netto", nettoeinkommen);
    setzen("r-freibetrag", fb);
    setzen("r-kindergeld", kindergeld);
    setzen("r-sonstiges", sonstiges);
    setzen("r-anrechenbar-erwerb", anrechenbarErwerb);
    setzen("r-anrechenbar", anrechenbar);
    setzen("r-total", aufstockung);

    var stufen = document.getElementById("r-fb-stufen");
    if (stufen) stufen.textContent = freibetragStufen(bruttoeinkommen, kinder > 0) + " = " + fmt.format(fb);

    var nullHinweis = document.getElementById("null-hinweis");
    if (nullHinweis) {
      nullHinweis.textContent = aufstockung <= 0
        ? "Nach dieser Schätzung besteht kein Aufstockungsanspruch, weil Ihr anrechenbares Einkommen Ihren Bedarf bereits deckt. Prüfen Sie stattdessen Wohngeld und Kinderzuschlag."
        : "";
    }

    var box = document.getElementById("ergebnis");
    if (box) box.classList.add("show");
  }

  var ids = ["haushalt", "kinder05", "kinder613", "kinder1417", "alleinerziehend",
             "kaltmiete", "nebenkosten", "heizkosten", "bruttoeinkommen", "nettoeinkommen", "sonstiges"];
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
