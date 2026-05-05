import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CommandPromptContent,
  CommandPromptCopy,
  CommandPromptList,
  CommandPromptPrefix,
  CommandPromptRoot,
  CommandPromptSurface,
  CommandPromptTrigger,
  CommandPromptTriggerDivider,
  CommandPromptViewport,
} from "@/components/ui/command-prompt";
import { homeDescription, homeSubtitle, homeTitle, siteName } from "@/lib/site";
import { AgentDemo } from "./components/agent-demo";
import { AssistantDemo } from "./components/assistant-demo";
import { CartDemo } from "./components/cart-demo";
import { CenteredSection } from "./components/centered-section";
import { CTA } from "./components/cta";
import { StorefrontHero } from "@/components/storefront-hero";
import { ContentNegotiationDemo } from "./components/content-negotiation-demo";
import { Hero } from "./components/hero";
import { LogosMarquee } from "./components/logos-marquee";
import { OneTwoSection } from "./components/one-two-section";
import { ShopifyCommerce } from "./components/shopify-commerce";

const title = siteName;
const description = homeDescription;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: "/",
    siteName,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

const HomePage = () => (
  <div className="container mx-auto max-w-[1448px]">
    <Hero
      badge="Vercel Shop is now in alpha"
      description={homeSubtitle}
      title={homeTitle}
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          asChild
          className="h-12 w-fit rounded-full px-5"
          variant="secondary"
        >
          <Link href="/docs">View Documentation</Link>
        </Button>
        <Button asChild className="h-12 w-fit rounded-full px-5">
          <Link href="https://vercel.com/contact/sales" target="_blank">
            Talk to an expert
          </Link>
        </Button>
      </div>
    </Hero>
    <div className="mx-auto grid max-w-[1080px] px-6 xl:px-0">
      <CenteredSection
        aside={
          <CommandPromptRoot defaultValue="humans">
            <CommandPromptList>
              <CommandPromptTrigger className="min-w-[90px]" value="humans">
                For humans
              </CommandPromptTrigger>
              <CommandPromptTriggerDivider />
              <CommandPromptTrigger className="min-w-[84px]" value="agents">
                For agents
              </CommandPromptTrigger>
            </CommandPromptList>
            <CommandPromptSurface>
              <CommandPromptPrefix>$</CommandPromptPrefix>
              <CommandPromptViewport>
                <CommandPromptContent value="humans">
                  npx create-vercel-shop@latest
                </CommandPromptContent>
                <CommandPromptContent value="agents">
                  npx plugins add vercel/shop
                </CommandPromptContent>
              </CommandPromptViewport>
              <CommandPromptCopy />
            </CommandPromptSurface>
          </CommandPromptRoot>
        }
        description="Cache Components serve product data instantly while streaming in personalized content."
        title="Dynamic at the speed of static"
      >
        <StorefrontHero />
      </CenteredSection>
      <OneTwoSection
        description="The vercel-shop plugin and template recipes let agents extend your store with a single command. Add markets, CMS, auth, and more."
        leftClassName="xl:pt-[52px]"
        title="Agentic development"
      >
        <AgentDemo />
      </OneTwoSection>
      <OneTwoSection
        description="Built-in shopping assistant for your store powered by the AI SDK and AI Gateway."
        title="Shopping assistant"
      >
        <AssistantDemo />
      </OneTwoSection>
      <OneTwoSection
        description="Optimistic UI means the cart updates before the server responds. No spinners, no delays."
        title="Instant cart updates"
      >
        <CartDemo />
      </OneTwoSection>
      <OneTwoSection
        description="Serve structured content from your storefront to AI agents via Accept header, so agents can find, understand, and purchase your products."
        title="Content negotiation"
      >
        <ContentNegotiationDemo />
      </OneTwoSection>
      <ShopifyCommerce />
      <LogosMarquee />
      <CTA
        description="Fully customizable with AI agents. Built on Next.js."
        primary={{
          href: "https://vercel.com/contact/sales",
          label: "Talk to an Expert",
          target: "_blank",
        }}
        secondary={{ href: "/docs", label: "View Documentation" }}
        title="Start your shop today."
        className="mt-12 sm:mt-32"
      />
    </div>
  </div>
);

export default HomePage;
