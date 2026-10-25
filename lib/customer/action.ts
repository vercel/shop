"use server";

import { refresh } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import type { CustomerAddressInput } from "@/lib/customer/types";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  updateCustomerAddress,
  updateCustomerProfile,
} from "@/lib/shopify/operations/customer/server";
import { type CustomerUserError } from "@/lib/shopify/operations/customer/types";

import type { AccountActionResult } from "./types";

const MAX_FIELD_LENGTH = 255;
const MAX_NAME_LENGTH = 100;

const ADDRESS_VALUE = z.string().optional();

const ADDRESS_INPUT = z.strictObject({
  address1: ADDRESS_VALUE,
  address2: ADDRESS_VALUE,
  city: ADDRESS_VALUE,
  company: ADDRESS_VALUE,
  countryCode: ADDRESS_VALUE,
  firstName: ADDRESS_VALUE,
  lastName: ADDRESS_VALUE,
  phoneNumber: ADDRESS_VALUE,
  zip: ADDRESS_VALUE,
  zoneCode: ADDRESS_VALUE,
} satisfies Partial<Record<keyof CustomerAddressInput, typeof ADDRESS_VALUE>>);

const ADDRESS_ID = z.string().min(1);

const CREATE_ADDRESS_INPUT = z.strictObject({ address: ADDRESS_INPUT, isDefault: z.boolean() });

const UPDATE_ADDRESS_INPUT = z.strictObject({
  address: ADDRESS_INPUT,
  addressId: ADDRESS_ID,
  isDefault: z.boolean(),
});

const PROFILE_INPUT = z.strictObject({ firstName: z.string(), lastName: z.string() });

const UPPERCASE_FIELDS = new Set<keyof CustomerAddressInput>(["countryCode", "zoneCode"]);

// Customer Account API field paths end with the form field to highlight.
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

function buildAddressInput(raw: z.infer<typeof ADDRESS_INPUT>): CustomerAddressInput {
  const input: CustomerAddressInput = {};

  for (const field of ADDRESS_INPUT.keyof().options) {
    const value = raw[field]?.trim().slice(0, MAX_FIELD_LENGTH);
    if (!value) continue;
    input[field] = UPPERCASE_FIELDS.has(field) ? value.toUpperCase() : value;
  }

  return input;
}

function validateAddress(input: CustomerAddressInput): string | null {
  if (!input.address1) return "Address is required";
  if (!input.city) return "City is required";
  if (!input.countryCode) return "Country is required";
  return null;
}

async function runCustomerMutation(
  mutate: () => Promise<CustomerUserError[]>,
  failureMessage: string,
): Promise<AccountActionResult> {
  try {
    const result = mapUserErrors(await mutate());
    if (result.success) refresh();
    return result;
  } catch (error) {
    unstable_rethrow(error);
    console.error(`${failureMessage}:`, error);
    return { success: false, error: failureMessage };
  }
}

export async function createAddressAction(
  address: CustomerAddressInput,
  isDefault: boolean,
): Promise<AccountActionResult> {
  const parsed = CREATE_ADDRESS_INPUT.safeParse({ address, isDefault });
  if (!parsed.success) return { success: false, error: "Invalid address" };

  const input = buildAddressInput(parsed.data.address);
  const validationError = validateAddress(input);
  if (validationError) return { success: false, error: validationError };

  return runCustomerMutation(
    () => createCustomerAddress(input, parsed.data.isDefault),
    "Failed to create address",
  );
}

export async function updateAddressAction(
  addressId: string,
  address: CustomerAddressInput,
  isDefault: boolean,
): Promise<AccountActionResult> {
  const parsed = UPDATE_ADDRESS_INPUT.safeParse({ address, addressId, isDefault });
  if (!parsed.success) return { success: false, error: "Invalid address" };

  const input = buildAddressInput(parsed.data.address);
  const validationError = validateAddress(input);
  if (validationError) return { success: false, error: validationError };

  return runCustomerMutation(
    () => updateCustomerAddress(parsed.data.addressId, input, parsed.data.isDefault),
    "Failed to update address",
  );
}

export async function deleteAddressAction(addressId: string): Promise<AccountActionResult> {
  const parsed = ADDRESS_ID.safeParse(addressId);
  if (!parsed.success) return { success: false, error: "Invalid address ID" };

  return runCustomerMutation(() => deleteCustomerAddress(parsed.data), "Failed to delete address");
}

export async function updateProfileAction(
  profile: z.infer<typeof PROFILE_INPUT>,
): Promise<AccountActionResult> {
  const parsed = PROFILE_INPUT.safeParse(profile);
  if (!parsed.success) return { success: false, error: "Invalid profile" };

  const firstName = parsed.data.firstName.trim().slice(0, MAX_NAME_LENGTH);
  const lastName = parsed.data.lastName.trim().slice(0, MAX_NAME_LENGTH);

  return runCustomerMutation(
    () => updateCustomerProfile({ firstName, lastName }),
    "Failed to update profile",
  );
}
