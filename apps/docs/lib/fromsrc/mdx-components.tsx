import type { MDXComponents } from "mdx/types";
import { CodeBlock, H1, H2, H3, H4, H5, H6 } from "fromsrc/client";
import Link from "next/link";
import { isValidElement } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { CartBrowser } from "@/components/fake-browser/cart-browser";
import { ContentBrowser } from "@/components/fake-browser/content-browser";
import { HomeBrowser } from "@/components/fake-browser/home-browser";
import { PDPBrowser } from "@/components/fake-browser/pdp-browser";
import { PLPBrowser } from "@/components/fake-browser/plp-browser";

/**
 * Simple Cards grid container — replaces fumadocs Cards component.
 */
type PreProps = ComponentPropsWithoutRef<"pre"> & { children?: ReactNode };

function language(node: ReactNode): string {
  if (!isValidElement(node)) return "";
  const props = node.props as { className?: string };
  const value = props.className ?? "";
  const match = value.match(/language-([a-z0-9_-]+)/i);
  return match?.[1] ?? "";
}

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
        <div className="text-sm text-muted-foreground [&>p]:m-0">{children}</div>
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

  pre: ({ children, ...props }: PreProps) => (
    <CodeBlock
      lang={language(children)}
      showWrap={false}
      background="var(--color-code-bg)"
      borderColor="var(--color-code-border)"
      headerBackground="var(--color-code-header)"
    >
      <pre
        {...props}
        style={{
          margin: 0,
          padding: 0,
          background: "transparent",
          fontFamily: "var(--font-mono), ui-monospace, monospace",
        }}
      >
        {children}
      </pre>
    </CodeBlock>
  ),

  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,

  Card,
  Cards,

  // Domain-specific components
  HomeBrowser,
  PDPBrowser,
  PLPBrowser,
  CartBrowser,
  ContentBrowser,
};
