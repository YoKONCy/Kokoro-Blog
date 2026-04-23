/**
 * 搜索 API — GET /api/search?q=keyword
 */
import type { APIRoute } from 'astro';
import { searchPosts } from '@/lib/cloudflare/search';

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const query = url.searchParams.get('q')?.trim();
    if (!query) {
      return Response.json({ success: true, data: { results: [], query: '' } });
    }
    if (query.length > 100) {
      return Response.json({ success: false, error: '搜索词过长' }, { status: 400 });
    }

    const db = locals.runtime.env.DB;
    const results = await searchPosts(db, query);

    return Response.json({ success: true, data: { results, query } });
  } catch (e) {
    return Response.json({ success: false, error: '搜索失败' }, { status: 500 });
  }
};
