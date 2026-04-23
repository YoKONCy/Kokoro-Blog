# 🔍 YoukongLife 博客性能分析报告

> Astro 官方说"使用 Astro 几乎不可能做出缓慢的网站"，让我们看看这个项目是否符合。

---

## 总体评价：⭐⭐⭐⭐ — 基本合格，但有几个明显的性能瓶颈

这个项目在**架构层面**确实很好地利用了 Astro 的核心优势（岛屿架构、零 JS 静态输出），但在**资源加载**和**CSS 动画**层面存在一些会拖慢 First Paint 的问题。

---

## ✅ 做得好的地方

### 1. 岛屿架构（Islands Architecture）运用正确
Astro 的杀手级优势是"默认不发送 JavaScript"。这个项目做到了：

| 组件 | 类型 | JS 发送策略 | 评价 |
|------|------|------------|------|
| Header | `.astro` | 零 JS 输出 ✅ | 纯服务端渲染 |
| Footer | `.astro` | 零 JS 输出 ✅ | 纯服务端渲染 |
| CyberPet | `.astro` + `is:inline` | 极小内联脚本 ✅ | 90 行轻量脚本 |
| CodeBlockEnhancer | `.astro` | 模块化 `<script>` ✅ | Astro 自动去重 |
| ImageLightbox | `.astro` | 模块化 `<script>` ✅ | 自动去重 |
| ThemeToggle | `.svelte` + `client:load` | 发送 Svelte runtime ⚠️ | 必要但有代价 |
| CommentSection | `.svelte` + `client:visible` | 懒加载 ✅ | **最佳实践！** |

> [!TIP]
> `CommentSection` 使用 `client:visible` 是教科书级做法 — 只在评论区滚入视口时才加载 Svelte runtime + 组件代码。

### 2. 静态生成（SSG）为主
- 首页、博客列表页、文章详情页、标签页全部使用 `getStaticPaths()` **构建时生成静态 HTML**。
- 只有 `/search` 页面设置了 `export const prerender = false`，需要 SSR（因为要查 D1 数据库）。
- 这意味着绝大多数页面是纯 `.html` 文件，Cloudflare CDN 可以直接缓存分发。

### 3. 内联脚本策略合理
- `is:inline` 脚本（暗色模式初始化、Header 滚动监听、CyberPet）都很小（< 2KB），直接嵌入 HTML 减少一次网络请求。
- Astro 模块化 `<script>` 标签自动去重和打包。

### 4. View Transitions 实现细致
- 使用 `transition:persist` 保持状态（鼠标指针、灯箱、进度条、Toast 容器）。
- 监听 `astro:page-load` 而非 `DOMContentLoaded`，兼容 SPA 式导航。
- 使用 `window._xxxInited` 防重复初始化标记。

### 5. 图片懒加载
- 首页文章卡片图片使用 `loading="lazy"` ✅
- 文章详情页题图使用 `loading="eager"` ✅（首屏大图应该立即加载）

---

## ❌ 存在的性能问题

### 🔴 问题 1：字体加载 — 最大的性能杀手

```html
<!-- BaseHead.astro 第 68-72 行 -->
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700
  &family=Quicksand:wght@400;500;600;700
  &family=Fira+Code:wght@400;500;600;700
  &family=Ma+Shan+Zheng&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-lite-webfont@1.1.0/style.css" />
```

**问题分析：**
- 一次性加载了 **5 个字体族**（Space Grotesk, Quicksand, Fira Code, Ma Shan Zheng, LXGW WenKai Lite）
- 每个字体请求 3-4 个字重 → 总计需要下载 **12+ 个字体文件**
- LXGW WenKai 是中文字体，文件大小通常在 **4-8MB**
- 这些全部是**渲染阻塞资源** — 浏览器必须下载完字体才能正确渲染文字
- `display=swap` 虽然允许先用系统字体，但会造成 **FOUT（闪烁）**

**影响程度：** 🔴 严重 — 可能让首次内容绘制（FCP）增加 1-3 秒

**建议修复：**
```html
<!-- 1. 对字体 CSS 使用 preload -->
<link rel="preload" href="https://fonts.googleapis.com/css2?..." as="style" />

<!-- 2. 减少字重：实际上 400 和 600/700 就够了 -->
family=Quicksand:wght@400;600&family=Space+Grotesk:wght@400;700

<!-- 3. LXGW WenKai 考虑自托管子集化 -->
<!-- 用 fontmin 工具只提取常用汉字，从 8MB 降到 ~500KB -->
```

---

### 🟡 问题 2：全局背景图无优化

```css
/* global.css 第 108 行 */
background-image: url('/images/kokoro1.png');
```

**问题分析：**
- PNG 格式，通常比 WebP/AVIF 大 3-5 倍
- 没有使用 Astro 的 `<Image>` 组件进行自动优化
- 没有 `<link rel="preload">` 提前加载
- 作为 `position: fixed` 全屏背景，是首屏关键资源

**影响程度：** 🟡 中等 — 取决于图片实际大小

**建议修复：**
- 转换为 WebP 或 AVIF 格式
- 添加 preload: `<link rel="preload" href="/images/kokoro1.webp" as="image" />`
- 考虑提供多尺寸（移动端不需要 4K 背景）

---

### 🟡 问题 3：CSS 全量加载

```ts
// BaseLayout.astro 第 20-30 行
import '@/styles/global.css';    // 10KB
import '@/styles/prose.css';     //  9KB
import '@/styles/layout.css';    //  7KB
import '@/styles/home.css';      //  5KB
import '@/styles/post.css';      //  4KB
import '@/styles/toast.css';     //  4KB
import '@/styles/comments.css';  //  4KB
import '@/styles/blog.css';      //  3KB
import '@/styles/search.css';    //  3KB
import '@/styles/transitions.css'; // 3KB
import '@/styles/cursor.css';    //  2KB
// 总计 ~54KB 源码 CSS
```

**问题分析：**
- 所有 11 个 CSS 文件在 BaseLayout 中全部导入 → **每个页面都加载全部样式**
- 首页不需要 `comments.css`、`prose.css`、`search.css`、`post.css`
- 搜索页不需要 `home.css`、`comments.css`、`post.css`

> [!NOTE]
> 代码注释说明这样做是为了避免"View Transitions 时 scoped 样式丢失"。这是 Astro View Transitions 的一个已知问题，所以这个折中有其道理。但 Tailwind v4 的 tree-shaking 会帮忙去掉未使用的工具类，实际产出 CSS 会比源码小。

**影响程度：** 🟡 中等 — 经过 Tailwind purge 后实际大小可接受

---

### 🟢 问题 4：`backdrop-filter` 大量使用

```css
backdrop-filter: blur(20px) saturate(180%);  /* .glass */
backdrop-filter: blur(16px);                 /* .glow-card */
backdrop-filter: blur(2px);                  /* 鼠标指针悬停 */
```

**问题分析：**
- `backdrop-filter: blur()` 是**重绘密集型**操作
- 同时存在 3-4 个使用 `backdrop-filter` 的元素会消耗 GPU 资源
- 在低端设备（移动端）上可能导致滚动卡顿

**影响程度：** 🟢 轻微 — 现代设备通常能应对

---

### 🟢 问题 5：自定义鼠标的 `requestAnimationFrame` 永不停止

```ts
// CustomCursor.astro 第 41-46 行
const loop = () => {
  ox += (mx - ox) * 0.3;
  oy += (my - oy) * 0.3;
  outline.style.transform = `translate3d(...)`;
  requestAnimationFrame(loop);  // 永远在跑
};
```

**问题分析：**
- 即使鼠标完全不动，rAF 循环也在以 60fps 运行
- 这会阻止浏览器进入低功耗状态
- 但因为只是更新一个 `transform`（GPU 加速），实际 CPU 开销很小
- 已经用 `(pointer: fine)` 媒体查询排除了触摸屏设备 ✅

**影响程度：** 🟢 轻微 — 可优化但不紧急

---

## 📊 最终评分

| 维度 | 评分 | 说明 |
|------|------|------|
| **JS 发送量** | ⭐⭐⭐⭐⭐ | 极少，只有 Svelte 岛屿 |
| **静态化程度** | ⭐⭐⭐⭐⭐ | 几乎全静态，仅搜索 SSR |
| **字体加载** | ⭐⭐ | 5 个字体族太多，中文字体体积巨大 |
| **图片优化** | ⭐⭐⭐ | 有 lazy loading 但格式未优化 |
| **CSS 效率** | ⭐⭐⭐ | 全量加载但有 tree-shaking |
| **动画性能** | ⭐⭐⭐⭐ | 使用 transform/opacity，GPU 友好 |
| **CDN 友好度** | ⭐⭐⭐⭐⭐ | Cloudflare Pages 原生边缘部署 |

---

## 🎯 结论

> **这个博客项目在"Astro 的部分"做得很好，但在"非 Astro 的部分"拖了后腿。**

Astro 保证了：
- ✅ 页面近乎零 JavaScript
- ✅ 构建时 HTML 生成
- ✅ 岛屿架构精准水合

但 Astro 管不了的地方出了问题：
- ❌ 字体加载策略（5 个字体族 + 未子集化的中文字体）
- ❌ 背景大图未优化格式

**如果把字体问题解决掉（减少字体数量 + 中文字体子集化），这个博客的 Lighthouse Performance 分数有望从 ~70 分提升到 90+ 分。**

Astro 给了你一辆法拉利的引擎，但你往后备箱塞了 5 吨字体文件 🏎️📦
