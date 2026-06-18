import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailSection } from "@/components/product-detail/product-detail-section";
import { RelatedProductsSection } from "@/components/product/related-products-section";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { getLocale } from "@/lib/params";
import {
  defaultSelectedOptions,
  parseSelectedOptions,
  type ProductSelection,
  type SelectedOptions,
  toSelectedOptionList,
} from "@/lib/product";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import {
  getCatalogProducts,
  getProduct,
  getProductVariant,
} from "@/lib/shopify/operations/products";

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
  // product body resolves here and renders into the static shell. The selected
  // variant is a per-selection Shopify query — skipped when no option params are
  // present (the cached default variant already covers that case).
  const selectionPromise: Promise<ProductSelection> = searchParams.then(async (sp) => {
    const fromUrl = parseSelectedOptions(product.options, sp ?? {});
    const selectedOptions: SelectedOptions = { ...defaultSelectedOptions(product), ...fromUrl };
    const selectedVariant =
      Object.keys(fromUrl).length === 0
        ? product.defaultVariant
        : await getProductVariant({
            handle,
            locale,
            selectedOptions: toSelectedOptionList(selectedOptions),
          });
    return { selectedOptions, selectedVariant };
  });

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
