/**
 * API 输入验证 Schema
 *
 * 使用 Zod（Astro 内置）为所有 API 端点提供类型安全的输入验证。
 * 统一管理校验规则，避免在各 API 文件中重复编写手动校验逻辑。
 */
import { z } from 'astro/zod';

// ===== 通用规则 =====

/** Slug 格式：小写字母、数字、连字符，3-200 字符 */
const slugSchema = z
  .string()
  .min(1, 'Slug 不能为空')
  .max(200, 'Slug 不能超过 200 字符')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug 只能包含小写字母、数字和连字符');

/** 标签数组：每项 1-30 字符，最多 20 个标签 */
const tagsSchema = z
  .array(z.string().min(1).max(30))
  .max(20, '最多 20 个标签')
  .default([]);

/** 文章状态枚举 */
const postStatusSchema = z.enum(['draft', 'published']);

// ===== 文章 API =====

/** POST /api/admin/posts — 创建文章 */
export const createPostSchema = z.object({
  slug: slugSchema,
  title: z
    .string()
    .min(1, '标题不能为空')
    .max(200, '标题不能超过 200 字符')
    .transform(s => s.trim()),
  description: z
    .string()
    .max(500, '摘要不能超过 500 字符')
    .default('')
    .transform(s => s.trim()),
  content: z.string().default(''),
  heroImage: z
    .string()
    .url('封面图必须是有效的 URL')
    .or(z.string().startsWith('/', '封面图必须是有效的路径'))
    .or(z.literal(''))
    .optional()
    .transform(s => s?.trim() || undefined),
  tags: tagsSchema,
  status: postStatusSchema.default('draft'),
});
export type CreatePostInput = z.infer<typeof createPostSchema>;

/** PUT /api/admin/posts — 更新文章 */
export const updatePostSchema = z.object({
  id: z.string().min(1, '缺少文章 ID'),
  slug: slugSchema.optional(),
  title: z
    .string()
    .min(1, '标题不能为空')
    .max(200, '标题不能超过 200 字符')
    .transform(s => s.trim())
    .optional(),
  description: z
    .string()
    .max(500, '摘要不能超过 500 字符')
    .transform(s => s.trim())
    .optional(),
  content: z.string().optional(),
  heroImage: z
    .string()
    .url('封面图必须是有效的 URL')
    .or(z.string().startsWith('/', '封面图必须是有效的路径'))
    .or(z.literal(''))
    .optional()
    .transform(s => s?.trim() || undefined),
  tags: tagsSchema.optional(),
  status: postStatusSchema.optional(),
});
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

// ===== 评论 API =====

/** POST /api/comments/[postId] — 发表评论 */
export const createCommentSchema = z.object({
  author: z
    .string()
    .min(1, '名字不能为空')
    .max(50, '名字不能超过 50 字')
    .transform(s => s.trim()),
  email: z
    .string()
    .email('邮箱格式不正确')
    .optional()
    .or(z.literal(''))
    .transform(s => s?.trim() || undefined),
  content: z
    .string()
    .min(1, '评论内容不能为空')
    .max(2000, '评论内容不能超过 2000 字')
    .transform(s => s.trim()),
  parentId: z.string().optional(),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// ===== 搜索 API =====

/** GET /api/search?q= — 搜索查询 */
export const searchQuerySchema = z.object({
  q: z
    .string()
    .min(1, '搜索词不能为空')
    .max(100, '搜索词过长')
    .transform(s => s.trim()),
});

// ===== Markdown 预览 =====

/** POST /api/admin/preview — Markdown 预览 */
export const previewSchema = z.object({
  markdown: z.string(),
});

// ===== 工具函数 =====

/**
 * 统一验证并返回标准化的错误响应。
 * 成功时返回解析后的类型安全数据，失败时返回包含所有错误字段的 Response。
 *
 * @example
 * ```ts
 * const result = validateInput(createPostSchema, body);
 * if (result instanceof Response) return result;
 * // result 已通过类型推断
 * const { slug, title } = result;
 * ```
 */
export function validateInput<T extends z.ZodType>(
  schema: T,
  data: unknown,
): z.infer<T> | Response {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues.map((issue: { path: PropertyKey[]; message: string }) => ({
      field: issue.path.map(String).join('.'),
      message: issue.message,
    }));
    return Response.json(
      {
        success: false,
        error: errors[0]?.message ?? '输入验证失败',
        errors,
      },
      { status: 400 },
    );
  }
  return result.data;
}
