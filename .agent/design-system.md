# 视觉设计系统：二次元 × 现代科技

## 设计语言关键词

- 柔和渐变（樱粉→薰衣草紫→天空蓝）
- 圆角 + 柔和阴影（不锐利，有"Q弹"感）
- 微光/发光效果（glow, bloom）
- 动态背景（粒子、星空、樱花飘落等，CSS/Canvas 实现）
- 卡片式布局 + 毛玻璃（glassmorphism）
- 可爱的微交互（hover 弹跳、彩蛋）
- 日/夜模式 = 白天明亮清新 / 夜晚深邃星空

## 配色方案（OKLCH 色彩空间）

| 角色 | Token | 值 |
|------|-------|-----|
| 主色（薰衣草紫） | `--color-primary` | `oklch(0.65 0.18 280)` |
| 主色亮 | `--color-primary-light` | `oklch(0.80 0.12 280)` |
| 主色暗 | `--color-primary-dark` | `oklch(0.50 0.22 280)` |
| 强调色（樱花粉） | `--color-accent` | `oklch(0.75 0.14 350)` |
| 强调色亮 | `--color-accent-light` | `oklch(0.88 0.08 350)` |
| 辅助色（天空蓝） | `--color-sky-custom` | `oklch(0.72 0.14 230)` |

### 表面色

| 亮色模式 | 暗色模式 |
|---------|---------|
| bg: `oklch(0.985 0.005 280)` | bg: `oklch(0.13 0.025 280)` |
| surface: `oklch(0.97 0.008 280)` | surface: `oklch(0.17 0.03 280)` |
| border: `oklch(0.90 0.02 280)` | border: `oklch(0.28 0.04 280)` |

## 字体策略

| 用途 | 字体 | Token | 说明 |
|------|------|-------|------|
| 标题 | Space Grotesk + 霞鹜文楷 | `--font-display` | 赛博科技感英文 + 优雅手写风中文，极具二次元张力 |
| 正文 | Quicksand + 霞鹜文楷 | `--font-sans` | 圆润可爱的英文配上优雅中文，视觉体验极佳 |
| 代码 | Fira Code | `--font-mono` | 等宽，圆润连字，回退到 JetBrains Mono |

## 暗色模式策略

- 使用 `class` 策略（`<html class="dark">`）
- Tailwind v4: `@custom-variant dark (&:where(.dark, .dark *))`
- 用户偏好存入 `localStorage`，首次访问跟随系统
- 初始化脚本放在 `<head>` 内联防闪烁

## 核心 CSS 工具类

| 类名 | 效果 |
|------|------|
| `.glass` | 毛玻璃效果 |
| `.glow-card` | 发光卡片（hover 上浮 + 发光阴影） |
| `.gradient-text` | 渐变文字（紫→粉） |
| `.animate-slide-up` | 从下方滑入动画 |
| `.animate-bounce-in` | hover 弹跳 |
| `.animate-float` | 浮动动画 |
| `.stagger > *` | 子元素交错入场 |
| `.skeleton` | 骨架屏闪光占位动画 |

## 毛玻璃 (Glassmorphism) 参数

| 组件 | 配置 |
|------|------|
| 导航栏/Footer | `backdrop-filter: blur(20px) saturate(180%)` + 高透明度 `var(--color-surface)` |
| 文章承托板 | 左侧发光彩带 + 右上角星空水印 `✦` |
| 代码块 | `backdrop-filter: blur(12px)` + `oklch(0.12 0.05 280 / 0.8)` 深色底 |

## 自定义鼠标指针 (Custom Cursor) 参数

| 属性 | 值 |
|------|-----|
| 内点跟随 | `translate3d` 零延迟 GPU 加速 |
| 外圈跟随 | `rAF` + 0.3 lerp 线性插值系数 |
| 悬停反馈 | 可点击元素外圈变大发光 |
| 触摸屏 | 自动禁用 (`@media (pointer: coarse)`) |
| View Transitions | `transition:persist` 确保跨页保持 |

## 微交互参数

| 元素 | 效果 |
|------|------|
| 按钮 `:active` | `scale(0.95)` 下压反馈 |
| 文章卡片 `:hover` | `translateY(-6px)` + 光晕阴影 |
| 标签 `:hover` | `#` 前缀 + `translateY(-2px)` 跳跃 |
| 智能导航栏 | 向下滚动隐藏 / 向上滑出，5px 阈值防抖 |
| 回到顶部 | 纯 SVG 赛博小幽灵（眨眼 + 笑脸 + 尾焰起飞） |
| 首页 Slogan | 打字机逐字打出 + 闪烁光标 |
