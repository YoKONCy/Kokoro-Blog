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
│   ├── layouts/                    # BaseLayout, PostLayout, AdminLayout
│   ├── lib/
│   │   ├── utils.ts, date.ts, seo.ts
│   │   ├── i18n/                   # 国际化（index.ts, types.ts, locales/zh.ts）
│   │   ├── markdown/               # 自定义渲染（plugins.ts, components.ts）
│   │   └── cloudflare/             # CF 服务封装（d1.ts, kv.ts, r2.ts, search.ts）
│   ├── pages/
│   │   ├── index.astro             # 首页
│   │   ├── about.astro, links.astro
│   │   ├── blog/                   # 文章列表 + [...slug] 详情 + tag/[tag]
│   │   ├── search.astro            # 搜索（SSR）
│   │   ├── admin/                  # 管理后台（login, dashboard, comments, links, analytics）
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
│   │   └── comments.css            # 评论区
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
