import type * as React from "react";

import type { OptionGroupState } from "@/lib/product";

import { AboutItem } from "./about-item";
import { ColorPicker } from "./color-picker";
import { OptionPicker } from "./option-picker";

interface ProductInfoOptionsProps extends React.ComponentProps<"div"> {
  hideImages?: boolean;
  onSelectValue?: (optionName: string, value: string) => void;
  options: OptionGroupState[];
}

function ProductInfoOptions({
  hideImages,
  onSelectValue,
  options,
  className,
  ...props
}: ProductInfoOptionsProps) {
  const isColorOption = (opt: OptionGroupState) =>
    opt.values.some((v) => v.swatch?.color || v.swatch?.image) ||
    opt.name.toLowerCase().includes("color");
  // Shopify emits a synthetic Title/Default Title option for products with no variant axes — hide it.
  const isShopifyDefaultOption = (opt: OptionGroupState) =>
    opt.name === "Title" && opt.values.length === 1 && opt.values[0]?.name === "Default Title";
  const isSingleValueOption = (opt: OptionGroupState) => opt.values.length === 1;
  const renderable = options.filter((opt) => !isShopifyDefaultOption(opt));
  const singleValueOptions = renderable.filter(isSingleValueOption);
  const colorOptions = renderable.filter((opt) => !isSingleValueOption(opt) && isColorOption(opt));
  const otherOptions = renderable.filter((opt) => !isSingleValueOption(opt) && !isColorOption(opt));
  if (singleValueOptions.length === 0 && colorOptions.length === 0 && otherOptions.length === 0)
    return null;
  return (
    <div data-slot="product-info-options" className={className} {...props}>
      <div className="grid gap-5">
        {singleValueOptions.map((option) => (
          <p key={option.name} className="text-sm font-medium text-foreground/70">
            {option.name}: <span className="text-foreground">{option.values[0]?.name}</span>
          </p>
        ))}

        {colorOptions.map((option) => (
          <ColorPicker
            key={option.name}
            hideImages={hideImages}
            onSelectValue={onSelectValue}
            option={option}
          />
        ))}

        {otherOptions.map((option) => (
          <OptionPicker key={option.name} onSelectValue={onSelectValue} option={option} />
        ))}
      </div>
    </div>
  );
}

interface ProductInfoDescriptionProps extends React.ComponentProps<"div"> {
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

export { ProductInfoDescription, ProductInfoOptions };
