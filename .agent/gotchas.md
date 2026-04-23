# 已知坑与解决方案

## 1. Astro 6 Breaking Changes

### `output: 'hybrid'` 已移除
- **症状**：`The output: "hybrid" option has been removed`
- **解决**：删除 `output` 配置。Astro 6 默认 `static`，SSR 页面用 `export const prerender = false`

### Content Collections 路径变更
- **症状**：`Found legacy content config file in "src/content/config.ts"`
- **解决**：移到 `src/content.config.ts`，使用 `glob` loader 替代旧 API

### `post.slug` → `post.id`
- **症状**：文章链接 `/blog/undefined`
- **解决**：Astro 6 glob loader 用 `post.id` 而不是 `post.slug`

## 2. Svelte + Cloudflare Workerd

### `<style>` 块 CSS 解析失败
- **症状**：`Invalid declaration: 'onMount'`（CSS 解析器错误地解析了 JS 代码）
- **原因**：Cloudflare workerd 环境下 vite-plugin-svelte 的 CSS 模块提取异常
- **解决**：Svelte 组件不使用 `<style>` 块，改用 Tailwind 类名 + inline style，或将样式放入全局 CSS

### `node:async_hooks` 警告
- **症状**：`Unexpected Node.js imports for environment "ssr"`
- **解决**：在 `wrangler.jsonc` 中添加 `"nodejs_compat"` 到 `compatibility_flags`

## 3. Astro Scoped CSS + Cloudflare SSR

### 组件 scoped 样式不生效
- **症状**：Header/Footer 的 flex 布局不渲染，元素垂直堆叠
- **原因**：Cloudflare workerd SSR 环境中，Astro scoped CSS 注入顺序异常
- **解决**：布局级样式统一放入 `src/styles/layout.css` 作为全局样式加载

## 4. Bun vs Cloudflare 运行时

### API 差异
- 本地用 Bun runtime，生产是 Cloudflare workerd（基于 V8）
- **规则**：代码中只使用 Web Standard APIs，不用 `Bun.file()` 等 Bun-specific API
- Bun 仅用于：`bun install`、`bun run build`、本地工具脚本

## 5. API 路由与 `post.id` 格式

### `[param]` 不匹配多级路径
- **症状**：`/api/comments/2026/hello-world` 返回 404
- **原因**：`post.id` 是 `2026/hello-world`（含 `/`），`[postId]` 只匹配单级
- **解决**：API 文件名改为 `[...postId].ts`（rest 参数），匹配整个路径

## 6. D1 本地开发

### 本地无 D1 绑定
- **症状**：搜索/评论 API 报错 `DB is undefined`
- **解决**：代码中用 `try/catch` 优雅降级，搜索页显示 "D1 未绑定" 提示
- **未来**：可用 `wrangler d1 create` + 本地 SQLite 模拟

## 7. Astro 6 View Transitions API 变更

### `ViewTransitions` → `ClientRouter`
- **症状**：引入 `import { ViewTransitions } from 'astro:transitions'` 后白屏
- **原因**：Astro 6 将 `ViewTransitions` 组件重命名为 `ClientRouter`
- **解决**：使用 `import { ClientRouter } from 'astro:transitions'`，模板中用 `<ClientRouter />`

## 8. View Transitions + Scoped `<style>` 样式丢失

### 切路由后页面级样式消失
- **症状**：通过 `ClientRouter` 导航后，目标页面的布局/样式全部丢失，需要刷新才恢复
- **原因**：`ClientRouter` 做客户端 DOM swap 时，旧页面的 scoped `<style>` 被移除，新页面的不一定被正确注入
- **解决**：**禁止在 `src/pages/*.astro` 中使用 `<style>` 块**，所有样式提取到 `src/styles/*.css` 全局加载
- **已提取**：`home.css`（首页）、`post.css`（文章详情）、`search.css`（搜索页）、`blog.css`（列表页）

## 9. Tailwind 内置工具类与自定义类名冲突

### `.hidden` 覆盖导致动画失效
- **症状**：给 Header 添加 `.hidden` 类做 `transform` 滑出动画，结果元素瞬间消失，无任何过渡
- **原因**：Tailwind 内置 `.hidden { display: none }` 优先级更高，`display: none` 不支持 CSS 过渡
- **解决**：自定义状态类名使用 `is-` 前缀，如 `.is-hidden`，避免与 Tailwind 工具类撞名
- **通用规则**：绝不使用 `hidden`、`block`、`flex`、`grid`、`fixed`、`absolute` 等 Tailwind 保留名作为自定义类名

## 10. `transform` 创建新包含块 (Containing Block)

### `position: fixed` 子元素定位失效
- **症状**：移动端抽屉 (`position: fixed; inset: 0`) 放在 Header 内，结果不相对视口定位，而是被限制在 Header 的 64px 高度内
- **原因**：Header 使用了 `transform: translate3d(0, 0, 0)` 做 GPU 加速，CSS 规范规定 `transform` 属性会为其后代创建新的包含块
- **解决**：将需要 `position: fixed` 的元素（overlay / drawer）移到带有 `transform` 的父元素外部
- **通用规则**：`position: fixed` 的元素不能嵌套在任何设置了 `transform`、`filter` 或 `will-change: transform` 的祖先内

## 11. View Transitions + `window._xxxBound` 标志位陷阱

### DOM swap 后事件监听器引用失效
- **症状**：首次加载正常，通过 ClientRouter 导航后滚动监听/点击监听全部失效
- **原因**：`window._xxxBound = true` 阻止了 `astro:page-load` 回调中的重新绑定，但旧 DOM 元素引用已在 swap 时被销毁
- **解决**：
  1. 每次 `page-load` 清理旧监听器 → 重新获取新 DOM → 重新绑定
  2. 将函数引用挂在 `window` 上以便 `removeEventListener`
  3. 点击等一次性绑定可通过 `element._clickBound` 防重复（跟随元素生命周期）
- **反模式**：`if (window._bound) return;` ← 永远不要这样做

## 12. View Transitions 导致 Web Font 降级模糊与切页消失

### 切换路由时外部字体短暂消失 & 分辨率极低
- **症状**：在 Header 等全局组件中使用复杂的外部 Web Font（如 Google Fonts 的毛笔字 `Ma Shan Zheng`），在发生路由切换时，字体会短暂闪烁、消失（FOIT），并且在动画过程中文字边缘出现严重锯齿、分辨率极低。
- **原因**：Astro 的 View Transitions API 在切页时会通过浏览器的底层机制抓取当前 DOM 的快照（光栅化为位图 `::view-transition-old`）。在光栅化复杂的 Web Font 时，浏览器经常无法保持原生矢量的高清晰度；同时，DOM 的销毁与重建会导致外部字体重新匹配，引发闪烁。
- **解决**：
  1. 对于 Header、Footer 等**在全站保持不变的全局容器**，必须在其根 HTML 元素上添加 `transition:persist` 指令（如 `<header transition:persist>`）。
  2. 该指令会告诉 Astro 直接在 DOM 树中保留该节点，跳过快照和重建过程，从而保证字体永远保持原生矢量渲染，彻底杜绝切页闪烁和低分辨率锯齿问题。
