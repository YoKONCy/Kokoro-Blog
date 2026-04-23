# 编码规范

## 命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| Astro 组件 | PascalCase | `PostCard.astro` |
| Svelte 组件 | PascalCase | `ThemeToggle.svelte` |
| 页面文件 | kebab-case | `[...slug].astro` |
| 工具函数 | camelCase | `formatDate()` |
| 类型/接口 | PascalCase | `interface BlogPost` |
| CSS 自定义属性 | kebab-case | `--color-primary` |
| 常量 | UPPER_SNAKE | `MAX_POSTS_PER_PAGE` |

## 导入顺序

```typescript
// 1. Astro/框架
import { getCollection } from 'astro:content';
// 2. 第三方库
import sanitizeHtml from 'sanitize-html';
// 3. 内部模块 — 按层级
import BaseLayout from '@/layouts/BaseLayout.astro';
import PostCard from '@/components/blog/PostCard.astro';
import { formatDate } from '@/lib/date';
import type { BlogPost } from '@/types';
```

## 路径别名

```json
"@/*"           → "src/*"
"@components/*" → "src/components/*"
"@layouts/*"    → "src/layouts/*"
"@lib/*"        → "src/lib/*"
```

## Island 指令规范

| 指令 | 场景 | 示例 |
|------|------|------|
| `client:load` | 立即需要交互 | 主题切换、导航菜单 |
| `client:visible` | 滚动到才需要 | 评论区、文章底部 |
| `client:media` | 特定视口 | 移动端汉堡菜单 |
| `client:idle` | 低优先级 | 点赞、分享按钮 |
| 不加指令 | 纯展示 | Svelte 仅 SSR |

> ⚠️ 禁止给大型组件使用 `client:load`

## API 端点规范

```typescript
export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  // 统一响应格式
  return Response.json({ success: true, data: ... });
};
```

## CSS 规范

- **布局/页面级样式统一放 `src/styles/*.css`**（全局加载），禁止在 `src/pages/*.astro` 中使用 scoped `<style>`（View Transitions 会丢失）
- 全局组件（Header/Footer/Toast/Cursor/CyberPet 等）的样式也必须提取到 `src/styles/` 下
- Svelte 组件优先用 Tailwind class，避免 `<style>` 块（Cloudflare workerd 兼容性问题）
- 自定义类名避免与 Tailwind 内置工具类冲突（如 `hidden`、`block`、`flex` 等），建议使用 `is-` 前缀（如 `is-hidden`）
