"use client";

import { useState } from "react";

import type { ProductDetails } from "@/lib/types";

import { Button } from "../ui/button";
import { Price } from "./price";

type PickerProps = {
  productHandle: string;
  variants: ProductDetails["variants"];
  options: ProductDetails["options"];
  locale: string;
};

export function Picker({ productHandle: _productHandle, variants, options, locale }: PickerProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id);
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  if (!selectedVariant) return null;

  const handleVariantChange = (optionName: string, value: string) => {
    // Find variant that matches all current selections plus the new one
    const currentSelections = new Map(
      selectedVariant.selectedOptions.map((opt) => [opt.name, opt.value]),
    );
    currentSelections.set(optionName, value);

    const newVariant = variants.find((v) =>
      v.selectedOptions.every((opt) => currentSelections.get(opt.name) === opt.value),
    );

    if (newVariant) {
      setSelectedVariantId(newVariant.id);
    }
  };

  return (
    <div className="flex flex-col gap-y-4">
      {/* Price Display - Updates instantly on variant change */}
      <div className="flex items-baseline gap-3">
        <Price
          amount={selectedVariant.price.amount}
          currencyCode={selectedVariant.price.currencyCode}
          locale={locale}
        />
        {!selectedVariant.availableForSale && (
          <span className="text-sm text-destructive font-medium">Out of Stock</span>
        )}
      </div>

      {/* Variant Options */}
      {options.map((option) => {
        const currentValue = selectedVariant.selectedOptions.find(
          (opt) => opt.name === option.name,
        )?.value;

        return (
          <div key={option.id} className="space-y-3">
            <label htmlFor={option.id} className="block text-sm font-medium text-foreground">
              {option.name}
              {currentValue && (
                <span className="ml-2 text-muted-foreground font-normal">- {currentValue}</span>
              )}
            </label>

            {/* Option values as buttons */}
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const isSelected = currentValue === value.name;
                const variantWithThisOption = variants.find((v) =>
                  v.selectedOptions.some(
                    (opt) => opt.name === option.name && opt.value === value.name,
                  ),
                );
                const isAvailable = variantWithThisOption?.availableForSale;

                return (
                  <Button
                    key={value.id}
                    onClick={() => handleVariantChange(option.name, value.name)}
                    disabled={!isAvailable}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    aria-label={`Select ${option.name}: ${value.name}`}
                  >
                    {value.name}
                  </Button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Selected Variant Info */}
      <div className="text-xs text-muted-foreground">
        <p>
          SKU: <span className="font-geist-mono">{selectedVariant.id}</span>
        </p>
        <p className="mt-1">
          {selectedVariant.selectedOptions.map((opt, idx) => (
            <span key={opt.name}>
              {idx > 0 && " • "}
              {opt.name}: {opt.value}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
