import "server-only";
import { getCache } from "@vercel/functions";

const WINDOW_MS = 60_000;
const LIMIT = 20;
const TTL_SECONDS = Math.ceil(WINDOW_MS / 1000);

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number;
}

// Sliding window log over Vercel Runtime Cache. Regional, eventually consistent,
// no atomic CAS — concurrent requests can over-admit by a small constant. Fine
// for abuse mitigation; swap for an atomic store if exact accounting is needed.
export async function rateLimit(key: string): Promise<RateLimitResult> {
  const cache = getCache({ namespace: "chat-rl" });
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  const stored = (await cache.get(key)) as number[] | undefined;
  const recent = (stored ?? []).filter((t) => t > cutoff);

  if (recent.length >= LIMIT) {
    const oldest = recent[0] ?? now;
    return { ok: false, retryAfter: Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000)) };
  }

  recent.push(now);
  await cache.set(key, recent, { ttl: TTL_SECONDS });
  return { ok: true, retryAfter: 0 };
}

export function getRequestIp(headers: Headers): string {
  const fwd = headers.get("x-vercel-forwarded-for") ?? headers.get("x-forwarded-for");
  if (fwd) {
    return fwd.split(",")[0].trim();
  }
  return headers.get("x-real-ip") ?? "anonymous";
}
