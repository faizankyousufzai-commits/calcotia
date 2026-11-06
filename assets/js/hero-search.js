/* Hero search (hub/home pages ONLY — never on tool pages).
   Instant live results scoped to the CURRENT language's tools only.
   The page sets the index URL on the search input's data-search-index
   attribute, e.g. data-search-index="/assets/js/search-index-es.json";
   window.CALCOTIA_SEARCH_INDEX is still honoured as a fallback for pages
   that set it, but no hub sets it any more. Without an index the box stays
   inert (no cross-language results, ever).
   Index format (see search-index-format.md):
     [{ "n": "Title", "s": "one-line description", "u": "/es/slug/", "k": "keywords" }]
   Matching: case- and accent-insensitive substring over n + s + k.
   Empty-results message: read from the search input's data-empty-message
   attribute (one per hub, in that hub's language); falls back to the
   Spanish text when the attribute is absent.
   "×" clear button shows once text is entered; Enter jumps to the first result.
   Copy to site/assets/js/hero-search.js at apply time. */
(function () {
  var box = document.getElementById('heroSearch');
  if (!box) { return; }
  var input = document.getElementById('heroSearchInput');
  var results = document.getElementById('heroSearchResults');
  var clearBtn = document.getElementById('heroSearchClear');
  var indexUrl = (input && input.getAttribute('data-search-index')) || window.CALCOTIA_SEARCH_INDEX || null;
  var entries = null;
  if (indexUrl) {
    fetch(indexUrl).then(function (r) { return r.json(); }).then(function (j) { entries = j; });
  }
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function render(q) {
    results.innerHTML = '';
    if (clearBtn) { clearBtn.hidden = !q; }
    if (!q || !entries) { return; }
    var needle = norm(q.trim());
    if (!needle) { return; }
    var hits = entries.filter(function (e) {
      return norm(e.n + ' ' + e.s + ' ' + e.k).indexOf(needle) > -1;
    }).slice(0, 8);
    if (!hits.length) {
      var emptyMsg = input.getAttribute('data-empty-message') || 'No se encontró ninguna calculadora. Prueba con otra palabra.';
      var empty = document.createElement('div');
      empty.className = 'hero-search-empty';
      empty.textContent = emptyMsg;
      results.appendChild(empty);
      return;
    }
    hits.forEach(function (e) {
      var a = document.createElement('a');
      a.href = e.u;
      a.className = 'hero-search-hit';
      a.innerHTML = '<b></b> <span></span>';
      a.querySelector('b').textContent = e.n;
      a.querySelector('span').textContent = '· ' + e.s;
      results.appendChild(a);
    });
  }
  input.addEventListener('input', function () { render(input.value); });
  box.addEventListener('submit', function (e) { e.preventDefault(); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var first = results.querySelector('a');
      if (first) { location.href = first.href; }
    }
    if (e.key === 'Escape') { input.value = ''; render(''); input.blur(); }
  });
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      input.value = ''; render(''); input.focus();
    });
  }
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.hero-search')) { results.innerHTML = ''; }
  });
})();
