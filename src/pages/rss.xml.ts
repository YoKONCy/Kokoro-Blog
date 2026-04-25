/**
 * RSS 2.0 Feed — /rss.xml
 *
 * 从 D1 动态生成 RSS feed，包含最新的已发布文章。
 * 读者可以将此 URL 添加到 RSS 阅读器中订阅博客更新。
 */
import type { APIRoute } from 'astro';
import { getPublishedPosts, parseTags } from '@/lib/cloudflare/d1';
import { getDB } from '@/lib/cloudflare/env';
import { loadSiteConfig } from '@/lib/settings';

export const prerender = false;

/** XML 特殊字符转义 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const db = await getDB();
    if (!db) {
      return new Response('D1 不可用', { status: 503 });
    }

    const config = await loadSiteConfig(db);
    const siteTitle = config.get('site.title');
    const siteDescription = config.get('site.description');

    // 从请求 URL 推断站点根地址
    const url = new URL(request.url);
    const siteUrl = `${url.protocol}//${url.host}`;

    // 获取最新 50 篇文章
    const { items: posts } = await getPublishedPosts(db, 50);

    const itemsXml = posts
      .map(post => {
        const tags = parseTags(post.tags);
        const categoriesXml = tags
          .map(tag => `        <category>${escapeXml(tag)}</category>`)
          .join('\n');

        return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/blog/${escapeXml(post.slug)}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${escapeXml(post.slug)}</guid>
      <description>${escapeXml(post.description || '')}</description>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
${categoriesXml}
    </item>`;
      })
      .join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <description>${escapeXml(siteDescription)}</description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Kokoro Blog (Astro)</generator>
${itemsXml}
  </channel>
</rss>`;

    return new Response(rss, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // 缓存 1 小时
      },
    });
  } catch (e) {
    console.error('[rss] 生成 RSS 失败:', e);
    return new Response('RSS 生成失败', { status: 500 });
  }
};
