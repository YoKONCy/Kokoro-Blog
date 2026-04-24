# D1 数据库设计 + 搜索方案

## 数据库 Schema

完整 SQL 见 `db/schema.sql`，此处为表说明。

### comments — 评论

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | randomblob 生成 |
| post_slug | TEXT | 文章标识 |
| author | TEXT | 评论者名 |
| email | TEXT | 可选邮箱 |
| content | TEXT | 评论内容 |
| parent_id | TEXT FK | 父评论 ID（支持嵌套） |
| status | TEXT | pending / approved / spam |
| created_at | DATETIME | 创建时间 |
| ip_hash | TEXT | IP 哈希（非原始 IP） |

索引：`(post_slug, status)`, `(status, created_at)`

### page_views — 阅读数

| 字段 | 类型 | 说明 |
|------|------|------|
| slug | TEXT PK | 文章 slug |
| view_count | INTEGER | 累计阅读数 |

### daily_views — 每日统计

| 字段 | 类型 | 说明 |
|------|------|------|
| date | TEXT | YYYY-MM-DD |
| slug | TEXT | 文章 slug |
| count | INTEGER | 当日阅读数 |

复合主键：`(date, slug)`

### links — 友链

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | randomblob 生成 |
| name | TEXT | 站点名 |
| url | TEXT | 链接 |
| avatar | TEXT | 头像 URL |
| description | TEXT | 描述 |
| sort_order | INTEGER | 排序权重 |

### sessions — 管理员会话

| 字段 | 类型 | 说明 |
|------|------|------|
| token | TEXT PK | 会话令牌 |
| created_at | DATETIME | 创建时间 |
| expires_at | DATETIME | 过期时间 |

### posts — 文章（Phase 5 新增）

> 替代 Content Collections，所有文章数据存入 D1。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | randomblob 生成 |
| slug | TEXT UNIQUE | URL 路径标识，如 `2026/hello-world` |
| title | TEXT | 文章标题 |
| description | TEXT | 摘要 / SEO 描述 |
| content | TEXT | Markdown 原文 |
| hero_image | TEXT | 封面图 URL（R2 路径） |
| tags | TEXT | JSON 数组，如 `'["astro","blog"]'` |
| status | TEXT | draft / published |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

索引：`(status, created_at)`, `(slug)`

### site_settings — 站点设置（Phase 5 新增）

| 字段 | 类型 | 说明 |
|------|------|------|
| key | TEXT PK | 配置键，如 `site.title`、`hero.title`、`about.content` |
| value | TEXT | 配置值 |
| updated_at | DATETIME | 更新时间 |

---

## 搜索方案（D1 FTS5）

### FTS 虚拟表

```sql
CREATE VIRTUAL TABLE posts_fts USING fts5(
  title, description, content, tags,
  slug UNINDEXED, pub_date UNINDEXED,
  tokenize='unicode61'
);
```

### 搜索流程

```
构建时 → 遍历所有文章 → 写入 D1 FTS5 表（通过构建脚本）
用户搜索 → GET /api/search?q=keyword → D1 FTS5 MATCH → 返回高亮摘要
```

### 搜索 API

```typescript
export async function searchPosts(db: D1Database, query: string, limit = 20) {
  return db.prepare(`
    SELECT slug, title, description, pub_date,
           snippet(posts_fts, 2, '<mark>', '</mark>', '...', 32) as excerpt
    FROM posts_fts WHERE posts_fts MATCH ? ORDER BY rank LIMIT ?
  `).bind(query, limit).all();
}
```

### 索引同步

创建/更新/删除文章时，D1 CRUD 函数自动同步 FTS5 索引（`syncPostFts`）。
迁移工具：`db/migrate-posts.ts` 可将 Content Collections Markdown 文件生成 SQL 插入语句。
