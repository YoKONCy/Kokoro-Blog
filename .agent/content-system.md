# 内容管理 + Markdown 渲染

## Content Collections（Astro 6）

配置文件：`src/content.config.ts`（注意不是 `src/content/config.ts`，Astro 6 已移除旧路径）

使用 glob loader 加载文章：

```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    draft: z.boolean().default(false),
    toc: z.boolean().default(true),
  }),
});
```

## 文章文件组织

```
src/content/blog/
├── 2026/
│   ├── my-first-post/          # 文件夹形式（有多个资源时）
│   │   ├── index.md
│   │   ├── hero.webp
│   │   └── diagram.svg
│   └── quick-note.md           # 单文件形式（简短文章）
└── _drafts/                    # 草稿存放
    └── work-in-progress.md
```

## Markdown 插件链

```typescript
// astro.config.mjs → markdown 配置
markdown: {
  syntaxHighlight: 'shiki',
  shikiConfig: {
    themes: { light: 'github-light', dark: 'tokyo-night' },
  },
  remarkPlugins: [
    remarkMath,              // 数学公式
    remarkEmoji,             // Emoji 短码
    remarkReadingTime,       // 阅读时间自动计算
    remarkCustomBlocks,      // 自定义告示块（tip/warning/info）
  ],
  rehypePlugins: [
    rehypeKatex,             // 数学公式渲染
    rehypeSlug,              // 标题 anchor
    rehypeAutolinkHeadings,  // 标题自动链接
    rehypeExternalLinks,     // 外链新窗口 + nofollow
    rehypePrettyCode,        // 代码块增强（行号、高亮行、标题）
  ],
}
```

## MDX 自定义组件映射

```typescript
// src/lib/markdown/components.ts
export const mdxComponents = {
  // HTML 元素覆盖
  img: CustomImage,         // 图片灯箱 + 懒加载
  a: SmartLink,             // 内链/外链自动区分
  pre: CodeBlock,           // 增强代码块（复制按钮、语言标签）
  blockquote: StyledQuote,  // 美化引用块
  table: ResponsiveTable,   // 响应式表格包裹

  // 自定义组件（MDX 中直接使用）
  Callout: CalloutBox,      // 提示框
  LinkCard: LinkPreview,    // 链接卡片预览

  // 【预留】
  AudioPlayer: null,
  VideoPlayer: null,
  ThreeScene: null,
};
```

## 中文排版要点（prose.css）

- 行高 1.85（中文需要比英文更大）
- 代码块：圆角 + 发光边框（二次元风）
- 图片：圆角 + 悬浮阴影
- 链接：下划线滑入动画
- 引用块：左侧彩色边框 + 淡色背景
- 水平线：渐变彩虹线
