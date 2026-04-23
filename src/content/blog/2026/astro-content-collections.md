---
title: "Astro 6 内容集合全面指南"
description: "深入探索 Astro 6 的 Content Collections 新特性，从 glob loader 到类型安全的内容管理"
pubDate: 2026-04-22
tags: ["astro", "技术", "前端"]
category: "技术"
---

## 什么是 Content Collections？

Content Collections 是 Astro 提供的一套**类型安全的内容管理方案**。它允许你在项目中组织 Markdown/MDX 文件，并通过 Zod Schema 进行数据校验。

### Astro 6 的变化

Astro 6 对 Content Collections 做了重大更新：

1. 配置文件从 `src/content/config.ts` 移到 `src/content.config.ts`
2. 引入了 **glob loader** 替代旧的隐式文件扫描
3. `post.slug` 改为 `post.id`

### 代码示例

```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});
```

### 查询文章

```typescript
import { getCollection } from 'astro:content';

const posts = await getCollection('blog', ({ data }) => !data.draft);
```

> 新的 Content Collections API 更加灵活，支持从任意来源加载内容。

这让我们可以轻松地管理博客文章，同时保持完整的类型安全。
