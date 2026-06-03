import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;
let _initTried = false;

export function getRedis(): Redis | null {
  if (_initTried) return _redis;
  _initTried = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}
