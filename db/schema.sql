-- ===================================
-- Blog Database Schema (Cloudflare D1)
-- ===================================

-- 评论
CREATE TABLE IF NOT EXISTS comments (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  post_slug  TEXT NOT NULL,
  author     TEXT NOT NULL,
  email      TEXT,
  content    TEXT NOT NULL,
  parent_id  TEXT REFERENCES comments(id),
  status     TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','spam')),
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

-- 管理员会话
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);
