# 路由与 URL 设计

## 前台路由

| URL | 页面 | 渲染 |
|-----|------|------|
| `/` | 首页 | SSG |
| `/blog` | 文章列表 | SSG |
| `/blog/2026/post-slug` | 文章详情 | SSG |
| `/blog/tag/astro` | 标签筛选 | SSG |
| `/about` | 关于 | SSG |
| `/links` | 友链 | SSG/SSR |
| `/search?q=keyword` | 搜索结果 | SSR |
| `/rss.xml` | RSS | SSG |

## 后台路由

| URL | 页面 | 渲染 |
|-----|------|------|
| `/admin/login` | 登录 | SSR |
| `/admin` | 仪表盘 | SSR |
| `/admin/comments` | 评论管理 | SSR |
| `/admin/links` | 友链管理 | SSR |
| `/admin/analytics` | 访问统计 | SSR |

## API 路由

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/comments/{postId}` | GET/POST | 获取/提交评论 |
| `/api/search?q=` | GET | 全文搜索 |
| `/api/views/{slug}` | POST | 增加阅读数 |
| `/api/admin/auth` | POST | 管理登录 |
| `/api/admin/links` | CRUD | 友链管理 |
| `/api/upload` | POST | 文件上传到 R2 |

## 年份 URL 实现

使用 Astro rest 参数 `[...slug].astro`，自动匹配 `2026/post-slug`：

```typescript
// src/pages/blog/[...slug].astro
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.id },  // Astro 6 用 post.id
    props: { post },
  }));
}
```

> **注意**：Astro 6 Content Collections（glob loader）使用 `post.id` 而非 `post.slug`。
