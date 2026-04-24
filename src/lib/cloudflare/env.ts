/**
 * Cloudflare Workers 环境绑定辅助
 * Astro v6 + @astrojs/cloudflare 使用 cloudflare:workers 模块获取绑定
 */

/**
 * 获取 Cloudflare Workers 环境绑定
 * 在本地开发 (wrangler dev) 和生产环境 (Cloudflare Pages) 都可用
 */
export async function getCloudflareEnv(): Promise<{ DB?: D1Database; BUCKET?: R2Bucket; [key: string]: any }> {
  try {
    const mod = await import('cloudflare:workers');
    return mod.env ?? {};
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
