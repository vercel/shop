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

export default async function ProductPage({
  params,
  searchParams,
}: PageProps<"/products/[handle]">) {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);
  if (handle === PLACEHOLDER_HANDLE) notFound();

  const product = await getProduct({ handle, locale });
  if (!product) notFound();

  // Keep searchParams unawaited so only the variant-dependent UI streams; the
  // product body resolves here and renders into the static shell.
  const selectionPromise = searchParams.then((sp) =>
    computeSelection(product, sp?.variant as string | undefined),
  );

  return (
    <Page className="pt-0">
      <Container className="bg-background">
        <Sections>
          <ProductDetailSection
            product={product}
            selectionPromise={selectionPromise}
            locale={locale}
          />
          <RelatedProductsSection handle={handle} locale={locale} />
        </Sections>
      </Container>
    </Page>
  );
}
