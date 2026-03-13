import { ChevronDownIcon } from "lucide-react";
import { CountryFlag } from "@/components/ui/country-flag";
import { getLocaleData, localeSwitchingEnabled } from "@/lib/i18n";

export function LocaleCurrencySelectorFallback({ locale }: { locale: string }) {
  const data = getLocaleData(locale);
  return (
    <div className="flex items-center text-muted-foreground">
      <span className="flex items-center gap-1 px-4 py-2 border-r border-border/50 opacity-50">
        <CountryFlag locale={locale} size="sm" />
        {data.code}
      </span>
      <span className="flex items-center gap-1 px-4 py-2 opacity-50">
        {data.currencySymbol}
        {data.currency}
        {localeSwitchingEnabled ? (
          <ChevronDownIcon className="size-3.5" />
        ) : null}
      </span>
    </div>
  );
}
