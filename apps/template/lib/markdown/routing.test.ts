import assert from "node:assert/strict";
import test from "node:test";

import { getMarkdownPath } from "./routing.ts";

test("maps routes with Markdown representations", () => {
  assert.equal(getMarkdownPath("/"), "/md");
  assert.equal(getMarkdownPath("/search"), "/md/search");
  assert.equal(getMarkdownPath("/collections/all"), "/md/collections/all");
  assert.equal(getMarkdownPath("/products/example"), "/md/products/example");
});

test("does not negotiate HTML-only routes", () => {
  assert.equal(getMarkdownPath("/cart"), null);
  assert.equal(getMarkdownPath("/blogs/news"), null);
  assert.equal(getMarkdownPath("/missing"), null);
});
