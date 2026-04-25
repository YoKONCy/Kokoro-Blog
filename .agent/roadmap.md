# 开发计划

## Phase 1 — 基础骨架 🏗️ ✅ 已完成
- [x] Astro 6 项目初始化 + 集成配置
- [x] Tailwind v4 + 设计令牌 + 暗色模式
- [x] BaseLayout + Header + Footer
- [x] 首页基础版
- [x] Content Collections 配置
- [x] i18n 架构
- [x] D1 Schema

## Phase 2 — 内容系统 📝 ✅ 已完成
- [x] 文章列表页 `/blog`
- [x] 文章详情页 `/blog/[...slug]`（含上/下篇导航、JSON-LD）
- [x] 自定义 Markdown 渲染 + prose 样式
- [x] MDX 支持（集成已配置）
- [x] 标签页 `/blog/tag/[tag]`（含标签筛选 pills）

## Phase 3 — 互动功能 💬 ✅ 已完成
- [x] Cloudflare D1 服务封装（评论 CRUD、阅读计数、友链查询）
- [x] 评论系统（CommentSection 组件 + API，IP hash、审核机制）
- [x] 阅读计数 API（含每日统计）
- [x] 搜索（D1 FTS5 封装 + 搜索 API + SSR 搜索页，本地优雅降级）

## Phase 4 — UI/UX 二期美化 🎨 ✅ 已完成
- [x] 全屏沉浸式背景（fixed 动漫背景 + 光影蒙版）
- [x] 重度毛玻璃 Glassmorphism 2.0（导航栏/Footer/文章承托板）
- [x] 自定义鼠标指针（双层跟随 + 悬停发光 + 触摸屏禁用 + VT persist）
- [x] 排版升级（行高 1.85 + 标题微光 + h2 虚线边框）
- [x] 引用块美化（渐变边框 + ❞ 水印）
- [x] 代码块增强（赛博终端风 + 语言标签 + 复制按钮 + 拖拽滚动）
- [x] 提示框 Callouts（remark-directive 插件，:::note/tip/warning/caution）
- [x] 图片灯箱 Lightbox（毛玻璃蒙版 + 弹性缩放 + Escape）
- [x] 智能导航栏（滚动隐藏/滑出 + 5px 阈值防抖）
- [x] 灵动微交互（按钮下压 + 标签跳跃 + 卡片 3D 浮动）
- [x] 页面过渡动画（ClientRouter View Transitions）
- [x] 暗色模式跨页兼容（astro:after-swap 同步 .dark）
- [x] 加载进度条（NProgress 顶部细线）
- [x] 骨架屏（.skeleton CSS 类）
- [x] 全局 Toast 通知（window.showToast API，4 种类型）
- [x] 打字机特效（首页 Slogan 逐字打出 + 闪烁光标）
- [x] 移动端抽屉导航（毛玻璃遮罩 + 侧边栏滑出 + 背景锁定）
- [x] 回到顶部挂件（纯 SVG 赛博小幽灵 + 眨眼/笑脸/尾焰起飞动画）

## Phase 5 — 管理后台 🔧 ✅ 已完成
- [x] 登录鉴权 + 中间件
- [x] 仪表盘
- [x] 评论审核
- [x] 友链管理
- [x] 访问统计

## Phase 6 — 部署上线 🚀
- [ ] Cloudflare Pages 配置
- [ ] D1/KV/R2 生产环境绑定
- [x] SEO 检查 + 性能优化
- [x] RSS + Sitemap

## Future — 扩展功能 🔮
- [ ] 二次元特效（樱花飘落、粒子等）
- [ ] 动态背景（星空/粒子，Canvas 实现）
- [ ] 音视频播放组件
- [ ] Live2D 看板娘
- [ ] Three.js 3D 场景
- [ ] 英语/日语国际化
- [ ] Cloudflare Access 管理鉴权增强
- [ ] 响应式适配全面检查（移动端/平板/桌面）
- [ ] 无障碍（a11y）检查 + 键盘导航优化
- [ ] 字体加载策略优化（FOUT/FOIT 防闪烁）