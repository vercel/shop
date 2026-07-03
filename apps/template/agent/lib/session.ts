import type { ToolContext } from "eve/tools";

import { defaultLocale, type Locale } from "@/lib/i18n";

// Per-session context the channel AuthFn attaches to the caller's attributes
// (see agent/channels/eve.ts). Read here so tools stay decoupled from the
// channel wiring.
interface SessionAttributes {
  readonly cartId?: string;
  readonly locale?: string;
}

function attributes(ctx: ToolContext): SessionAttributes {
  return (ctx.session.auth.current?.attributes ?? {}) as SessionAttributes;
}

/** Active deployment locale for this session; falls back to the default locale. */
export function getLocale(ctx: ToolContext): Locale {
  return (attributes(ctx).locale as Locale) ?? defaultLocale;
}

/** Cart id resolved for this session (from the cart cookie), if any. */
export function getCartId(ctx: ToolContext): string | undefined {
  return attributes(ctx).cartId;
}
