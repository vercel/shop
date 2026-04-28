import { ChevronDownIcon } from "lucide-react";
import { headers } from "next/headers";
import { Suspense } from "react";

import { Container } from "@/components/ui/container";
import { enabledLocales, getLocaleData, type Locale } from "@/lib/i18n";

import { LocaleSwitcher } from "./top-bar-client";

async function ShippingPostal() {
  const h = await headers();
  return h.get("x-vercel-ip-postal-code");
}

function LocaleSwitcherFallback({ locale }: { locale: Locale }) {
  return (
    <span className="relative flex items-center pr-4 text-xs">
      {getLocaleData(locale).label}
      <ChevronDownIcon aria-hidden className="pointer-events-none absolute right-0 size-3" />
    </span>
  );
}

export function TopBar({ locale }: { locale: Locale }) {
  return (
    <div className="bg-foreground text-background">
      <Container className="flex h-8 items-center justify-between text-xs">
        <span>
          Shipping to{" "}
          <Suspense fallback={null}>
            <ShippingPostal />
          </Suspense>
        </span>
        <Suspense fallback={<LocaleSwitcherFallback locale={locale} />}>
          <LocaleSwitcher current={locale} locales={enabledLocales} />
        </Suspense>
      </Container>
    </div>
  );
}
