import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildProductUrl,
  parseSelectedOptions,
  toProductFormInput,
  toProductFormVariant,
} from "../lib/product.ts";

const options = [
  { name: "Color", values: [{ name: "Blue" }, { name: "Red" }] },
  { name: "Size", values: [{ name: "S" }, { name: "M" }] },
];

const variant = {
  availableForSale: true,
  components: [],
  id: "gid://shopify/ProductVariant/1",
  image: null,
  price: { amount: "10.00", currencyCode: "USD" },
  productHandle: "shirt",
  productTitle: "Shirt",
  requiresComponents: false,
  selectedOptions: [{ name: "Color", value: "Blue" }],
  title: "Blue",
};

test("product selection normalizes case and ignores unrelated URL parameters", () => {
  assert.deepEqual(
    parseSelectedOptions(options, { color: "blue", size: ["m", "s"], utm_source: "email" }),
    { Color: "Blue", Size: "M" },
  );
  assert.deepEqual(parseSelectedOptions(options, { color: "missing" }), { Color: "missing" });
});

test("Hydrogen URL adapter replaces old option casing and preserves campaign parameters", () => {
  const base = new URLSearchParams("color=red&size=s&utm_source=email");
  const url = new URL(
    buildProductUrl(
      "shirt",
      [
        { name: "Color", value: "Blue" },
        { name: "Size", value: "M" },
      ],
      base,
    ),
    "https://shop.example",
  );
  assert.equal(url.pathname, "/products/shirt");
  assert.equal(url.searchParams.get("utm_source"), "email");
  assert.equal(url.searchParams.has("color"), false);
  assert.equal(url.searchParams.has("size"), false);
  assert.deepEqual(parseSelectedOptions(options, Object.fromEntries(url.searchParams)), {
    Color: "Blue",
    Size: "M",
  });
  assert.equal(base.toString(), "color=red&size=s&utm_source=email");
});

test("product form seed retains URL selection, cross-product handles, and swatch thumbnails", () => {
  const product = {
    adjacentVariants: [variant],
    handle: "shirt",
    id: "gid://shopify/Product/1",
    options: [
      {
        name: "Color",
        values: [
          {
            name: "Blue",
            image: "https://cdn.example/blue.jpg",
            swatch: { color: "#00f" },
            firstSelectableVariant: variant,
          },
        ],
      },
    ],
    priceRange: { minVariantPrice: variant.price, maxVariantPrice: variant.price },
    title: "Shirt",
  };
  const selected = { ...variant, productHandle: "other-shirt" };
  const input = toProductFormInput(product, selected);
  assert.equal(input.selectedOrFirstAvailableVariant.product.handle, "other-shirt");
  assert.equal(
    input.options[0].optionValues[0].swatch.variantImage,
    "https://cdn.example/blue.jpg",
  );
  assert.deepEqual(input.adjacentVariants[0].selectedOptions, variant.selectedOptions);
  assert.equal(toProductFormInput(product, undefined).selectedOrFirstAvailableVariant, null);
});

test("product adapter gates configurable bundles but not fixed component bundles", () => {
  assert.equal(
    toProductFormVariant({ ...variant, requiresComponents: true }).requiresBundleConfiguration,
    true,
  );
  assert.equal(
    toProductFormVariant({ ...variant, requiresComponents: true, components: [{}] })
      .requiresBundleConfiguration,
    false,
  );
  assert.equal(toProductFormVariant(variant).requiresBundleConfiguration, false);
});
