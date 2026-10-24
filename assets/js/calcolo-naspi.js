/* Calcotia - Calcolo NASpI (Italia)
   Retribuzione media mensile = imponibile previdenziale degli ultimi 4 anni
   / settimane di contribuzione degli ultimi 4 anni x 4,33.
   Importo lordo mensile (circolare INPS n. 4/2026): 75% della media fino alla
   soglia di 1.456,72 euro; oltre la soglia 1.092,54 euro + 25% dell'eccedenza;
   massimale 1.584,70 euro. Durata: settimane pari alla meta' delle settimane
   di contribuzione, massimo 104 settimane (24 mesi). Decalage: -3% al mese dal
   primo giorno del 6o mese, dall'8o mese per chi ha almeno 55 anni alla
   domanda. Il totale e' la somma delle mensilita' mostrate in tabella. */
(function () {
  "use strict";
  var SOGLIA = 1456.72;
  var BASE_SOGLIA = 1092.54; /* 75% della soglia 2026 */
  var MASSIMALE = 1584.70;
  var fmt = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
  var fmtNum = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });
  var elImp = document.getElementById("naImponibile");
  var elSett = document.getElementById("naSettimane");
  var elEta = document.getElementById("naOver55");
  var elBtn = document.getElementById("naBtn");
  var elResult = document.getElementById("naResult");
  if (!elImp || !elSett || !elEta || !elBtn || !elResult) return;

  function round2(x) { return Math.round(x * 100) / 100; }

  function simula(imponibile, settimane, over55) {
    var media = imponibile / settimane * 4.33;
    var base;
    if (media <= SOGLIA) base = media * 0.75;
    else base = BASE_SOGLIA + (media - SOGLIA) * 0.25;
    if (base > MASSIMALE) base = MASSIMALE;
    var durataSettimane = Math.min(settimane / 2, 104);
    var mesi = Math.round(durataSettimane / 4.33);
    if (mesi < 1) mesi = 1;
    if (mesi > 24) mesi = 24;
    var inizioRiduzione = over55 ? 8 : 6;
    var importi = [];
    var totale = 0;
    for (var m = 1; m <= mesi; m++) {
      var fattore = m < inizioRiduzione ? 1 : Math.pow(0.97, m - inizioRiduzione + 1);
      var importo = round2(base * fattore);
      importi.push(importo);
      totale += importo;
    }
    return {
      media: media,
      base: base,
      durataSettimane: durataSettimane,
      mesi: mesi,
      importi: importi,
      totale: round2(totale)
    };
  }

  function calcola() {
    var imponibile = parseFloat(elImp.value);
    var settimane = parseFloat(elSett.value);
    var over55 = elEta.value === "si";
    var elAvvisi = document.getElementById("naAvvisi");
    if (isNaN(imponibile) || isNaN(settimane) || imponibile <= 0 || settimane <= 0) {
      elResult.classList.remove("show");
      return;
    }
    var r = simula(imponibile, settimane, over55);
    document.getElementById("naBig").textContent = "NASpI lorda del primo mese: " + fmt.format(r.base);
    document.getElementById("naMedia").textContent = fmt.format(r.media);
    document.getElementById("naPrimo").textContent = fmt.format(r.base);
    document.getElementById("naDurata").textContent =
      fmtNum.format(r.durataSettimane) + " settimane (circa " + r.mesi + (r.mesi === 1 ? " mensilità" : " mensilità") + ")";
    document.getElementById("naTotale").textContent = fmt.format(r.totale);
    var html = "";
    for (var i = 0; i < r.importi.length; i++) {
      html += "<tr><td>Mese " + (i + 1) + "</td><td>" + fmt.format(r.importi[i]) + "</td></tr>";
    }
    document.getElementById("naSchedule").innerHTML = html;
    if (settimane < 13) {
      elAvvisi.textContent = "Attenzione: con meno di 13 settimane di contribuzione negli ultimi quattro anni la NASpI non spetta, salvo casi particolari. La simulazione mostra comunque gli importi teorici.";
    } else if (settimane > 208) {
      elAvvisi.textContent = "Nota: negli ultimi quattro anni non possono risultare più di 208 settimane di contribuzione; verifica i dati inseriti nell'estratto conto INPS.";
    } else {
      elAvvisi.textContent = "";
    }
    elResult.classList.add("show");
  }

  elBtn.addEventListener("click", calcola);
  [elImp, elSett, elEta].forEach(function (el) {
    el.addEventListener("input", calcola);
    el.addEventListener("change", calcola);
  });
  calcola();
})();
