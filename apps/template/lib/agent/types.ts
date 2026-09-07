import type { Locale } from "@/lib/i18n";

import type { PageContext } from "./routes/types";

export interface AgentContext {
  cartId: string | undefined;
  locale: Locale;
  page: PageContext;
}
