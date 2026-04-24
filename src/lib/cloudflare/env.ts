/**
 * Cloudflare Workers 环境绑定辅助
 * Astro v6 弃用了 Astro.locals.runtime.env，改用 cloudflare:workers 模块
 */

let envModule: { env: any } | null = null;

/**
 * 获取 Cloudflare Workers 环境绑定
 * 在本地开发和生产环境都可用
 */
export async function getCloudflareEnv(): Promise<{ DB?: D1Database; BUCKET?: R2Bucket; ADMIN_PASSWORD?: string; [key: string]: any }> {
  // 1. 优先使用中间件注入的 Pages runtime env
  if ((globalThis as any).__CF_ENV__) {
    return (globalThis as any).__CF_ENV__;
  }

  // 2. 本地开发回退使用 cloudflare:workers 动态导入
  try {
    if (!envModule) {
      envModule = await import('cloudflare:workers');
    }
    return envModule.env ?? {};
  } catch {
    return {};
  }
}

/**
 * 获取 D1 数据库绑定（快捷方法）
 */
export async function getDB(): Promise<D1Database | undefined> {
  const e = await getCloudflareEnv();
  return e.DB;
}
