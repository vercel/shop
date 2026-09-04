"use client";

import { createProductComponents } from "@shopify/hydrogen/react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

import { GiftCardPurchaseForm } from "@/components/product-detail/gift-card-purchase-form";
import { ProductInfoOptions } from "@/components/product-detail/product-info";
import { ProductPrice } from "@/components/product-detail/product-price";
import {
  buildProductUrl,
  type OptionGroupState,
  type ProductFormInput,
  type ProductFormSwatch,
  type ProductFormVariant,
  variantToOptimisticInfo,
} from "@/lib/product";
import type { Image } from "@/lib/types";

const { ProductProvider, useProduct, useProductForm } = createProductComponents<ProductFormInput>();

export { useProductForm };

const ProductHandleContext = createContext<string | null>(null);

// The header price sits in the static shell above the form's Suspense boundary, so the
// resolved form publishes its selection up through this bridge instead of owning the header.
const SelectedVariantContext = createContext<{
  publish: (variant: ProductFormVariant | null) => void;
  variant: ProductFormVariant | null;
} | null>(null);

export function ProductInfoShell({ children }: { children: ReactNode }) {
  const [variant, publish] = useState<ProductFormVariant | null>(null);
  return (
    <SelectedVariantContext.Provider value={{ publish, variant }}>
      {children}
    </SelectedVariantContext.Provider>
  );
}

export function ProductForm({
  children,
  product,
}: {
  children: ReactNode;
  product: ProductFormInput;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  return (
    <ProductHandleContext.Provider value={product.handle}>
      <ProductProvider
        product={product}
        onSelect={(result) => {
          const handle = result.selectedVariant?.product.handle ?? product.handle;
          router.replace(buildProductUrl(handle, result.selectedOptions, searchParams), {
            scroll: false,
          });
        }}
      >
        <SelectedVariantPublisher />
        {children}
      </ProductProvider>
    </ProductHandleContext.Provider>
  );
}

function SelectedVariantPublisher() {
  const bridge = useContext(SelectedVariantContext);
  const { selectedVariant } = useProduct();
  useEffect(() => {
    bridge?.publish(selectedVariant);
  }, [bridge, selectedVariant]);
  return null;
}

export function useProductFormState(): {
  options: OptionGroupState[];
  selectOption: (name: string, value: string) => void;
  selectedVariant: ProductFormVariant | null;
} {
  const productHandle = useContext(ProductHandleContext);
  const { options, selectOption, selectedVariant } = useProduct();
  return {
    options: options.map((option) => ({
      name: option.name,
      values: option.values.map((value) => {
        const swatch = value.swatch as ProductFormSwatch | undefined;
        return {
          available: value.available,
          crossProduct: value.handle !== productHandle,
          exists: value.exists,
          href: buildProductUrl(value.handle, value.selectedOptions),
          image: swatch?.variantImage,
          name: value.name,
          selected: value.selected,
          swatch: swatch ? { color: swatch.color, image: swatch.image } : undefined,
        };
      }),
    })),
    selectOption,
    selectedVariant,
  };
}

export function ProductFormOptions() {
  const t = useTranslations("product");
  const { options, selectOption } = useProductFormState();
  return <ProductInfoOptions options={options} onSelectValue={selectOption} t={t} />;
}

// Renders inside ProductInfoShell, not ProductForm; the server-resolved variant wins until the form publishes.
export function ProductFormPrice({
  fallbackVariant,
  locale,
}: {
  fallbackVariant: ProductFormVariant | undefined;
  locale: string;
}) {
  const variant = useContext(SelectedVariantContext)?.variant ?? fallbackVariant;
  if (!variant) return null;
  return (
    <ProductPrice
      amount={variant.price.amount}
      currencyCode={variant.price.currencyCode}
      compareAtAmount={variant.compareAtPrice?.amount}
      locale={locale}
    />
  );
}

export function ProductFormGiftCard({
  fallbackVariant,
  featuredImage,
  handle,
  title,
}: {
  fallbackVariant: ProductFormVariant | undefined;
  featuredImage: Image | null;
  handle: string;
  title: string;
}) {
  const variant = useProductFormState().selectedVariant ?? fallbackVariant;
  if (!variant) return null;
  return (
    <GiftCardPurchaseForm
      merchandiseId={variant.id}
      productInfo={variantToOptimisticInfo(variant, { title, handle, featuredImage })}
    />
  );
}
