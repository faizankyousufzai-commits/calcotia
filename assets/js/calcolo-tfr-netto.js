/* Calcotia - Calcolo TFR netto (Italia)
   Simulazione anno per anno: quota = RAL / 13,5; rivalutazione sul fondo
   dell'anno precedente = 1,5% + 75% inflazione ISTAT; imposta sostitutiva 17%
   sulla rivalutazione. Alla fine: tassazione separata (art. 19 TUIR) con
   reddito di riferimento, aliquota media IRPEF e detrazione. */
(function () {
  "use strict";
  var fmt = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
  var elRal = document.getElementById("itRal");
  var elAnni = document.getElementById("itAnni");
  var elInfl = document.getElementById("itInfl");
  var elBtn = document.getElementById("itBtn");
  var elResult = document.getElementById("itResult");
  if (!elRal || !elAnni || !elInfl || !elBtn || !elResult) return;

  function irpef(reddito) {
    var t = Math.min(reddito, 28000) * 0.23;
    if (reddito > 28000) t += (Math.min(reddito, 50000) - 28000) * 0.35;
    if (reddito > 50000) t += (reddito - 50000) * 0.43;
    return t;
  }

  function calcola() {
    var ral = parseFloat(elRal.value);
    var anni = parseFloat(elAnni.value);
    var infl = parseFloat(elInfl.value);
    if (isNaN(infl)) infl = 0;
    if (isNaN(ral) || isNaN(anni) || ral <= 0 || anni <= 0) {
      elResult.classList.remove("show");
      return;
    }
    var tassoRiv = 0.015 + 0.75 * (infl / 100);
    var quotaAnno = ral / 13.5;
    var fondo = 0, totQuote = 0, totRivLorda = 0, totImpSost = 0, totRivNetta = 0;
    var interi = Math.floor(anni);
    var frazione = anni - interi;
    var i, riv, imp, q;
    for (i = 0; i < interi; i++) {
      riv = fondo * tassoRiv;
      imp = riv * 0.17;
      fondo += riv - imp;
      totRivLorda += riv; totImpSost += imp; totRivNetta += riv - imp;
      fondo += quotaAnno; totQuote += quotaAnno;
    }
    if (frazione > 0) {
      riv = fondo * tassoRiv * frazione;
      imp = riv * 0.17;
      fondo += riv - imp;
      totRivLorda += riv; totImpSost += imp; totRivNetta += riv - imp;
      q = quotaAnno * frazione;
      fondo += q; totQuote += q;
    }
    var base = totQuote;
    var redditoRif = base / anni * 12;
    var aliquotaMedia = redditoRif > 0 ? irpef(redditoRif) / redditoRif : 0;
    var imposta = aliquotaMedia * base;
    var detrazione = 0;
    if (redditoRif <= 30000) detrazione = 70;
    else if (redditoRif < 50000) detrazione = 70 * (50000 - redditoRif) / 20000;
    imposta = Math.max(0, imposta - detrazione);
    var netto = fondo - imposta;

    document.getElementById("itNetto").textContent = "TFR netto stimato: " + fmt.format(netto);
    document.getElementById("itLordo").textContent = fmt.format(fondo);
    document.getElementById("itQuote").textContent = fmt.format(totQuote);
    document.getElementById("itRivNetta").textContent = fmt.format(totRivNetta);
    document.getElementById("itImpSost").textContent = fmt.format(totImpSost);
    document.getElementById("itRif").textContent = fmt.format(redditoRif);
    document.getElementById("itAliquota").textContent = (aliquotaMedia * 100).toFixed(2).replace(".", ",") + "%";
    document.getElementById("itImposta").textContent = fmt.format(imposta);
    elResult.classList.add("show");
  }

  elBtn.addEventListener("click", calcola);
  [elRal, elAnni, elInfl].forEach(function (el) {
    el.addEventListener("input", calcola);
    el.addEventListener("change", calcola);
  });
  calcola();
})();
