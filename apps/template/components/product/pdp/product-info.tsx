import type { ComponentPropsWithoutRef } from "react";

import { DEFAULT_OPTION } from "@/lib/constants";
import type { ProductOption, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

import { AboutItem } from "./about-item";
import { ColorPicker } from "./color-picker";
import { OptionPicker } from "./option-picker";
import { ProductPrice } from "./product-price";
import type { SelectedOptions } from "./variants";

interface ProductInfoHeaderProps extends ComponentPropsWithoutRef<"div"> {
  selectedVariant: ProductVariant | undefined;
  title: string;
  locale: string;
  size?: "default" | "sm";
}

function ProductInfoHeader({
  selectedVariant,
  title,
  locale,
  size = "default",
  className,
  ...props
}: ProductInfoHeaderProps) {
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
  selectedOptions: SelectedOptions;
  handle: string;
  size?: "default" | "sm";
}

function ProductInfoOptions({
  variants,
  options,
  selectedOptions,
  handle,
  size = "default",
  className,
  ...props
}: ProductInfoOptionsProps) {
  // Separate color/swatch options from other options.
  const isColorOption = (opt: ProductOption) =>
    opt.values.some((v) => v.swatch?.color || v.swatch?.image) ||
    opt.name.toLowerCase().includes("color");
  const isDefaultOption = (opt: { values: { name: string }[] }) =>
    opt.values.length === 1 && opt.values[0].name === DEFAULT_OPTION;

  const colorOptions = options.filter((opt) => isColorOption(opt) && !isDefaultOption(opt));
  const otherOptions = options.filter((opt) => !isColorOption(opt) && !isDefaultOption(opt));

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
              handle={handle}
              selectedOptions={selectedOptions}
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
            handle={handle}
            selectedOptions={selectedOptions}
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
  selectedVariant,
  selectedOptions,
  handle,
  title,
  descriptionHtml,
  locale,
  size = "default",
}: {
  variants: ProductVariant[];
  options: ProductOption[];
  selectedVariant: ProductVariant | undefined;
  selectedOptions: SelectedOptions;
  handle: string;
  title: string;
  descriptionHtml: string;
  locale: string;
  size?: "default" | "sm";
}) {
  return (
    <div data-slot="product-info" className="space-y-8">
      <ProductInfoHeader
        selectedVariant={selectedVariant}
        title={title}
        locale={locale}
        size={size}
      />
      <ProductInfoOptions
        variants={variants}
        options={options}
        selectedOptions={selectedOptions}
        handle={handle}
        size={size}
      />
      <ProductInfoDescription descriptionHtml={descriptionHtml} />
    </div>
  );
}

export { ProductInfo, ProductInfoHeader, ProductInfoOptions, ProductInfoDescription };
