"use client";

import { ChevronDownIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { ChangeEvent } from "react";

import { getLocaleData, type Locale } from "@/lib/i18n";

interface LocaleSwitcherProps {
  current: Locale;
  locales: readonly Locale[];
}

export function LocaleSwitcher({ current, locales }: LocaleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/") || `/${next}`);
  }

  return (
    <label className="relative flex cursor-pointer items-center">
      <select
        aria-label="Select locale"
        value={current}
        onChange={handleChange}
        className="cursor-pointer appearance-none bg-transparent pr-4 text-xs focus:outline-none"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc} className="text-foreground">
            {getLocaleData(loc).label}
          </option>
        ))}
      </select>
      <ChevronDownIcon aria-hidden className="pointer-events-none absolute right-0 size-3" />
    </label>
  );
}
