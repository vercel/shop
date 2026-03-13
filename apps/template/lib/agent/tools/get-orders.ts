import { tool } from "ai";
import { z } from "zod";
import { getOrders } from "@/lib/shopify/operations/customer";
import { getAgentContext } from "../context";

export function getOrderHistoryTool() {
  return tool({
    description: `Get the customer's order history. Only available for logged-in users.
Shows recent orders with their status, totals, and item counts.`,
    inputSchema: z.object({
      limit: z
        .number()
        .min(1)
        .max(20)
        .default(10)
        .describe("Number of orders to return (max 20)"),
    }),
    execute: async ({ limit }) => {
      const { user } = getAgentContext();

      if (user.type !== "user") {
        return {
          success: false,
          error: "You must be logged in to view orders.",
        };
      }

      try {
        const { orders } = await getOrders(user.accessToken, { first: limit });

        if (orders.length === 0) {
          return {
            success: true,
            message: "No orders found.",
            orders: [],
          };
        }

        return {
          success: true,
          orders: orders.map((order) => ({
            id: order.id,
            orderNumber: order.name,
            date: order.processedAt,
            fulfillmentStatus: order.fulfillmentStatus,
            financialStatus: order.financialStatus,
            total: `${order.totalPrice.amount} ${order.totalPrice.currencyCode}`,
            itemCount: order.lineItems.length,
            items: order.lineItems.map((item) => item.title).join(", "),
            cancelled: !!order.cancelledAt,
            statusPageUrl: order.statusPageUrl,
          })),
        };
      } catch (error) {
        console.error("Failed to get orders:", error);
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to get orders",
        };
      }
    },
  });
}
