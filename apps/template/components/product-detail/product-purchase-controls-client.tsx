"use client";

import { createProductComponents } from "@shopify/hydrogen/react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { ProductInfoOptions } from "@/components/product-detail/product-info";
import { ProductPrice } from "@/components/product-detail/product-price";
import type { Locale } from "@/lib/i18n";
import type { SelectedOptions } from "@/lib/product";
import type { ProductDetails, ProductVariant } from "@/lib/types";

import { BuyButtons } from "./buy-buttons";

interface ProductFormProduct {
  adjacentVariants: ProductVariant[];
  encodedVariantAvailability?: string;
  encodedVariantExistence?: string;
  handle: string;
  id: string;
  options: Array<{
    name: string;
    optionValues: Array<{
      firstSelectableVariant?: ProductVariant;
      name: string;
      swatch?: ProductDetails["options"][number]["values"][number]["swatch"];
    }>;
  }>;
  selectedOrFirstAvailableVariant: ProductVariant | null;
  title: string;
}

const { ProductProvider, useProduct } = createProductComponents<ProductFormProduct>();

interface ProductPurchaseControlsProps {
  buyWithShop: boolean;
  locale: Locale;
  product: ProductDetails;
  quantityPicker: boolean;
  selectedVariant: ProductVariant | undefined;
}

export function ProductPurchaseControls({
  buyWithShop,
  locale,
  product,
  quantityPicker,
  selectedVariant,
}: ProductPurchaseControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productFormProduct = useMemo(
    (): ProductFormProduct => ({
      adjacentVariants: product.adjacentVariants,
      encodedVariantAvailability: product.encodedVariantAvailability,
      encodedVariantExistence: product.encodedVariantExistence,
      handle: product.handle,
      id: product.id,
      options: product.options.map((option) => ({
        name: option.name,
        optionValues: option.values.map((value) => ({
          firstSelectableVariant: value.firstSelectableVariant,
          name: value.name,
          swatch: value.swatch,
        })),
      })),
      selectedOrFirstAvailableVariant: selectedVariant ?? null,
      title: product.title,
    }),
    [product, selectedVariant],
  );

  return (
    <ProductProvider
      product={productFormProduct}
      onSelect={(result) => {
        const next = new URLSearchParams(searchParams);
        for (const option of product.options) next.delete(option.name.toLowerCase());
        for (const option of result.selectedOptions) {
          next.set(option.name.toLowerCase(), option.value);
        }
        const query = next.toString();
        router.replace(`/products/${product.handle}${query ? `?${query}` : ""}`, {
          scroll: false,
        });
      }}
    >
      <ProductPurchaseControlsContent
        buyWithShop={buyWithShop}
        locale={locale}
        product={product}
        quantityPicker={quantityPicker}
      />
    </ProductProvider>
  );
}

function ProductPurchaseControlsContent({
  buyWithShop,
  locale,
  product,
  quantityPicker,
}: Omit<ProductPurchaseControlsProps, "selectedVariant">) {
  const { options, selectedVariant, selectOption } = useProduct();
  const t = useTranslations("product");
  const selectedOptions: SelectedOptions = Object.fromEntries(
    options.flatMap((option) =>
      option.values.filter((value) => value.selected).map((value) => [option.name, value.name]),
    ),
  );
  const availableValues = new Map(
    options.map((option) => [
      option.name,
      new Set(option.values.filter((value) => value.available).map((value) => value.name)),
    ]),
  );
  const existingValues = new Map(
    options.map((option) => [
      option.name,
      new Set(option.values.filter((value) => value.exists).map((value) => value.name)),
    ]),
  );

  return (
    <>
      <div data-slot="product-info-header">
        <h1 className="text-foreground text-3xl">{product.title}</h1>
        {selectedVariant ? (
          <ProductPrice
            amount={selectedVariant.price.amount}
            currencyCode={selectedVariant.price.currencyCode}
            compareAtAmount={selectedVariant.compareAtPrice?.amount}
            locale={locale}
          />
        ) : (
          <div className="h-7" aria-hidden />
        )}
      </div>
      <ProductInfoOptions
        availableValues={availableValues}
        existingValues={existingValues}
        handle={product.handle}
        onOptionSelect={selectOption}
        options={product.options}
        selectedOptions={selectedOptions}
        t={t}
      />
      <BuyButtons
        selectedVariant={
          selectedVariant
            ? {
                availableForSale: selectedVariant.availableForSale,
                id: selectedVariant.id,
                image: selectedVariant.image,
                price: selectedVariant.price,
                requiresBundleConfiguration:
                  selectedVariant.requiresComponents && selectedVariant.components.length === 0,
                selectedOptions: selectedVariant.selectedOptions,
                title: selectedVariant.title,
              }
            : undefined
        }
        title={product.title}
        handle={product.handle}
        featuredImage={product.featuredImage}
        availableForSale={product.availableForSale}
        buyWithShop={buyWithShop}
        quantityPicker={quantityPicker}
      />
    </>
  );
}
