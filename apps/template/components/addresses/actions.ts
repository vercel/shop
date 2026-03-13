"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/server";
import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from "@/lib/shopify/operations/customer";
import type { AddressInput } from "@/lib/shopify/types/customer";
import type { AddressFormState } from "./address-form";

/**
 * Maps Shopify API error field names back to our form field names.
 * The Shopify Customer Account API may return field names in its error
 * responses that differ from the input field names (e.g., "countryCode"
 * instead of "territoryCode", or "provinceCode" instead of "zoneCode").
 */
const SHOPIFY_FIELD_TO_FORM_FIELD: Record<string, string> = {
  countryCode: "territoryCode",
  country: "territoryCode",
  territoryCode: "territoryCode",
  provinceCode: "zoneCode",
  province: "zoneCode",
  zoneCode: "zoneCode",
  firstName: "firstName",
  lastName: "lastName",
  address1: "address1",
  address2: "address2",
  city: "city",
  zip: "zip",
  phoneNumber: "phoneNumber",
  phone: "phoneNumber",
  company: "company",
};

/**
 * Human-readable labels for form fields, used in error messages.
 */
const FIELD_LABELS: Record<string, string> = {
  territoryCode: "Country",
  zoneCode: "State / Province",
  firstName: "First name",
  lastName: "Last name",
  address1: "Address",
  address2: "Apartment / Suite",
  city: "City",
  zip: "ZIP / Postal code",
  phoneNumber: "Phone",
  company: "Company",
};

/**
 * Makes Shopify API error messages more user-friendly.
 * Shopify sometimes returns cryptic error messages (e.g., referencing
 * internal field names like "territoryCode" or "zoneCode"). This maps
 * them to clear, actionable messages.
 */
function humanizeErrorMessage(message: string, formFieldName: string): string {
  const label = FIELD_LABELS[formFieldName] ?? formFieldName;

  // Normalize for matching
  const lower = message.toLowerCase();

  // Handle common Shopify validation patterns
  if (lower.includes("not a valid") || lower.includes("invalid")) {
    return `Please select a valid ${label.toLowerCase()}`;
  }
  if (lower.includes("can't be blank") || lower.includes("is required")) {
    return `${label} is required`;
  }
  if (lower.includes("too long") || lower.includes("too short")) {
    return message;
  }

  return message;
}

/**
 * Processes Shopify userErrors into form-compatible field errors
 * and a general error message.
 */
function processShopifyErrors(
  errors: Array<{ field?: string[]; message: string; code?: string }>,
): { fieldErrors?: Record<string, string>; generalError?: string } {
  const fieldErrors: Record<string, string> = {};
  let generalError: string | undefined;

  for (const error of errors) {
    if (error.field && error.field.length > 0) {
      const apiFieldName = error.field[error.field.length - 1];
      const formFieldName =
        SHOPIFY_FIELD_TO_FORM_FIELD[apiFieldName] ?? apiFieldName;
      fieldErrors[formFieldName] = humanizeErrorMessage(
        error.message,
        formFieldName,
      );
    } else {
      generalError = error.message;
    }
  }

  return {
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    generalError,
  };
}

function validateAddressInput(formData: FormData): {
  valid: boolean;
  data?: AddressInput;
  fieldErrors?: Record<string, string>;
} {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const company = formData.get("company") as string;
  const address1 = formData.get("address1") as string;
  const address2 = formData.get("address2") as string;
  const city = formData.get("city") as string;
  const zoneCode = formData.get("zoneCode") as string;
  const territoryCode = formData.get("territoryCode") as string;
  const zip = formData.get("zip") as string;
  const phoneNumber = formData.get("phoneNumber") as string;

  const fieldErrors: Record<string, string> = {};

  if (!firstName?.trim()) {
    fieldErrors.firstName = "First name is required";
  }
  if (!lastName?.trim()) {
    fieldErrors.lastName = "Last name is required";
  }
  if (!address1?.trim()) {
    fieldErrors.address1 = "Address is required";
  }
  if (!city?.trim()) {
    fieldErrors.city = "City is required";
  }
  if (!territoryCode?.trim()) {
    fieldErrors.territoryCode = "Country is required";
  }
  if (!zip?.trim()) {
    fieldErrors.zip = "ZIP / Postal code is required";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { valid: false, fieldErrors };
  }

  return {
    valid: true,
    data: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company?.trim() || undefined,
      address1: address1.trim(),
      address2: address2?.trim() || undefined,
      city: city.trim(),
      zoneCode: zoneCode?.trim() || undefined,
      territoryCode: territoryCode.trim(),
      zip: zip.trim(),
      phoneNumber: phoneNumber?.trim() || undefined,
    },
  };
}

export async function createAddressAction(
  _prevState: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  const session = await getSession();

  if (!session?.accessToken) {
    return {
      success: false,
      error: "Your session has expired. Please log in again.",
    };
  }

  const validation = validateAddressInput(formData);
  if (!validation.valid) {
    return {
      success: false,
      fieldErrors: validation.fieldErrors,
    };
  }

  if (!validation.data) {
    return {
      success: false,
      error: "Invalid address data",
    };
  }

  try {
    const result = await createAddress(session.accessToken, validation.data);

    if (result.errors && result.errors.length > 0) {
      const { fieldErrors, generalError } = processShopifyErrors(result.errors);

      return {
        success: false,
        error: generalError,
        fieldErrors,
      };
    }

    revalidatePath("/account/addresses");

    return { success: true };
  } catch (error) {
    console.error("[addresses] createAddressAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create address. Please try again.",
    };
  }
}

export async function updateAddressAction(
  _prevState: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  const session = await getSession();

  if (!session?.accessToken) {
    return {
      success: false,
      error: "You must be logged in to update an address",
    };
  }

  const addressId = formData.get("id") as string;
  if (!addressId) {
    return {
      success: false,
      error: "Address ID is required",
    };
  }

  const validation = validateAddressInput(formData);
  if (!validation.valid) {
    return {
      success: false,
      fieldErrors: validation.fieldErrors,
    };
  }

  if (!validation.data) {
    return {
      success: false,
      error: "Invalid address data",
    };
  }

  try {
    const result = await updateAddress(
      session.accessToken,
      addressId,
      validation.data,
    );

    if (result.errors && result.errors.length > 0) {
      const { fieldErrors, generalError } = processShopifyErrors(result.errors);

      return {
        success: false,
        error: generalError,
        fieldErrors,
      };
    }

    revalidatePath("/account/addresses");

    return { success: true };
  } catch (error) {
    console.error("[addresses] updateAddressAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update address. Please try again.",
    };
  }
}

export interface DeleteAddressState {
  success: boolean;
  error?: string;
}

export async function deleteAddressAction(
  addressId: string,
): Promise<DeleteAddressState> {
  const session = await getSession();

  if (!session?.accessToken) {
    return {
      success: false,
      error: "You must be logged in to delete an address",
    };
  }

  try {
    const result = await deleteAddress(session.accessToken, addressId);

    if (result.errors && result.errors.length > 0) {
      return {
        success: false,
        error: result.errors[0].message,
      };
    }

    revalidatePath("/account/addresses");

    return { success: true };
  } catch (error) {
    console.error("[addresses] deleteAddressAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete address. Please try again.",
    };
  }
}

export async function setDefaultAddressAction(
  addressId: string,
): Promise<DeleteAddressState> {
  const session = await getSession();

  if (!session?.accessToken) {
    return {
      success: false,
      error: "You must be logged in to set default address",
    };
  }

  try {
    const result = await setDefaultAddress(session.accessToken, addressId);

    if (result.errors && result.errors.length > 0) {
      return {
        success: false,
        error: result.errors[0].message,
      };
    }

    revalidatePath("/account/addresses");

    return { success: true };
  } catch (error) {
    console.error("[addresses] setDefaultAddressAction error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to set default address. Please try again.",
    };
  }
}
