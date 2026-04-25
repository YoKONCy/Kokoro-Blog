/**
 * Sitemap XML — /sitemap.xml
 *
 * 从 D1 动态生成 Sitemap，帮助搜索引擎发现和索引所有页面。
 * 包含：首页、关于页、博客列表页、所有已发布文章、所有标签页。
 */
import type { APIRoute } from 'astro';
import { getPublishedPosts, getAllTags, parseTags } from '@/lib/cloudflare/d1';
import { getDB } from '@/lib/cloudflare/env';

export const prerender = false;

/** XML 特殊字符转义 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const db = await getDB();
    if (!db) {
      return new Response('D1 不可用', { status: 503 });
    }

    // 从请求 URL 推断站点根地址
    const url = new URL(request.url);
    const siteUrl = `${url.protocol}//${url.host}`;

    // 获取所有已发布文章（用较大 limit 确保全量收录）
    const { items: posts } = await getPublishedPosts(db, 10000);
    const tags = await getAllTags(db);

    const entries: SitemapEntry[] = [];

    // 静态页面
    entries.push(
      { loc: siteUrl, changefreq: 'daily', priority: '1.0' },
      { loc: `${siteUrl}/blog`, changefreq: 'daily', priority: '0.9' },
      { loc: `${siteUrl}/about`, changefreq: 'monthly', priority: '0.6' },
      { loc: `${siteUrl}/search`, changefreq: 'weekly', priority: '0.5' },
    );

    // 文章页面
    for (const post of posts) {
      entries.push({
        loc: `${siteUrl}/blog/${post.slug}`,
        lastmod: (post.updated_at || post.created_at).slice(0, 10),
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    // 标签页面
    for (const tag of tags) {
      entries.push({
        loc: `${siteUrl}/blog/tag/${encodeURIComponent(tag)}`,
        changefreq: 'weekly',
        priority: '0.6',
      });
    }

    const urlsXml = entries
      .map(entry => {
        let xml = `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>`;
        if (entry.lastmod) xml += `\n    <lastmod>${entry.lastmod}</lastmod>`;
        if (entry.changefreq) xml += `\n    <changefreq>${entry.changefreq}</changefreq>`;
        if (entry.priority) xml += `\n    <priority>${entry.priority}</priority>`;
        xml += '\n  </url>';
        return xml;
      })
      .join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // 缓存 1 小时
      },
    });
  } catch (e) {
    console.error('[sitemap] 生成 Sitemap 失败:', e);
    return new Response('Sitemap 生成失败', { status: 500 });
  }
};
