import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { nav } from "@/lib/constants";
import { AgentDemo } from "./components/agent-demo";
import { AssistantDemo } from "./components/assistant-demo";
import { CartDemo } from "./components/cart-demo";
import { CenteredSection } from "./components/centered-section";
import { CTA } from "./components/cta";
import { FakeBrowser } from "./components/fake-browser";
import { ContentNegotiationDemo } from "./components/content-negotiation-demo";
import { Hero } from "./components/hero";
import { OneTwoSection } from "./components/one-two-section";
import { PromptCopy } from "./components/prompt-copy";

const title = "Vercel Shop";
const description =
	"Ship a production-ready Shopify storefront in days. Customize everything with AI agents. Built on Next.js.";
const starterPrompt =
	"Set up a new Vercel Shop project for me. Use `npx create-vercel-shop@latest` to scaffold it. Then follow the Vercel Shop setup docs: if I do not already have Shopify credentials, tell me to go to Shopify Settings -> Apps and sales channels -> Develop apps, install or open the Headless channel, create a storefront, and copy the Storefront API access token. Ask me for `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, and `NEXT_PUBLIC_SITE_NAME`, create `.env.local`, start the local dev server with the scaffolded package manager, and stop once it is running.";

export const metadata: Metadata = {
	title,
	description,
};

const HomePage = () => (
	<div className="container mx-auto max-w-[1114px]">
		<Hero
			badge="Vercel Shop is now in alpha"
			description={description}
			title={title}
		>
			<div className="flex w-full max-w-3xl flex-col items-center gap-4">
				<PromptCopy command="npx create-vercel-shop@latest" prompt={starterPrompt} />
				<Button asChild className="px-4" size="lg">
					<Link href="/docs/getting-started">
						Get Started
					</Link>
				</Button>
				<div className="flex items-center gap-4 text-sm text-muted-foreground">
					{nav.filter((item) => item.target === "_blank").map((item) => (
						<a key={item.href} href={item.href} className="underline underline-offset-4 hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">
							{item.label}
						</a>
					))}
				</div>
			</div>
		</Hero>
		<div className="grid divide-y border-y sm:border-x">
			<CenteredSection
				description="Using Cache Components you can instantly show static content while streaming in dynamic data."
				title="Dynamic storefronts with instant static responses"
			>
				<FakeBrowser />
			</CenteredSection>
			<OneTwoSection
				description="The vercel-shop plugin and template recipes let agents extend your store with a single command. Add markets, CMS, auth, and more."
				title="Agentic development"
				reverse
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
				reverse
			>
				<CartDemo />
			</OneTwoSection>
			<OneTwoSection
				description="Product pages serve structured markdown to LLM agents via Accept header — making your catalog AI-readable."
				title="Content negotiation"
			>
				<ContentNegotiationDemo />
			</OneTwoSection>
			<CTA cta="Get started" href="/docs" title="Start your shop today" />
		</div>
	</div>
);

export default HomePage;
