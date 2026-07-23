/* 逃生试炼社区 · 滚动进入动效
 * 仅用 transform / opacity（GPU 友好），并在 prefers-reduced-motion 下自动关闭。 */
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // CSS 已保证内容默认可见，无需动画

  var sel = '.reveal, .hero h1, .hero p, .card, .col, .gridwrap, .item, .news-item, ' +
            '.ncard, .tip, .article h2, .article .lead, .callout, .tips, .legend, ' +
            '.contrib, .news-sec h2, .ovcols, .boards';

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll(sel).forEach(function (el) { el.classList.add('in'); });
    return;
  }

  var groups = new Map();
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll(sel).forEach(function (el) {
    el.classList.add('reveal');
    var p = el.parentNode;
    var idx = groups.get(p) || 0;
    groups.set(p, idx + 1);
    el.style.setProperty('--d', (idx * 65) + 'ms');
    io.observe(el);
  });
})();
