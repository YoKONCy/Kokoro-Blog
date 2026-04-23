/**
 * 通用工具函数
 */

/**
 * 计算文章阅读时间（分钟）
 * 中文按每分钟 400 字计算
 */
export function getReadingTime(content: string): number {
  const chineseChars = (content.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = content
    .replace(/[\u4e00-\u9fff]/g, '')
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = chineseChars / 400 + englishWords / 200;
  return Math.max(1, Math.ceil(minutes));
}

/**
 * 生成文章摘要
 */
export function getExcerpt(content: string, maxLength = 120): string {
  const plainText = content
    .replace(/#+\s/g, '')           // 移除标题
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/\[.*?\]\(.*?\)/g, '$1') // 链接只保留文字
    .replace(/[*_~`]/g, '')         // 移除格式标记
    .replace(/\n+/g, ' ')          // 换行变空格
    .trim();

  if (plainText.length <= maxLength) return plainText;
  return plainText.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}

/**
 * 生成 slug（用于 CSS id、anchor 等）
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * 类名合并工具
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
