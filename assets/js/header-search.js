// Calcotia sitewide header search (moved from the homepage hero, 2026-10-25).
// Same tool index as the old home search, extended to all 17 calculators.
(function () {
  var TOOLS = [
    { n: "Sykepenger kalkulator", s: "Norway sick pay", u: "/no/sykepenger-kalkulator/", k: "sykepenger sick pay norway sykepenge" },
    { n: "Feriepenger kalkulator", s: "Norway holiday pay", u: "/no/feriepenger-kalkulator/", k: "feriepenger holiday pay norway feriepenge" },
    { n: "Foreldrepenger kalkulator", s: "Norway parental benefit", u: "/no/foreldrepenger-kalkulator/", k: "foreldrepenger parental benefit norway" },
    { n: "Bürgergeld Rechner", s: "Germany citizen's income", u: "/de/buergergeld-rechner/", k: "bürgergeld buergergeld grundsicherung rechner germany" },
    { n: "Aufstockung Rechner", s: "Germany top-up calculator", u: "/de/aufstockung-rechner/", k: "aufstockung aufstockend alg2 hartz iv aufstocker grundsicherung germany" },
    { n: "Simulateur congé parental", s: "France parental leave", u: "/fr/simulateur-conge-parental/", k: "congé parental maternité paternité france conges payes" },
    { n: "Calcolo TFR netto", s: "Italy severance pay", u: "/it/calcolo-tfr-netto/", k: "tfr calcolo netto italy severance" },
    { n: "Calcolo congedo parentale", s: "Italy parental leave", u: "/it/calcolo-congedo-parentale/", k: "congedo parentale calcolo italy parental" },
    { n: "Calcolo NASpI", s: "Italy unemployment benefit", u: "/it/calcolo-naspi/", k: "naspi calcolo disoccupazione italy unemployment" },
    { n: "退職金・退職手当 税金計算", s: "Japan retirement tax", u: "/jp/taishokukin-zeikin-keisan/", k: "退職金 退職手当 税金 taishokukin japan retirement" },
    { n: "Υπολογισμός αποζημίωσης απόλυσης", s: "Greece dismissal compensation", u: "/gr/ypologismos-apozimiosis-apolysis/", k: "αποζημίωση απόλυσης greece severance" },
    { n: "מחשבון דמי הבראה", s: "Israel recuperation pay", u: "/il/dmei-havraa/", k: "דמי הבראה havraa israel recuperation" },
    { n: "Tính bảo hiểm xã hội 1 lần", s: "Vietnam one-time social insurance", u: "/vn/tinh-bao-hiem-xa-hoi-1-lan/", k: "bảo hiểm xã hội bhxh vietnam" },
    { n: "Kalkulačka na výpočet dôchodku", s: "Slovakia pension", u: "/sk/kalkulacka-na-vypocet-dochodku/", k: "dôchodok dochodok pension slovakia kalkulačka" },
    { n: "Kalkulator dečijeg dodatka", s: "Serbia child allowance", u: "/rs/kalkulator-decijeg-dodatka/", k: "dečiji dodatak deciji serbia child allowance cenzus" },
    { n: "حاسبة نهاية الخدمة", s: "Saudi end of service", u: "/sa/hasibat-nihayat-al-khidma/", k: "نهاية الخدمة مكافأة نهاية الخدمة حاسبة نهاية الخدمة قوى السعودية saudi eos" },
    { n: "End of Service Calculator", s: "Saudi end of service", u: "/sa/end-of-service-calculator/", k: "end of service calculator ksa esb saudi benefits" }
  ];
  var form = document.getElementById('headerSearch');
  var inp = document.getElementById('headerSearchInput');
  var box = document.getElementById('headerSearchResults');
  if (!form || !inp || !box) return;
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function runSearch(q) {
    q = norm(q.trim()); box.innerHTML = '';
    if (!q) return;
    var hits = TOOLS.filter(function (t) { return norm(t.n + ' ' + t.s + ' ' + t.k).indexOf(q) > -1; });
    if (!hits.length) {
      box.innerHTML = '<div style="background:#fff;border:1px solid #dce5ee;border-radius:10px;padding:12px 16px">No calculator found. Try a country name or a word like pension.</div>';
      return;
    }
    hits.forEach(function (t) {
      var a = document.createElement('a');
      a.href = t.u;
      a.style.cssText = 'display:block;background:#fff;border:1px solid #dce5ee;border-radius:10px;padding:12px 16px;margin-bottom:8px;color:#1c2b3a';
      a.innerHTML = '<b>' + t.n + '</b> <span style="color:#5a6b7c">· ' + t.s + '</span>';
      box.appendChild(a);
    });
  }
  inp.addEventListener('input', function () { runSearch(inp.value); });
  form.addEventListener('submit', function (e) {
    e.preventDefault(); runSearch(inp.value);
    var f = box.querySelector('a'); if (f) location.href = f.href;
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.header-search')) box.innerHTML = '';
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') box.innerHTML = '';
  });
})();
