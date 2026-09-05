import type { Metadata } from "next";

import { ProductsGrid } from "@/components/product/products-grid";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { shopConfig } from "@/lib/config";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Home";
  const description = "Explore featured products, curated collections, and seasonal campaigns.";
  return {
    title: `${title} | ${shopConfig.site.name}`,
    description,
    alternates: buildAlternates({ pathname: "/" }),
    openGraph: buildOpenGraph({
      title,
      description,
      url: "/",
      type: "website",
    }),
  };
}

export default function HomePage() {
  return (
    <Page className="pt-0">
      <Sections>
        <section className="grid">
          <div className="col-start-1 row-start-1 hidden md:block md:aspect-4/1" />
          <div className="relative col-start-1 row-start-1 flex items-center justify-center px-5 py-10 lg:px-10">
            <div className="flex flex-col items-center text-center gap-2.5">
              <h1 className="text-3xl md:text-5xl max-w-3xl text-foreground">
                Agentic Infrastructure for Commerce
              </h1>
              <p className="text-sm md:text-base max-w-xl text-foreground">
                An agent-friendly Shopify storefront built with Next.js and Hydrogen.
              </p>
            </div>
          </div>
        </section>

        <Container>
          <ProductsGrid title="Products" limit={8} collectionUrl="/collections/all" />
        </Container>
      </Sections>
    </Page>
  );
}
