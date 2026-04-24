/**
 * 图片上传 API — /api/admin/upload
 * POST: 上传图片到 R2 存储桶
 * 返回公开访问 URL
 */
import type { APIRoute } from 'astro';
import { getCloudflareEnv, getDB } from '@/lib/cloudflare/env';
import { validateSession } from '@/lib/cloudflare/d1';

export const prerender = false;

/** 简单鉴权 */
async function checkAuth(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return false;
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]*)/);
  if (!match) return false;
  const db = await getDB(context.locals);
  if (!db) return false;
  return validateSession(db, decodeURIComponent(match[1]));
}

/** 允许的图片 MIME 类型 */
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
};

/** 最大文件大小 10MB */
const MAX_SIZE = 10 * 1024 * 1024;

export const POST: APIRoute = async ({ request }) => {
  if (!(await checkAuth(request))) {
    return Response.json({ success: false, error: '未授权' }, { status: 401 });
  }

  try {
    const env = await getCloudflareEnv();
    const bucket = env.BUCKET as R2Bucket | undefined;

    if (!bucket) {
      return Response.json({ success: false, error: 'R2 存储桶不可用' }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ success: false, error: '未提供文件' }, { status: 400 });
    }

    // 类型检查
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return Response.json(
        { success: false, error: `不支持的文件类型: ${file.type}` },
        { status: 400 }
      );
    }

    // 大小检查
    if (file.size > MAX_SIZE) {
      return Response.json(
        { success: false, error: `文件大小超过 ${MAX_SIZE / 1024 / 1024}MB 限制` },
        { status: 400 }
      );
    }

    // 生成唯一文件名: uploads/YYYY/MM/uuid.ext
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const key = `uploads/${year}/${month}/${uuid}${ext}`;

    // 上传到 R2
    const arrayBuffer = await file.arrayBuffer();
    await bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    // 返回 R2 公开 URL（需在 Cloudflare 仪表盘配置 R2 自定义域或使用 workers route）
    // 默认使用相对路径，生产环境可通过 R2 公开域访问
    const url = `/${key}`;

    return Response.json({
      success: true,
      data: {
        key,
        url,
        size: file.size,
        type: file.type,
      },
    }, { status: 201 });
  } catch (e) {
    console.error('[upload] 上传失败:', e);
    return Response.json({ success: false, error: '上传失败' }, { status: 500 });
  }
};
