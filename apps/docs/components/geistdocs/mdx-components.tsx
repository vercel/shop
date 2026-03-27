import { DynamicLink } from "fumadocs-core/dynamic-link";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import {
  Callout,
  CalloutContainer,
  CalloutDescription,
  CalloutTitle,
} from "./callout";
import { CodeBlock } from "./code-block";
import {
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
} from "./code-block-tabs";
import { CartBrowser } from "../fake-browser/cart-browser";
import { ContentBrowser } from "../fake-browser/content-browser";
import { HomeBrowser } from "../fake-browser/home-browser";
import { PDPBrowser } from "../fake-browser/pdp-browser";
import { PLPBrowser } from "../fake-browser/plp-browser";
import { Mermaid } from "./mermaid";
import { SkillContent } from "./skill-content";
import { Video } from "./video";

export const getMDXComponents = (
  components?: MDXComponents
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => ({
  ...defaultMdxComponents,

  pre: CodeBlock,

  a: ({ href, ...props }: any) =>
    href.startsWith("/") ? (
      <DynamicLink
        className="font-normal text-primary no-underline"
        href={`/[lang]${href}`}
        {...props}
      />
    ) : (
      <a
        href={href}
        {...props}
        className="font-normal text-primary no-underline"
      />
    ),

  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
  CodeBlockTab,

  TypeTable,

  Callout,
  CalloutContainer,
  CalloutTitle,
  CalloutDescription,

  Mermaid,

  SkillContent,

  Video,

  HomeBrowser,
  PDPBrowser,
  PLPBrowser,
  CartBrowser,
  ContentBrowser,

  // User components last to allow overwriting defaults
  ...components,
});
