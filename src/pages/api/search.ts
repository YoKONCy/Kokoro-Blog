/**
 * 搜索 API — GET /api/search?q=keyword
 */
import type { APIRoute } from 'astro';
import { searchPosts } from '@/lib/cloudflare/search';
import { getDB } from '@/lib/cloudflare/env';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const query = url.searchParams.get('q')?.trim();
    if (!query) {
      return Response.json({ success: true, data: { results: [], query: '' } });
    }
    if (query.length > 100) {
      return Response.json({ success: false, error: '搜索词过长' }, { status: 400 });
    }

    const db = await getDB(context.locals);
    if (!db) return Response.json({ success: false, error: 'D1 不可用' }, { status: 503 });
    const results = await searchPosts(db, query);

    return Response.json({ success: true, data: { results, query } });
  } catch (e) {
    return Response.json({ success: false, error: '搜索失败' }, { status: 500 });
  }
};
