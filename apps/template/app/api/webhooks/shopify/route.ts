import crypto from "node:crypto";

import { revalidateTag } from "next/cache";

import { getNumericShopifyId } from "@/lib/shopify/utils";

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

function verifyWebhook(body: string, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader) return false;

  const expected = crypto.createHmac("sha256", secret).update(body, "utf8").digest();
  const received = Buffer.from(hmacHeader, "base64");

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  if (!SHOPIFY_WEBHOOK_SECRET) return new Response(null, { status: 404 });

  const body = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  const topic = request.headers.get("x-shopify-topic");

  if (!verifyWebhook(body, hmacHeader, SHOPIFY_WEBHOOK_SECRET)) {
    console.error("Invalid Shopify webhook signature");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!topic) {
    return Response.json({ error: "Missing topic header" }, { status: 400 });
  }

  const tagsInvalidated: string[] = [];

  if (topic.startsWith("products/")) {
    // Product tags cascade through every surface without purging the full catalog.
    const productTags: string[] = [];

    if (topic === "products/create" || topic === "products/delete") {
      productTags.push("products-index");
    }

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
      console.error("[Shopify Webhook] Could not parse products payload; no tags invalidated");
    }

    for (const tag of productTags) {
      revalidateTag(tag, { expire: 0 });
      tagsInvalidated.push(tag);
    }
  }

  if (topic.startsWith("collections/")) {
    // Create/delete also invalidate the collection index; the broad tag is break-glass only.
    const collectionTags: string[] = [];

    if (topic === "collections/create" || topic === "collections/delete") {
      collectionTags.push("collections-index");
    }

    try {
      const payload = JSON.parse(body);
      if (payload.handle) {
        collectionTags.push(`collection-${payload.handle}`);
      }
    } catch {
      console.error("[Shopify Webhook] Could not parse collections payload");
    }

    for (const tag of collectionTags) {
      revalidateTag(tag, { expire: 0 });
      tagsInvalidated.push(tag);
    }
  }

  if (topic.startsWith("metaobjects/")) {
    // Metaobjects are low-cardinality, so fire the broad tag too (unlike catalog) — aggregate reads refresh without per-type index tags.
    const metaobjectTags = ["metaobjects"];

    try {
      const payload = JSON.parse(body);
      if (payload.handle) {
        metaobjectTags.push(`metaobject-${payload.handle}`);
      }
    } catch {
      console.error("[Shopify Webhook] Could not parse metaobjects payload");
    }

    for (const tag of metaobjectTags) {
      revalidateTag(tag, { expire: 0 });
      tagsInvalidated.push(tag);
    }
  }

  return Response.json({
    success: true,
    topic,
    tagsInvalidated,
  });
}
