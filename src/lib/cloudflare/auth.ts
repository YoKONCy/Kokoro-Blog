/**
 * 鉴权安全工具
 *
 * 密码哈希：PBKDF2-SHA256 + 随机盐值（Web Crypto API 原生支持）
 * Session Token：存储前 SHA-256 哈希，防止数据库泄漏后 Token 被直接盗用
 *
 * 密码存储格式：pbkdf2:<iterations>:<salt_hex>:<hash_hex>
 * 旧格式（纯 SHA-256 hex）会在登录时被自动升级
 */

// ===== 配置 =====

/** PBKDF2 迭代次数。10 万次在 Edge 环境下约 50-100ms，对暴力破解极不友好 */
const PBKDF2_ITERATIONS = 100_000;
/** 盐值长度（字节） */
const SALT_LENGTH = 16;
/** 派生密钥长度（字节） */
const KEY_LENGTH = 32;

// ===== 内部工具 =====

/** 将 ArrayBuffer / Uint8Array 转为 hex 字符串 */
function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** 将 hex 字符串转回 Uint8Array */
function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// ===== 密码哈希 =====

/**
 * 使用 PBKDF2-SHA256 哈希密码
 * @returns 格式化字符串 `pbkdf2:100000:<salt_hex>:<hash_hex>`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8, // bits
  );

  return `pbkdf2:${PBKDF2_ITERATIONS}:${toHex(salt)}:${toHex(derivedBits)}`;
}

/**
 * 验证密码是否匹配存储的哈希
 * 自动兼容旧版纯 SHA-256 格式（64 位 hex）
 *
 * @returns `{ valid: boolean; needsUpgrade: boolean }`
 *   - valid: 密码是否正确
 *   - needsUpgrade: 是否是旧格式，需要在验证成功后重新哈希并更新数据库
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<{ valid: boolean; needsUpgrade: boolean }> {
  // 新格式：pbkdf2:iterations:salt:hash
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    if (parts.length !== 4) return { valid: false, needsUpgrade: false };

    const iterations = parseInt(parts[1], 10);
    const salt = fromHex(parts[2]).buffer.slice(0) as ArrayBuffer;
    const expectedHash = parts[3];

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits'],
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      KEY_LENGTH * 8,
    );

    const actualHash = toHex(derivedBits);
    // 使用时间恒定比较（通过逐字符异或），防止时序攻击
    const valid = timingSafeEqual(expectedHash, actualHash);
    return { valid, needsUpgrade: false };
  }

  // 旧格式：纯 64 字符 SHA-256 hex（无盐）
  if (/^[0-9a-f]{64}$/.test(storedHash)) {
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(password),
    );
    const inputHash = toHex(hashBuffer);
    const valid = timingSafeEqual(storedHash, inputHash);
    return { valid, needsUpgrade: true };
  }

  // 未知格式
  return { valid: false, needsUpgrade: false };
}

// ===== Session Token 哈希 =====

/**
 * 对 Session Token 进行 SHA-256 哈希后再存入数据库
 * Cookie 中保留原始 Token，数据库中只存哈希值
 */
export async function hashSessionToken(token: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  );
  return toHex(hashBuffer);
}

// ===== 辅助函数 =====

/**
 * 时间恒定的字符串比较
 * 防止通过响应时间差异推断出部分正确的哈希值（时序攻击）
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
