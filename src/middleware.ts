/**
 * Astro Middleware — 管理后台鉴权拦截
 *
 * 拦截所有 /admin/* 路由（排除 /admin/login），
 * 校验 Cookie 中的 session token 是否有效。
 * 无效则 302 重定向到 /admin/login。
 */
import { defineMiddleware } from 'astro:middleware';
import { validateSession } from '@/lib/cloudflare/d1';
import { getDB } from '@/lib/cloudflare/env';
import { checkIsInitialized } from '@/lib/cloudflare/setup';

/**
 * 从 Cookie 头中解析指定 key 的值
 */
function getCookieValue(cookieHeader: string | null, key: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${key}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // 1. 跳过静态资源和已初始化的页面检查（提升性能）
  if (path.match(/\.(css|js|svg|png|webp|ico|json|woff2?)$/)) {
    return next();
  }

  // 2. 开源向导：检查系统是否已初始化
  if (path !== '/setup') {
    const db = await getDB(context.locals);
    if (db) {
      const isInit = await checkIsInitialized(db);
      if (!isInit) {
        return context.redirect('/setup', 302);
      }
    }
  }

  // 3. 仅拦截 /admin/* 路由
  if (!path.startsWith('/admin')) {
    return next();
  }

  // /admin/login 是公开页面，不拦截
  if (path === '/admin/login') {
    return next();
  }

  // 读取 session cookie
  const cookieHeader = context.request.headers.get('cookie');
  const token = getCookieValue(cookieHeader, 'session');

  if (!token) {
    return context.redirect('/admin/login', 302);
  }

  // 校验 session 是否有效（查 D1 sessions 表）
  try {
    const db = await getDB(context.locals);

    if (!db) {
      // D1 不可用（本地开发无绑定），放行并标记
      console.warn('[middleware] D1 不可用，跳过 session 校验');
      return next();
    }

    const valid = await validateSession(db, token);

    if (!valid) {
      return context.redirect('/admin/login', 302);
    }
  } catch (err) {
    console.error('[middleware] Session 校验出错:', err);
    return context.redirect('/admin/login', 302);
  }

  // 校验通过，放行
  return next();
});
