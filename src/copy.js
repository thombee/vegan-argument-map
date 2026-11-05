(function () {
  var btn = document.querySelector('button.copy');
  if (!btn) return;
  btn.hidden = false;
  btn.addEventListener('click', function () {
    var link = new URL(btn.getAttribute('data-url'), location.href).href;
    var done = function () {
      btn.textContent = 'Link copied';
      setTimeout(function () { btn.textContent = 'Copy link'; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(done, function () { window.prompt('Copy this link', link); });
    } else {
      window.prompt('Copy this link', link);
    }
  });
})();
