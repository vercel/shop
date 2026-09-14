"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { ProductInfoOptions } from "@/components/product-detail/product-info";
import { ProductPrice } from "@/components/product-detail/product-price";
import { buildProductUrl } from "@/lib/product";
import { ProductProvider, useProduct } from "@/lib/product/client";
import type {
  OptionGroupState,
  ProductFormInput,
  ProductFormSwatch,
  ProductFormVariant,
} from "@/lib/product/types";

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
    <ProductProvider
      product={product}
      onSelect={(result) => {
        const handle = result.selectedVariant?.product.handle ?? product.handle;
        router.replace(buildProductUrl(handle, result.selectedOptions, searchParams), {
          scroll: false,
        });
      }}
    >
      {children}
    </ProductProvider>
  );
}

interface ProductFormOptionsProps {
  handle: string;
}

export function ProductFormOptions({ handle }: ProductFormOptionsProps) {
  const t = useTranslations("product");
  const { options, selectOption } = useProduct();
  const optionGroups: OptionGroupState[] = options.map((option) => ({
    name: option.name,
    values: option.values.map((value) => {
      const swatch = value.swatch as ProductFormSwatch | undefined;
      return {
        available: value.available,
        crossProduct: value.handle !== handle,
        exists: value.exists,
        href: buildProductUrl(value.handle, value.selectedOptions),
        image: swatch?.variantImage,
        name: value.name,
        selected: value.selected,
        swatch: swatch ? { color: swatch.color, image: swatch.image } : undefined,
      };
    }),
  }));
  return <ProductInfoOptions options={optionGroups} onSelectValue={selectOption} t={t} />;
}

// Renders inside ProductInfoShell, not ProductForm; the server-resolved variant wins until the form publishes.
export function ProductFormPrice({
  fallbackVariant,
  locale,
}: {
  fallbackVariant: Pick<ProductFormVariant, "compareAtPrice" | "price"> | undefined;
  locale: string;
}) {
  const { selectedVariant } = useProduct();
  const variant = selectedVariant ?? fallbackVariant;
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
