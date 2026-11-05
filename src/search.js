(function () {
  var input = document.getElementById('q');
  var results = document.getElementById('results');
  var browse = document.getElementById('browse');
  if (!input || !results) return;
  var index = null, loading = null;

  function load() {
    if (!loading) {
      loading = fetch(input.getAttribute('data-search-url'))
        .then(function (r) { return r.json(); })
        .then(function (j) { index = j; });
    }
    return loading;
  }

  function score(item, terms) {
    var title = item.title.toLowerCase(), sum = item.summary.toLowerCase(), tags = item.tags.join(' ').toLowerCase();
    var total = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i], s = 0;
      if (title.indexOf(t) !== -1) s += 3;
      if (tags.indexOf(t) !== -1) s += 2;
      if (sum.indexOf(t) !== -1) s += 1;
      if (!s) return 0;
      total += s;
    }
    return total + (item.root ? 0.5 : 0);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function render(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) { results.hidden = true; results.textContent = ''; browse.hidden = false; return; }
    var hits = index.map(function (it) { return { it: it, s: score(it, terms) }; })
      .filter(function (h) { return h.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 30);
    results.textContent = '';
    results.appendChild(el('p', 'muted', hits.length ? hits.length + ' result' + (hits.length === 1 ? '' : 's') : 'No matches. Try a different word.'));
    var ul = el('ul', 'cards');
    hits.forEach(function (h) {
      var li = el('li'), a = el('a', 'card');
      a.href = h.it.url;
      a.appendChild(el('span', 'card-title', h.it.title));
      a.appendChild(el('span', 'card-sum', h.it.summary));
      a.appendChild(el('span', 'card-cat', h.it.category));
      li.appendChild(a); ul.appendChild(li);
    });
    results.appendChild(ul);
    results.hidden = false;
    browse.hidden = true;
  }

  input.addEventListener('input', function () {
    var q = input.value;
    load().then(function () { render(q); }, function () {});
  });
})();
