import type { locales } from "@/lib/i18n";
import type messages from "@/lib/i18n/messages/en.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof locales)[number];
    Messages: typeof messages;
  }
}
