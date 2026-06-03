import { getRedis } from "./redis";

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();
  if (!redis) return fetcher();
  try {
    const hit = await redis.get<T>(key);
    if (hit !== null && hit !== undefined) return hit;
  } catch (e) {
    console.warn("cache get failed:", e);
  }
  const value = await fetcher();
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (e) {
    console.warn("cache set failed:", e);
  }
  return value;
}

export async function invalidate(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (e) {
    console.warn("cache del failed:", e);
  }
}

export async function invalidatePrefix(prefix: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  // Note: keys() is O(n); replace with SCAN or tag-based invalidation if dataset grows.
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length > 0) await redis.del(...keys);
  } catch (e) {
    console.warn("cache prefix-del failed:", e);
  }
}
