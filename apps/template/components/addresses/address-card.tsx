"use client";

import { useTranslations } from "next-intl";
import type * as React from "react";
import { cn } from "@/lib/utils";

// =============================================================================
// AddressCard Root
// =============================================================================

interface AddressCardProps extends React.ComponentProps<"article"> {
  isDefault?: boolean;
}

function AddressCard({
  isDefault = false,
  className,
  children,
  ...props
}: AddressCardProps) {
  return (
    <article
      data-slot="address-card"
      data-default={isDefault}
      className={cn(
        "flex flex-col gap-6 p-4 bg-[#e9e9e9] rounded-xl border border-[#5a5a5a]",
        className,
      )}
      {...props}
    >
      {children}
    </article>
  );
}

// =============================================================================
// AddressCardContent
// =============================================================================

function AddressCardContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="address-card-content"
      className={cn("flex flex-col gap-3 opacity-80", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// =============================================================================
// AddressCardHeader
// =============================================================================

function AddressCardHeader({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="address-card-header"
      className={cn(
        "flex flex-row gap-1 pb-2 justify-between items-start",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// =============================================================================
// AddressCardRecipient
// =============================================================================

interface AddressCardRecipientProps extends React.ComponentProps<"div"> {
  name: string;
  deliverToLabel?: string;
}

function AddressCardRecipient({
  name,
  deliverToLabel = "Deliver to",
  className,
  ...props
}: AddressCardRecipientProps) {
  return (
    <div
      data-slot="address-card-recipient"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      <span className="text-xs font-normal text-[#020202]/40">
        {deliverToLabel}
      </span>
      <span className="text-lg font-medium text-[#010101]">{name}</span>
    </div>
  );
}

// =============================================================================
// AddressCardBadge (Default badge)
// =============================================================================

function AddressCardBadge({
  className,
  children,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="address-card-badge"
      className={cn(
        "inline-flex items-center px-[7px] py-0 bg-[#010101] rounded-[119px] text-sm font-semibold text-[#fafafa]",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// =============================================================================
// AddressCardAddress
// =============================================================================

interface AddressCardAddressProps extends React.ComponentProps<"div"> {
  address: string;
  addressLabel?: string;
}

function AddressCardAddress({
  address,
  addressLabel = "Address",
  className,
  ...props
}: AddressCardAddressProps) {
  return (
    <div
      data-slot="address-card-address"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    >
      <span className="text-xs font-normal text-[#020202]/40">
        {addressLabel}
      </span>
      <span className="text-base font-normal text-[#010101] whitespace-pre-line">
        {address}
      </span>
    </div>
  );
}

// =============================================================================
// AddressCardActions
// =============================================================================

function AddressCardActions({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="address-card-actions"
      className={cn("flex flex-row gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// =============================================================================
// AddressCardAction
// =============================================================================

interface AddressCardActionProps extends React.ComponentProps<"button"> {
  variant?: "default" | "danger";
}

function AddressCardAction({
  variant = "default",
  className,
  children,
  ...props
}: AddressCardActionProps) {
  return (
    <button
      data-slot="address-card-action"
      data-variant={variant}
      type="button"
      className={cn(
        "text-xs font-normal text-[#020202] hover:underline cursor-pointer",
        "data-[variant=danger]:text-red-600",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// =============================================================================
// AddressCardComposed - Pre-composed variant for quick use
// =============================================================================

interface AddressCardComposedProps {
  name: string;
  address: string;
  isDefault?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
  onSetDefault?: () => void;
  className?: string;
}

function AddressCardComposed({
  name,
  address,
  isDefault = false,
  onEdit,
  onRemove,
  onSetDefault,
  className,
}: AddressCardComposedProps) {
  const t = useTranslations("address");
  return (
    <AddressCard isDefault={isDefault} className={className}>
      <AddressCardContent>
        <AddressCardHeader>
          <AddressCardRecipient name={name} deliverToLabel={t("deliverTo")} />
          {isDefault && <AddressCardBadge>{t("default")}</AddressCardBadge>}
        </AddressCardHeader>
        <AddressCardAddress
          address={address}
          addressLabel={t("addressLabel")}
        />
      </AddressCardContent>
      <AddressCardActions>
        {!isDefault && onSetDefault && (
          <AddressCardAction onClick={onSetDefault}>
            {t("setAsDefault")}
          </AddressCardAction>
        )}
        {onEdit && (
          <AddressCardAction onClick={onEdit}>{t("edit")}</AddressCardAction>
        )}
        {onRemove && (
          <AddressCardAction onClick={onRemove}>
            {t("remove")}
          </AddressCardAction>
        )}
      </AddressCardActions>
    </AddressCard>
  );
}

// =============================================================================
// Exports
// =============================================================================

export {
  AddressCard,
  AddressCardContent,
  AddressCardHeader,
  AddressCardRecipient,
  AddressCardBadge,
  AddressCardAddress,
  AddressCardActions,
  AddressCardAction,
  AddressCardComposed,
};
