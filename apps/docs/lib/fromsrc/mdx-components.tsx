import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ReactNode } from "react";
import { CartBrowser } from "@/components/fake-browser/cart-browser";
import { ContentBrowser } from "@/components/fake-browser/content-browser";
import { HomeBrowser } from "@/components/fake-browser/home-browser";
import { PDPBrowser } from "@/components/fake-browser/pdp-browser";
import { PLPBrowser } from "@/components/fake-browser/plp-browser";
import { SkillContent } from "@/components/geistdocs/skill-content";

/**
 * Simple Cards grid container — replaces fumadocs Cards component.
 */
function Cards({ children }: { children: ReactNode }) {
  return (
    <div className="not-prose grid grid-cols-1 gap-4 sm:grid-cols-2">
      {children}
    </div>
  );
}

/**
 * Card component with children as description text.
 * Matches the pattern used in existing MDX: <Card title="..." href="...">description</Card>
 */
function Card({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children?: ReactNode;
}) {
  const content = (
    <div className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <h3 className="mb-1 font-semibold">{title}</h3>
      {children ? (
        <p className="text-sm text-muted-foreground">{children}</p>
      ) : null}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export const mdxComponents: MDXComponents = {
  a: ({
    href = "",
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (href.startsWith("/")) {
      return (
        <Link
          href={href}
          className="font-normal text-primary no-underline"
          {...props}
        />
      );
    }
    return (
      <a
        href={href}
        className="font-normal text-primary no-underline"
        {...props}
      />
    );
  },

  Card,
  Cards,

  // Domain-specific components
  HomeBrowser,
  PDPBrowser,
  PLPBrowser,
  CartBrowser,
  ContentBrowser,
  SkillContent,
};
