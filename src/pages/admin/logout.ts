/**
 * 管理后台登出 — /admin/logout
 *
 * GET 请求：删除 D1 session 记录 + 清除 Cookie → 302 到 /admin/login
 */
import type { APIRoute } from 'astro';
import { deleteSession } from '@/lib/cloudflare/d1';
import { getDB } from '@/lib/cloudflare/env';

export const prerender = false;

export const GET: APIRoute = async ({ request, redirect }) => {
  // 读取 session cookie
  const cookieHeader = request.headers.get('cookie');
  const match = cookieHeader?.match(/(?:^|;\s*)session=([^;]*)/);
  const token = match ? decodeURIComponent(match[1]) : null;

  // 删除 D1 中的 session 记录
  if (token) {
    try {
      const db = await getDB();
      if (db) {
        await deleteSession(db, token);
      }
    } catch (err) {
      console.error('[admin/logout] 删除 session 失败:', err);
    }
  }

  // 清除 Cookie 并重定向到登录页
  const clearCookie = [
    'session=',
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
  ].join('; ');

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/admin/login',
      'Set-Cookie': clearCookie,
    },
  });
};
