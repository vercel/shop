import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description: `Learn about ${siteConfig.name}.`,
};

export default function AboutPage() {
  return (
    <Page>
      <Container className="max-w-2xl">
        <article className="prose prose-neutral prose-headings:font-semibold prose-headings:tracking-tight">
          <h1>About {siteConfig.name}</h1>
          <p>
            Welcome to {siteConfig.name}. Browse our products, explore our collections, and check
            out when you're ready. If you have questions about an order or a product, get in touch.
          </p>
          <p>
            This is placeholder copy — replace it with your own story, mission, and the details your
            customers care about.
          </p>
        </article>
      </Container>
    </Page>
  );
}
