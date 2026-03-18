# Recipe: Add Shipping Estimates to Storefront

> Add pre-checkout shipping estimation UI — address picker in nav, delivery info on PDP, shipping lines in cart.

## When to read this

- You want to show shipping cost estimates before checkout
- You want customers to set a delivery address from the nav bar
- You want delivery options (e.g. "Standard — FREE") on the product detail page
- You want shipping line items in the cart overlay and full cart page

## Overview

The storefront ships without shipping estimation UI by default. This recipe adds:

1. **Nav address picker** — lets users set/change their delivery address (logged-in users pick from saved addresses; guests enter city/zip/country)
2. **PDP delivery info** — shows available shipping options and costs for the selected address
3. **PDP address footer** — displays the current delivery address on the buy section card
4. **Cart overlay shipping line** — shows "Shipping & Handling" in the overlay price breakdown
5. **Cart page shipping line** — shows shipping in the full `/cart` summary
6. **Auto-seeding** — seeds the cart with a delivery address from geo headers on first add-to-cart so Shopify can return estimates

## Prerequisites

- Shopify store with shipping zones and rates configured
- The underlying Shopify operations already exist in `lib/shopify/operations/cart.ts` (`addCartDeliveryAddress`, `updateCartDeliveryAddress`, `getCartSelectableAddressId`, `getCartDeliveryOptions`)
- The `Cart.shippingCost` field and `transformShippingCost()` already exist in `lib/types.ts` and `lib/shopify/transforms/cart.ts`

## Key files to create

| File | Role |
|------|------|
| `lib/address.ts` | `getShippingAddressInfo()` and `getBuyZoneAddress()` helpers |
| `components/layout/nav/shipping-address.tsx` | Nav address picker (server component) |
| `components/layout/nav/shipping-address-client.tsx` | Nav address picker (client component) |
| `components/layout/nav/shipping-address-fallback.tsx` | Nav address picker skeleton |
| `components/layout/nav/shipping-address-actions.ts` | `updateShippingAddressAction` server action |
| `components/product/pdp/delivery-info.tsx` | PDP shipping options display |
| `components/product/pdp/address-section.tsx` | PDP address display |

## Step-by-step

### 1. Create `lib/address.ts`

This module reads the user's shipping address from: (a) their saved addresses if logged in, (b) a cookie for guests, or (c) Vercel geo headers as a last resort.

```tsx
import { cookies, headers } from "next/headers";
import { getSession } from "@/lib/auth/server";
import { getAddresses } from "@/lib/shopify/operations/customer";
import type { Address } from "@/lib/shopify/types/customer";

export type ShippingAddressInfo = {
  city?: string;
  countryCode?: string;
  zip?: string;
};

export type BuyZoneAddress = {
  name?: string;
  formattedAddress?: string;
  isLoggedIn: boolean;
};

export async function getShippingAddressInfo(): Promise<{
  addresses: Address[];
  currentAddress: ShippingAddressInfo | null;
  isLoggedIn: boolean;
}> {
  const [session, reqHeaders, cookieStore] = await Promise.all([
    getSession(),
    headers(),
    cookies(),
  ]);

  let addresses: Address[] = [];
  let currentAddress: ShippingAddressInfo | null = null;
  const isLoggedIn = !!session;

  if (session?.accessToken) {
    addresses = await getAddresses(session.accessToken);
    const defaultAddr = addresses.find((a) => a.isDefault);
    if (defaultAddr) {
      currentAddress = {
        city: defaultAddr.city,
        countryCode: defaultAddr.countryCode,
        zip: defaultAddr.zip,
      };
    }
  } else {
    const cookieValue = cookieStore.get("shipping-address")?.value;
    if (cookieValue) {
      try {
        const parsed = JSON.parse(cookieValue);
        currentAddress = {
          city: parsed.city,
          countryCode: parsed.countryCode,
          zip: parsed.zip,
        };
      } catch {
        // Ignore malformed cookie
      }
    }

    if (!currentAddress) {
      const country = reqHeaders.get("x-vercel-ip-country");
      const rawCity = reqHeaders.get("x-vercel-ip-city");
      const rawZip = reqHeaders.get("x-vercel-ip-postal-code");

      const city = rawCity ? decodeURIComponent(rawCity) : undefined;
      const zip = rawZip ? decodeURIComponent(rawZip) : undefined;

      if (country) {
        currentAddress = {
          city,
          countryCode: decodeURIComponent(country),
          zip,
        };
      }
    }
  }

  return { addresses, currentAddress, isLoggedIn };
}

export async function getBuyZoneAddress(): Promise<BuyZoneAddress> {
  const { addresses, currentAddress, isLoggedIn } =
    await getShippingAddressInfo();

  if (isLoggedIn && addresses.length > 0) {
    const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
    const name =
      [defaultAddr.firstName, defaultAddr.lastName].filter(Boolean).join(" ") ||
      undefined;
    const formattedAddress = defaultAddr.formatted.join(", ") || undefined;
    return { name, formattedAddress, isLoggedIn };
  }

  if (currentAddress) {
    const formattedAddress =
      [currentAddress.city, currentAddress.zip, currentAddress.countryCode]
        .filter(Boolean)
        .join(", ") || undefined;
    return { name: undefined, formattedAddress, isLoggedIn };
  }

  return { name: undefined, formattedAddress: undefined, isLoggedIn };
}
```

### 2. Create nav shipping address components

**`components/layout/nav/shipping-address-actions.ts`** — server action to update the delivery address on the cart and persist it in a cookie for guests:

```tsx
"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { TAGS } from "@/lib/constants";
import {
  addCartDeliveryAddress,
  getCartSelectableAddressId,
  updateCartBuyerIdentity,
  updateCartDeliveryAddress,
} from "@/lib/shopify/operations/cart";

const COOKIE_NAME = "shipping-address";

export type ShippingAddressData = {
  city?: string;
  countryCode: string;
  zip?: string;
  customerAddressId?: string;
  cartDeliveryAddressId?: string;
};

export type ShippingAddressActionResult = {
  success: boolean;
  error?: string;
};

export async function updateShippingAddressAction(
  data: ShippingAddressData,
): Promise<ShippingAddressActionResult> {
  try {
    await updateCartBuyerIdentity("", data.countryCode);

    const existingAddressId =
      data.cartDeliveryAddressId || (await getCartSelectableAddressId());

    if (existingAddressId) {
      await updateCartDeliveryAddress(existingAddressId, {
        city: data.city,
        countryCode: data.countryCode,
        zip: data.zip,
        customerAddressId: data.customerAddressId,
      });
    } else {
      await addCartDeliveryAddress({
        city: data.city,
        countryCode: data.countryCode,
        zip: data.zip,
        customerAddressId: data.customerAddressId,
      });
    }

    if (!data.customerAddressId) {
      (await cookies()).set(
        COOKIE_NAME,
        JSON.stringify({
          city: data.city,
          countryCode: data.countryCode,
          zip: data.zip,
        }),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 365,
          path: "/",
          sameSite: "lax",
        },
      );
    }

    invalidateCartCache();

    return { success: true };
  } catch (error) {
    console.error("Update shipping address failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update shipping address",
    };
  }
}
```

**`components/layout/nav/shipping-address-fallback.tsx`**:

```tsx
import { ChevronDownIcon } from "lucide-react";

export function ShippingAddressFallback() {
  return (
    <div className="hidden lg:flex items-center text-muted-foreground">
      <span className="flex items-center gap-1.5 px-3 py-2 opacity-50">
        <span className="text-sm">—</span>
        <ChevronDownIcon className="size-3.5" />
      </span>
    </div>
  );
}
```

**`components/layout/nav/shipping-address.tsx`** — server component that fetches address data and passes it to the client:

```tsx
import { getTranslations } from "next-intl/server";
import { getShippingAddressInfo } from "@/lib/address";
import { ShippingAddressClient } from "./shipping-address-client";

export type { ShippingAddressInfo } from "@/lib/address";

export async function ShippingAddress({
  className,
}: {
  className?: string;
} = {}) {
  const [{ addresses, currentAddress, isLoggedIn }, t] = await Promise.all([
    getShippingAddressInfo(),
    getTranslations("nav"),
  ]);

  return (
    <ShippingAddressClient
      addresses={addresses}
      currentAddress={currentAddress}
      isLoggedIn={isLoggedIn}
      className={className}
      translations={{
        deliverTo: t("deliverTo"),
        shoppingAddress: t("shoppingAddress"),
        addressSubtitle: t("addressSubtitle"),
        setAddress: t("setAddress"),
        manageAddressBook: t("manageAddressBook"),
        seeAll: t("seeAll"),
        addNew: t("addNew"),
        changeAddress: t("changeAddress"),
        saveAddress: t("saveAddress"),
        city: t("city"),
        zipCode: t("zipCode"),
        country: t("country"),
      }}
    />
  );
}
```

**`components/layout/nav/shipping-address-client.tsx`** — the full client component with address picker popover. This is a larger file; see the [original source](https://github.com/vercel/enterprise-commerce-template) for the complete implementation using the `SelectPanel` UI component.

### 3. Wire into nav

**`components/layout/nav/index.tsx`** — add the address picker to the nav bar:

```diff
+import { ShippingAddress } from "./shipping-address";
+import { ShippingAddressFallback } from "./shipping-address-fallback";

 // Inside the flex container, before NavAccount:
+          <Suspense fallback={<ShippingAddressFallback />}>
+            <ShippingAddress />
+          </Suspense>
```

**`components/layout/nav/megamenu/index.tsx`** — add to mobile menu:

```diff
+import { ShippingAddress } from "../shipping-address";

-      <MegamenuMobile data={data} locale={locale} />
+      <MegamenuMobile data={data} locale={locale}>
+        <ShippingAddress className="flex items-center" />
+      </MegamenuMobile>
```

### 4. Create PDP delivery components

**`components/product/pdp/delivery-info.tsx`**:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { use } from "react";
import type { CartShippingOption } from "@/lib/shopify/operations/cart";
import { formatPrice } from "@/lib/utils";

export function DeliveryInfo({
  shippingOptionsPromise,
  locale,
}: {
  shippingOptionsPromise: Promise<CartShippingOption[]>;
  locale: string;
}) {
  const options = use(shippingOptionsPromise);
  const t = useTranslations("product");

  if (options.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {options.map((option) => (
        <p key={option.title} className="text-xs font-medium">
          <span className="text-foreground/90">{option.title}</span>
          {" \u2014 "}
          <span className="text-positive font-semibold">
            {Number.parseFloat(option.estimatedCost.amount) === 0
              ? t("freeShipping")
              : formatPrice(
                  Number.parseFloat(option.estimatedCost.amount),
                  option.estimatedCost.currencyCode,
                  locale,
                )}
          </span>
        </p>
      ))}
    </div>
  );
}
```

**`components/product/pdp/address-section.tsx`**:

```tsx
"use client";

import { useTranslations } from "next-intl";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

interface AddressSectionProps extends ComponentPropsWithoutRef<"div"> {
  name?: string;
  address?: string;
  onManageClick?: () => void;
}

export function AddressSection({
  name,
  address,
  onManageClick,
  className,
  ...props
}: AddressSectionProps) {
  const tProduct = useTranslations("product");
  const tNav = useTranslations("nav");

  return (
    <div className={cn("flex gap-3 items-start", className)} {...props}>
      <span className="size-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
      <div className="space-y-1">
        {name && <p className="text-sm font-medium text-foreground">{name}</p>}
        <p className="text-sm text-foreground">
          {address || tNav("setAddress")}
        </p>
        <button
          type="button"
          onClick={onManageClick}
          className="pt-2 text-xs font-medium text-foreground/50 hover:text-foreground/70 transition-colors"
        >
          {tProduct("manageAddressBook")}
        </button>
      </div>
    </div>
  );
}
```

### 5. Wire into PDP buy section

**`components/product/pdp/buy-section.tsx`** — fetch address and shipping options:

```diff
+import { getBuyZoneAddress } from "@/lib/address";
+import { getCartDeliveryOptions } from "@/lib/shopify/operations/cart";

-export function BuySection({ productPromise, locale }) {
-  return (
-    <Suspense fallback={<Fallback />}>
-      <BuySectionClient productPromise={productPromise} locale={locale} />
-    </Suspense>
-  );
-}
+async function BuySectionAsync({ productPromise, locale }) {
+  const address = await getBuyZoneAddress();
+  const shippingOptionsPromise = getCartDeliveryOptions();
+  return (
+    <BuySectionClient
+      productPromise={productPromise}
+      address={address}
+      shippingOptionsPromise={shippingOptionsPromise}
+      locale={locale}
+    />
+  );
+}
+
+export function BuySection({ productPromise, locale }) {
+  return (
+    <Suspense fallback={<Fallback />}>
+      <BuySectionAsync productPromise={productPromise} locale={locale} />
+    </Suspense>
+  );
+}
```

**`components/product/pdp/buy-section-client.tsx`** — add delivery info and address footer:

```diff
+import type { BuyZoneAddress } from "@/lib/address";
+import type { CartShippingOption } from "@/lib/shopify/operations/cart";
+import { AddressSection } from "./address-section";
+import { DeliveryInfo } from "./delivery-info";

 // Add to Content props:
+  address: BuyZoneAddress;
+  shippingOptionsPromise: Promise<CartShippingOption[]>;

 // After stock status heading, inside {!isOutOfStock && ...}:
+            {!isOutOfStock && (
+              <Suspense fallback={<DeliveryInfoSkeleton />}>
+                <DeliveryInfo
+                  shippingOptionsPromise={shippingOptionsPromise}
+                  locale={locale}
+                />
+              </Suspense>
+            )}

 // After </CardContent>, before </Card>:
+        <CardFooter className="border-t border-border/50 bg-muted/30 p-4">
+          <AddressSection
+            name={address.name}
+            address={address.formattedAddress}
+          />
+        </CardFooter>
```

### 6. Wire into cart overlay

**`components/cart/overlay-with-address.tsx`** — fetch address:

```diff
+import { getBuyZoneAddress } from "@/lib/address";

 export async function CartOverlayWithAddress({ locale }) {
+  const address = await getBuyZoneAddress();
-  return <CartOverlay locale={locale} />;
+  return <CartOverlay locale={locale} address={address} />;
 }
```

Then thread `address` through `overlay.tsx` → `overlay-content.tsx` → `overlay-summary.tsx`.

In **`overlay-summary.tsx`**, add the shipping line and address section:

```tsx
// In the price lines section, after Items:
<div className="flex items-center justify-between text-sm">
  <span className="text-muted-foreground">Shipping &amp; Handling</span>
  {cart.shippingCost ? (
    <Price
      amount={cart.shippingCost.amount}
      currencyCode={cart.shippingCost.currencyCode}
      locale={locale}
      className="text-foreground"
    />
  ) : (
    <span className="text-muted-foreground">Calculated at checkout</span>
  )}
</div>

// In CardFooter, before gift toggle:
{(address.name || address.formattedAddress) && (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      {address.name && (
        <p className="text-sm text-muted-foreground">{address.name}</p>
      )}
      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">
        Change
      </Button>
    </div>
    {address.formattedAddress && (
      <p className="text-xs text-muted-foreground">{address.formattedAddress}</p>
    )}
  </div>
)}
```

### 7. Wire into cart summary (full page)

**`components/cart/summary.tsx`** — add shipping line and address section:

```diff
 // After the Items price line:
+            <div className="flex justify-between text-sm">
+              <span className="text-muted-foreground">
+                {t("shippingAndHandling")}
+              </span>
+              <span>
+                {cart.shippingCost
+                  ? formatPrice(
+                      parseFloat(cart.shippingCost.amount),
+                      cart.shippingCost.currencyCode,
+                      locale,
+                    )
+                  : t("shippingCalculatedAtCheckout")}
+              </span>
+            </div>

 // In CardFooter, before the gift toggle:
+          <div className="space-y-1">
+            <h3 className="text-sm font-semibold">{t("shoppingAddress")}</h3>
+            <p className="text-xs text-muted-foreground">
+              {t("addressPlaceholder")}
+            </p>
+          </div>
```

### 8. Add auto-seeding to cart actions

**`components/cart/actions.ts`** — in `addToCartAction`, after the `addToCart` call, seed a delivery address from geo headers so Shopify can return shipping estimates:

```diff
+import { after } from "next/server";
+import { getShippingAddressInfo } from "@/lib/address";
+import {
+  addCartDeliveryAddress,
+  getCartSelectableAddressId,
+  updateCartDeliveryAddress,
+} from "@/lib/shopify/operations/cart";

 // After `const result = await addToCart(...)`, before `updateTag(TAGS.cart)`:
+    if (!result.shippingCost) {
+      after(async () => {
+        try {
+          const { currentAddress } = await getShippingAddressInfo();
+          if (currentAddress?.countryCode) {
+            const existingId = await getCartSelectableAddressId();
+            if (existingId) {
+              await updateCartDeliveryAddress(existingId, {
+                city: currentAddress.city,
+                countryCode: currentAddress.countryCode,
+                zip: currentAddress.zip,
+              });
+            } else {
+              await addCartDeliveryAddress({
+                city: currentAddress.city,
+                countryCode: currentAddress.countryCode,
+                zip: currentAddress.zip,
+              });
+            }
+            updateTag(TAGS.cart);
+          }
+        } catch {
+          // Non-critical — shipping estimate just won't show
+        }
+      });
+    }
```

## GUARDRAILS

1. **Every cart mutation MUST call `invalidateCartCache()`** — the shipping address action does this.
2. **Cookie format**: The `shipping-address` cookie stores `{ city, countryCode, zip }` as JSON. It's `httpOnly`, `secure` in production, `sameSite: "lax"`, and expires after 1 year.
3. **Geo header decoding**: Vercel geo headers (`x-vercel-ip-country`, `x-vercel-ip-city`, `x-vercel-ip-postal-code`) are URL-encoded. Always `decodeURIComponent()` them.
4. **`after()` for auto-seeding**: The delivery address seed runs via `after()` from `next/server` so it doesn't block the add-to-cart response. The estimate appears on the next render.

## See also

- [Cart Actions](../cart/cart-actions.md) — server action patterns and `updateTag` requirement
- [Caching Strategy](../architecture/caching-strategy.md) — how `cacheTag`/`updateTag` work
- [Customer API](../shopify/customer-api.md) — address CRUD for customer accounts
