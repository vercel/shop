/**
 * UCP Checkout Session Endpoint
 * POST /api/ucp/checkout — Create checkout session
 *
 * Maps to commerce cart creation + line item addition.
 */

import {
  addToCheckoutSession,
  createCheckoutSession,
} from "@/lib/ucp/handlers";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { line_items, locale } = body;

    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return Response.json(
        { error: { code: "invalid_request", message: "line_items array is required" } },
        { status: 400 },
      );
    }

    // Validate line items have variant_id and quantity
    for (const item of line_items) {
      if (!item.variant_id || typeof item.quantity !== "number" || item.quantity < 1) {
        return Response.json(
          {
            error: {
              code: "invalid_request",
              message: "Each line_item must have variant_id (string) and quantity (number >= 1)",
            },
          },
          { status: 400 },
        );
      }
    }

    const session = await createCheckoutSession({
      line_items: line_items.map((li: { variant_id: string; quantity: number }) => ({
        variant_id: li.variant_id,
        quantity: li.quantity,
      })),
      locale,
    });

    return Response.json(session, { status: 201 });
  } catch (error) {
    console.error("UCP checkout creation failed:", error);
    return Response.json(
      { error: { code: "internal_error", message: "Failed to create checkout session" } },
      { status: 500 },
    );
  }
}
