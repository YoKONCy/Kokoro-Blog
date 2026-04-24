import type { D1Database } from '@cloudflare/workers-types';
import { getDB } from './env';
import { setSetting } from './d1';

const SCHEMA_SQL = `
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

-- 文章
CREATE TABLE IF NOT EXISTS posts (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  content     TEXT NOT NULL,
  hero_image  TEXT,
  tags        TEXT DEFAULT '[]',
  status      TEXT DEFAULT 'draft' CHECK(status IN ('draft','published')),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

-- 站点设置
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
`;

/**
 * 检查数据库是否已初始化
 * 如果 site_settings 表存在且具有 admin.password，则认为已初始化
 */
export async function checkIsInitialized(db?: D1Database | null): Promise<boolean> {
  if (!db) {
    db = await getDB(context.locals);
    if (!db) return true; // 本地无 DB 时假装已初始化以避免死循环
  }

  try {
    const row = await db
      .prepare("SELECT value FROM site_settings WHERE key = 'admin.password'")
      .first();
    return !!row;
  } catch (err: any) {
    // 表不存在
    if (err.message && err.message.includes('no such table')) {
      return false;
    }
    // 其他错误保守放行
    return true;
  }
}

/**
 * 执行初始化
 */
export async function executeSetup(db: D1Database, passwordHash: string, siteName: string): Promise<void> {
  // D1 .batch 可以执行多个语句，但 .exec 更适合整段 DDL
  // 但 Cloudflare D1 驱动的 exec API 时有时无，最稳妥的是用 .batch() 拆分语句
  const statements = SCHEMA_SQL.split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => db.prepare(s));

  if (statements.length > 0) {
    await db.batch(statements);
  }

  // 写入基础配置
  await setSetting(db, 'admin.password', passwordHash);
  await setSetting(db, 'site.title', siteName);
  await setSetting(db, 'site.logo_text', siteName);
}
