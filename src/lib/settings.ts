/**
 * 动态站点配置
 *
 * 从 D1 site_settings 表读取配置，与 i18n 默认值合并。
 * DB 中有值则覆盖默认值，没有则回退到 i18n 硬编码值。
 *
 * 预设 Key 清单：
 *   site.title       — 网站标题
 *   site.description  — 网站描述
 *   site.logo_text    — 左上角 Logo 文字
 *   hero.title        — 首页 Hero 标题
 *   hero.description  — 首页 Hero 副标题
 *   comment.tpm_limit — 评论限流：每个窗口期最大条数
 *   comment.tpm_window — 评论限流：窗口期秒数
 *   footer.text       — 页脚文字
 */
import { t } from '@/lib/i18n';
import { getAllSettings } from '@/lib/cloudflare/d1';

/** 默认值（来自 i18n 或硬编码） */
const DEFAULTS: Record<string, () => string> = {
  'site.title': () => t('site.title'),
  'site.description': () => t('site.description'),
  'site.logo_text': () => t('site.title'),
  'hero.title': () => t('site.title'),
  'hero.description': () => t('site.description'),
  'comment.tpm_limit': () => '5',
  'comment.tpm_window': () => '600',
  'footer.text': () => `© ${new Date().getFullYear()} ${t('site.title')}`,
  'about.title': () => '关于我',
  'about.content': () => '这里是关于页的内容，可以在后台管理中编辑。支持 **Markdown** 格式。',
  'about.avatar': () => '',
};

/** 所有可配置的 key 列表 */
export type SettingKey = keyof typeof DEFAULTS;

/** 运行时配置对象 */
export interface SiteConfig {
  /** 获取配置值，如果 DB 中无值则返回默认值 */
  get(key: string): string;
  /** 获取评论限流参数 */
  getCommentLimit(): { maxCount: number; windowSeconds: number };
  /** 获取所有配置值（用于设置页面表单回显） */
  getAll(): Record<string, string>;
}

/**
 * 从 D1 加载站点配置并与默认值合并
 *
 * @param db D1Database 绑定（可选，传 null 则仅使用默认值）
 * @returns SiteConfig 对象
 *
 * @example
 * ```ts
 * const config = await loadSiteConfig(Astro.locals.runtime.env.DB);
 * const title = config.get('site.title');
 * ```
 */
export async function loadSiteConfig(db: D1Database | null): Promise<SiteConfig> {
  let dbSettings: Record<string, string> = {};

  if (db) {
    try {
      dbSettings = await getAllSettings(db);
    } catch {
      // D1 不可用时（如本地开发未绑定），静默回退到默认值
      console.warn('[settings] D1 不可用，使用默认配置');
    }
  }

  const config: SiteConfig = {
    get(key: string): string {
      // 优先使用 DB 值
      if (key in dbSettings) {
        return dbSettings[key];
      }
      // 回退到默认值
      const defaultFn = DEFAULTS[key];
      return defaultFn ? defaultFn() : '';
    },

    getCommentLimit() {
      return {
        maxCount: parseInt(config.get('comment.tpm_limit'), 10) || 5,
        windowSeconds: parseInt(config.get('comment.tpm_window'), 10) || 600,
      };
    },

    getAll(): Record<string, string> {
      const result: Record<string, string> = {};
      // 先填入所有默认值
      for (const [key, fn] of Object.entries(DEFAULTS)) {
        result[key] = fn();
      }
      // 用 DB 值覆盖
      for (const [key, value] of Object.entries(dbSettings)) {
        result[key] = value;
      }
      return result;
    },
  };
  return config;
}
