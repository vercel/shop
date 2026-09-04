import type { locales } from "@/lib/i18n";
import type messages from "@/lib/i18n/messages/en.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof locales)[number];
    Messages: typeof messages;
  }
}

// `next/link` types resolve to the Pages Router declaration, which omits this App Router prop
// even though the runtime (dist/client/app-dir/link) accepts it. Remove once Next declares it.
declare module "next/dist/client/link" {
  interface LinkProps {
    /**
     * (unstable) Upgrade the default App Shell prefetch to a per-link runtime prefetch on
     * hover/touch. Requires `experimental.dynamicOnHover` in next.config.
     */
    unstable_dynamicOnHover?: boolean;
  }
}
