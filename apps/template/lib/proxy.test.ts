import assert from "node:assert/strict";
import test from "node:test";

import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";

import { config } from "../proxy.ts";

test("only Liquid product variant URLs match the compatibility proxy", () => {
  assert.equal(
    unstable_doesMiddlewareMatch({
      config,
      url: "https://example.com/products/classic-tee?variant=123",
    }),
    true,
  );
  assert.equal(
    unstable_doesMiddlewareMatch({
      config,
      url: "https://example.com/products/classic-tee?Color=Black",
    }),
    false,
  );
  assert.equal(
    unstable_doesMiddlewareMatch({
      config,
      url: "https://example.com/collections/all?variant=123",
    }),
    false,
  );
});
