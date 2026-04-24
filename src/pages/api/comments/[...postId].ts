/**
 * 评论 API — GET/POST /api/comments/[...postId]
 * 使用 rest 参数匹配文章 slug
 *
 * 改造内容：
 * - 去除审核流程，评论直接以 approved 状态发布
 * - 添加 IP 级限流（从 site_settings 读取窗口期和最大条数）
 */
import type { APIRoute } from 'astro';
import { getComments, createComment, getCommentCount, getCommentCountByIp } from '@/lib/cloudflare/d1';
import { getDB } from '@/lib/cloudflare/env';
import { loadSiteConfig } from '@/lib/settings';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    const postSlug = params.postId;
    if (!postSlug) {
      return Response.json({ success: false, error: '缺少文章标识' }, { status: 400 });
    }

    const db = await getDB();
    if (!db) {
      return Response.json({ success: false, error: 'D1 不可用' }, { status: 503 });
    }

    const [comments, count] = await Promise.all([
      getComments(db, postSlug),
      getCommentCount(db, postSlug),
    ]);

    return Response.json({ success: true, data: { comments, count } });
  } catch (e) {
    return Response.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const postSlug = params.postId;
    if (!postSlug) {
      return Response.json({ success: false, error: '缺少文章标识' }, { status: 400 });
    }

    const body = await request.json() as {
      author?: string;
      email?: string;
      content?: string;
      parentId?: string;
    };

    // 基础校验
    if (!body.author?.trim() || !body.content?.trim()) {
      return Response.json({ success: false, error: '名字和内容不能为空' }, { status: 400 });
    }
    if (body.content.length > 2000) {
      return Response.json({ success: false, error: '评论内容不能超过 2000 字' }, { status: 400 });
    }
    if (body.author.length > 50) {
      return Response.json({ success: false, error: '名字不能超过 50 字' }, { status: 400 });
    }

    // IP hash（隐私友好）
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
    const ipHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
    const ipHash = Array.from(new Uint8Array(ipHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);

    const db = await getDB();
    if (!db) {
      return Response.json({ success: false, error: 'D1 不可用' }, { status: 503 });
    }

    // IP 限流：从 site_settings 读取配置
    const config = await loadSiteConfig(db);
    const { maxCount, windowSeconds } = config.getCommentLimit();

    const recentCount = await getCommentCountByIp(db, ipHash, windowSeconds);
    if (recentCount >= maxCount) {
      return Response.json(
        { success: false, error: `评论太频繁，请 ${Math.ceil(windowSeconds / 60)} 分钟后再试` },
        { status: 429 }
      );
    }

    // 创建评论（直接发布，无需审核）
    const id = await createComment(db, {
      postSlug,
      author: body.author.trim(),
      email: body.email?.trim(),
      content: body.content.trim(),
      parentId: body.parentId,
      ipHash,
    });

    return Response.json({ success: true, data: { id, message: '评论发表成功' } }, { status: 201 });
  } catch (e) {
    return Response.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
};
