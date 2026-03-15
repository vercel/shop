"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { COUNTRIES } from "@/lib/countries";

export interface AddressFormData {
  id?: string;
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  zoneCode: string;
  territoryCode: string;
  zip: string;
  phoneNumber: string;
}

export interface AddressFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initialData?: Partial<AddressFormData>;
  action: (
    prevState: AddressFormState,
    formData: FormData,
  ) => Promise<AddressFormState>;
}

export interface AddressFormState {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function FormField({
  id,
  label,
  error,
  required,
  ...inputProps
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
} & React.ComponentProps<typeof Input>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Input id={id} name={id} aria-invalid={!!error} {...inputProps} />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

function CountrySelect({
  id,
  label,
  error,
  required,
  defaultValue,
  selectCountryLabel,
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  defaultValue?: string;
  selectCountryLabel: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <select
        id={id}
        name={id}
        autoComplete="country"
        defaultValue={defaultValue ?? ""}
        aria-invalid={!!error}
        className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm aria-[invalid=true]:border-destructive"
      >
        <option value="">{selectCountryLabel}</option>
        {COUNTRIES.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

const initialState: AddressFormState = {
  success: false,
};

export function AddressForm({
  open,
  onOpenChange,
  mode,
  initialData,
  action,
}: AddressFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const t = useTranslations("address");

  // Close sheet on success
  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state.success, onOpenChange]);

  const title = mode === "add" ? t("addTitle") : t("editTitle");
  const description =
    mode === "add" ? t("addDescription") : t("editDescription");
  const submitLabel = mode === "add" ? t("addSubmit") : t("saveSubmit");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-slot="address-form"
        className="overflow-y-auto sm:max-w-md"
        side="right"
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <form action={formAction} className="flex flex-col gap-6 p-4">
          {/* Hidden ID for edit mode */}
          {mode === "edit" && initialData?.id && (
            <input type="hidden" name="id" value={initialData.id} />
          )}

          {/* Name fields - side by side */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="firstName"
              label={t("firstName")}
              required
              autoComplete="given-name"
              placeholder={t("firstNamePlaceholder")}
              defaultValue={initialData?.firstName ?? ""}
              error={state.fieldErrors?.firstName}
            />
            <FormField
              id="lastName"
              label={t("lastName")}
              required
              autoComplete="family-name"
              placeholder={t("lastNamePlaceholder")}
              defaultValue={initialData?.lastName ?? ""}
              error={state.fieldErrors?.lastName}
            />
          </div>

          {/* Company */}
          <FormField
            id="company"
            label={t("company")}
            autoComplete="organization"
            placeholder={t("companyPlaceholder")}
            defaultValue={initialData?.company ?? ""}
            error={state.fieldErrors?.company}
          />

          {/* Address line 1 */}
          <FormField
            id="address1"
            label={t("address")}
            required
            autoComplete="address-line1"
            placeholder={t("addressPlaceholder")}
            defaultValue={initialData?.address1 ?? ""}
            error={state.fieldErrors?.address1}
          />

          {/* Address line 2 */}
          <FormField
            id="address2"
            label={t("apartment")}
            autoComplete="address-line2"
            placeholder={t("apartmentPlaceholder")}
            defaultValue={initialData?.address2 ?? ""}
            error={state.fieldErrors?.address2}
          />

          {/* City and Province - side by side */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="city"
              label={t("city")}
              required
              autoComplete="address-level2"
              placeholder={t("cityPlaceholder")}
              defaultValue={initialData?.city ?? ""}
              error={state.fieldErrors?.city}
            />
            <FormField
              id="zoneCode"
              label={t("stateProvince")}
              autoComplete="address-level1"
              placeholder={t("statePlaceholder")}
              defaultValue={initialData?.zoneCode ?? ""}
              error={state.fieldErrors?.zoneCode}
            />
          </div>

          {/* Country and Zip - side by side */}
          <div className="grid grid-cols-2 gap-3">
            <CountrySelect
              id="territoryCode"
              label={t("country")}
              required
              defaultValue={initialData?.territoryCode ?? ""}
              error={state.fieldErrors?.territoryCode}
              selectCountryLabel={t("selectCountry")}
            />
            <FormField
              id="zip"
              label={t("zipPostal")}
              required
              autoComplete="postal-code"
              placeholder={t("zipPlaceholder")}
              defaultValue={initialData?.zip ?? ""}
              error={state.fieldErrors?.zip}
            />
          </div>

          {/* Phone */}
          <FormField
            id="phoneNumber"
            label={t("phone")}
            type="tel"
            autoComplete="tel"
            placeholder={t("phonePlaceholder")}
            defaultValue={initialData?.phoneNumber ?? ""}
            error={state.fieldErrors?.phoneNumber}
          />

          {/* General error message */}
          {state.error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {state.error}
            </div>
          )}

          <SheetFooter className="mt-2 p-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {submitLabel}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
