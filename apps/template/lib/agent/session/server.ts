import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { Redis } from "@upstash/redis";

import type { AgentSessionBinding, ShopperSession } from "./types";

export const AGENT_COOKIE = "shop_agent_session";
export const SESSION_TTL = 86_400;

let redis: Redis | undefined;

export function agentStore() {
  if (!redis) {
    const url = process.env.AGENT_REDIS_URL;
    const token = process.env.AGENT_REDIS_TOKEN;
    if (!url || !token) throw new Error("Agent Redis credentials are required.");
    redis = new Redis({ token, url });
  }
  return redis;
}

export function agentKey(kind: string, id: string) {
  const namespace = createHash("sha256")
    .update(process.env.AGENT_STOREFRONT_URL ?? "")
    .digest("hex")
    .slice(0, 16);
  return `shop-agent:${namespace}:${kind}:${id}`;
}

function signature(value: string) {
  const secret = process.env.AGENT_SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("AGENT_SESSION_SECRET must contain at least 32 characters.");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function signAgentValue(value: string) {
  const payload = Buffer.from(value).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyAgentValue(value: string): string | undefined {
  const [payload, mac, extra] = value.split(".");
  if (!payload || !mac || extra || value.length > 4096) return;
  const expected = Buffer.from(signature(payload));
  const actual = Buffer.from(mac);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return;
  return Buffer.from(payload, "base64url").toString();
}

export function readAgentId(request: Request) {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${AGENT_COOKIE}=`));
  if (!cookie) return;
  const id = verifyAgentValue(cookie.slice(AGENT_COOKIE.length + 1));
  return id && /^[a-f0-9-]{36}$/.test(id) ? id : undefined;
}

export async function getShopperSession(request: Request) {
  const id = readAgentId(request);
  if (!id) return null;
  const session = await agentStore().get<ShopperSession>(agentKey("shopper", id));
  return session && session.expiresAt > Date.now() ? session : null;
}

export async function saveShopperSession(request: Request, cartId: string) {
  const previous = await getShopperSession(request);
  const session: ShopperSession = {
    cartId,
    expiresAt: Date.now() + SESSION_TTL * 1000,
    id: previous?.id ?? randomUUID(),
  };
  await agentStore().set(agentKey("shopper", session.id), session, { ex: SESSION_TTL });
  return session;
}

export function shopperCookie(id: string, secure: boolean) {
  return `${AGENT_COOKIE}=${signAgentValue(id)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL}${secure ? "; Secure" : ""}`;
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  return site !== "cross-site" && origin === new URL(process.env.AGENT_STOREFRONT_URL!).origin;
}

export async function assertSessionOwner(sessionId: string, shopperId: string) {
  const owner = await agentStore().get<AgentSessionBinding>(agentKey("session", sessionId));
  if (owner?.shopperId !== shopperId) throw new Error("Session is not available.");
  return owner;
}
