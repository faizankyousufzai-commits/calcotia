/* Calcotia - Calcolo congedo parentale (Italia)
   Regole: D.Lgs. 151/2001, artt. 32 e 34, come modificati dal D.Lgs. 105/2022
   e dalle leggi di bilancio 2023 (L. 197/2022), 2024 (L. 213/2023), 2025
   (L. 207/2024) e 2026 (L. 199/2025). Coppia: massimo 10 mesi (11 se il padre
   ne fruisce almeno 3); madre max 6, padre max 6 (7 con il bonus). Mesi
   indennizzati: 9 (3 madre + 3 padre non trasferibili + 3 in alternativa).
   Fino a 3 mesi all'80% se fruiti entro il 6° anno del bambino: 1 mese se il
   congedo obbligatorio e' terminato dopo il 31/12/2022, 2 se dopo il
   31/12/2023, 3 se dopo il 31/12/2024 (INPS, circ. 95/2025). Gli altri mesi
   indennizzati sono al 30%. Oltre i 9 mesi, il 30% spetta solo con reddito
   individuale inferiore a 2,5 volte il trattamento minimo annuo (2026:
   611,85 euro x 13 = 7.954,05 euro; soglia 19.885,13 euro; INPS circ.
   153/2025). Fruizione entro il 14° anno dal 2026 (INPS, msg. 251/2026).
   Retribuzione media giornaliera = retribuzione mensile / 30; mese di
   congedo conteggiato in 30 giorni. Ipotesi di fruizione: prima la madre,
   poi il padre; i mesi all'80% sono attribuiti prima alla madre. */
(function () {
  "use strict";
  var fmt = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
  var fmtN = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 });

  var elBase = document.getElementById("cpBase");
  var elImporto = document.getElementById("cpImporto");
  var elMadre = document.getElementById("cpMadre");
  var elPadre = document.getElementById("cpPadre");
  var elEta = document.getElementById("cpEta");
  var elFine = document.getElementById("cpFine");
  var elReddito = document.getElementById("cpReddito");
  var elSolo = document.getElementById("cpSolo");
  var elBtn = document.getElementById("cpBtn");
  var elResult = document.getElementById("cpResult");
  if (!elBase || !elImporto || !elMadre || !elPadre || !elEta || !elFine ||
      !elReddito || !elSolo || !elBtn || !elResult) return;

  function num(el, def) {
    var v = parseFloat(el.value);
    return isNaN(v) ? def : v;
  }
  function set(id, txt) {
    var e = document.getElementById(id);
    if (e) e.textContent = txt;
  }
  function row(id, show) {
    var e = document.getElementById(id);
    if (e) e.style.display = show ? "" : "none";
  }

  function calcola() {
    var importo = num(elImporto, 0);
    if (importo <= 0) { elResult.classList.remove("show"); return; }
    var daily = elBase.value === "giorno" ? importo : importo / 30;
    var madre = Math.max(0, num(elMadre, 0));
    var padre = Math.max(0, num(elPadre, 0));
    var etaMesi = Math.max(0, num(elEta, 0));
    var ent80 = parseInt(elFine.value, 10);
    if (isNaN(ent80)) ent80 = 0;
    var bassoReddito = elReddito.value === "si";
    var solo = elSolo.value === "si";

    var avvisi = [];
    var mesiFinoA6 = Math.max(0, 72 - etaMesi);
    var mesiFinoA14 = Math.max(0, 168 - etaMesi);
    var d80 = daily * 0.8, d30 = daily * 0.3;

    var m80 = 0, m30 = 0, mNo = 0, p80 = 0, p30 = 0, pNo = 0, nonFruibili = 0;

    if (solo) {
      var tot = madre + padre;
      var fruibili = Math.min(tot, mesiFinoA14);
      nonFruibili += tot - fruibili;
      var ind = Math.min(9, fruibili);
      var indPrima6 = Math.min(ind, mesiFinoA6);
      m80 = Math.min(ent80, indPrima6);
      m30 = ind - m80;
      var extraS = fruibili - ind;
      if (bassoReddito) m30 += extraS; else mNo = extraS;
    } else {
      var capMadre = 6;
      var capPadre = padre >= 3 ? 7 : 6;
      var mEff = Math.min(madre, capMadre);
      var pEff = Math.min(padre, capPadre);
      nonFruibili += (madre - mEff) + (padre - pEff);
      var capCoppia = padre >= 3 ? 11 : 10;
      if (mEff + pEff > capCoppia) {
        var ecc = mEff + pEff - capCoppia;
        var ridP = Math.min(pEff, ecc);
        pEff -= ridP; ecc -= ridP;
        if (ecc > 0) mEff -= ecc;
        nonFruibili = (madre + padre) - mEff - pEff;
      }
      // Limite dei 14 anni: i mesi oltre la finestra non sono fruibili.
      var totEff = mEff + pEff;
      if (totEff > mesiFinoA14) {
        var oltre = totEff - mesiFinoA14;
        var ridP2 = Math.min(pEff, oltre);
        pEff -= ridP2; oltre -= ridP2;
        if (oltre > 0) mEff -= oltre;
        nonFruibili = (madre + padre) - mEff - pEff;
      }
      // Quote indennizzate: 3 + 3 non trasferibili, 3 in alternativa.
      var mInd = Math.min(mEff, 3);
      var pInd = Math.min(pEff, 3);
      var leftM = mEff - mInd, leftP = pEff - pInd;
      var condivisi = Math.min(3, leftM + leftP);
      var condM = Math.min(condivisi, leftM);
      mInd += condM;
      pInd += condivisi - condM;
      // Mesi all'80%: solo mesi indennizzati fruiti prima del 6° anno.
      var mIndPrima6 = Math.min(mInd, mesiFinoA6);
      var pIndPrima6 = Math.min(pInd, Math.max(0, mesiFinoA6 - mEff));
      var pool80 = Math.min(ent80, mIndPrima6 + pIndPrima6);
      m80 = Math.min(pool80, mIndPrima6);
      p80 = pool80 - m80;
      m30 = mInd - m80;
      p30 = pInd - p80;
      var extraM = mEff - mInd, extraP = pEff - pInd;
      if (bassoReddito) { m30 += extraM; p30 += extraP; }
      else { mNo = extraM; pNo = extraP; }
    }

    var mTot = m80 * 30 * d80 + m30 * 30 * d30;
    var pTot = p80 * 30 * d80 + p30 * 30 * d30;
    var totale = mTot + pTot;

    if (nonFruibili > 0) {
      avvisi.push("Attenzione: " + fmtN.format(nonFruibili) + (nonFruibili === 1 ? " mese indicato supera" : " mesi indicati superano") +
        " i limiti di legge (massimi per genitore, totale di coppia o 14° anno del bambino) e non " +
        (nonFruibili === 1 ? "è stato conteggiato." : "sono stati conteggiati."));
    }
    if (etaMesi >= 168) {
      avvisi.push("Il bambino ha già compiuto 14 anni: il congedo parentale non è più fruibile.");
    } else if (etaMesi >= 72 && ent80 > 0) {
      avvisi.push("Il bambino ha già compiuto 6 anni: i mesi maggiorati all'80% non spettano più, resta l'indennità del 30% per i mesi indennizzati.");
    }
    avvisi.push("Stima con mese di congedo pari a 30 giorni e fruizione prima della madre e poi del padre; i mesi all'80% sono attribuiti prima alla madre. Contratti collettivi più favorevoli e integrazioni del datore non sono conteggiati.");

    set("cpTotale", "Indennità totale stimata: " + fmt.format(totale));
    set("cpGiorn", fmt.format(daily));
    set("cpGiorn80", fmt.format(d80));
    set("cpGiorn30", fmt.format(d30));
    set("cpM80", fmtN.format(m80) + " mesi — " + fmt.format(m80 * 30 * d80));
    set("cpM30", fmtN.format(m30) + " mesi — " + fmt.format(m30 * 30 * d30));
    set("cpMNo", fmtN.format(mNo) + " mesi");
    set("cpMTot", fmt.format(mTot));
    set("cpP80", fmtN.format(p80) + " mesi — " + fmt.format(p80 * 30 * d80));
    set("cpP30", fmtN.format(p30) + " mesi — " + fmt.format(p30 * 30 * d30));
    set("cpPNo", fmtN.format(pNo) + " mesi");
    set("cpPTot", fmt.format(pTot));
    ["cpLabM1", "cpLabM2", "cpLabM3", "cpLabM4"].forEach(function (id) {
      var lab = document.getElementById(id);
      if (lab) lab.textContent = solo ? "Genitore solo" : "Madre";
    });
    row("cpRowP80", !solo); row("cpRowP30", !solo);
    row("cpRowPNo", !solo); row("cpRowPTot", !solo);
    var elAvv = document.getElementById("cpAvvisi");
    if (elAvv) elAvv.textContent = avvisi.join(" ");
    elResult.classList.add("show");
  }

  elBtn.addEventListener("click", calcola);
  [elBase, elImporto, elMadre, elPadre, elEta, elFine, elReddito, elSolo].forEach(function (el) {
    el.addEventListener("input", calcola);
    el.addEventListener("change", calcola);
  });
  calcola();
})();
