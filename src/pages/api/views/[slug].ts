/**
 * 阅读计数 API — POST /api/views/[slug]
 */
import type { APIRoute } from 'astro';
import { incrementViews, getViewCount } from '@/lib/cloudflare/d1';
import { getDB } from '@/lib/cloudflare/env';

export const prerender = false;

export const POST: APIRoute = async ({ params }) => {
  try {
    const slug = params.slug;
    if (!slug) {
      return Response.json({ success: false, error: '缺少 slug' }, { status: 400 });
    }

    const db = await getDB();
    if (!db) return Response.json({ success: false, error: 'D1 不可用' }, { status: 503 });
    const count = await incrementViews(db, slug);

    return Response.json({ success: true, data: { count } });
  } catch (e) {
    return Response.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
};

export const GET: APIRoute = async ({ params }) => {
  try {
    const slug = params.slug;
    if (!slug) {
      return Response.json({ success: false, error: '缺少 slug' }, { status: 400 });
    }

    const db = await getDB();
    if (!db) return Response.json({ success: false, error: 'D1 不可用' }, { status: 503 });
    const count = await getViewCount(db, slug);

    return Response.json({ success: true, data: { count } });
  } catch (e) {
    return Response.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
};
