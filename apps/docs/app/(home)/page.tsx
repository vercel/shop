import type { Metadata } from "next";
import Link from "next/link";
import { Installer } from "@/components/geistdocs/installer";
import { Button } from "@/components/ui/button";
import { AgentDemo } from "./components/agent-demo";
import { AssistantDemo } from "./components/assistant-demo";
import { CenteredSection } from "./components/centered-section";
import { CTA } from "./components/cta";
import { FakeBrowser } from "./components/fake-browser";
import { Hero } from "./components/hero";
import { OneTwoSection } from "./components/one-two-section";
import { TextGridSection } from "./components/text-grid-section";

const title = "Vercel Shop";
const description =
	"An agent-native, fast-by-default Shopify storefront built on Next.js. Ship features in minutes, not weeks.";

export const metadata: Metadata = {
	title,
	description,
};

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
			<div className="flex flex-col items-center gap-4">
				<div className="inline-flex items-center gap-3">
					<Button asChild className="px-4" size="lg">
						<Link href="/docs/getting-started">
							Get Started
						</Link>
					</Button>
					<Installer command="npx create-next-app@latest --example vercel/shop --example-path apps/template" />
				</div>
				<div className="inline-flex items-center gap-4">
					<a
						className="text-muted-foreground text-sm underline underline-offset-4 transition-colors hover:text-foreground"
						href="https://vercel-shop.labs.vercel.dev"
					>
						View the demo store
					</a>
					<a
						className="text-muted-foreground text-sm underline underline-offset-4 transition-colors hover:text-foreground"
						href="https://github.com/vercel/shop"
					>
						GitHub
					</a>
				</div>
			</div>
		</Hero>
		<div className="grid divide-y border-y sm:border-x">
			<OneTwoSection
				description="Skills and recipes let agents extend your store with a single command. Add markets, CMS, auth, and more."
				title="Agentic development"
			>
				<AgentDemo />
			</OneTwoSection>
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
			<CTA cta="Get started" href="/docs" title="Start your shop today" />
		</div>
	</div>
);

export default HomePage;
