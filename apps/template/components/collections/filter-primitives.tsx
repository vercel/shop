"use client";

import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LoaderCircleIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function FilterSidebar({ className, children, ...props }: React.ComponentProps<"aside">) {
  return (
    <aside
      data-slot="filter-sidebar"
      className={cn("relative flex flex-col overflow-y-auto", className)}
      {...props}
    >
      {children}
    </aside>
  );
}

interface FilterSidebarHeaderProps extends React.ComponentProps<"header"> {
  title?: string;
  activeCount?: number;
  onReset?: () => void;
  resetLabel?: string;
}

function FilterSidebarHeader({
  title = "Filter",
  activeCount,
  onReset,
  resetLabel = "Reset",
  className,
  children,
  ...props
}: FilterSidebarHeaderProps) {
  return (
    <header
      data-slot="filter-sidebar-header"
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
        {activeCount !== undefined && activeCount > 0 && (
          <span className="ml-1">({activeCount})</span>
        )}
      </h2>
      {onReset && (
        <FilterBadge variant="default" onClick={onReset}>
          {resetLabel}
        </FilterBadge>
      )}
      {children}
    </header>
  );
}

interface FilterSidebarResultsCountProps extends React.ComponentProps<"div"> {
  count: number;
  label?: string;
}

function FilterSidebarResultsCount({
  count,
  label = "Results",
  className,
  ...props
}: FilterSidebarResultsCountProps) {
  return (
    <div
      data-slot="filter-sidebar-results-count"
      className={cn("flex items-center gap-1.5 text-sm text-foreground/50", className)}
      {...props}
    >
      <SearchIcon className="size-3.5" />
      <span>
        {count} {label}
      </span>
    </div>
  );
}

function FilterSidebarActiveFilters({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="filter-sidebar-active-filters"
      className={cn("flex flex-wrap gap-1.5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface FilterBadgeProps extends React.ComponentProps<"button"> {
  variant?: "default" | "primary";
  onRemove?: () => void;
}

function FilterBadge({
  variant = "default",
  onRemove,
  className,
  children,
  ...props
}: FilterBadgeProps) {
  return (
    <button
      type="button"
      data-slot="filter-badge"
      data-variant={variant}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
        variant === "default" && "bg-foreground/60 text-background hover:bg-foreground/70",
        variant === "primary" && "bg-primary/15 text-primary hover:bg-primary/25",
        className,
      )}
      onClick={onRemove ?? props.onClick}
      {...props}
    >
      {children}
      {onRemove && <XIcon className="size-3" />}
    </button>
  );
}

function FilterSection({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="filter-section" className={cn("flex flex-col gap-2.5", className)} {...props}>
      {children}
    </div>
  );
}

interface FilterSectionHeaderProps {
  title: string;
  className?: string;
  children?: React.ReactNode;
}

function FilterSectionHeader({ title, className, children }: FilterSectionHeaderProps) {
  return (
    <div
      data-slot="filter-section-header"
      className={cn("flex items-center justify-between", className)}
    >
      <span className="text-base font-semibold text-muted-foreground">{title}</span>
      {children}
    </div>
  );
}

function FilterSectionContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="filter-section-content" className={cn(className)} {...props}>
      {children}
    </div>
  );
}

function FilterOptionList({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="filter-option-list"
      className={cn("flex flex-col gap-2.5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface FilterOptionProps extends React.ComponentProps<"button"> {
  label: string;
  count?: number;
  selected?: boolean;
  href?: string;
  pending?: boolean;
}

function FilterOption({
  label,
  count,
  selected = false,
  href,
  pending = false,
  className,
  onClick,
  ...props
}: FilterOptionProps) {
  const sharedClassName = cn(
    "flex items-center justify-between text-left text-sm text-muted-foreground transition-colors hover:text-foreground",
    "data-[selected=true]:font-medium",
    className,
  );
  const trailingIcon = pending ? (
    <LoaderCircleIcon className="size-3.5 animate-spin text-muted-foreground" />
  ) : selected ? (
    <CheckIcon className="size-3.5 text-muted-foreground" />
  ) : null;

  const content = (
    <>
      <span>
        {label}
        {count !== undefined && <span className="text-muted-foreground"> ({count})</span>}
      </span>
      {trailingIcon && (
        <span className="flex size-3.5 shrink-0 items-center justify-center overflow-hidden">
          {trailingIcon}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        data-slot="filter-option"
        data-selected={selected}
        className={sharedClassName}
        onClick={onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      data-slot="filter-option"
      data-selected={selected}
      className={sharedClassName}
      onClick={onClick}
      {...props}
    >
      {content}
    </button>
  );
}

interface FilterPriceRangeProps extends React.ComponentProps<"div"> {
  minValue?: string;
  maxValue?: string;
  onMinChange?: (value: string) => void;
  onMaxChange?: (value: string) => void;
  onApply?: (min: string, max: string) => void;
  currencySymbol?: string;
}

function FilterPriceRange({
  minValue = "",
  maxValue = "",
  onMinChange,
  onMaxChange,
  onApply,
  currencySymbol = "$",
  className,
  ...props
}: FilterPriceRangeProps) {
  return (
    <div
      data-slot="filter-price-range"
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <div className="flex flex-1 items-center rounded-lg bg-input px-2.5 h-8">
        <span className="text-sm text-muted-foreground">{currencySymbol}</span>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="From"
          value={minValue}
          onChange={(e) => onMinChange?.(e.target.value)}
          className="h-auto border-0 bg-transparent px-1 text-sm shadow-none outline-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
      <span className="text-muted-foreground">–</span>
      <div className="flex flex-1 items-center rounded-lg bg-input px-2.5 h-8">
        <span className="text-sm text-muted-foreground">{currencySymbol}</span>
        <Input
          type="number"
          step="0.01"
          min="0"
          placeholder="To"
          value={maxValue}
          onChange={(e) => onMaxChange?.(e.target.value)}
          className="h-auto border-0 bg-transparent px-1 text-sm shadow-none outline-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
      <button
        type="button"
        onClick={() => onApply?.(minValue, maxValue)}
        className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background transition-colors hover:bg-foreground/90"
      >
        <CheckIcon className="size-4" />
      </button>
    </div>
  );
}

function FilterSidebarCategories({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="filter-sidebar-categories"
      className={cn("flex flex-col gap-2.5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface FilterSidebarCategoryBackProps extends React.ComponentProps<"button"> {
  pending?: boolean;
}

function FilterSidebarCategoryBack({
  pending = false,
  className,
  children,
  ...props
}: FilterSidebarCategoryBackProps) {
  return (
    <button
      type="button"
      data-slot="filter-sidebar-category-back"
      data-pending={pending}
      className={cn(
        "flex items-center gap-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
      {...props}
    >
      {pending ? (
        <LoaderCircleIcon className="size-4 animate-spin" />
      ) : (
        <ChevronLeftIcon className="size-4" />
      )}
      {children}
    </button>
  );
}

interface FilterSidebarCategoryItemProps extends React.ComponentProps<"button"> {
  label: string;
  count?: number;
  pending?: boolean;
}

function FilterSidebarCategoryItem({
  label,
  count,
  pending = false,
  className,
  ...props
}: FilterSidebarCategoryItemProps) {
  return (
    <button
      type="button"
      data-slot="filter-sidebar-category-item"
      data-pending={pending}
      className={cn(
        "flex items-center justify-between text-left text-sm text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
      {...props}
    >
      <span>
        {label}
        {count !== undefined && <span className="text-muted-foreground"> ({count})</span>}
      </span>
      {pending ? (
        <LoaderCircleIcon className="size-4 animate-spin" />
      ) : (
        <ChevronRightIcon className="size-4" />
      )}
    </button>
  );
}

function FilterSidebarScrollFade({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="filter-sidebar-scroll-fade"
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 h-41.5 bg-gradient-to-t from-background to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export {
  FilterSidebar,
  FilterSidebarHeader,
  FilterSidebarResultsCount,
  FilterSidebarActiveFilters,
  FilterBadge,
  FilterSection,
  FilterSectionHeader,
  FilterSectionContent,
  FilterOptionList,
  FilterOption,
  FilterPriceRange,
  FilterSidebarCategories,
  FilterSidebarCategoryBack,
  FilterSidebarCategoryItem,
  FilterSidebarScrollFade,
};
