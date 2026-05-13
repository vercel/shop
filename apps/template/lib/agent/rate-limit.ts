import "server-only";

const WINDOW_MS = 60_000;
const LIMIT = 20;

const hits = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number;
}

// Best-effort per-instance limiter. Swap for Vercel KV / Upstash / Runtime Cache in production.
export function rateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }
  if (entry.count >= LIMIT) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true, retryAfter: 0 };
}

export function getRequestIp(headers: Headers): string {
  const fwd = headers.get("x-vercel-forwarded-for") ?? headers.get("x-forwarded-for");
  if (fwd) {
    return fwd.split(",")[0].trim();
  }
  return headers.get("x-real-ip") ?? "anonymous";
}
