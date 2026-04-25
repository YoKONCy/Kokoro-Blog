/**
 * D1 FTS5 全文搜索封装
 *
 * FTS 索引同步逻辑统一由 d1.ts 中的 syncPostToFts 负责，
 * 本模块仅负责搜索查询，并 re-export 同步函数以保持向后兼容。
 */

// Re-export FTS 同步函数（唯一实现在 d1.ts 中）
export { syncPostToFts, syncPostToFts as syncPostToIndex } from './d1';

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
