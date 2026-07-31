// Cloudflare Worker（经典 Service Worker 格式）：每日真实访问计数器 + 实时在线人数
// KV binding 名: VIEWS（在经典格式下作为全局变量直接可用）
// 路径:
//   POST/GET /track?vid=xxx  -> 给「当天(北京时间)」唯一访客 +1（同 vid 当天只计一次），
//                               并刷新该访客的在线会话(5 分钟 TTL)；返回 {date,count,counted,online}
//   GET     /online          -> 返回当前实时在线人数 {online}
//   GET     /stats?days=N    -> 返回最近 N 天 [{date,count}]（供 README 图表使用）
//
// 北京日期 = UTC 时间 +8h 后取日期，保证「每天」按北京时间归并。

const TZ_OFFSET = 8 * 60 * 60 * 1000;     // 北京时间 = UTC+8
const ONLINE_TTL = 300;                    // 在线会话有效期(秒)：最后心跳后 5 分钟算离线
const VISIT_TTL = 25 * 3600;               // 当日访问去重窗口(秒)：约覆盖到次日北京时间结束

function beijingDate(d) {
  const b = new Date(d.getTime() + TZ_OFFSET);
  const y = b.getUTCFullYear();
  const m = String(b.getUTCMonth() + 1).padStart(2, '0');
  const day = String(b.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function json(obj, extraHeaders) {
  return new Response(JSON.stringify(obj), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(extraHeaders || {}),
    },
  });
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 统计在线人数：列出所有 online: 前缀的 key 并计数（KV 列表最终一致，秒级延迟可忽略）
async function countOnline() {
  let n = 0;
  let cursor;
  do {
    const res = await VIEWS.list({ prefix: 'online:', cursor });
    n += res.keys.length;
    cursor = res.list_complete ? undefined : res.cursor;
  } while (cursor);
  return n;
}

async function handle(request, event) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  // ---- 实时在线人数 ----
  if (path === '/online') {
    const online = await countOnline();
    return json({ online }, CORS);
  }

  // ---- 计数埋点（页面加载 + 心跳）----
  if (path === '/track') {
    const referer = request.headers.get('referer') || '';
    const ua = (request.headers.get('user-agent') || '').toLowerCase();
    const fromSite = referer.includes('lokeily.github.io') || referer.includes('outlast');
    const isBot = /bot|crawl|spider|preview|headless|slurp|bingpreview/i.test(ua);
    const today = beijingDate(new Date());
    const vid = url.searchParams.get('vid') || ('anon-' + Math.random().toString(36).slice(2, 8));

    const prev = parseInt((await VIEWS.get(today)) || '0', 10);

    if (!fromSite || isBot) {
      const online = await countOnline();
      return json({ date: today, count: prev, counted: false, online }, CORS);
    }

    // 在线：刷新会话 TTL（每次加载/心跳都刷新；超过 5 分钟无心跳则自动过期）
    event.waitUntil(VIEWS.put('online:' + vid, today, { expirationTtl: ONLINE_TTL }));

    // 当日访问人次：同一访客(vid)当天仅计一次，避免刷新/心跳刷量
    const visitKey = 'visit:' + vid + ':' + today;
    const already = await VIEWS.get(visitKey);
    let count = prev;
    let counted = false;
    if (!already) {
      count = prev + 1;
      counted = true;
      event.waitUntil(Promise.all([
        VIEWS.put(today, String(count)),
        VIEWS.put(visitKey, '1', { expirationTtl: VISIT_TTL }),
      ]));
    }
    // 重新统计在线（含本次刚写入的会话；KV 最终一致，可能略有延迟，下次轮询会补上）
    const online = await countOnline();
    return json({ date: today, count, counted, online }, CORS);
  }

  // ---- 统计读取（公开，供 README 图表使用）----
  if (path === '/stats') {
    const days = Math.min(60, Math.max(7, parseInt(url.searchParams.get('days') || '30', 10)));
    const now = new Date();
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = beijingDate(d);
      const v = parseInt((await VIEWS.get(key)) || '0', 10);
      out.push({ date: key, count: v });
    }
    return json({ days, data: out }, CORS);
  }

  return new Response('Not Found', { status: 404, headers: CORS });
}

addEventListener('fetch', (event) => {
  event.respondWith(handle(event.request, event));
});
