"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState, useTransition } from "react";
import {
  createAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
  updateAddressAction,
} from "@/components/addresses/actions";
import { AddressCardComposed } from "@/components/addresses/address-card";
import {
  AddressForm,
  type AddressFormData,
} from "@/components/addresses/address-form";
import { Button } from "@/components/ui/button";
import type { Address } from "@/lib/shopify/types/customer";

interface AddressesClientProps {
  addresses: Address[];
}

function ErrorNotification({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="bg-destructive/10 text-destructive flex items-start gap-3 rounded-md p-3 text-sm">
      <p className="flex-1">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="text-destructive/70 hover:text-destructive shrink-0"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}

export function AddressesClient({ addresses }: AddressesClientProps) {
  const t = useTranslations("address");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingAddress, setEditingAddress] = useState<
    Partial<AddressFormData> | undefined
  >();
  const [actionError, setActionError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleAddNew = useCallback(() => {
    setFormMode("add");
    setEditingAddress(undefined);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((address: Address) => {
    setFormMode("edit");
    setEditingAddress({
      id: address.id,
      firstName: address.firstName ?? "",
      lastName: address.lastName ?? "",
      company: address.company ?? "",
      address1: address.address1 ?? "",
      address2: address.address2 ?? "",
      city: address.city ?? "",
      zoneCode: address.provinceCode ?? "",
      territoryCode: address.countryCode ?? "",
      zip: address.zip ?? "",
      phoneNumber: address.phone ?? "",
    });
    setFormOpen(true);
  }, []);

  const handleRemove = useCallback(
    (addressId: string) => {
      if (!confirm(t("removeConfirm"))) {
        return;
      }
      setActionError(null);
      startTransition(async () => {
        const result = await deleteAddressAction(addressId);
        if (!result.success && result.error) {
          setActionError(result.error);
        }
      });
    },
    [t],
  );

  const handleSetDefault = useCallback((addressId: string) => {
    setActionError(null);
    startTransition(async () => {
      const result = await setDefaultAddressAction(addressId);
      if (!result.success && result.error) {
        setActionError(result.error);
      }
    });
  }, []);

  const formatAddress = (address: Address): string => {
    // Use formatted array if available
    if (address.formatted && address.formatted.length > 0) {
      return address.formatted.join("\n");
    }

    // Build address string manually
    const parts: string[] = [];

    if (address.address1) {
      parts.push(address.address1);
    }
    if (address.address2) {
      parts.push(address.address2);
    }

    const cityLine = [address.city, address.province, address.zip]
      .filter(Boolean)
      .join(", ");
    if (cityLine) {
      parts.push(cityLine);
    }

    if (address.country) {
      parts.push(address.country);
    }

    if (address.phone) {
      parts.push(address.phone);
    }

    return parts.join("\n");
  };

  const getRecipientName = (address: Address): string => {
    const parts = [address.firstName, address.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : t("unknown");
  };

  return (
    <>
      {/* Error notification */}
      {actionError && (
        <ErrorNotification
          message={actionError}
          onDismiss={() => setActionError(null)}
        />
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleAddNew}
          variant="secondary"
          className="gap-2 rounded-[99px] bg-muted"
        >
          <PlusIcon className="size-4 opacity-80" />
          <span className="text-sm font-semibold">{t("addNew")}</span>
        </Button>
      </div>

      {/* Address Grid */}
      {addresses.length === 0 ? (
        <EmptyAddressesState onAddNew={handleAddNew} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <AddressCardComposed
              key={address.id}
              name={getRecipientName(address)}
              address={formatAddress(address)}
              isDefault={address.isDefault}
              onEdit={() => handleEdit(address)}
              onRemove={() => handleRemove(address.id)}
              onSetDefault={
                address.isDefault
                  ? undefined
                  : () => handleSetDefault(address.id)
              }
            />
          ))}
        </div>
      )}

      {/* Address Form Sheet */}
      <AddressForm
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialData={editingAddress}
        action={formMode === "add" ? createAddressAction : updateAddressAction}
      />
    </>
  );
}

function EmptyAddressesState({ onAddNew }: { onAddNew: () => void }) {
  const t = useTranslations("address");
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="text-lg font-medium text-muted-foreground">
        {t("noAddresses")}
      </div>
      <p className="text-sm text-foreground/50">{t("noAddressesDescription")}</p>
      <Button onClick={onAddNew} className="mt-4">
        <PlusIcon className="size-4" />
        {t("addAddress")}
      </Button>
    </div>
  );
}
