import { createMdxComponents } from "@vercel/geistdocs/mdx";
import { Card, Cards } from "fumadocs-ui/components/card";
import type { MDXComponents } from "mdx/types";

import { CartBrowser } from "@/components/fake-browser/cart-browser";
import { ContentBrowser } from "@/components/fake-browser/content-browser";
import { HomeBrowser } from "@/components/fake-browser/home-browser";
import { PDPBrowser } from "@/components/fake-browser/pdp-browser";
import { PLPBrowser } from "@/components/fake-browser/plp-browser";

export const getMDXComponents = (components?: MDXComponents): MDXComponents =>
  createMdxComponents({
    Card,
    Cards,
    // Domain-specific components used in docs content
    HomeBrowser,
    PDPBrowser,
    PLPBrowser,
    CartBrowser,
    ContentBrowser,
    ...components,
  });
