# 内容管理 + Markdown 渲染

## 内容存储（D1 数据库）

> ⚠️ Phase 5 已将内容管理从 Content Collections 迁移到 D1 数据库。
> `src/content/` 目录保留用于构建时类型生成，但前台页面不再使用 `getCollection()`。

所有文章存储在 D1 `posts` 表中，通过 `src/lib/cloudflare/d1.ts` 的 CRUD 函数访问：

```typescript
import { getPublishedPosts, getPublishedPostBySlug, parseTags } from '@/lib/cloudflare/d1';
import { getDB } from '@/lib/cloudflare/env';

const db = await getDB();
// 分页查询：返回 { items, total }
const { items: posts, total } = await getPublishedPosts(db, 12, 0);
const post = await getPublishedPostBySlug(db, slug);
```

### 文章数据模型

| 字段 | 类型 | 说明 |
|------|------|------|
| slug | TEXT | URL 标识，如 `2026/hello-world` |
| title | TEXT | 标题 |
| description | TEXT | SEO 摘要 |
| content | TEXT | Markdown 原文 |
| hero_image | TEXT | 封面图（R2 URL） |
| tags | TEXT | JSON 数组 `'["astro","blog"]'` |
| status | TEXT | `draft` / `published` |

## Markdown 运行时渲染

文章 Markdown 不再由 Astro 构建时渲染，而是通过 `unified` 管线在 SSR 时实时处理：

```typescript
// src/lib/markdown.ts
import { renderMarkdown } from '@/lib/markdown';

const html = await renderMarkdown(post.content);
```

### 渲染管线插件

```typescript
// unified 管线配置
remarkPlugins: [
  remarkMath,              // 数学公式
  remarkGfm,               // GitHub Flavored Markdown
],
rehypePlugins: [
  rehypeSlug,              // 标题 anchor
  rehypeAutolinkHeadings,  // 标题自动链接
  rehypeKatex,             // 数学公式渲染
  rehypePrettyCode,        // 代码块增强（行号、高亮行）
]
```

## Content Collections（遗留，仅类型生成）

配置文件：`src/content.config.ts`

Content Collections 仍保留，但仅用于 Astro 构建时的类型生成。
前台页面和管理后台均直接查询 D1 `posts` 表。

## 站点配置（site_settings）

关于页、首页 Hero、站点标题等动态配置存储在 `site_settings` 表中：

```typescript
import { loadSiteConfig } from '@/lib/settings';

const config = await loadSiteConfig(db);
const title = config.get('site.title');
const aboutContent = config.get('about.content');
```

## 中文排版要点（prose.css）

- 行高 1.85（中文需要比英文更大）
- 代码块：圆角 + 发光边框（二次元风）
- 图片：圆角 + 悬浮阴影
- 链接：下划线滑入动画
- 引用块：左侧彩色边框 + 淡色背景
- 水平线：渐变彩虹线
