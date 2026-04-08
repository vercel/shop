import { flattenEdges, type ShopifyEdges } from "@/lib/shopify/utils";
import type { Cart, CartLine, CartProduct, Image, Money } from "@/lib/types";

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

interface ShopifyCartLine {
  id: string;
  quantity: number;
  cost: {
    totalAmount: ShopifyMoney;
  };
  merchandise: {
    id: string;
    title: string;
    image?: ShopifyImage | null;
    price?: ShopifyMoney;
    selectedOptions: Array<{ name: string; value: string }>;
    product: {
      id: string;
      handle: string;
      title: string;
      description?: string;
      featuredImage: ShopifyImage | null;
    };
  };
}

interface ShopifyDeliveryGroup {
  selectedDeliveryOption: {
    title: string | null;
    estimatedCost: ShopifyMoney;
  } | null;
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  note: string | null;
  cost: {
    subtotalAmount: ShopifyMoney;
    totalAmount: ShopifyMoney;
    totalTaxAmount: ShopifyMoney | null;
  };
  lines: ShopifyEdges<ShopifyCartLine>;
  deliveryGroups?: { nodes: ShopifyDeliveryGroup[] };
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

function transformCartLine(line: ShopifyCartLine): CartLine {
  return {
    id: line.id,
    quantity: line.quantity,
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
      totalTaxAmount: cart.cost.totalTaxAmount ?? {
        amount: "0",
        currencyCode: cart.cost.totalAmount.currencyCode,
      },
    },
    lines: flattenEdges(cart.lines).map(transformCartLine),
    shippingCost: transformShippingCost(cart),
  };
}
