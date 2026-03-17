import crypto from "node:crypto";
import { getNumericShopifyId } from "@/lib/shopify/utils";
import { revalidateTag } from "next/cache";

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

/**
 * Verify Shopify webhook HMAC signature
 */
async function verifyWebhook(
  body: string,
  hmacHeader: string | null,
): Promise<boolean> {
  if (!SHOPIFY_WEBHOOK_SECRET || !hmacHeader) {
    return false;
  }

  const hash = crypto
    .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
    .update(body, "utf8")
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(hash, "base64"),
    Buffer.from(hmacHeader, "base64"),
  );
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
  const body = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  const topic = request.headers.get("x-shopify-topic");

  // Verify webhook signature in production
  if (SHOPIFY_WEBHOOK_SECRET) {
    const isValid = await verifyWebhook(body, hmacHeader);
    if (!isValid) {
      console.error("Invalid Shopify webhook signature");
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
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
      const type =
        payload.type || payload.metaobject?.type || payload.metaobject_type;
      const handle =
        payload.handle ||
        payload.metaobject?.handle ||
        payload.metaobject_handle;

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

  console.log(
    `[Shopify Webhook] Invalidated tags: ${tagsInvalidated.join(", ")}`,
  );

  return Response.json({
    success: true,
    topic,
    tagsInvalidated,
  });
}
