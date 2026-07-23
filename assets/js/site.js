/* 逃生试炼社区 · 动效与性能
 * - 入场淡入：所有设备都保留（移动端 CSS 已降级为仅淡入、不位移，轻量不卡）
 * - 跑马灯旋转 / 毛玻璃 / 光泽扫过：仅 PC 启用，移动端静止或关闭（见 style.css）
 * - Giscus 评论按需懒加载，移除首屏重型 iframe
 * prefers-reduced-motion 下全部静止 */
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;

  // 评论懒加载（各端都做，省首屏开销）；包一层 try 防止异常阻断下方动画
  try { setupGiscus(); } catch (e) { /* 忽略，不影响页面 */ }

  if (reduce) return; // 已开启"减少动态效果"则不再加任何进入动画

  // 整页作为统一的自上而下级联一次性淡入（不挑零散子元素、不滚动触发）
  var sel = '.site-nav, .hero, .cards, .col, .gridwrap, .news-item, ' +
            '.ncard, .tips, .article, .legend, .contrib, #giscus-comments, .site-foot';
  var els = Array.prototype.slice.call(document.querySelectorAll(sel));
  els.forEach(function (el, i) {
    el.classList.add('reveal');
    // 顶部先动、向下自然流动；上限封顶，超长页面也不会拖太久
    el.style.setProperty('--d', Math.min(i * 45, 540) + 'ms');
  });
  // 等首帧绘制出初始态后再加 .in，保证过渡真正播放
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      els.forEach(function (el) { el.classList.add('in'); });
    });
  });

  // 跑马灯仅 PC 启用：进入视口才旋转，离开即暂停，避免持续重绘
  if (!isMobile) {
    var newsItems = document.querySelectorAll('.news-item');
    if (newsItems.length && 'IntersectionObserver' in window) {
      var spin = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.target.classList.toggle('inview', e.isIntersecting); });
      }, { threshold: 0.05 });
      newsItems.forEach(function (el) { spin.observe(el); });
    }
  }

  function setupGiscus() {
    var mount = document.querySelector('.giscus[data-giscus-lazy]');
    if (!mount) return;
    if (!('IntersectionObserver' in window)) { loadGiscus(mount); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { loadGiscus(mount); io.disconnect(); }
      });
    }, { rootMargin: '600px 0px' });
    io.observe(mount);
  }
  function loadGiscus(mount) {
    var s = document.createElement('script');
    s.src = 'https://giscus.app/client.js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    var attrs = ['repo', 'repo-id', 'category', 'category-id', 'mapping', 'term', 'strict',
                 'reactions-enabled', 'emit-metadata', 'input-position', 'theme', 'lang'];
    attrs.forEach(function (a) {
      var v = mount.getAttribute('data-' + a);
      if (v !== null && v !== '') s.setAttribute('data-' + a, v);
    });
    mount.appendChild(s);
  }
})();
