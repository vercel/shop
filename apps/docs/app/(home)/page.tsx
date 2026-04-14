import type { Metadata } from "next";
import Link from "next/link";
import { Installer } from "@/components/fromsrc/installer";
import { Button } from "@/components/ui/button";
import { nav } from "@/lib/constants";
import { homeDescription, siteName } from "@/lib/site";
import { AgentDemo } from "./components/agent-demo";
import { AssistantDemo } from "./components/assistant-demo";
import { CartDemo } from "./components/cart-demo";
import { CenteredSection } from "./components/centered-section";
import { CTA } from "./components/cta";
import { FakeBrowser } from "./components/fake-browser";
import { ContentNegotiationDemo } from "./components/content-negotiation-demo";
import { Hero } from "./components/hero";
import { PromptCopy } from "./components/prompt-copy";
import { OneTwoSection } from "./components/one-two-section";

const title = siteName;
const description = homeDescription;
const agentCommand = "npx plugins add vercel/shop";

export const metadata: Metadata = {
	title,
	description,
	openGraph: {
		title,
		description,
		type: "website",
		url: "/",
		siteName,
		images: [
			{
				url: "/opengraph-image",
				width: 1200,
				height: 628,
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title,
		description,
		images: ["/opengraph-image"],
	},
};

const HomePage = () => (
	<div className="container mx-auto max-w-[1114px]">
		<Hero
			badge="Vercel Shop is now in alpha"
			description={description}
			title={title}
		>
			<div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
				<PromptCopy agentCommand={agentCommand} command="npx create-vercel-shop@latest" />
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
				description={
					<>
						<p>
							The vercel-shop plugin and template recipes let agents extend your
							store with a single command. Add markets, CMS, auth, and more.
						</p>
						<div className="mt-4 max-w-[22rem]">
							<Installer
								className="w-full"
								command="npx create-vercel-shop@latest --no-template"
							/>
						</div>
					</>
				}
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
				description="Product, collection, and search pages serve structured markdown to LLM agents via Accept header — making your storefront AI-readable."
				title="Content negotiation"
			>
				<ContentNegotiationDemo />
			</OneTwoSection>
			<CTA cta="Get started" href="/docs" title="Start your shop today" />
		</div>
	</div>
);

export default HomePage;
