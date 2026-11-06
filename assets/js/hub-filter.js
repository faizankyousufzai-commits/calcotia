/* Hub filter pills + carousel controls for the ALL CALCULATORS block.
   Pills: clicking one shows only that category's section (All shows all)
   and marks the pill active. Carousel buttons scroll their section's
   .grid.carousel horizontally by one card width.
   Copy to site/assets/js/hub-filter.js at apply time; include with defer
   on hub pages only. */
(function () {
  var pills = document.querySelectorAll('.filter-pills .pill');
  var sections = document.querySelectorAll('.cat-section');
  if (!pills.length || !sections.length) { return; }
  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      pills.forEach(function (p) { p.classList.remove('pill-active'); });
      pill.classList.add('pill-active');
      var cat = pill.getAttribute('data-cat');
      sections.forEach(function (s) {
        s.hidden = !(cat === 'all' || s.getAttribute('data-cat') === cat);
      });
    });
  });
  document.querySelectorAll('.carousel-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var grid = btn.closest('.cat-section').querySelector('.grid.carousel');
      if (!grid) { return; }
      var card = grid.querySelector('.tool-card');
      var step = card ? card.offsetWidth + 16 : 300;
      grid.scrollBy({ left: step * parseInt(btn.getAttribute('data-dir'), 10), behavior: 'smooth' });
    });
  });
})();
