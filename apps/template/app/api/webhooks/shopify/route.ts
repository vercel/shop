import crypto from "node:crypto";

import { revalidateTag } from "next/cache";

import { getNumericShopifyId } from "@/lib/shopify/utils";

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

async function verifyWebhook(body: string, hmacHeader: string | null): Promise<boolean> {
  if (!SHOPIFY_WEBHOOK_SECRET || !hmacHeader) {
    return false;
  }

  const hash = crypto
    .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
    .update(body, "utf8")
    .digest("base64");

  return crypto.timingSafeEqual(Buffer.from(hash, "base64"), Buffer.from(hmacHeader, "base64"));
}

/**
 * Cache invalidation handler. Configure topics in Shopify Admin →
 * Settings → Notifications → Webhooks. Supported: `products/*`,
 * `collections/*`, `inventory_levels/*`, `metaobjects/*`.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  const topic = request.headers.get("x-shopify-topic");

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

  if (topic.startsWith("products/")) {
    const productTags = ["products", "collections"];

    // Pull handle/id from the payload for targeted invalidation.
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
      // Parse failure: fall through and invalidate the generic tags.
    }

    for (const tag of productTags) {
      revalidateTag(tag, "max");
      tagsInvalidated.push(tag);
    }
  }

  if (topic.startsWith("collections/")) {
    const collectionTags = ["collections", "products", "menus"];

    try {
      const payload = JSON.parse(body);
      if (payload.handle) {
        collectionTags.push(`collection-${payload.handle}`);
      }
    } catch {
      // Parse failure: fall through and invalidate the generic tags.
    }

    for (const tag of collectionTags) {
      revalidateTag(tag, "max");
      tagsInvalidated.push(tag);
    }
  }

  if (topic.startsWith("inventory_levels/")) {
    const inventoryTags = ["products", "collections"];

    for (const tag of inventoryTags) {
      revalidateTag(tag, "max");
      tagsInvalidated.push(tag);
    }
  }

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
      // Parse failure: fall through and invalidate the base CMS tag only.
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
