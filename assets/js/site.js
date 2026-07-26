/* 背景图渐进加载：先显内联 LQIP 占位（秒显），主图下载完再渐显，彻底消除逐块刷出卡顿 */
(function () {
  var bg = new Image();
  var show = function () { if (document.body) document.body.classList.add('bg-ready'); };
  bg.onload = show; bg.onerror = show;
  bg.src = '../images/bg-outlast-hero.jpg';
})();

/* 逃生试炼社区 · 动效与性能
 * - 入场淡入：所有设备都保留（移动端 CSS 已降级为仅淡入、不位移，轻量不卡）
 * - 跑马灯旋转 / 毛玻璃 / 光泽扫过：仅 PC 启用，移动端静止或关闭（见 style.css）
 * - Twikoo 评论（匿名/QQ/微信，Netlify + MongoDB Atlas 免费后端）按需懒加载，国内可用、无需 GitHub；公网站点用精简版 twikoo.min.js
 * prefers-reduced-motion 下全部静止 */
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');

  // Twikoo 环境 ID（后端无关，按所选后端填对应值即可）：
  //   Netlify     → https://你的站点.netlify.app/.netlify/functions/twikoo  （本站采用，配套 MongoDB Atlas）
  //   CloudBase    → 环境 ID 字符串，如 outlast-community-abc123
  //   HuggingFace → https://xxx-xxx.hf.space
  var TWIKOO_ENV_ID = 'https://outlat-twikoo.netlify.app/.netlify/functions/twikoo';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;

  // 评论懒加载（各端都做，省首屏开销）；包一层 try 防止异常阻断下方动画
  try { setupTwikoo(); } catch (e) { /* 忽略，不影响页面 */ }

  // 移动端汉堡菜单（与动效无关，始终启用）
  try { setupMobileMenu(); } catch (e) { /* 忽略 */ }

  // 导航滚动态（功能性，始终启用）
  try { setupNavScroll(); } catch (e) { /* 忽略 */ }

  // 回到顶部按钮（功能性控件，始终启用，不依赖动效）
  try { setupBackToTop(); } catch (e) { /* 忽略 */ }

  // 装备图鉴筛选（与动效无关，始终启用）
  try { setupEquipFilter(); } catch (e) { /* 忽略 */ }

  if (reduce) return; // 已开启"减少动态效果"则不再加任何进入动画

  // 进入动画：给内容块加 .reveal，CSS 动画会自动播放显形（不依赖第二个类，
  // 即使后续 JS 出错也不会卡在隐藏态）。--d 控制自上而下级联节奏
  var sel = '.site-nav, .hero, .ampsec, .cards, .col, .gridwrap, .news-item, ' +
            '.ncard, .tips, .article, .legend, #comments, .site-foot';
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

  // Twikoo 评论：匿名或 QQ/微信登录，Netlify + MongoDB Atlas 免费后端，国内顺畅、无需 GitHub。
  // 后端环境 ID 见上方 TWIKOO_ENV_ID（部署步骤见仓库 README）。
  function setupTwikoo() {
    var mount = document.getElementById('tcomment');
    if (!mount) return;
    // 提前预加载：页面加载完成后空闲即拉取评论，用户浏览内容时后台已就绪，
    // 滚到评论区不再空白等待（彻底解决「滚到才加载、一卡两三秒」）
    var preload = function () {
      if ('requestIdleCallback' in window) requestIdleCallback(initTwikoo, { timeout: 2500 });
      else setTimeout(initTwikoo, 1000);
    };
    if (document.readyState === 'complete') preload();
    else window.addEventListener('load', preload);
    // 视口兜底：更大提前量，确保任何情况下进入视口前已开始加载
    if (!('IntersectionObserver' in window)) { initTwikoo(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { initTwikoo(); io.disconnect(); }
      });
    }, { rootMargin: '1200px 0px' });
    io.observe(mount);
  }
  function initTwikoo() {
    var mount = document.getElementById('tcomment');
    if (!mount || mount.dataset.ready) return;
    if (!window.twikoo) { window.addEventListener('load', initTwikoo); return; }
    mount.dataset.ready = '1';
    window.twikoo.init({ envId: TWIKOO_ENV_ID, el: '#tcomment', lang: 'zh-CN' });
    watchTwikooNickField(mount);
  }
  // 把评论区昵称输入框改为「Steam ID」风格提示。
  // 邮箱/网址输入框已通过后端配置 DISPLAYED_FIELDS=nick 隐藏，昵称必填由 REQUIRED_FIELDS=nick 控制。
  // 回复框是动态生成的，所以用 MutationObserver 持续打补丁。
  function watchTwikooNickField(mount) {
    function patch() {
      var inputs = mount.querySelectorAll('input[name="nick"]');
      for (var i = 0; i < inputs.length; i++) {
        var inp = inputs[i];
        if (inp.dataset.steamPatched) continue;
        inp.dataset.steamPatched = '1';
        inp.placeholder = '填入 Steam ID 名称（必填）';
        var group = inp.closest('.el-input-group');
        var prepend = group && group.querySelector('.el-input-group__prepend');
        if (prepend) prepend.textContent = 'Steam ID';
      }
    }
    patch();
    if ('MutationObserver' in window) {
      new MutationObserver(patch).observe(mount, { childList: true, subtree: true });
    } else {
      setInterval(patch, 1500);
    }
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


  // 导航滚动态：滚动超过阈值后加深毛玻璃 + 发光底线
  function setupNavScroll() {
    var nav = document.querySelector('.site-nav');
    if (!nav) return;
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = window.scrollY || document.documentElement.scrollTop || 0;
        nav.classList.toggle('scrolled', y > 24);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 回到顶部：滚动超过一屏后浮现，点击平滑回顶（rAF 节流，零依赖）
  function setupBackToTop() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'to-top';
    btn.setAttribute('aria-label', '回到顶部');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7-7 7 7"/></svg>';
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(btn);
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = window.scrollY || document.documentElement.scrollTop || 0;
        btn.classList.toggle('show', y > 600);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 装备图鉴筛选：每个板块各自独立的筛选条，互不干扰。
  //  - 强化剂 / 技能装置：全部 / 核心 / 新手推荐 / 老玩家推荐（按卡片徽章）
  //  - 处方：全部 / 等级一 / 等级二 / 等级三（按 rxcard 的 data-tier）
  // 点筛选按钮或点卡片上的徽章均可触发；无结果也不留空白。
  function setupEquipFilter() {
    var bars = Array.prototype.slice.call(document.querySelectorAll('.filterbar'));
    bars.forEach(function (bar) {
      var section = bar.closest ? bar.closest('.ampsec') : null;
      if (!section) return;
      var btns = Array.prototype.slice.call(bar.querySelectorAll('.fbtn'));
      if (!btns.length) return;

      var isRx = section.classList.contains('rxsec');
      var cards = Array.prototype.slice.call(section.querySelectorAll('.itcard'));
      if (!cards.length) return;

      function matches(card, f) {
        if (f === 'all') return true;
        if (isRx) return ('tier' + card.getAttribute('data-tier')) === f; // 处方按等级筛选（data-tier="1|2|3" "tier1|2|3"）
        var cls = f === 'core' ? 'core' : (f === 'new' ? 'bnew' : 'bvet');
        return !!card.querySelector('.badge.' + cls);
      }
      function apply(f) {
        cards.forEach(function (c) {
          c.classList.toggle('hide', !matches(c, f));
        });
        // 处方：整阶无匹配时隐藏该 tier 区块，避免“空标题”
        if (isRx) {
          section.querySelectorAll('.tierblock').forEach(function (tb) {
            var any = tb.querySelector('.itcard:not(.hide)');
            tb.classList.toggle('hide', !any);
          });
        }
      }
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          btns.forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active');
          apply(b.getAttribute('data-filter'));
        });
      });
      // 点卡片徽章 = 直接按该维度筛选（仅强化剂 / 技能装置有徽章）
      if (!isRx) {
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
    });
  }
})();
