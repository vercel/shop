import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MarketingPageRenderer } from "@/components/cms/page-renderer";
import { Container } from "@/components/layout/container";
import { getDefaultHomepage } from "@/lib/content/homepage";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("seo");
  const title = t("homeTitle");
  const description = t("homeDescription");

  return {
    title,
    description,
    alternates: buildAlternates({ pathname: "/" }),
    openGraph: buildOpenGraph({
      title,
      description,
      url: "/",
      type: "website",
    }),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.png"],
    },
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const page = await getDefaultHomepage(locale);

  return (
    <Container>
      <MarketingPageRenderer page={page} />
    </Container>
  );
}
