"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import { getEnabledCurrencies } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// =============================================================================
// CurrencySelector Compound Components
// =============================================================================

/**
 * Root container for currency selector
 */
function CurrencySelector({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="currency-selector"
      className={cn(
        "@container flex flex-col gap-4 rounded-xl border border-[#c8c8c8] bg-white px-4 @sm:px-6 @lg:px-8 py-4 @sm:py-5",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Header section
 */
function CurrencySelectorHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="currency-selector-header"
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Title area
 */
function CurrencySelectorTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="currency-selector-title"
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Main heading
 */
function CurrencySelectorHeading({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="currency-selector-heading"
      className={cn("text-lg font-semibold text-black", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * Subtitle
 */
function CurrencySelectorSubtitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="currency-selector-subtitle"
      className={cn("text-xs font-normal text-[#020202]", className)}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Dropdown trigger button
 */
interface CurrencySelectorDropdownProps {
  value: string;
  label: string;
  onClick?: () => void;
  open?: boolean;
  interactive?: boolean;
  className?: string;
}

function CurrencySelectorDropdown({
  value,
  label,
  onClick,
  open = false,
  interactive = true,
  className,
}: CurrencySelectorDropdownProps) {
  return (
    <button
      type="button"
      data-slot="currency-selector-dropdown"
      data-state={open ? "open" : "closed"}
      disabled={!interactive}
      aria-disabled={!interactive}
      className={cn(
        "flex flex-row items-center justify-between gap-10 rounded-md border border-transparent bg-[#ececec] py-3 pr-3 pl-6",
        !interactive && "cursor-default",
        className,
      )}
      onClick={interactive ? onClick : undefined}
    >
      <div className="flex flex-row items-center gap-2">
        <span className="text-sm font-semibold text-[#010101]">{value}</span>
        <span className="text-sm font-normal text-[#010101] opacity-50">
          {label}
        </span>
      </div>
      {interactive ? (
        <ChevronDown
          className={cn(
            "size-4 text-[#010101] transition-transform",
            open && "rotate-180",
          )}
        />
      ) : null}
    </button>
  );
}

/**
 * Dropdown menu container
 */
function CurrencySelectorMenu({
  className,
  children,
  open = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { open?: boolean }) {
  if (!open) return null;

  return (
    <div
      data-slot="currency-selector-menu"
      className={cn(
        "mt-1 flex max-h-60 flex-col gap-1 overflow-y-auto rounded-md border border-[#c8c8c8] bg-white p-1 shadow-lg",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Individual currency option
 */
interface CurrencySelectorOptionProps {
  value: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}

function CurrencySelectorOption({
  value,
  label,
  selected,
  onClick,
  className,
}: CurrencySelectorOptionProps) {
  return (
    <button
      type="button"
      data-slot="currency-selector-option"
      data-selected={selected}
      className={cn(
        "flex flex-row items-center justify-between gap-2 rounded px-3 py-2 text-left transition-colors hover:bg-[#f5f5f5]",
        selected && "bg-[#fafafa]",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex flex-row items-center gap-2">
        <span className="text-sm font-semibold text-[#010101]">{value}</span>
        <span className="text-sm font-normal text-[#010101] opacity-50">
          {label}
        </span>
      </div>
      {selected && (
        <span className="size-2.5 shrink-0 rounded-full bg-[#2986ff] shadow" />
      )}
    </button>
  );
}

// =============================================================================
// Pre-composed variant for quick use
// =============================================================================

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

// Default currencies matching common Shopify stores
const defaultCurrencies: CurrencyOption[] = getEnabledCurrencies();

interface CurrencySelectorComposedProps {
  currentCurrency: string;
  onSelect: (currency: string) => void;
  currencies?: CurrencyOption[];
  className?: string;
}

function CurrencySelectorComposed({
  currentCurrency,
  onSelect,
  currencies = defaultCurrencies,
  className,
}: CurrencySelectorComposedProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInteractive = currencies.length > 1;

  const selectedCurrency =
    currencies.find((c) => c.code === currentCurrency) ?? currencies[0];

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const t = useTranslations("account");

  return (
    <div ref={containerRef}>
      <CurrencySelector className={className}>
        <CurrencySelectorHeader>
          <CurrencySelectorTitle>
            <CurrencySelectorHeading>{t("currency")}</CurrencySelectorHeading>
            <CurrencySelectorSubtitle>
              {t("displayDisclaimer")}
            </CurrencySelectorSubtitle>
          </CurrencySelectorTitle>
          <div className="relative">
            <CurrencySelectorDropdown
              value={`${selectedCurrency.symbol}${selectedCurrency.code}`}
              label={selectedCurrency.name}
              open={open}
              interactive={isInteractive}
              onClick={() => setOpen(!open)}
            />
            <CurrencySelectorMenu open={isInteractive && open}>
              {currencies.map((currency) => (
                <CurrencySelectorOption
                  key={currency.code}
                  value={`${currency.symbol}${currency.code}`}
                  label={currency.name}
                  selected={currentCurrency === currency.code}
                  onClick={() => {
                    onSelect(currency.code);
                    setOpen(false);
                  }}
                />
              ))}
            </CurrencySelectorMenu>
          </div>
        </CurrencySelectorHeader>
      </CurrencySelector>
    </div>
  );
}

export {
  CurrencySelector,
  CurrencySelectorHeader,
  CurrencySelectorTitle,
  CurrencySelectorHeading,
  CurrencySelectorSubtitle,
  CurrencySelectorDropdown,
  CurrencySelectorMenu,
  CurrencySelectorOption,
  CurrencySelectorComposed,
  defaultCurrencies,
};
