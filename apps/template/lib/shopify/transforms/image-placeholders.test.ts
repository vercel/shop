import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

const { parseImagePlaceholders } = createRequire(import.meta.url)(
  "./image-placeholders.ts",
) as typeof import("./image-placeholders");

const MEDIA_ID = "gid://shopify/MediaImage/123";
const BLUR_DATA_URL = "data:image/jpeg;base64,abc123";

function metafield(images: Record<string, unknown>, version = 1): unknown {
  return { images, version };
}

test("returns a valid matched placeholder", () => {
  const placeholders = parseImagePlaceholders(
    metafield({
      [MEDIA_ID]: { blurDataURL: BLUR_DATA_URL, height: 9, width: 16 },
    }),
  );

  assert.equal(placeholders.get(MEDIA_ID)?.blurDataURL, BLUR_DATA_URL);
});

test("returns no placeholder for media without a match", () => {
  const placeholders = parseImagePlaceholders(
    metafield({
      [MEDIA_ID]: { blurDataURL: BLUR_DATA_URL, height: 9, width: 16 },
    }),
  );

  assert.equal(placeholders.get("gid://shopify/MediaImage/456"), undefined);
});

test("returns no placeholders for a missing metafield", () => {
  assert.equal(parseImagePlaceholders(null).size, 0);
  assert.equal(parseImagePlaceholders(undefined).size, 0);
});

test("returns no placeholders for malformed JSON or jsonValue", () => {
  assert.equal(parseImagePlaceholders("{").size, 0);
  assert.equal(parseImagePlaceholders({ images: [], version: 1 }).size, 0);
});

test("returns no placeholders for an unsupported version", () => {
  assert.equal(
    parseImagePlaceholders(
      metafield({ [MEDIA_ID]: { blurDataURL: BLUR_DATA_URL, height: 9, width: 16 } }, 2),
    ).size,
    0,
  );
});

test("rejects invalid and non-image data URLs", () => {
  for (const blurDataURL of [
    "https://cdn.shopify.com/placeholder.jpg",
    "data:text/html;base64,abc123",
    "data:image/svg+xml;base64,abc123",
    "data:image/jpeg,abc123",
  ]) {
    const placeholders = parseImagePlaceholders(
      metafield({ [MEDIA_ID]: { blurDataURL, height: 9, width: 16 } }),
    );

    assert.equal(placeholders.size, 0);
  }
});
