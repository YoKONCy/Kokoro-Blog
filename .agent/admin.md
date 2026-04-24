# 管理后台设计

## 功能架构

```
管理后台
├── 登录（密码 + Cookie Session）
├── 统计看板
│   ├── 文章总数、评论总数、今日 PV、总 PV
│   ├── 7 天浏览趋势柱状图
│   └── 热门文章 Top 5
├── 文章管理
│   ├── 文章列表（发布/草稿筛选）
│   ├── 新建/编辑文章（Markdown 编辑器）
│   └── 图片上传（R2）
├── 评论管理
│   ├── 评论列表（分页）
│   └── 删除垃圾评论
├── 友链管理
│   ├── 增删改查
│   └── 排序
├── 站点设置
│   ├── 基本信息（标题/描述/Logo）
│   ├── 首页 Hero 配置
│   └── 评论限流（IP 窗口期/最大条数）
└── 关于页管理
    ├── 标题/头像
    └── Markdown 内容编辑
```

## 鉴权方案

### 中间件（`src/middleware.ts`）

```typescript
import { getDB } from '@/lib/cloudflare/env';

export const onRequest = defineMiddleware(async (context, next) => {
  // /admin/* (非 login) → 检查 session cookie → D1 sessions 表验证
  // 未通过 → 重定向 /admin/login
  const db = await getDB();
  const valid = await validateSession(db, token);
});
```

### 会话管理

- 登录 → 生成随机 token → 存入 D1 `sessions` 表
- Cookie: `session=<token>`，HttpOnly, Secure, SameSite=Strict
- 过期时间：7 天
- Secret: 通过 Cloudflare Dashboard 配置 `ADMIN_PASSWORD`

### 评论策略

- **直接发布**：评论提交后默认 `approved` 状态，无需审核
- **IP 限流**：基于 IP hash，窗口期和最大条数从 `site_settings` 读取
- 管理员可在后台删除垃圾评论

## 页面路由

所有后台页面均为 SSR（`export const prerender = false`）。

| 路由 | 布局 |
|------|------|
| `/admin/login` | BaseLayout（独立登录页面） |
| `/admin/*` | AdminLayout.astro（含侧边栏导航，阶段 F 实现） |

> ⚠️ 当前所有后台页面使用 BaseLayout，AdminLayout 待阶段 F 创建。
