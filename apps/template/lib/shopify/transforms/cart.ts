import type { CART_FRAGMENT, CART_LINE_FRAGMENT } from "@/lib/shopify/fragments";
import type { ResultOf } from "@/lib/shopify/storefront";
import type {
  AppliedGiftCard,
  Cart,
  CartLine,
  CartProduct,
  DiscountAllocation,
  DiscountCode,
  Image,
  Money,
} from "@/lib/types";

export type ShopifyCart = ResultOf<typeof CART_FRAGMENT>;
type ShopifyCartLineNode = ShopifyCart["lines"]["nodes"][number];
type ShopifyCartLine = ResultOf<typeof CART_LINE_FRAGMENT>;
type ShopifyDiscountAllocation = ShopifyCart["discountAllocations"][number];
type ShopifyAppliedGiftCard = ShopifyCart["appliedGiftCards"][number];
type ShopifyMerchandise = Extract<
  ShopifyCartLine["merchandise"],
  { __typename?: "ProductVariant" }
>;
type ShopifyImage = NonNullable<ShopifyMerchandise["image"]>;

function transformImage(image: ShopifyImage | null | undefined): Image {
  return {
    url: image?.url ?? "",
    altText: image?.altText ?? "",
    width: image?.width ?? 0,
    height: image?.height ?? 0,
  };
}

function transformCartProduct(product: ShopifyMerchandise["product"]): CartProduct {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    featuredImage: transformImage(product.featuredImage),
  };
}

function transformDiscountAllocation(
  allocation: ShopifyDiscountAllocation,
): DiscountAllocation | null {
  if (allocation.__typename === "CartCodeDiscountAllocation") {
    if (!allocation.code) return null;
    return {
      kind: "code",
      code: allocation.code,
      discountedAmount: allocation.discountedAmount,
    };
  }
  const kind = allocation.__typename === "CartAutomaticDiscountAllocation" ? "automatic" : "custom";
  return {
    kind,
    title: ("title" in allocation ? allocation.title : undefined) ?? "",
    discountedAmount: allocation.discountedAmount,
  };
}

function transformDiscountAllocations(
  allocations: ShopifyDiscountAllocation[],
): DiscountAllocation[] {
  return allocations
    .map(transformDiscountAllocation)
    .filter((a): a is DiscountAllocation => a !== null);
}

function transformDiscountCodes(codes: ShopifyCart["discountCodes"]): DiscountCode[] {
  return codes.map(({ code, applicable }) => ({ code, applicable }));
}

function transformAppliedGiftCards(cards: ShopifyAppliedGiftCard[]): AppliedGiftCard[] {
  return cards.map((c) => ({
    id: c.id,
    lastCharacters: c.lastCharacters,
    amountUsed: c.amountUsed,
    balance: c.balance,
  }));
}

// Lines are a CartLine | ComponentizableCartLine union; only CartLine carries instructions.
function transformCartLine(line: ShopifyCartLineNode): CartLine {
  // The Merchandise union has a single member today, so the narrowing never fails at runtime.
  const merchandise = line.merchandise as ShopifyMerchandise;
  const instructions = "instructions" in line ? line.instructions : undefined;
  const lineComponents = "lineComponents" in line ? line.lineComponents : undefined;
  return {
    id: line.id,
    quantity: line.quantity,
    canRemove: instructions?.canRemove ?? true,
    canUpdateQuantity: instructions?.canUpdateQuantity ?? true,
    components: lineComponents?.map(transformCartLine) ?? [],
    cost: {
      totalAmount: line.cost.totalAmount,
    },
    merchandise: {
      compareAtPrice: merchandise.compareAtPrice ?? undefined,
      id: merchandise.id,
      title: merchandise.title,
      image: merchandise.image ? transformImage(merchandise.image) : undefined,
      price: merchandise.price,
      selectedOptions: merchandise.selectedOptions,
      product: transformCartProduct(merchandise.product),
    },
    discountAllocations: transformDiscountAllocations(line.discountAllocations),
  };
}

function transformShippingCost(cart: ShopifyCart): Money | null {
  const groups = cart.deliveryGroups.nodes;
  if (!groups.length) return null;

  const selected = groups
    .map((g) => g.selectedDeliveryOption)
    .filter((opt): opt is NonNullable<typeof opt> => opt != null);

  if (selected.length === 0) return null;

  const currencyCode = selected[0].estimatedCost.currencyCode;
  const total = selected.reduce((sum, opt) => sum + parseFloat(opt.estimatedCost.amount), 0);

  return { amount: total.toString(), currencyCode };
}

export function transformShopifyCart(cart: ShopifyCart): Cart {
  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl,
    totalQuantity: cart.totalQuantity,
    note: cart.note ?? null,
    cost: {
      subtotalAmount: cart.cost.subtotalAmount,
      totalAmount: cart.cost.totalAmount,
    },
    lines: cart.lines.nodes.map(transformCartLine),
    shippingCost: transformShippingCost(cart),
    discountCodes: transformDiscountCodes(cart.discountCodes),
    discountAllocations: transformDiscountAllocations(cart.discountAllocations),
    appliedGiftCards: transformAppliedGiftCards(cart.appliedGiftCards),
  };
}
