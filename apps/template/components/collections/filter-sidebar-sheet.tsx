"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface FilterSidebarSheetProps {
  activeCount?: number;
  label: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
}

export function FilterSidebarSheet({
  activeCount,
  label,
  children,
  trigger,
}: FilterSidebarSheetProps) {
  return (
    <Sheet>
      {trigger ? (
        <SheetTrigger asChild>{trigger}</SheetTrigger>
      ) : (
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-2 border border-input bg-transparent shadow-xs hover:bg-accent"
          >
            <SlidersHorizontalIcon className="size-4" />
            <span>{label}</span>
            {activeCount !== undefined && activeCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-xs text-background">
                {activeCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
      )}
      <SheetContent
        side="left"
        className="gap-0 px-5 pb-5 overflow-y-auto [&_[data-slot=filter-sidebar-scroll-fade]]:hidden [&_[data-slot=filter-sidebar]]:overflow-y-visible [&_[data-slot=filter-sidebar]>div]:!pb-0 [&_[data-slot=filter-sidebar-header]]:hidden"
      >
        <div className="flex h-16 shrink-0 items-center">
          <SheetTitle className="text-lg font-semibold">
            {label}
            {activeCount !== undefined && activeCount > 0 && (
              <span className="ml-1">({activeCount})</span>
            )}
          </SheetTitle>
        </div>
        {children}
      </SheetContent>
    </Sheet>
  );
}
