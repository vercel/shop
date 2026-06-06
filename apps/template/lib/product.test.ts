import assert from "node:assert/strict";
import test from "node:test";

import { getProductUrl } from "./product-url.ts";
import { getSelectedOptionsFromSearchParams } from "./product.ts";

test("maps option query parameters to a stable Shopify selection", () => {
  assert.deepEqual(
    getSelectedOptionsFromSearchParams({
      Size: "Medium",
      Color: ["Black", "Blue"],
    }),
    [
      { name: "Color", value: "Black" },
      { name: "Size", value: "Medium" },
    ],
  );
});

test("ignores compatibility and tracking parameters", () => {
  assert.deepEqual(
    getSelectedOptionsFromSearchParams({
      Color: "Black",
      fbclid: "facebook",
      gclid: "google",
      utm_source: "newsletter",
      variant: "123",
    }),
    [{ name: "Color", value: "Black" }],
  );
});

test("builds product links from selected option values", () => {
  assert.equal(
    getProductUrl("classic-tee", [
      { name: "Color", value: "Black" },
      { name: "Size", value: "Medium" },
    ]),
    "/products/classic-tee?Color=Black&Size=Medium",
  );
});

test("omits Shopify's synthetic default option from product links", () => {
  assert.equal(
    getProductUrl("gift-card", [{ name: "Title", value: "Default Title" }]),
    "/products/gift-card",
  );
});

test("preserves attribution parameters while replacing a Liquid variant parameter", () => {
  assert.equal(
    getProductUrl(
      "classic-tee",
      [
        { name: "Color", value: "Black" },
        { name: "Size", value: "Medium" },
      ],
      {
        utm_campaign: "spring",
        variant: "123",
      },
    ),
    "/products/classic-tee?Color=Black&Size=Medium&utm_campaign=spring",
  );
});
