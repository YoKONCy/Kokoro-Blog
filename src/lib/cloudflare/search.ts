/**
 * D1 FTS5 全文搜索封装
 *
 * FTS 索引同步逻辑统一由 d1.ts 中的 syncPostToFts 负责，
 * 本模块仅负责搜索查询，并 re-export 同步函数以保持向后兼容。
 *
 * 搜索策略：
 *   1. FTS5 MATCH（英文/数字/标点分词效果好）
 *   2. LIKE 回退（中日韩文本 unicode61 tokenizer 无法正确分词时兜底）
 *   两路结果合并去重后返回
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
  const q = query.trim();
  if (!q) return [];

  const seen = new Set<string>();
  const merged: SearchResult[] = [];

  // ── 通道 1：FTS5 MATCH（对英文 / 可分词内容效果最好）──
  try {
    const { results: ftsResults } = await db
      .prepare(`
        SELECT slug, title, description, pub_date,
               snippet(posts_fts, 2, '<mark>', '</mark>', '...', 48) as excerpt
        FROM posts_fts
        WHERE posts_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `)
      .bind(q, limit)
      .all<SearchResult>();

    for (const r of ftsResults ?? []) {
      if (!seen.has(r.slug)) {
        seen.add(r.slug);
        merged.push(r);
      }
    }
  } catch {
    // FTS5 表可能不存在或查询语法不兼容，静默继续
  }

  // ── 通道 2：LIKE 回退（CJK 中文关键词兜底）──
  if (merged.length < limit) {
    const likePattern = `%${q}%`;
    const remaining = limit - merged.length;
    try {
      const { results: likeResults } = await db
        .prepare(`
          SELECT slug, title, description AS excerpt,
                 created_at AS pub_date
          FROM posts
          WHERE status = 'published'
            AND (title LIKE ? OR description LIKE ? OR content LIKE ? OR tags LIKE ?)
          ORDER BY created_at DESC
          LIMIT ?
        `)
        .bind(likePattern, likePattern, likePattern, likePattern, remaining)
        .all<SearchResult>();

      for (const r of likeResults ?? []) {
        if (!seen.has(r.slug)) {
          seen.add(r.slug);
          // 为 LIKE 结果生成高亮摘要
          r.excerpt = highlightExcerpt(r.excerpt || '', q);
          merged.push(r);
        }
      }
    } catch {
      // posts 表查询失败时静默
    }
  }

  return merged;
}

/** 为 LIKE 命中结果手动高亮关键词 */
function highlightExcerpt(text: string, keyword: string): string {
  if (!text || !keyword) return text;
  // 截取前 200 字符作为摘要
  const truncated = text.length > 200 ? text.slice(0, 200) + '...' : text;
  // 对关键词进行正则转义后高亮
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return truncated.replace(new RegExp(escaped, 'gi'), '<mark>$&</mark>');
}

