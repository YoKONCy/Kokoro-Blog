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

[在线演示](https://youkong.life) · [快速开始](#-快速开始) · [部署指南](#-部署到-cloudflare)

<br/>

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/YoKONCy/Kokoro-Blog)

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
├── wrangler.jsonc           # Cloudflare 绑定配置（需自行创建，含 database_id）
├── wrangler.example.jsonc   # ↑ 的模板文件
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

# 从模板创建配置文件
cp wrangler.example.jsonc wrangler.jsonc

# 启动开发服务器（含 D1 本地模拟）
npx wrangler dev
```

访问 `http://localhost:8787`，首次启动会自动跳转到 `/setup` 初始化向导。

> **提示**：本地开发无需真实的 `database_id`，Wrangler 会自动创建本地 SQLite 模拟 D1。

## ☁️ 部署到 Cloudflare

### 1. 创建云端资源

```bash
# 登录 Cloudflare
npx wrangler login

# 创建 D1 数据库
npx wrangler d1 create my-blog-db
# → 记下输出的 database_id

# （可选）创建 R2 存储桶，用于图片上传
npx wrangler r2 bucket create my-blog-uploads
```

### 2. 配置 wrangler.jsonc

```bash
cp wrangler.example.jsonc wrangler.jsonc
```

编辑 `wrangler.jsonc`，填入你的真实信息：

```jsonc
{
  "name": "your-project-name",    // ← 你的项目名
  "d1_databases": [{
    "binding": "DB",
    "database_name": "my-blog-db",           // ← 第 1 步创建的数据库名
    "database_id": "xxxxxxxx-xxxx-xxxx-xxxx" // ← 第 1 步输出的 ID
  }]
}
```

> **注意**：`database_id` 不是敏感信息，可以安全地提交到 Git。

### 3. 部署

**方式 A — GitHub 自动部署（推荐）**

1. 将代码（含 `wrangler.jsonc`）推送到 GitHub
2. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → Create → Pages → Connect to Git
3. 选择仓库，Framework 选 `Astro`，其余保持默认
4. 推送代码即自动部署，D1 绑定由 `wrangler.jsonc` 自动生效

**方式 B — CLI 直接推送**

```bash
npm run build
npx wrangler pages deploy dist
```

### 4. 初始化

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
