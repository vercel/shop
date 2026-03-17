"use client";

import { ChevronDownIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { syncCartLocaleAction } from "@/components/cart/actions";
import { CountryFlag } from "@/components/ui/country-flag";
import {
  SelectPanel,
  SelectPanelContent,
  SelectPanelDivider,
  SelectPanelGrid,
  SelectPanelHeader,
  SelectPanelItem,
  SelectPanelRow,
  SelectPanelSection,
  SelectPanelTrigger,
} from "@/components/ui/select-panel";
import { enabledLocales, getLocaleData, type Locale, localeSwitchingEnabled } from "@/lib/i18n";

export function LocaleCurrencySelector({ locale: currentLocale }: { locale: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const current = getLocaleData(currentLocale);

  const display = (
    <>
      <span className="flex items-center gap-1 px-4 py-2 border-r border-border/50">
        <CountryFlag locale={currentLocale} size="sm" />
        <span>{current.code}</span>
      </span>
      <span className="flex items-center gap-1 px-4 py-2">
        <span>
          {current.currencySymbol}
          {current.currency}
        </span>
        {localeSwitchingEnabled ? <ChevronDownIcon className="size-3.5" /> : null}
      </span>
    </>
  );

  if (!localeSwitchingEnabled) {
    return <div className="flex items-center">{display}</div>;
  }

  const handleLocaleChange = (locale: Locale) => {
    if (locale === currentLocale) return;

    setOpen(false);
    startTransition(async () => {
      const result = await syncCartLocaleAction(locale);
      if (!result.success) {
        console.error("Failed to sync cart locale:", result.error);
      }
      router.refresh();
    });
  };

  return (
    <SelectPanel open={open} onOpenChange={setOpen}>
      <SelectPanelTrigger>{display}</SelectPanelTrigger>
      <SelectPanelContent align="end" title="Language & Currency">
        <SelectPanelSection>
          <SelectPanelHeader title="Language" subtitle="Auto translated" />
          <SelectPanelGrid columns={2}>
            {enabledLocales.map((locale) => {
              const data = getLocaleData(locale);
              return (
                <SelectPanelItem
                  key={locale}
                  selected={locale === currentLocale}
                  icon={<CountryFlag locale={locale} />}
                  onClick={() => handleLocaleChange(locale)}
                >
                  {data.label}
                </SelectPanelItem>
              );
            })}
          </SelectPanelGrid>
        </SelectPanelSection>
        <SelectPanelDivider />
        <SelectPanelSection className="p-0">
          <div className="px-6 py-4">
            <SelectPanelHeader title="Currency" subtitle="For display, final charges might defer" />
          </div>
          <SelectPanelRow
            label={`${current.currencySymbol}${current.currency}`}
            description={current.currencyName}
          />
        </SelectPanelSection>
      </SelectPanelContent>
    </SelectPanel>
  );
}
