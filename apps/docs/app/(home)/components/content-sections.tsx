import Link from "next/link";
import { Installer } from "@/components/geistdocs/installer";
import { Button } from "@/components/ui/button";

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-h-[60vh] flex flex-col justify-center py-24 ${className}`}>
      {children}
    </section>
  );
}

export function ContentSections() {
  return (
    <div className="w-1/2 max-w-2xl px-8 md:px-16 font-mono text-[14px] leading-relaxed">
      {/* Hero */}
      <Section className="min-h-[80vh]">
        <span className="mb-6 inline-block w-fit rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          Vercel Shop is now in alpha
        </span>
        <h1
          className="text-4xl font-bold tracking-tight md:text-5xl"
          style={{
            fontFamily:
              "var(--font-geist-pixel-grid), ui-monospace, monospace",
          }}
        >
          Vercel Shop
        </h1>
        <p className="mt-4 text-muted-foreground">
          An agent-native, fast-by-default Shopify storefront built on Next.js.
          Ship features in minutes, not weeks.
        </p>
        <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg">
            <Link href="/docs/getting-started">Get Started</Link>
          </Button>
          <Installer command="npx create-next-app@latest --example vercel/shop --example-path apps/template" />
        </div>
      </Section>

      {/* Agentic development */}
      <Section>
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{
            fontFamily:
              "var(--font-geist-pixel-grid), ui-monospace, monospace",
          }}
        >
          Agentic development
        </h2>
        <p className="mt-4 text-muted-foreground">
          Skills and recipes let agents extend your store with a single command.
          Add markets, CMS, auth, and more.
        </p>
        <p className="mt-4 text-muted-foreground">
          Vercel Shop contains skills and recipes for building and extending your
          Shopify store. Each skill is a self-contained package that an agent can
          execute to wire up a new capability.
        </p>
      </Section>

      {/* Performance */}
      <Section>
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{
            fontFamily:
              "var(--font-geist-pixel-grid), ui-monospace, monospace",
          }}
        >
          Instant static responses
        </h2>
        <p className="mt-4 text-muted-foreground">
          Using Cache Components you can instantly show static content while
          streaming in dynamic data. Instant cart updates, instant static
          responses with dynamic data streamed in.
        </p>
      </Section>

      {/* Shopping assistant */}
      <Section>
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{
            fontFamily:
              "var(--font-geist-pixel-grid), ui-monospace, monospace",
          }}
        >
          Shopping assistant
        </h2>
        <p className="mt-4 text-muted-foreground">
          Built-in shopping assistant for your store powered by the AI SDK and AI
          Gateway. Search products, browse collections, manage the cart, and
          check out — all through natural conversation.
        </p>
      </Section>

      {/* Features */}
      <Section>
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{
            fontFamily:
              "var(--font-geist-pixel-grid), ui-monospace, monospace",
          }}
        >
          Built for scale
        </h2>
        <ul className="mt-6 space-y-4 text-muted-foreground">
          <li>
            <span className="text-foreground font-medium">
              Agentic development first
            </span>{" "}
            — Skills and recipes for building and extending your Shopify store.
          </li>
          <li>
            <span className="text-foreground font-medium">
              Lightning fast performance
            </span>{" "}
            — Instant cart updates, instant static responses with dynamic data
            streamed in.
          </li>
          <li>
            <span className="text-foreground font-medium">
              Enterprise-grade
            </span>{" "}
            — Built for enterprise Shopify development with a focus on
            performance, scalability, and security.
          </li>
        </ul>
      </Section>

      {/* CTA */}
      <Section>
        <h2
          className="text-3xl font-bold tracking-tight md:text-4xl"
          style={{
            fontFamily:
              "var(--font-geist-pixel-grid), ui-monospace, monospace",
          }}
        >
          Start your shop today
        </h2>
        <div className="mt-6">
          <Button asChild size="lg">
            <Link href="/docs">Get started</Link>
          </Button>
        </div>
      </Section>
    </div>
  );
}
