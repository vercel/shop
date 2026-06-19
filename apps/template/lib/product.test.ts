import assert from "node:assert/strict";
import test from "node:test";

import { getProductVariantUrl } from "./product-url.ts";

test("builds concrete product variant URLs", () => {
  assert.equal(
    getProductVariantUrl("classic-tee", "gid://shopify/ProductVariant/123"),
    "/products/classic-tee?variant=123",
  );
});

test("accepts numeric product variant ids", () => {
  assert.equal(getProductVariantUrl("classic-tee", "123"), "/products/classic-tee?variant=123");
});

test("rejects malformed product variant ids", () => {
  assert.throws(
    () => getProductVariantUrl("classic-tee", "../../account"),
    /Invalid Shopify product variant ID/,
  );
});

test("preserves attribution parameters while replacing a Liquid variant parameter", () => {
  assert.equal(
    getProductVariantUrl("classic-tee", "123", {
      utm_campaign: "spring",
      variant: "123",
    }),
    "/products/classic-tee?variant=123&utm_campaign=spring",
  );
});
