import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";

import { addGiftCardToCart } from "./gift-card-client.ts";

function mockCartRequest(t: TestContext, response: Promise<Response>) {
  let dispatchedEvent: Event | undefined;
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      dispatchEvent(event: Event & { promise: Promise<unknown> }) {
        dispatchedEvent = event;
        void event.promise.catch(() => {});
        return true;
      },
    },
  });
  t.after(() => {
    if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
    else Reflect.deleteProperty(globalThis, "document");
  });
  const fetch = t.mock.method(globalThis, "fetch", () => response);
  return { event: () => dispatchedEvent, fetch };
}

test("gift-card adds dispatch optimistically but resolve only after confirmation", async (t) => {
  let confirm!: (response: Response) => void;
  const response = new Promise<Response>((resolve) => {
    confirm = resolve;
  });
  const request = mockCartRequest(t, response);
  const attributes = [{ key: "Recipient email", value: "friend@example.com" }];
  let confirmed = false;
  const result = addGiftCardToCart("variant-1", 1, undefined, attributes).then(() => {
    confirmed = true;
  });

  assert.equal(request.event()?.type, "shopify:cart:lines-update");
  assert.deepEqual(JSON.parse(String(request.fetch.mock.calls[0].arguments[1]?.body)), {
    lines: [{ attributes, merchandiseId: "variant-1", quantity: 1 }],
  });
  await Promise.resolve();
  assert.equal(confirmed, false);

  confirm(Response.json({ cart: { lines: { nodes: [] } }, warnings: [] }));
  await result;
  assert.equal(confirmed, true);
});

test("gift-card adds reject Shopify user errors even when a cart is returned", async (t) => {
  mockCartRequest(
    t,
    Promise.resolve(
      Response.json({
        cart: { lines: { nodes: [] } },
        userErrors: [{ message: "This gift card is unavailable" }],
      }),
    ),
  );
  await assert.rejects(addGiftCardToCart("variant-1", 1), /This gift card is unavailable/);
});

test("gift-card adds reject missing cart confirmation", async (t) => {
  mockCartRequest(t, Promise.resolve(Response.json({ cart: null })));
  await assert.rejects(addGiftCardToCart("variant-1", 1), /Could not add the gift card/);
});

test("gift-card adds reject unsuccessful HTTP responses", async (t) => {
  mockCartRequest(t, Promise.resolve(new Response(null, { status: 500 })));
  await assert.rejects(addGiftCardToCart("variant-1", 1), /Cart request failed: 500/);
});

test("gift-card adds reject network failures", async (t) => {
  mockCartRequest(t, Promise.reject(new TypeError("Failed to fetch")));
  await assert.rejects(addGiftCardToCart("variant-1", 1), /Failed to fetch/);
});
