import type { Metadata } from "next";

import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Vercel Shop — a Next.js storefront template for Shopify.",
};

export default function AboutPage() {
  return (
    <Container className="max-w-2xl">
      <article className="prose prose-neutral prose-headings:font-semibold prose-headings:tracking-tight">
        <h1>About Vercel Shop</h1>
        <p>
          Vercel Shop is a production-ready Shopify storefront built with Next.js. It connects to
          your Shopify store out of the box, giving you product pages, collections, cart
          functionality, and search — everything you need to start selling.
        </p>
        <p>
          The template is designed for agentic development. It ships with context, feedback loops,
          and skills that let coding agents understand and extend your store. Recipes describe common
          tasks — from enabling Shopify Markets to swapping your CMS — so an agent can execute them
          in a single command.
        </p>
        <p>
          Performance is a first-class concern. Pages use Server Components and streaming by default,
          the cart is fully optimistic, and collection filters update without waiting for a round-trip.
          Cache Components keep static shells instant while dynamic content streams in behind them.
        </p>
        <p>
          Every part of the codebase is yours to change. Update the layout, swap components, adjust
          the styling, or wire in a different CMS — the code is designed to be read and modified, not
          worked around.
        </p>
      </article>
    </Container>
  );
}
