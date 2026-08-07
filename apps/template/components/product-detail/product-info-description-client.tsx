"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { AboutItem } from "./about-item";

interface ProductInfoDescriptionClientProps {
  descriptionHtml: string;
  title: string;
}

export function ProductInfoDescriptionClient({
  descriptionHtml,
  title,
}: ProductInfoDescriptionClientProps) {
  const [open, setOpen] = useState(true);

  return (
    <div data-slot="product-info-description" className="grid gap-2.5">
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
      <AboutItem descriptionHtml={descriptionHtml} className={cn(!open && "hidden")} />
    </div>
  );
}
