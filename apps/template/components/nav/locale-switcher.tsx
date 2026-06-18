"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLocaleFlag, type LocaleOption } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LocaleSwitcherProps {
  current: string;
  options: LocaleOption[];
}

export function LocaleSwitcher({ current, options }: LocaleSwitcherProps) {
  const t = useTranslations("nav");

  const currentOption = options.find((option) => option.locale === current) ?? options[0];

  function switchTo(locale: string) {
    if (locale === current) return;
    // Hard navigation, not router.push: locale is a root param, and client-side
    // nav reuses content prefetched in the old language for a frame (flicker).
    // Segment 1 is the locale prefix (e.g. "/en-US/products" → ["","en-US",...]).
    const segments = window.location.pathname.split("/");
    segments[1] = locale;
    window.location.href = `${segments.join("/")}${window.location.search}`;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("switchLanguage")}
        className="flex cursor-pointer items-center gap-1.5 text-sm font-medium outline-none"
      >
        <span aria-hidden>{getLocaleFlag(currentOption.locale)}</span>
        <span>{currentOption.label}</span>
        <ChevronDownIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.locale}
            className="cursor-pointer gap-2"
            onSelect={() => switchTo(option.locale)}
          >
            <span aria-hidden>{getLocaleFlag(option.locale)}</span>
            <span>{option.label}</span>
            <CheckIcon
              className={cn(
                "ml-auto size-4",
                option.locale === current ? "opacity-100" : "opacity-0",
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
