/**
 * Cloudflare Bindings 类型定义
 */
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  BUCKET: R2Bucket;
  ADMIN_PASSWORD: string;
}

declare global {
  // Astro 环境类型扩展
  namespace App {
    interface Locals {
      runtime: {
        env: Env;
        ctx: ExecutionContext;
      };
    }
  }
}

export {};
