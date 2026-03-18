import DynamicLink from "fumadocs-core/dynamic-link";
import type { Metadata } from "next";
import { Installer } from "@/components/geistdocs/installer";
import { Button } from "@/components/ui/button";
import { AssistantDemo } from "./components/assistant-demo";
import { CenteredSection } from "./components/centered-section";
import { CTA } from "./components/cta";
import { FakeBrowser } from "./components/fake-browser";
import { Hero } from "./components/hero";
import { OneTwoSection } from "./components/one-two-section";
import { Templates } from "./components/templates";
import { TextGridSection } from "./components/text-grid-section";

const title = "Vercel Shop";
const description =
	"Build Shopify stores using coding agents. The standard for agentic Shopify development.";

export const metadata: Metadata = {
	title,
	description,
};

const templates = [
	{
		title: "Base template",
		description: "The base template for your Shopify store.",
		link: "https://example.com/template-1",
		image: "https://placehold.co/600x400.png",
	},
	{
		title: "Shopify Markets",
		description: "Multi-locale and multi-currency support for your store",
		link: "https://example.com/template-2",
		image: "https://placehold.co/600x400.png",
	},
	{
		title: "Composable with Sanity",
		description: "Add a content layer to your store with Sanity.",
		link: "https://example.com/template-3",
		image: "https://placehold.co/600x400.png",
	},
];

const textGridSection = [
	{
		id: "1",
		title: "Agentic development first",
		description:
			"Vercel Shop contains skills and recipes for building and extending your Shopify store.",
	},
	{
		id: "2",
		title: "Lightning fast performance",
		description:
			"Instant cart updates, instant static responses with dynamic data streamed in.",
	},
	{
		id: "3",
		title: "Enterprise-grade Shopify development",
		description:
			"Vercel Shop is built for enterprise-grade Shopify development with a focus on performance, scalability, and security. Ready for composability.",
	},
];

const HomePage = () => (
	<div className="container mx-auto max-w-5xl">
		<Hero
			badge="Vercel Shop is now in beta"
			description={description}
			title={title}
		>
			<div className="mx-auto inline-flex w-fit items-center gap-3">
				<Button asChild className="px-4" size="lg">
					<DynamicLink href="/[lang]/docs/getting-started">
						Get Started
					</DynamicLink>
				</Button>
				<Installer command="npx create-next-app@latest --example vercel/shop --example-path apps/template" />
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
				description="Built-in shopping assistant for your store powered by the AI SDK and AI Gateway."
				title="Shopping assistant"
			>
				<AssistantDemo />
			</OneTwoSection>
			<TextGridSection data={textGridSection} />
			<Templates
				data={templates}
				description="See Geistdocs in action with one of our templates."
				title="Get started quickly"
			/>

			<CTA cta="Get started" href="/docs" title="Start your shop today" />
		</div>
	</div>
);

export default HomePage;
