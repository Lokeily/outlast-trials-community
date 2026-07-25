# 逃生试炼社区（玩家共建版）

《逃生：试炼》(The Outlast Trials) 玩家共建小站，**由社区共同维护**。

🌐 **在线访问：** https://lokeily.github.io/outlast-trials-community/

### 效果图

![社区首页预览](preview.png)

![复生方案预览](preview-rebirth.png)

| 页面 | 文件 | 说明 |
|------|------|------|
| **社区首页** | [index.html](./index.html) | 站点入口，导航到各子页，底部有评论区 |
| **复生方案** | [rebirth.html](./rebirth.html) | 强化剂（Amps）配装规划；三大类各 3×3 九宫格，红框圈出推荐项，👍 = 社区推荐 |
| **新手小贴士** | [newbie.html](./newbie.html) | 新手培养体系方案、开局要点与避坑 |
| **新闻资讯** | [news.html](./news.html) | 游戏简介 + 近期更新 / 补丁（官方英文译中文），追最新版本动态 |
| **社区讨论** | [discuss.html](./discuss.html) | 全站统一的综合讨论板块；各内容页底部另保留「当前页面内容的回复」 |

全站特点：

- 响应式布局，适配 PC、平板、手机
- 图标外链至 `assets/icons/`（浏览器可缓存，跨页复用），不再内嵌 base64
- 每页底部都有**评论区**（Twikoo，无需登录即可匿名留言），可评论、分享配装与心得
- 评论区基于 Twikoo，支持匿名 / QQ / 微信登录，国内用户无需 GitHub 账号即可参与讨论

## 评论系统部署（Twikoo · Netlify + MongoDB Atlas 免费方案）

本站评论用 [Twikoo](https://twikoo.js.org/)，支持**匿名 / QQ / 微信**登录，国内可用、**无需 GitHub 账号**。后端用 **Netlify Functions + MongoDB Atlas（M0 免费集群）**，合计 **0 元/月**（对比腾讯云开发活动价结束后 20 元/月，更省）。

> 前端已替换为精简版 `assets/js/twikoo.min.js`（约 460KB，比全量包小一半多，加载更快）；管理后台仍可单独访问（见下方「管理后台」）。

### 第一步：准备 MongoDB Atlas（免费 M0）

1. 打开 [atlas.mongodb.com](https://www.mongodb.com/atlas) 注册并登录。
2. 新建 **Shared Cluster（M0，免费）**，区域选离国内近的（如 `Singapore`），其余默认。
3. 创建 **Database User**：记好用户名和密码（评论数据存这里，密码别丢）。
4. 进入 **Network Access**，加一条 `0.0.0.0/0`（Allow Access from Anywhere，让 Netlify 函数能连）。
5. 进入集群 **Connect → Drivers**，复制连接串，形如：
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   把 `<password>` 换成你刚设的数据库密码，这就是下一步要用的 `MONGODB_URI`。

### 第二步：把 Twikoo 部署到 Netlify（免费 Functions）

1. 打开 [app.netlify.com](https://app.netlify.com/)，**New site from Git → 授权 GitHub → 选本仓库 `outlast-trials-community`**。
2. Build 设置：**Build command 留空**，**Publish directory 填 `.`**（本站是纯静态站，根目录即发布目录）。
3. 在 Netlify 后台 **Site settings → Environment variables** 新增变量：
   - **Key：`MONGODB_URI`**（注意是 `MONGODB_URI`，不是 `MONGO_URI`，否则会报 `code:1000 未设置环境变量 MONGODB_URI`）
   - **Value：第一步拿到的连接串**（含密码）
4. 点 **Deploy** 触发部署。部署完成后，Functions 列表里会出现 `twikoo`，其访问地址为：
   ```
   https://<你的站点名>.netlify.app/.netlify/functions/twikoo
   ```
   （`<你的站点名>` 即 Netlify 分配的二级域名，可在 Site overview 看到。）

### 第三步：把后端地址回填前端

1. 复制上面的完整函数地址 `https://<你的站点名>.netlify.app/.netlify/functions/twikoo`。
2. 打开 `assets/js/site.js`，把第 14 行的 `TWIKOO_ENV_ID` 改成这个地址：
   ```js
   var TWIKOO_ENV_ID = 'https://<你的站点名>.netlify.app/.netlify/functions/twikoo';
   ```
   > 当前占位值是 `https://outlat-twikoo.netlify.app/...`，**请改成你自己的真实站点名**（Netlify 站点名区分大小写、必须完全匹配，否则评论区会请求失败）。
3. `git commit && git push`，GitHub Pages 会自动重新发布。刷新页面滚到评论区即可看到可输入的评论框。

### 管理后台（审核 / 删评）

- 前台用精简版 `twikoo.min.js`，体积小、加载快。
- 需要审核时，浏览器直接访问：**`https://<你的站点名>.netlify.app/.netlify/functions/twikoo/admin`**，用你部署时设置的密码登录即可（该页面会加载完整版用于管理）。
- 也可在任意页面单独开管理入口：`twikoo.init({ envId, el:'#tcomment', admin:true })`。

### 版本一致 & 费用

- **版本必须同大版本**：前端 `twikoo.min.js` 与后端函数须同为 `1.7.x`，否则报 `code:1001 版本不一致`。升级后端：`npm i twikoo-netlify@x.y.z` 重部署，前端同步换同名压缩包。
- **费用**：MongoDB Atlas M0 永久免费（512MB 存储，社区评利用不完）；Netlify Functions 免费额度 125k 请求/月。合计 **0 元/月**。

## 本地预览

直接用浏览器打开任意 HTML 即可：

- 推荐先看 `index.html`（社区首页）
- 复生方案/强化剂配装对应 `rebirth.html`
- 图标、样式均为相对路径，无需本地服务器

## 如何参与共建

发现错误、想补充强化剂效果、或小贴士？欢迎提交 Issue 或 Pull Request。

- 详细流程、页面结构、样式规范请看 **[CONTRIBUTING.md](./CONTRIBUTING.md)**
- 快速上手：
  1. Fork 本仓库
  2. 改对应页面（如强化剂配装改 `rebirth.html`，新手内容改 `newbie.html`）
  3. 发起 PR，维护者审核合并

图标来自官方 Wiki（outlast.fandom.com），社区建议整理自贴吧讨论。

## 许可协议

本仓库文字与代码以 [CC BY-NC 4.0](./LICENSE) 发布（非商业性，署名）。
页面内官方强化剂图标版权归 Red Barrels, Inc. 所有，仅作非商业社区攻略用途。
