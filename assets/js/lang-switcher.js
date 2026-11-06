/* Language switcher (Calcilo-exact spec, confirmed 2026-11-06).
   Button = globe icon + two-letter language code + chevron ONLY.
   NO flag in the button; flags appear only in the dropdown rows.
   Opens on CLICK (not hover). Closes on outside click / Escape /
   link click. Chevron flips to ▲ while open. Current language row
   carries .lang-current (blue, set in the markup per page).
   Copy to site/assets/js/lang-switcher.js at apply time. */
(function () {
  var switcher = document.querySelector('.lang-switcher');
  if (!switcher) { return; }
  var btn = switcher.querySelector('.lang-switcher-btn');
  var panel = switcher.querySelector('.lang-panel');
  var caret = btn.querySelector('.nav-caret');
  function setOpen(open) {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (caret) { caret.textContent = open ? '▴' : '▾'; }
  }
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    setOpen(panel.hidden);
  });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) { setOpen(false); }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.lang-switcher')) { setOpen(false); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { setOpen(false); }
  });
})();
