/**
 * Jieba 中文分词封装
 *
 * 使用 jieba-wasm（基于 jieba-rs 的 WASM 绑定），
 * 在应用层对中文文本进行预分词，将分词结果以空格分隔后
 * 存入 FTS5 索引，使 unicode61 分词器能正确切分中文词语。
 *
 * 搜索时同样对查询词进行分词，保证索引与查询一致。
 */

import { cut_for_search, cut } from 'jieba-wasm';

/**
 * 判断文本是否包含中文字符
 */
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
}

/**
 * 对文本进行中文分词预处理（用于 FTS5 索引写入）
 *
 * 策略：
 *  - 使用 cut_for_search（搜索模式），会输出更细粒度的子词
 *    例如 "中华人民共和国" → ["中华", "华人", "人民", "共和", "共和国", "中华人民共和国"]
 *    这样无论用户搜索 "中华" 还是 "共和国" 都能命中
 *  - 非中文文本原样保留，交给 unicode61 自行分词
 *  - 过滤掉纯空白和标点符号 token
 */
export function segmentForIndex(text: string): string {
  if (!text) return '';
  if (!containsChinese(text)) return text;

  try {
    const tokens = cut_for_search(text, true);
    return tokens
      .filter((t: string) => t.trim().length > 0)
      .join(' ');
  } catch {
    // 分词失败时返回原文，不阻塞写入流程
    return text;
  }
}

/**
 * 对搜索查询进行分词预处理（用于 FTS5 MATCH 查询）
 *
 * 策略：
 *  - 使用 cut（精确模式），避免搜索时子词过多导致结果发散
 *  - 分词后以空格连接，FTS5 会自动 AND 匹配
 *  - 过滤掉纯标点和空白
 */
export function segmentForSearch(query: string): string {
  if (!query) return '';
  if (!containsChinese(query)) return query;

  try {
    const tokens = cut(query, true);
    return tokens
      .filter((t: string) => t.trim().length > 0 && !/^[\s\p{P}]+$/u.test(t))
      .join(' ');
  } catch {
    return query;
  }
}
