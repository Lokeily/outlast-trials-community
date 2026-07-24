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

  // 移动端汉堡菜单（与动效无关，始终启用）
  try { setupMobileMenu(); } catch (e) { /* 忽略 */ }

  // 装备图鉴筛选（与动效无关，始终启用）
  try { setupEquipFilter(); } catch (e) { /* 忽略 */ }

  if (reduce) return; // 已开启"减少动态效果"则不再加任何进入动画

  // 进入动画：给内容块加 .reveal，CSS 动画会自动播放显形（不依赖第二个类，
  // 即使后续 JS 出错也不会卡在隐藏态）。--d 控制自上而下级联节奏
  var sel = '.site-nav, .hero, .ampsec, .cards, .col, .gridwrap, .news-item, ' +
            '.ncard, .tips, .article, .legend, .contrib, #giscus-comments, .site-foot';
  var els = Array.prototype.slice.call(document.querySelectorAll(sel));
  els.forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.setProperty('--d', Math.min(i * 45, 540) + 'ms');
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
  function setupMobileMenu() {
    var nav = document.querySelector('.site-nav');
    var toggle = document.querySelector('.menu-toggle');
    if (!nav || !toggle) return;
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    var links = nav.querySelectorAll('.nav-links a');
    links.forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 装备图鉴筛选：全部 / 核心 / 新手推荐 / 老玩家推荐
  // 点筛选按钮或点卡片上的徽章均可触发；无结果也不留空白。
  function setupEquipFilter() {
    var bar = document.getElementById('eqFilter');
    if (!bar) return;
    var btns = Array.prototype.slice.call(bar.querySelectorAll('.fbtn'));
    var cards = Array.prototype.slice.call(document.querySelectorAll('.ampgrid .itcard'));
    if (!cards.length) return;

    function matches(card, f) {
      if (f === 'all') return true;
      var cls = f === 'core' ? 'core' : (f === 'new' ? 'bnew' : 'bvet');
      return !!card.querySelector('.badge.' + cls);
    }
    function apply(f) {
      // 1) 先显隐卡片
      cards.forEach(function (c) {
        c.classList.toggle('hide', !matches(c, f));
      });
      // 2) 整块无匹配则隐藏该板块标题，避免“空白一片”
      document.querySelectorAll('.ampsec').forEach(function (s) {
        var grid = s.querySelector('.ampgrid');
        if (!grid) return; // 推荐分类 / 组合区始终保留
        var any = grid.querySelector('.itcard:not(.hide)');
        s.style.display = any ? '' : 'none';
      });
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        apply(b.getAttribute('data-filter'));
      });
    });
    // 点卡片徽章 = 直接按该维度筛选
    cards.forEach(function (c) {
      var badges = c.querySelectorAll('.badge');
      badges.forEach(function (bg) {
        bg.addEventListener('click', function (e) {
          e.stopPropagation();
          var key = bg.classList.contains('core') ? 'core'
                  : bg.classList.contains('bnew') ? 'new'
                  : bg.classList.contains('bvet') ? 'vet' : null;
          if (!key) return;
          var btn = bar.querySelector('.fbtn[data-filter="' + key + '"]');
          if (btn) btn.click();
        });
      });
    });
  }
})();
