import { createHash, randomBytes } from "node:crypto";

const AGENT_BROWSER_COOKIE = "shop_agent_browser";

const BROWSER_ID_PATTERN = /^[\w-]{22,64}$/;
const BROWSER_ID_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function readAgentBrowserId(cookieHeader: string | null): string | undefined {
  for (const part of cookieHeader?.split(";") ?? []) {
    const [name, ...value] = part.trim().split("=");
    if (name !== AGENT_BROWSER_COOKIE) continue;
    const id = value.join("=");
    return BROWSER_ID_PATTERN.test(id) ? id : undefined;
  }
  return undefined;
}

export function createAgentBrowserCookie(secure: boolean): string {
  const id = randomBytes(16).toString("base64url");
  return `${AGENT_BROWSER_COOKIE}=${id}; Path=/; Max-Age=${BROWSER_ID_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

// Principal IDs reach Eve traces, so they carry a digest instead of the cookie value.
export function toAgentBrowserPrincipalId(browserId: string): string {
  return createHash("sha256").update(browserId).digest("hex");
}
