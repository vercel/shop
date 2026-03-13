"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";

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
    <Drawer>
      {trigger ? (
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      ) : (
        <DrawerTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-9 gap-2 border border-input bg-transparent shadow-xs hover:bg-accent"
          >
            <SlidersHorizontalIcon className="size-4" />
            <span>{label}</span>
            {activeCount !== undefined && activeCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-xs text-background">
                {activeCount}
              </span>
            )}
          </Button>
        </DrawerTrigger>
      )}
      <DrawerContent className="max-h-[85vh] px-4 pb-4 [&_[data-slot=filter-sidebar-scroll-fade]]:hidden [&_[data-slot=filter-sidebar]]:overflow-y-auto [&_[data-slot=filter-sidebar]>div]:!pb-0">
        <DrawerTitle className="sr-only">{label}</DrawerTitle>
        {children}
      </DrawerContent>
    </Drawer>
  );
}

export function FilterSidebarSheetSkeleton() {
  return <Skeleton className="h-9 w-24" />;
}
