/**
 * i18n 类型定义
 */
import type zh from './locales/zh';

export type TranslationKey = keyof typeof zh;
export type Locale = 'zh'; // 未来扩展: 'zh' | 'en' | 'ja'
export type Messages = Record<TranslationKey, string>;
