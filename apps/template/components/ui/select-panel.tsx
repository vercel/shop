"use client";

import { ChevronDownIcon } from "lucide-react";
import type * as React from "react";
import { createContext, use } from "react";

import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

/**
 * SelectPanel - A reusable dropdown panel with custom styling
 * Renders as a Popover on desktop (>=768px) and a Drawer on mobile.
 */

const SelectPanelContext = createContext({ isDesktop: true });

function SelectPanel({ children, ...props }: React.ComponentProps<typeof Popover>) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <SelectPanelContext value={{ isDesktop: true }}>
        <Popover {...props}>{children}</Popover>
      </SelectPanelContext>
    );
  }

  return (
    <SelectPanelContext value={{ isDesktop: false }}>
      <Drawer open={props.open} onOpenChange={props.onOpenChange}>
        {children}
      </Drawer>
    </SelectPanelContext>
  );
}

function SelectPanelTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof PopoverTrigger>) {
  const { isDesktop } = use(SelectPanelContext);

  if (isDesktop) {
    return (
      <PopoverTrigger
        className={cn(
          "flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          "data-[state=open]:rounded-t-xl data-[state=open]:border data-[state=open]:border-border data-[state=open]:bg-popover/80 data-[state=open]:backdrop-blur-xl",
          className,
        )}
        {...props}
      >
        {children}
      </PopoverTrigger>
    );
  }

  return (
    <DrawerTrigger
      className={cn(
        "flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    >
      {children}
    </DrawerTrigger>
  );
}

function SelectPanelContent({
  className,
  sideOffset = -1,
  title,
  children,
  ...props
}: React.ComponentProps<typeof PopoverContent> & {
  title?: string;
}) {
  const { isDesktop } = use(SelectPanelContext);

  if (isDesktop) {
    return (
      <PopoverContent
        sideOffset={sideOffset}
        className={cn(
          "w-auto min-w-[415px] p-0 overflow-hidden",
          "bg-popover/80 backdrop-blur-xl",
          "rounded-t-none rounded-b-xl",
          className,
        )}
        {...props}
      >
        {children}
      </PopoverContent>
    );
  }

  return (
    <DrawerContent className="max-h-[85vh]">
      <DrawerTitle className="sr-only">{title ?? "Options"}</DrawerTitle>
      <div className="overflow-y-auto">{children}</div>
    </DrawerContent>
  );
}

function SelectPanelSection({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="select-panel-section" className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}

function SelectPanelHeader({
  className,
  title,
  subtitle,
  ...props
}: React.ComponentProps<"div"> & {
  title: string;
  subtitle?: string;
}) {
  return (
    <div
      data-slot="select-panel-header"
      className={cn("flex flex-col gap-0.5 mb-4", className)}
      {...props}
    >
      <p className="text-lg font-semibold tracking-tight">{title}</p>
      {subtitle && <p className="text-xs text-foreground/60">{subtitle}</p>}
    </div>
  );
}

function SelectPanelGrid({
  className,
  columns = 2,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  columns?: 1 | 2 | 3;
}) {
  return (
    <div
      data-slot="select-panel-grid"
      className={cn(
        "grid gap-[7px]",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function SelectPanelItem({
  className,
  selected = false,
  children,
  icon,
  ...props
}: React.ComponentProps<"button"> & {
  selected?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-slot="select-panel-item"
      data-selected={selected}
      className={cn(
        "flex items-center justify-between gap-2 px-1 py-1 rounded text-left transition-colors outline-none focus-visible:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50",
        "hover:bg-accent",
        selected && [
          "bg-background border border-ring/35 rounded",
          "shadow-[inset_0px_-1px_2px_0px_rgba(0,0,0,0.1),inset_0px_0px_0px_0.5px_rgba(0,0,0,0.1)]",
        ],
        className,
      )}
      {...props}
    >
      <span className="flex items-center gap-2">
        {icon && <span className="shrink-0 w-8 h-6">{icon}</span>}
        <span className="text-sm font-medium">{children}</span>
      </span>
      {selected && <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-primary mr-1" />}
    </button>
  );
}

function SelectPanelShowMore({
  className,
  count,
  expanded,
  onToggle,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      data-slot="select-panel-show-more"
      onClick={onToggle}
      className={cn(
        "text-sm text-foreground hover:text-foreground/80 transition-colors mt-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:rounded-sm",
        className,
      )}
      {...props}
    >
      {expanded ? "Show less" : `See ${count} more`}
    </button>
  );
}

function SelectPanelDivider({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-panel-divider"
      className={cn("border-t border-border", className)}
      {...props}
    />
  );
}

function SelectPanelRow({
  className,
  label,
  description,
  icon,
  onClick,
  ...props
}: React.ComponentProps<"button"> & {
  label: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-slot="select-panel-row"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-5 py-2.5 bg-input/80 border-t border-border/50",
        "text-left hover:bg-input transition-colors outline-none focus-visible:bg-input focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    >
      <span className="flex-1 flex items-center gap-2 text-sm">
        <span className="font-semibold">{label}</span>
        {description && <span className="text-foreground/50">{description}</span>}
      </span>
      {icon || <ChevronDownIcon className="shrink-0 size-5 text-foreground/50" />}
    </button>
  );
}

export {
  SelectPanel,
  SelectPanelContent,
  SelectPanelDivider,
  SelectPanelGrid,
  SelectPanelHeader,
  SelectPanelItem,
  SelectPanelRow,
  SelectPanelSection,
  SelectPanelShowMore,
  SelectPanelTrigger,
};
