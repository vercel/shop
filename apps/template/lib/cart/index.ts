import type { CartData } from "@shopify/hydrogen";

import type { Cart, CartLine, DiscountAllocation } from "@/lib/types";

// Matches Hydrogen's OPTIMISTIC_LINE_ID_PREFIX; server cart returns new lines first, so optimistic lines sort to the front.
const OPTIMISTIC_LINE_ID_PREFIX = "optimistic:";

type Money = { amount: string; currencyCode: string };

type HydrogenMerchandise = {
  compareAtPrice?: Money | null;
  id?: string;
  image?: {
    altText?: string | null;
    height?: number | null;
    url: string;
    width?: number | null;
  } | null;
  price?: Money | null;
  product?: { handle?: string; id?: string; title?: string };
  selectedOptions?: { name: string; value: string }[];
  title?: string;
};

type HydrogenLine = {
  cost: {
    amountPerQuantity?: Money | null;
    totalAmount: Money;
  };
  discountAllocations?: Array<{
    __typename:
      | "CartAutomaticDiscountAllocation"
      | "CartCodeDiscountAllocation"
      | "CartCustomDiscountAllocation";
    code?: string | null;
    discountedAmount: Money;
    title?: string | null;
  }>;
  id: string;
  instructions?: { canRemove: boolean; canUpdateQuantity: boolean } | null;
  lineComponents?: HydrogenLine[] | null;
  merchandise?: HydrogenMerchandise | null;
  quantity: number;
};

function toDomainImage(image: HydrogenMerchandise["image"]) {
  return {
    altText: image?.altText ?? "",
    height: image?.height ?? 0,
    url: image?.url ?? "",
    width: image?.width ?? 0,
  };
}

function toDomainLine(line: HydrogenLine): CartLine {
  const merchandise = line.merchandise;
  const image = merchandise?.image;
  return {
    canRemove: line.instructions?.canRemove ?? true,
    canUpdateQuantity: line.instructions?.canUpdateQuantity ?? true,
    components: (line.lineComponents ?? []).map((c) => toDomainLine(c)),
    cost: {
      totalAmount: line.cost.totalAmount,
    },
    discountAllocations: (line.discountAllocations ?? []).flatMap<DiscountAllocation>(
      (allocation) => {
        if (allocation.__typename === "CartCodeDiscountAllocation") {
          return allocation.code
            ? [
                {
                  code: allocation.code,
                  discountedAmount: allocation.discountedAmount,
                  kind: "code",
                },
              ]
            : [];
        }
        return [
          {
            discountedAmount: allocation.discountedAmount,
            kind:
              allocation.__typename === "CartAutomaticDiscountAllocation" ? "automatic" : "custom",
            title: allocation.title ?? "",
          },
        ];
      },
    ),
    id: line.id,
    merchandise: {
      ...(merchandise?.compareAtPrice ? { compareAtPrice: merchandise.compareAtPrice } : {}),
      id: merchandise?.id ?? "",
      ...(image ? { image: toDomainImage(image) } : {}),
      ...(merchandise?.price ? { price: merchandise.price } : {}),
      product: {
        featuredImage: toDomainImage(image),
        handle: merchandise?.product?.handle ?? "",
        id: merchandise?.product?.id ?? "",
        title: merchandise?.product?.title ?? "",
      },
      selectedOptions: merchandise?.selectedOptions ?? [],
      title: merchandise?.title ?? "",
    },
    quantity: line.quantity,
  };
}

// A fresh optimistic cart has no cost currency until Shopify responds; the first line's price supplies it.
function withLineCurrency(money: Money, lines: HydrogenLine[]): Money {
  if (money.currencyCode) return money;
  const currencyCode = lines[0]?.cost.totalAmount.currencyCode;
  return currencyCode ? { ...money, currencyCode } : money;
}

export function toDomainCart(data: CartData | null | undefined): Cart | null {
  if (!data) return null;
  if (data.id === null && data.totalQuantity === 0 && data.lines.nodes.length === 0) return null;
  const rawLines = data.lines.nodes as unknown as HydrogenLine[];
  return {
    appliedGiftCards: [],
    checkoutUrl: data.checkoutUrl ?? "",
    cost: {
      subtotalAmount: withLineCurrency(data.cost.subtotalAmount, rawLines),
      totalAmount: withLineCurrency(data.cost.totalAmount, rawLines),
    },
    discountAllocations: [],
    discountCodes: data.discountCodes.map((d) => ({
      applicable: d.applicable,
      code: d.code,
    })),
    id: data.id ?? undefined,
    lines: rawLines
      .map(toDomainLine)
      .sort(
        (a, b) =>
          Number(b.id?.startsWith(OPTIMISTIC_LINE_ID_PREFIX) ?? false) -
          Number(a.id?.startsWith(OPTIMISTIC_LINE_ID_PREFIX) ?? false),
      ),
    note: data.note ?? null,
    shippingCost: null,
    totalQuantity: data.totalQuantity,
  };
}

export function cartDiscountAmount(cart: Cart): number {
  // Hydrogen's cart query omits discountAllocations, so this is 0 under the Hydrogen stack.
  return (cart.discountAllocations ?? []).reduce(
    (sum, a) => sum + parseFloat(a.discountedAmount.amount),
    0,
  );
}
