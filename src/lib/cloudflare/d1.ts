/**
 * D1 数据库操作封装
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
