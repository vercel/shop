"use client";

import { CheckIcon, GlobeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { CountryFlag } from "@/components/ui/country-flag";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { enabledLocales } from "@/lib/i18n";

interface LocalePickerProps {
  locale: string;
}

function localeLabel(code: string): string {
  const [language, region] = code.split("-");
  const languageName = new Intl.DisplayNames([code], { type: "language" }).of(language) ?? language;
  const regionName = new Intl.DisplayNames([code], { type: "region" }).of(region) ?? region;
  return `${languageName.charAt(0).toUpperCase()}${languageName.slice(1)} (${regionName})`;
}

export function LocalePicker({ locale }: LocalePickerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const select = (next: string) => {
    if (next === locale) return;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Select language and region"
        disabled={isPending}
        className="hidden md:flex shrink-0 cursor-pointer items-center gap-1.5 text-current disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GlobeIcon className="size-4" aria-hidden />
        <span className="text-sm font-medium">{locale.split("-")[1]?.toUpperCase()}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {enabledLocales.map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => select(code)}
            data-active={code === locale}
            className="cursor-pointer gap-2.5 data-[active=true]:font-medium"
          >
            <CountryFlag locale={code} size="sm" />
            <span className="flex-1">{localeLabel(code)}</span>
            {code === locale && <CheckIcon className="size-4" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
