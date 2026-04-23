/**
 * i18n 国际化入口
 * 当前仅支持中文，架构预留多语言扩展
 */
import zh from './locales/zh';
import type { TranslationKey, Locale } from './types';

const currentLocale: Locale = 'zh';
const messages = { zh } as const;

/**
 * 获取翻译文本
 */
export function t(key: TranslationKey): string {
  return messages[currentLocale][key];
}

/**
 * 获取当前语言
 */
export function getLocale(): Locale {
  return currentLocale;
}

export type { TranslationKey, Locale };
