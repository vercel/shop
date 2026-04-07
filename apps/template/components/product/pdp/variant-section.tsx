"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { DEFAULT_OPTION } from "@/lib/constants";
import type { Image, ProductDetails } from "@/lib/types";

import { BuyButtons } from "./buy-buttons";
import { ColorPicker } from "./color-picker";
import { OptionPicker } from "./option-picker";
import { ProductMedia } from "./product-media";
import { ProductPrice } from "./product-price";
import {
  computeInitialSelectedOptions,
  getImagesForSelectedColor,
  getNumericShopifyId,
  resolveSelectedVariant,
} from "./variants";

interface VariantSectionProps {
  product: ProductDetails;
  locale: string;
  initialVariantId?: string;
}

export function VariantSection({ product, locale, initialVariantId }: VariantSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handle, title, featuredImage, images, videos, variants, options } = product;

  const variantId = searchParams.get("variantId") ?? initialVariantId;

  const selectedOptions = useMemo(
    () => computeInitialSelectedOptions(variants, variantId ?? undefined),
    [variants, variantId],
  );

  const selectedVariant = useMemo(
    () => resolveSelectedVariant(variants, selectedOptions),
    [variants, selectedOptions],
  );

  const filteredImages = useMemo(
    () => getImagesForSelectedColor(images, options, variants, selectedOptions),
    [images, options, variants, selectedOptions],
  );

  const isColorOption = (opt: (typeof options)[number]) =>
    opt.values.some((v) => v.swatch?.color || v.swatch?.image) ||
    opt.name.toLowerCase().includes("color");
  const isDefaultOption = (opt: { values: { name: string }[] }) =>
    opt.values.length === 1 && opt.values[0].name === DEFAULT_OPTION;

  const colorOptions = options.filter((opt) => isColorOption(opt) && !isDefaultOption(opt));
  const otherOptions = options.filter((opt) => !isColorOption(opt) && !isDefaultOption(opt));

  function handleSelectOption(optionName: string, optionValue: string) {
    const newOptions = { ...selectedOptions, [optionName]: optionValue };

    // Find the variant matching the new options
    let variant = variants.find((v) =>
      v.selectedOptions.every((opt) => newOptions[opt.name] === opt.value),
    );

    // Fall back to first variant with this option value
    if (!variant) {
      variant = variants.find((v) =>
        v.selectedOptions.some((opt) => opt.name === optionName && opt.value === optionValue),
      );
    }

    const numericId = variant ? getNumericShopifyId(variant.id) : null;
    const url = numericId
      ? `/products/${handle}?variantId=${numericId}`
      : `/products/${handle}`;

    router.replace(url, { scroll: false });
  }

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 space-y-8 lg:space-y-0">
      <ProductMedia images={filteredImages} videos={videos} title={title} />

      <div className="space-y-8">
        <div data-slot="product-info-header">
          <h1 className="font-semibold text-foreground lg:leading-[1.25] leading-tight tracking-tight text-xl lg:text-[30px]">
            {title}
          </h1>
          {selectedVariant && (
            <ProductPrice
              amount={selectedVariant.price.amount}
              currencyCode={selectedVariant.price.currencyCode}
              compareAtAmount={selectedVariant.compareAtPrice?.amount}
              locale={locale}
            />
          )}
        </div>

        {(colorOptions.length > 0 || otherOptions.length > 0) && (
          <div data-slot="product-info-options">
            <div className="space-y-8">
              {colorOptions.map((colorOption) =>
                selectedOptions[colorOption.name] ? (
                  <ColorPicker
                    key={colorOption.id}
                    option={colorOption}
                    selectedValue={selectedOptions[colorOption.name]}
                    variants={variants}
                    selectedOptions={selectedOptions}
                    onSelectOption={handleSelectOption}
                  />
                ) : null,
              )}
              {otherOptions.map((option) => (
                <OptionPicker
                  key={option.id}
                  option={option}
                  selectedValue={selectedOptions[option.name] ?? ""}
                  variants={variants}
                  selectedOptions={selectedOptions}
                  onSelectOption={handleSelectOption}
                />
              ))}
            </div>
          </div>
        )}

        <BuyButtons
          selectedVariant={selectedVariant}
          title={title}
          handle={handle}
          featuredImage={featuredImage}
          availableForSale={product.availableForSale}
        />
      </div>
    </div>
  );
}
