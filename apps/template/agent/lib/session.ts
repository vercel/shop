import type { ToolContext } from "eve/tools";

import { defaultLocale, type Locale } from "@/lib/i18n";

// Set on the caller's attributes by the channel AuthFn (see agent/channels/eve.ts).
interface SessionAttributes {
  readonly cartId?: string;
  readonly locale?: string;
}

function attributes(ctx: ToolContext): SessionAttributes {
  return (ctx.session.auth.current?.attributes ?? {}) as SessionAttributes;
}

export function getLocale(ctx: ToolContext): Locale {
  return (attributes(ctx).locale as Locale) ?? defaultLocale;
}

export function getCartId(ctx: ToolContext): string | undefined {
  return attributes(ctx).cartId;
}
