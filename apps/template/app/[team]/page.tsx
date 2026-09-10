import type { Metadata } from "next";
import Link from "next/link";

import { ProductsGrid } from "@/components/product/products-grid";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getTeam } from "@/lib/tenant/server";

export async function generateMetadata(): Promise<Metadata> {
  const team = await getTeam();
  return {
    title: { absolute: team.name },
    description: team.description,
    alternates: buildAlternates({ pathname: "/" }),
    openGraph: {
      ...buildOpenGraph({
        title: team.name,
        description: team.description,
        url: "/",
        type: "website",
      }),
      siteName: team.name,
    },
  };
}

export default async function HomePage() {
  const team = await getTeam();
  return (
    <Page className="pt-0">
      <Sections>
        <section className="grid">
          <div className="col-start-1 row-start-1 hidden md:block md:aspect-4/1" />
          <div className="relative col-start-1 row-start-1 flex items-center justify-center px-5 py-10 lg:px-10">
            <div className="flex flex-col items-center text-center gap-2.5">
              <h1 className="text-3xl md:text-5xl max-w-3xl text-foreground">{team.heading}</h1>
              <p className="text-sm md:text-base max-w-xl text-foreground">{team.description}</p>
              <Button render={<Link href="/collections/all" />} size="lg">
                Shop apparel
              </Button>
            </div>
          </div>
        </section>

        <Container>
          <ProductsGrid
            collectionUrl="/collections/all"
            limit={8}
            query={team.apparelColor}
            title="Products"
          />
        </Container>
      </Sections>
    </Page>
  );
}
