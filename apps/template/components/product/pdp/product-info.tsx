"use client";

import type { ComponentPropsWithoutRef } from "react";
import { DEFAULT_OPTION } from "@/lib/constants";
import type { ProductOption, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AboutItem } from "./about-item";
import { ColorPicker } from "./color-picker";
import { OptionPicker } from "./option-picker";
import { ProductPrice } from "./product-price";
import { usePdpVariantState } from "./variant-state";
import { getNumericShopifyId, resolveSelectedVariant } from "./variants";

interface ProductInfoHeaderProps extends ComponentPropsWithoutRef<"div"> {
  variants: ProductVariant[];
  title: string;
  locale: string;
  size?: "default" | "sm";
}

function ProductInfoHeader({
  variants,
  title,
  locale,
  size = "default",
  className,
  ...props
}: ProductInfoHeaderProps) {
  const { selectedOptions } = usePdpVariantState();
  const selectedVariant = resolveSelectedVariant(variants, selectedOptions);

  const titleSize = size === "sm" ? "text-xl" : "text-[30px]";
  return (
    <div data-slot="product-info-header" className={className} {...props}>
      <div className="space-y-4">
        <div>
          <h1
            className={cn(
              "font-semibold text-foreground lg:leading-[1.25] leading-tight tracking-tight",
              titleSize,
            )}
          >
            {title}
          </h1>
        </div>

        {selectedVariant && (
          <ProductPrice
            amount={selectedVariant.price.amount}
            currencyCode={selectedVariant.price.currencyCode}
            compareAtAmount={selectedVariant.compareAtPrice?.amount}
            locale={locale}
            size={size}
          />
        )}
      </div>
    </div>
  );
}

interface ProductInfoOptionsProps extends ComponentPropsWithoutRef<"div"> {
  variants: ProductVariant[];
  options: ProductOption[];
  size?: "default" | "sm";
}

function ProductInfoOptions({
  variants,
  options,
  size = "default",
  className,
  ...props
}: ProductInfoOptionsProps) {
  const { selectedOptions, setSelectedOptions } = usePdpVariantState();

  const updateVariantIdParam = (variantId: string) => {
    const numericId = getNumericShopifyId(variantId);
    if (!numericId) return;

    const params = new URLSearchParams(window.location.search);
    params.set("variantId", numericId);
    window.history.replaceState(null, "", `?${params.toString()}`);
  };

  const handleOptionChange = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };

    const newVariant = variants.find((v) =>
      v.selectedOptions.every((opt) => newOptions[opt.name] === opt.value),
    );

    if (!newVariant) {
      const variantWithOption = variants.find((v) =>
        v.selectedOptions.some(
          (opt) => opt.name === optionName && opt.value === value,
        ),
      );
      if (variantWithOption) {
        const updatedOptions: Record<string, string> = {};
        for (const opt of variantWithOption.selectedOptions) {
          updatedOptions[opt.name] = opt.value;
        }
        setSelectedOptions(updatedOptions);
        updateVariantIdParam(variantWithOption.id);
        return;
      }
    }

    setSelectedOptions(newOptions);
    if (newVariant) {
      updateVariantIdParam(newVariant.id);
    }
  };

  // Separate color/swatch options from other options.
  // Use swatch data (locale-agnostic) as the primary signal, falling back to
  // the English name for stores without swatches configured.
  const isColorOption = (opt: ProductOption) =>
    opt.values.some((v) => v.swatch?.color || v.swatch?.image) ||
    opt.name.toLowerCase().includes("color");
  const isDefaultOption = (opt: { values: { name: string }[] }) =>
    opt.values.length === 1 && opt.values[0].name === DEFAULT_OPTION;

  const colorOptions = options.filter(
    (opt) => isColorOption(opt) && !isDefaultOption(opt),
  );
  const otherOptions = options.filter(
    (opt) => !isColorOption(opt) && !isDefaultOption(opt),
  );

  return (
    <div data-slot="product-info-options" className={className} {...props}>
      <div className="space-y-8">
        {/* Color Pickers (with images or swatches) */}
        {colorOptions.map((colorOption) =>
          selectedOptions[colorOption.name] ? (
            <ColorPicker
              key={colorOption.id}
              option={colorOption}
              selectedValue={selectedOptions[colorOption.name]}
              variants={variants}
              onValueChange={(value) =>
                handleOptionChange(colorOption.name, value)
              }
            />
          ) : null,
        )}

        {/* Other Options (text buttons) */}
        {otherOptions.map((option) => (
          <OptionPicker
            key={option.id}
            option={option}
            selectedValue={selectedOptions[option.name] ?? ""}
            variants={variants}
            onValueChange={(value) => handleOptionChange(option.name, value)}
          />
        ))}
      </div>
    </div>
  );
}

interface ProductInfoDescriptionProps extends ComponentPropsWithoutRef<"div"> {
  descriptionHtml: string;
}

function ProductInfoDescription({
  descriptionHtml,
  className,
  ...props
}: ProductInfoDescriptionProps) {
  if (!descriptionHtml) return null;
  return (
    <div data-slot="product-info-description" className={className} {...props}>
      <AboutItem descriptionHtml={descriptionHtml} />
    </div>
  );
}

function ProductInfo({
  variants,
  options,
  title,
  descriptionHtml,
  locale,
  size = "default",
}: {
  variants: ProductVariant[];
  options: ProductOption[];
  title: string;
  descriptionHtml: string;
  locale: string;
  size?: "default" | "sm";
}) {
  return (
    <div data-slot="product-info" className="space-y-8">
      <ProductInfoHeader
        variants={variants}
        title={title}
        locale={locale}
        size={size}
      />
      <ProductInfoOptions variants={variants} options={options} size={size} />
      <ProductInfoDescription descriptionHtml={descriptionHtml} />
    </div>
  );
}

export {
  ProductInfo,
  ProductInfoHeader,
  ProductInfoOptions,
  ProductInfoDescription,
};
