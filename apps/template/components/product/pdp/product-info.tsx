import type { ComponentPropsWithoutRef } from "react";

import { AboutItem } from "./about-item";

interface ProductInfoDescriptionProps extends ComponentPropsWithoutRef<"div"> {
  descriptionHtml: string;
}

export function ProductInfoDescription({
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
