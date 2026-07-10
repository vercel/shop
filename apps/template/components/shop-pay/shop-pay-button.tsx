"use client";

import {
  getShopPayButtonAttributes,
  getShopPayButtonStyleProperties,
  loadShopJs,
  SHOP_PAY_BUTTON_TAG_NAME,
  type ShopPayButtonOptions,
} from "@shopify/hydrogen";
import { createElement, type CSSProperties, type ReactElement, useEffect } from "react";

// Hydrogen's own `@shopify/hydrogen/react` ShopPayButton hardcodes the checkout
// origin to `window.location.origin`, which is this storefront's domain — wrong
// for a headless store. This wrapper takes the same core helpers but keeps
// `checkoutUrl` explicit so it resolves to the Shopify checkout origin.
export interface ShopPayButtonProps extends ShopPayButtonOptions {
  className?: string;
  loadScript?: boolean;
  style?: CSSProperties;
}

export function ShopPayButton({
  checkoutUrl,
  className,
  loadScript = true,
  style: wrapperStyle,
  ...options
}: ShopPayButtonProps): ReactElement | null {
  useEffect(() => {
    if (!loadScript) return;
    loadShopJs().catch((error) => {
      console.error("[shop-pay] shop-js failed to load:", error);
    });
  }, [loadScript]);

  if (!checkoutUrl) return null;

  const style = getShopPayButtonStyleProperties(options);
  const element = createElement(SHOP_PAY_BUTTON_TAG_NAME, {
    ...getShopPayButtonAttributes({ ...options, checkoutUrl }),
    ...(className ? { className } : {}),
    ...(Object.keys(style).length > 0 ? { style } : {}),
  });

  return createElement(
    "div",
    { style: { ...wrapperStyle, minHeight: wrapperStyle?.minHeight ?? "43px" } },
    element,
  );
}
