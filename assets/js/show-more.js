(function () {
  document.documentElement.classList.add("js");
  var grid = document.getElementById("all-calcs-grid");
  var btn = document.getElementById("show-more-calcs");
  if (!grid || !btn) return;
  btn.addEventListener("click", function () {
    var expanded = grid.classList.toggle("show-all");
    btn.setAttribute("aria-expanded", expanded ? "true" : "false");
    btn.textContent = expanded ? "Show fewer calculators" : "Show more calculators";
  });
})();
