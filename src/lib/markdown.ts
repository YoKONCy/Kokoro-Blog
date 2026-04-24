/**
 * 运行时 Markdown → HTML 渲染管线
 *
 * 用于 D1 中存储的文章在 SSR 请求时实时编译为 HTML。
 * 复用与 astro.config.mjs 相同的 remark 插件（remarkDirective + remarkCallouts），
 * 确保前台渲染结果与 Content Collections 构建时输出一致。
 *
 * 管线：remark-parse → remark-gfm → remark-directive → remark-callouts
 *       → remark-rehype (allowDangerousHtml) → rehype-raw → rehype-sanitize → rehype-stringify
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkDirective from 'remark-directive';
import { remarkCallouts } from './remark-callouts.mjs';

/**
 * 自定义 sanitize schema：在默认安全规则上放宽一些限制
 * - 允许 class 属性（用于 callout、代码高亮等）
 * - 允许 data-* 属性
 * - 允许 <mark> 标签（搜索高亮）
 */
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'className', 'class', 'data*'],
    code: [...(defaultSchema.attributes?.['code'] ?? []), 'className', 'class', 'data*'],
    pre: [...(defaultSchema.attributes?.['pre'] ?? []), 'className', 'class', 'data*', 'style', 'tabindex'],
    div: [...(defaultSchema.attributes?.['div'] ?? []), 'className', 'class', 'data*'],
    span: [...(defaultSchema.attributes?.['span'] ?? []), 'className', 'class', 'data*', 'style'],
    p: [...(defaultSchema.attributes?.['p'] ?? []), 'className', 'class'],
    img: [...(defaultSchema.attributes?.['img'] ?? []), 'loading'],
  },
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'mark',
    'details',
    'summary',
  ],
};

/** 编译结果 */
export interface MarkdownResult {
  html: string;
}

// 缓存 processor 实例，避免每次请求都重新初始化插件链
let cachedProcessor: any = null;

function getProcessor() {
  if (!cachedProcessor) {
    cachedProcessor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkDirective)
      .use(remarkCallouts)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeSanitize, sanitizeSchema)
      .use(rehypeStringify);
  }
  return cachedProcessor;
}

/**
 * 将 Markdown 字符串编译为 HTML
 * @param markdown 原始 Markdown 文本
 * @returns 包含编译后 HTML 的结果对象
 */
export async function renderMarkdown(markdown: string): Promise<MarkdownResult> {
  const processor = getProcessor();
  const file = await processor.process(markdown);
  return {
    html: String(file),
  };
}

/**
 * 同步版本（用于不支持 async 的场景，如前端预览 fallback）
 * 注意：由于 unified 管线本质是异步的，此方法内部仍使用 await
 */
export { renderMarkdown as compileMarkdown };
