/**
 * 文章管理 API — /api/admin/posts
 * GET: 获取所有文章（含草稿）
 * POST: 创建新文章
 * PUT: 更新文章
 * DELETE: 删除文章
 */
import type { APIRoute } from 'astro';
import { getAllPosts, getPostById, createPost, updatePost, deletePost } from '@/lib/cloudflare/d1';
import { getDB } from '@/lib/cloudflare/env';
import { createPostSchema, updatePostSchema, validateInput } from '@/lib/validation';

export const prerender = false;

/** 简单鉴权：检查 session cookie */
async function checkAuth(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return false;
  const match = cookieHeader.match(/(?:^|;\s*)session=([^;]*)/);
  if (!match) return false;

  const { validateSession } = await import('@/lib/cloudflare/d1');
  const db = await getDB();
  if (!db) return false;
  return validateSession(db, decodeURIComponent(match[1]));
}

export const GET: APIRoute = async ({ request }) => {
  if (!(await checkAuth(request))) {
    return Response.json({ success: false, error: '未授权' }, { status: 401 });
  }
  try {
    const db = await getDB();
    if (!db) return Response.json({ success: false, error: 'D1 不可用' }, { status: 503 });
    const posts = await getAllPosts(db);
    return Response.json({ success: true, data: posts });
  } catch (e) {
    return Response.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!(await checkAuth(request))) {
    return Response.json({ success: false, error: '未授权' }, { status: 401 });
  }
  try {
    const db = await getDB();
    if (!db) return Response.json({ success: false, error: 'D1 不可用' }, { status: 503 });

    const body = await request.json();
    const data = validateInput(createPostSchema, body);
    if (data instanceof Response) return data;

    const id = await createPost(db, {
      slug: data.slug,
      title: data.title,
      description: data.description,
      content: data.content,
      heroImage: data.heroImage,
      tags: data.tags,
      status: data.status,
    });

    return Response.json({ success: true, data: { id } }, { status: 201 });
  } catch (e: any) {
    if (e?.message?.includes('UNIQUE constraint')) {
      return Response.json({ success: false, error: '该 Slug 已存在' }, { status: 409 });
    }
    return Response.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  if (!(await checkAuth(request))) {
    return Response.json({ success: false, error: '未授权' }, { status: 401 });
  }
  try {
    const db = await getDB();
    if (!db) return Response.json({ success: false, error: 'D1 不可用' }, { status: 503 });

    const body = await request.json();
    const data = validateInput(updatePostSchema, body);
    if (data instanceof Response) return data;

    const existing = await getPostById(db, data.id);
    if (!existing) {
      return Response.json({ success: false, error: '文章不存在' }, { status: 404 });
    }

    await updatePost(db, data.id, {
      slug: data.slug,
      title: data.title,
      description: data.description,
      content: data.content,
      heroImage: data.heroImage,
      tags: data.tags,
      status: data.status,
    });

    return Response.json({ success: true, data: { message: '更新成功' } });
  } catch (e: any) {
    if (e?.message?.includes('UNIQUE constraint')) {
      return Response.json({ success: false, error: '该 Slug 已存在' }, { status: 409 });
    }
    return Response.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  if (!(await checkAuth(request))) {
    return Response.json({ success: false, error: '未授权' }, { status: 401 });
  }
  try {
    const db = await getDB();
    if (!db) return Response.json({ success: false, error: 'D1 不可用' }, { status: 503 });

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return Response.json({ success: false, error: '缺少文章 ID' }, { status: 400 });
    }

    await deletePost(db, id);
    return Response.json({ success: true, data: { message: '删除成功' } });
  } catch (e) {
    return Response.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
};

