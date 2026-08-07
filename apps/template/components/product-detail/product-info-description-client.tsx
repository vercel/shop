"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface AccordionSectionProps {
  children: React.ReactNode;
  title: string;
}

export function AccordionSection({ children, title }: AccordionSectionProps) {
  const [open, setOpen] = useState(true);

  return (
    <div data-slot="accordion-section" className="grid gap-2.5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-2.5 text-left"
      >
        <span className="text-sm font-medium text-foreground/70">{title}</span>
        {open ? (
          <MinusIcon className="size-4 shrink-0" aria-hidden />
        ) : (
          <PlusIcon className="size-4 shrink-0" aria-hidden />
        )}
      </button>
      <div className={cn(!open && "hidden")}>{children}</div>
    </div>
  );
}
