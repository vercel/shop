import { tool } from "ai";
import { z } from "zod";
import { getOrder } from "@/lib/shopify/operations/customer";
import { getAgentContext } from "../context";

export function getOrderDetailsTool() {
  return tool({
    description: `Get detailed information about a specific order. Only available for logged-in users.
Use this when the user asks about a specific order, wants tracking info, or order details.
Get the orderId from getOrderHistory results.`,
    inputSchema: z.object({
      orderId: z
        .string()
        .describe(
          "The order ID from getOrderHistory results (e.g. 'gid://shopify/Order/...')",
        ),
    }),
    execute: async ({ orderId }) => {
      const { user } = getAgentContext();

      if (user.type !== "user") {
        return {
          success: false,
          error: "You must be logged in to view order details.",
        };
      }

      try {
        const order = await getOrder(user.accessToken, orderId);

        if (!order) {
          return {
            success: false,
            error: "Order not found.",
          };
        }

        return {
          success: true,
          order: {
            orderNumber: order.name,
            date: order.processedAt,
            fulfillmentStatus: order.fulfillmentStatus,
            financialStatus: order.financialStatus,
            total: `${order.totalPrice.amount} ${order.totalPrice.currencyCode}`,
            subtotal: order.subtotalPrice
              ? `${order.subtotalPrice.amount} ${order.subtotalPrice.currencyCode}`
              : null,
            shipping: order.totalShippingPrice
              ? `${order.totalShippingPrice.amount} ${order.totalShippingPrice.currencyCode}`
              : null,
            tax: order.totalTax
              ? `${order.totalTax.amount} ${order.totalTax.currencyCode}`
              : null,
            cancelled: !!order.cancelledAt,
            cancelReason: order.cancelReason,
            lineItems: order.lineItems.map((item) => ({
              title: item.title,
              variantTitle: item.variantTitle,
              quantity: item.quantity,
              price: `${item.discountedTotalPrice.amount} ${item.discountedTotalPrice.currencyCode}`,
            })),
            shippingAddress: order.shippingAddress
              ? order.shippingAddress.formatted.join(", ")
              : null,
            fulfillments: order.fulfillments.map((f) => ({
              status: f.status,
              trackingCompany: f.trackingCompany,
              trackingNumber: f.trackingNumber,
              trackingUrl: f.trackingUrl,
              estimatedDelivery: f.estimatedDeliveryAt,
              deliveredAt: f.deliveredAt,
            })),
            statusPageUrl: order.statusPageUrl,
          },
        };
      } catch (error) {
        console.error("Failed to get order details:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to get order details",
        };
      }
    },
  });
}
