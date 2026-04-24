# 项目结构

```
blog/
├── public/
│   ├── fonts/
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── assets/images/
│   ├── components/                 # ← 按功能分组
│   │   ├── ui/                     # 通用 UI（Button, ThemeToggle, Modal, Toast...）
│   │   ├── layout/                 # 布局（Header, Footer, Sidebar, MobileNav）
│   │   ├── blog/                   # 博客（PostCard, TagCloud, TOC, Comments, Like...）
│   │   ├── seo/                    # SEO（BaseHead, JsonLd）
│   │   ├── effects/                # 视觉特效（ParticlesBg, SakuraFall, GlowCard）
│   │   ├── media/                  # 【预留】音视频（AudioPlayer, VideoPlayer）
│   │   └── three/                  # 【预留】3D（Scene）
│   ├── content/
│   │   └── blog/2026/              # 按年份组织的博客文章
│   ├── content.config.ts           # Astro 6 内容集合配置（glob loader）
│   ├── layouts/                    # BaseLayout (AdminLayout 待阶段 F 创建)
│   ├── lib/
│   │   ├── utils.ts, date.ts, seo.ts
│   │   ├── settings.ts              # 站点配置加载器（D1 site_settings + 默认值）
│   │   ├── markdown.ts              # 运行时 Markdown 渲染管线（unified）
│   │   ├── i18n/                   # 国际化（index.ts, types.ts, locales/zh.ts）
│   │   └── cloudflare/             # CF 服务封装
│   │       ├── d1.ts               # D1 CRUD（posts/comments/links/views/settings/sessions）
│   │       ├── env.ts              # 环境绑定 Helper（getDB/getCloudflareEnv）
│   │       └── search.ts           # FTS5 搜索封装
│   ├── pages/
│   │   ├── index.astro             # 首页
│   │   ├── about.astro             # 关于页（site_settings 动态内容）
│   │   ├── search.astro            # 搜索（SSR）
│   │   ├── blog/                   # 文章列表 + [...slug] 详情 + tag/[tag]
│   │   ├── admin/                  # 管理后台
│   │   │   ├── login.astro         # 登录
│   │   │   ├── logout.ts           # 登出
│   │   │   ├── index.astro         # 统计看板
│   │   │   ├── comments.astro      # 评论管理
│   │   │   ├── links.astro         # 友链管理
│   │   │   ├── settings.astro      # 站点设置
│   │   │   └── about.astro         # 关于页管理
│   │   ├── rss.xml.ts
│   │   └── api/                    # API 端点
│   ├── middleware.ts               # 鉴权中间件
│   ├── styles/                     # 全局样式（禁止页面级 scoped style）
│   │   ├── global.css              # 设计令牌、暗色模式、基础排版、骨架屏、CyberPet
│   │   ├── layout.css              # Header、Footer、Mobile Drawer
│   │   ├── prose.css               # Markdown 渲染 + 代码块增强器 + Callouts
│   │   ├── transitions.css         # 页面过渡动画 + NProgress 进度条
│   │   ├── home.css                # 首页 Hero + 卡片网格
│   │   ├── post.css                # 文章详情页承托板
│   │   ├── blog.css                # 博客列表/标签页
│   │   ├── search.css              # 搜索页
│   │   ├── cursor.css              # 自定义鼠标指针
│   │   ├── toast.css               # Toast 通知气泡
│   │   ├── comments.css            # 评论区
│   │   └── admin.css               # 管理后台统一样式（复用主站 design tokens）
│   └── types/                      # env.d.ts, cloudflare.d.ts
├── db/
│   ├── schema.sql
│   └── migrations/
├── .agent/                         # 本文档目录
├── astro.config.mjs
├── tsconfig.json
├── wrangler.jsonc
└── package.json
```

## 组件分类原则

- **Astro 组件（.astro）**：无 JS 运行时的静态渲染组件
- **Svelte 组件（.svelte）**：需要交互的客户端组件（Island）
- 按**功能域**而非技术分组，因为同一功能的组件经常一起修改
