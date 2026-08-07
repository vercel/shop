"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface AccordionSectionProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  title: string;
}

export function AccordionSection({ children, defaultOpen = false, title }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div data-slot="accordion-section" className="group pt-5 pb-5 first:pt-0 last:pb-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-2.5 text-left"
      >
        <span className="text-sm font-medium">{title}</span>
        {open ? (
          <MinusIcon className="size-4 shrink-0" aria-hidden />
        ) : (
          <PlusIcon className="size-4 shrink-0" aria-hidden />
        )}
      </button>
      <div className={cn("pt-2.5", !open && "hidden")}>{children}</div>
    </div>
  );
}
