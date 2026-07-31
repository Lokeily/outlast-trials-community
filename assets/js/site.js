/* 背景图渐进加载：先显内联 LQIP 占位（秒显），主图下载完再渐显，彻底消除逐块刷出卡顿 */
(function () {
  var bg = new Image();
  var show = function () { if (document.body) document.body.classList.add('bg-ready'); };
  bg.onload = show; bg.onerror = show;
  bg.src = 'assets/images/bg-outlast-hero.jpg';
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

  // 进入动画：先打 .reveal（默认隐藏），滚动进入视口才加 .in 播放，
  // 避免首屏一次性全播、屏下内容在不可见时已播完；--d 控制同屏级联节奏
  var sel = '.site-nav, .hero, .ampsec, .cards, .col, .gridwrap, .news-item, ' +
            '.ncard, .tips, .article, .legend, #comments, .site-foot';
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(sel));
  revealEls.forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.setProperty('--d', Math.min(i * 45, 540) + 'ms');
  });

  if ('IntersectionObserver' in window) {
    var revObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); revObserver.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    revealEls.forEach(function (el) { revObserver.observe(el); });
    // 兜底：极端情况下（如 IO 漏触发）1.8s 后强制显形，杜绝内容卡在隐藏态
    setTimeout(function () { revealEls.forEach(function (el) { el.classList.add('in'); }); }, 1800);
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // 目录滚动高亮（scrollspy）：阅读长文时高亮当前所在小节（仅 newbie 等带目录页生效）
  try { setupScrollSpy(); } catch (e) {}

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
    // Esc 关闭菜单，并把焦点交还汉堡按钮，符合键盘操作预期
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
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

  // 目录滚动高亮（scrollspy）：章节进入“触发带”时，对应 TOC 链接高亮。
  // 仅在 .toc 存在且含 ≥2 个页内锚点时启用（newbie 等长文页），不影响其他页面。
  function setupScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
    if (links.length < 2) return;
    var sections = links.map(function (a) {
      var id = (a.getAttribute('href') || '').slice(1);
      return id ? document.getElementById(id) : null;
    }).filter(Boolean);
    if (sections.length < 2) return;
    var linkOf = {};
    sections.forEach(function (s) {
      linkOf[s.id] = links.filter(function (a) {
        return (a.getAttribute('href') || '').slice(1) === s.id;
      })[0];
    });
    var current = null;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          if (current && linkOf[current]) linkOf[current].classList.remove('active');
          current = e.target.id;
          if (linkOf[current]) linkOf[current].classList.add('active');
        }
      });
    }, { rootMargin: '-84px 0px -68% 0px', threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }
})();

/* 赛季活动倒计时：每天自动更新天数，到期后自动隐藏整张卡片。
   用法：容器加 data-countdown-to="YYYY-MM-DD"，内部 [data-countdown-text] 里的 <b> 会被天数替换。
   到期后整卡 fade out，页面干干净净不留痕迹。 */
(function () {
  var cards = document.querySelectorAll('.ss-card[data-countdown-to]');
  if (!cards.length) return;

  function daysLeft(targetDate) {
    var now = new Date();
    // 取本地日期零点对齐，避免时区偏差
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var end = new Date(targetDate + 'T00:00:00');
    var diff = end.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / 86400000));
  }

  function updateCountdowns() {
    cards.forEach(function (card) {
      var to = card.getAttribute('data-countdown-to');
      if (!to) return;
      var left = daysLeft(to);
      var textEl = card.querySelector('[data-countdown-text]');
      if (left <= 0) {
        card.classList.add('expired');
        // 到期后彻底移除，避免残留占位
        setTimeout(function () {
          if (card.parentNode) card.parentNode.removeChild(card);
        }, 400);
      } else if (textEl) {
        var b = textEl.querySelector('b');
        if (b) b.textContent = left;
      }
    });

    // 所有卡片都过期后隐藏整个状态条
    var container = document.querySelector('.season-status');
    if (container && container.querySelectorAll('.ss-card:not(.expired)').length === 0) {
      container.style.display = 'none';
    }
  }

  updateCountdowns();
})();

/* 访客计数器
 * 已接入 Cloudflare Worker 后端(WORKER_BASE 非空)时：
 *   - 左下角“当前在线访客” = 后台实时并发人数(/online)
 *   - 首页大标题下“今日访问人次” = 后台当日真实累计(按访客去重，/track 返回)
 * 未接入后端(WORKER_BASE 为空)时：降级为本地模拟，保证数字始终可见。
 */
(function () {
  var WORKER_BASE = 'https://outlast-visitors.dz3084614411.workers.dev'; // 真实计数后端（Cloudflare Worker）

  // 稳定的访客 ID：用于后台去重与在线心跳
  function getVid() {
    try {
      var v = localStorage.getItem('otc_vid');
      if (!v) { v = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); localStorage.setItem('otc_vid', v); }
      return v;
    } catch (e) { return 'anon-' + Math.random().toString(36).slice(2, 7); }
  }

  // 数字轮盘切换（左下角“当前在线访客”）
  function makeRoulette(box) {
    return function setNum(n) {
      n = String(n);
      if (!box || box.dataset.cur === n) return;
      box.dataset.cur = n;
      box.style.width = n.length + 'ch';
      var old = box.querySelector('.vc-digit');
      var next = document.createElement('span');
      next.className = 'vc-digit vc-in';
      next.textContent = n;
      box.appendChild(next);
      void next.offsetWidth;
      if (old) {
        old.classList.add('vc-out');
        setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 500);
      } else {
        next.classList.remove('vc-in');
      }
    };
  }

  var onlineBox = document.getElementById('vcOnline');
  var setOnline = makeRoulette(onlineBox);
  var todayEl = document.getElementById('vcToday');
  function setToday(n) { if (todayEl) todayEl.textContent = n; }

  // ============ 真实模式：从 Worker 后端读取实时数据 ============
  if (WORKER_BASE) {
    var vid = getVid();

    function recordVisit() {
      try {
        fetch(WORKER_BASE + '/track?vid=' + encodeURIComponent(vid),
              { method: 'POST', mode: 'cors', keepalive: true, cache: 'no-store' })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (!d) return;
            if (typeof d.count === 'number') setToday(d.count);
            if (typeof d.online === 'number') setOnline(d.online);
          })
          .catch(function () {});
      } catch (e) {}
    }
    function pollOnline() {
      try {
        fetch(WORKER_BASE + '/online', { method: 'GET', mode: 'cors', cache: 'no-store' })
          .then(function (r) { return r.json(); })
          .then(function (d) { if (d && typeof d.online === 'number') setOnline(d.online); })
          .catch(function () {});
      } catch (e) {}
    }

    recordVisit();            // 页面加载即埋点 + 取今日/在线人数
    pollOnline();
    setInterval(recordVisit, 90000); // 每 90s 心跳：维持在线 + 刷新今日人次
    setInterval(pollOnline, 30000);  // 每 30s 拉取实时并发人数
    return;
  }

  // ============ 模拟模式（未接后端时降级，数字仍可见） ============
  (function simulated() {
    var hourWBase = [0.55,0.38,0.20,0.10,0.06,0.05,0.08,0.14,0.20,0.24,0.26,0.30,0.42,0.34,0.32,0.34,0.40,0.55,0.75,0.92,1.00,1.00,0.95,0.78];
    function daySeed() {
      var d = new Date();
      var key = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      var h = 0;
      for (var i = 0; i < key.length; i++) { h = (h * 31 + key.charCodeAt(i)) >>> 0; }
      return h;
    }
    function dayFactor() { var r = (daySeed() % 10000) / 10000; return 0.75 + r * 0.50; }
    function weekdayFactor() {
      var w = new Date().getDay(); var s = daySeed();
      if (w === 0 || w === 6) return 1.55 * (1.10 + (s % 100) / 100 * 0.35);
      if (w === 5) return 1.18 * (0.95 + (s % 100) / 100 * 0.15);
      return 0.85 + (s % 100) / 100 * 0.30;
    }
    function dayOffset() { return (daySeed() % 9) - 4; }
    function trafficNow() {
      var f = dayFactor() * weekdayFactor(); var s = daySeed(); var h = new Date().getHours();
      var jit = ((((s ^ (h * 40503)) >>> 0) % 17) / 17 - 0.5) * 0.24;
      var v = hourWBase[h] * f * (1 + jit);
      return Math.max(0.03, Math.min(2.60, v));
    }
    function baselineFromUv(uv) {
      var w = trafficNow(); var raw = uv * 0.018 * (0.5 + w);
      return Math.max(4, Math.round(raw));
    }
    function baselineFallback() {
      var w = trafficNow(); return Math.max(4, Math.round((15 + Math.random() * 25) * (0.5 + w)));
    }
    var started = false;
    function start(baseline) {
      if (started) return; started = true;
      baseline = baseline + dayOffset();
      var floor = Math.max(1, Math.round(baseline * 0.45));
      var ceil = Math.round(baseline * 1.6) + 4;
      var online = baseline;
      setOnline(online);
      setInterval(function () {
        var step = Math.floor(Math.random() * 9) - 4;
        var pull = (baseline - online) * 0.12;
        online = Math.round(online + step + pull);
        if (online < floor) online = floor + Math.floor(Math.random() * 2);
        if (online > ceil) online = ceil - Math.floor(Math.random() * 2);
        setOnline(online);
      }, 10000);
    }
    function readUv(cb) {
      var span = document.getElementById('busuanzi_value_site_uv');
      var v = span && span.textContent ? parseInt(span.textContent.replace(/[^0-9]/g, ''), 10) : 0;
      if (v > 0) { cb(v); } else { setTimeout(function () { readUv(cb); }, 600); }
    }
    readUv(function (uv) { start(baselineFromUv(uv)); });
    setTimeout(function () { if (!started) start(baselineFallback()); }, 4000);
    // 未接后端时，hero 的“今日访问人次”保持占位（--），避免显示虚假真实数据
  })();
})();

/* 页脚总浏览人次：优先用不蒜子真实累计值；若被拦截/服务异常导致仍为 0，回退到本地计数，避免显示 0 */
(function () {
  function getStored(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function setStored(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function footViews() {
    var el = document.getElementById('busuanzi_value_site_pv');
    if (!el) return;
    var v = parseInt((el.textContent || '').replace(/[^0-9]/g, ''), 10);
    if (v > 0) return; // 不蒜子已填充真实值
    var KEY = 'otc_total_views';
    var n = parseInt(getStored(KEY) || '0', 10);
    if (!n) n = 1280 + Math.floor(Math.random() * 1200); // 合理初始基数
    n += 1;
    setStored(KEY, String(n));
    el.textContent = n.toLocaleString('en-US');
  }
  setTimeout(footViews, 3000); // 不蒜子通常在 3s 内返回，否则启用兜底
  setTimeout(footViews, 6000); // 二次校正：若不蒜子稍晚才返回，真实值会覆盖兜底
})();

