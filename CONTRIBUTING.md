# 贡献指南（CONTRIBUTING）

欢迎共建 **「逃生试炼社区」**！《逃生：试炼》(The Outlast Trials) 玩家共建小站，由社区共同维护。

---

## 一、两种参与方式

### 1. 开 Issue（适合报 bug / 提建议）
- 发现文案错误、排版错位、页面加载慢、或想补充内容 → 直接在仓库开 **Issue**。
- 请尽量说明：哪一页、哪一块、什么问题、期望改成什么。

### 2. 提 Pull Request（适合直接改内容，推荐）
1. **Fork** 本仓库到你的账号
2. `git clone` 你的 Fork 到本地
3. 改对应 HTML 文件（见下表）
4. `git commit` 后 `git push` 到你的 Fork
5. 在本仓库发起 **Pull Request**，维护者审核合并

---

## 二、多页结构说明

本站是**多页静态站**，每个页面都是独立 HTML，共享 `assets/css/style.css`，**不需要任何构建步骤**。

| 页面 | 文件 | 主要内容 |
|------|------|----------|
| 社区首页 | `index.html` | 站点入口、页面导航卡片、社区讨论区 |
| 复生方案 | `rebirth.html` | 强化剂配装规划、3×3 九宫格、社区推荐 |
| 新手小贴士 | `newbie.html` | 新手向经验与避坑 |
| 入坑须知 | `getting-started.html` | 游戏类型、平台、买前基础认知 |

### 复生方案页关键 class 含义
- `.cell.pick` / `.item.ok` / `.item.pick`：**红框 / 绿框 / 蓝框** = 已选 / 确定 / 二选一
- `<span class="thumb">👍</span>`：**社区推荐项**（出现在对应图标右下角）
- 新增一个强化剂格子：复制一个 `.cell` 块，改图标 `src`、中文名、英文名即可

---

## 三、修改规范

- **效果描述以官方 Wiki（outlast.fandom.com）为准**，不要凭记忆瞎写。
- 中文为主，专业术语建议中英对照（如 `降噪 NOISE REDUCTION`）。
- 社区推荐（👍）需有依据：贴吧/社区讨论、实战共识，别单独拍脑袋加。
- 新增页面时，记得在 `index.html` 导航和卡片网格里加上入口。
- 提交信息（commit message）写清楚改了什么，例如：
  - `fix: 修正强化效应效果描述`
  - `feat: 在 新手小贴士 增加入侵模式建议`
  - `style: 优化九宫格在平板上的间距`

---

## 四、图标替换规范

所有图标都放在 `assets/icons/` 下，以**相对路径**引用：

```html
<img class="ic" src="assets/icons/Amp_NoiseReduction.png" loading="lazy" alt="降噪">
```

替换或新增图标请按以下步骤：

1. **取图**：只从官方 Wiki（[outlast.fandom.com](https://outlast.fandom.com)）下载对应强化剂 PNG，保持原图透明背景。
2. **放入目录**：把 PNG 放进 `assets/icons/`，文件名建议使用英文 perk 名（如 `Amp_Smash.png`）。
3. **引用**：在 HTML 里写 `<img src="assets/icons/你的文件名.png" loading="lazy" alt="中文名">`。
4. **尺寸**：官方图标多为 64–128px 见方的透明 PNG，显示由 CSS 控制，**无需手动改尺寸**，只要保持 PNG、透明底即可。
5. **校验**：替换后本地打开对应页面，确认图标正常显示、不被红框/👍 遮挡。

> 注意：不要替换成非官方或带水印的图，也不要改用外链（会破坏离线可用性）。

---

## 五、响应式 / 性能注意

- 所有页面已统一使用 `assets/css/style.css` 中的媒体查询，**不要写死 px 宽度导致移动端崩版**。
- 图片请加 `loading="lazy"`（首屏大图除外）。
- 不要重新把图标转回 base64 内嵌——这会直接回到 500KB+ 大文件，抵消跨页缓存。
- 新增外部资源（字体、脚本）时，最好加 `preconnect` 减少阻塞。

---

## 六、本地预览

直接用浏览器打开 `index.html` 即可，离线也能看（图标已放在 `assets/icons/`）。

若改的是 `rebirth.html`、`newbie.html` 或 `getting-started.html`，打开对应文件预览。

---

## 七、成为维护者

PR 被合并多次、且持续稳定贡献者，可联系仓库 owner 申请成为**协作者（Collaborator）**，直接拥有合并权限。

---

感谢每一位让这份攻略更准、更全的贡献者！🎮
