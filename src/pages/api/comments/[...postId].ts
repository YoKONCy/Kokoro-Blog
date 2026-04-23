/**
 * 评论 API — GET/POST /api/comments/[...postId]
 * 使用 rest 参数匹配 2026/post-slug 格式的文章 ID
 */
import type { APIRoute } from 'astro';
import { getComments, createComment, getCommentCount } from '@/lib/cloudflare/d1';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const postSlug = params.postId;
    if (!postSlug) {
      return Response.json({ success: false, error: '缺少文章标识' }, { status: 400 });
    }

    const db = locals.runtime.env.DB;
    const [comments, count] = await Promise.all([
      getComments(db, postSlug),
      getCommentCount(db, postSlug),
    ]);

    return Response.json({ success: true, data: { comments, count } });
  } catch (e) {
    return Response.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ params, request, locals }) => {
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

    if (!body.author?.trim() || !body.content?.trim()) {
      return Response.json({ success: false, error: '名字和内容不能为空' }, { status: 400 });
    }
    if (body.content.length > 2000) {
      return Response.json({ success: false, error: '评论内容不能超过 2000 字' }, { status: 400 });
    }
    if (body.author.length > 50) {
      return Response.json({ success: false, error: '名字不能超过 50 字' }, { status: 400 });
    }

    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
    const ipHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
    const ipHash = Array.from(new Uint8Array(ipHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);

    const db = locals.runtime.env.DB;
    const id = await createComment(db, {
      postSlug,
      author: body.author.trim(),
      email: body.email?.trim(),
      content: body.content.trim(),
      parentId: body.parentId,
      ipHash,
    });

    return Response.json({ success: true, data: { id, message: '评论已提交，等待审核' } }, { status: 201 });
  } catch (e) {
    return Response.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
};
