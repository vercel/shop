/**
 * UCP Checkout Session by ID
 * GET  /api/ucp/checkout/:id — Retrieve session
 * PATCH /api/ucp/checkout/:id — Update session (add/update/remove lines)
 */

import {
  addToCheckoutSession,
  getCheckoutSession,
  removeFromCheckoutSession,
  updateCheckoutLines,
} from "@/lib/ucp/handlers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  const session = await getCheckoutSession(id);

  if (!session) {
    return Response.json(
      { error: { code: "not_found", message: "Checkout session not found" } },
      { status: 404 },
    );
  }

  return Response.json(session);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  try {
    const body = await request.json();
    const { action, line_items, remove_line_ids, locale } = body;

    let session;

    if (action === "add" && Array.isArray(line_items)) {
      session = await addToCheckoutSession(
        id,
        line_items.map((li: { variant_id: string; quantity: number }) => ({
          variant_id: li.variant_id,
          quantity: li.quantity,
        })),
        locale,
      );
    } else if (action === "update" && Array.isArray(line_items)) {
      session = await updateCheckoutLines(
        id,
        line_items.map(
          (li: { line_id: string; merchandise_id: string; quantity: number }) => ({
            line_id: li.line_id,
            merchandise_id: li.merchandise_id,
            quantity: li.quantity,
          }),
        ),
      );
    } else if (action === "remove" && Array.isArray(remove_line_ids)) {
      session = await removeFromCheckoutSession(id, remove_line_ids);
    } else {
      return Response.json(
        {
          error: {
            code: "invalid_request",
            message:
              "Provide action ('add'|'update'|'remove') with line_items or remove_line_ids",
          },
        },
        { status: 400 },
      );
    }

    if (!session) {
      return Response.json(
        { error: { code: "not_found", message: "Checkout session not found" } },
        { status: 404 },
      );
    }

    return Response.json(session);
  } catch (error) {
    console.error("UCP checkout update failed:", error);
    return Response.json(
      { error: { code: "internal_error", message: "Failed to update checkout session" } },
      { status: 500 },
    );
  }
}
