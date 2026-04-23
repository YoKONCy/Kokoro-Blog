# 管理后台设计

## 功能架构

```
管理后台
├── 登录（密码 + 可选 Cloudflare Access）
├── 仪表盘
│   ├── 文章总数、评论总数、今日/7日 PV
│   └── 最近评论、最近文章
├── 评论管理
│   ├── 待审核列表
│   ├── 批准 / 拒绝 / 删除
│   └── 按文章筛选
├── 友链管理
│   ├── 增删改查
│   └── 排序
└── 访问统计
    ├── 热门文章排行
    └── 按日/周/月 PV 趋势
```

## 鉴权方案

### 中间件（`src/middleware.ts`）

```typescript
export const onRequest: MiddlewareHandler = async (context, next) => {
  // /admin/* (非 login) → 检查 session cookie → KV 验证
  // /api/admin/* → 同样需要鉴权
  // 未通过 → 重定向 /admin/login
};
```

### 会话管理

- 登录 → 生成随机 token → 存入 D1 `sessions` 表（或 KV）
- Cookie: `session=<token>`，HttpOnly, Secure, SameSite=Strict
- 过期时间：7 天
- Secret: 通过 Cloudflare Dashboard 配置 `ADMIN_PASSWORD`

## 页面路由

所有后台页面均为 SSR（`export const prerender = false`）。

| 路由 | 布局 |
|------|------|
| `/admin/login` | 独立登录页面 |
| `/admin/*` | `AdminLayout.astro`（含侧边栏导航） |
