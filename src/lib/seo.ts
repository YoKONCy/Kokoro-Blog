/**
 * SEO 工具函数
 */
import { t as _t } from '@/lib/i18n';

export interface SEOProps {
  title: string;
  description: string;
  image?: string;
  article?: {
    publishedTime: string;
    modifiedTime?: string;
    tags?: string[];
    author?: string;
  };
  canonicalUrl?: string;
  noindex?: boolean;
}

/**
 * 站点默认配置
 * title/description 从 i18n 获取，避免重复定义
 * TODO: 替换 url/author 为你的实际信息
 */
export const SITE = {
  get title() { return _t('site.title'); },
  get description() { return _t('site.description'); },
  url: 'https://your-blog.pages.dev', // 部署后替换
  author: 'Your Name',
  authorUrl: 'https://your-blog.pages.dev/about',
  locale: 'zh-CN',
  ogImage: '/og-default.png',
} as const;

/**
 * 生成页面完整标题
 */
export function getPageTitle(pageTitle?: string): string {
  if (!pageTitle) return SITE.title;
  return `${pageTitle} | ${SITE.title}`;
}

/**
 * 生成文章的 JSON-LD 结构化数据
 */
export function generateArticleSchema(post: {
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  heroImage?: string;
  tags?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.pubDate.toISOString(),
    dateModified: post.updatedDate?.toISOString() ?? post.pubDate.toISOString(),
    author: {
      '@type': 'Person',
      name: SITE.author,
      url: SITE.authorUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.title,
      url: SITE.url,
    },
    image: post.heroImage ? `${SITE.url}${post.heroImage}` : `${SITE.url}${SITE.ogImage}`,
    keywords: post.tags?.join(', '),
    mainEntityOfPage: {
      '@type': 'WebPage',
    },
  };
}

/**
 * 生成网站的 JSON-LD 结构化数据
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.title,
    description: SITE.description,
    url: SITE.url,
    author: {
      '@type': 'Person',
      name: SITE.author,
    },
  };
}
