/**
 * Cloudflare Workers 环境绑定辅助
 * Astro v6 + @astrojs/cloudflare 使用 cloudflare:workers 模块获取绑定
 */

/**
 * 获取 Cloudflare Workers 环境绑定
 * 生产环境优先从 locals.runtime.env 读取，本地回退到 cloudflare:workers 模块
 */
export async function getCloudflareEnv(locals?: any): Promise<{ DB?: D1Database; BUCKET?: R2Bucket; [key: string]: any }> {
  if (locals?.runtime?.env) {
    return locals.runtime.env;
  }
  
  try {
    const mod = await import('cloudflare:workers');
    return mod.env ?? {};
  } catch {
    return {};
  }
}

/**
 * 获取 D1 数据库绑定（快捷方法）
 */
export async function getDB(locals?: any): Promise<D1Database | undefined> {
  const e = await getCloudflareEnv(locals);
  return e.DB;
}
