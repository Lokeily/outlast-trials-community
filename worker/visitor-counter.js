// Cloudflare Worker：每日真实访问计数器
// KV binding 名: VIEWS
// 路径:
//   POST/GET /track  -> 给「当天(北京时间)」计数 +1，返回 {date,count,counted}
//   GET     /stats?days=N -> 返回最近 N 天 [{date,count}]
//
// 北京日期 = UTC 时间 +8h 后取日期，保证「每天」按北京时间归并。

const TZ_OFFSET = 8 * 60 * 60 * 1000; // 北京时间 = UTC+8

function beijingDate(d) {
  const b = new Date(d.getTime() + TZ_OFFSET);
  const y = b.getUTCFullYear();
  const m = String(b.getUTCMonth() + 1).padStart(2, '0');
  const day = String(b.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function json(obj, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ---- 计数埋点 ----
    if (path === '/track') {
      const referer = request.headers.get('referer') || '';
      const ua = (request.headers.get('user-agent') || '').toLowerCase();
      const fromSite = referer.includes('lokeily.github.io') || referer.includes('outlast');
      const isBot = /bot|crawl|spider|preview|headless|slurp|bingpreview/i.test(ua);
      const today = beijingDate(new Date());
      const prev = parseInt((await env.VIEWS.get(today)) || '0', 10);

      // 只统计来自本站、且非爬虫/预览的真实访问，避免刷量
      if (!fromSite || isBot) {
        return json({ date: today, count: prev, counted: false }, CORS);
      }
      const next = prev + 1;
      ctx.waitUntil(env.VIEWS.put(today, String(next)));
      return json({ date: today, count: next, counted: true }, CORS);
    }

    // ---- 统计读取（公开，供 README 图表使用）----
    if (path === '/stats') {
      const days = Math.min(60, Math.max(7, parseInt(url.searchParams.get('days') || '30', 10)));
      const now = new Date();
      const out = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = beijingDate(d);
        const v = parseInt((await env.VIEWS.get(key)) || '0', 10);
        out.push({ date: key, count: v });
      }
      return json({ days, data: out }, CORS);
    }

    return new Response('Not Found', { status: 404, headers: CORS });
  },
};
