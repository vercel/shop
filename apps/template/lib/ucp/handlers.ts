/**
 * UCP Handlers — Commerce operations mapped to UCP types
 *
 * These handlers bridge UCP REST/MCP requests to the CommerceProvider.
 * The commerce cart serves as the checkout session (cart ID = session ID).
 */

import { commerce } from "@/lib/commerce";
import { siteConfig } from "@/lib/config";

import type {
  CheckoutStatus,
  UCPCheckoutSession,
  UCPCollection,
  UCPLineItem,
  UCPProduct,
  UCPTotals,
} from "./types";

const UCP_VERSION = "2026-01-11";
const CAPABILITIES = [
  "dev.ucp.shopping.checkout",
  "dev.ucp.shopping.catalog_search",
  "dev.ucp.shopping.catalog_lookup",
];

function moneyToMinorUnits(amount: string): number {
  return Math.round(Number.parseFloat(amount) * 100);
}

function getBaseUrl(): string {
  return siteConfig.url || "https://localhost:3000";
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

export async function searchCatalog(params: {
  query: string;
  limit?: number;
  sort?: string;
  locale?: string;
}): Promise<{ products: UCPProduct[]; total: number }> {
  const { products, total } = await commerce.products.getProducts({
    query: params.query,
    limit: params.limit ?? 10,
    sortKey: params.sort ?? "best-matches",
    locale: params.locale,
  });

  const baseUrl = getBaseUrl();
  return {
    total,
    products: products.map((p) => ({
      id: p.id,
      handle: p.handle,
      title: p.title,
      description: p.description,
      price: {
        amount: moneyToMinorUnits(p.price.amount),
        currency: p.price.currencyCode,
      },
      compare_at_price: p.compareAtPrice
        ? {
            amount: moneyToMinorUnits(p.compareAtPrice.amount),
            currency: p.compareAtPrice.currencyCode,
          }
        : null,
      available: p.availableForSale,
      vendor: p.vendor,
      url: `${baseUrl}/products/${p.handle}`,
      image_url: p.featuredImage?.url ?? null,
      variants: p.variants.map((v) => ({
        id: v.id,
        title: v.title,
        available: v.availableForSale,
        price: {
          amount: moneyToMinorUnits(v.price.amount),
          currency: v.price.currencyCode,
        },
        options: v.selectedOptions,
      })),
    })),
  };
}

export async function lookupProduct(
  handle: string,
  locale?: string,
): Promise<UCPProduct | null> {
  try {
    const p = await commerce.products.getProduct(handle, locale);
    const baseUrl = getBaseUrl();

    return {
      id: p.id,
      handle: p.handle,
      title: p.title,
      description: p.description,
      price: {
        amount: moneyToMinorUnits(p.price.amount),
        currency: p.price.currencyCode,
      },
      compare_at_price: p.compareAtPrice
        ? {
            amount: moneyToMinorUnits(p.compareAtPrice.amount),
            currency: p.compareAtPrice.currencyCode,
          }
        : null,
      available: p.availableForSale,
      vendor: p.vendor,
      url: `${baseUrl}/products/${p.handle}`,
      image_url: p.featuredImage?.url ?? null,
      variants: p.variants.map((v) => ({
        id: v.id,
        title: v.title,
        available: v.availableForSale,
        price: {
          amount: moneyToMinorUnits(v.price.amount),
          currency: v.price.currencyCode,
        },
        options: v.selectedOptions,
      })),
    };
  } catch {
    return null;
  }
}

export async function listCollections(locale?: string): Promise<UCPCollection[]> {
  const collections = await commerce.collections.getCollections(locale);
  const baseUrl = getBaseUrl();

  return collections.map((c) => ({
    handle: c.handle,
    title: c.title,
    description: c.description,
    url: `${baseUrl}/collections/${c.handle}`,
  }));
}

// ─── Checkout (backed by Commerce Cart) ──────────────────────────────────────

function cartToCheckoutSession(cart: NonNullable<Awaited<ReturnType<typeof commerce.cart.getCart>>>): UCPCheckoutSession {
  const baseUrl = getBaseUrl();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const lineItems: UCPLineItem[] = cart.lines.map((line) => ({
    id: line.id ?? "",
    name: `${line.merchandise.product.title} - ${line.merchandise.title}`,
    quantity: line.quantity,
    unit_price: line.merchandise.price
      ? moneyToMinorUnits(line.merchandise.price.amount)
      : 0,
    total_price: moneyToMinorUnits(line.cost.totalAmount.amount),
    currency: line.cost.totalAmount.currencyCode,
    product_url: `${baseUrl}/products/${line.merchandise.product.handle}`,
    image_url: line.merchandise.product.featuredImage?.url,
  }));

  const totals: UCPTotals = {
    subtotal: moneyToMinorUnits(cart.cost.subtotalAmount.amount),
    tax: moneyToMinorUnits(cart.cost.totalTaxAmount.amount),
    shipping: cart.shippingCost ? moneyToMinorUnits(cart.shippingCost.amount) : 0,
    discount: 0,
    grand_total: moneyToMinorUnits(cart.cost.totalAmount.amount),
    currency: cart.cost.totalAmount.currencyCode,
  };

  const status: CheckoutStatus =
    cart.lines.length === 0 ? "incomplete" : "ready_for_complete";

  return {
    ucp: {
      version: UCP_VERSION,
      capabilities: CAPABILITIES,
    },
    id: cart.id ?? "",
    status,
    currency: cart.cost.totalAmount.currencyCode,
    line_items: lineItems,
    totals,
    payment: {
      status: "pending",
      handlers: [],
      amount_due: totals.grand_total,
      currency: totals.currency,
    },
    links: {
      self: `${baseUrl}/api/ucp/checkout/${encodeURIComponent(cart.id ?? "")}`,
      continue_url: cart.checkoutUrl,
    },
    messages: [],
    expires_at: expiresAt,
    created_at: now,
    updated_at: now,
  };
}

export async function createCheckoutSession(params: {
  line_items: Array<{ variant_id: string; quantity: number }>;
  locale?: string;
}): Promise<UCPCheckoutSession> {
  // Create a cart (which serves as the checkout session)
  const cart = await commerce.cart.createCartWithoutCookie(params.locale);

  if (params.line_items.length > 0 && cart.id) {
    const updatedCart = await commerce.cart.addToCart(
      params.line_items.map((li) => ({
        merchandiseId: li.variant_id,
        quantity: li.quantity,
      })),
      cart.id,
      params.locale,
    );
    return cartToCheckoutSession(updatedCart);
  }

  return cartToCheckoutSession(cart);
}

export async function getCheckoutSession(
  sessionId: string,
): Promise<UCPCheckoutSession | null> {
  const cart = await commerce.cart.getCart(sessionId);
  if (!cart) return null;
  return cartToCheckoutSession(cart);
}

export async function addToCheckoutSession(
  sessionId: string,
  lines: Array<{ variant_id: string; quantity: number }>,
  locale?: string,
): Promise<UCPCheckoutSession | null> {
  const cart = await commerce.cart.addToCart(
    lines.map((l) => ({ merchandiseId: l.variant_id, quantity: l.quantity })),
    sessionId,
    locale,
  );
  return cartToCheckoutSession(cart);
}

export async function updateCheckoutLines(
  sessionId: string,
  lines: Array<{ line_id: string; merchandise_id: string; quantity: number }>,
): Promise<UCPCheckoutSession | null> {
  const cart = await commerce.cart.updateCart(
    lines.map((l) => ({ id: l.line_id, merchandiseId: l.merchandise_id, quantity: l.quantity })),
    sessionId,
  );
  return cartToCheckoutSession(cart);
}

export async function removeFromCheckoutSession(
  sessionId: string,
  lineIds: string[],
): Promise<UCPCheckoutSession | null> {
  const cart = await commerce.cart.removeFromCart(lineIds, sessionId);
  return cartToCheckoutSession(cart);
}
