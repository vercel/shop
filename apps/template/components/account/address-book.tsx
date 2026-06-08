"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  createAddressAction,
  deleteAddressAction,
  updateAddressAction,
} from "@/lib/customer/action";
import type { CustomerAddress, CustomerAddressInput } from "@/lib/types";

type FormState = { address: CustomerAddress; mode: "edit" } | { mode: "create" } | null;

const TEXT_FIELDS = [
  { autoComplete: "given-name", key: "firstName", labelKey: "addressFirstName", span: false },
  { autoComplete: "family-name", key: "lastName", labelKey: "addressLastName", span: false },
  { autoComplete: "organization", key: "company", labelKey: "addressCompany", span: true },
  { autoComplete: "address-line1", key: "address1", labelKey: "addressLine1", span: true },
  { autoComplete: "address-line2", key: "address2", labelKey: "addressLine2", span: true },
  { autoComplete: "address-level2", key: "city", labelKey: "addressCity", span: false },
  { autoComplete: "address-level1", key: "zoneCode", labelKey: "addressZone", span: false },
  { autoComplete: "postal-code", key: "zip", labelKey: "addressZip", span: false },
  { autoComplete: "country", key: "territoryCode", labelKey: "addressCountry", span: false },
  { autoComplete: "tel", key: "phoneNumber", labelKey: "addressPhone", span: true },
] as const satisfies readonly {
  autoComplete: string;
  key: keyof CustomerAddressInput;
  labelKey: string;
  span: boolean;
}[];

const REQUIRED_FIELDS = new Set<keyof CustomerAddressInput>(["address1", "city", "territoryCode"]);

export function AddressBook({ addresses }: { addresses: CustomerAddress[] }) {
  const t = useTranslations("account");
  const [formState, setFormState] = useState<FormState>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerAddress | null>(null);

  return (
    <div className="grid gap-4">
      <div>
        <Button size="sm" onClick={() => setFormState({ mode: "create" })}>
          <Plus aria-hidden="true" />
          {t("addAddress")}
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-lg border p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("noAddresses")}</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2">
                <address className="text-sm text-muted-foreground not-italic">
                  {address.formatted.map((line, index) => (
                    <span key={index} className="block">
                      {line}
                    </span>
                  ))}
                </address>
                {address.isDefault ? (
                  <Badge variant="secondary">{t("defaultAddress")}</Badge>
                ) : null}
              </div>
              <div className="mt-auto flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFormState({ address, mode: "edit" })}
                >
                  <Pencil aria-hidden="true" />
                  {t("edit")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(address)}>
                  <Trash2 aria-hidden="true" />
                  {t("delete")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={formState !== null} onOpenChange={(open) => !open && setFormState(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {formState?.mode === "edit" ? t("editAddress") : t("addAddress")}
            </DialogTitle>
          </DialogHeader>
          {formState !== null ? (
            <AddressForm
              address={formState.mode === "edit" ? formState.address : undefined}
              key={formState.mode === "edit" ? formState.address.id : "create"}
              onSuccess={() => setFormState(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <DeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}

function AddressForm({ address, onSuccess }: { address?: CustomerAddress; onSuccess: () => void }) {
  const t = useTranslations("account");
  const [values, setValues] = useState<CustomerAddressInput>(() => toFormValues(address));
  const [isDefault, setIsDefault] = useState(address?.isDefault ?? false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const isCurrentDefault = address?.isDefault ?? false;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = address
        ? await updateAddressAction(address.id, values, isDefault)
        : await createAddressAction(values, isDefault);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error ?? null);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {TEXT_FIELDS.map((field) => {
          const fieldError = fieldErrors[field.key];
          return (
            <div
              key={field.key}
              className={field.span ? "grid gap-1.5 sm:col-span-2" : "grid gap-1.5"}
            >
              <Label htmlFor={field.key}>
                {t(field.labelKey)}
                {REQUIRED_FIELDS.has(field.key) ? <span aria-hidden="true"> *</span> : null}
              </Label>
              <Input
                id={field.key}
                name={field.key}
                value={values[field.key] ?? ""}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, [field.key]: event.target.value }))
                }
                autoComplete={field.autoComplete}
                required={REQUIRED_FIELDS.has(field.key)}
                aria-invalid={fieldError ? true : undefined}
                placeholder={
                  field.key === "territoryCode"
                    ? t("addressCountryPlaceholder")
                    : field.key === "zoneCode"
                      ? t("addressZonePlaceholder")
                      : undefined
                }
              />
              {fieldError ? (
                <p role="alert" className="text-xs text-destructive">
                  {fieldError}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label htmlFor="isDefault">{t("setAsDefault")}</Label>
        <Switch
          id="isDefault"
          checked={isDefault}
          disabled={isCurrentDefault}
          onCheckedChange={setIsDefault}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : t("save")}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteDialog({
  onClose,
  target,
}: {
  onClose: () => void;
  target: CustomerAddress | null;
}) {
  const t = useTranslations("account");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (!target) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteAddressAction(target.id);
      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? null);
      }
    });
  };

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteAddressTitle")}</DialogTitle>
          <DialogDescription>{t("deleteAddressConfirm")}</DialogDescription>
        </DialogHeader>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t("cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              t("delete")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toFormValues(address?: CustomerAddress): CustomerAddressInput {
  return {
    address1: address?.address1 ?? "",
    address2: address?.address2 ?? "",
    city: address?.city ?? "",
    company: address?.company ?? "",
    firstName: address?.firstName ?? "",
    lastName: address?.lastName ?? "",
    phoneNumber: address?.phoneNumber ?? "",
    territoryCode: address?.territoryCode ?? "",
    zip: address?.zip ?? "",
    zoneCode: address?.zoneCode ?? "",
  };
}
