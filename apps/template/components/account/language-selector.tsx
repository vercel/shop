"use client";

import { useTranslations } from "next-intl";
import type * as React from "react";
import { useState } from "react";
import {
  getEnabledLocaleOptions,
  getLocaleFlag,
  type Locale,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

// =============================================================================
// LanguageSelector Compound Components
// =============================================================================

/**
 * Root container for language selector
 */
function LanguageSelector({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="language-selector"
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
 * Header with title and subtitle
 */
function LanguageSelectorHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="language-selector-header"
      className={cn("flex flex-col gap-8", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Title area
 */
function LanguageSelectorTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="language-selector-title"
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
function LanguageSelectorHeading({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      data-slot="language-selector-heading"
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
function LanguageSelectorSubtitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="language-selector-subtitle"
      className={cn("text-xs font-normal text-[#020202]", className)}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Options container
 */
function LanguageSelectorOptions({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="language-selector-options"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Individual language option
 */
interface LanguageSelectorOptionProps {
  label: string;
  flag?: React.ReactNode;
  selected: boolean;
  onClick?: () => void;
  interactive?: boolean;
  className?: string;
}

function LanguageSelectorOption({
  label,
  flag,
  selected,
  onClick,
  interactive = true,
  className,
}: LanguageSelectorOptionProps) {
  return (
    <button
      type="button"
      data-slot="language-selector-option"
      data-selected={selected}
      disabled={!interactive}
      aria-disabled={!interactive}
      className={cn(
        "flex flex-row items-center justify-between gap-2 rounded px-2 py-1 text-left transition-colors",
        selected
          ? "border border-[#5a5a5a] bg-[#fafafa]"
          : "border border-transparent",
        !interactive && "cursor-default",
        className,
      )}
      onClick={interactive ? onClick : undefined}
    >
      <div className="flex flex-row items-center gap-2">
        {flag && (
          <span className="inline-flex size-5 items-center justify-center overflow-hidden rounded-sm">
            {flag}
          </span>
        )}
        <span className="text-sm font-medium text-black">{label}</span>
      </div>
      {selected && (
        <span className="size-2.5 shrink-0 rounded-full bg-[#2986ff] shadow" />
      )}
    </button>
  );
}

/**
 * "See more" link
 */
function LanguageSelectorMore({
  className,
  children,
  onClick,
  ...props
}: React.HTMLAttributes<HTMLButtonElement> & { onClick?: () => void }) {
  return (
    <button
      type="button"
      data-slot="language-selector-more"
      className={cn(
        "text-left text-sm font-medium text-black opacity-50",
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

// =============================================================================
// Pre-composed variant for quick use
// =============================================================================

export interface LanguageOption {
  locale: Locale;
  label: string;
  countryCode: string;
}

interface LanguageSelectorComposedProps {
  currentLocale: string;
  onSelect: (locale: string) => void;
  languages?: LanguageOption[];
  initialVisibleCount?: number;
  className?: string;
}

function LanguageSelectorComposed({
  currentLocale,
  onSelect,
  languages = getEnabledLocaleOptions(),
  initialVisibleCount = 4,
  className,
}: LanguageSelectorComposedProps) {
  const [showAll, setShowAll] = useState(false);
  const t = useTranslations("account");
  const isInteractive = languages.length > 1;

  const visibleLanguages = showAll
    ? languages
    : languages.slice(0, initialVisibleCount);
  const hiddenCount = Math.max(0, languages.length - initialVisibleCount);

  return (
    <LanguageSelector className={className}>
      <LanguageSelectorHeader>
        <LanguageSelectorTitle>
          <LanguageSelectorHeading>{t("language")}</LanguageSelectorHeading>
          <LanguageSelectorSubtitle>
            {t("displayDisclaimer")}
          </LanguageSelectorSubtitle>
        </LanguageSelectorTitle>
        <LanguageSelectorOptions>
          {visibleLanguages.map((lang) => (
            <LanguageSelectorOption
              key={lang.locale}
              label={lang.label}
              flag={getLocaleFlag(lang.locale)}
              selected={currentLocale === lang.locale}
              interactive={isInteractive}
              onClick={() => onSelect(lang.locale)}
            />
          ))}
          {isInteractive && !showAll && hiddenCount > 0 && (
            <LanguageSelectorMore onClick={() => setShowAll(true)}>
              {t("seeMore", { count: String(hiddenCount) })}
            </LanguageSelectorMore>
          )}
        </LanguageSelectorOptions>
      </LanguageSelectorHeader>
    </LanguageSelector>
  );
}

export {
  LanguageSelector,
  LanguageSelectorHeader,
  LanguageSelectorTitle,
  LanguageSelectorHeading,
  LanguageSelectorSubtitle,
  LanguageSelectorOptions,
  LanguageSelectorOption,
  LanguageSelectorMore,
  LanguageSelectorComposed,
};
