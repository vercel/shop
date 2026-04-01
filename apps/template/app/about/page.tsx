import type { Metadata } from "next";

import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Vercel Shop, a Next.js storefront template.",
};

export default function AboutPage() {
  return (
    <Container className="max-w-2xl">
      <article className="prose prose-neutral prose-headings:font-semibold prose-headings:tracking-tight">
        <h1>About Vercel Shop</h1>
        <p>
          Vercel Shop is a Next.js storefront template. You get product pages,
          collections, a cart, and search out of the box. Connect your commerce backend and you're selling.
        </p>
        <p>
          The template is built for agents. It includes context files, structured skills, and
          recipes that describe common tasks so a coding agent can pick them up and run. Enable
          your commerce backend, swap your CMS, add customer accounts: each one is a single command.
        </p>
        <p>
          Pages render on the server and stream by default. The cart is optimistic. Collection
          filters update instantly, without a round-trip. Static shells are cached and dynamic
          content streams in behind them.
        </p>
        <p>
          The code is yours. Change the layout, pull out components, restyle things, wire in a
          different CMS. It's written to be read and modified, not worked around.
        </p>
      </article>
    </Container>
  );
}
