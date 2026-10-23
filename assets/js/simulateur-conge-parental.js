/* Calcotia - Simulateur conge parental (France) : 3 mini-calculateurs
   1) Conge maternite  2) Conge paternite  3) Conges payes assistante maternelle */
(function () {
  "use strict";

  var fmtDate = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  var fmtEUR = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

  function parseDate(val) {
    if (!val) return null;
    var p = val.split("-");
    if (p.length !== 3) return null;
    var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    return isNaN(d.getTime()) ? null : d;
  }
  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function num(id) { var v = parseFloat(document.getElementById(id).value.replace(",", ".")); return isNaN(v) ? NaN : v; }
  function show(id) { document.getElementById(id).classList.add("show"); }
  function bind(ids, btnId, fn) {
    var b = document.getElementById(btnId);
    if (b) b.addEventListener("click", fn);
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener("input", fn); el.addEventListener("change", fn); }
    });
  }

  /* ---------- 1) Conge maternite ---------- */
  var MAT = {
    "simple":  { pre: 42,  post: 70,  sem: 16, label: "16 semaines (6 avant + 10 après)" },
    "trois":   { pre: 56,  post: 126, sem: 26, label: "26 semaines (8 avant + 18 après)" },
    "jumeaux": { pre: 84,  post: 154, sem: 34, label: "34 semaines (12 avant + 22 après)" },
    "triples": { pre: 168, post: 154, sem: 46, label: "46 semaines (24 avant + 22 après)" }
  };
  function calcMaternite() {
    var dpa = parseDate(document.getElementById("calcM-dpa").value);
    if (!dpa) return;
    var cfg = MAT[document.getElementById("calcM-situation").value] || MAT.simple;
    var debut = addDays(dpa, -cfg.pre);
    var fin = addDays(dpa, cfg.post - 1);
    document.getElementById("calcM-big").textContent =
      "Du " + fmtDate.format(debut) + " au " + fmtDate.format(fin);
    document.getElementById("calcM-debut").textContent = fmtDate.format(debut);
    document.getElementById("calcM-fin").textContent = fmtDate.format(fin);
    document.getElementById("calcM-duree").textContent = cfg.label + ", soit " + (cfg.pre + cfg.post) + " jours";
    document.getElementById("calcM-pre").textContent = cfg.pre + " jours avant la date prévue d'accouchement";
    document.getElementById("calcM-post").textContent = cfg.post + " jours à compter du jour de l'accouchement";
    show("calcM-result");
  }

  /* ---------- 2) Conge paternite ---------- */
  function calcPaternite() {
    var nais = parseDate(document.getElementById("calcP-date").value);
    if (!nais) return;
    var multiple = document.getElementById("calcP-type").value === "multiple";
    var total = multiple ? 32 : 25;
    var reste = total - 4;
    // Conge de naissance : 3 jours ouvrables (tous les jours sauf dimanche et feries)
    var d = new Date(nais.getTime()), compte = 0, dernier = null;
    while (compte < 3) {
      if (d.getDay() !== 0) { compte++; dernier = new Date(d.getTime()); }
      if (compte < 3) d = addDays(d, 1);
    }
    var debutOblig = addDays(dernier, 1);
    var finOblig = addDays(debutOblig, 3);
    var finBloc = addDays(debutOblig, total - 1);
    var limite = new Date(nais.getTime()); limite.setMonth(limite.getMonth() + 6);
    document.getElementById("calcP-big").textContent =
      total + " jours calendaires, dont 4 obligatoires du " + fmtDate.format(debutOblig) + " au " + fmtDate.format(finOblig);
    document.getElementById("calcP-naissance").textContent =
      "3 jours ouvrables, jusqu'au " + fmtDate.format(dernier) + " (estimation hors jours fériés)";
    document.getElementById("calcP-oblig").textContent = fmtDate.format(debutOblig) + " → " + fmtDate.format(finOblig);
    document.getElementById("calcP-reste").textContent = reste + " jours, en une fois ou en 2 périodes d'au moins 5 jours";
    document.getElementById("calcP-finbloc").textContent = fmtDate.format(finBloc);
    document.getElementById("calcP-limite").textContent = fmtDate.format(limite);
    show("calcP-result");
  }

  /* ---------- 3) Conges payes assistante maternelle ---------- */
  function calcCP() {
    var mois = num("calcCP-mois"), total = num("calcCP-total"), mensuel = num("calcCP-mensuel");
    if (isNaN(mois) || isNaN(total) || isNaN(mensuel) || mois <= 0) return;
    var jours = Math.min(30, Math.ceil(mois * 2.5));
    var maintien = jours * (mensuel / 26);
    var dixieme = total * 0.10;
    var retenu = Math.max(maintien, dixieme);
    var methode = maintien >= dixieme ? "le maintien de salaire" : "la méthode du dixième";
    document.getElementById("calcCP-big").textContent =
      fmtEUR.format(retenu) + " d'indemnité (" + methode + " est la méthode la plus favorable)";
    document.getElementById("calcCP-jours").textContent = jours + " jours ouvrables";
    document.getElementById("calcCP-maintien").textContent = fmtEUR.format(maintien);
    document.getElementById("calcCP-dixieme").textContent = fmtEUR.format(dixieme);
    show("calcCP-result");
  }

  bind(["calcM-dpa", "calcM-situation"], "calcM-btn", calcMaternite);
  bind(["calcP-date", "calcP-type"], "calcP-btn", calcPaternite);
  bind(["calcCP-mois", "calcCP-total", "calcCP-mensuel"], "calcCP-btn", calcCP);
})();
