#!/usr/bin/env python3
# 读取计数后端 /stats，绘制最近 N 天「每日浏览人数」柱状曲线 SVG。
# 用法: STATS_URL=https://xxx.workers.dev/stats python3 gen_chart.py
import os, json, urllib.request, datetime

STATS_URL = os.environ.get("STATS_URL", "")
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "visitors-chart.svg")

def fetch_stats():
    if not STATS_URL:
        raise SystemExit("缺少环境变量 STATS_URL（计数后端 /stats 地址）")
    req = urllib.request.Request(STATS_URL, headers={"User-Agent": "github-actions"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))

def build_svg(data):
    W, H = 760, 300
    pad_l, pad_r, pad_t, pad_b = 48, 18, 36, 46
    plot_w = W - pad_l - pad_r
    plot_h = H - pad_t - pad_b
    n = len(data)
    maxv = max([d["count"] for d in data] + [1])
    # y 轴上取整到友好刻度
    step = max(1, int(round(maxv / 5)))
    ymax = max(step, ((maxv + step - 1) // step) * step)

    parts = []
    parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">')
    # 背景
    parts.append(f'<rect width="{W}" height="{H}" fill="#0f1113"/>')
    # 标题
    today = data[-1]["date"] if data else ""
    parts.append(f'<text x="{pad_l}" y="22" fill="#e8e8e8" font-size="15" font-weight="700">每日浏览人数曲线（真实数据 · 截至 {today}）</text>')

    # 网格 + y 轴刻度
    for i in range(6):
        yv = ymax * i // 5
        y = pad_t + plot_h - (plot_h * i / 5)
        parts.append(f'<line x1="{pad_l}" y1="{y:.1f}" x2="{W-pad_r}" y2="{y:.1f}" stroke="#22262b" stroke-width="1"/>')
        parts.append(f'<text x="{pad_l-8}" y="{y+4:.1f}" fill="#7a8089" font-size="10" text-anchor="end">{yv}</text>')

    # 柱子
    bw = plot_w / n
    bar_w = max(2, bw * 0.62)
    for i, d in enumerate(data):
        x = pad_l + i * bw + (bw - bar_w) / 2
        h = (d["count"] / ymax) * plot_h if ymax else 0
        y = pad_t + plot_h - h
        # 周末(周五六日)用更亮红，平日暗红
        wk = datetime.date.fromisoformat(d["date"]).weekday()
        fill = "#ff3b4e" if wk >= 4 else "#b3263a"
        parts.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bar_w:.1f}" height="{h:.1f}" rx="2" fill="{fill}"><title>{d["date"]}: {d["count"]} 人</title></rect>')
        # x 轴标签：每 5 天标一次（M/D）
        if i % 5 == 0 or i == n - 1:
            md = d["date"][5:]
            parts.append(f'<text x="{x+bw/2:.1f}" y="{H-pad_b+16}" fill="#7a8089" font-size="9" text-anchor="middle">{md}</text>')
    # 轴线
    parts.append(f'<line x1="{pad_l}" y1="{pad_t+plot_h}" x2="{W-pad_r}" y2="{pad_t+plot_h}" stroke="#3a3f47" stroke-width="1"/>')
    parts.append(f'<text x="{W-pad_r}" y="{H-6}" fill="#5a6069" font-size="9" text-anchor="end">红=周五六日 · 数据由 Cloudflare Worker + KV 统计</text>')
    parts.append('</svg>')
    return "\n".join(parts)

def main():
    stats = fetch_stats()
    svg = build_svg(stats.get("data", []))
    out_path = os.path.abspath(OUT)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(svg)
    print("written:", out_path, "days:", len(stats.get("data", [])))

if __name__ == "__main__":
    main()
