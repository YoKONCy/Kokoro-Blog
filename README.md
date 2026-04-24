<div align="center">

# 🌸 Kokoro — 赛博毛玻璃博客

[![Astro](https://img.shields.io/badge/Astro-6.x-BC52EE?logo=astro&logoColor=white)](https://astro.build)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

一款运行在 Cloudflare 边缘网络上的全栈博客系统。
Glassmorphism 2.0 视觉设计，D1 数据库驱动，自带管理后台，开箱即用。

[在线演示](https://example.pages.dev) · [快速开始](#-快速开始) · [部署指南](#-部署到-cloudflare)

</div>

---

## ✨ 特性

- **🎨 赛博毛玻璃 UI** — Glassmorphism + 动态光晕 + 自定义粒子光标，暗色/亮色双主题
- **⚡ 边缘渲染** — 基于 Cloudflare Workers，全球 300+ 节点，冷启动 < 50ms
- **📝 管理后台** — 内置完整的文章/评论/友链/设置管理，CodeMirror 6 编辑器 + R2 图床
- **🔍 全文搜索** — 基于 D1 FTS5 的中英文全文检索
- **💬 评论系统** — 原生评论模块，支持嵌套回复、IP 限流、审核管理
- **🌐 i18n 就绪** — 内置中文语言包，可扩展多语言
- **🚀 一键初始化** — 部署后首次访问自动引导 `/setup` 向导，零命令行建表
- **📱 响应式** — 从移动端到 4K 桌面端完美适配

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | [Astro 6](https://astro.build) + 群岛架构 |
| 样式 | [Tailwind CSS 4](https://tailwindcss.com) + 手写 CSS 设计系统 |
| 交互岛屿 | [Svelte 5](https://svelte.dev) |
| 部署平台 | [Cloudflare Pages](https://pages.cloudflare.com) + Workers |
| 数据库 | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite at Edge) |
| 对象存储 | [Cloudflare R2](https://developers.cloudflare.com/r2/) |
| Markdown | Unified / Remark / Rehype + highlight.js 客户端高亮 |

## 📂 项目结构

```
├── db/                  # 数据库 Schema（供高级用户手动执行）
├── public/              # 静态资源
├── src/
│   ├── components/      # UI / Blog / Layout / Admin 组件
│   ├── layouts/         # 页面布局
│   ├── lib/             # 工具函数、D1 封装、i18n、SEO
│   ├── middleware.ts     # 鉴权 + 初始化检测中间件
│   ├── pages/           # 路由页面
│   └── styles/          # 全局样式 & 设计 Token
├── astro.config.mjs
├── wrangler.jsonc       # Cloudflare 绑定配置
└── package.json
```

## 🚀 快速开始

### 环境要求

- Node.js ≥ 22.12
- npm / pnpm / bun

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/YoKONCy/Kokoro-Blog.git
cd Kokoro-Blog

# 安装依赖
npm install

# 启动开发服务器（含 D1 本地模拟）
npx wrangler dev
```

访问 `http://localhost:8787`，首次启动会自动跳转到 `/setup` 初始化向导。

> **提示**：使用 `npx wrangler dev` 而非 `npm run dev`，前者会模拟完整的 Cloudflare 运行时（D1、R2 绑定）。

## ☁️ 部署到 Cloudflare

### 1. 创建云端资源

```bash
# 登录 Cloudflare
npx wrangler login

# 创建 D1 数据库
npx wrangler d1 create kokoro-blog-db
# → 记下输出的 database_id

# 创建 R2 存储桶
npx wrangler r2 bucket create kokoro-blog-uploads
```

将获得的 `database_id` 填入 `wrangler.jsonc`：

```jsonc
"d1_databases": [{
  "binding": "DB",
  "database_name": "kokoro-blog-db",
  "database_id": "你的 database_id"  // ← 替换这里
}]
```

### 2. 部署

**方式 A — GitHub 自动部署（推荐）**

1. 将代码推送到 GitHub
2. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → Create → Pages → Connect to Git
3. 选择仓库，构建配置：Framework `Astro`，Build command `npm run build`，Output `dist`
4. 在 Settings → Bindings 中绑定 D1（变量名 `DB`）和 R2（变量名 `BUCKET`）

**方式 B — CLI 直接推送**

```bash
npm run build
npx wrangler pages deploy dist --project-name kokoro-blog
```

部署后在 Dashboard 中补充 Bindings 即可。

### 3. 初始化

部署完成后访问你的站点，系统会自动跳转到 `/setup` 向导页面。
设置网站名称和管理员密码（默认 `admin123`），点击提交即完成全部初始化。

管理后台入口：`https://你的域名/admin/login`

## 🔧 配置说明

| 配置项 | 位置 | 说明 |
|--------|------|------|
| 站点名称 / Logo | `/admin` 后台设置 | 运行时可动态修改 |
| 管理员密码 | `/setup` 初始化时设定 | SHA-256 哈希存储于 D1 |
| 背景图 | `public/images/kokoro1.webp` | 替换此文件即可更换全局背景 |
| 语言包 | `src/lib/i18n/locales/` | 新增语言文件并注册即可 |
| 数据库 Schema | `db/schema.sql` | 高级用户可手动执行 |

## 📜 License

[MIT](LICENSE) — 自由使用，随心改造。

---

<div align="center">

以 ♥ 构建，运行于 Cloudflare 边缘网络

</div>
