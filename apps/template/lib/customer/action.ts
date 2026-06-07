"use server";

import { revalidatePath } from "next/cache";

import {
  createCustomerAddress,
  type CustomerUserError,
  deleteCustomerAddress,
  updateCustomerAddress,
  updateCustomerProfile,
} from "@/lib/shopify/operations/customer";
import type { CustomerAddressInput } from "@/lib/types";

export interface AccountActionResult {
  error?: string;
  fieldErrors?: Record<string, string>;
  success: boolean;
}

const MAX_FIELD_LENGTH = 255;
const MAX_NAME_LENGTH = 100;

const ADDRESS_FIELDS = [
  "address1",
  "address2",
  "city",
  "company",
  "firstName",
  "lastName",
  "phoneNumber",
  "territoryCode",
  "zip",
  "zoneCode",
] as const satisfies readonly (keyof CustomerAddressInput)[];

const UPPERCASE_FIELDS = new Set<keyof CustomerAddressInput>(["territoryCode", "zoneCode"]);

// Customer Account API userErrors carry a `field` path like ["address", "zip"];
// the last segment is the input field a form can highlight.
function mapUserErrors(errors: CustomerUserError[]): AccountActionResult {
  if (errors.length === 0) return { success: true };

  const fieldErrors: Record<string, string> = {};
  for (const error of errors) {
    const key = error.field?.at(-1);
    if (key && !fieldErrors[key]) fieldErrors[key] = error.message;
  }

  return {
    success: false,
    error: errors[0].message,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
  };
}

function buildAddressInput(raw: CustomerAddressInput): CustomerAddressInput {
  const input: CustomerAddressInput = {};

  for (const field of ADDRESS_FIELDS) {
    const value = raw[field]?.trim().slice(0, MAX_FIELD_LENGTH);
    if (!value) continue;
    input[field] = UPPERCASE_FIELDS.has(field) ? value.toUpperCase() : value;
  }

  return input;
}

function validateAddress(input: CustomerAddressInput): string | null {
  if (!input.address1) return "Address is required";
  if (!input.city) return "City is required";
  if (!input.territoryCode) return "Country is required";
  return null;
}

export async function createAddressAction(
  raw: CustomerAddressInput,
  isDefault: boolean,
): Promise<AccountActionResult> {
  const input = buildAddressInput(raw);
  const validationError = validateAddress(input);
  if (validationError) return { success: false, error: validationError };

  try {
    const result = mapUserErrors(await createCustomerAddress(input, isDefault));
    if (result.success) revalidatePath("/account/addresses");
    return result;
  } catch (error) {
    console.error("Create address failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create address",
    };
  }
}

export async function updateAddressAction(
  addressId: string,
  raw: CustomerAddressInput,
  isDefault: boolean,
): Promise<AccountActionResult> {
  if (!addressId) return { success: false, error: "Invalid address ID" };

  const input = buildAddressInput(raw);
  const validationError = validateAddress(input);
  if (validationError) return { success: false, error: validationError };

  try {
    const result = mapUserErrors(await updateCustomerAddress(addressId, input, isDefault));
    if (result.success) revalidatePath("/account/addresses");
    return result;
  } catch (error) {
    console.error("Update address failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update address",
    };
  }
}

export async function deleteAddressAction(addressId: string): Promise<AccountActionResult> {
  if (!addressId) return { success: false, error: "Invalid address ID" };

  try {
    const result = mapUserErrors(await deleteCustomerAddress(addressId));
    if (result.success) revalidatePath("/account/addresses");
    return result;
  } catch (error) {
    console.error("Delete address failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete address",
    };
  }
}

export async function updateProfileAction(raw: {
  firstName: string;
  lastName: string;
}): Promise<AccountActionResult> {
  const input = {
    firstName: raw.firstName.trim().slice(0, MAX_NAME_LENGTH),
    lastName: raw.lastName.trim().slice(0, MAX_NAME_LENGTH),
  };

  try {
    const result = mapUserErrors(await updateCustomerProfile(input));
    if (result.success) revalidatePath("/account/profile");
    return result;
  } catch (error) {
    console.error("Update profile failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}
