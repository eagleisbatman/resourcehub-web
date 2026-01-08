import bcrypt from "bcrypt";

const API_KEY_PREFIX = "rh_live_sk_";
const API_KEY_RANDOM_LENGTH = 32;
const API_KEY_PREFIX_LENGTH = 8;
const HASH_ROUNDS = parseInt(process.env.API_KEY_HASH_ROUNDS || "12", 10);

/**
 * Generate a random alphanumeric string
 */
function generateRandomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a new API key in the format: rh_live_sk_<32 random chars>
 */
export function generateApiKey(): string {
  const randomPart = generateRandomString(API_KEY_RANDOM_LENGTH);
  return `${API_KEY_PREFIX}${randomPart}`;
}

/**
 * Extract the first 8 characters after the prefix for identification
 */
export function extractKeyPrefix(key: string): string {
  const withoutPrefix = key.replace(API_KEY_PREFIX, "");
  return withoutPrefix.substring(0, API_KEY_PREFIX_LENGTH);
}

/**
 * Hash an API key using bcrypt
 */
export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, HASH_ROUNDS);
}

/**
 * Validate a plain API key against a hashed key
 */
export async function validateApiKey(plainKey: string, hashedKey: string): Promise<boolean> {
  return bcrypt.compare(plainKey, hashedKey);
}
