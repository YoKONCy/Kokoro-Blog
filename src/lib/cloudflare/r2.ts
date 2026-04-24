/**
 * Cloudflare R2 对象存储封装
 * 用于图片上传、读取、删除
 */

/** 上传结果 */
export interface UploadResult {
  key: string;
  url: string;
}

/** 允许的图片 MIME 类型 */
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
]);

/** 最大文件大小：5MB */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * 上传文件到 R2
 * @param bucket R2Bucket 绑定
 * @param file 要上传的 File 对象
 * @returns 上传后的 key 和 URL
 */
export async function uploadImage(
  bucket: R2Bucket,
  file: File
): Promise<UploadResult> {
  // 校验文件类型
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadError(`不支持的文件类型: ${file.type}`, 'INVALID_TYPE');
  }

  // 校验文件大小
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError(`文件过大，最大允许 ${MAX_FILE_SIZE / 1024 / 1024}MB`, 'FILE_TOO_LARGE');
  }

  // 生成存储路径: uploads/{year}/{uuid}.{ext}
  const year = new Date().getFullYear();
  const uuid = crypto.randomUUID();
  const ext = getExtFromMime(file.type);
  const key = `uploads/${year}/${uuid}.${ext}`;

  // 上传到 R2
  await bucket.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  });

  return {
    key,
    url: `/${key}`,
  };
}

/**
 * 从 R2 读取文件
 * @returns R2ObjectBody 或 null（不存在时）
 */
export async function getImage(
  bucket: R2Bucket,
  key: string
): Promise<R2ObjectBody | null> {
  const object = await bucket.get(key);
  return object;
}

/**
 * 删除 R2 中的文件
 */
export async function deleteImage(
  bucket: R2Bucket,
  key: string
): Promise<void> {
  await bucket.delete(key);
}

/**
 * 从 URL 路径中提取 R2 key
 * 例如 "/uploads/2026/abc.webp" → "uploads/2026/abc.webp"
 */
export function urlToKey(url: string): string {
  return url.startsWith('/') ? url.slice(1) : url;
}

/**
 * 根据 MIME 类型获取文件扩展名
 */
function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
  };
  return map[mime] ?? 'bin';
}

/**
 * 上传错误类型
 */
export class UploadError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'UploadError';
    this.code = code;
  }
}
