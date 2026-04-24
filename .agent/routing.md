# 路由与 URL 设计

## 前台路由

> ⚠️ Phase 5 已将内容管理迁移到 D1 数据库，所有内容页均改为 **SSR**。

| URL | 页面 | 渲染 | 说明 |
|-----|------|------|------|
| `/` | 首页 | SSR | D1 查询最新文章 + site_settings Hero 配置 |
| `/blog` | 文章列表 | SSR | D1 查询已发布文章 |
| `/blog/2026/post-slug` | 文章详情 | SSR | D1 查询 + 运行时 Markdown 渲染 |
| `/blog/tag/astro` | 标签筛选 | SSR | D1 按标签查询 |
| `/about` | 关于 | SSR | site_settings 读取内容 + Markdown 渲染 |
| `/links` | 友链 | SSR | D1 查询友链列表（待实现） |
| `/search?q=keyword` | 搜索结果 | SSR | D1 FTS5 全文搜索 |
| `/rss.xml` | RSS | SSG | |

## 后台路由

| URL | 页面 | 渲染 |
|-----|------|------|
| `/admin/login` | 登录 | SSR |
| `/admin` | 统计看板 | SSR |
| `/admin/posts` | 文章管理 | SSR |
| `/admin/comments` | 评论管理 | SSR |
| `/admin/links` | 友链管理 | SSR |
| `/admin/settings` | 站点设置 | SSR |
| `/admin/about` | 关于页管理 | SSR |
| `/admin/logout` | 登出（API） | SSR |

## API 路由

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/comments/[...postId]` | GET/POST | 获取/提交评论（rest 参数匹配多级 slug） |
| `/api/search?q=` | GET | 全文搜索 |
| `/api/views/[...slug]` | GET/POST | 获取/增加阅读数 |
| `/api/admin/upload` | POST | 文件上传到 R2（待实现） |

## 年份 URL 实现

使用 Astro rest 参数 `[...slug].astro`，通过 D1 查询匹配 `2026/post-slug`：

```typescript
// src/pages/blog/[...slug].astro
export const prerender = false;

const slug = Astro.params.slug;
const db = await getDB();
const post = await getPublishedPostBySlug(db, slug);
```

> **注意**：已从 Content Collections 迁移到 D1，不再使用 `getStaticPaths()` 和 `getCollection()`。
