import { stepCountIs, ToolLoopAgent, type ToolLoopAgentSettings } from "ai";

import { catalog } from ".";
import type { Locale } from "../i18n";
import type { ProductDetails } from "../types";
import { addCartNoteTool } from "./tools/add-cart-note";
import { addToCartTool } from "./tools/add-to-cart";
import { browseCollectionTool } from "./tools/browse-collection";
import { getCartTool } from "./tools/get-cart";
import { getProductDetailsTool } from "./tools/get-product-details";
import { getRecommendationsTool } from "./tools/get-recommendations";
import { listCollectionsTool } from "./tools/list-collections";
import { navigateTool } from "./tools/navigate";
import { removeFromCartTool } from "./tools/remove-from-cart";
import { searchProductsTool } from "./tools/search-products";
import { updateCartItemTool } from "./tools/update-cart-item";

export type User = {
  type: "guest";
  locale: Locale;
};

/** Resolved server-side from the Referer header with trusted data. */
export type PageContext =
  | { type: "home" }
  | { type: "product"; product: ProductDetails }
  | { type: "collection"; handle: string; title: string }
  | { type: "search"; query: string }
  | { type: "cart" }
  | null;

export interface AgentContext {
  chatId: string;
  user: User;
  cart: string | undefined;
  page: PageContext;
}

const agentContext = new AsyncLocalStorage<AgentContext>();

export function withAgentContext<T>(ctx: AgentContext, fn: () => T): T {
  return agentContext.run(ctx, fn);
}

export function setUser(user: User) {
  const ctx = agentContext.getStore();
  if (ctx) {
    ctx.user = user;
  }
}

export function getAgentContext() {
  const ctx = agentContext.getStore();
  if (!ctx) {
    throw new Error("Agent context not found");
  }
  return ctx;
}

/** Strip common leading whitespace from a tagged template literal. */
function dedent(strings: TemplateStringsArray, ...values: unknown[]): string {
  let raw = strings.reduce(
    (acc, str, i) => acc + str + (i < values.length ? String(values[i]) : ""),
    "",
  );
  raw = raw.replace(/^\n/, "");
  const match = raw.match(/^[ \t]+/m);
  if (match) {
    raw = raw.replace(new RegExp(`^${match[0]}`, "gm"), "");
  }
  return raw.trimEnd();
}

const BASE_SYSTEM_PROMPT = dedent`
You're a helpful shopping assistant for Vercel Shop. Never use emojis in your responses.
`;

function createSystemPrompt(ctx: AgentContext) {
  const { user, page } = ctx;

  let prompt = BASE_SYSTEM_PROMPT;

  prompt += dedent`\n
    You are currently in the ${user.locale} locale, always respond in the same language as the user but prefer to use the user's language when unclear.
  `;

  prompt += dedent`\n
    ## Your Capabilities

    You can help users with:
    - **Finding products**: Search by name/keyword, browse collections/categories, get product recommendations
    - **Product details**: Look up pricing, availability, variants, descriptions for any product
    - **Cart management**: Add items to cart, update quantities, remove items, add notes, view cart contents
    - **Checkout**: Direct users to checkout via their cart
    - **Navigation**: Guide users to any page on the site (products, collections, search, cart)
  `;

  if (page?.type === "home") {
    prompt += dedent`\n
      ## Current Page Context

      The user is on the home page.
      Help them discover products, browse collections, or get started shopping.
    `;
  } else if (page?.type === "product") {
    const { product } = page;
    const variantInfo = product.variants
      .map((v) => {
        const options = v.selectedOptions.map((o) => `${o.name}: ${o.value}`).join(", ");
        const stock = v.availableForSale ? "in stock" : "out of stock";
        return `  - "${v.title}" (${options}) - ${v.price.amount} ${v.price.currencyCode} [${stock}]\n    variant_id: ${v.id}`;
      })
      .join("\n");

    prompt += dedent`\n
      ## Current Page Context

      The user is currently viewing this product:

      **${product.title}**
      - Handle: ${product.handle}
      - Price: ${product.price.amount} ${product.price.currencyCode}${product.compareAtPrice ? ` (was ${product.compareAtPrice.amount} ${product.compareAtPrice.currencyCode})` : ""}
      - Available: ${product.availableForSale ? "Yes" : "No"}
      - Image: ${product.featuredImage?.url || "none"}

      Description: ${product.description}

      ### Available Variants
      ${variantInfo}

      When the user asks about "this product", "this item", or the current product, render an AgentProductCard for it using the data above (price as "${product.price.amount} ${product.price.currencyCode}"${product.compareAtPrice ? `, compareAtPrice as "${product.compareAtPrice.amount} ${product.compareAtPrice.currencyCode}"` : ""}).

      When the user says "add this to cart", "add to cart", or similar:
      1. If there's only one variant, use that variant_id directly
      2. If there are multiple variants, ask which one they want (size, color, etc.)
      3. Use the exact variant_id from the list above when calling addToCart
    `;
  } else if (page?.type === "collection") {
    prompt += dedent`\n
      ## Current Page Context

      The user is browsing the "${page.title}" collection (handle: "${page.handle}").
      You can use the browseCollection tool with this handle to show them products, or help them find specific items.
    `;
  } else if (page?.type === "search") {
    prompt += dedent`\n
      ## Current Page Context

      The user is on the search page${page.query ? `, searching for "${page.query}"` : ""}.
      You can help refine their search or provide more details about products they find.
    `;
  } else if (page?.type === "cart") {
    prompt += dedent`\n
      ## Current Page Context

      The user is viewing their shopping cart.
      You can help them update quantities, remove items, add notes, or proceed to checkout.
    `;
  }

  prompt +=
    "\n\n" +
    catalog.prompt({
      mode: "chat",
      customRules: [
        "When product tools (searchProducts, browseCollection, getProductRecommendations, getProductDetails) return successfully, ALWAYS render the products using AgentProductCard components inside an AgentProductGrid.",
        "For a single product detail result, use one AgentProductCard without an AgentProductGrid wrapper.",
        "Pass price and compareAtPrice strings directly from tool results as props.",
        "Include conversational text before or after the product cards to provide context.",
        "When getCart returns a non-empty cart (empty: false), ALWAYS render an AgentCartSummary with the cart data. Pass items (including image), subtotal, total, tax, totalQuantity, and checkoutUrl directly from the tool result.",
        "After a successful addToCart call, ALWAYS render an AgentCartConfirmation. Use product data from your context (prior search results, product details, or page context) to populate image, title, variant, and price props.",
        "When a user wants to add a product to cart but hasn't specified a variant, and the product has multiple variants, render an AgentVariantPicker with the product's variants from getProductDetails. Then ask the user which variant they'd like. Do NOT use AgentVariantPicker for single-variant products.",
      ],
    });

  return prompt;
}

function getSystemPrompt() {
  const ctx = getAgentContext();
  return createSystemPrompt(ctx);
}

const defaults: ToolLoopAgentSettings = {
  model: "anthropic/claude-sonnet-4.6",
  maxOutputTokens: 8192,
};

const tools = {
  searchProducts: searchProductsTool(),
  getProductDetails: getProductDetailsTool(),
  getProductRecommendations: getRecommendationsTool(),
  listCollections: listCollectionsTool(),
  browseCollection: browseCollectionTool(),
  addToCart: addToCartTool(),
  getCart: getCartTool(),
  updateCartItemQuantity: updateCartItemTool(),
  removeFromCart: removeFromCartTool(),
  addCartNote: addCartNoteTool(),
  navigateUser: navigateTool(),
};

export function createAgent() {
  const agent = new ToolLoopAgent({
    ...defaults,
    instructions: getSystemPrompt(),
    stopWhen: stepCountIs(10),
    tools,
  });

  return agent;
}
