/**
 * D1 数据库操作封装
 * 包含：评论、阅读数、友链、文章、站点设置 的完整 CRUD
 */

// ===== 评论 =====

export interface Comment {
  id: string;
  post_slug: string;
  author: string;
  email: string | null;
  content: string;
  parent_id: string | null;
  status: 'pending' | 'approved' | 'spam';
  created_at: string;
  ip_hash?: string;
}

export async function getComments(db: D1Database, postSlug: string): Promise<Comment[]> {
  const { results } = await db
    .prepare('SELECT id, post_slug, author, content, parent_id, created_at FROM comments WHERE post_slug = ? AND status = ? ORDER BY created_at ASC')
    .bind(postSlug, 'approved')
    .all<Comment>();
  return results ?? [];
}

export async function getCommentCount(db: D1Database, postSlug: string): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) as count FROM comments WHERE post_slug = ? AND status = ?')
    .bind(postSlug, 'approved')
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export async function getTotalCommentCount(db: D1Database): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) as count FROM comments')
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export async function createComment(
  db: D1Database,
  data: { postSlug: string; author: string; email?: string; content: string; parentId?: string; ipHash?: string }
): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .prepare('INSERT INTO comments (id, post_slug, author, email, content, parent_id, ip_hash) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, data.postSlug, data.author, data.email ?? null, data.content, data.parentId ?? null, data.ipHash ?? null)
    .run();
  return id;
}

/**
 * 检查 IP 在指定时间窗口内的评论数量（用于限流）
 * @param windowSeconds 时间窗口秒数
 * @returns 该 IP 在窗口期内的评论条数
 */
export async function getCommentCountByIp(
  db: D1Database,
  ipHash: string,
  windowSeconds: number
): Promise<number> {
  const row = await db
    .prepare('SELECT COUNT(*) as count FROM comments WHERE ip_hash = ? AND created_at > datetime("now", ?)')
    .bind(ipHash, `-${windowSeconds} seconds`)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

// 管理用：获取所有评论（分页）
export interface CommentWithPost extends Comment {
  post_title?: string;
}

export async function getAllComments(
  db: D1Database,
  limit = 20,
  offset = 0
): Promise<{ comments: CommentWithPost[]; total: number }> {
  const countRow = await db
    .prepare('SELECT COUNT(*) as count FROM comments')
    .first<{ count: number }>();
  const total = countRow?.count ?? 0;

  const { results } = await db
    .prepare(`
      SELECT c.*, p.title as post_title
      FROM comments c
      LEFT JOIN posts p ON c.post_slug = p.slug
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `)
    .bind(limit, offset)
    .all<CommentWithPost>();

  return { comments: results ?? [], total };
}

// 管理用
export async function getPendingComments(db: D1Database): Promise<Comment[]> {
  const { results } = await db
    .prepare('SELECT * FROM comments WHERE status = ? ORDER BY created_at DESC')
    .bind('pending')
    .all<Comment>();
  return results ?? [];
}

export async function updateCommentStatus(db: D1Database, id: string, status: 'approved' | 'spam'): Promise<void> {
  await db.prepare('UPDATE comments SET status = ? WHERE id = ?').bind(status, id).run();
}

export async function deleteComment(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
}

// ===== 阅读数 =====

export async function getViewCount(db: D1Database, slug: string): Promise<number> {
  const row = await db
    .prepare('SELECT view_count FROM page_views WHERE slug = ?')
    .bind(slug)
    .first<{ view_count: number }>();
  return row?.view_count ?? 0;
}

export async function getTotalViewCount(db: D1Database): Promise<number> {
  const row = await db
    .prepare('SELECT COALESCE(SUM(view_count), 0) as total FROM page_views')
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export async function getTodayViewCount(db: D1Database): Promise<number> {
  const row = await db
    .prepare("SELECT COALESCE(SUM(count), 0) as total FROM daily_views WHERE date = date('now')")
    .first<{ total: number }>();
  return row?.total ?? 0;
}

export async function getWeeklyViews(db: D1Database): Promise<{ date: string; count: number }[]> {
  const { results } = await db
    .prepare("SELECT date, SUM(count) as count FROM daily_views WHERE date >= date('now', '-7 days') GROUP BY date ORDER BY date ASC")
    .all<{ date: string; count: number }>();
  return results ?? [];
}

export async function getTopPages(db: D1Database, limit = 5): Promise<{ slug: string; view_count: number }[]> {
  const { results } = await db
    .prepare('SELECT slug, view_count FROM page_views ORDER BY view_count DESC LIMIT ?')
    .bind(limit)
    .all<{ slug: string; view_count: number }>();
  return results ?? [];
}

export async function incrementViews(db: D1Database, slug: string): Promise<number> {
  await db
    .prepare('INSERT INTO page_views (slug, view_count) VALUES (?, 1) ON CONFLICT(slug) DO UPDATE SET view_count = view_count + 1')
    .bind(slug)
    .run();

  // 每日统计
  const today = new Date().toISOString().slice(0, 10);
  await db
    .prepare('INSERT INTO daily_views (date, slug, count) VALUES (?, ?, 1) ON CONFLICT(date, slug) DO UPDATE SET count = count + 1')
    .bind(today, slug)
    .run();

  return await getViewCount(db, slug);
}

// ===== 友链 =====

export interface Link {
  id: string;
  name: string;
  url: string;
  avatar: string | null;
  description: string | null;
  sort_order: number;
}

export async function getLinks(db: D1Database): Promise<Link[]> {
  const { results } = await db
    .prepare('SELECT * FROM links ORDER BY sort_order ASC, created_at DESC')
    .all<Link>();
  return results ?? [];
}

export async function createLink(
  db: D1Database,
  data: { name: string; url: string; avatar?: string; description?: string }
): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .prepare('INSERT INTO links (id, name, url, avatar, description) VALUES (?, ?, ?, ?, ?)')
    .bind(id, data.name, data.url, data.avatar ?? null, data.description ?? null)
    .run();
  return id;
}

export async function updateLink(
  db: D1Database,
  id: string,
  data: { name?: string; url?: string; avatar?: string; description?: string; sort_order?: number }
): Promise<void> {
  // 动态构建 SET 子句，只更新传入的字段
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.url !== undefined) { fields.push('url = ?'); values.push(data.url); }
  if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(data.sort_order); }

  if (fields.length === 0) return;

  values.push(id);
  await db
    .prepare(`UPDATE links SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();
}

export async function deleteLink(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM links WHERE id = ?').bind(id).run();
}

// ===== 文章 (Posts) =====

export interface Post {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  hero_image: string | null;
  tags: string;          // JSON 字符串，如 '["astro","blog"]'
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

/** 解析文章的 tags JSON 字符串为数组 */
export function parseTags(tagsJson: string): string[] {
  try {
    const parsed = JSON.parse(tagsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 分页结果 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

/** 获取已发布的文章列表（前台用，不含 content，支持分页） */
export async function getPublishedPosts(
  db: D1Database,
  limit = 50,
  offset = 0
): Promise<PaginatedResult<Omit<Post, 'content'>>> {
  const countRow = await db
    .prepare("SELECT COUNT(*) as count FROM posts WHERE status = 'published'")
    .first<{ count: number }>();
  const total = countRow?.count ?? 0;

  const { results } = await db
    .prepare("SELECT id, slug, title, description, hero_image, tags, status, created_at, updated_at FROM posts WHERE status = 'published' ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .bind(limit, offset)
    .all<Omit<Post, 'content'>>();
  return { items: results ?? [], total };
}

/** 获取所有文章列表（管理后台用，不含 content） */
export async function getAllPosts(db: D1Database): Promise<Omit<Post, 'content'>[]> {
  const { results } = await db
    .prepare('SELECT id, slug, title, description, hero_image, tags, status, created_at, updated_at FROM posts ORDER BY created_at DESC')
    .all<Omit<Post, 'content'>>();
  return results ?? [];
}

/** 已发布文章总数 */
export async function getPublishedPostCount(db: D1Database): Promise<number> {
  const row = await db
    .prepare("SELECT COUNT(*) as count FROM posts WHERE status = 'published'")
    .first<{ count: number }>();
  return row?.count ?? 0;
}

/** 通过 slug 获取单篇已发布文章（前台用） */
export async function getPublishedPostBySlug(db: D1Database, slug: string): Promise<Post | null> {
  const row = await db
    .prepare("SELECT * FROM posts WHERE slug = ? AND status = 'published'")
    .bind(slug)
    .first<Post>();
  return row ?? null;
}

/** 通过 id 获取文章（管理后台用，包括草稿） */
export async function getPostById(db: D1Database, id: string): Promise<Post | null> {
  const row = await db
    .prepare('SELECT * FROM posts WHERE id = ?')
    .bind(id)
    .first<Post>();
  return row ?? null;
}

/** 通过 slug 获取文章（任意状态，管理后台用） */
export async function getPostBySlug(db: D1Database, slug: string): Promise<Post | null> {
  const row = await db
    .prepare('SELECT * FROM posts WHERE slug = ?')
    .bind(slug)
    .first<Post>();
  return row ?? null;
}

/**
 * 按标签筛选已发布文章（支持分页）
 * 使用 json_each() 精确匹配标签，避免 LIKE 的子串误匹配问题
 * 例如搜索 "react" 不会误匹配 "react-native"
 */
export async function getPublishedPostsByTag(
  db: D1Database,
  tag: string,
  limit = 50,
  offset = 0
): Promise<PaginatedResult<Omit<Post, 'content'>>> {
  try {
    // 优先使用 json_each 精确匹配
    const countRow = await db
      .prepare("SELECT COUNT(*) as count FROM posts WHERE status = 'published' AND EXISTS (SELECT 1 FROM json_each(posts.tags) WHERE json_each.value = ?)")
      .bind(tag)
      .first<{ count: number }>();
    const total = countRow?.count ?? 0;

    const { results } = await db
      .prepare(`SELECT id, slug, title, description, hero_image, tags, status, created_at, updated_at FROM posts WHERE status = 'published' AND EXISTS (SELECT 1 FROM json_each(posts.tags) WHERE json_each.value = ?) ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(tag, limit, offset)
      .all<Omit<Post, 'content'>>();
    return { items: results ?? [], total };
  } catch {
    // json_each 不可用时回退到 LIKE 匹配
    const likePattern = `%"${tag}"%`;

    const countRow = await db
      .prepare("SELECT COUNT(*) as count FROM posts WHERE status = 'published' AND tags LIKE ?")
      .bind(likePattern)
      .first<{ count: number }>();
    const total = countRow?.count ?? 0;

    const { results } = await db
      .prepare(`SELECT id, slug, title, description, hero_image, tags, status, created_at, updated_at FROM posts WHERE status = 'published' AND tags LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(likePattern, limit, offset)
      .all<Omit<Post, 'content'>>();
    return { items: results ?? [], total };
  }
}

/**
 * 获取所有已发布文章的标签（去重）
 * 使用 SQL 级 json_each 提取，避免将全量文章加载到内存
 */
export async function getAllTags(db: D1Database): Promise<string[]> {
  try {
    // 优先使用 json_each 高效提取
    const { results } = await db
      .prepare(`SELECT DISTINCT j.value as tag FROM posts, json_each(posts.tags) AS j WHERE posts.status = 'published' ORDER BY tag ASC`)
      .all<{ tag: string }>();
    return (results ?? []).map(r => r.tag);
  } catch {
    // json_each 不可用时的回退方案
    const { results } = await db
      .prepare("SELECT tags FROM posts WHERE status = 'published'")
      .all<{ tags: string }>();
    const tagSet = new Set<string>();
    for (const row of results ?? []) {
      for (const tag of parseTags(row.tags)) {
        tagSet.add(tag);
      }
    }
    return [...tagSet];
  }
}

/** 创建文章 */
export async function createPost(
  db: D1Database,
  data: {
    slug: string;
    title: string;
    description?: string;
    content: string;
    heroImage?: string;
    tags?: string[];
    status?: 'draft' | 'published';
  }
): Promise<string> {
  const id = crypto.randomUUID().replace(/-/g, '');
  const tagsJson = JSON.stringify(data.tags ?? []);
  await db
    .prepare('INSERT INTO posts (id, slug, title, description, content, hero_image, tags, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(
      id,
      data.slug,
      data.title,
      data.description ?? '',
      data.content,
      data.heroImage ?? null,
      tagsJson,
      data.status ?? 'draft'
    )
    .run();

  // 同步 FTS 索引
  await syncPostToFts(db, {
    slug: data.slug,
    title: data.title,
    description: data.description ?? '',
    content: data.content,
    tags: data.tags ?? [],
    pubDate: new Date().toISOString().slice(0, 10),
  });

  return id;
}

/** 更新文章 */
export async function updatePost(
  db: D1Database,
  id: string,
  data: {
    slug?: string;
    title?: string;
    description?: string;
    content?: string;
    heroImage?: string;
    tags?: string[];
    status?: 'draft' | 'published';
  }
): Promise<void> {
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content); }
  if (data.heroImage !== undefined) { fields.push('hero_image = ?'); values.push(data.heroImage); }
  if (data.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(data.tags)); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.slug !== undefined) { fields.push('slug = ?'); values.push(data.slug); }

  if (fields.length === 0) return;

  // 始终更新 updated_at
  fields.push("updated_at = datetime('now')");

  values.push(id);
  await db
    .prepare(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  // 更新后同步 FTS：需要获取完整的文章数据
  const updatedPost = await getPostById(db, id);
  if (updatedPost) {
    await syncPostToFts(db, {
      slug: updatedPost.slug,
      title: updatedPost.title,
      description: updatedPost.description,
      content: updatedPost.content,
      tags: parseTags(updatedPost.tags),
      pubDate: updatedPost.created_at.slice(0, 10),
    });
  }
}

/** 删除文章 */
export async function deletePost(db: D1Database, id: string): Promise<void> {
  // 先获取 slug 以同步删除 FTS 记录
  const post = await getPostById(db, id);
  if (post) {
    await db.prepare('DELETE FROM posts_fts WHERE slug = ?').bind(post.slug).run();
  }
  await db.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
}

/**
 * 同步文章到 FTS5 索引（先删后插，保证幂等）
 * 这是项目中 FTS 索引同步的唯一入口，search.ts 中会 re-export 此函数
 */
export async function syncPostToFts(
  db: D1Database,
  post: { slug: string; title: string; description: string; content: string; tags: string[]; pubDate: string }
): Promise<void> {
  // 先删除旧记录
  await db.prepare('DELETE FROM posts_fts WHERE slug = ?').bind(post.slug).run();
  // 插入新记录
  await db
    .prepare('INSERT INTO posts_fts (slug, title, description, content, tags, pub_date) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(post.slug, post.title, post.description, post.content, post.tags.join(' '), post.pubDate)
    .run();
}

/** 获取上一篇/下一篇（已发布，按时间排序） */
export async function getAdjacentPosts(
  db: D1Database,
  currentCreatedAt: string
): Promise<{ prev: Pick<Post, 'slug' | 'title'> | null; next: Pick<Post, 'slug' | 'title'> | null }> {
  const prev = await db
    .prepare("SELECT slug, title FROM posts WHERE status = 'published' AND created_at < ? ORDER BY created_at DESC LIMIT 1")
    .bind(currentCreatedAt)
    .first<Pick<Post, 'slug' | 'title'>>();

  const next = await db
    .prepare("SELECT slug, title FROM posts WHERE status = 'published' AND created_at > ? ORDER BY created_at ASC LIMIT 1")
    .bind(currentCreatedAt)
    .first<Pick<Post, 'slug' | 'title'>>();

  return { prev: prev ?? null, next: next ?? null };
}

// ===== 站点设置 (Site Settings) =====

export interface SiteSetting {
  key: string;
  value: string;
  updated_at: string;
}

/** 获取单个设置值 */
export async function getSetting(db: D1Database, key: string): Promise<string | null> {
  const row = await db
    .prepare('SELECT value FROM site_settings WHERE key = ?')
    .bind(key)
    .first<{ value: string }>();
  return row?.value ?? null;
}

/** 获取所有设置（返回 key-value 对象） */
export async function getAllSettings(db: D1Database): Promise<Record<string, string>> {
  const { results } = await db
    .prepare('SELECT key, value FROM site_settings')
    .all<{ key: string; value: string }>();
  const settings: Record<string, string> = {};
  for (const row of results ?? []) {
    settings[row.key] = row.value;
  }
  return settings;
}

/** 设置单个值（存在则更新，不存在则插入） */
export async function setSetting(db: D1Database, key: string, value: string): Promise<void> {
  await db
    .prepare("INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
    .bind(key, value)
    .run();
}

/** 批量设置（事务安全） */
export async function setSettings(db: D1Database, settings: Record<string, string>): Promise<void> {
  const stmt = db.prepare(
    "INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
  );
  const batch = Object.entries(settings).map(([key, value]) => stmt.bind(key, value));
  if (batch.length > 0) {
    await db.batch(batch);
  }
}

// ===== Session 管理 =====

/** 创建 session（登录用） — 数据库中只存储 Token 的 SHA-256 哈希 */
export async function createSession(db: D1Database, token: string, expiresInDays = 7): Promise<void> {
  const { hashSessionToken } = await import('./auth');
  const hashedToken = await hashSessionToken(token);
  await db
    .prepare("INSERT INTO sessions (token, expires_at) VALUES (?, datetime('now', ?))")
    .bind(hashedToken, `+${expiresInDays} days`)
    .run();
}

/** 验证 session 是否有效 — 对 Cookie 中的原始 Token 哈希后查询 */
export async function validateSession(db: D1Database, token: string): Promise<boolean> {
  const { hashSessionToken } = await import('./auth');
  const hashedToken = await hashSessionToken(token);
  const row = await db
    .prepare("SELECT token FROM sessions WHERE token = ? AND expires_at > datetime('now')")
    .bind(hashedToken)
    .first();
  return !!row;
}

/** 删除 session（登出用） */
export async function deleteSession(db: D1Database, token: string): Promise<void> {
  const { hashSessionToken } = await import('./auth');
  const hashedToken = await hashSessionToken(token);
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(hashedToken).run();
}

/** 清理过期 session */
export async function cleanExpiredSessions(db: D1Database): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
}

