/**
 * D1 FTS5 全文搜索封装
 */

export interface SearchResult {
  slug: string;
  title: string;
  description: string;
  pub_date: string;
  excerpt: string;
}

export async function searchPosts(db: D1Database, query: string, limit = 20): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const { results } = await db
    .prepare(`
      SELECT slug, title, description, pub_date,
             snippet(posts_fts, 2, '<mark>', '</mark>', '...', 48) as excerpt
      FROM posts_fts
      WHERE posts_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `)
    .bind(query, limit)
    .all<SearchResult>();

  return results ?? [];
}

/**
 * 同步文章到 FTS5 索引（构建时调用）
 */
export async function syncPostToIndex(
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
