"use client";

import type * as React from "react";

import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface FilterSidebarSheetProps {
  children: React.ReactNode;
  label: string;
  trigger: React.ReactElement;
}

export function FilterSidebarSheet({ children, label, trigger }: FilterSidebarSheetProps) {
  return (
    <Sheet>
      <SheetTrigger render={trigger} />
      <SheetContent
        side="left"
        className="gap-0 px-5 pb-5 overflow-y-auto [&_[data-slot=filter-sidebar-scroll-fade]]:hidden [&_[data-slot=filter-sidebar]]:overflow-y-visible [&_[data-slot=filter-sidebar]>div]:!pb-0 [&_[data-slot=filter-sidebar-header]]:hidden"
      >
        <div className="flex h-16 shrink-0 items-center gap-2">
          <SheetTitle className="text-lg font-semibold">{label}</SheetTitle>
        </div>
        {children}
      </SheetContent>
    </Sheet>
  );
}
