import type { ToolContext } from "eve/tools";

import type { commerceSchemas } from "../../lib/agent/commerce";
import { executeCommerce } from "../../lib/agent/commerce/server";

export async function callCommerce(
  tool: keyof typeof commerceSchemas,
  input: unknown,
  ctx: ToolContext,
) {
  const cartId = ctx.session.auth.current?.attributes.cartId;
  try {
    return await executeCommerce(tool, input, typeof cartId === "string" ? cartId : undefined);
  } catch {
    return {
      error:
        "Shopping tool could not be confirmed. Inspect the cart before requesting another change; it may already have succeeded.",
    };
  }
}
