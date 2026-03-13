"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/server";
import { updateCustomer } from "@/lib/shopify/operations/customer";

export interface ProfileUpdateActionState {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function updateProfileAction(
  _prevState: ProfileUpdateActionState,
  formData: FormData,
): Promise<ProfileUpdateActionState> {
  const session = await getSession();

  if (!session?.accessToken) {
    return {
      success: false,
      error: "You must be logged in to update your profile",
    };
  }

  const firstName = formData.get("firstName")?.toString().trim();
  const lastName = formData.get("lastName")?.toString().trim();

  const fieldErrors: Record<string, string> = {};

  if (!firstName) {
    fieldErrors.firstName = "First name is required";
  }

  if (!lastName) {
    fieldErrors.lastName = "Last name is required";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      fieldErrors,
    };
  }

  const result = await updateCustomer(session.accessToken, {
    firstName,
    lastName,
  });

  if (result.errors && result.errors.length > 0) {
    for (const error of result.errors) {
      if (error.field && error.field.length > 0) {
        const fieldName = error.field[error.field.length - 1];
        fieldErrors[fieldName] = error.message;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        fieldErrors,
      };
    }

    return {
      success: false,
      error: result.errors[0].message,
    };
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");

  return {
    success: true,
  };
}
