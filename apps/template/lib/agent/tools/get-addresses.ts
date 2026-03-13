import { tool } from "ai";
import { z } from "zod";
import { getAddresses } from "@/lib/shopify/operations/customer";
import { getAgentContext } from "../context";

export function getAddressesTool() {
  return tool({
    description: `Get all saved shipping addresses. Only available for logged-in users.
Shows the customer's address book with their default address marked.`,
    inputSchema: z.object({}),
    execute: async () => {
      const { user } = getAgentContext();

      if (user.type !== "user") {
        return {
          success: false,
          error: "You must be logged in to view addresses.",
        };
      }

      try {
        const addresses = await getAddresses(user.accessToken);

        if (addresses.length === 0) {
          return {
            success: true,
            message: "No saved addresses.",
            addresses: [],
          };
        }

        return {
          success: true,
          addresses: addresses.map((addr) => ({
            id: addr.id,
            isDefault: addr.isDefault,
            name: [addr.firstName, addr.lastName].filter(Boolean).join(" "),
            company: addr.company,
            formatted: addr.formatted.join(", "),
            city: addr.city,
            country: addr.country,
            phone: addr.phone,
          })),
        };
      } catch (error) {
        console.error("Failed to get addresses:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to get addresses",
        };
      }
    },
  });
}
