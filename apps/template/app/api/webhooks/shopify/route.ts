import crypto from "node:crypto";

import { revalidateTag } from "next/cache";

import { getNumericShopifyId } from "@/lib/shopify/utils";

/**
 * Verify Shopify webhook HMAC signature
 */
async function verifyWebhook(
  secret: string,
  body: string,
  hmacHeader: string | null,
): Promise<boolean> {
  if (!hmacHeader) {
    return false;
  }

  const expected = Buffer.from(
    crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64"),
    "base64",
  );
  const received = Buffer.from(hmacHeader, "base64");

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

/**
 * Shopify webhook handler for cache invalidation
 *
 * Supported topics:
 * - products/create, products/update, products/delete
 * - collections/create, collections/update, collections/delete
 *
 * Configure these webhooks in Shopify Admin:
 * Settings > Notifications > Webhooks
 */
export async function POST(request: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("SHOPIFY_WEBHOOK_SECRET is not set");
    return Response.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  const topic = request.headers.get("x-shopify-topic");

  const isValid = await verifyWebhook(secret, body, hmacHeader);
  if (!isValid) {
    console.error("Invalid Shopify webhook signature");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!topic) {
    return Response.json({ error: "Missing topic header" }, { status: 400 });
  }

  console.log(`[Shopify Webhook] Received: ${topic}`);

  const tagsInvalidated: string[] = [];

  // Product-related webhooks
  if (topic.startsWith("products/")) {
    const productTags = ["products", "collections"];

    // Parse body to get specific product handle/id for targeted invalidation
    try {
      const payload = JSON.parse(body);
      if (payload.handle) {
        productTags.push(`product-${payload.handle}`);
        productTags.push(`recommendations-${payload.handle}`);
      }
      if (payload.admin_graphql_api_id) {
        const numericId = getNumericShopifyId(payload.admin_graphql_api_id);
        if (numericId) {
          productTags.push(`product-${numericId}`);
        }
      } else if (payload.id) {
        productTags.push(`product-${payload.id}`);
      }
    } catch {
      // If parsing fails, just invalidate generic tags
    }

    for (const tag of productTags) {
      revalidateTag(tag, "max");
      tagsInvalidated.push(tag);
    }
  }

  // Collection-related webhooks
  if (topic.startsWith("collections/")) {
    const collectionTags = ["collections", "products", "menus"];

    // Parse body to get specific collection handle
    try {
      const payload = JSON.parse(body);
      if (payload.handle) {
        collectionTags.push(`collection-${payload.handle}`);
      }
    } catch {
      // If parsing fails, just invalidate generic tags
    }

    for (const tag of collectionTags) {
      revalidateTag(tag, "max");
      tagsInvalidated.push(tag);
    }
  }

  // Inventory-related webhooks (product availability changes)
  if (topic.startsWith("inventory_levels/")) {
    const inventoryTags = ["products", "collections"];

    for (const tag of inventoryTags) {
      revalidateTag(tag, "max");
      tagsInvalidated.push(tag);
    }
  }

  // Metaobject-related webhooks (CMS)
  if (topic.startsWith("metaobjects/")) {
    const cmsTags = ["cms:all"];

    try {
      const payload = JSON.parse(body);
      const type = payload.type || payload.metaobject?.type || payload.metaobject_type;
      const handle = payload.handle || payload.metaobject?.handle || payload.metaobject_handle;

      if (type === "cms_page") {
        cmsTags.push("cms:pages");
        if (typeof handle === "string") {
          const slug = handle.split("--")[0];
          if (slug) {
            cmsTags.push(`cms:page:${slug}`);
          }
        }
      } else if (type === "cms_homepage") {
        cmsTags.push("cms:homepage");
      } else if (type === "cms_section" || type === "cms_hero") {
        cmsTags.push("cms:pages", "cms:homepage");
      }
    } catch {
      // If parsing fails, just invalidate base CMS tag
    }

    for (const tag of cmsTags) {
      revalidateTag(tag, "max");
      tagsInvalidated.push(tag);
    }
  }

  console.log(`[Shopify Webhook] Invalidated tags: ${tagsInvalidated.join(", ")}`);

  return Response.json({
    success: true,
    topic,
    tagsInvalidated,
  });
}
