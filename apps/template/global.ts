import type { locales } from "@/lib/i18n";
import type messages from "@/lib/i18n/messages/en.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof locales)[number];
    Messages: typeof messages;
  }
}

// Supported by the app-router runtime + gated behind experimental.dynamicOnHover, but absent from next/link's public LinkProps. Remove when upstream types catch up.
declare module "next/link" {
  interface LinkProps<RouteInferType = any> {
    unstable_dynamicOnHover?: boolean;
  }
}
