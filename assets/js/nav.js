document.addEventListener('DOMContentLoaded', function () {
  var btn = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (!btn || !nav) return;
  var menus = nav.querySelectorAll('.nav-menu');
  function closeSubmenus() {
    menus.forEach(function (m) {
      m.classList.remove('open');
      var b = m.querySelector('.nav-menu-btn');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  function closeMenu() {
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = '\u2630';
    closeSubmenus();
  }
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? '\u2715' : '\u2630';
    if (!open) closeSubmenus();
  });
  menus.forEach(function (menu) {
    var menuBtn = menu.querySelector('.nav-menu-btn');
    if (!menuBtn) return;
    menuBtn.addEventListener('click', function () {
      // Tap toggle is only for the mobile layout (max-width 1200px), where
      // hover does not exist. On desktop, hover + :focus-within open panels.
      if (window.innerWidth > 1200) return;
      var willOpen = !menu.classList.contains('open');
      closeSubmenus();
      if (willOpen) {
        menu.classList.add('open');
        menuBtn.setAttribute('aria-expanded', 'true');
      }
    });
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu();
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.site-header')) closeMenu();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 1200) closeSubmenus();
  });
});
