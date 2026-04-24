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
  try {
    if (!envModule) {
      // 动态导入以避免在非 Cloudflare 环境下报错
      envModule = await import('cloudflare:workers');
    }
    return envModule.env ?? {};
  } catch {
    // 非 Cloudflare 环境（如纯 astro dev），返回空对象
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
