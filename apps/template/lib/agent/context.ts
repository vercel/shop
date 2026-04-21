import type { Locale } from "../i18n";
import type { ProductDetails } from "../types";

export type User =
  | { type: "guest"; locale: Locale }
  | {
      type: "user";
      locale: Locale;
      id: string;
      email: string;
      name: string;
      accessToken: string;
    };

// Page context resolved from Referer header with trusted data
export type PageContext =
  | { type: "home" }
  | { type: "product"; product: ProductDetails }
  | { type: "collection"; handle: string; title: string }
  | { type: "search"; query: string }
  | { type: "cart" }
  | null;

// We can track context in here like current user or current page
// so we can adapt the agent's behavior to the context, like having order tools for logged in users etc
export interface AgentContext {
  chatId: string;
  user: User;
  cart: string | undefined;
  page: PageContext;
}

export const agentContext = new AsyncLocalStorage<AgentContext>();
export function withAgentContext<T>(ctx: AgentContext, fn: () => T): T {
  return agentContext.run(ctx, fn);
}

export function setUser(user: User) {
  const ctx = agentContext.getStore();
  if (ctx) {
    ctx.user = user;
  }
}

export function getAgentContext() {
  const ctx = agentContext.getStore();
  if (!ctx) {
    throw new Error("Agent context not found");
  }
  return ctx;
}
