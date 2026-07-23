/* 逃生试炼社区 · 动效
 * 进入动画：整页作为统一的自上而下级联一次性淡入（不挑零散子元素、不滚动触发），
 * 仅用 transform / opacity（GPU 友好）。prefers-reduced-motion 下自动关闭。
 * 跑马灯：仅当新闻项进入视口时才旋转，离开即暂停，避免持续重绘。 */
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // CSS 已保证内容默认可见，无需动画

  // 以"内容块"为单位，确保整块一起淡入，而不是页面里某些元素动、某些不动
  var sel = '.site-nav, .hero, .cards, .col, .gridwrap, .news-item, ' +
            '.ncard, .tips, .article, .legend, .contrib, #giscus-comments, .site-foot';

  var els = Array.prototype.slice.call(document.querySelectorAll(sel));
  els.forEach(function (el, i) {
    el.classList.add('reveal');
    // 顶部先动、向下自然流动；用上限封顶，超长页面也不会拖太久
    el.style.setProperty('--d', Math.min(i * 45, 540) + 'ms');
  });

  // 等首帧绘制出初始态后再加 .in，保证过渡真正播放（而不是瞬间跳变）
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      els.forEach(function (el) { el.classList.add('in'); });
    });
  });

  // 跑马灯仅进入视口时旋转
  var newsItems = document.querySelectorAll('.news-item');
  if (newsItems.length && 'IntersectionObserver' in window) {
    var spin = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target.classList.toggle('inview', e.isIntersecting);
      });
    }, { threshold: 0.05 });
    newsItems.forEach(function (el) { spin.observe(el); });
  }
})();
