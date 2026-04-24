-- =========================================================================
-- 🚀 Blog Database Schema (Cloudflare D1)
-- =========================================================================
-- 注意：本项目已支持图形化开箱即用。
-- 部署到 Cloudflare 后，直接访问你的网站首页即可通过 `/setup` 向导自动建表。
-- 
-- 本文件仅供高级用户参考，或用于本地手动执行/迁移：
--   本地执行: npx wrangler d1 execute my-blog-db --local --file=db/schema.sql
--   线上执行: npx wrangler d1 execute my-blog-db --remote --file=db/schema.sql
-- =========================================================================

-- 评论
CREATE TABLE IF NOT EXISTS comments (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  post_slug  TEXT NOT NULL,
  author     TEXT NOT NULL,
  email      TEXT,
  content    TEXT NOT NULL,
  parent_id  TEXT REFERENCES comments(id),
  status     TEXT DEFAULT 'approved' CHECK(status IN ('pending','approved','spam')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_hash    TEXT
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_slug, status);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status, created_at);

-- 阅读数
CREATE TABLE IF NOT EXISTS page_views (
  slug       TEXT PRIMARY KEY,
  view_count INTEGER DEFAULT 0
);

-- 每日统计
CREATE TABLE IF NOT EXISTS daily_views (
  date       TEXT NOT NULL,
  slug       TEXT NOT NULL,
  count      INTEGER DEFAULT 0,
  PRIMARY KEY (date, slug)
);

-- 友链
CREATE TABLE IF NOT EXISTS links (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,
  avatar      TEXT,
  description TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 全文搜索
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  title, description, content, tags,
  slug UNINDEXED, pub_date UNINDEXED,
  tokenize='unicode61'
);

-- 文章（替代 Content Collections，所有文章数据存入 D1）
CREATE TABLE IF NOT EXISTS posts (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  slug        TEXT NOT NULL UNIQUE,          -- URL 路径标识，如 "hello-world"
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',               -- 文章摘要 / SEO 描述
  content     TEXT NOT NULL,                 -- Markdown 原文
  hero_image  TEXT,                          -- 封面图 URL（R2 路径）
  tags        TEXT DEFAULT '[]',             -- JSON 数组，如 '["astro","blog"]'
  status      TEXT DEFAULT 'draft' CHECK(status IN ('draft','published')),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

-- 站点设置（Key-Value 模式，存储动态可配置的站点参数）
CREATE TABLE IF NOT EXISTS site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 管理员会话
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);

-- 评论 IP 限流索引
CREATE INDEX IF NOT EXISTS idx_comments_ip_time ON comments(ip_hash, created_at);
