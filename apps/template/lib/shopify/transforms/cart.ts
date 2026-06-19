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

interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

interface ShopifyDiscountAllocation {
  __typename:
    | "CartAutomaticDiscountAllocation"
    | "CartCodeDiscountAllocation"
    | "CartCustomDiscountAllocation";
  code?: string;
  discountedAmount: ShopifyMoney;
  title?: string;
}

interface ShopifyAppliedGiftCard {
  amountUsed: ShopifyMoney;
  balance: ShopifyMoney;
  id: string;
  lastCharacters: string;
}

interface ShopifyCartLine {
  cost: {
    totalAmount: ShopifyMoney;
  };
  discountAllocations: ShopifyDiscountAllocation[];
  id: string;
  // Present on CartLine (and a bundle's nested component lines), absent on the
  // ComponentizableCartLine parent — defaults to editable in the transform.
  instructions?: {
    canRemove: boolean;
    canUpdateQuantity: boolean;
  };
  // Present only on a ComponentizableCartLine (the bundle parent's contents).
  lineComponents?: ShopifyCartLine[];
  merchandise: {
    id: string;
    image?: ShopifyImage | null;
    price?: ShopifyMoney;
    product: {
      description?: string;
      featuredImage: ShopifyImage | null;
      handle: string;
      id: string;
      title: string;
    };
    selectedOptions: Array<{ name: string; value: string }>;
    title: string;
  };
  quantity: number;
}

interface ShopifyDeliveryGroup {
  selectedDeliveryOption: {
    estimatedCost: ShopifyMoney;
    title: string | null;
  } | null;
}

export interface ShopifyCart {
  appliedGiftCards: ShopifyAppliedGiftCard[];
  checkoutUrl: string;
  cost: {
    subtotalAmount: ShopifyMoney;
    totalAmount: ShopifyMoney;
  };
  deliveryGroups?: { nodes: ShopifyDeliveryGroup[] };
  discountAllocations: ShopifyDiscountAllocation[];
  discountCodes: Array<{ applicable: boolean; code: string }>;
  id: string;
  lines: { nodes: ShopifyCartLine[] };
  note: string | null;
  totalQuantity: number;
}

function transformImage(image: ShopifyImage | null): Image {
  return {
    url: image?.url ?? "",
    altText: image?.altText ?? "",
    width: image?.width ?? 0,
    height: image?.height ?? 0,
  };
}

function transformCartProduct(product: ShopifyCartLine["merchandise"]["product"]): CartProduct {
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
    title: allocation.title ?? "",
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

function transformDiscountCodes(
  codes: Array<{ applicable: boolean; code: string }>,
): DiscountCode[] {
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

function transformCartLine(line: ShopifyCartLine): CartLine {
  return {
    id: line.id,
    quantity: line.quantity,
    canRemove: line.instructions?.canRemove ?? true,
    canUpdateQuantity: line.instructions?.canUpdateQuantity ?? true,
    components: line.lineComponents?.map(transformCartLine) ?? [],
    cost: {
      totalAmount: line.cost.totalAmount,
    },
    merchandise: {
      id: line.merchandise.id,
      title: line.merchandise.title,
      image: line.merchandise.image ? transformImage(line.merchandise.image) : undefined,
      price: line.merchandise.price,
      selectedOptions: line.merchandise.selectedOptions,
      product: transformCartProduct(line.merchandise.product),
    },
    discountAllocations: transformDiscountAllocations(line.discountAllocations),
  };
}

function transformShippingCost(cart: ShopifyCart): Money | null {
  const groups = cart.deliveryGroups?.nodes;
  if (!groups?.length) return null;

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
    note: cart.note,
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
