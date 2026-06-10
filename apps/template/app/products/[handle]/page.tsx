import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailSection } from "@/components/product-detail/product-detail-section";
import { RelatedProductsSection } from "@/components/product/related-products-section";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { getLocale } from "@/lib/params";
import { computeSelection } from "@/lib/product";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getCatalogProducts, getProduct } from "@/lib/shopify/operations/products";

const PLACEHOLDER_HANDLE = "__placeholder__";

async function buildProductMetadata(
  handle: string,
  locale: string,
  canonicalPath: string,
): Promise<Metadata> {
  const product = await getProduct({ handle, locale });
  if (!product) notFound();
  const images = product.featuredImage
    ? [
        {
          url: product.featuredImage.url,
          width: product.featuredImage.width,
          height: product.featuredImage.height,
          alt: product.featuredImage.altText,
        },
      ]
    : ["/og-default.png"];

  return {
    title: product.seo.title,
    description: product.seo.description,
    alternates: buildAlternates({
      pathname: canonicalPath,
    }),
    openGraph: buildOpenGraph({
      title: product.seo.title,
      description: product.seo.description,
      url: canonicalPath,
      type: "website",
      images,
    }),
    twitter: {
      card: "summary_large_image",
      title: product.seo.title,
      description: product.seo.description,
      images,
    },
  };
}

export async function generateStaticParams() {
  try {
    const { products } = await getCatalogProducts({ limit: 1 });
    const first = products[0];
    return [{ handle: first ? first.handle : PLACEHOLDER_HANDLE }];
  } catch {
    return [{ handle: PLACEHOLDER_HANDLE }];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  if (handle === PLACEHOLDER_HANDLE) return {};

  return buildProductMetadata(handle, locale, `/products/${handle}`);
}

export const instant = true;

export const prefetch = "allow-runtime";

export default async function ProductPage({
  params,
  searchParams,
}: PageProps<"/products/[handle]">) {
  const locale = await getLocale();
  const handlePromise = params.then(({ handle }) => {
    if (handle === PLACEHOLDER_HANDLE) notFound();
    return handle;
  });

  const productPromise = handlePromise.then(async (handle) => {
    const product = await getProduct({ handle, locale });
    if (!product) notFound();
    return product;
  });

  const variantIdPromise = searchParams.then((sp) => sp?.variant as string | undefined);

  const selectionPromise = Promise.all([productPromise, variantIdPromise]).then(
    ([product, variantId]) => computeSelection(product, variantId),
  );

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
