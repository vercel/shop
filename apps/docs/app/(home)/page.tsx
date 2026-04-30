import type { Metadata } from "next";
import Link from "next/link";
import { Installer } from "@/components/fromsrc/installer";
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
import { FakeBrowser } from "./components/fake-browser";
import { ContentNegotiationDemo } from "./components/content-negotiation-demo";
import { Hero } from "./components/hero";
import { OneTwoSection } from "./components/one-two-section";

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
	<div className="container mx-auto max-w-[1448px]">
		<Hero
			badge="Vercel Shop is now in alpha"
			description={homeSubtitle}
			title={homeTitle}
		>
			<div className="flex flex-wrap items-center justify-center gap-3">
				<Button
					asChild
					className="h-12 w-fit rounded-full border border-gray-alpha-400 bg-background-100 text-foreground shadow-none hover:bg-background-200 dark:border-gray-alpha-400 dark:bg-background-100 dark:hover:bg-background-200"
					variant="outline"
				>
					<Link href="/docs">View Documentation</Link>
				</Button>
				<Button asChild className="h-12 w-fit rounded-full">
					<Link href="https://vercel.com/contact/sales" target="_blank">
						Talk to an expert
					</Link>
				</Button>
			</div>
		</Hero>
		<div className="mx-auto grid max-w-[1078px]">
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
