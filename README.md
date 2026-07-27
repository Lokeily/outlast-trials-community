# 逃生试炼社区（玩家共建版）

《逃生：试炼》(The Outlast Trials) 玩家共建攻略小站——复生配装、装备图鉴、新手培养方案、新闻资讯与社区讨论一站直达。

🌐 **在线访问：** https://lokeily.github.io/outlast-trials-community/

---

## 当前赛季

🩸 **第七赛季 · 坟场计划（Project Boneyard）** — 2026-07-14 上线

- 🏚️ 新场景：监狱农场 + 新试验「狱长锁喉」
- 🦷 新敌人：撕咬者（The Biter）
- ♟️ 入侵 2.0：全新植入体负载系统 + 6 种装置
- 📈 升级治疗 2.0：每周主题爬升 + 排行榜
- 🎁 Twitch Drops 掉宝活动 + 献血行动社区活动（至 8 月 25 日）

---

## 页面速览

| 页面 | 缩略图 | 内容 | 评论 |
|------|--------|------|:--:|
| **社区首页** | <img src="assets/images/thumb-index.webp" width="120"> | 新手引导三步路线 + 各板块卡片入口 | — |
| **复生方案** | <img src="assets/images/thumb-rebirth.webp" width="120"> | 工具/技能/药物三大类 3×3 九宫格，红框=推荐 | ✅ |
| **装备图鉴** | <img src="assets/images/thumb-amp.webp" width="120"> | 27 强化剂 + 6 技能装置 + 处方分阶，可筛选 | ✅ |
| **新手小贴士** | <img src="assets/images/thumb-newbie.webp" width="120"> | 培养体系方案 + 避坑指南 + FAQ，含 S7 新系统 | ✅ |
| **新闻资讯** | <img src="assets/images/thumb-news.webp" width="120"> | 赛季更新 + 补丁说明 + 活动倒计时 | — |
| **社区讨论** | <img src="assets/images/thumb-discuss.webp" width="120"> | 全站综合讨论板，无需注册即可留言 | ✅ |

---

## 网站特色

### 🎯 配装攻略
- **复生方案**：红框 / 👍 标注社区推荐项，三大类各 3×3 九宫格直接抄作业
- **装备图鉴**：按核心 / 新手 / 老玩家推荐分类 + 处方按等级筛选，点徽章也能筛选
- **新手小贴士**：四阶段培养路线 + 贴吧老玩家实战经验 + 可折叠 FAQ

### 🔄 自动化功能
- **活动倒计时**：新闻页的献血活动与 Twitch Drops 每天自动更新剩余天数，到期后自动隐藏
- **背景渐进加载**：先显 inline 占位图，主图 onload 后渐显，消除首屏刷出卡顿
- **懒加载评论**：Twikoo 评论按需加载 + IntersectionObserver 预加载，不拖首屏

### 🎨 视觉设计
- 全站官方暗黑血红主题（玻璃拟态 + 微交互 + 跑马灯边框）
- Steam 官方高清宣传画虚化蒙版背景（暗角 + 氛围绕光）
- 移动端动效自动降级，prefers-reduced-motion 全部静止

---

## 参与共建

### 轻量参与（无需技术）
- 💬 到攻略页或社区讨论页底部留言，填 Steam ID 即可（无需注册）
- 📝 发现攻略有误？点任意页面底部「填写反馈问卷」

### 技术参与
- 🐛 开 Issue 报 bug / 提建议
- 🔧 Fork 后提 Pull Request 直接改内容
- 📋 详见 [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 技术栈

| 项目 | 说明 |
|------|------|
| **架构** | 纯静态多页站，每个页面独立 HTML，零构建步骤 |
| **样式** | 单一 CSS 文件 `assets/css/style.css`，CSS 变量驱动主题 |
| **脚本** | 单一 JS 文件 `assets/js/site.js`，零依赖（除评论组件） |
| **评论** | Twikoo（Netlify + MongoDB Atlas 免费后端），国内可用 |
| **托管** | GitHub Pages（主分支自动部署） |
| **图标** | 游戏内真实图标（WebP/PNG 透明底），外链到官方 Wiki |

---

## 本地开发

```bash
# 直接用浏览器打开 index.html 即可预览（离线也能看）
# 或者用任意静态服务器：
npx serve .
```

修改 CSS 或 JS 后直接刷新浏览器，无需构建。

---

## 许可证

内容基于 [CC BY-NC 4.0](LICENSE)。页面内官方强化剂图标版权归 Red Barrels, Inc. 所有，仅作非商业社区攻略用途。

---

*资料截至 2026-07-27 · 第七赛季「坟场计划」*
