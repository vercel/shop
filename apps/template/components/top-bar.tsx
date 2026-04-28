import { ChevronDownIcon } from "lucide-react";
import { Suspense } from "react";

import { Container } from "@/components/ui/container";
import { CountryFlag } from "@/components/ui/country-flag";
import { enabledLocales, getLocaleData, type Locale } from "@/lib/i18n";

import { LocaleSwitcher } from "./top-bar-client";

function LocaleSwitcherFallback({ locale }: { locale: Locale }) {
  return (
    <span className="relative flex items-center gap-2 pr-4 text-xs uppercase tracking-wide">
      <CountryFlag locale={locale} size="sm" className="rounded-xs" />
      {getLocaleData(locale).label}
      <ChevronDownIcon aria-hidden className="pointer-events-none absolute right-0 size-3" />
    </span>
  );
}

export function TopBar({ locale }: { locale: Locale }) {
  return (
    <div className="bg-foreground text-background">
      <Container className="flex items-center justify-end py-1.5 text-xs">
        <Suspense fallback={<LocaleSwitcherFallback locale={locale} />}>
          <LocaleSwitcher current={locale} locales={enabledLocales} />
        </Suspense>
      </Container>
    </div>
  );
}
