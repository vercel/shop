import { tool } from "ai";
import { z } from "zod";
import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from "@/lib/shopify/operations/customer";
import { getAgentContext } from "../context";

const addressFields = {
  firstName: z.string().optional().describe("First name"),
  lastName: z.string().optional().describe("Last name"),
  company: z.string().optional().describe("Company name"),
  address1: z.string().optional().describe("Street address line 1"),
  address2: z.string().optional().describe("Street address line 2"),
  city: z.string().optional().describe("City"),
  zoneCode: z
    .string()
    .optional()
    .describe("Province/state code (e.g. 'CA', 'NY')"),
  territoryCode: z
    .string()
    .optional()
    .describe("Country code (e.g. 'US', 'CA', 'DE')"),
  zip: z.string().optional().describe("ZIP/postal code"),
  phoneNumber: z.string().optional().describe("Phone number"),
};

export function manageAddressTool() {
  return tool({
    description: `Manage the customer's saved shipping addresses. Supports creating, updating, deleting, and setting a default address.

Use "create" to add a new address. At minimum include address1, city, territoryCode, and zip.
Use "update" to modify an existing address — requires the addressId and any fields to change.
Use "delete" to remove an address by its addressId.
Use "setDefault" to mark an address as the default — requires the addressId.

Always confirm the action with the user before calling this tool. Only available for logged-in users.`,
    inputSchema: z.object({
      action: z
        .enum(["create", "update", "delete", "setDefault"])
        .describe("The address operation to perform"),
      addressId: z
        .string()
        .optional()
        .describe(
          "The address ID — required for update, delete, and setDefault",
        ),
      address: z
        .object(addressFields)
        .optional()
        .describe("Address fields — required for create, optional for update"),
    }),
    execute: async (input) => {
      const { user } = getAgentContext();

      if (user.type !== "user") {
        return {
          success: false,
          error: "You must be logged in to manage addresses.",
        };
      }

      try {
        switch (input.action) {
          case "create": {
            if (!input.address) {
              return {
                success: false,
                error: "address is required for create.",
              };
            }
            const result = await createAddress(user.accessToken, input.address);
            if (result.errors) {
              return {
                success: false,
                errors: result.errors.map((e) => e.message),
              };
            }
            return {
              success: true,
              message: "Address created.",
              address: result.data,
            };
          }

          case "update": {
            if (!input.addressId) {
              return {
                success: false,
                error: "addressId is required for update.",
              };
            }
            const result = await updateAddress(
              user.accessToken,
              input.addressId,
              input.address ?? {},
            );
            if (result.errors) {
              return {
                success: false,
                errors: result.errors.map((e) => e.message),
              };
            }
            return {
              success: true,
              message: "Address updated.",
              address: result.data,
            };
          }

          case "delete": {
            if (!input.addressId) {
              return {
                success: false,
                error: "addressId is required for delete.",
              };
            }
            const result = await deleteAddress(
              user.accessToken,
              input.addressId,
            );
            if (result.errors) {
              return {
                success: false,
                errors: result.errors.map((e) => e.message),
              };
            }
            return { success: true, message: "Address deleted." };
          }

          case "setDefault": {
            if (!input.addressId) {
              return {
                success: false,
                error: "addressId is required for setDefault.",
              };
            }
            const result = await setDefaultAddress(
              user.accessToken,
              input.addressId,
            );
            if (result.errors) {
              return {
                success: false,
                errors: result.errors.map((e) => e.message),
              };
            }
            return { success: true, message: "Default address updated." };
          }
        }
      } catch (error) {
        console.error(`Failed to ${input.action} address:`, error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : `Failed to ${input.action} address`,
        };
      }
    },
  });
}
