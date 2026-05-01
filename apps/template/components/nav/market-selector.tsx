"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MARKETS = [
  { id: "en-US", label: "English (US)" },
  { id: "en-CA", label: "English (Canada)" },
  { id: "en-GB", label: "English (UK)" },
  { id: "en-AU", label: "English (Australia)" },
  { id: "fr-FR", label: "Français (France)" },
  { id: "de-DE", label: "Deutsch (Deutschland)" },
  { id: "ja-JP", label: "日本語 (日本)" },
] as const;

export function MarketSelector() {
  const [marketId, setMarketId] = useState<string>("en-US");
  const current = MARKETS.find((m) => m.id === marketId) ?? MARKETS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 hover:opacity-70 transition-opacity outline-none">
        <span>{current.label}</span>
        <ChevronDown className="size-3" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-44">
        <DropdownMenuRadioGroup value={marketId} onValueChange={setMarketId}>
          {MARKETS.map((m) => (
            <DropdownMenuRadioItem key={m.id} value={m.id}>
              {m.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
