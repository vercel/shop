import { RelatedProductsSection } from "@/components/product/related-products-section";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import type { Locale } from "@/lib/i18n";
import type { ProductSelection } from "@/lib/product";
import type { ProductDetails } from "@/lib/types";

import { ProductDetailSection } from "./product-detail-section";

export function ProductDetailPage({
  handlePromise,
  productPromise,
  selectionPromise,
  locale,
}: {
  handlePromise: Promise<string>;
  productPromise: Promise<ProductDetails>;
  selectionPromise: Promise<ProductSelection>;
  locale: Locale;
}) {
  return (
    <Page className="pt-0">
      <Container className="bg-background">
        <Sections>
          <ProductDetailSection
            productPromise={productPromise}
            selectionPromise={selectionPromise}
            locale={locale}
          />
          <RelatedProductsSection handle={handlePromise} locale={locale} />
        </Sections>
      </Container>
    </Page>
  );
}
