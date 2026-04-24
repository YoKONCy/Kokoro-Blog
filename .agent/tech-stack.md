# 技术栈

| 层 | 选型 | 版本策略 |
|---|---|---|
| 框架 | Astro | ^6.x |
| UI 组件 | Svelte 5 | Runes 模式 |
| 样式 | Tailwind CSS v4 | CSS-first 配置（`@theme`） |
| 类型 | TypeScript | strict 模式 |
| 包管理 & 本地运行 | Bun | ^1.x |
| 部署平台 | Cloudflare Pages | Workers runtime |
| 数据库 | Cloudflare D1 | SQLite 兼容 |
| 对象存储 | Cloudflare R2 | S3 兼容 API |
| KV 缓存 | Cloudflare KV | 会话/缓存 |

## 渲染策略

Astro 6 默认 `static`（SSG），需要 SSR 的页面单独标注 `export const prerender = false`。

> ⚠️ Phase 5 已将内容管理迁移到 D1，所有内容页均改为 SSR。

- **SSG 页面**：RSS、静态资源
- **SSR 页面**：首页、文章列表/详情、标签页、关于页、搜索、API 端点、管理后台

## 环境绑定获取方式

Astro v6 弃用了 `Astro.locals.runtime.env`，统一使用 `cloudflare:workers` 模块：

```typescript
import { getDB } from '@/lib/cloudflare/env';
const db = await getDB();
```
