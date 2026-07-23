import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContactForm } from "@/components/contact/contact-form";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { shopConfig } from "@/shop.config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");
  const title = t("title");
  const description = t("description");

  return {
    alternates: buildAlternates({ pathname: "/contact" }),
    description,
    openGraph: buildOpenGraph({
      description,
      title,
      type: "website",
      url: "/contact",
    }),
    title: `${title} | ${shopConfig.site.name}`,
  };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <Page>
      <Container>
        <Sections className="gap-5">
          <div className="grid max-w-xl gap-2.5">
            <h1 className="text-3xl sm:text-4xl md:text-5xl">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <ContactForm />
        </Sections>
      </Container>
    </Page>
  );
}
